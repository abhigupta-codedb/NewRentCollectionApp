import { useState, useMemo } from 'react';
import {
  Bell,
  MessageSquare,
  Mail,
  CheckCircle2,
  AlertCircle,
  Play,
  Settings,
  Save,
  Send,
  History,
  Sparkles,
  Loader2,
  ChevronDown,
} from 'lucide-react';
import {
  Tenant,
  PropertyOwnerSettings,
  TenantBalanceInfo,
  ReminderLog,
} from '../types';
import {
  evaluateReminderCandidates,
  getWhatsAppReminderUrl,
  getEmailReminderUrl,
  createReminderLog,
  formatReminderTemplate,
  cleanPhoneNumber,
} from '../services/reminderService';

interface RemindersTabProps {
  tenants: Tenant[];
  balances: Map<string, TenantBalanceInfo>;
  settings: PropertyOwnerSettings;
  reminderLogs: ReminderLog[];
  hasMoreReminders?: boolean;
  isLoadingMoreReminders?: boolean;
  onLoadMoreReminders?: () => void;
  onUpdateSettings: (newSettings: PropertyOwnerSettings) => void;
  onLogReminder: (log: ReminderLog) => void;
  onBatchLogReminders: (logs: ReminderLog[]) => void;
}

export default function RemindersTab({
  tenants,
  balances,
  settings,
  reminderLogs,
  hasMoreReminders,
  isLoadingMoreReminders,
  onLoadMoreReminders,
  onUpdateSettings,
  onLogReminder,
  onBatchLogReminders,
}: RemindersTabProps) {
  const currency = settings.currencySymbol || '₹';

  // Config local states
  const [autoEnabled, setAutoEnabled] = useState(settings.reminderSettings.autoEnabled);
  const [daysBeforeDue, setDaysBeforeDue] = useState(settings.reminderSettings.daysBeforeDue);
  const [sendOnDueDate, setSendOnDueDate] = useState(settings.reminderSettings.sendOnDueDate);
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    settings.reminderSettings.whatsappTemplate
  );
  const [emailSubjectTemplate, setEmailSubjectTemplate] = useState(
    settings.reminderSettings.emailSubjectTemplate
  );
  const [emailBodyTemplate, setEmailBodyTemplate] = useState(
    settings.reminderSettings.emailBodyTemplate
  );
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Active sub-tab
  const [activeSubTab, setActiveSubTab] = useState<'queue' | 'templates' | 'logs'>('queue');
  const [previewTenantId, setPreviewTenantId] = useState<string>(tenants[0]?.id || '');

  // Calculate reminder candidates
  const candidates = useMemo(() => {
    return evaluateReminderCandidates(tenants, balances, settings);
  }, [tenants, balances, settings]);

  const handleSaveSettings = () => {
    const updated: PropertyOwnerSettings = {
      ...settings,
      reminderSettings: {
        ...settings.reminderSettings,
        autoEnabled,
        daysBeforeDue: Number(daysBeforeDue),
        sendOnDueDate,
        whatsappTemplate,
        emailSubjectTemplate,
        emailBodyTemplate,
      },
    };
    onUpdateSettings(updated);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  const insertPlaceholder = (
    field: 'whatsapp' | 'emailSubject' | 'emailBody',
    token: string
  ) => {
    if (field === 'whatsapp') {
      setWhatsappTemplate((prev) => prev + ` ${token}`);
    } else if (field === 'emailSubject') {
      setEmailSubjectTemplate((prev) => prev + ` ${token}`);
    } else {
      setEmailBodyTemplate((prev) => prev + ` ${token}`);
    }
  };

  const handleTriggerWhatsApp = (candidate: (typeof candidates)[0]) => {
    const url = getWhatsAppReminderUrl(candidate.tenant, candidate.balanceInfo, settings);
    window.open(url, '_blank');

    const log = createReminderLog(
      candidate.tenant,
      candidate.balanceInfo,
      'whatsapp',
      candidate.suggestedWhatsAppMessage,
      undefined,
      false
    );
    onLogReminder(log);
  };

  const handleTriggerEmail = (candidate: (typeof candidates)[0]) => {
    const url = getEmailReminderUrl(candidate.tenant, candidate.balanceInfo, settings);
    window.location.href = url;

    const log = createReminderLog(
      candidate.tenant,
      candidate.balanceInfo,
      'email',
      candidate.suggestedEmailBody,
      candidate.suggestedEmailSubject,
      false
    );
    onLogReminder(log);
  };

  // Automated Batch Runner
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchCompletedCount, setBatchCompletedCount] = useState<number | null>(null);

  const handleRunBatchAutomated = () => {
    if (candidates.length === 0) return;
    setBatchRunning(true);

    setTimeout(() => {
      const newLogs: ReminderLog[] = [];

      candidates.forEach((c) => {
        // Log automated WhatsApp reminder
        newLogs.push(
          createReminderLog(
            c.tenant,
            c.balanceInfo,
            'whatsapp',
            c.suggestedWhatsAppMessage,
            undefined,
            true
          )
        );
        // Log automated Email reminder
        newLogs.push(
          createReminderLog(
            c.tenant,
            c.balanceInfo,
            'email',
            c.suggestedEmailBody,
            c.suggestedEmailSubject,
            true
          )
        );
      });

      onBatchLogReminders(newLogs);
      setBatchRunning(false);
      setBatchCompletedCount(candidates.length);
      setTimeout(() => setBatchCompletedCount(null), 4000);
    }, 800);
  };

  const previewTenant = tenants.find((t) => t.id === previewTenantId) || tenants[0];
  const previewBalance = previewTenant ? balances.get(previewTenant.id) : undefined;

  return (
    <div className="space-y-6">
      {/* Header banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Automatic Kiraya Reminder System</span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
              स्वचालित रिमाइंडर
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kiraya tareekh paas aane par aur bakaya hone par WhatsApp aur Email par direct reminder sandesh bhejein
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunBatchAutomated}
            disabled={batchRunning || candidates.length === 0}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 rounded-xl shadow-xs transition"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{batchRunning ? 'Reminder Bhej Rahe Hain...' : `Sabhi Ko Reminder Bhejein (${candidates.length})`}</span>
          </button>
        </div>
      </div>

      {batchCompletedCount !== null && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-950">
          <span className="font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Automatic reminder sandesh safalta-purvak {batchCompletedCount} kirayedaaron ko bhej diya gaya aur bahi-khata me darj ho gaya!
          </span>
          <button
            onClick={() => setActiveSubTab('logs')}
            className="text-emerald-800 font-extrabold underline"
          >
            Logs Dekhein
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-4 border-b border-slate-200 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('queue')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'queue'
              ? 'border-indigo-700 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bell className="w-3.5 h-3.5" />
          <span>Bacha Hua Reminder Queue ({candidates.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('templates')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'templates'
              ? 'border-indigo-700 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>Reminder Niyam &amp; Sandesh Templates</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-3 border-b-2 transition flex items-center gap-1.5 ${
            activeSubTab === 'logs'
              ? 'border-indigo-700 text-indigo-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <History className="w-3.5 h-3.5" />
          <span>Bheje Gaye Reminder Logs ({reminderLogs.length})</span>
        </button>
      </div>

      {/* SUB-TAB 1: REMINDER QUEUE */}
      {activeSubTab === 'queue' && (
        <div className="space-y-4">
          {candidates.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-slate-200 rounded-2xl bg-white">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-bold text-slate-900">Sabhi Kirayedaaron Ka Hisab Clear Hai!</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Agle {daysBeforeDue} dino me kisi kirayedar ka due nahi hai aur koi purana bakaya reminder pending nahi hai.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {candidates.map((candidate) => {
                const phone = cleanPhoneNumber(candidate.tenant.phone);

                return (
                  <div
                    key={candidate.tenant.id}
                    className="p-5 bg-white border border-slate-200 rounded-2xl shadow-2xs hover:border-amber-300 transition space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-slate-900">{candidate.tenant.name}</h4>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              candidate.reason === 'overdue'
                                ? 'bg-rose-100 text-rose-800'
                                : candidate.reason === 'due_today'
                                ? 'bg-amber-100 text-amber-950'
                                : 'bg-sky-100 text-sky-800'
                            }`}
                          >
                            {candidate.reason === 'overdue' ? `Bakaya: ${candidate.daysInfo}` : candidate.reason === 'due_today' ? 'Aaj Due Hai' : `${candidate.daysInfo} bache hain`}
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {candidate.tenant.unit} • Kiraya Tareekh:{' '}
                          <strong className="text-slate-800 font-bold">
                            {candidate.balanceInfo.currentMonthDueDate}
                          </strong>
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Dey Bakaya Rashi</span>
                        <span className="text-base font-black text-rose-700">
                          {currency}
                          {(candidate.balanceInfo.outstandingBalance > 0
                            ? candidate.balanceInfo.outstandingBalance
                            : candidate.tenant.rentAmount
                          ).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>

                    {/* Preview message block */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {/* WhatsApp preview */}
                      <div className="p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-emerald-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                            <span>WhatsApp Reminder Preview</span>
                          </span>
                          <span className="text-[10px] text-emerald-800 font-mono font-bold">{candidate.tenant.phone}</span>
                        </div>
                        <p className="text-slate-700 text-[11px] whitespace-pre-line line-clamp-3 bg-white p-2.5 rounded-lg border border-emerald-100">
                          {candidate.suggestedWhatsAppMessage}
                        </p>
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleTriggerWhatsApp(candidate)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shadow-xs transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>WhatsApp Par Bhejein</span>
                          </button>
                        </div>
                      </div>

                      {/* Email preview */}
                      <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1.5">
                        <div className="flex items-center justify-between text-indigo-900 font-bold">
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5 text-indigo-700" />
                            <span>Email Reminder Preview</span>
                          </span>
                          <span className="text-[10px] text-indigo-800 truncate max-w-[140px]">
                            {candidate.tenant.email}
                          </span>
                        </div>
                        <div className="bg-white p-2.5 rounded-lg border border-indigo-100 text-[11px] space-y-1 text-slate-700">
                          <p className="font-bold truncate">
                            Subject: {candidate.suggestedEmailSubject}
                          </p>
                          <p className="line-clamp-2 text-slate-500 whitespace-pre-line">
                            {candidate.suggestedEmailBody}
                          </p>
                        </div>
                        <div className="pt-1 flex justify-end">
                          <button
                            onClick={() => handleTriggerEmail(candidate)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-lg text-xs shadow-xs transition"
                          >
                            <Send className="w-3 h-3" />
                            <span>Email Reminder Bhejein</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB 2: TEMPLATES & AUTOMATION RULES */}
      {activeSubTab === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Automatic Reminder Rules</h3>
                <p className="text-xs text-slate-500">
                  Kiraya due date se kitne din pehle reminder trigger karna hai tay karein
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoEnabled}
                  onChange={(e) => setAutoEnabled(e.target.checked)}
                  className="w-4 h-4 text-indigo-700 rounded border-slate-300 focus:ring-amber-500"
                />
                <span className="text-xs font-bold text-slate-800">
                  Automated Reminder Chalu Rakhein
                </span>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Due Date Se Kitne Din Pehle Reminder Bhejein
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={daysBeforeDue}
                    onChange={(e) => setDaysBeforeDue(Number(e.target.value))}
                    className="w-20 px-2.5 py-1.5 border rounded-lg border-slate-300 font-bold"
                  />
                  <span className="text-slate-500">din pehle (Jaise: 3 din pehle)</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Due Date Ke Din</label>
                <label className="flex items-center gap-2 cursor-pointer mt-2">
                  <input
                    type="checkbox"
                    checked={sendOnDueDate}
                    onChange={(e) => setSendOnDueDate(e.target.checked)}
                    className="w-4 h-4 text-indigo-700 rounded border-slate-300"
                  />
                  <span className="text-slate-700 font-medium">Due tareekh wale din bhi reminder bhejein</span>
                </label>
              </div>
            </div>

            {/* Template Editors */}
            <div className="space-y-4 pt-3 border-t border-slate-100">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                    <span>WhatsApp Reminder Sandesh Template</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {[
                      '{tenant_name}',
                      '{unit}',
                      '{amount}',
                      '{due_date}',
                      '{outstanding}',
                      '{upi_id}',
                      '{upi_number}',
                    ].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => insertPlaceholder('whatsapp', token)}
                        className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                      >
                        +{token}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg border-slate-300 font-sans"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Email Subject Line Template</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => insertPlaceholder('emailSubject', '{unit}')}
                    className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                  >
                    +&#123;unit&#125;
                  </button>
                </div>
                <input
                  type="text"
                  value={emailSubjectTemplate}
                  onChange={(e) => setEmailSubjectTemplate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border rounded-lg border-slate-300"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-indigo-700" />
                    <span>Email Body Template</span>
                  </label>
                  <div className="flex flex-wrap gap-1">
                    {['{bank_name}', '{account_number}', '{routing_or_ifsc}', '{upi_id}'].map((token) => (
                      <button
                        key={token}
                        type="button"
                        onClick={() => insertPlaceholder('emailBody', token)}
                        className="px-1.5 py-0.5 text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-mono"
                      >
                        +{token}
                      </button>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={emailBodyTemplate}
                  onChange={(e) => setEmailBodyTemplate(e.target.value)}
                  className="w-full p-2.5 text-xs border rounded-lg border-slate-300 font-sans"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {saveFeedback && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Reminder templates aur settings save ho gaye!
                </span>
              )}
              <button
                type="button"
                onClick={handleSaveSettings}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-700 hover:bg-indigo-800 rounded-lg shadow-xs transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Settings Save Karein</span>
              </button>
            </div>
          </div>

          {/* Right Live Preview Box */}
          <div className="space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Live Preview (किरायेदार संदेश)</span>
                </h4>
                <select
                  value={previewTenantId}
                  onChange={(e) => setPreviewTenantId(e.target.value)}
                  className="text-[11px] border border-slate-200 rounded-md px-2 py-1 bg-slate-50 font-medium"
                >
                  {tenants.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.unit})
                    </option>
                  ))}
                </select>
              </div>

              {previewTenant && previewBalance && (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Rendered WhatsApp Sandesh:
                    </span>
                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-slate-800 text-[11px] whitespace-pre-line mt-1">
                      {formatReminderTemplate(whatsappTemplate, previewTenant, previewBalance, settings)}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">
                      Rendered Email Subject:
                    </span>
                    <p className="p-2 bg-slate-50 rounded-lg border border-slate-200 font-medium text-slate-800 text-[11px] mt-1">
                      {formatReminderTemplate(
                        emailSubjectTemplate,
                        previewTenant,
                        previewBalance,
                        settings
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LOGS */}
      {activeSubTab === 'logs' && (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-900">Bheje Gaye Reminder Logs (ऑडिट हिस्ट्री)</h3>
              <p className="text-[11px] text-slate-500">
                Sabhi automated aur manual WhatsApp / Email reminder sandesh ka bahi-khata
              </p>
            </div>
            <span className="text-xs font-bold text-slate-700">
              Kul Logged: {reminderLogs.length}
            </span>
          </div>

          {reminderLogs.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              Abhi tak koi reminder sandesh nahi bheja gaya hai.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {reminderLogs.map((log) => (
                <div key={log.id} className="p-4 hover:bg-slate-50/70 transition space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          log.channel === 'whatsapp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {log.channel}
                      </span>
                      <strong className="text-slate-900 font-bold">{log.tenantName}</strong>
                      <span className="text-slate-500">({log.unit})</span>
                      {log.isAutomated && (
                        <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded">
                          Automated
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(log.sentAt).toLocaleString('en-IN')}
                    </span>
                  </div>
                  {log.subject && (
                    <p className="text-slate-800 font-bold text-[11px]">
                      Subject: {log.subject}
                    </p>
                  )}
                  <p className="text-slate-600 text-[11px] whitespace-pre-line bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {log.message}
                  </p>
                </div>
              ))}
            </div>
          )}

          {hasMoreReminders && (
            <div className="p-4 border-t border-slate-100 flex justify-center bg-slate-50/50">
              <button
                type="button"
                onClick={onLoadMoreReminders}
                disabled={isLoadingMoreReminders}
                className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-indigo-700 bg-white hover:bg-indigo-50 rounded-lg border border-indigo-200 shadow-2xs transition disabled:opacity-50"
              >
                {isLoadingMoreReminders ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                    <span>Purane reminder logs load ho rahe hain...</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5" />
                    <span>Aur Purane Logs Dekhein (Load More)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
