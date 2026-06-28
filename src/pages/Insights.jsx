import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { getTaskDate } from '../utils/dateHelpers';
import { ChevronDown, ChevronUp, CheckCircle2, Circle, Trash2, ArrowRight, Activity, BarChart2 } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

export default function Insights() {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [insights, setInsights] = useState([]);
  const [archivedTasks, setArchivedTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedWeek, setExpandedWeek] = useState(null);

  const fetchData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      // Fetch insights
      const insightsQuery = query(
        collection(db, 'insights'),
        where('userId', '==', currentUser.uid)
      );
      const insightsSnap = await getDocs(insightsQuery);
      const insightsData = insightsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      // Sort insights by weekId descending (newest first)
      insightsData.sort((a, b) => b.weekId.localeCompare(a.weekId));
      setInsights(insightsData);

      // Fetch archived tasks
      const tasksQuery = query(
        collection(db, 'tasks'),
        where('userId', '==', currentUser.uid),
        where('isArchived', '==', true)
      );
      const tasksSnap = await getDocs(tasksQuery);
      const tasksData = tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setArchivedTasks(tasksData);
    } catch (error) {
      console.error("Error fetching insights data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentUser]);

  const toggleWeek = (weekId) => {
    setExpandedWeek(expandedWeek === weekId ? null : weekId);
  };

  const handleCarryForward = async (task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      // Remove archive flags and set deadline to today to carry it forward
      await updateDoc(taskRef, {
        isArchived: false,
        archivedWeekId: null,
        deadline: new Date().toISOString()
      });
      addToast('Task carried forward to current week!', 'success');
      fetchData(); // Refresh UI
    } catch (error) {
      console.error("Error carrying forward task:", error);
      addToast('Failed to carry forward task.', 'error');
    }
  };

  const handleMarkCompleted = async (task) => {
    try {
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        status: 'Completed',
        completedAt: new Date().toISOString()
      });
      addToast('Task marked as completed.', 'success');
      fetchData();
    } catch (error) {
      console.error("Error completing task:", error);
      addToast('Failed to complete task.', 'error');
    }
  };

  const handleDelete = async (task) => {
    if (window.confirm('Are you sure you want to permanently delete this task?')) {
      try {
        await deleteDoc(doc(db, 'tasks', task.id));
        addToast('Task deleted permanently.', 'info');
        fetchData();
      } catch (error) {
        console.error("Error deleting task:", error);
        addToast('Failed to delete task.', 'error');
      }
    }
  };

  if (!currentUser) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-[#F7F1E8] dark:bg-slate-950 font-sans flex flex-col transition-colors duration-200">
      <Navbar currentStreak={0} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col relative z-10">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <Activity className="h-8 w-8 text-indigo-500" />
            Insights & History
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Review your past weeks' performance and manage your archived tasks.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
          </div>
        ) : insights.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-10 text-center border border-[#E6D8C8] dark:border-slate-800 shadow-sm">
            <BarChart2 className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Historical Data Yet</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Your weekly analytics and archived tasks will appear here automatically every Monday. Check back next week!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {insights.map((week) => {
              const weekTasks = archivedTasks.filter(t => t.archivedWeekId === week.weekId);
              const completedTasks = weekTasks.filter(t => t.status === 'Completed');
              const pendingTasks = weekTasks.filter(t => t.status !== 'Completed');
              const isExpanded = expandedWeek === week.weekId;

              return (
                <div key={week.id} className="bg-white dark:bg-slate-900 rounded-[20px] shadow-sm border border-[#E6D8C8] dark:border-slate-800 overflow-hidden transition-colors">
                  {/* Header / Analytics Summary */}
                  <div 
                    onClick={() => toggleWeek(week.weekId)}
                    className="p-5 sm:p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors flex flex-col sm:flex-row justify-between sm:items-center gap-4"
                  >
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        Week of {week.weekId}
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
                        <span>{week.totalTasks} Tasks</span>
                        <span>&bull;</span>
                        <span className="text-emerald-600 dark:text-emerald-400">{week.completedTasks} Completed</span>
                        <span>&bull;</span>
                        <span className="text-orange-500 dark:text-orange-400">{week.pendingTasks} Pending</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <div className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{week.completionRate}%</div>
                        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Completion Rate</div>
                      </div>
                      {isExpanded ? <ChevronUp className="h-6 w-6 text-gray-400" /> : <ChevronDown className="h-6 w-6 text-gray-400" />}
                    </div>
                  </div>

                  {/* Expanded Task History */}
                  {isExpanded && (
                    <div className="px-5 sm:px-6 pb-6 pt-2 border-t border-gray-100 dark:border-slate-800/60">
                      
                      {/* Completed Tasks */}
                      <div className="mb-6 mt-4">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          Completed History
                        </h3>
                        {completedTasks.length > 0 ? (
                          <ul className="space-y-2">
                            {completedTasks.map(task => (
                              <li key={task.id} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-slate-700/50">
                                <CheckCircle2 className="h-4 w-4 text-emerald-500 opacity-60" />
                                <span className="line-through opacity-70">{task.title}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No tasks completed this week.</p>
                        )}
                      </div>

                      {/* Pending Tasks */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                          <Circle className="h-4 w-4 text-orange-500" />
                          Pending History
                        </h3>
                        {pendingTasks.length > 0 ? (
                          <ul className="space-y-3">
                            {pendingTasks.map(task => (
                              <li key={task.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-gray-800 dark:text-gray-200 bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30">
                                <div className="flex items-center gap-3 font-medium">
                                  <Circle className="h-4 w-4 text-orange-400 shrink-0" />
                                  {task.title}
                                </div>
                                <div className="flex items-center gap-2 sm:ml-auto">
                                  <button 
                                    onClick={() => handleCarryForward(task)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold hover:bg-indigo-200 dark:hover:bg-indigo-900/60 transition-colors whitespace-nowrap"
                                  >
                                    <ArrowRight className="h-3.5 w-3.5" /> Carry Forward
                                  </button>
                                  <button 
                                    onClick={() => handleMarkCompleted(task)}
                                    className="p-1.5 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                                    title="Mark Completed"
                                  >
                                    <CheckCircle2 className="h-4.5 w-4.5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(task)}
                                    className="p-1.5 text-red-500 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-colors"
                                    title="Delete Permanently"
                                  >
                                    <Trash2 className="h-4.5 w-4.5" />
                                  </button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="text-sm text-gray-500 dark:text-gray-400 italic">No pending tasks left behind.</p>
                        )}
                      </div>

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
