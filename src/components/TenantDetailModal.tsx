import { useState, ChangeEvent, FormEvent } from 'react';
import {
  X,
  Phone,
  Mail,
  Home,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  MessageSquare,
  FileText,
  Upload,
  Download,
  Eye,
  Trash2,
  Plus,
  Edit2,
  Save,
  CreditCard,
} from 'lucide-react';
import {
  Tenant,
  Payment,
  PropertyOwnerSettings,
  TenantBalanceInfo,
  LeaseDocument,
  ReminderLog,
} from '../types';
import { downloadReceiptPdf } from '../services/pdfGenerator';
import {
  getWhatsAppReminderUrl,
  getEmailReminderUrl,
  createReminderLog,
} from '../services/reminderService';

interface TenantDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  balanceInfo: TenantBalanceInfo;
  payments: Payment[];
  reminderLogs: ReminderLog[];
  settings: PropertyOwnerSettings;
  onUpdateTenant: (updated: Tenant) => void;
  onOpenRecordPayment: (tenantId: string) => void;
  onViewReceipt: (payment: Payment) => void;
  onViewDocument: (doc: LeaseDocument, tenant: Tenant) => void;
  onLogReminder: (log: ReminderLog) => void;
}

export default function TenantDetailModal({
  isOpen,
  onClose,
  tenant,
  balanceInfo,
  payments,
  reminderLogs,
  settings,
  onUpdateTenant,
  onOpenRecordPayment,
  onViewReceipt,
  onViewDocument,
  onLogReminder,
}: TenantDetailModalProps) {
  const currency = settings.currencySymbol || '₹';
  const tenantPayments = payments.filter((p) => p.tenantId === tenant.id);
  const tenantReminders = reminderLogs.filter((r) => r.tenantId === tenant.id);

  const [activeTab, setActiveTab] = useState<'payments' | 'documents' | 'reminders' | 'profile'>('payments');
  
  // Document upload state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docType, setDocType] = useState<LeaseDocument['documentType']>('Rent Agreement');
  const [docNotes, setDocNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    dataUrl?: string;
  } | null>(null);

  // Edit tenant info state
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editPhone, setEditPhone] = useState(tenant.phone);
  const [editEmail, setEditEmail] = useState(tenant.email);
  const [editRent, setEditRent] = useState(tenant.rentAmount);
  const [editDueDay, setEditDueDay] = useState(tenant.dueDay);
  const [editNotes, setEditNotes] = useState(tenant.notes || '');

  if (!isOpen) return null;

  // Handle WhatsApp Reminder Dispatch
  const handleSendWhatsApp = () => {
    const url = getWhatsAppReminderUrl(tenant, balanceInfo, settings);
    window.open(url, '_blank');

    // Create log
    const log = createReminderLog(
      tenant,
      balanceInfo,
      'whatsapp',
      `WhatsApp reminder bheja gaya for ${tenant.unit}. Kul Bakaya: ${currency}${balanceInfo.outstandingBalance.toLocaleString('en-IN')}`,
      undefined,
      false
    );
    onLogReminder(log);
  };

  // Handle Email Reminder Dispatch
  const handleSendEmail = () => {
    const url = getEmailReminderUrl(tenant, balanceInfo, settings);
    window.location.href = url;

    // Create log
    const log = createReminderLog(
      tenant,
      balanceInfo,
      'email',
      `Email reminder bheja gaya for ${tenant.unit}. Due date: ${balanceInfo.currentMonthDueDate}`,
      `Kiraya Due Reminder - ${tenant.unit}`,
      false
    );
    onLogReminder(log);
  };

  // Handle Lease Document Upload
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          type: file.type,
          dataUrl: reader.result as string,
        });
        if (!docTitle) setDocTitle(file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveDocument = (e: FormEvent) => {
    e.preventDefault();
    if (!uploadedFile) return;

    const newDoc: LeaseDocument = {
      id: `doc-${Date.now()}`,
      name: docTitle.trim() || uploadedFile.name,
      fileType: uploadedFile.type,
      fileSize: uploadedFile.size,
      uploadDate: new Date().toISOString().split('T')[0],
      documentType: docType,
      dataUrl: uploadedFile.dataUrl,
      notes: docNotes.trim(),
    };

    const updatedTenant: Tenant = {
      ...tenant,
      documents: [newDoc, ...tenant.documents],
    };

    onUpdateTenant(updatedTenant);
    setShowUploadModal(false);
    setUploadedFile(null);
    setDocTitle('');
    setDocNotes('');
  };

  const handleDeleteDocument = (docId: string) => {
    if (window.confirm('Kya aap is kagazat ko hatana chahte hain?')) {
      const updatedTenant: Tenant = {
        ...tenant,
        documents: tenant.documents.filter((d) => d.id !== docId),
      };
      onUpdateTenant(updatedTenant);
    }
  };

  const handleSaveProfile = () => {
    const updatedTenant: Tenant = {
      ...tenant,
      phone: editPhone.trim(),
      email: editEmail.trim(),
      rentAmount: Number(editRent),
      dueDay: Number(editDueDay),
      notes: editNotes.trim(),
    };
    onUpdateTenant(updatedTenant);
    setIsEditingProfile(false);
  };

  // Status styling
  const getStatusBadge = () => {
    switch (balanceInfo.currentMonthStatus) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Kiraya Jama Hai (चुक्ता)
          </span>
        );
      case 'advance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Advance Jama (अग्रिम)
          </span>
        );
      case 'due_today':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-700" />
            Aaj Due Hai (आज देय)
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
            Bakaya: {Math.abs(balanceInfo.daysDiff)} Din Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold rounded-full bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3.5 h-3.5 text-sky-600" />
            {balanceInfo.daysDiff} Din Bache Hain ({balanceInfo.currentMonthDueDate})
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl my-6 bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Card */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-extrabold text-white tracking-tight">{tenant.name}</h2>
                {getStatusBadge()}
              </div>
              <p className="text-sm text-slate-300 flex items-center gap-2">
                <Home className="w-4 h-4 text-amber-400" />
                <span>{tenant.unit}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Contact & Action Ribbon */}
          <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-slate-800 text-xs">
            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <span className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-amber-400" />
                <strong className="text-white font-mono">{tenant.phone}</strong>
              </span>
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                <span>{tenant.email || 'Email N/A'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Kiraya Tareekh: Har mahine {tenant.dueDay} tareekh</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSendWhatsApp}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-xs transition"
                title="WhatsApp par kiraya reminder bhejein"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Reminder</span>
              </button>
              <button
                onClick={handleSendEmail}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium rounded-lg border border-slate-700 transition"
                title="Email reminder bhejein"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email Reminder</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial KPI Banner in Indian context */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Mahina Kiraya</span>
            <span className="text-base font-black text-slate-900 block mt-0.5">
              {currency}{tenant.rentAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Due on {tenant.dueDay}th of month</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Kul Bakaya (Due)</span>
            <span
              className={`text-base font-black block mt-0.5 ${
                balanceInfo.outstandingBalance > 0
                  ? 'text-rose-700'
                  : balanceInfo.outstandingBalance < 0
                  ? 'text-purple-700'
                  : 'text-emerald-700'
              }`}
            >
              {currency}{balanceInfo.outstandingBalance.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {balanceInfo.outstandingBalance > 0 ? 'Reminder bacha hua hai' : 'Sab hisab clear hai'}
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Kul Kiraya Prapt</span>
            <span className="text-base font-black text-emerald-800 block mt-0.5">
              {currency}{balanceInfo.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">
              {tenantPayments.length} entries bahi-khata me
            </span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-xl">
            <span className="text-[11px] font-bold text-slate-500 block uppercase">Security Deposit</span>
            <span className="text-base font-black text-slate-800 block mt-0.5">
              {currency}{tenant.securityDeposit.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Amanat rashi (Escrow)</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 border-b border-slate-200 bg-white shrink-0">
          <div className="flex space-x-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab('payments')}
              className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'payments'
                  ? 'border-indigo-700 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Bahi-Khata &amp; Rashidein ({tenantPayments.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'documents'
                  ? 'border-indigo-700 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Kirayanama &amp; Kagazat ({tenant.documents.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'reminders'
                  ? 'border-indigo-700 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Reminder Logs ({tenantReminders.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3.5 border-b-2 transition flex items-center gap-2 ${
                activeTab === 'profile'
                  ? 'border-indigo-700 text-indigo-700 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>Kirayedar Profile</span>
            </button>
          </div>

          <button
            onClick={() => onOpenRecordPayment(tenant.id)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Kiraya Jama (+ जमा)</span>
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-6 overflow-y-auto grow">
          {/* TAB 1: PAYMENTS */}
          {activeTab === 'payments' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Recorded Rent Transactions (किराया बही-खाता)</h3>
                  <p className="text-xs text-slate-500">
                    Sabhi prapt kiraya entries aur IT-department HRA-valid Kiraya Rashid (PDF)
                  </p>
                </div>
              </div>

              {tenantPayments.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <CreditCard className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Abhi tak koi kiraya jama nahi hua</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    "Kiraya Jama (+ जमा)" par click karein aur verified receipt download karein.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                      <tr>
                        <th className="py-3 px-4">Rashid #</th>
                        <th className="py-3 px-4">Tareekh</th>
                        <th className="py-3 px-4">Mahina</th>
                        <th className="py-3 px-4">Jama Rashi</th>
                        <th className="py-3 px-4">Payment Madhyam &amp; UTR</th>
                        <th className="py-3 px-4 text-right">Kiraya Rashid (PDF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {tenantPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">
                            {p.receiptNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{p.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-800">{p.monthCovered}</td>
                          <td className="py-3 px-4 font-black text-emerald-800">
                            {currency}{p.amount.toLocaleString('en-IN')}
                          </td>
                          <td className="py-3 px-4 text-slate-600">
                            <span className="font-bold text-slate-800">{p.paymentMethod}</span>
                            {p.referenceId && (
                              <span className="block text-[10px] text-slate-400 font-mono">
                                {p.referenceId}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              onClick={() => onViewReceipt(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </button>
                            <button
                              onClick={() =>
                                downloadReceiptPdf(p, tenant, settings, balanceInfo.outstandingBalance)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md border border-emerald-300 transition"
                            >
                              <Download className="w-3 h-3" />
                              HRA PDF
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: LEASE DOCUMENTS */}
          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Rent Agreement &amp; Police Verification Kagazat
                  </h3>
                  <p className="text-xs text-slate-500">
                    Kirayanama (Agreement copy), Police Verification, Aadhaar ID aur bijli bill upload karein
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
                >
                  <Upload className="w-3.5 h-3.5" />
                  + Naya Document Upload
                </button>
              </div>

              {tenant.documents.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Koi kagazat upload nahi hai</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Signed rent agreement copy ya police verification document is profile me jodein.
                  </p>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Agreement Copy Upload Karein
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {tenant.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-start justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-300 transition shadow-2xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-amber-50 text-amber-700 rounded-lg shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-bold text-slate-900 line-clamp-1">{doc.name}</h4>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500">
                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded font-bold">
                              {doc.documentType}
                            </span>
                            <span>•</span>
                            <span>{doc.fileSize}</span>
                            <span>•</span>
                            <span>{doc.uploadDate}</span>
                          </div>
                          {doc.notes && (
                            <p className="text-[11px] text-slate-500 italic line-clamp-1">
                              {doc.notes}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          onClick={() => onViewDocument(doc, tenant)}
                          className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-md transition"
                          title="Preview Document"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onViewDocument(doc, tenant)}
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition"
                          title="Download Document"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                          title="Delete Document"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REMINDER LOGS */}
          {activeTab === 'reminders' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kiraya Reminder History (रिमाइंडर हिस्ट्री)</h3>
                  <p className="text-xs text-slate-500">
                    Kirayedar ko bheje gaye WhatsApp aur email payment reminders ka bahi-khata
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSendWhatsApp}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-300 transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    WhatsApp Reminder
                  </button>
                  <button
                    onClick={handleSendEmail}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    Email Reminder
                  </button>
                </div>
              </div>

              {tenantReminders.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <MessageSquare className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-bold text-slate-700">Koi reminder message nahi bheja gaya</p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    WhatsApp reminder bhejne ke baad log yahan darj hoga.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tenantReminders.map((rem) => (
                    <div
                      key={rem.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-2xs space-y-2 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                              rem.channel === 'whatsapp'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {rem.channel}
                          </span>
                          <span className="text-slate-500">{new Date(rem.sentAt).toLocaleString('en-IN')}</span>
                          {rem.isAutomated && (
                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                              Automated Reminder
                            </span>
                          )}
                        </div>
                        <span className="text-slate-600 font-mono font-semibold">{rem.recipientContact}</span>
                      </div>
                      <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 whitespace-pre-line font-sans">
                        {rem.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: LEASE PROFILE & EDIT */}
          {activeTab === 'profile' && (
            <div className="space-y-5 max-w-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Kirayedar Profile &amp; Shartein</h3>
                  <p className="text-xs text-slate-500">
                    Kirayedar ka mobile number, mahina kiraya aur contract details
                  </p>
                </div>
                {!isEditingProfile ? (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50 rounded-lg border border-indigo-200 transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit Profile
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsEditingProfile(false)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
                    >
                      Radd (Cancel)
                    </button>
                    <button
                      onClick={handleSaveProfile}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Save Karein
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mobile (WhatsApp Reminder)</label>
                    {isEditingProfile ? (
                      <input
                        type="text"
                        value={editPhone}
                        onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-md border-slate-300 focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <span className="font-bold text-slate-900 font-mono">{tenant.phone}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Email ID</label>
                    {isEditingProfile ? (
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 border rounded-md border-slate-300 focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <span className="font-semibold text-slate-900">{tenant.email || 'N/A'}</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Mahina Kiraya</label>
                    {isEditingProfile ? (
                      <input
                        type="number"
                        value={editRent}
                        onChange={(e) => setEditRent(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border rounded-md border-slate-300 focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <span className="font-black text-slate-900">{currency}{tenant.rentAmount.toLocaleString('en-IN')}</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-slate-500 font-semibold mb-1">Kiraya Due Tareekh</label>
                    {isEditingProfile ? (
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={editDueDay}
                        onChange={(e) => setEditDueDay(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 border rounded-md border-slate-300 focus:ring-1 focus:ring-amber-500"
                      />
                    ) : (
                      <span className="font-bold text-slate-900">Har mahine {tenant.dueDay} tareekh</span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-slate-500 font-semibold">Agreement Shuru (Start Date)</span>
                    <span className="font-bold text-slate-900">{tenant.leaseStart}</span>
                  </div>
                  <div>
                    <span className="block text-slate-500 font-semibold">Agreement Samapt (11 Mahine)</span>
                    <span className="font-bold text-slate-900">{tenant.leaseEnd}</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 font-semibold mb-1">Khas Shartein &amp; Notes</label>
                  {isEditingProfile ? (
                    <textarea
                      rows={2}
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      className="w-full px-2.5 py-1.5 border rounded-md border-slate-300 focus:ring-1 focus:ring-amber-500"
                    />
                  ) : (
                    <p className="text-slate-700 bg-slate-50 p-2.5 rounded-lg">
                      {tenant.notes || 'Koi khas shart darj nahi hai.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Upload Document Sub-Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-amber-200 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 bg-slate-900 text-white">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-amber-400" />
                  <h4 className="text-sm font-bold">Kagazat Upload Karein</h4>
                </div>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-1 text-slate-400 hover:text-white rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveDocument} className="p-5 space-y-3.5 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Document Prakar (Category)
                  </label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value as LeaseDocument['documentType'])}
                    className="w-full px-3 py-2 border rounded-lg border-slate-300 bg-white font-medium"
                  >
                    <option value="Rent Agreement">Rent Agreement (किरायानामा / Contract)</option>
                    <option value="Police Verification">Police Verification (पुलिस सत्यापन)</option>
                    <option value="ID Proof">Aadhaar / Voter ID (पहचान पत्र)</option>
                    <option value="Addendum">Agreement Renewal / Extension</option>
                    <option value="Other">Anya Kagazat / Bijli Bill</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Document Ka Naam *
                  </label>
                  <input
                    type="text"
                    value={docTitle}
                    onChange={(e) => setDocTitle(e.target.value)}
                    placeholder="Jaise: Rent_Agreement_2026.pdf, Police_Verification.pdf"
                    className="w-full px-3 py-2 border rounded-lg border-slate-300"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">File Chunein (Select File) *</label>
                  <div className="p-3 border-2 border-dashed border-amber-200 rounded-lg text-center bg-amber-50/50">
                    {uploadedFile ? (
                      <p className="font-bold text-amber-800">
                        Selected: {uploadedFile.name} ({uploadedFile.size})
                      </p>
                    ) : (
                      <label className="cursor-pointer block">
                        <Upload className="w-6 h-6 text-amber-600 mx-auto mb-1" />
                        <span className="font-bold text-amber-800">File chunein ya yahan drop karein</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                          required
                        />
                      </label>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Vivaran / Notes (Optional)</label>
                  <input
                    type="text"
                    value={docNotes}
                    onChange={(e) => setDocNotes(e.target.value)}
                    placeholder="Jaise: Notarized copy, 11 mahine ka stamp paper"
                    className="w-full px-3 py-2 border rounded-lg border-slate-300"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                  >
                    Radd Karein
                  </button>
                  <button
                    type="submit"
                    disabled={!uploadedFile}
                    className="px-4 py-1.5 font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg disabled:opacity-50"
                  >
                    Save &amp; Link Karein
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
