import { jsPDF } from 'jspdf';
import { Payment, Tenant, PropertyOwnerSettings } from '../types';

/**
 * Generates an official, high-resolution PDF receipt for a rent payment.
 */
export function generateReceiptPdf(
  payment: Payment,
  tenant: Tenant,
  settings: PropertyOwnerSettings,
  currentBalance?: number
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  // In standard PDF fonts, use Rs. for currency symbol safety
  const currency = settings.currencySymbol === '₹' ? 'Rs. ' : (settings.currencySymbol ? `${settings.currencySymbol} ` : 'Rs. ');

  // --- Background subtle styling ---
  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, 297, 'F');

  // Top accent banner - Deep saffron/indigo inspired
  doc.setFillColor(30, 41, 59); // Slate 800
  doc.rect(0, 0, pageWidth, 28, 'F');

  // White receipt card container
  const margin = 14;
  const cardWidth = pageWidth - margin * 2;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, 16, cardWidth, 265, 4, 4, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, 16, cardWidth, 265, 4, 4, 'S');

  // Header Title in card
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text((settings.businessName || 'MAKAAN MALIK / PROPERTY OWNER').toUpperCase(), margin + 10, 31);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(settings.address || 'Delhi NCR, India', margin + 10, 36.5);
  doc.text(`Mobile: ${settings.phone} | Email: ${settings.email}`, margin + 10, 41.5);
  doc.text(`Landlord PAN: ${settings.landlordPan || 'Not Specified'} (For HRA Tax Claim)`, margin + 10, 46.5);

  // Receipt Badge on Right
  doc.setFillColor(254, 243, 199); // Amber 100
  doc.roundedRect(pageWidth - margin - 68, 22, 58, 25, 3, 3, 'F');
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(pageWidth - margin - 68, 22, 58, 25, 3, 3, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(180, 83, 9); // Amber 800
  doc.text('KIRAYA RASHID / RECEIPT', pageWidth - margin - 64, 28.5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(146, 64, 14);
  doc.text(`Receipt No: ${payment.receiptNumber}`, pageWidth - margin - 64, 34);
  doc.text(`Tareekh (Date): ${payment.date}`, pageWidth - margin - 64, 39);
  doc.text(`Valid HRA Receipt`, pageWidth - margin - 64, 44);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 10, 52, pageWidth - margin - 10, 52);

  // Tenant and Property Details Section
  let y = 61;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KIRAYEDAR & PROPERTY DETAILS', margin + 10, y);
  doc.text('PAYMENT VIVARAN (SUMMARY)', pageWidth / 2 + 10, y);

  y += 7;
  // Left Column (Tenant)
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);

  doc.text('Kirayedar (Tenant):', margin + 10, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tenant.name, margin + 45, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Makaan / Unit No:', margin + 10, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tenant.unit, margin + 45, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Contact Mobile:', margin + 10, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(tenant.phone, margin + 45, y);

  y += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Tenant Email:', margin + 10, y);
  doc.text(tenant.email || 'N/A', margin + 45, y);

  // Right Column (Payment Info)
  let rightY = 68;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Mahina (Period):', pageWidth / 2 + 10, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.monthCovered, pageWidth / 2 + 45, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Madhyam (Mode):', pageWidth / 2 + 10, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.paymentMethod, pageWidth / 2 + 45, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('UTR / Txn Ref ID:', pageWidth / 2 + 10, rightY);
  doc.setFont('helvetica', 'normal');
  doc.text(payment.referenceId || 'N/A', pageWidth / 2 + 45, rightY);

  rightY += 6;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('Praptkarta (Received By):', pageWidth / 2 + 10, rightY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(payment.receivedBy || settings.ownerName, pageWidth / 2 + 45, rightY);

  // Line Item Table
  y = 96;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin + 10, y, cardWidth - 20, 9, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('VIVARAN (DESCRIPTION)', margin + 15, y + 6);
  doc.text('MAHINA (RENT PERIOD)', margin + 85, y + 6);
  doc.text('JAMA RASHI (AMOUNT)', cardWidth - margin - 5, y + 6, { align: 'right' });

  // Row 1: Rent Payment
  y += 11;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Monthly Rent - ${tenant.unit}`, margin + 15, y);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text(payment.monthCovered, margin + 85, y);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${currency}${payment.amount.toLocaleString('en-IN')}`, cardWidth - margin - 5, y, {
    align: 'right',
  });

  if (payment.notes) {
    y += 6;
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Note: ${payment.notes}`, margin + 15, y);
  }

  // Row line
  y += 8;
  doc.setDrawColor(241, 245, 249);
  doc.line(margin + 10, y, cardWidth + margin - 10, y);

  // Total Paid Highlight Box
  y += 6;
  doc.setFillColor(240, 253, 244); // Green 50
  doc.roundedRect(cardWidth - margin - 85, y, 85, 24, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(cardWidth - margin - 85, y, 85, 24, 2, 2, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(22, 101, 52); // Green 800
  doc.text('KUL JAMA KIRAYA (TOTAL PAID)', cardWidth - margin - 80, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(21, 128, 61); // Green 700
  doc.text(`${currency}${payment.amount.toLocaleString('en-IN')}`, cardWidth - margin - 10, y + 17, {
    align: 'right',
  });

  // Balance status if provided
  if (currentBalance !== undefined) {
    y += 28;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Khata Bakaya (Current Outstanding Balance):', margin + 15, y);
    doc.setFont('helvetica', 'bold');
    if (currentBalance <= 0) {
      doc.setTextColor(22, 101, 52);
      doc.text(`${currency}0.00 (Sabhi Bakaya Clear / No Dues)`, margin + 85, y);
    } else {
      doc.setTextColor(185, 28, 28);
      doc.text(`${currency}${currentBalance.toLocaleString('en-IN')} (Bakaya / Pending)`, margin + 85, y);
    }
  }

  // Revenue Stamp Placeholder Box (Standard in Indian Rent Receipts)
  y = 168;
  doc.setDrawColor(148, 163, 184);
  doc.setLineDashPattern([2, 2], 0);
  doc.roundedRect(margin + 15, y, 42, 45, 1, 1, 'S');
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('REVENUE STAMP', margin + 20, y + 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.text('Affix Re. 1/-', margin + 22, y + 20);
  doc.text('Revenue Stamp', margin + 20, y + 26);
  doc.text('(If paid in Cash)', margin + 20, y + 32);

  // Official Verification on Center
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin + 62, y, 55, 45, 2, 2, 'S');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  doc.text('VERIFICATION STATUS', margin + 66, y + 10);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Status: PAID & CLEARED', margin + 66, y + 18);
  doc.text(`Recorded On: ${payment.date}`, margin + 66, y + 25);
  doc.text(`Landlord PAN: ${settings.landlordPan || 'Verified'}`, margin + 66, y + 32);
  doc.text('Sec 10(13A) IT Act HRA Valid', margin + 66, y + 39);

  // Signature line on right
  doc.line(cardWidth + margin - 70, y + 32, cardWidth + margin - 10, y + 32);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text(settings.ownerName || 'Makaan Malik', cardWidth + margin - 70, y + 38);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Hastakshar / Signature of Landlord', cardWidth + margin - 70, y + 43);

  // Footer Disclaimer
  y = 236;
  doc.setDrawColor(226, 232, 240);
  doc.line(margin + 10, y, cardWidth + margin - 10, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Yeh ek digital roop se pramanit Kiraya Rashid hai jo House Rent Allowance (HRA) Income Tax exemption hetu poori tarah maanya hai.',
    margin + 10,
    y + 7,
    { maxWidth: cardWidth - 20 }
  );

  doc.text(
    `Kiraya sambandhi kisi bhi poochhtach ke liye ${settings.email} ya ${settings.phone} par sampark karein.`,
    margin + 10,
    y + 13
  );

  return doc;
}

/**
 * Downloads a generated receipt PDF directly.
 */
export function downloadReceiptPdf(
  payment: Payment,
  tenant: Tenant,
  settings: PropertyOwnerSettings,
  currentBalance?: number
) {
  const doc = generateReceiptPdf(payment, tenant, settings, currentBalance);
  const cleanTenantName = tenant.name.replace(/\s+/g, '_');
  doc.save(`Receipt_${payment.receiptNumber}_${cleanTenantName}.pdf`);
}

/**
 * Generates an executive Monthly Rent Collection Income Report PDF
 */
export function generateMonthlyReportPdf(
  monthName: string,
  year: number,
  stats: {
    totalExpected: number;
    totalCollected: number;
    totalPending: number;
    collectionRate: number;
    totalTenants: number;
    paidTenantsCount: number;
  },
  tenantRows: Array<{
    tenantName: string;
    unit: string;
    rentAmount: number;
    paidAmount: number;
    balance: number;
    status: string;
    paymentMode?: string;
  }>,
  settings: PropertyOwnerSettings
): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const currency = settings.currencySymbol === '₹' ? 'Rs. ' : (settings.currencySymbol ? `${settings.currencySymbol} ` : 'Rs. ');
  const margin = 14;

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate 900
  doc.rect(0, 0, pageWidth, 32, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text('KIRAYA BAHI-KHATA / MONTHLY COLLECTION STATEMENT', margin, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Mahina: ${monthName} ${year} | Makaan Malik: ${settings.businessName} (${settings.ownerName})`, margin, 23);

  // Summary Metrics Grid
  let y = 42;
  const colWidth = (pageWidth - margin * 2 - 12) / 4;

  // Metric 1: Expected
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, y, colWidth, 24, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, y, colWidth, 24, 2, 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text('KUL KIRAYA (EXPECTED)', margin + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text(`${currency}${stats.totalExpected.toLocaleString('en-IN')}`, margin + 4, y + 17);

  // Metric 2: Collected
  const x2 = margin + colWidth + 4;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(x2, y, colWidth, 24, 2, 2, 'F');
  doc.setDrawColor(187, 247, 208);
  doc.roundedRect(x2, y, colWidth, 24, 2, 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(22, 101, 52);
  doc.text('KUL VASOOLI (COLLECTED)', x2 + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(21, 128, 61);
  doc.text(`${currency}${stats.totalCollected.toLocaleString('en-IN')}`, x2 + 4, y + 17);

  // Metric 3: Outstanding
  const x3 = x2 + colWidth + 4;
  doc.setFillColor(254, 242, 242);
  doc.roundedRect(x3, y, colWidth, 24, 2, 2, 'F');
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(x3, y, colWidth, 24, 2, 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(153, 27, 27);
  doc.text('KUL BAKAYA (OUTSTANDING)', x3 + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text(`${currency}${stats.totalPending.toLocaleString('en-IN')}`, x3 + 4, y + 17);

  // Metric 4: Efficiency
  const x4 = x3 + colWidth + 4;
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(x4, y, colWidth, 24, 2, 2, 'F');
  doc.setDrawColor(199, 210, 254);
  doc.roundedRect(x4, y, colWidth, 24, 2, 2, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(67, 56, 202);
  doc.text('VASOOLI RATE %', x4 + 4, y + 7);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(79, 70, 229);
  doc.text(`${stats.collectionRate}%`, x4 + 4, y + 17);

  // Breakdown Table
  y = 76;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('KIRAYEDAR-WISE COLLECTION & BAKAYA HISAB', margin, y);

  y += 5;
  doc.setFillColor(241, 245, 249);
  doc.rect(margin, y, pageWidth - margin * 2, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('KIRAYEDAR & UNIT', margin + 4, y + 5.5);
  doc.text('KIRAYA', margin + 65, y + 5.5);
  doc.text('JAMA RASHI', margin + 95, y + 5.5);
  doc.text('BAKAYA', margin + 125, y + 5.5);
  doc.text('STATUS', margin + 155, y + 5.5);

  y += 12;
  tenantRows.forEach((row) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(row.tenantName, margin + 4, y);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(row.unit, margin + 4, y + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(`${currency}${row.rentAmount.toLocaleString('en-IN')}`, margin + 65, y);

    doc.setTextColor(row.paidAmount > 0 ? 21 : 100, row.paidAmount > 0 ? 128 : 116, row.paidAmount > 0 ? 61 : 139);
    doc.text(`${currency}${row.paidAmount.toLocaleString('en-IN')}`, margin + 95, y);

    doc.setTextColor(row.balance > 0 ? 185 : 100, row.balance > 0 ? 28 : 116, row.balance > 0 ? 28 : 139);
    doc.text(`${currency}${row.balance.toLocaleString('en-IN')}`, margin + 125, y);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    if (row.status === 'Paid') {
      doc.setTextColor(22, 101, 52);
    } else if (row.status === 'Overdue') {
      doc.setTextColor(185, 28, 28);
    } else {
      doc.setTextColor(180, 83, 9);
    }
    doc.text(row.status.toUpperCase(), margin + 155, y);

    // subtle line
    y += 9;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
  });

  // Footer notes
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `Generated on ${new Date().toLocaleDateString()} by ${settings.businessName}. Confirmed occupancy: ${stats.paidTenantsCount}/${stats.totalTenants} units collected.`,
    margin,
    285
  );

  return doc;
}
