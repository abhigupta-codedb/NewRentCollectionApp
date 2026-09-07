import { useState, FormEvent } from 'react';
import { X, Building2, CreditCard, Save, RotateCcw } from 'lucide-react';
import { PropertyOwnerSettings } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: PropertyOwnerSettings;
  onSave: (updated: PropertyOwnerSettings) => void;
  onResetDemo: () => void;
}

export default function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSave,
  onResetDemo,
}: SettingsModalProps) {
  const [formData, setFormData] = useState<PropertyOwnerSettings>(settings);

  if (!isOpen) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Makaan Malik &amp; Property Settings</span>
                <span className="text-[10px] bg-amber-900/80 text-amber-200 px-1.5 py-0.5 rounded">
                  मालिक खाता
                </span>
              </h3>
              <p className="text-[11px] text-slate-300">
                Kiraya rashid, HRA receipts aur WhatsApp payment link me yahi details jaayengi
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
          {/* Business & Owner Info */}
          <div className="space-y-3">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              Makaan Malik &amp; Property Ki Jankari
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Makaan Malik Ka Naam *</label>
                <input
                  type="text"
                  value={formData.ownerName}
                  onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Property / Makaan Ka Naam *</label>
                <input
                  type="text"
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Owner Mobile / WhatsApp</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Owner Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-semibold mb-1">Property Ka Poora Pata (Printed on HRA Receipt)</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg border-slate-300"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  Landlord PAN No. (HRA Claim Hetu)
                </label>
                <input
                  type="text"
                  value={formData.landlordPan || ''}
                  onChange={(e) => setFormData({ ...formData, landlordPan: e.target.value.toUpperCase() })}
                  placeholder="Jaise: ABCDE1234F"
                  className="w-full px-3 py-2 border rounded-lg border-amber-300 bg-amber-50/40 font-mono font-bold uppercase"
                />
                <p className="text-[10px] text-slate-500 mt-0.5">Yearly kiraya ₹1 Lakh se zyada hone par kirayedar ko HRA ke liye zaroori hota hai</p>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Currency Symbol</label>
                <select
                  value={formData.currencySymbol}
                  onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white font-bold"
                >
                  <option value="₹">₹ (INR - Indian Rupee)</option>
                  <option value="$">$ (USD)</option>
                  <option value="€">€ (EUR)</option>
                  <option value="£">£ (GBP)</option>
                  <option value="AED ">AED</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment & Bank Details */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-emerald-700" />
              <span>Banking &amp; UPI Details (Kirayedar ko bhejne hetu)</span>
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Account Holder Ka Naam</label>
                <input
                  type="text"
                  value={formData.bankDetails.accountName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bank Ka Naam</label>
                <input
                  type="text"
                  value={formData.bankDetails.bankName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg border-slate-300"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bank Account Number</label>
                <input
                  type="text"
                  value={formData.bankDetails.accountNumber}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={formData.bankDetails.routingOrIfsc}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, routingOrIfsc: e.target.value.toUpperCase() },
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 font-mono uppercase font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">UPI ID (GPay / PhonePe / Paytm)</label>
                <input
                  type="text"
                  value={formData.bankDetails.upiId}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bankDetails: { ...formData.bankDetails, upiId: e.target.value },
                    })
                  }
                  placeholder="Jaise: sharmaji@okaxis"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">UPI / GPay Mobile No.</label>
                <input
                  type="text"
                  value={formData.upiNumber || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      upiNumber: e.target.value,
                    })
                  }
                  placeholder="Jaise: 9810123456"
                  className="w-full px-3 py-2 border rounded-lg border-slate-300 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Reset Demo Data & Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Kya aap sample kirayedaar aur data reset karna chahte hain?')) {
                  onResetDemo();
                  onClose();
                }
              }}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 transition text-[11px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Sample Data</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
              >
                Radd (Cancel)
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Settings Save Karein</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
