import { Tenant, Payment, PropertyOwnerSettings, ReminderLog } from '../types';

export const DEFAULT_SETTINGS: PropertyOwnerSettings = {
  ownerName: 'Punita Gupta',
  businessName: 'Ramswaroop Gupta Properties & Niwas',
  phone: '+91 8960327505',
  email: 'punita.gupta.rentals@gmail.com',
  address: '209 Chandra Nagar Peeranpur Fatehpur, UP 212601',
  currencySymbol: '₹',
  landlordPan: 'ABCDE1234F',
  bankDetails: {
    accountName: 'Rajesh Kumar Gupta',
    bankName: 'State Bank of India',
    accountNumber: '30987654321',
    routingOrIfsc: 'SBIN0001234',
    upiId: '9810123456@sbi',
    upiNumber: '9810123456',
  },
  reminderSettings: {
    autoEnabled: true,
    daysBeforeDue: 3,
    sendOnDueDate: true,
    daysAfterDue: 2,
    whatsappTemplate: `Namaste {tenant_name} ji! 🙏\n\nYeh {business_name} ki taraf se monthly reminder hai. Aapka is mahine ka kiraya {amount} ({unit}) tareekh {due_date} tak due hai.\n\n*Kul Bakaya (Total Outstanding): {outstanding}*\n\nKripya UPI ya Bank se payment transfer karein:\n👉 UPI ID: {upi_id}\n👉 Bank: {bank_name} | A/C: {account_number} | IFSC: {routing_or_ifsc}\n\nPayment karne ke baad UTR number ya screenshot zaroor share karein taaki turant Kiraya Rashid (Receipt) generate ho sake.\n\nDhanyawad,\n{owner_name} (मकान मालिक)`,
    emailSubjectTemplate: `Kiraya Payment Reminder - {unit} ({due_date})`,
    emailBodyTemplate: `Namaste {tenant_name} ji,\n\nWe hope you are having a comfortable stay at {unit}.\n\nYeh ek automated reminder hai ki aapka is mahine ka kiraya {amount} tareekh {due_date} ko scheduled hai.\n\nKul Bakaya (Total Outstanding): {outstanding}\n\nPayment Options (UPI & Bank Transfer):\n- UPI ID: {upi_id}\n- Bank Name: {bank_name}\n- Account Name: {account_name}\n- Account Number: {account_number}\n- IFSC Code: {routing_or_ifsc}\n\nPayment transfer ke baad kripya transaction reference share karein. Valid Income Tax HRA Kiraya Rashid (PDF Receipt) turant issue ki jayegi.\n\nShubhkamnayein,\n{owner_name}\n{business_name}\nContact: {owner_phone}`,
  },
};

export const INITIAL_TENANTS: Tenant[] = [
  
];

export const INITIAL_PAYMENTS: Payment[] = [
  
];

export const INITIAL_REMINDER_LOGS: ReminderLog[] = [
];
