import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNowStrict } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Pencil, 
  CheckCircle2, 
  Trash2, 
  Sparkles, 
  Flame, 
  Activity,
  Bot
} from 'lucide-react';

const ICON_MAP = {
  Plus,
  Pencil,
  CheckCircle2,
  Trash2,
  Sparkles,
  Flame,
  Activity
};

const PRIORITY_STYLES = {
  Info: 'bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-900/20 dark:text-blue-400',
  Success: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400',
  Warning: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400',
  Critical: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400'
};

const IMPACT_STYLES = {
  Positive: 'text-green-600 dark:text-green-400 border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/10',
  Neutral: 'text-gray-600 dark:text-gray-400 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50',
  Negative: 'text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10'
};

const formatRelativeTime = (date) => {
  if (!date) return 'Just now';
  const distance = formatDistanceToNowStrict(date, { addSuffix: true });
  if (distance === '0 seconds ago') return 'Just now';
  return distance;
};

export default function DecisionLog() {
  const { currentUser } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'decisionLogs'),
      where('userId', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
      limit(30)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const logsData = [];
      snapshot.forEach(doc => {
        logsData.push({ id: doc.id, ...doc.data() });
      });
      setLogs(logsData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching decision logs:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <div className="bg-[#FDF8F1]/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-[#E6D8C8] dark:border-slate-800 p-8 text-center mt-4 transition-colors">
        <div className="mx-auto h-12 w-12 text-[#A89F91] dark:text-gray-500 bg-[#F9F4EC] dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
          <Bot className="h-6 w-6" />
        </div>
        <p className="text-sm font-medium text-[#7B6B5B] dark:text-gray-400">No AI observations yet.</p>
        <p className="text-xs text-[#A89F91] dark:text-gray-500 mt-1">Start interacting with tasks to generate insights.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-sm p-5 transition-colors">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Bot className="h-5 w-5 text-indigo-500" />
          AI Decision Timeline
        </h3>
        <span className="text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 py-1 px-2 rounded-lg">
          Live Feed
        </span>
      </div>

      <div className="relative border-l border-gray-200 dark:border-slate-700 ml-3 md:ml-4 space-y-6">
        <AnimatePresence>
          {logs.map((log) => {
            const IconComponent = ICON_MAP[log.icon] || ICON_MAP.Activity;
            const logDate = log.createdAt?.toDate ? log.createdAt.toDate() : new Date();

            return (
              <motion.div 
                key={log.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative pl-6 sm:pl-8"
              >
                {/* Timeline Node */}
                <span className="absolute -left-3.5 flex items-center justify-center w-7 h-7 bg-white dark:bg-slate-900 rounded-full ring-4 ring-white dark:ring-slate-900">
                  <div className={`w-full h-full rounded-full flex items-center justify-center ${PRIORITY_STYLES[log.priority] || PRIORITY_STYLES.Info} ring-1 ring-inset`}>
                    <IconComponent className="w-3.5 h-3.5" />
                  </div>
                </span>

                <div className="bg-gray-50 dark:bg-slate-800/40 rounded-xl p-4 border border-gray-100 dark:border-slate-700/50 hover:border-gray-200 dark:hover:border-slate-600 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-bold text-gray-900 dark:text-white leading-none">
                          {log.title}
                        </h4>
                        <span className={`inline-flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-[9px] uppercase font-bold tracking-wider ring-1 ring-inset ${PRIORITY_STYLES[log.priority] || PRIORITY_STYLES.Info}`}>
                          {log.priority}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {log.description}
                      </p>
                    </div>
                    <time className="text-[11px] font-medium text-gray-400 dark:text-gray-500 shrink-0 whitespace-nowrap">
                      {formatRelativeTime(logDate)}
                    </time>
                  </div>

                  {log.aiInsight && (
                    <div className={`mt-3 p-3 rounded-lg border ${IMPACT_STYLES[log.impact] || IMPACT_STYLES.Neutral}`}>
                      <div className="flex gap-2">
                        <Sparkles className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-widest opacity-70 block mb-0.5">
                            AI Insight
                          </span>
                          <p className="text-xs font-medium leading-relaxed">
                            {log.aiInsight}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
