import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import {
  Tenant,
  Payment,
  PropertyOwnerSettings,
  ReminderLog,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_PAYMENTS,
  INITIAL_REMINDER_LOGS,
  DEFAULT_SETTINGS,
} from '../data/seedData';

export const cloudStorageService = {
  /**
   * Initializes or fetches owner document settings.
   * If new user, creates their initial profile with default configuration.
   */
  async initializeOwnerProfile(
    ownerId: string,
    displayName?: string | null,
    email?: string | null
  ): Promise<PropertyOwnerSettings> {
    const ownerDocRef = doc(db, 'owners', ownerId);
    const path = `owners/${ownerId}`;
    try {
      const snap = await getDoc(ownerDocRef);
      if (snap.exists()) {
        return snap.data() as PropertyOwnerSettings;
      }

      // First time initialization for this landlord/property owner
      const initialSettings: PropertyOwnerSettings = {
        ...DEFAULT_SETTINGS,
        ownerName: displayName || email?.split('@')[0] || 'Property Owner',
        businessName: displayName ? `${displayName}'s Properties` : 'Rental Properties LLC',
        email: email || DEFAULT_SETTINGS.email,
      };

      await setDoc(ownerDocRef, initialSettings);

      // Seed starter tenants and payments so the owner can immediately test features
      const batch = writeBatch(db);

      INITIAL_TENANTS.forEach((tenant) => {
        const tenantRef = doc(db, `owners/${ownerId}/tenants`, tenant.id);
        batch.set(tenantRef, { ...tenant, ownerId });
      });

      INITIAL_PAYMENTS.forEach((payment) => {
        const paymentRef = doc(db, `owners/${ownerId}/payments`, payment.id);
        batch.set(paymentRef, { ...payment, ownerId });
      });

      INITIAL_REMINDER_LOGS.forEach((reminder) => {
        const reminderRef = doc(db, `owners/${ownerId}/reminders`, reminder.id);
        batch.set(reminderRef, { ...reminder, ownerId });
      });

      await batch.commit();
      return initialSettings;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Realtime subscription to owner settings
   */
  subscribeToSettings(
    ownerId: string,
    onData: (settings: PropertyOwnerSettings) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}`;
    const docRef = doc(db, 'owners', ownerId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onData(snapshot.data() as PropertyOwnerSettings);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  /**
   * Realtime subscription to owner tenants
   */
  subscribeToTenants(
    ownerId: string,
    onData: (tenants: Tenant[]) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/tenants`;
    const colRef = collection(db, 'owners', ownerId, 'tenants');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const tenants: Tenant[] = [];
        snapshot.forEach((d) => {
          tenants.push(d.data() as Tenant);
        });
        // Sort by creation date descending
        tenants.sort(
          (a, b) =>
            new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
        );
        onData(tenants);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  /**
   * Realtime subscription to owner payments
   */
  subscribeToPayments(
    ownerId: string,
    onData: (payments: Payment[]) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/payments`;
    const colRef = collection(db, 'owners', ownerId, 'payments');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const payments: Payment[] = [];
        snapshot.forEach((d) => {
          payments.push(d.data() as Payment);
        });
        payments.sort(
          (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
        );
        onData(payments);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  /**
   * Realtime subscription to owner reminders
   */
  subscribeToReminders(
    ownerId: string,
    onData: (logs: ReminderLog[]) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/reminders`;
    const colRef = collection(db, 'owners', ownerId, 'reminders');

    return onSnapshot(
      colRef,
      (snapshot) => {
        const reminders: ReminderLog[] = [];
        snapshot.forEach((d) => {
          reminders.push(d.data() as ReminderLog);
        });
        reminders.sort(
          (a, b) =>
            new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime()
        );
        onData(reminders);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  /**
   * Save / update owner settings
   */
  async saveSettings(ownerId: string, settings: PropertyOwnerSettings): Promise<void> {
    const path = `owners/${ownerId}`;
    try {
      const docRef = doc(db, 'owners', ownerId);
      await setDoc(docRef, settings, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  /**
   * Add or update a tenant
   */
  async saveTenant(ownerId: string, tenant: Tenant): Promise<void> {
    const path = `owners/${ownerId}/tenants/${tenant.id}`;
    try {
      const docRef = doc(db, 'owners', ownerId, 'tenants', tenant.id);
      await setDoc(docRef, { ...tenant, ownerId });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  /**
   * Delete a tenant
   */
  async deleteTenant(ownerId: string, tenantId: string): Promise<void> {
    const path = `owners/${ownerId}/tenants/${tenantId}`;
    try {
      const docRef = doc(db, 'owners', ownerId, 'tenants', tenantId);
      await deleteDoc(docRef);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  /**
   * Record a payment
   */
  async savePayment(ownerId: string, payment: Payment): Promise<void> {
    const path = `owners/${ownerId}/payments/${payment.id}`;
    try {
      const docRef = doc(db, 'owners', ownerId, 'payments', payment.id);
      await setDoc(docRef, { ...payment, ownerId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Log an automated or manual reminder
   */
  async saveReminderLog(ownerId: string, log: ReminderLog): Promise<void> {
    const path = `owners/${ownerId}/reminders/${log.id}`;
    try {
      const docRef = doc(db, 'owners', ownerId, 'reminders', log.id);
      await setDoc(docRef, { ...log, ownerId });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  /**
   * Batch log reminders
   */
  async batchSaveReminderLogs(ownerId: string, logs: ReminderLog[]): Promise<void> {
    const path = `owners/${ownerId}/reminders`;
    try {
      const batch = writeBatch(db);
      logs.forEach((log) => {
        const ref = doc(db, 'owners', ownerId, 'reminders', log.id);
        batch.set(ref, { ...log, ownerId });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },
};
