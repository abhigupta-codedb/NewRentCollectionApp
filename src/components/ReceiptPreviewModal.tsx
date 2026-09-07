import { X, Download, Printer, Share2, CheckCircle, ShieldCheck } from 'lucide-react';
import { Payment, Tenant, PropertyOwnerSettings } from '../types';
import { downloadReceiptPdf } from '../services/pdfGenerator';
import { cleanPhoneNumber } from '../services/reminderService';

interface ReceiptPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: Payment | null;
  tenant: Tenant | null;
  settings: PropertyOwnerSettings;
  currentBalance?: number;
}

export default function ReceiptPreviewModal({
  isOpen,
  onClose,
  payment,
  tenant,
  settings,
  currentBalance,
}: ReceiptPreviewModalProps) {
  if (!isOpen || !payment || !tenant) return null;

  const currency = settings.currencySymbol || '₹';

  const handleDownload = () => {
    downloadReceiptPdf(payment, tenant, settings, currentBalance);
  };

  const handleShareWhatsApp = () => {
    const text = `Namaste ${tenant.name} ji,\n\nAapka ${tenant.unit} ka ${payment.monthCovered} mahine ka kiraya ${currency}${payment.amount.toLocaleString('en-IN')} safalta-purvak prapt hua hai.\n\nRashid No: ${payment.receiptNumber}\nPayment Mode: ${payment.paymentMethod}${payment.referenceId ? ` (UTR: ${payment.referenceId})` : ''}\nTareekh: ${payment.date}\n\nDhanyawad,\n${settings.ownerName} (${settings.businessName})`;
    const phone = cleanPhoneNumber(tenant.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header bar */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="font-bold text-sm flex items-center gap-2">
              <span>Official Kiraya Rashid</span>
              <span className="text-[10px] bg-emerald-900 text-emerald-200 px-1.5 py-0.5 rounded font-mono">
                HRA Compliant
              </span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Receipt Visual Sheet */}
        <div className="p-6 bg-slate-50 max-h-[75vh] overflow-y-auto">
          <div className="bg-white rounded-xl border border-amber-200/70 p-6 shadow-2xs space-y-5">
            {/* Top Company & Receipt Badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-200">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-1.5 py-0.5 rounded inline-block mb-1">
                  किराया रसीद / RENT RECEIPT
                </span>
                <h3 className="text-base font-black text-slate-900 uppercase">
                  {settings.businessName}
                </h3>
                <p className="text-xs text-slate-600 mt-0.5">{settings.address}</p>
                <p className="text-xs text-slate-500">
                  Ph: {settings.phone} • Email: {settings.email}
                </p>
                {settings.landlordPan && (
                  <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                    Landlord PAN: {settings.landlordPan}
                  </p>
                )}
              </div>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">
                  RASHID NUMBER
                </span>
                <span className="text-sm font-mono font-black text-emerald-950 block">
                  {payment.receiptNumber}
                </span>
                <span className="text-xs text-emerald-700 block mt-0.5">
                  Tareekh: {payment.date}
                </span>
              </div>
            </div>

            {/* Tenant & Period Details */}
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  KIRAYEDAR JANKARI (TENANT)
                </span>
                <p className="font-bold text-slate-900 text-sm">{tenant.name}</p>
                <p className="text-slate-700 font-medium">{tenant.unit}</p>
                <p className="text-slate-600 font-mono">Mobile: {tenant.phone}</p>
                <p className="text-slate-600">Email: {tenant.email || 'N/A'}</p>
              </div>
              <div className="space-y-1.5 text-right">
                <span className="text-[10px] font-bold tracking-wider text-slate-400 uppercase block">
                  BHUGTAN VIVARAN (PAYMENT)
                </span>
                <p className="text-slate-600">
                  Mahina: <strong className="text-slate-900 font-bold">{payment.monthCovered}</strong>
                </p>
                <p className="text-slate-600">
                  Madhyam: <strong className="text-slate-900 font-bold">{payment.paymentMethod}</strong>
                </p>
                <p className="text-slate-600">
                  Ref / UTR: <span className="font-mono font-bold text-slate-800">{payment.referenceId || 'N/A'}</span>
                </p>
                <p className="text-slate-600">
                  Prapt-karta: <strong className="text-slate-900">{payment.receivedBy}</strong>
                </p>
              </div>
            </div>

            {/* Amount Table */}
            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700">
                <span>Vivaran (Description)</span>
                <span>Rashi (Amount)</span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 text-xs border-t border-slate-200 bg-white">
                <div>
                  <p className="font-bold text-slate-900">Mahina Kiraya — {tenant.unit}</p>
                  <p className="text-[11px] text-slate-500">Period: {payment.monthCovered}</p>
                  {payment.notes && (
                    <p className="text-[11px] text-slate-400 italic mt-0.5">Note: {payment.notes}</p>
                  )}
                </div>
                <span className="font-black text-slate-900 text-sm">
                  {currency}{payment.amount.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3 bg-emerald-50/80 border-t border-emerald-200">
                <span className="text-xs font-bold text-emerald-950">Kul Jama Rashi (Total Paid)</span>
                <span className="text-base font-black text-emerald-800">
                  {currency}{payment.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            {/* HRA & Verification Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-[11px] text-slate-500">
              <div className="p-2.5 bg-amber-50/70 border border-amber-200 rounded-lg">
                <span className="font-bold text-amber-950 block">HRA Claim Soochana:</span>
                <span>Yeh rashid Income Tax Act ke anuroop HRA tax benefit claim karne hetu manya dastaveez hai.</span>
              </div>
              <div className="p-2.5 bg-slate-100/70 border border-slate-200 rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-700 block">Revenue Stamp:</span>
                  <span className="text-[10px] text-slate-500">₹5,000 se upar cash prapti par aniwarya</span>
                </div>
                <div className="w-12 h-12 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-400 text-center font-mono">
                  Re. 1 Stamp
                </div>
              </div>
            </div>

            {/* Verification and Signature */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-200 text-xs">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <div>
                  <span className="font-bold block">STATUS: PRAAPTI DASTAVEEZ (VERIFIED)</span>
                  <span className="text-[10px] text-slate-500">Digital Ref ID: {payment.id}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="h-6 border-b border-slate-400 w-36 ml-auto mb-1"></div>
                <span className="text-xs font-bold text-slate-900 block">{settings.ownerName}</span>
                <span className="text-[10px] text-slate-500">Makaan Malik (Landlord Signature)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white border-t border-slate-200">
          <button
            onClick={handleShareWhatsApp}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>WhatsApp Par Rashid Bhejein</span>
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>HRA Rashid (PDF)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
