import { useState } from 'react';
import {
  Search,
  Plus,
  Phone,
  Mail,
  Home,
  FileText,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  ArrowRight,
  LayoutGrid,
  List,
  MessageSquare,
} from 'lucide-react';
import { Tenant, Payment, PropertyOwnerSettings, TenantBalanceInfo } from '../types';
import { getWhatsAppReminderUrl } from '../services/reminderService';

interface TenantsTabProps {
  tenants: Tenant[];
  balances: Map<string, TenantBalanceInfo>;
  payments: Payment[];
  settings: PropertyOwnerSettings;
  onSelectTenant: (tenant: Tenant) => void;
  onOpenAddTenant: () => void;
  onOpenRecordPayment: (tenantId: string) => void;
}

export default function TenantsTab({
  tenants,
  balances,
  settings,
  onSelectTenant,
  onOpenAddTenant,
  onOpenRecordPayment,
}: TenantsTabProps) {
  const currency = settings.currencySymbol || '₹';
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'overdue' | 'due_soon' | 'paid'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Filter tenants
  const filteredTenants = tenants.filter((tenant) => {
    const matchesSearch =
      tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tenant.phone.includes(searchTerm) ||
      tenant.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const balanceInfo = balances.get(tenant.id);
    if (!balanceInfo) return true;

    if (filterStatus === 'overdue') return balanceInfo.currentMonthStatus === 'overdue';
    if (filterStatus === 'due_soon')
      return (
        balanceInfo.currentMonthStatus === 'due_soon' ||
        balanceInfo.currentMonthStatus === 'due_today'
      );
    if (filterStatus === 'paid')
      return (
        balanceInfo.currentMonthStatus === 'paid' ||
        balanceInfo.currentMonthStatus === 'advance'
      );

    return true;
  });

  const getStatusBadge = (status: TenantBalanceInfo['currentMonthStatus'], daysDiff: number) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Jama Hai / Paid (चुक्ता)
          </span>
        );
      case 'advance':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <CheckCircle2 className="w-3 h-3 text-purple-600" />
            Advance (अग्रिम)
          </span>
        );
      case 'due_today':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-950 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-700" />
            Aaj Due Hai (आज देय)
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertCircle className="w-3 h-3 text-rose-600" />
            Bakaya ({Math.abs(daysDiff)} din overdue)
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">
            <Clock className="w-3 h-3 text-sky-600" />
            {daysDiff} din bache hain
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header bar with Indian context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Kirayedar &amp; Leases</span>
            <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md">
              किरायेदार सूची
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kirayedaaron ka bahi-khata, mobile no, rent agreements aur WhatsApp reminder
          </p>
        </div>
        <button
          onClick={onOpenAddTenant}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Naya Kirayedar</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
        <div className="relative grow max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Kirayedar ka naam, Kamra/Flat, mobile khojein..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                filterStatus === 'all'
                  ? 'bg-white text-slate-900 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sabhi ({tenants.length})
            </button>
            <button
              onClick={() => setFilterStatus('overdue')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                filterStatus === 'overdue'
                  ? 'bg-white text-rose-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Bakaya (Overdue)
            </button>
            <button
              onClick={() => setFilterStatus('due_soon')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                filterStatus === 'due_soon'
                  ? 'bg-white text-amber-800 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Due Soon
            </button>
            <button
              onClick={() => setFilterStatus('paid')}
              className={`px-3 py-1 rounded-md transition font-medium ${
                filterStatus === 'paid'
                  ? 'bg-white text-emerald-700 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Jama (Paid)
            </button>
          </div>

          <div className="hidden sm:flex items-center border-l border-slate-200 pl-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table'
                  ? 'bg-slate-200 text-slate-900'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => {
            const balanceInfo = balances.get(tenant.id);
            const status = balanceInfo?.currentMonthStatus || 'due_soon';
            const daysDiff = balanceInfo?.daysDiff || 0;
            const outstanding = balanceInfo?.outstandingBalance ?? tenant.rentAmount;

            return (
              <div
                key={tenant.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs hover:shadow-md hover:border-amber-400 transition flex flex-col justify-between group"
              >
                <div>
                  {/* Top Unit & Status */}
                  <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 truncate">
                      <Home className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {tenant.unit}
                    </span>
                    {getStatusBadge(status, daysDiff)}
                  </div>

                  {/* Tenant Identity */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-slate-900 group-hover:text-amber-800 transition">
                      {tenant.name}
                    </h3>
                    <div className="mt-2 space-y-1 text-xs text-slate-500">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-mono text-slate-800 font-semibold">{tenant.phone}</span>
                        <a
                          href={balanceInfo ? getWhatsAppReminderUrl(tenant, balanceInfo, settings) : '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] font-bold text-emerald-800 hover:text-emerald-900 ml-1 px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-1"
                          title="WhatsApp par kiraya reminder bhejein"
                        >
                          <MessageSquare className="w-2.5 h-2.5" />
                          WhatsApp
                        </a>
                      </div>
                      <div className="flex items-center gap-2 truncate">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="truncate">{tenant.email || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Financial Details in Indian Rupee */}
                  <div className="grid grid-cols-2 gap-2 mt-4 p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block uppercase">
                        Mahina Kiraya
                      </span>
                      <span className="font-black text-slate-900 mt-0.5 block">
                        {currency}{tenant.rentAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500">Har mahine {tenant.dueDay} tareekh</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 font-medium block uppercase">
                        Kul Bakaya (Due)
                      </span>
                      <span
                        className={`font-black mt-0.5 block ${
                          outstanding > 0
                            ? 'text-rose-700'
                            : outstanding < 0
                            ? 'text-purple-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {currency}{outstanding.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {outstanding > 0 ? 'Bakaya hai' : 'Sab clear hai'}
                      </span>
                    </div>
                  </div>

                  {/* Lease Document Counter */}
                  <div className="flex items-center gap-2 mt-3 text-xs text-slate-500">
                    <FileText className="w-3.5 h-3.5 text-indigo-600" />
                    <span>
                      {tenant.documents.length} Kagazat/Docs linked (
                      {tenant.documents[0]?.documentType || 'Rent Agreement'})
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center justify-between gap-2 pt-4 mt-4 border-t border-slate-100">
                  <button
                    onClick={() => onOpenRecordPayment(tenant.id)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition border border-emerald-200"
                  >
                    <CreditCard className="w-3 h-3" />
                    <span>Kiraya Jama (+ जमा)</span>
                  </button>

                  <button
                    onClick={() => onSelectTenant(tenant)}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-bold text-indigo-700 hover:text-indigo-800 hover:bg-indigo-50 rounded-lg transition"
                  >
                    <span>Khata Dashboard</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
              <tr>
                <th className="py-3 px-4">Kirayedar &amp; Unit</th>
                <th className="py-3 px-4">Mobile &amp; Email</th>
                <th className="py-3 px-4">Mahina Kiraya</th>
                <th className="py-3 px-4">Kul Bakaya</th>
                <th className="py-3 px-4">Status (हाल)</th>
                <th className="py-3 px-4">Kagazat</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTenants.map((tenant) => {
                const balanceInfo = balances.get(tenant.id);
                const status = balanceInfo?.currentMonthStatus || 'due_soon';
                const daysDiff = balanceInfo?.daysDiff || 0;
                const outstanding = balanceInfo?.outstandingBalance ?? tenant.rentAmount;

                return (
                  <tr key={tenant.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{tenant.name}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Home className="w-3 h-3 text-amber-600" />
                        {tenant.unit}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-mono text-slate-800 font-semibold">{tenant.phone}</div>
                      <div className="text-[11px] text-slate-500">{tenant.email || 'N/A'}</div>
                    </td>

                    <td className="py-3 px-4">
                      <span className="font-bold text-slate-900">
                        {currency}{tenant.rentAmount.toLocaleString('en-IN')}
                      </span>
                      <span className="block text-[10px] text-slate-400">Due {tenant.dueDay}th</span>
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`font-black ${
                          outstanding > 0
                            ? 'text-rose-700'
                            : outstanding < 0
                            ? 'text-purple-700'
                            : 'text-emerald-700'
                        }`}
                      >
                        {currency}{outstanding.toLocaleString('en-IN')}
                      </span>
                    </td>

                    <td className="py-3 px-4">{getStatusBadge(status, daysDiff)}</td>

                    <td className="py-3 px-4 text-slate-600">
                      <span className="inline-flex items-center gap-1 text-[11px] text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        <FileText className="w-3 h-3 text-indigo-600" />
                        {tenant.documents.length} Docs
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right space-x-2">
                      <button
                        onClick={() => onOpenRecordPayment(tenant.id)}
                        className="px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-md transition border border-emerald-200"
                      >
                        + Jama
                      </button>
                      <button
                        onClick={() => onSelectTenant(tenant)}
                        className="px-2.5 py-1 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50 rounded-md transition"
                      >
                        Khata
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {filteredTenants.length === 0 && (
        <div className="py-16 text-center border border-dashed border-slate-200 rounded-xl bg-white">
          <Home className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-800">Koi kirayedar nahi mila</p>
          <p className="text-xs text-slate-400 mt-0.5">
            Naam ya mobile number dobara check karein, ya naya kirayedar add karein.
          </p>
        </div>
      )}
    </div>
  );
}
