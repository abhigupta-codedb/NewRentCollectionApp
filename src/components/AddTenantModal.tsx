import { useState, ChangeEvent, FormEvent } from 'react';
import { X, Upload, FileText, UserPlus, Phone, Mail, Home, Calendar, Building2 } from 'lucide-react';
import { Tenant, LeaseDocument, PropertyOwnerSettings, PropertyType, PROPERTY_TYPES } from '../types';

interface AddTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTenant: (tenant: Tenant) => void;
  settings: PropertyOwnerSettings;
}

export default function AddTenantModal({
  isOpen,
  onClose,
  onAddTenant,
  settings,
}: AddTenantModalProps) {
  const currency = settings.currencySymbol || '₹';

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('Flat');
  const [unit, setUnit] = useState('');
  const [rentAmount, setRentAmount] = useState<number | ''>('');
  const [securityDeposit, setSecurityDeposit] = useState<number | ''>('');
  const [dueDay, setDueDay] = useState<number>(5);
  const [leaseStart, setLeaseStart] = useState('2026-09-01');
  const [leaseEnd, setLeaseEnd] = useState('2027-07-31'); // standard 11-month lease
  const [docCategory, setDocCategory] = useState<'Rent Agreement' | 'Police Verification' | 'ID Proof' | 'Other'>('Rent Agreement');
  const [notes, setNotes] = useState('');

  // Initial document upload
  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const getUnitPlaceholder = (type: PropertyType) => {
    switch (type) {
      case 'Flat':
        return 'Jaise: Flat 302, Pocket B, Mayur Vihar';
      case 'Duplex':
        return 'Jaise: Villa 12 / Kothi No. 4, Sector 15';
      case 'Shop':
        return 'Jaise: Shop G-4, Main Market Road';
      case 'Godown':
        return 'Jaise: Godown #3, Transport Nagar';
      default:
        return 'Jaise: Unit No. 101';
    }
  };

  if (!isOpen) return null;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type,
          dataUrl: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'Kirayedar ka naam zaroori hai (Tenant name is required)';
    if (!phone.trim()) newErrors.phone = 'WhatsApp reminder hetu mobile number zaroori hai';
    if (!unit.trim()) newErrors.unit = 'Makaan ya Flat / Kamra number likhein';
    if (!rentAmount || Number(rentAmount) <= 0) newErrors.rentAmount = 'Sahi mahina kiraya bharein';
    if (!leaseStart) newErrors.leaseStart = 'Agreement shuru hone ki tareekh bharein';
    if (!leaseEnd) newErrors.leaseEnd = 'Agreement samapt hone ki tareekh bharein';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const docs: LeaseDocument[] = [];
    if (selectedFile) {
      docs.push({
        id: `doc-${Date.now()}`,
        name: selectedFile.name,
        fileType: selectedFile.type,
        fileSize: selectedFile.size,
        uploadDate: new Date().toISOString().split('T')[0],
        documentType: docCategory,
        dataUrl: selectedFile.dataUrl,
        notes: 'Tenant onboarding ke waqt upload kiya gaya.',
      });
    }

    const newTenant: Tenant = {
      id: `t-${Date.now()}`,
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || `${name.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      propertyType,
      unit: unit.trim(),
      rentAmount: Number(rentAmount),
      securityDeposit: securityDeposit ? Number(securityDeposit) : Number(rentAmount) * 2,
      dueDay: Number(dueDay),
      leaseStart,
      leaseEnd,
      status: 'active',
      documents: docs,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddTenant(newTenant);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl my-8 bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
        {/* Header with authentic Indian context */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-600 rounded-xl">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Naya Kirayedar Jodein</span>
                <span className="text-xs font-semibold text-amber-300 bg-amber-900/60 px-2 py-0.5 rounded">
                  + नया किरायेदार
                </span>
              </h3>
              <p className="text-xs text-slate-300">
                Kirayedar profile, mobile no (WhatsApp reminder), kiraya hisab aur kagazat link karein
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Personal Info Grid */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              KIRAYEDAR CONTACT DETAILS (किरायेदार संपर्क)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kirayedar Ka Poora Naam *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (errors.name) setErrors({ ...errors, name: '' });
                  }}
                  placeholder="Jaise: Rahul Sharma, Amit Verma"
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 border-slate-300"
                />
                {errors.name && <p className="text-xs text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mobile Number (WhatsApp Reminder hetu) *
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => {
                      setPhone(e.target.value);
                      if (errors.phone) setErrors({ ...errors, phone: '' });
                    }}
                    placeholder="+91 98101 23456"
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 border-slate-300"
                  />
                </div>
                {errors.phone && <p className="text-xs text-rose-500 mt-1">{errors.phone}</p>}
                <p className="text-[11px] text-slate-500 mt-0.5">Is number par WhatsApp kiraya reminder aur UPI jayega</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email ID (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tenant@gmail.com"
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Property Ka Prakar (Type of Property) *
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-amber-600" />
                  <select
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="Flat">Flat (फ्लैट - Residential Flat / Apartment)</option>
                    <option value="Duplex">Duplex (डुप्लेक्स - Independent House / Villa)</option>
                    <option value="Shop">Shop (दुकान - Commercial Shop)</option>
                    <option value="Godown">Godown (गोदाम - Warehouse / Storage)</option>
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {propertyType === 'Flat' && 'Residential flat ya apartment'}
                  {propertyType === 'Duplex' && 'Independent duplex house ya kothi'}
                  {propertyType === 'Shop' && 'Commercial retail market dukaan'}
                  {propertyType === 'Godown' && 'Commercial godown ya storage warehouse'}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {propertyType === 'Shop'
                    ? 'Dukaan No. / Address (Shop Number) *'
                    : propertyType === 'Godown'
                    ? 'Godown No. / Shed (Godown Number) *'
                    : propertyType === 'Duplex'
                    ? 'Duplex / Kothi No. / Sector *'
                    : 'Flat / Unit / Kamra No. *'}
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      if (errors.unit) setErrors({ ...errors, unit: '' });
                    }}
                    placeholder={getUnitPlaceholder(propertyType)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
                  />
                </div>
                {errors.unit && <p className="text-xs text-rose-500 mt-1">{errors.unit}</p>}
              </div>
            </div>
          </div>

          {/* Rental Terms Grid */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              KIRAYA SHARTEIN &amp; DATES (किराया शर्तें)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mahina Kiraya ({currency}) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={rentAmount}
                    onChange={(e) => {
                      setRentAmount(e.target.value === '' ? '' : Number(e.target.value));
                      if (errors.rentAmount) setErrors({ ...errors, rentAmount: '' });
                    }}
                    placeholder="15000"
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
                  />
                </div>
                {errors.rentAmount && <p className="text-xs text-rose-500 mt-1">{errors.rentAmount}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Security Deposit ({currency})
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">₹</span>
                  <input
                    type="number"
                    min="0"
                    value={securityDeposit}
                    onChange={(e) => setSecurityDeposit(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="30000 (2 mahine ka)"
                    className="w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kiraya Due Tareekh
                </label>
                <select
                  value={dueDay}
                  onChange={(e) => setDueDay(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300 bg-white font-medium"
                >
                  <option value={1}>Har mahine ki 1 tareekh</option>
                  <option value={5}>Har mahine ki 5 tareekh (Standard)</option>
                  <option value={7}>Har mahine ki 7 tareekh</option>
                  <option value={10}>Har mahine ki 10 tareekh</option>
                  <option value={15}>Har mahine ki 15 tareekh</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreement Shuru Tareekh (Start Date) *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={leaseStart}
                    onChange={(e) => setLeaseStart(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agreement Samapt Tareekh (End Date - 11 Mahine) *
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={leaseEnd}
                    onChange={(e) => setLeaseEnd(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lease Document Upload with Indian Document categories */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                RENT AGREEMENT / POLICE VERIFICATION KAGAZAT
              </h4>
              <select
                value={docCategory}
                onChange={(e) => setDocCategory(e.target.value as any)}
                className="text-xs border border-slate-300 rounded px-2 py-1 bg-white font-medium"
              >
                <option value="Rent Agreement">Rent Agreement (किरायानामा)</option>
                <option value="Police Verification">Police Verification (पुलिस सत्यापन)</option>
                <option value="ID Proof">Aadhaar / Voter ID (पहचान पत्र)</option>
                <option value="Other">Anya Document</option>
              </select>
            </div>

            <div className="p-4 border-2 border-dashed border-amber-200 rounded-xl bg-amber-50/40 hover:bg-amber-50 transition text-center">
              {selectedFile ? (
                <div className="flex items-center justify-between p-3 bg-white border border-amber-200 rounded-lg text-left shadow-2xs">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-amber-600 shrink-0" />
                    <div>
                      <p className="text-sm font-bold text-slate-800">{selectedFile.name}</p>
                      <p className="text-xs text-slate-500">{selectedFile.size} • {docCategory} profile se judne ko taiyar</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="text-xs text-rose-600 hover:text-rose-700 font-bold px-2 py-1 rounded hover:bg-rose-50"
                  >
                    Hatao (Remove)
                  </button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <Upload className="w-7 h-7 text-amber-600 mx-auto mb-1.5" />
                  <span className="text-xs font-bold text-amber-800 hover:text-amber-900">
                    Kagazat upload karein (Rent Agreement / Police Verification / Aadhaar)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    PDF, Photo ya Scan copy (Max 10MB)
                  </p>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Shartein &amp; Khas Baatein (Special Conditions / Notes)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Jaise: Bijli meter reading alag hai (Rs. 9 per unit), 1 car parking slot shamil hai, paani ka bill kiraye me shamil hai."
              className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-amber-500 border-slate-300"
            />
          </div>

          {/* Action Buttons */}
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
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
            >
              Kirayedar Save Karein (+ जोड़ें)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
