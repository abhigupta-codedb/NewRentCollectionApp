import { useState, useMemo } from 'react';
import {
  Calendar,
  Download,
  FileSpreadsheet,
  TrendingUp,
  DollarSign,
  CheckCircle2,
  AlertCircle,
  FileText,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import { Tenant, Payment, PropertyOwnerSettings, TenantBalanceInfo } from '../types';
import { generateMonthlyReportPdf } from '../services/pdfGenerator';

interface MonthlyReportTabProps {
  tenants: Tenant[];
  payments: Payment[];
  balances: Map<string, TenantBalanceInfo>;
  settings: PropertyOwnerSettings;
  hasMorePayments?: boolean;
  isLoadingMorePayments?: boolean;
  onLoadMorePayments?: () => void;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export default function MonthlyReportTab({
  tenants,
  payments,
  balances,
  settings,
  hasMorePayments,
  isLoadingMorePayments,
  onLoadMorePayments,
}: MonthlyReportTabProps) {
  const currency = settings.currencySymbol || '₹';

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(8); // 8 = September

  const currentMonthName = MONTHS[selectedMonthIndex];
  const targetPeriodStr = `${currentMonthName} ${selectedYear}`;

  // Calculate monthly stats
  const monthlyStats = useMemo(() => {
    // Total expected for this month across active tenants
    const activeTenants = tenants.filter((t) => t.status === 'active');
    const totalExpected = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0);

    // Payments matching this month
    const matchingPayments = payments.filter((p) => {
      const matchCovered = p.monthCovered.toLowerCase().includes(currentMonthName.toLowerCase());
      const pDate = new Date(p.date);
      const matchDate =
        !isNaN(pDate.getTime()) &&
        pDate.getFullYear() === selectedYear &&
        pDate.getMonth() === selectedMonthIndex;
      return matchCovered || matchDate;
    });

    const totalCollected = matchingPayments.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = Math.max(0, totalExpected - totalCollected);
    const collectionRate = totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 100;

    // Payment method breakdown
    const methodSplit: Record<string, number> = {};
    matchingPayments.forEach((p) => {
      methodSplit[p.paymentMethod] = (methodSplit[p.paymentMethod] || 0) + p.amount;
    });

    // Tenant breakdown rows
    const tenantRows = activeTenants.map((tenant) => {
      const tenantPaymentsForMonth = matchingPayments.filter((p) => p.tenantId === tenant.id);
      const paid = tenantPaymentsForMonth.reduce((sum, p) => sum + p.amount, 0);
      const balance = tenant.rentAmount - paid;

      let status = 'Pending';
      if (paid >= tenant.rentAmount) {
        status = 'Paid';
      } else if (paid > 0) {
        status = 'Partial';
      } else {
        const balanceInfo = balances.get(tenant.id);
        if (balanceInfo?.currentMonthStatus === 'overdue') {
          status = 'Overdue';
        } else {
          status = 'Pending';
        }
      }

      return {
        tenantName: tenant.name,
        propertyType: tenant.propertyType || 'Flat',
        unit: tenant.unit,
        rentAmount: tenant.rentAmount,
        paidAmount: paid,
        balance: Math.max(0, balance),
        status,
        paymentMode: tenantPaymentsForMonth[0]?.paymentMethod || '—',
        receiptNumber: tenantPaymentsForMonth[0]?.receiptNumber || '—',
        date: tenantPaymentsForMonth[0]?.date || '—',
      };
    });

    const paidTenantsCount = tenantRows.filter((r) => r.status === 'Paid').length;

    return {
      totalExpected,
      totalCollected,
      totalPending,
      collectionRate,
      paidTenantsCount,
      totalTenants: activeTenants.length,
      methodSplit,
      tenantRows,
      matchingPayments,
    };
  }, [tenants, payments, balances, selectedYear, selectedMonthIndex, currentMonthName]);

  // Annual overview for Bar Chart
  const annualTrends = useMemo(() => {
    return MONTHS.map((month, idx) => {
      const activeTenants = tenants.filter((t) => t.status === 'active');
      const expected = activeTenants.reduce((sum, t) => sum + t.rentAmount, 0);

      const collected = payments
        .filter((p) => {
          const matchCovered = p.monthCovered.toLowerCase().includes(month.toLowerCase());
          const pDate = new Date(p.date);
          const matchDate =
            !isNaN(pDate.getTime()) &&
            pDate.getFullYear() === selectedYear &&
            pDate.getMonth() === idx;
          return matchCovered || matchDate;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      return {
        month: month.substring(0, 3),
        fullName: month,
        expected,
        collected,
        rate: expected > 0 ? Math.round((collected / expected) * 100) : 0,
      };
    });
  }, [tenants, payments, selectedYear]);

  // Export PDF Report
  const handleExportPdf = () => {
    const doc = generateMonthlyReportPdf(
      currentMonthName,
      selectedYear,
      {
        totalExpected: monthlyStats.totalExpected,
        totalCollected: monthlyStats.totalCollected,
        totalPending: monthlyStats.totalPending,
        collectionRate: monthlyStats.collectionRate,
        totalTenants: monthlyStats.totalTenants,
        paidTenantsCount: monthlyStats.paidTenantsCount,
      },
      monthlyStats.tenantRows,
      settings
    );
    doc.save(`Kiraya_Report_${currentMonthName}_${selectedYear}.pdf`);
  };

  // Export CSV Report
  const handleExportCsv = () => {
    const headers = [
      'Kirayedar Name',
      'Kamra / Flat',
      'Mahina Kiraya (Billed)',
      'Jama Rashi (Paid)',
      'Bakaya (Balance)',
      'Status',
      'Payment Mode',
      'Rashid No',
      'Tareekh',
    ];

    const rows = monthlyStats.tenantRows.map((r) => [
      `"${r.tenantName}"`,
      `"${r.unit}"`,
      r.rentAmount,
      r.paidAmount,
      r.balance,
      r.status,
      `"${r.paymentMode}"`,
      `"${r.receiptNumber}"`,
      `"${r.date}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [
        `Kiraya Khata Monthly Collection Report - ${currentMonthName} ${selectedYear}`,
        `Property: ${settings.businessName}`,
        `Kul Dey: ${monthlyStats.totalExpected}, Kul Prapt: ${monthlyStats.totalCollected}, Vasooli Rate: ${monthlyStats.collectionRate}%`,
        '',
        headers.join(','),
        ...rows.map((e) => e.join(',')),
      ].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Kiraya_Report_${currentMonthName}_${selectedYear}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const maxChartVal = Math.max(...annualTrends.map((t) => Math.max(t.expected, t.collected)), 25000);

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Mahina Kiraya Bahi-Khata &amp; Report</span>
            <span className="text-xs font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
              मासिक बही-खाता
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kul vasooli hisab, payment modes (UPI/Cash/Bank) aur CA/Income Tax Return hetu PDF download
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Month Selector */}
          <select
            value={selectedMonthIndex}
            onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
            className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
          >
            {MONTHS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>

          {/* Year Selector */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="px-3 py-2 text-xs font-bold bg-white border border-slate-200 rounded-xl shadow-xs text-slate-800 focus:ring-2 focus:ring-amber-500"
          >
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
            <option value={2027}>2027</option>
          </select>

          {/* Action Buttons */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={handleExportPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Bahi-Khata PDF Report</span>
          </button>
        </div>
      </div>

      {/* KPI Cards in Indian Context */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Expected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Kul Dey Kiraya (Expected)
            </span>
            <div className="p-2 bg-slate-100 text-slate-700 rounded-xl">
              <span className="font-bold text-xs">₹</span>
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-slate-900">
              {currency}{monthlyStats.totalExpected.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-slate-400 block mt-1">
              Kul {monthlyStats.totalTenants} kamre/flats ka hisab
            </span>
          </div>
        </div>

        {/* Total Collected */}
        <div className="bg-white border border-emerald-200 rounded-2xl p-5 shadow-2xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
              Kul Kiraya Prapt (Collected)
            </span>
            <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-emerald-700">
              {currency}{monthlyStats.totalCollected.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-emerald-600 font-bold block mt-1">
              {monthlyStats.paidTenantsCount} of {monthlyStats.totalTenants} kirayedaaron ka clear
            </span>
          </div>
        </div>

        {/* Outstanding / Pending */}
        <div className="bg-white border border-rose-200 rounded-2xl p-5 shadow-2xs bg-rose-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
              Bacha Hua Bakaya (Due)
            </span>
            <div className="p-2 bg-rose-100 text-rose-700 rounded-xl">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-rose-700">
              {currency}{monthlyStats.totalPending.toLocaleString('en-IN')}
            </span>
            <span className="text-[11px] text-rose-600 block mt-1">
              {monthlyStats.totalTenants - monthlyStats.paidTenantsCount} kamro ka kiraya baaki
            </span>
          </div>
        </div>

        {/* Collection Efficiency */}
        <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-2xs bg-indigo-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">
              Vasooli Rate (Efficiency)
            </span>
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-black text-indigo-700">
              {monthlyStats.collectionRate}%
            </span>
            <div className="w-full bg-indigo-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, monthlyStats.collectionRate)}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Annual Trend Chart (Interactive SVG) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              {selectedYear} Mahina-war Kiraya Vasooli (Monthly Trajectory)
            </h3>
            <p className="text-xs text-slate-500">
              Har mahine kitna kiraya aana tha vs kitna jama hua
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-slate-300 rounded-xs"></span>
              <span className="text-slate-600">Dey Kiraya (Expected)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 bg-indigo-700 rounded-xs"></span>
              <span className="text-indigo-700 font-bold">Prapt Kiraya (Collected)</span>
            </div>
          </div>
        </div>

        {/* SVG Bar Chart */}
        <div className="pt-4">
          <div className="grid grid-cols-12 gap-1 sm:gap-2 items-end h-48 border-b border-slate-200 pb-2">
            {annualTrends.map((bar, i) => {
              const expHeightPercent = Math.min(100, Math.round((bar.expected / maxChartVal) * 100));
              const colHeightPercent = Math.min(100, Math.round((bar.collected / maxChartVal) * 100));
              const isSelected = i === selectedMonthIndex;

              return (
                <div
                  key={bar.month}
                  onClick={() => setSelectedMonthIndex(i)}
                  className={`cursor-pointer group flex flex-col items-center h-full justify-end px-1 rounded-t-lg transition ${
                    isSelected ? 'bg-amber-50/80 border-b-2 border-amber-500' : 'hover:bg-slate-50'
                  }`}
                  title={`${bar.fullName}: ${currency}${bar.collected.toLocaleString('en-IN')} prapt of ${currency}${bar.expected.toLocaleString('en-IN')}`}
                >
                  <div className="flex items-end gap-1 w-full justify-center h-full pb-1">
                    {/* Expected bar */}
                    <div
                      style={{ height: `${expHeightPercent}%` }}
                      className="w-2 sm:w-3 bg-slate-200 rounded-t-sm"
                    ></div>
                    {/* Collected bar */}
                    <div
                      style={{ height: `${colHeightPercent}%` }}
                      className={`w-2 sm:w-3 rounded-t-sm transition-all ${
                        isSelected ? 'bg-indigo-700' : 'bg-indigo-500 group-hover:bg-indigo-600'
                      }`}
                    ></div>
                  </div>
                  <span
                    className={`text-[10px] mt-1 font-bold ${
                      isSelected ? 'text-indigo-800' : 'text-slate-500'
                    }`}
                  >
                    {bar.month}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Payment Method Split & Tenant Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Method Split */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Bhugtan Madhyam Hisab (Payment Modes)</h3>
            <p className="text-xs text-slate-500">Distribution for {targetPeriodStr}</p>
          </div>

          <div className="space-y-3 pt-1">
            {Object.keys(monthlyStats.methodSplit).length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">
                Is mahine koi bhugtan darj nahi hai
              </p>
            ) : (
              Object.entries(monthlyStats.methodSplit).map(([method, amtValue]) => {
                const amt = Number(amtValue);
                const pct =
                  monthlyStats.totalCollected > 0
                    ? Math.round((amt / monthlyStats.totalCollected) * 100)
                    : 0;

                return (
                  <div key={method} className="space-y-1 text-xs">
                    <div className="flex items-center justify-between font-medium">
                      <span className="text-slate-800 font-bold">{method}</span>
                      <span className="font-black text-slate-900">
                        {currency}{amt.toLocaleString('en-IN')} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-600 h-full rounded-full"
                        style={{ width: `${pct}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Tenant Breakdown Table */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Kirayedar Vasooli Ledger ({targetPeriodStr})
              </h3>
              <p className="text-xs text-slate-500">
                Sabhi kirayedaaron ka masik bahi-khata aur reconciliation
              </p>
            </div>
            <button
              onClick={handleExportPdf}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Bahi-Khata PDF</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                <tr>
                  <th className="py-2.5 px-3">Kirayedar &amp; Unit</th>
                  <th className="py-2.5 px-3">Dey Kiraya</th>
                  <th className="py-2.5 px-3">Jama Rashi</th>
                  <th className="py-2.5 px-3">Bakaya</th>
                  <th className="py-2.5 px-3">Rashid / Madhyam</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {monthlyStats.tenantRows.map((row) => (
                  <tr key={row.tenantName} className="hover:bg-slate-50/80 transition">
                    <td className="py-2.5 px-3">
                      <span className="font-bold text-slate-900">{row.tenantName}</span>
                      <span className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="px-1.5 py-0.2 rounded bg-amber-50 text-amber-900 font-bold border border-amber-200 text-[9px]">
                          {row.propertyType}
                        </span>
                        <span>{row.unit}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700 font-medium">
                      {currency}{row.rentAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-black text-emerald-800">
                      {currency}{row.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span
                        className={`font-bold ${
                          row.balance > 0 ? 'text-rose-700' : 'text-slate-400'
                        }`}
                      >
                        {currency}{row.balance.toLocaleString('en-IN')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      <span className="font-mono text-[11px] text-slate-800 font-bold">
                        {row.receiptNumber}
                      </span>
                      {row.paymentMode !== '—' && (
                        <span className="block text-[10px] text-slate-500">
                          {row.paymentMode}
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          row.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.status === 'Overdue'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-900'
                        }`}
                      >
                        {row.status === 'Paid' ? 'Jama (Paid)' : row.status === 'Overdue' ? 'Bakaya' : 'Dey (Pending)'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMorePayments && (
            <div className="p-3 border-t border-slate-100 flex justify-center bg-slate-50/50">
              <button
                type="button"
                onClick={onLoadMorePayments}
                disabled={isLoadingMorePayments}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-200 shadow-2xs transition disabled:opacity-50"
              >
                {isLoadingMorePayments ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Purane payment records load ho rahe hain...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Aur Purane Payment Records Load Karein (Load More)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
