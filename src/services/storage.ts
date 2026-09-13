import {
  Tenant,
  Payment,
  PropertyOwnerSettings,
  ReminderLog,
  TenantBalanceInfo,
} from '../types';
import {
  INITIAL_TENANTS,
  INITIAL_PAYMENTS,
  INITIAL_REMINDER_LOGS,
  DEFAULT_SETTINGS,
} from '../data/seedData';

const STORAGE_KEYS = {
  TENANTS: 'rent_tracker_tenants_v1',
  PAYMENTS: 'rent_tracker_payments_v1',
  SETTINGS: 'rent_tracker_settings_v1',
  REMINDERS: 'rent_tracker_reminders_v1',
};

export const storageService = {
  getTenants(): Tenant[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TENANTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(INITIAL_TENANTS));
        return INITIAL_TENANTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load tenants from storage', e);
      return INITIAL_TENANTS;
    }
  },

  saveTenants(tenants: Tenant[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(tenants));
    } catch (e) {
      console.error('Failed to save tenants', e);
    }
  },

  getPayments(): Payment[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PAYMENTS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
        return INITIAL_PAYMENTS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load payments from storage', e);
      return INITIAL_PAYMENTS;
    }
  },

  savePayments(payments: Payment[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(payments));
    } catch (e) {
      console.error('Failed to save payments', e);
    }
  },

  getSettings(): PropertyOwnerSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
        return DEFAULT_SETTINGS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load settings', e);
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings: PropertyOwnerSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  },

  getReminderLogs(): ReminderLog[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.REMINDERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDER_LOGS));
        return INITIAL_REMINDER_LOGS;
      }
      return JSON.parse(data);
    } catch (e) {
      console.error('Failed to load reminders', e);
      return INITIAL_REMINDER_LOGS;
    }
  },

  saveReminderLogs(logs: ReminderLog[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save reminders', e);
    }
  },

  resetToDemo(): void {
    localStorage.setItem(STORAGE_KEYS.TENANTS, JSON.stringify(INITIAL_TENANTS));
    localStorage.setItem(STORAGE_KEYS.PAYMENTS, JSON.stringify(INITIAL_PAYMENTS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    localStorage.setItem(STORAGE_KEYS.REMINDERS, JSON.stringify(INITIAL_REMINDER_LOGS));
  },
};

/**
 * Calculates months between two dates (inclusive of start month up to current target month)
 */
export function getMonthsCount(startDateStr: string, targetDate: Date = new Date()): number {
  const start = new Date(startDateStr);
  if (isNaN(start.getTime())) return 1;
  const startYear = start.getFullYear();
  const startMonth = start.getMonth();

  const targetYear = targetDate.getFullYear();
  const targetMonth = targetDate.getMonth();

  const diffYears = targetYear - startYear;
  const diffMonths = targetMonth - startMonth + diffYears * 12;

  return Math.max(1, diffMonths + 1);
}

/**
 * Calculates current month status, outstanding balance, and payment history for a tenant
 * Uses cached summary fields on the tenant document when available, with safe fallback to payments.
 */
export function calculateTenantBalance(
  tenant: Tenant,
  payments?: Payment[],
  now: Date = new Date()
): TenantBalanceInfo {
  const activeMonths = getMonthsCount(tenant.leaseStart, now);
  const totalAccruedRent = activeMonths * tenant.rentAmount;

  // 1. Determine totalPaid and outstandingBalance
  const hasCachedSummary =
    typeof tenant.totalPaid === 'number' && typeof tenant.outstandingBalance === 'number';

  const tenantPayments = payments ? payments.filter((p) => p.tenantId === tenant.id) : [];

  let totalPaid: number;
  let outstandingBalance: number;

  if (hasCachedSummary) {
    totalPaid = tenant.totalPaid!;
    // Calculate outstanding dynamically based on current accrued months - totalPaid
    // to correctly reflect advancing calendar months
    outstandingBalance = totalAccruedRent - totalPaid;
  } else if (tenantPayments.length > 0) {
    totalPaid = tenantPayments.reduce((acc, p) => acc + p.amount, 0);
    outstandingBalance = totalAccruedRent - totalPaid;
  } else {
    // Safe default when no payments loaded yet and legacy tenant
    totalPaid = tenant.totalPaid ?? 0;
    outstandingBalance = tenant.outstandingBalance ?? (totalAccruedRent - totalPaid);
  }

  // Determine current month's due date
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const clampedDueDay = Math.min(tenant.dueDay, 28);
  const currentDueDate = new Date(currentYear, currentMonth, clampedDueDay);

  // Check if current month is paid for
  const currentMonthName = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  const paidThisMonth = tenantPayments.filter(
    (p) =>
      p.monthCovered.toLowerCase() === currentMonthName.toLowerCase() ||
      (new Date(p.date).getMonth() === currentMonth &&
        new Date(p.date).getFullYear() === currentYear)
  );

  let currentMonthPaidAmount = paidThisMonth.reduce((sum, p) => sum + p.amount, 0);

  // If no matching payments in loaded array, check cached lastPaymentDate
  if (currentMonthPaidAmount === 0 && tenant.lastPaymentDate) {
    const lastDate = new Date(tenant.lastPaymentDate);
    if (
      !isNaN(lastDate.getTime()) &&
      lastDate.getMonth() === currentMonth &&
      lastDate.getFullYear() === currentYear
    ) {
      currentMonthPaidAmount = tenant.lastPaymentAmount ?? tenant.rentAmount;
    }
  }

  // Time diff calculation
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfDue = new Date(currentYear, currentMonth, clampedDueDay).getTime();
  const msPerDay = 1000 * 60 * 60 * 24;
  const daysDiff = Math.round((startOfDue - startOfToday) / msPerDay);

  let currentMonthStatus: 'paid' | 'due_soon' | 'due_today' | 'overdue' | 'advance' = 'due_soon';

  if (outstandingBalance <= -tenant.rentAmount * 0.1) {
    currentMonthStatus = 'advance';
  } else if (currentMonthPaidAmount >= tenant.rentAmount || outstandingBalance <= 0) {
    currentMonthStatus = 'paid';
  } else if (daysDiff === 0) {
    currentMonthStatus = 'due_today';
  } else if (daysDiff < 0) {
    currentMonthStatus = 'overdue';
  } else if (daysDiff <= 5) {
    currentMonthStatus = 'due_soon';
  } else {
    currentMonthStatus = 'due_soon';
  }

  // Find last payment
  let lastPayment: Payment | undefined;
  if (tenantPayments.length > 0) {
    const sortedPayments = [...tenantPayments].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    lastPayment = sortedPayments[0];
  } else if (tenant.lastPaymentDate) {
    lastPayment = {
      id: `summary-pay-${tenant.id}`,
      receiptNumber: tenant.lastPaymentReceiptNumber || 'REC-SUMMARY',
      tenantId: tenant.id,
      tenantName: tenant.name,
      unit: tenant.unit,
      amount: tenant.lastPaymentAmount || 0,
      date: tenant.lastPaymentDate,
      monthCovered: currentMonthName,
      paymentMethod: 'UPI',
      referenceId: 'SYNCED-RECORD',
      status: 'completed',
      receivedBy: 'Property Owner',
      createdAt: tenant.lastPaymentDate,
    };
  }

  const dueIsoDate = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(
    clampedDueDay
  ).padStart(2, '0')}`;

  return {
    tenant,
    totalAccruedRent,
    totalPaid,
    outstandingBalance,
    currentMonthStatus,
    currentMonthDueDate: dueIsoDate,
    daysDiff,
    lastPayment,
  };
}
