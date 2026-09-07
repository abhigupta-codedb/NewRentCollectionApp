import {
  Home,
  Users,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  CreditCard,
  Plus,
  Building,
  Share2,
  LogOut,
  LogIn,
} from 'lucide-react';
import { PropertyOwnerSettings } from '../types';

interface NavbarProps {
  activeTab: 'overview' | 'tenants' | 'reports' | 'reminders';
  setActiveTab: (tab: 'overview' | 'tenants' | 'reports' | 'reminders') => void;
  tenantCount: number;
  dueRemindersCount: number;
  settings: PropertyOwnerSettings;
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  isDemoMode: boolean;
  onOpenAddTenant: () => void;
  onOpenRecordPayment: () => void;
  onOpenSettings: () => void;
  onOpenDistribution: () => void;
  onSignOut: () => void;
  onSignIn: () => void;
}

export default function Navbar({
  activeTab,
  setActiveTab,
  tenantCount,
  dueRemindersCount,
  settings,
  user,
  isDemoMode,
  onOpenAddTenant,
  onOpenRecordPayment,
  onOpenSettings,
  onOpenDistribution,
  onSignOut,
  onSignIn,
}: NavbarProps) {
  return (
    <header className="sticky top-0 z-40 bg-white border-b border-amber-200/70 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Name with authentic Indian context */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-600 via-orange-600 to-indigo-700 flex items-center justify-center text-white shadow-xs">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base text-slate-900 leading-none tracking-tight">
                  Kiraya Khata
                </span>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 px-1.5 py-0.5 rounded-sm">
                  किराया खाता
                </span>
                {isDemoMode ? (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                    डेमो सैंडबॉक्स
                  </span>
                ) : (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    क्लाउड सिंक
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-medium truncate max-w-[140px] sm:max-w-xs block mt-0.5">
                {settings.businessName || 'मकान मालिक पोर्टल'}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Tabs */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl border border-slate-200/60">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'overview'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Khata Summary (खाता)</span>
            </button>

            <button
              onClick={() => setActiveTab('tenants')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'tenants'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Kirayedar (किरायेदार)</span>
              <span className="px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full text-[10px]">
                {tenantCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'reports'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Bahi-Khata / हिसाब</span>
            </button>

            <button
              onClick={() => setActiveTab('reminders')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'reminders'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Bell className="w-4 h-4" />
              <span>Kiraya Reminder (रिमाइंडर)</span>
              {dueRemindersCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold animate-pulse">
                  {dueRemindersCount}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Actions & Owner Profile */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Distribute / Share App Button */}
            <button
              onClick={onOpenDistribution}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition border border-amber-200"
              title="दूसरे मकान मालिकों के साथ ऐप शेयर करें"
            >
              <Share2 className="w-3.5 h-3.5 text-amber-700" />
              <span className="hidden sm:inline">ऐप शेयर</span>
            </button>

            <button
              onClick={onOpenRecordPayment}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-xs transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Kiraya Jama (+ किराया)</span>
            </button>

            <button
              onClick={onOpenAddTenant}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition border border-slate-200"
            >
              <Plus className="w-3.5 h-3.5 text-indigo-600" />
              <span>+ Kirayedar</span>
            </button>

            <button
              onClick={onOpenSettings}
              className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="मालिक सेटिंग्स एवं बैंक/UPI विवरण"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Auth status & actions */}
            {user ? (
              <div className="flex items-center gap-2 pl-1 border-l border-slate-200">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'मालिक'}
                    className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-amber-600 text-white font-bold text-[11px] flex items-center justify-center">
                    {(user.displayName || user.email || 'M')[0].toUpperCase()}
                  </div>
                )}
                <div className="hidden xl:block text-left">
                  <span className="text-xs font-semibold text-slate-900 block leading-none truncate max-w-[105px]">
                    {user.displayName || 'Makaan Malik'}
                  </span>
                  <span className="text-[10px] text-slate-500 block truncate max-w-[105px]">
                    मकान मालिक
                  </span>
                </div>
                <button
                  onClick={onSignOut}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                  title="लॉगआउट (Sign Out)"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 pl-1 border-l border-slate-200">
                <button
                  onClick={onSignIn}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition shadow-xs"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>लॉग इन</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex lg:hidden items-center justify-around py-2 border-t border-slate-100 text-xs">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex flex-col items-center gap-1 py-1 font-semibold ${
              activeTab === 'overview' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>खाता</span>
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex flex-col items-center gap-1 py-1 font-semibold ${
              activeTab === 'tenants' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>किरायेदार ({tenantCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex flex-col items-center gap-1 py-1 font-semibold ${
              activeTab === 'reports' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>बही-खाता</span>
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex flex-col items-center gap-1 py-1 font-semibold relative ${
              activeTab === 'reminders' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>रिमाइंडर</span>
            {dueRemindersCount > 0 && (
              <span className="absolute top-0 right-3 w-2 h-2 bg-rose-500 rounded-full"></span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
