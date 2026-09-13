import { Tenant, PropertyOwnerSettings, ReminderLog, TenantBalanceInfo } from '../types';

/**
 * Replaces dynamic placeholders in reminder message templates
 */
export function formatReminderTemplate(
  template: string,
  tenant: Tenant,
  balanceInfo: TenantBalanceInfo,
  settings: PropertyOwnerSettings
): string {
  const currency = settings.currencySymbol || '$';
  const dueDateObj = new Date(balanceInfo.currentMonthDueDate);
  const formattedDueDate = isNaN(dueDateObj.getTime())
    ? balanceInfo.currentMonthDueDate
    : dueDateObj.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });

  const dueAmountStr = `${currency}${tenant.rentAmount.toLocaleString()}`;
  const outstandingStr =
    balanceInfo.outstandingBalance > 0
      ? `${currency}${balanceInfo.outstandingBalance.toLocaleString()}`
      : `${currency}0.00`;

  return template
    .replace(/\{tenant_name\}/g, tenant.name)
    .replace(/\{unit\}/g, tenant.unit)
    .replace(/\{property_type\}/g, tenant.propertyType || 'Flat')
    .replace(/\{amount\}/g, dueAmountStr)
    .replace(/\{due_date\}/g, formattedDueDate)
    .replace(/\{outstanding\}/g, outstandingStr)
    .replace(/\{business_name\}/g, settings.businessName || 'Property Management')
    .replace(/\{owner_name\}/g, settings.ownerName || 'Property Owner')
    .replace(/\{owner_phone\}/g, settings.phone)
    .replace(/\{bank_name\}/g, settings.bankDetails.bankName)
    .replace(/\{account_name\}/g, settings.bankDetails.accountName)
    .replace(/\{account_number\}/g, settings.bankDetails.accountNumber)
    .replace(/\{routing_or_ifsc\}/g, settings.bankDetails.routingOrIfsc)
    .replace(/\{upi_id\}/g, settings.bankDetails.upiId)
    .replace(/\{upi_number\}/g, settings.bankDetails.upiNumber || settings.phone)
    .replace(/\{landlord_pan\}/g, settings.landlordPan || 'N/A');
}

/**
 * Cleans phone number for WhatsApp wa.me links
 * Defaults to +91 (India) for standard 10-digit mobile numbers
 */
export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  // If user entered 09810123456 (common Indian dial code pattern)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  // Default to Indian country code (+91) if 10 digits without country code
  if (cleaned.length === 10) {
    return `91${cleaned}`;
  }
  return cleaned;
}

/**
 * Builds direct WhatsApp URL
 */
export function getWhatsAppReminderUrl(
  tenant: Tenant,
  balanceInfo: TenantBalanceInfo,
  settings: PropertyOwnerSettings,
  customText?: string
): string {
  const message =
    customText ||
    formatReminderTemplate(
      settings.reminderSettings.whatsappTemplate,
      tenant,
      balanceInfo,
      settings
    );
  const phone = cleanPhoneNumber(tenant.phone);
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Builds direct Mailto URL
 */
export function getEmailReminderUrl(
  tenant: Tenant,
  balanceInfo: TenantBalanceInfo,
  settings: PropertyOwnerSettings,
  customSubject?: string,
  customBody?: string
): string {
  const subject =
    customSubject ||
    formatReminderTemplate(
      settings.reminderSettings.emailSubjectTemplate,
      tenant,
      balanceInfo,
      settings
    );
  const body =
    customBody ||
    formatReminderTemplate(
      settings.reminderSettings.emailBodyTemplate,
      tenant,
      balanceInfo,
      settings
    );
  return `mailto:${tenant.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    body
  )}`;
}

export interface ReminderCandidate {
  tenant: Tenant;
  balanceInfo: TenantBalanceInfo;
  reason: 'approaching_due_date' | 'due_today' | 'overdue';
  daysInfo: string;
  recommendedChannel: 'whatsapp' | 'email' | 'both';
  suggestedWhatsAppMessage: string;
  suggestedEmailSubject: string;
  suggestedEmailBody: string;
}

/**
 * Identifies tenants who need payment reminders based on due dates & balance
 */
export function evaluateReminderCandidates(
  tenants: Tenant[],
  balances: Map<string, TenantBalanceInfo>,
  settings: PropertyOwnerSettings
): ReminderCandidate[] {
  const candidates: ReminderCandidate[] = [];
  const { daysBeforeDue } = settings.reminderSettings;

  tenants.forEach((tenant) => {
    if (tenant.status !== 'active') return;

    const balanceInfo = balances.get(tenant.id);
    if (!balanceInfo) return;

    // If tenant has already cleared or is in advance, skip
    if (balanceInfo.currentMonthStatus === 'paid' || balanceInfo.currentMonthStatus === 'advance') {
      return;
    }

    const { daysDiff } = balanceInfo;

    let reason: 'approaching_due_date' | 'due_today' | 'overdue' | null = null;
    let daysInfo = '';

    if (daysDiff === 0) {
      reason = 'due_today';
      daysInfo = 'Due today';
    } else if (daysDiff < 0) {
      reason = 'overdue';
      daysInfo = `Overdue by ${Math.abs(daysDiff)} day${Math.abs(daysDiff) === 1 ? '' : 's'}`;
    } else if (daysDiff <= daysBeforeDue) {
      reason = 'approaching_due_date';
      daysInfo = `Due in ${daysDiff} day${daysDiff === 1 ? '' : 's'}`;
    }

    if (reason) {
      candidates.push({
        tenant,
        balanceInfo,
        reason,
        daysInfo,
        recommendedChannel: 'both',
        suggestedWhatsAppMessage: formatReminderTemplate(
          settings.reminderSettings.whatsappTemplate,
          tenant,
          balanceInfo,
          settings
        ),
        suggestedEmailSubject: formatReminderTemplate(
          settings.reminderSettings.emailSubjectTemplate,
          tenant,
          balanceInfo,
          settings
        ),
        suggestedEmailBody: formatReminderTemplate(
          settings.reminderSettings.emailBodyTemplate,
          tenant,
          balanceInfo,
          settings
        ),
      });
    }
  });

  return candidates;
}

/**
 * Creates a reminder log record
 */
export function createReminderLog(
  tenant: Tenant,
  balanceInfo: TenantBalanceInfo,
  channel: 'whatsapp' | 'email',
  message: string,
  subject?: string,
  isAutomated: boolean = false
): ReminderLog {
  return {
    id: `rem-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    tenantId: tenant.id,
    tenantName: tenant.name,
    unit: tenant.unit,
    channel,
    recipientContact: channel === 'whatsapp' ? tenant.phone : tenant.email,
    message,
    subject,
    sentAt: new Date().toISOString(),
    status: 'queued',
    isAutomated,
    dueDate: balanceInfo.currentMonthDueDate,
    amountDue: balanceInfo.outstandingBalance > 0 ? balanceInfo.outstandingBalance : tenant.rentAmount,
  };
}
