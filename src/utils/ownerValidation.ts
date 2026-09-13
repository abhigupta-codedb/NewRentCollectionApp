import { PropertyOwnerSettings } from '../types';

export interface ValidationResult {
  isValid: boolean;
  missingFields: string[];
  message?: string;
}

/**
 * Checks if basic landlord/business information is configured.
 */
export function validateBasicSettings(settings: PropertyOwnerSettings): ValidationResult {
  const missing: string[] = [];

  if (!settings.ownerName?.trim()) missing.push('Makaan Malik Ka Naam (Owner Name)');
  if (!settings.businessName?.trim()) missing.push('Property / Business Name');
  if (!settings.phone?.trim()) missing.push('Contact Phone / Mobile Number');
  if (!settings.address?.trim()) missing.push('Property Address');

  return {
    isValid: missing.length === 0,
    missingFields: missing,
    message:
      missing.length > 0
        ? `Kripya Settings me jakar zaruri jankari poori karein: ${missing.join(', ')}.`
        : undefined,
  };
}

/**
 * Checks if payment instructions (UPI or Bank Account details) are configured.
 * Reminders containing payment instructions should not be generated until this is filled.
 */
export function validatePaymentInstructions(settings: PropertyOwnerSettings): ValidationResult {
  const bank = settings.bankDetails;
  const hasUpi = Boolean(bank?.upiId?.trim() || bank?.upiNumber?.trim());
  const hasBank = Boolean(bank?.accountNumber?.trim() && bank?.routingOrIfsc?.trim());

  if (!hasUpi && !hasBank) {
    return {
      isValid: false,
      missingFields: ['UPI ID / Number', 'Bank Account Number & IFSC'],
      message:
        'Payment instructions (UPI ID ya Bank Account) configured nahi hain. Reminder bhejne se pehle Settings me UPI ya Bank details bharein.',
    };
  }

  return {
    isValid: true,
    missingFields: [],
  };
}

/**
 * Checks if the necessary landlord information is present to generate a valid Kiraya Rashid (PDF Receipt).
 * Note: PAN is not universally mandatory; it is only required if the monthly rent exceeds ₹8,333
 * (Annual rent > ₹1,00,000 for Indian Income Tax HRA compliance).
 */
export function validateReceiptRequirements(
  settings: PropertyOwnerSettings,
  paymentAmount?: number
): ValidationResult {
  const missing: string[] = [];

  if (!settings.ownerName?.trim()) missing.push('Owner Name (Makaan Malik)');
  if (!settings.businessName?.trim()) missing.push('Property / Business Name');
  if (!settings.phone?.trim()) missing.push('Phone Number');
  if (!settings.address?.trim()) missing.push('Property Address (Pata)');

  // PAN validation only when required by tax rules (annual rent > 1 Lakh or monthly > 8,333)
  const isHraThresholdExceeded = paymentAmount ? paymentAmount > 8333 : false;
  if (isHraThresholdExceeded && !settings.landlordPan?.trim()) {
    missing.push('Landlord PAN (Required for monthly rent > ₹8,333 / annual > ₹1 Lakh HRA exemption)');
  }

  return {
    isValid: missing.length === 0,
    missingFields: missing,
    message:
      missing.length > 0
        ? `Kiraya Rashid (PDF Receipt) generate karne ke liye landlord jankari adhuri hai. Missing: ${missing.join(
            ', '
          )}. Kripya pehle Settings me jakar update karein.`
        : undefined,
  };
}
