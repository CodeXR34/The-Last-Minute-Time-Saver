import React, { useState, useEffect } from 'react';
import { X, Calendar, Mail, Save, Clock, BellRing, BellOff, Send, Activity, History } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { db, functions } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';

const DEFAULT_EMAIL_SETTINGS = {
  enabled: false,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  morning: { enabled: true, time: '06:00' },
  afternoon: { enabled: true, time: '13:00' },
  evening: { enabled: true, time: '18:00' },
  nightSummary: { enabled: true, time: '23:30' },
  weeklyReport: { enabled: true },
  inactivityReminder: { enabled: true }
};

export default function SettingsModal({ isOpen, onClose }) {
  const { currentUser, loginWithGoogle } = useAuth();
  const { addToast } = useToast();
  const [hasCalendarToken, setHasCalendarToken] = useState(false);
  
  const [emailSettings, setEmailSettings] = useState(DEFAULT_EMAIL_SETTINGS);
  const [emailLogs, setEmailLogs] = useState({});
  const [emailAnalytics, setEmailAnalytics] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setHasCalendarToken(!!sessionStorage.getItem('googleCalendarToken'));
      if (currentUser) {
        fetchEmailSettings();
      }
    }
  }, [isOpen, currentUser]);

  const fetchEmailSettings = async () => {
    setLoadingSettings(true);
    try {
      const docRef = doc(db, 'userSettings', currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.emailSettings) setEmailSettings({ ...DEFAULT_EMAIL_SETTINGS, ...data.emailSettings });
        if (data.emailLogs) setEmailLogs(data.emailLogs);
        if (data.emailAnalytics) setEmailAnalytics(data.emailAnalytics);
      } else {
        setEmailSettings(DEFAULT_EMAIL_SETTINGS);
      }
    } catch (error) {
      console.error("Error fetching email settings:", error);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleConnect = async () => {
    try {
      await loginWithGoogle();
      setHasCalendarToken(true);
      addToast('Google Calendar connected successfully!', 'success');
    } catch (error) {
      console.error('Failed to connect Calendar:', error);
      addToast('Failed to connect to Google Calendar.', 'error');
    }
  };

  const handleDisconnect = () => {
    sessionStorage.removeItem('googleCalendarToken');
    setHasCalendarToken(false);
    addToast('Google Calendar disconnected.', 'info');
  };

  const updateSetting = (key, value, nestedKey = null) => {
    setEmailSettings(prev => {
      const newSettings = { ...prev };
      if (nestedKey) {
        newSettings[key] = { ...newSettings[key], [nestedKey]: value };
      } else {
        newSettings[key] = value;
      }
      return newSettings;
    });
  };

  const saveEmailSettings = async () => {
    if (!currentUser) return;
    setIsSaving(true);
    try {
      const docRef = doc(db, 'userSettings', currentUser.uid);
      await setDoc(docRef, { emailSettings }, { merge: true });
      addToast('Email settings saved.', 'success');
    } catch (error) {
      console.error("Error saving email settings:", error);
      addToast('Failed to save settings.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendTestEmail = async () => {
    setIsSendingTest(true);
    try {
      const sendTestEmailFn = httpsCallable(functions, 'sendTestEmail');
      await sendTestEmailFn();
      addToast('Test email sent! Check your inbox.', 'success');
    } catch (error) {
      console.error("Error sending test email:", error);
      addToast('Failed to send test email. Ensure your backend is configured.', 'error');
    } finally {
      setIsSendingTest(false);
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return 'Never';
    return new Date(ts).toLocaleString();
  };

  if (!isOpen) return null;

  const successRate = emailAnalytics.remindersSent > 0 
    ? Math.round((emailAnalytics.tasksCompletedAfterReminder / emailAnalytics.remindersSent) * 100) 
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        <div className="fixed inset-0 bg-gray-500/75 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity" onClick={onClose} aria-hidden="true"></div>

        <div className="relative inline-block align-bottom bg-white dark:bg-slate-900 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 dark:border-slate-800 max-h-[85vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 sticky top-0 bg-white dark:bg-slate-900 z-10 pb-2 border-b border-gray-100 dark:border-slate-800">
              <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                Settings
              </h3>
              <button onClick={onClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 rounded-full p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-8">
              
              {/* Email Notifications Settings */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary-500" />
                    AI Accountability Emails
                  </h4>
                  {loadingSettings ? (
                    <span className="text-xs text-gray-400">Loading...</span>
                  ) : (
                    <button 
                      onClick={() => updateSetting('enabled', !emailSettings.enabled)}
                      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${emailSettings.enabled ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`}
                    >
                      <span aria-hidden="true" className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${emailSettings.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                  )}
                </div>
                
                {emailSettings.enabled && !loadingSettings && (
                  <div className="space-y-6">
                    {/* Preferences */}
                    <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50 space-y-4">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">
                        SCHEDULE PREFERENCES
                      </p>
                      
                      {/* Morning */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={emailSettings.morning.enabled} onChange={(e) => updateSetting('morning', e.target.checked, 'enabled')} className="rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 h-4 w-4" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Morning Reminder</span>
                        </div>
                        <input type="time" value={emailSettings.morning.time} onChange={(e) => updateSetting('morning', e.target.value, 'time')} disabled={!emailSettings.morning.enabled} className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white disabled:opacity-50 outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>

                      {/* Afternoon */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={emailSettings.afternoon.enabled} onChange={(e) => updateSetting('afternoon', e.target.checked, 'enabled')} className="rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 h-4 w-4" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Afternoon Check-in</span>
                        </div>
                        <input type="time" value={emailSettings.afternoon.time} onChange={(e) => updateSetting('afternoon', e.target.value, 'time')} disabled={!emailSettings.afternoon.enabled} className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white disabled:opacity-50 outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>

                      {/* Evening */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={emailSettings.evening.enabled} onChange={(e) => updateSetting('evening', e.target.checked, 'enabled')} className="rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 h-4 w-4" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Evening Encouragement</span>
                        </div>
                        <input type="time" value={emailSettings.evening.time} onChange={(e) => updateSetting('evening', e.target.value, 'time')} disabled={!emailSettings.evening.enabled} className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white disabled:opacity-50 outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>

                      {/* Night Summary */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={emailSettings.nightSummary.enabled} onChange={(e) => updateSetting('nightSummary', e.target.checked, 'enabled')} className="rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 h-4 w-4" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Night Summary</span>
                        </div>
                        <input type="time" value={emailSettings.nightSummary.time} onChange={(e) => updateSetting('nightSummary', e.target.value, 'time')} disabled={!emailSettings.nightSummary.enabled} className="text-sm border border-gray-300 dark:border-slate-600 rounded-lg px-2 py-1 bg-white dark:bg-slate-900 text-gray-900 dark:text-white disabled:opacity-50 outline-none focus:ring-2 focus:ring-primary-500" />
                      </div>

                      {/* Weekly Report & Inactivity */}
                      <div className="pt-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={emailSettings.weeklyReport.enabled} onChange={(e) => updateSetting('weeklyReport', e.target.checked, 'enabled')} className="rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 h-4 w-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Weekly Progress Report</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="checkbox" checked={emailSettings.inactivityReminder.enabled} onChange={(e) => updateSetting('inactivityReminder', e.target.checked, 'enabled')} className="rounded text-primary-600 focus:ring-primary-500 bg-white dark:bg-slate-900 border-gray-300 dark:border-slate-600 h-4 w-4" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">Inactivity Reminders (after 3 days)</span>
                        </label>
                      </div>

                      <div className="pt-4 flex justify-between items-center border-t border-gray-200 dark:border-slate-700">
                        <button 
                          onClick={handleSendTestEmail}
                          disabled={isSendingTest}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/50 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {isSendingTest ? 'Sending...' : 'Send Test Email'}
                        </button>

                        <button 
                          onClick={saveEmailSettings}
                          disabled={isSaving}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <Save className="h-4 w-4" />
                          {isSaving ? 'Saving...' : 'Save Preferences'}
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Analytics */}
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Activity className="h-4 w-4 text-blue-500" />
                          Email Analytics
                        </h4>
                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Total Sent</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{emailAnalytics.totalSent || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Success Rate</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{successRate}%</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500 dark:text-gray-400">Tasks Completed After Reminder</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{emailAnalytics.tasksCompletedAfterReminder || 0}</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-gray-200 dark:border-slate-700 pt-2">
                            <span className="text-gray-500 dark:text-gray-400">Last Sent</span>
                            <span className="text-xs font-medium text-gray-900 dark:text-white truncate max-w-[120px] text-right" title={formatTimestamp(emailAnalytics.lastSentAt)}>
                              {formatTimestamp(emailAnalytics.lastSentAt)}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* History */}
                      <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <History className="h-4 w-4 text-purple-500" />
                          Notification History
                        </h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Morning</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(emailLogs.morningTimestamp)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Afternoon</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(emailLogs.afternoonTimestamp)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Evening</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(emailLogs.eveningTimestamp)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Night Summary</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(emailLogs.nightSummaryTimestamp)}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-300">Inactivity</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{formatTimestamp(emailLogs.inactivityReminderTimestamp)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Calendar Settings */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary-500" />
                  Google Calendar Integration
                </h4>
                <div className="bg-gray-50 dark:bg-slate-800/50 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Status</p>
                    <p className={`text-sm ${hasCalendarToken ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {hasCalendarToken ? 'Connected' : 'Not connected'}
                    </p>
                  </div>
                  {hasCalendarToken ? (
                    <button
                      onClick={handleDisconnect}
                      className="px-3 py-1.5 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/30 rounded-lg text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={handleConnect}
                      className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium transition-colors"
                    >
                      Connect Calendar
                    </button>
                  )}
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Allow Last-Minute Life Saver to add deadlines and log completed tasks to your Google Calendar.
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
