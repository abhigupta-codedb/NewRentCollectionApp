import {
  doc,
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDoc,
  writeBatch,
  runTransaction,
  Unsubscribe,
  QueryDocumentSnapshot,
  DocumentData,
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
import { getMonthsCount } from './storage';

export interface PaginatedResult<T> {
  data: T[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export const cloudStorageService = {
  /**
   * Initializes or fetches owner document settings.
   * If new user, creates their initial profile with default configuration and seeded data.
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

      // Seed starter tenants and payments with pre-computed summary fields
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
   * Realtime subscription to owner tenants.
   * Tenants include cached summary fields (totalPaid, outstandingBalance, lastPaymentDate).
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
   * Safe migration helper for legacy tenant documents without summary fields.
   * Calculates and saves summary fields in a batch write without blocking or crashing.
   */
  async ensureTenantSummaries(ownerId: string, tenants: Tenant[]): Promise<void> {
    const needsSync = tenants.filter(
      (t) => typeof t.totalPaid !== 'number' || typeof t.outstandingBalance !== 'number'
    );
    if (needsSync.length === 0) return;

    try {
      const batch = writeBatch(db);
      const now = new Date();
      for (const t of needsSync) {
        const activeMonths = getMonthsCount(t.leaseStart, now);
        const totalAccrued = activeMonths * t.rentAmount;
        const totalPaid = t.totalPaid ?? 0;
        const outstandingBalance = t.outstandingBalance ?? Math.max(0, totalAccrued - totalPaid);

        const ref = doc(db, 'owners', ownerId, 'tenants', t.id);
        batch.update(ref, {
          totalPaid,
          outstandingBalance,
          summaryUpdatedAt: new Date().toISOString(),
        });
      }
      await batch.commit();
    } catch (err) {
      console.warn('Silent tenant summary sync fallback:', err);
    }
  },

  /**
   * Realtime subscription to the most recent payments (cursor-based pagination entry).
   * Does NOT fetch the entire historical payments collection.
   */
  subscribeToRecentPayments(
    ownerId: string,
    pageSize: number = 50,
    onData: (
      payments: Payment[],
      lastDoc: QueryDocumentSnapshot<DocumentData> | null,
      hasMore: boolean
    ) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/payments`;
    const q = query(
      collection(db, 'owners', ownerId, 'payments'),
      orderBy('date', 'desc'),
      limit(pageSize)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const payments: Payment[] = [];
        snapshot.forEach((d) => {
          payments.push(d.data() as Payment);
        });

        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        const hasMore = snapshot.docs.length === pageSize;
        onData(payments, lastDoc, hasMore);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  /**
   * Cursor-based pagination to fetch older payments on demand.
   * Uses startAfter(lastDoc) to avoid offset-based scans.
   */
  async loadMorePayments(
    ownerId: string,
    lastDoc: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = 50
  ): Promise<PaginatedResult<Payment>> {
    const path = `owners/${ownerId}/payments`;
    try {
      const q = query(
        collection(db, 'owners', ownerId, 'payments'),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const data: Payment[] = [];
      snapshot.forEach((d) => {
        data.push(d.data() as Payment);
      });

      const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        data,
        lastDoc: newLastDoc,
        hasMore,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { data: [], lastDoc: null, hasMore: false };
    }
  },

  /**
   * Realtime subscription to recent reminder logs (cursor-based pagination entry).
   * Avoids scanning the complete reminder history on startup.
   */
  subscribeToRecentReminders(
    ownerId: string,
    pageSize: number = 50,
    onData: (
      logs: ReminderLog[],
      lastDoc: QueryDocumentSnapshot<DocumentData> | null,
      hasMore: boolean
    ) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/reminders`;
    const q = query(
      collection(db, 'owners', ownerId, 'reminders'),
      orderBy('sentAt', 'desc'),
      limit(pageSize)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const logs: ReminderLog[] = [];
        snapshot.forEach((d) => {
          logs.push(d.data() as ReminderLog);
        });

        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        const hasMore = snapshot.docs.length === pageSize;
        onData(logs, lastDoc, hasMore);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  /**
   * Cursor-based pagination to fetch older reminder logs on demand.
   */
  async loadMoreReminders(
    ownerId: string,
    lastDoc: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = 50
  ): Promise<PaginatedResult<ReminderLog>> {
    const path = `owners/${ownerId}/reminders`;
    try {
      const q = query(
        collection(db, 'owners', ownerId, 'reminders'),
        orderBy('sentAt', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const data: ReminderLog[] = [];
      snapshot.forEach((d) => {
        data.push(d.data() as ReminderLog);
      });

      const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        data,
        lastDoc: newLastDoc,
        hasMore,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { data: [], lastDoc: null, hasMore: false };
    }
  },

  /**
   * Queries Firestore only for a specific tenant's payment history.
   * Indexed query using where("tenantId", "==", tenantId) + orderBy("date", "desc").
   * Does NOT download or filter all global payments in JavaScript.
   */
  subscribeToTenantPayments(
    ownerId: string,
    tenantId: string,
    pageSize: number = 20,
    onData: (
      payments: Payment[],
      lastDoc: QueryDocumentSnapshot<DocumentData> | null,
      hasMore: boolean
    ) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/payments (tenantId=${tenantId})`;
    const q = query(
      collection(db, 'owners', ownerId, 'payments'),
      where('tenantId', '==', tenantId),
      orderBy('date', 'desc'),
      limit(pageSize)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const payments: Payment[] = [];
        snapshot.forEach((d) => {
          payments.push(d.data() as Payment);
        });

        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        const hasMore = snapshot.docs.length === pageSize;
        onData(payments, lastDoc, hasMore);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, path);
      }
    );
  },

  /**
   * Cursor-based pagination for tenant-specific payment history.
   */
  async loadMoreTenantPayments(
    ownerId: string,
    tenantId: string,
    lastDoc: QueryDocumentSnapshot<DocumentData>,
    pageSize: number = 20
  ): Promise<PaginatedResult<Payment>> {
    const path = `owners/${ownerId}/payments (tenantId=${tenantId})`;
    try {
      const q = query(
        collection(db, 'owners', ownerId, 'payments'),
        where('tenantId', '==', tenantId),
        orderBy('date', 'desc'),
        startAfter(lastDoc),
        limit(pageSize)
      );

      const snapshot = await getDocs(q);
      const data: Payment[] = [];
      snapshot.forEach((d) => {
        data.push(d.data() as Payment);
      });

      const newLastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
      const hasMore = snapshot.docs.length === pageSize;

      return {
        data,
        lastDoc: newLastDoc,
        hasMore,
      };
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
      return { data: [], lastDoc: null, hasMore: false };
    }
  },

  /**
   * Queries Firestore for a specific tenant's reminder logs.
   * Indexed query using where("tenantId", "==", tenantId) + orderBy("sentAt", "desc").
   */
  subscribeToTenantReminders(
    ownerId: string,
    tenantId: string,
    pageSize: number = 20,
    onData: (
      reminders: ReminderLog[],
      lastDoc: QueryDocumentSnapshot<DocumentData> | null,
      hasMore: boolean
    ) => void
  ): Unsubscribe {
    const path = `owners/${ownerId}/reminders (tenantId=${tenantId})`;
    const q = query(
      collection(db, 'owners', ownerId, 'reminders'),
      where('tenantId', '==', tenantId),
      orderBy('sentAt', 'desc'),
      limit(pageSize)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const reminders: ReminderLog[] = [];
        snapshot.forEach((d) => {
          reminders.push(d.data() as ReminderLog);
        });

        const lastDoc = snapshot.docs.length > 0 ? snapshot.docs[snapshot.docs.length - 1] : null;
        const hasMore = snapshot.docs.length === pageSize;
        onData(reminders, lastDoc, hasMore);
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
   * Add or update a tenant. Initializes summary fields if not set.
   */
  async saveTenant(ownerId: string, tenant: Tenant): Promise<void> {
    const path = `owners/${ownerId}/tenants/${tenant.id}`;
    try {
      const docRef = doc(db, 'owners', ownerId, 'tenants', tenant.id);
      const totalPaid = tenant.totalPaid ?? 0;
      const activeMonths = getMonthsCount(tenant.leaseStart, new Date());
      const totalAccrued = activeMonths * tenant.rentAmount;
      const outstandingBalance = tenant.outstandingBalance ?? Math.max(0, totalAccrued - totalPaid);

      const toSave: Tenant = {
        ...tenant,
        ownerId,
        totalPaid,
        outstandingBalance,
        summaryUpdatedAt: tenant.summaryUpdatedAt || new Date().toISOString(),
      };
      await setDoc(docRef, toSave, { merge: true });
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
   * Records a payment using a Firestore atomic transaction:
   * 1. Creates the payment document in /owners/{ownerId}/payments/{paymentId}
   * 2. Atomically updates the summary fields (totalPaid, outstandingBalance, lastPaymentDate, etc.)
   *    on the parent tenant document in /owners/{ownerId}/tenants/{tenantId}.
   */
  async savePayment(ownerId: string, payment: Payment): Promise<void> {
    const path = `owners/${ownerId}/payments/${payment.id}`;
    try {
      await runTransaction(db, async (transaction) => {
        const tenantRef = doc(db, 'owners', ownerId, 'tenants', payment.tenantId);
        const paymentRef = doc(db, 'owners', ownerId, 'payments', payment.id);

        const tenantSnap = await transaction.get(tenantRef);
        if (tenantSnap.exists()) {
          const tenantData = tenantSnap.data() as Tenant;
          const currentTotalPaid = Number(tenantData.totalPaid ?? 0);
          const newTotalPaid = currentTotalPaid + payment.amount;

          const activeMonths = getMonthsCount(tenantData.leaseStart, new Date());
          const totalAccrued = activeMonths * tenantData.rentAmount;
          const newOutstanding = totalAccrued - newTotalPaid;

          transaction.update(tenantRef, {
            totalPaid: newTotalPaid,
            outstandingBalance: newOutstanding,
            lastPaymentDate: payment.date,
            lastPaymentAmount: payment.amount,
            lastPaymentReceiptNumber: payment.receiptNumber,
            summaryUpdatedAt: new Date().toISOString(),
          });
        }

        transaction.set(paymentRef, { ...payment, ownerId });
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
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
