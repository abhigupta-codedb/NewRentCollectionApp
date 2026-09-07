import { useState, useEffect, FormEvent } from 'react';
import { X, CreditCard, Calendar, CheckCircle2, Download } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Tenant, Payment, PropertyOwnerSettings, TenantBalanceInfo } from '../types';
import { downloadReceiptPdf } from '../services/pdfGenerator';

interface RecordPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Tenant[];
  selectedTenantId?: string;
  balances: Map<string, TenantBalanceInfo>;
  settings: PropertyOwnerSettings;
  onPaymentRecorded: (payment: Payment, shouldDownloadReceipt: boolean) => void;
}

export default function RecordPaymentModal({
  isOpen,
  onClose,
  tenants,
  selectedTenantId,
  balances,
  settings,
  onPaymentRecorded,
}: RecordPaymentModalProps) {
  const currency = settings.currencySymbol || '₹';

  const [tenantId, setTenantId] = useState<string>(selectedTenantId || (tenants[0]?.id ?? ''));
  const [amount, setAmount] = useState<number | ''>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [monthCovered, setMonthCovered] = useState<string>('September 2026');
  const [paymentMethod, setPaymentMethod] = useState<Payment['paymentMethod']>('UPI');
  const [referenceId, setReferenceId] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [autoDownloadPdf, setAutoDownloadPdf] = useState<boolean>(true);
  const [receiptNumber, setReceiptNumber] = useState<string>('');

  const currentTenant = tenants.find((t) => t.id === tenantId);
  const currentBalanceInfo = currentTenant ? balances.get(currentTenant.id) : undefined;

  useEffect(() => {
    if (selectedTenantId) {
      setTenantId(selectedTenantId);
    } else if (tenants.length > 0 && !tenantId) {
      setTenantId(tenants[0].id);
    }
  }, [selectedTenantId, tenants]);

  useEffect(() => {
    if (currentTenant) {
      // Default amount to outstanding balance if positive, otherwise rent amount
      const suggested =
        currentBalanceInfo && currentBalanceInfo.outstandingBalance > 0
          ? currentBalanceInfo.outstandingBalance
          : currentTenant.rentAmount;
      setAmount(suggested);

      // Default month covered
      const now = new Date();
      const currentMonthStr = now.toLocaleString('default', { month: 'long', year: 'numeric' });
      setMonthCovered(currentMonthStr);

      // Generate receipt number
      const randomSuffix = Math.floor(1000 + Math.random() * 9000);
      setReceiptNumber(`KIR-${now.getFullYear()}-${randomSuffix}`);
    }
  }, [tenantId, currentTenant]);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!currentTenant || !amount || Number(amount) <= 0) return;

    const newPayment: Payment = {
      id: `pay-${Date.now()}`,
      receiptNumber: receiptNumber || `KIR-${Date.now().toString().slice(-4)}`,
      tenantId: currentTenant.id,
      tenantName: currentTenant.name,
      unit: currentTenant.unit,
      amount: Number(amount),
      date,
      monthCovered,
      paymentMethod,
      referenceId: referenceId.trim() || `UTR-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
      status: 'completed',
      receivedBy: settings.ownerName || 'Makaan Malik',
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    // Confetti effect
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    if (autoDownloadPdf) {
      const remainingBalance = (currentBalanceInfo?.outstandingBalance ?? currentTenant.rentAmount) - Number(amount);
      downloadReceiptPdf(newPayment, currentTenant, settings, remainingBalance);
    }

    onPaymentRecorded(newPayment, autoDownloadPdf);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header with authentic Indian context */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-700 rounded-xl">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Kiraya Jama Karein</span>
                <span className="text-xs font-semibold text-emerald-200 bg-emerald-950/60 px-2 py-0.5 rounded">
                  किराया जमा पर्ची
                </span>
              </h3>
              <p className="text-xs text-emerald-100">
                Kiraya hisab me jodein aur HRA-valid Kiraya Rashid (PDF) generate karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-emerald-200 hover:text-white rounded-lg hover:bg-emerald-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tenant Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Kirayedar &amp; Kamra / Flat Chunein *
            </label>
            <select
              value={tenantId}
              onChange={(e) => setTenantId(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300 bg-white font-medium text-slate-900"
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.unit} ({currency}{t.rentAmount.toLocaleString('en-IN')}/mahina)
                </option>
              ))}
            </select>

            {/* Tenant balance summary pill */}
            {currentBalanceInfo && (
              <div className="flex items-center justify-between mt-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                <span className="text-slate-600">
                  Mahina Kiraya:{' '}
                  <strong className="text-slate-900">
                    {currency}{currentTenant?.rentAmount.toLocaleString('en-IN')}
                  </strong>
                </span>
                <span className="text-slate-600">
                  Khata Bakaya:{' '}
                  <strong className={currentBalanceInfo.outstandingBalance > 0 ? 'text-rose-700' : 'text-emerald-700'}>
                    {currency}{currentBalanceInfo.outstandingBalance.toLocaleString('en-IN')}
                    {currentBalanceInfo.outstandingBalance > 0 ? ' (देय)' : ' (क्लियर)'}
                  </strong>
                </span>
              </div>
            )}
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Jama Rashi ({currency} Amount) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
                <input
                  type="number"
                  min="1"
                  step="any"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                  placeholder="Jaise: 15000"
                  className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 font-extrabold text-slate-900 border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Ki Tareekh (Date) *
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300"
                />
              </div>
            </div>
          </div>

          {/* Month Covered & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kis Mahine Ka Kiraya Hai *
              </label>
              <input
                type="text"
                value={monthCovered}
                onChange={(e) => setMonthCovered(e.target.value)}
                placeholder="Jaise: September 2026"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Bhugtan Madhyam (Payment Mode) *
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as Payment['paymentMethod'])}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300 bg-white font-medium"
              >
                <option value="UPI">UPI (GPay / PhonePe / Paytm / BHIM)</option>
                <option value="Bank Transfer">Bank Transfer (NEFT / IMPS / Netbanking)</option>
                <option value="Cash">Cash (नकदी / Cash in Hand)</option>
                <option value="Cheque">Bank Cheque (चेक)</option>
                <option value="Credit Card">Debit / Credit Card</option>
              </select>
            </div>
          </div>

          {/* Reference ID & Receipt # */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                UTR / UPI Ref No / Cheque No
              </label>
              <input
                type="text"
                value={referenceId}
                onChange={(e) => setReferenceId(e.target.value)}
                placeholder="Jaise: UTR-3948210982 ya Cash"
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kiraya Rashid No. (Receipt #)
              </label>
              <input
                type="text"
                value={receiptNumber}
                onChange={(e) => setReceiptNumber(e.target.value)}
                className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300 bg-slate-50 font-mono text-slate-800 font-bold"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Khas Note / Vivaran (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jaise: Bijli bill reading shamil hai, advance kiraya"
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500 border-slate-300"
            />
          </div>

          {/* Auto Download Option */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoDownloadPdf}
                onChange={(e) => setAutoDownloadPdf(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-emerald-900">
                Kiraya Rashid (PDF) turant download karein
              </span>
            </label>
            <Download className="w-4 h-4 text-emerald-700" />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            >
              Radd Karein (Cancel)
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 text-sm font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Kiraya Jama Karein (+ जमा दर्ज करें)</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
