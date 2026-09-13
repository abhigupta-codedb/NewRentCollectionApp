export interface LeaseDocument {
  id: string;
  name: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  documentType: 'Rent Agreement' | 'ID Proof' | 'Police Verification' | 'Addendum' | 'Other';
  dataUrl?: string; // base64 or object url
  notes?: string;
}

export type PropertyType = 'Flat' | 'Duplex' | 'Shop' | 'Godown';

export const PROPERTY_TYPES: PropertyType[] = ['Flat', 'Duplex', 'Shop', 'Godown'];

export interface Tenant {
  id: string;
  ownerId?: string;
  name: string;
  phone: string; // Mobile number (e.g. +1... or +91...)
  email: string;
  propertyType?: PropertyType; // Flat, Duplex, Shop, Godown
  unit: string; // e.g. "Flat 302", "Shop 4B", "Godown #2"
  rentAmount: number;
  securityDeposit: number;
  dueDay: number; // 1 - 31 (e.g. 1st or 5th of every month)
  leaseStart: string; // YYYY-MM-DD
  leaseEnd: string; // YYYY-MM-DD
  status: 'active' | 'notice' | 'vacated';
  documents: LeaseDocument[];
  notes?: string;
  createdAt: string;

  // Scalability summary / aggregate fields (maintained on tenant doc)
  totalPaid?: number;
  outstandingBalance?: number;
  lastPaymentDate?: string;
  lastPaymentAmount?: number;
  lastPaymentReceiptNumber?: string;
  summaryUpdatedAt?: string;
}

export interface Payment {
  id: string;
  ownerId?: string;
  receiptNumber: string; // e.g. "REC-2026-0081"
  tenantId: string;
  tenantName: string;
  unit: string;
  amount: number;
  date: string; // YYYY-MM-DD
  monthCovered: string; // e.g. "September 2026"
  paymentMethod: 'Bank Transfer' | 'UPI' | 'Credit Card' | 'Cash' | 'Cheque';
  referenceId: string; // Transaction reference or cheque number
  status: 'completed' | 'pending' | 'failed';
  receivedBy: string;
  notes?: string;
  createdAt: string;
}

export interface ReminderLog {
  id: string;
  ownerId?: string;
  tenantId: string;
  tenantName: string;
  unit: string;
  channel: 'whatsapp' | 'email';
  recipientContact: string; // phone or email
  message: string;
  subject?: string;
  sentAt: string;
  status: 'sent' | 'queued' | 'failed';
  isAutomated: boolean;
  dueDate: string;
  amountDue: number;
}

export interface PropertyOwnerSettings {
  ownerName: string;
  businessName: string;
  phone: string;
  email: string;
  address: string;
  currencySymbol: string; // e.g. '₹'
  landlordPan?: string; // Landlord PAN for Indian HRA tax claims
  bankDetails: {
    accountName: string;
    bankName: string;
    accountNumber: string;
    routingOrIfsc: string; // IFSC Code (e.g. SBIN0001234)
    upiId: string; // UPI VPA (e.g. 98101XXXXX@upi, name@okhdfcbank)
    upiNumber?: string; // 10-digit mobile UPI or merchant number
  };
  reminderSettings: {
    autoEnabled: boolean;
    daysBeforeDue: number; // e.g. 3 days before
    sendOnDueDate: boolean;
    daysAfterDue: number; // e.g. 2 days after (overdue reminder)
    whatsappTemplate: string;
    emailSubjectTemplate: string;
    emailBodyTemplate: string;
  };
}

export interface TenantBalanceInfo {
  tenant: Tenant;
  totalAccruedRent: number;
  totalPaid: number;
  outstandingBalance: number;
  currentMonthStatus: 'paid' | 'due_soon' | 'due_today' | 'overdue' | 'advance';
  currentMonthDueDate: string;
  daysDiff: number; // positive = days until due, negative = days overdue
  lastPayment?: Payment;
}
