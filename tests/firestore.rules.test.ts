import { describe, it, beforeAll, afterAll, beforeEach, expect } from 'vitest';
import {
  initializeTestEnvironment,
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

describe('Firestore Security Rules - Pilot Safety & Isolation', () => {
  let testEnv: RulesTestEnvironment;

  const PROJECT_ID = 'pilot-safety-test-project';
  const PILOT_EMAIL = 'approved.pilot@example.com';
  const PILOT_UID = 'user-pilot-123';

  const OTHER_PILOT_EMAIL = 'other.pilot@example.com';
  const OTHER_PILOT_UID = 'user-pilot-456';

  const UNAPPROVED_EMAIL = 'unapproved.user@example.com';
  const UNAPPROVED_UID = 'user-stranger-789';

  beforeAll(async () => {
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules,
        host: '127.0.0.1',
        port: 8080,
      },
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    await testEnv.clearFirestore();

    // Seed the allowlist via admin context
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await db.collection('pilotUsers').doc(PILOT_EMAIL.toLowerCase()).set({
        email: PILOT_EMAIL,
        enabled: true,
        role: 'landlord',
      });
      await db.collection('pilotUsers').doc(OTHER_PILOT_EMAIL.toLowerCase()).set({
        email: OTHER_PILOT_EMAIL,
        enabled: true,
        role: 'landlord',
      });
      await db.collection('pilotUsers').doc('disabled.pilot@example.com').set({
        email: 'disabled.pilot@example.com',
        enabled: false,
        role: 'landlord',
      });
    });
  });

  describe('Unauthenticated Access', () => {
    it('should reject unauthenticated read on owner records', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthedDb.collection('owners').doc(PILOT_UID).get());
    });

    it('should reject unauthenticated read on tenants collection', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(
        unauthedDb.collection('owners').doc(PILOT_UID).collection('tenants').doc('tenant-1').get()
      );
    });

    it('should reject unauthenticated read on pilotUsers allowlist', async () => {
      const unauthedDb = testEnv.unauthenticatedContext().firestore();
      await assertFails(unauthedDb.collection('pilotUsers').doc(PILOT_EMAIL).get());
    });
  });

  describe('Non-Pilot Users (Authenticated but not in allowlist)', () => {
    it('should reject non-pilot user from creating owner record', async () => {
      const strangerDb = testEnv
        .authenticatedContext(UNAPPROVED_UID, { email: UNAPPROVED_EMAIL })
        .firestore();

      await assertFails(
        strangerDb.collection('owners').doc(UNAPPROVED_UID).set({
          ownerName: 'Stranger Landlord',
          businessName: 'Stranger Properties',
          currencySymbol: '₹',
        })
      );
    });

    it('should reject non-pilot user from reading any owner record', async () => {
      const strangerDb = testEnv
        .authenticatedContext(UNAPPROVED_UID, { email: UNAPPROVED_EMAIL })
        .firestore();

      await assertFails(strangerDb.collection('owners').doc(PILOT_UID).get());
      await assertFails(strangerDb.collection('owners').doc(UNAPPROVED_UID).get());
    });

    it('should reject disabled pilot user from reading or writing owner records', async () => {
      const disabledDb = testEnv
        .authenticatedContext('disabled-uid', { email: 'disabled.pilot@example.com' })
        .firestore();

      await assertFails(
        disabledDb.collection('owners').doc('disabled-uid').set({
          ownerName: 'Disabled User',
          businessName: 'Disabled Properties',
          currencySymbol: '₹',
        })
      );
    });
  });

  describe('Approved Pilot Users', () => {
    it('should allow approved pilot user to write and read their own owner record', async () => {
      const pilotDb = testEnv
        .authenticatedContext(PILOT_UID, { email: PILOT_EMAIL })
        .firestore();

      await assertSucceeds(
        pilotDb.collection('owners').doc(PILOT_UID).set({
          ownerName: 'Abhishek Gupta',
          businessName: 'Gupta Residency',
          currencySymbol: '₹',
        })
      );

      await assertSucceeds(pilotDb.collection('owners').doc(PILOT_UID).get());
    });

    it('should allow approved pilot user to create tenants in their subcollection', async () => {
      const pilotDb = testEnv
        .authenticatedContext(PILOT_UID, { email: PILOT_EMAIL })
        .firestore();

      await assertSucceeds(
        pilotDb
          .collection('owners')
          .doc(PILOT_UID)
          .collection('tenants')
          .doc('tenant-1')
          .set({
            id: 'tenant-1',
            ownerId: PILOT_UID,
            name: 'Rahul Sharma',
            phone: '+91 98765 43210',
            unit: 'Flat 101',
            rentAmount: 12000,
            dueDay: 5,
            status: 'active',
            documents: [],
          })
      );
    });

    it('should allow approved pilot user to record payments in their subcollection', async () => {
      const pilotDb = testEnv
        .authenticatedContext(PILOT_UID, { email: PILOT_EMAIL })
        .firestore();

      await assertSucceeds(
        pilotDb
          .collection('owners')
          .doc(PILOT_UID)
          .collection('payments')
          .doc('pay-1')
          .set({
            id: 'pay-1',
            ownerId: PILOT_UID,
            tenantId: 'tenant-1',
            tenantName: 'Rahul Sharma',
            receiptNumber: 'REC-2026-001',
            amount: 12000,
            paymentMethod: 'UPI',
            status: 'completed',
          })
      );
    });

    it('should allow approved pilot user to log reminders in their subcollection with status queued', async () => {
      const pilotDb = testEnv
        .authenticatedContext(PILOT_UID, { email: PILOT_EMAIL })
        .firestore();

      await assertSucceeds(
        pilotDb
          .collection('owners')
          .doc(PILOT_UID)
          .collection('reminders')
          .doc('rem-1')
          .set({
            id: 'rem-1',
            ownerId: PILOT_UID,
            tenantId: 'tenant-1',
            channel: 'whatsapp',
            status: 'queued',
            message: 'Namaste Rahul ji, kiraya due hai.',
          })
      );
    });

    it('should prevent an approved pilot user from reading or modifying another landlord records', async () => {
      const pilotDb1 = testEnv
        .authenticatedContext(PILOT_UID, { email: PILOT_EMAIL })
        .firestore();

      // Pilot 1 cannot read Pilot 2 owner record
      await assertFails(pilotDb1.collection('owners').doc(OTHER_PILOT_UID).get());

      // Pilot 1 cannot write to Pilot 2 subcollections
      await assertFails(
        pilotDb1
          .collection('owners')
          .doc(OTHER_PILOT_UID)
          .collection('tenants')
          .doc('tenant-other')
          .set({
            id: 'tenant-other',
            ownerId: OTHER_PILOT_UID,
            name: 'Sneha Verma',
            phone: '+91 99999 88888',
            unit: 'Flat 202',
            rentAmount: 15000,
            dueDay: 1,
            status: 'active',
            documents: [],
          })
      );
    });

    it('should allow pilot users to check only their own allowlist entry and reject modifying it', async () => {
      const pilotDb = testEnv
        .authenticatedContext(PILOT_UID, { email: PILOT_EMAIL })
        .firestore();

      // Can get their own entry
      await assertSucceeds(
        pilotDb.collection('pilotUsers').doc(PILOT_EMAIL.toLowerCase()).get()
      );

      // Cannot get someone else's entry
      await assertFails(
        pilotDb.collection('pilotUsers').doc(OTHER_PILOT_EMAIL.toLowerCase()).get()
      );

      // Cannot write to pilotUsers
      await assertFails(
        pilotDb.collection('pilotUsers').doc(PILOT_EMAIL.toLowerCase()).update({
          role: 'admin',
        })
      );
    });
  });
});
