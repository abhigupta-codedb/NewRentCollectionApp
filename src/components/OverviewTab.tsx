import {
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Plus,
  CreditCard,
  Bell,
  Download,
  Eye,
  ArrowRight,
  Home,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import {
  Tenant,
  Payment,
  PropertyOwnerSettings,
  TenantBalanceInfo,
} from '../types';
import { downloadReceiptPdf } from '../services/pdfGenerator';
import { getWhatsAppReminderUrl } from '../services/reminderService';

interface OverviewTabProps {
  tenants: Tenant[];
  payments: Payment[];
  balances: Map<string, TenantBalanceInfo>;
  settings: PropertyOwnerSettings;
  onOpenAddTenant: () => void;
  onOpenRecordPayment: (tenantId?: string) => void;
  onSelectTenant: (tenant: Tenant) => void;
  onViewReceipt: (payment: Payment) => void;
  onNavigateTab: (tab: string) => void;
}

export default function OverviewTab({
  tenants,
  payments,
  balances,
  settings,
  onOpenAddTenant,
  onOpenRecordPayment,
  onSelectTenant,
  onViewReceipt,
  onNavigateTab,
}: OverviewTabProps) {
  const currency = settings.currencySymbol || '₹';

  // Current month calculations
  const now = new Date();
  const currentMonthName = now.toLocaleString('hi-IN', { month: 'long', year: 'numeric' }) ||
    now.toLocaleString('default', { month: 'long', year: 'numeric' });

  const activeTenants = tenants.filter((t) => t.status === 'active');
  const totalMonthlyExpected = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0);

  // Total collected for this current month
  const thisMonthPayments = payments.filter((p) => {
    const pDate = new Date(p.date);
    return (
      p.monthCovered.toLowerCase().includes(now.toLocaleString('default', { month: 'long' }).toLowerCase()) ||
      (!isNaN(pDate.getTime()) &&
        pDate.getMonth() === now.getMonth() &&
        pDate.getFullYear() === now.getFullYear())
    );
  });
  const totalCollectedThisMonth = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

  // Total outstanding across all tenants
  let totalOutstanding = 0;
  let overdueCount = 0;
  let dueSoonCount = 0;

  activeTenants.forEach((t) => {
    const info = balances.get(t.id);
    if (info) {
      if (info.outstandingBalance > 0) {
        totalOutstanding += info.outstandingBalance;
      }
      if (info.currentMonthStatus === 'overdue') {
        overdueCount++;
      } else if (
        info.currentMonthStatus === 'due_soon' ||
        info.currentMonthStatus === 'due_today'
      ) {
        dueSoonCount++;
      }
    }
  });

  const collectionRate =
    totalMonthlyExpected > 0
      ? Math.min(100, Math.round((totalCollectedThisMonth / totalMonthlyExpected) * 100))
      : 100;

  // Sorted list of tenants needing attention (overdue first, then due soon)
  const attentionTenants = [...activeTenants]
    .map((t) => ({ tenant: t, balanceInfo: balances.get(t.id) }))
    .filter((item) => {
      const status = item.balanceInfo?.currentMonthStatus;
      return status === 'overdue' || status === 'due_today' || status === 'due_soon';
    })
    .sort((a, b) => (a.balanceInfo?.daysDiff ?? 0) - (b.balanceInfo?.daysDiff ?? 0));

  // Recent payments
  const recentPayments = [...payments]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Actions in North Indian context */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-amber-950 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-semibold mb-2 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            {currentMonthName} का खाता सारांश (Khata Overview)
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>{settings.businessName}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Makaan Malik Portal: Kiraya Vasooli, WhatsApp Reminder, HRA-ready Kiraya Rashid aur Bahi-Khata hisab.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onOpenRecordPayment()}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition"
          >
            <CreditCard className="w-4 h-4" />
            <span>Kiraya Jama (+ किराया)</span>
          </button>
          <button
            onClick={onOpenAddTenant}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-amber-100 hover:bg-amber-200 rounded-xl shadow-xs transition border border-amber-300"
          >
            <Plus className="w-4 h-4 text-amber-900" />
            <span>+ Naya Kirayedar</span>
          </button>
          <button
            onClick={() => onNavigateTab('reminders')}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 hover:text-white bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-xl transition"
          >
            <Bell className="w-4 h-4 text-amber-400" />
            <span>Reminder ({overdueCount + dueSoonCount})</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid with Indian rupee and Hinglish labels */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Kul Kiraya (Expected)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900">
              {currency}{totalMonthlyExpected.toLocaleString('en-IN')}
            </span>
            <div className="p-2 bg-slate-100 text-slate-600 rounded-xl font-bold">
              ₹
            </div>
          </div>
          <span className="text-[11px] text-slate-500 block mt-1">
            {activeTenants.length} kamre / flats ka kiraya
          </span>
        </div>

        {/* Collected */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-2xs bg-emerald-50/20">
          <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
            Kul Vasooli (Collected)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-emerald-700">
              {currency}{totalCollectedThisMonth.toLocaleString('en-IN')}
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="w-full bg-emerald-100 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-600 h-full rounded-full transition-all"
              style={{ width: `${collectionRate}%` }}
            ></div>
          </div>
          <span className="text-[10px] text-emerald-700 font-semibold block mt-1">
            {collectionRate}% kiraya jama ho gaya
          </span>
        </div>

        {/* Outstanding Dues */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-2xs bg-rose-50/20">
          <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider block">
            Kul Bakaya (Pending)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-rose-700">
              {currency}{totalOutstanding.toLocaleString('en-IN')}
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[11px] text-rose-600 font-medium block mt-1">
            {overdueCount} overdue • {dueSoonCount} tareekh paas hai
          </span>
        </div>

        {/* Portfolio Occupancy */}
        <div className="bg-white border border-amber-200 rounded-2xl p-5 shadow-2xs bg-amber-50/20">
          <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
            Kirayedar (Occupancy)
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-black text-amber-950">{activeTenants.length} Flats</span>
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Home className="w-4 h-4" />
            </div>
          </div>
          <span className="text-[11px] text-amber-800 block mt-1">
            100% occupied • Agreement saved
          </span>
        </div>
      </div>

      {/* 2-Column Section: Upcoming Dues & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming & Overdue Rent (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <span>Kiraya Reminder List (किराया रिमाइंडर)</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                  {attentionTenants.length} Dues
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Kirayedaaron ko sidha WhatsApp par payment reminder aur UPI bhejein
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('tenants')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Sabhi Kirayedar
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {attentionTenants.length === 0 ? (
            <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-1.5" />
              <p className="text-xs font-bold text-slate-800">Badhai ho! Koi bhi bakaya nahi hai.</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Sabhi kirayedaaron ka is mahine ka hisab poori tarah clear hai.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {attentionTenants.map(({ tenant, balanceInfo }) => {
                if (!balanceInfo) return null;
                const isOverdue = balanceInfo.currentMonthStatus === 'overdue';
                const isToday = balanceInfo.currentMonthStatus === 'due_today';

                return (
                  <div
                    key={tenant.id}
                    className="p-3.5 bg-slate-50/80 hover:bg-white border border-slate-200 rounded-xl transition shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectTenant(tenant)}
                          className="font-bold text-slate-900 text-xs hover:text-indigo-600 text-left"
                        >
                          {tenant.name}
                        </button>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            isOverdue
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : isToday
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-sky-100 text-sky-800 border border-sky-200'
                          }`}
                        >
                          {isOverdue
                            ? `Overdue (${Math.abs(balanceInfo.daysDiff)} din pehle)`
                            : isToday
                            ? 'Aaj due hai'
                            : `${balanceInfo.daysDiff} din bache hain`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500">
                        <span className="font-semibold text-slate-700">{tenant.unit}</span>
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 text-[10px] font-bold border border-amber-200">
                          {tenant.propertyType || 'Flat'}
                        </span>
                        <span>•</span>
                        <span>Mobile: {tenant.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-slate-400 block uppercase font-medium">
                          Bakaya Kiraya
                        </span>
                        <span className="text-sm font-extrabold text-slate-900">
                          {currency}
                          {(balanceInfo.outstandingBalance > 0
                            ? balanceInfo.outstandingBalance
                            : tenant.rentAmount
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={getWhatsAppReminderUrl(tenant, balanceInfo, settings)}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
                          title="WhatsApp par kiraya reminder bhejein"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="hidden sm:inline">WhatsApp</span>
                        </a>

                        <button
                          onClick={() => onOpenRecordPayment(tenant.id)}
                          className="px-2.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition"
                        >
                          + Jama
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Transactions & PDF Receipts (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Taaza Kiraya Rashidein (Receipts)</h3>
              <p className="text-xs text-slate-500">HRA-valid PDF rashid download karein</p>
            </div>
            <button
              onClick={() => onNavigateTab('reports')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Bahi-Khata
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2.5">
            {recentPayments.map((payment) => {
              const tenant = tenants.find((t) => t.id === payment.tenantId);

              return (
                <div
                  key={payment.id}
                  className="p-3 bg-slate-50/80 hover:bg-white border border-slate-200 rounded-xl transition shadow-2xs flex items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate max-w-[130px]">
                        {payment.tenantName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {payment.receiptNumber}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500">
                      <span>{payment.monthCovered}</span>
                      <span>•</span>
                      <span className="font-medium text-slate-700">{payment.paymentMethod}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-black text-emerald-700">
                      {currency}{payment.amount.toLocaleString('en-IN')}
                    </span>

                    <button
                      onClick={() => onViewReceipt(payment)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="रसीद देखें (View Receipt)"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => {
                        if (tenant) {
                          downloadReceiptPdf(payment, tenant, settings);
                        }
                      }}
                      className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                      title="PDF रसीद डाउनलोड करें"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
