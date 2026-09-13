import { useState, useEffect, useMemo } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import Navbar from './components/Navbar';
import OverviewTab from './components/OverviewTab';
import TenantsTab from './components/TenantsTab';
import MonthlyReportTab from './components/MonthlyReportTab';
import RemindersTab from './components/RemindersTab';
import AddTenantModal from './components/AddTenantModal';
import RecordPaymentModal from './components/RecordPaymentModal';
import TenantDetailModal from './components/TenantDetailModal';
import ReceiptPreviewModal from './components/ReceiptPreviewModal';
import DocumentViewerModal from './components/DocumentViewerModal';
import SettingsModal from './components/SettingsModal';
import DistributionModal from './components/DistributionModal';
import AuthPortal from './components/AuthPortal';

import {
  Tenant,
  Payment,
  PropertyOwnerSettings,
  ReminderLog,
  TenantBalanceInfo,
  LeaseDocument,
} from './types';
import { storageService, calculateTenantBalance, getMonthsCount } from './services/storage';
import { evaluateReminderCandidates } from './services/reminderService';
import { auth, testConnection } from './services/firebase';
import { cloudStorageService } from './services/cloudStorageService';

export default function App() {
  // Auth state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Primary domain state
  const [tenants, setTenants] = useState<Tenant[]>(() => storageService.getTenants());
  const [payments, setPayments] = useState<Payment[]>(() => storageService.getPayments());
  const [settings, setSettings] = useState<PropertyOwnerSettings>(() => storageService.getSettings());
  const [reminderLogs, setReminderLogs] = useState<ReminderLog[]>(() => storageService.getReminderLogs());

  // Cursor-based pagination state for global payments (initially 50 records)
  const [lastPaymentDoc, setLastPaymentDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMorePayments, setHasMorePayments] = useState(false);
  const [isLoadingMorePayments, setIsLoadingMorePayments] = useState(false);

  // Cursor-based pagination state for global reminders (initially 50 records)
  const [lastReminderDoc, setLastReminderDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMoreReminders, setHasMoreReminders] = useState(false);
  const [isLoadingMoreReminders, setIsLoadingMoreReminders] = useState(false);

  // Active View Tab
  const [activeTab, setActiveTab] = useState<'overview' | 'tenants' | 'reports' | 'reminders'>('overview');

  // Modals
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);
  const [isRecordPaymentOpen, setIsRecordPaymentOpen] = useState(false);
  const [recordPaymentTenantId, setRecordPaymentTenantId] = useState<string | undefined>(undefined);
  const [selectedTenantDetail, setSelectedTenantDetail] = useState<Tenant | null>(null);
  const [previewPayment, setPreviewPayment] = useState<Payment | null>(null);
  const [previewDocState, setPreviewDocState] = useState<{
    doc: LeaseDocument;
    tenant: Tenant;
  } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isDistributionOpen, setIsDistributionOpen] = useState(false);

  // Test connection to Firestore on initial boot
  useEffect(() => {
    testConnection();
  }, []);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setIsDemoMode(false);
        try {
          // Initialize owner profile & collections if new user
          await cloudStorageService.initializeOwnerProfile(
            user.uid,
            user.displayName,
            user.email
          );
        } catch (err) {
          console.error('Failed to initialize owner profile:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync with Firestore in real-time when an owner is logged in
  useEffect(() => {
    if (!currentUser) return;

    const unsubSettings = cloudStorageService.subscribeToSettings(
      currentUser.uid,
      (newSettings) => {
        setSettings(newSettings);
      }
    );

    const unsubTenants = cloudStorageService.subscribeToTenants(
      currentUser.uid,
      (cloudTenants) => {
        setTenants(cloudTenants);
        // Automatically check & populate summary fields for any legacy tenant documents
        cloudStorageService.ensureTenantSummaries(currentUser.uid, cloudTenants);
      }
    );

    // Paginate payment records: load only the most recent 50 initially
    const unsubPayments = cloudStorageService.subscribeToRecentPayments(
      currentUser.uid,
      50,
      (cloudPayments, lastDoc, hasMore) => {
        setPayments(cloudPayments);
        setLastPaymentDoc(lastDoc);
        setHasMorePayments(hasMore);
      }
    );

    // Limit reminder-log loading: fetch only the most recent 50 records
    const unsubReminders = cloudStorageService.subscribeToRecentReminders(
      currentUser.uid,
      50,
      (cloudReminders, lastDoc, hasMore) => {
        setReminderLogs(cloudReminders);
        setLastReminderDoc(lastDoc);
        setHasMoreReminders(hasMore);
      }
    );

    return () => {
      unsubSettings();
      unsubTenants();
      unsubPayments();
      unsubReminders();
    };
  }, [currentUser]);

  // Handler to load older payments using Firestore cursor pagination
  const handleLoadMorePayments = async () => {
    if (!currentUser || !lastPaymentDoc || isLoadingMorePayments) return;
    setIsLoadingMorePayments(true);
    try {
      const res = await cloudStorageService.loadMorePayments(currentUser.uid, lastPaymentDoc, 50);
      setPayments((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = res.data.filter((p) => !existingIds.has(p.id));
        return [...prev, ...unique];
      });
      setLastPaymentDoc(res.lastDoc);
      setHasMorePayments(res.hasMore);
    } catch (err) {
      console.error('Failed to load more payments:', err);
    } finally {
      setIsLoadingMorePayments(false);
    }
  };

  // Handler to load older reminder logs using Firestore cursor pagination
  const handleLoadMoreReminders = async () => {
    if (!currentUser || !lastReminderDoc || isLoadingMoreReminders) return;
    setIsLoadingMoreReminders(true);
    try {
      const res = await cloudStorageService.loadMoreReminders(currentUser.uid, lastReminderDoc, 50);
      setReminderLogs((prev) => {
        const existingIds = new Set(prev.map((r) => r.id));
        const unique = res.data.filter((r) => !existingIds.has(r.id));
        return [...prev, ...unique];
      });
      setLastReminderDoc(res.lastDoc);
      setHasMoreReminders(res.hasMore);
    } catch (err) {
      console.error('Failed to load more reminders:', err);
    } finally {
      setIsLoadingMoreReminders(false);
    }
  };

  // Compute live balances for each tenant
  const balances = useMemo(() => {
    const map = new Map<string, TenantBalanceInfo>();
    const now = new Date();
    tenants.forEach((tenant) => {
      map.set(tenant.id, calculateTenantBalance(tenant, payments, now));
    });
    return map;
  }, [tenants, payments]);

  // Compute pending reminders count
  const dueRemindersCount = useMemo(() => {
    return evaluateReminderCandidates(tenants, balances, settings).length;
  }, [tenants, balances, settings]);

  // Handlers for tenant, payment, and reminder actions
  const handleAddTenant = async (newTenant: Tenant) => {
    if (currentUser) {
      await cloudStorageService.saveTenant(currentUser.uid, {
        ...newTenant,
        ownerId: currentUser.uid,
      });
    } else {
      const updated = [newTenant, ...tenants];
      setTenants(updated);
      storageService.saveTenants(updated);
    }
  };

  const handleUpdateTenant = async (updatedTenant: Tenant) => {
    if (currentUser) {
      await cloudStorageService.saveTenant(currentUser.uid, {
        ...updatedTenant,
        ownerId: currentUser.uid,
      });
    } else {
      const updatedList = tenants.map((t) => (t.id === updatedTenant.id ? updatedTenant : t));
      setTenants(updatedList);
      storageService.saveTenants(updatedList);
    }
    if (selectedTenantDetail?.id === updatedTenant.id) {
      setSelectedTenantDetail(updatedTenant);
    }
  };

  const handlePaymentRecorded = async (newPayment: Payment) => {
    if (currentUser) {
      await cloudStorageService.savePayment(currentUser.uid, {
        ...newPayment,
        ownerId: currentUser.uid,
      });
    } else {
      const updatedPayments = [newPayment, ...payments];
      setPayments(updatedPayments);
      storageService.savePayments(updatedPayments);

      // Maintain summary fields on tenant record
      const updatedTenants = tenants.map((t) => {
        if (t.id === newPayment.tenantId) {
          const currentTotalPaid = t.totalPaid ?? 0;
          const newTotalPaid = currentTotalPaid + newPayment.amount;
          const activeMonths = getMonthsCount(t.leaseStart, new Date());
          const totalAccrued = activeMonths * t.rentAmount;
          return {
            ...t,
            totalPaid: newTotalPaid,
            outstandingBalance: totalAccrued - newTotalPaid,
            lastPaymentDate: newPayment.date,
            lastPaymentAmount: newPayment.amount,
            lastPaymentReceiptNumber: newPayment.receiptNumber,
            summaryUpdatedAt: new Date().toISOString(),
          };
        }
        return t;
      });
      setTenants(updatedTenants);
      storageService.saveTenants(updatedTenants);
    }
  };

  const handleLogReminder = async (log: ReminderLog) => {
    if (currentUser) {
      await cloudStorageService.saveReminderLog(currentUser.uid, {
        ...log,
        ownerId: currentUser.uid,
      });
    } else {
      const updated = [log, ...reminderLogs];
      setReminderLogs(updated);
      storageService.saveReminderLogs(updated);
    }
  };

  const handleBatchLogReminders = async (logs: ReminderLog[]) => {
    if (currentUser) {
      const withOwner = logs.map((l) => ({ ...l, ownerId: currentUser.uid }));
      await cloudStorageService.batchSaveReminderLogs(currentUser.uid, withOwner);
    } else {
      const updated = [...logs, ...reminderLogs];
      setReminderLogs(updated);
      storageService.saveReminderLogs(updated);
    }
  };

  const handleSaveSettings = async (newSettings: PropertyOwnerSettings) => {
    if (currentUser) {
      await cloudStorageService.saveSettings(currentUser.uid, newSettings);
    } else {
      setSettings(newSettings);
      storageService.saveSettings(newSettings);
    }
  };

  const handleResetDemo = () => {
    storageService.resetToDemo();
    setTenants(storageService.getTenants());
    setPayments(storageService.getPayments());
    setSettings(storageService.getSettings());
    setReminderLogs(storageService.getReminderLogs());
  };

  const handleOpenRecordPayment = (tenantId?: string) => {
    setRecordPaymentTenantId(tenantId);
    setIsRecordPaymentOpen(true);
  };

  const handleSignOut = async () => {
    await signOut(auth);
    setIsDemoMode(false);
  };

  // Keep selectedTenantDetail in sync if tenant array updates
  const activeTenantDetail = useMemo(() => {
    if (!selectedTenantDetail) return null;
    return tenants.find((t) => t.id === selectedTenantDetail.id) || selectedTenantDetail;
  }, [selectedTenantDetail, tenants]);

  // Loading spinner during initial auth evaluation
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-semibold text-slate-600">
            Connecting to RentTrack Cloud SaaS...
          </p>
        </div>
      </div>
    );
  }

  // If user is not logged in and hasn't chosen demo preview, show Auth Portal
  if (!currentUser && !isDemoMode) {
    return (
      <AuthPortal
        onContinueDemo={() => setIsDemoMode(true)}
      />
    );
  }

  const currentAppUrl = typeof window !== 'undefined' ? window.location.href : '';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        tenantCount={tenants.length}
        dueRemindersCount={dueRemindersCount}
        settings={settings}
        user={currentUser}
        isDemoMode={!currentUser}
        onOpenAddTenant={() => setIsAddTenantOpen(true)}
        onOpenRecordPayment={() => handleOpenRecordPayment()}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDistribution={() => setIsDistributionOpen(true)}
        onSignOut={handleSignOut}
        onSignIn={() => setIsDemoMode(false)}
      />

      {/* Demo Sandbox Alert Banner */}
      {!currentUser && isDemoMode && (
        <div className="bg-amber-500/10 border-b border-amber-300/60 px-4 py-2 text-xs text-amber-900 text-center flex items-center justify-center gap-2">
          <span className="font-semibold">Demo Sandbox Mode:</span>
          <span>Changes are stored locally on your device.</span>
          <button
            onClick={() => setIsDemoMode(false)}
            className="font-bold underline hover:text-amber-950 ml-1 cursor-pointer"
          >
            Sign in with Google to enable live Multi-Tenant Cloud Sync &rarr;
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <OverviewTab
            tenants={tenants}
            payments={payments}
            balances={balances}
            settings={settings}
            onOpenAddTenant={() => setIsAddTenantOpen(true)}
            onOpenRecordPayment={handleOpenRecordPayment}
            onSelectTenant={(t) => setSelectedTenantDetail(t)}
            onViewReceipt={(p) => setPreviewPayment(p)}
            onNavigateTab={(tab) => setActiveTab(tab as any)}
          />
        )}

        {activeTab === 'tenants' && (
          <TenantsTab
            tenants={tenants}
            balances={balances}
            payments={payments}
            settings={settings}
            onSelectTenant={(t) => setSelectedTenantDetail(t)}
            onOpenAddTenant={() => setIsAddTenantOpen(true)}
            onOpenRecordPayment={handleOpenRecordPayment}
          />
        )}

        {activeTab === 'reports' && (
          <MonthlyReportTab
            tenants={tenants}
            payments={payments}
            balances={balances}
            settings={settings}
            hasMorePayments={hasMorePayments}
            isLoadingMorePayments={isLoadingMorePayments}
            onLoadMorePayments={handleLoadMorePayments}
          />
        )}

        {activeTab === 'reminders' && (
          <RemindersTab
            tenants={tenants}
            balances={balances}
            settings={settings}
            reminderLogs={reminderLogs}
            hasMoreReminders={hasMoreReminders}
            isLoadingMoreReminders={isLoadingMoreReminders}
            onLoadMoreReminders={handleLoadMoreReminders}
            onUpdateSettings={handleSaveSettings}
            onLogReminder={handleLogReminder}
            onBatchLogReminders={handleBatchLogReminders}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            {settings.businessName} &bull; Rent Collection, Automated Reminders &amp; Leases
          </p>
          <div className="flex items-center gap-4 text-slate-400">
            <button
              onClick={() => setIsDistributionOpen(true)}
              className="text-indigo-600 hover:underline font-semibold"
            >
              Distribute to other landlords
            </button>
            <span>&bull;</span>
            <span>Cloud Firestore Verified</span>
          </div>
        </div>
      </footer>

      {/* MODALS */}
      {/* Add Tenant Modal */}
      <AddTenantModal
        isOpen={isAddTenantOpen}
        onClose={() => setIsAddTenantOpen(false)}
        onAddTenant={handleAddTenant}
        settings={settings}
      />

      {/* Record Payment Modal */}
      <RecordPaymentModal
        isOpen={isRecordPaymentOpen}
        onClose={() => setIsRecordPaymentOpen(false)}
        tenants={tenants}
        selectedTenantId={recordPaymentTenantId}
        balances={balances}
        settings={settings}
        onPaymentRecorded={handlePaymentRecorded}
      />

      {/* Individual Tenant Dashboard Modal */}
      {activeTenantDetail && (
        <TenantDetailModal
          isOpen={!!selectedTenantDetail}
          onClose={() => setSelectedTenantDetail(null)}
          tenant={activeTenantDetail}
          balanceInfo={
            balances.get(activeTenantDetail.id) ||
            calculateTenantBalance(activeTenantDetail, payments)
          }
          payments={payments}
          reminderLogs={reminderLogs}
          settings={settings}
          ownerId={currentUser?.uid}
          onUpdateTenant={handleUpdateTenant}
          onOpenRecordPayment={(tid) => handleOpenRecordPayment(tid)}
          onViewReceipt={(p) => setPreviewPayment(p)}
          onViewDocument={(doc, t) => setPreviewDocState({ doc, tenant: t })}
          onLogReminder={handleLogReminder}
        />
      )}

      {/* Receipt Preview & Share Modal */}
      {previewPayment && (
        <ReceiptPreviewModal
          isOpen={!!previewPayment}
          onClose={() => setPreviewPayment(null)}
          payment={previewPayment}
          tenant={
            tenants.find((t) => t.id === previewPayment.tenantId) || {
              id: previewPayment.tenantId,
              name: previewPayment.tenantName,
              phone: '',
              email: '',
              unit: previewPayment.unit,
              rentAmount: previewPayment.amount,
              securityDeposit: 0,
              dueDay: 1,
              leaseStart: '',
              leaseEnd: '',
              status: 'active',
              documents: [],
              createdAt: '',
            }
          }
          settings={settings}
          currentBalance={balances.get(previewPayment.tenantId)?.outstandingBalance}
        />
      )}

      {/* Document Viewer Modal */}
      {previewDocState && (
        <DocumentViewerModal
          isOpen={!!previewDocState}
          onClose={() => setPreviewDocState(null)}
          document={previewDocState.doc}
          tenant={previewDocState.tenant}
        />
      )}

      {/* Landlord Settings & Banking Details Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSave={handleSaveSettings}
        onResetDemo={handleResetDemo}
      />

      {/* Distribution & Multi-Owner Guide Modal */}
      <DistributionModal
        isOpen={isDistributionOpen}
        onClose={() => setIsDistributionOpen(false)}
        appUrl={currentAppUrl}
      />
    </div>
  );
}
