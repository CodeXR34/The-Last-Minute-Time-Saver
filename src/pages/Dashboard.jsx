import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Navigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

import ConsistencyHeatmap from '../components/dashboard/ConsistencyHeatmap';
import VitalStats from '../components/dashboard/VitalStats';
import TaskCard from '../components/TaskCard';
import TaskModal from '../components/TaskModal';
import DecisionLog from '../components/DecisionLog';
import { Plus, CheckCircle2, Clock, Calendar, Sparkles, Play, AlertCircle, CalendarDays, BarChart2 } from 'lucide-react';
import { format, isSameDay } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import useStreakData from '../hooks/useStreakData';
import { getTaskDate, isTaskOverdue, isTaskToday, getCurrentWeekDays } from '../utils/dateHelpers';

const AnimatedCounter = ({ value }) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
  >
    {value}
  </motion.span>
);

export default function Dashboard() {
  const { currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTask, setSelectedTask] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);

  // New States
  const [selectedDate, setSelectedDate] = useState(null);
  const [weekDays, setWeekDays] = useState([]);

  useEffect(() => {
    setWeekDays(getCurrentWeekDays());
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'tasks'),
      where('userId', '==', currentUser.uid)
    );

    const unsubscribeTasks = onSnapshot(q, (querySnapshot) => {
      const tasksData = [];
      querySnapshot.forEach((doc) => {
        tasksData.push({ id: doc.id, ...doc.data() });
      });
      setTasks(tasksData);
      setLoading(false);

      setSelectedTask(prevSelected => {
        if (!prevSelected) return null;
        const updatedTask = tasksData.find(t => t.id === prevSelected.id);
        return updatedTask || null;
      });
    }, (error) => {
      console.error("[Dashboard] Error fetching tasks:", error);
      setLoading(false);
    });

    return () => {
      unsubscribeTasks();
    };
  }, [currentUser]);

  const streakData = useStreakData(tasks);

  if (!currentUser) {
    return <Navigate to="/" />;
  }

  // Derived Task Categorization
  const baseTasks = selectedDate
    ? tasks.filter(t => t.deadline && isSameDay(getTaskDate(t.deadline), selectedDate))
    : tasks;

  const overdueTasks = [];
  const todayTasks = [];
  const upcomingTasks = [];
  const completedTasks = [];

  baseTasks.forEach(task => {
    if (task.status === 'Completed') {
      completedTasks.push(task);
    } else if (isTaskOverdue(task)) {
      overdueTasks.push(task);
    } else if (isTaskToday(task)) {
      todayTasks.push(task);
    } else {
      upcomingTasks.push(task);
    }
  });

  const sortByPriorityAndDeadline = (a, b) => {
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    const pA = priorityWeight[a.priority] || 2;
    const pB = priorityWeight[b.priority] || 2;
    if (pA !== pB) return pB - pA;
    const dateA = getTaskDate(a.deadline) || new Date(8640000000000000);
    const dateB = getTaskDate(b.deadline) || new Date(8640000000000000);
    return dateA - dateB;
  };

  const sortByDeadlineAndPriority = (a, b) => {
    const dateA = getTaskDate(a.deadline) || new Date(8640000000000000);
    const dateB = getTaskDate(b.deadline) || new Date(8640000000000000);
    if (dateA.getTime() !== dateB.getTime()) return dateA - dateB;
    const priorityWeight = { High: 3, Medium: 2, Low: 1 };
    return (priorityWeight[b.priority] || 2) - (priorityWeight[a.priority] || 2);
  };

  overdueTasks.sort((a, b) => {
    const dateA = getTaskDate(a.deadline) || new Date(8640000000000000);
    const dateB = getTaskDate(b.deadline) || new Date(8640000000000000);
    return dateA - dateB;
  });
  todayTasks.sort(sortByPriorityAndDeadline);
  upcomingTasks.sort(sortByDeadlineAndPriority);
  completedTasks.sort((a, b) => (getTaskDate(b.completedAt) || 0) - (getTaskDate(a.completedAt) || 0));

  // Today's Summary Computing
  const totalToday = todayTasks.length + tasks.filter(t => t.status === 'Completed' && isTaskToday({ ...t, status: 'Pending' })).length;
  // We count completed today by pretending they are pending to pass the isTaskToday check.
  const completedToday = tasks.filter(t => t.status === 'Completed' && isTaskToday({ ...t, status: 'Pending' })).length;
  const pendingToday = todayTasks.length;
  const todayProgressPercent = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);

  // Render Helpers
  const renderTaskGrid = (taskList, emptyMessage, icon = <LayoutList className="h-6 w-6" />) => {
    if (taskList.length === 0) {
      return (
        <div className="bg-[#FDF8F1]/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-xl border border-[#E6D8C8] dark:border-slate-800 p-8 text-center mt-4 transition-colors">
          <div className="mx-auto h-12 w-12 text-[#A89F91] dark:text-gray-500 bg-[#F9F4EC] dark:bg-slate-800 rounded-xl flex items-center justify-center mb-3">
            {icon}
          </div>
          <p className="text-sm font-medium text-[#7B6B5B] dark:text-gray-400">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
        <AnimatePresence>
          {taskList.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            >
              <TaskCard
                task={task}
                isSelected={selectedTask?.id === task.id}
                onClick={() => setSelectedTask(task)}
                onEdit={(task) => {
                  setTaskToEdit(task);
                  setIsModalOpen(true);
                }}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>
    );
  };

  const hasTasksForDate = (date) => tasks.some(t => t.deadline && isSameDay(getTaskDate(t.deadline), date));
  const allTasksCompletedForDate = (date) => {
    const dateTasks = tasks.filter(t => t.deadline && isSameDay(getTaskDate(t.deadline), date));
    return dateTasks.length > 0 && dateTasks.every(t => t.status === 'Completed');
  };

  return (
    <div className="min-h-screen bg-[#F7F1E8] dark:bg-slate-950 font-sans flex flex-col transition-colors duration-200 relative overflow-hidden">
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-400/10 dark:bg-indigo-600/10 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-lighten hidden dark:block"></div>
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-green-400/10 dark:bg-green-600/10 rounded-full blur-3xl pointer-events-none mix-blend-multiply dark:mix-blend-lighten hidden dark:block"></div>

      <Navbar currentStreak={streakData.calculatedCurrentStreak} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col lg:flex-row gap-8 relative z-10">

        {/* Left Content Column */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-end mb-6">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {(currentUser?.displayName || currentUser?.email?.split('@')[0] || 'User').split(' ')[0]}
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Here is an overview of your productivity.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm transition-all active:scale-95"
            >
              <Plus className="h-5 w-5 mr-1.5" />
              Add Task
            </button>
          </div>



          <VitalStats
            stats={streakData.stats}
            currentStreak={streakData.calculatedCurrentStreak}
          />

          {/* 2. Calendar Strip */}
          <div className="bg-[#FDF8F1] dark:bg-slate-900 rounded-2xl p-4 border border-[#E6D8C8] dark:border-slate-800 mb-6 flex justify-between overflow-x-auto gap-2 shadow-sm">
            {weekDays.map(day => {
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDate && isSameDay(day, selectedDate);
              const hasTasks = hasTasksForDate(day);
              const allCompleted = allTasksCompletedForDate(day);

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(isSelected ? null : day)}
                  className={`flex flex-col items-center min-w-[3.5rem] py-2 px-1 rounded-xl transition-colors ${isSelected ? 'bg-indigo-600 text-white shadow-md' :
                      isToday ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300' :
                        'hover:bg-[#F2ECE4] dark:hover:bg-slate-800 text-[#7B6B5B] dark:text-gray-400'
                    }`}
                >
                  <span className="text-xs font-semibold uppercase tracking-wider mb-1 opacity-80">{format(day, 'EEE')}</span>
                  <span className="text-lg font-bold">{format(day, 'd')}</span>
                  <div className="h-1.5 mt-1 flex items-center justify-center">
                    {hasTasks && !allCompleted && <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-indigo-500'}`} />}
                    {allCompleted && <CheckCircle2 className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-green-500'}`} />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* 3. Navigation Tabs */}
          <div className="border-b border-[#E6D8C8] dark:border-slate-800 mb-6">
            <nav className="-mb-px flex space-x-6 sm:space-x-8 overflow-x-auto" aria-label="Tabs">
              <button
                onClick={() => { setActiveTab('dashboard'); setSelectedTask(null); }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'dashboard'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-[#7B6B5B] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
              >
                Dashboard
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-[#E6D8C8] dark:bg-slate-800 text-[#7B6B5B] dark:text-gray-300'
                  }`}>
                  <AnimatedCounter value={todayTasks.length} />
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('pending'); setSelectedTask(null); }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'pending'
                    ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                    : 'border-transparent text-[#7B6B5B] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
              >
                Pending
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors ${activeTab === 'pending' ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' : 'bg-[#E6D8C8] dark:bg-slate-800 text-[#7B6B5B] dark:text-gray-300'
                  }`}>
                  <AnimatedCounter value={overdueTasks.length} />
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('future'); setSelectedTask(null); }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'future'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-[#7B6B5B] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
              >
                Future
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors ${activeTab === 'future' ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-[#E6D8C8] dark:bg-slate-800 text-[#7B6B5B] dark:text-gray-300'
                  }`}>
                  <AnimatedCounter value={upcomingTasks.length} />
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('completed'); setSelectedTask(null); }}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'completed'
                    ? 'border-green-500 text-green-600 dark:text-green-400'
                    : 'border-transparent text-[#7B6B5B] dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-slate-600'
                  }`}
              >
                Completed
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium transition-colors ${activeTab === 'completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-[#E6D8C8] dark:bg-slate-800 text-[#7B6B5B] dark:text-gray-300'
                  }`}>
                  <AnimatedCounter value={completedTasks.length} />
                </span>
              </button>
            </nav>
          </div>

          {/* 4. Tab Content: Dashboard */}
          {activeTab === 'dashboard' && (
            <>
              {/* Today's Summary */}
              {!selectedDate && (
                <div className="bg-white dark:bg-slate-800/80 rounded-2xl p-5 border border-[#E6D8C8] dark:border-slate-700 mb-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center shrink-0">
                      <BarChart2 className="h-6 w-6" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#3B2F2F] dark:text-white flex items-center gap-2">
                        Today's Summary
                      </h2>
                      <div className="flex items-center gap-3 text-sm text-[#7B6B5B] dark:text-gray-400 mt-1 font-medium">
                        <span>{totalToday} Tasks</span>
                        <span>&bull;</span>
                        <span className="text-green-600 dark:text-green-400">{completedToday} Completed</span>
                        <span>&bull;</span>
                        <span>{pendingToday} Remaining</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs w-full">
                    <div className="flex justify-between text-xs font-bold text-[#7B6B5B] dark:text-gray-400 mb-2">
                      <span>Progress</span>
                      <span>{todayProgressPercent}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#E6D8C8] dark:bg-slate-700 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-green-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${todayProgressPercent}%` }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Mobile Consistency Heatmap */}
              <div className="block lg:hidden mb-8 overflow-x-auto">
                <ConsistencyHeatmap weeksData={streakData.weeksData} />
              </div>

              {/* 🔥 Today's Tasks */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4 border-b border-[#E6D8C8] dark:border-slate-800 pb-2">
                  <span className="text-xl">🔥</span>
                  <h2 className="text-lg font-extrabold text-[#3B2F2F] dark:text-white">{selectedDate ? format(selectedDate, 'MMMM d') : "Today's Focus"}</h2>
                  <span className="bg-[#E6D8C8] text-[#7B6B5B] dark:bg-slate-800 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs font-bold ml-2">
                    {todayTasks.length}
                  </span>
                </div>
                {renderTaskGrid(todayTasks, selectedDate ? `No tasks scheduled for ${format(selectedDate, 'MMM d')}.` : "No tasks for today 🎉", <Sparkles className="h-6 w-6 text-orange-500" />)}
              </div>
            </>
          )}

          {/* Pending Tab Content */}
          {activeTab === 'pending' && (
            <div className="mb-8">
              {overdueTasks.length > 0 ? (
                <>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-2xl p-5 border border-orange-200 dark:border-orange-900/50 mb-6 shadow-sm flex flex-col gap-1">
                    <h2 className="text-base font-bold text-orange-800 dark:text-orange-300">
                      You have {overdueTasks.length} overdue task{overdueTasks.length > 1 ? 's' : ''}.
                    </h2>
                    <p className="text-sm text-orange-700 dark:text-orange-400">
                      Complete them to regain your consistency streak.
                    </p>
                  </div>
                  {renderTaskGrid(overdueTasks, "", <AlertCircle className="h-6 w-6 text-orange-500" />)}
                </>
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 rounded-2xl p-8 border border-green-200 dark:border-green-900/50 mt-4 text-center">
                  <div className="mx-auto h-12 w-12 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 rounded-xl flex items-center justify-center mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-green-800 dark:text-green-300 mb-1">🎉 Great work!</h3>
                  <p className="text-sm font-medium text-green-700 dark:text-green-400">
                    You have no overdue tasks.<br />Keep your consistency streak alive.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 5. Tab Content: Future */}
          {activeTab === 'future' && (
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 border-b border-[#E6D8C8] dark:border-slate-800 pb-2">
                <CalendarDays className="w-5 h-5 text-indigo-500" />
                <h2 className="text-lg font-extrabold text-[#3B2F2F] dark:text-white">Upcoming Tasks</h2>
                <span className="bg-[#E6D8C8] text-[#7B6B5B] dark:bg-slate-800 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs font-bold ml-2">
                  {upcomingTasks.length}
                </span>
              </div>
              {renderTaskGrid(upcomingTasks, selectedDate ? `No upcoming tasks scheduled for ${format(selectedDate, 'MMM d')}.` : "No upcoming tasks.", <CalendarDays className="h-6 w-6 text-indigo-400" />)}
            </div>
          )}

          {/* 6. Tab Content: Completed */}
          {activeTab === 'completed' && (
            <div className="mb-8 opacity-80">
              <div className="flex items-center gap-2 mb-4 border-b border-[#E6D8C8] dark:border-slate-800 pb-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <h2 className="text-lg font-extrabold text-[#3B2F2F] dark:text-white">Completed Tasks</h2>
                <span className="bg-[#E6D8C8] text-[#7B6B5B] dark:bg-slate-800 dark:text-gray-400 py-0.5 px-2 rounded-full text-xs font-bold ml-2">
                  {completedTasks.length}
                </span>
              </div>
              {renderTaskGrid(completedTasks, selectedDate ? `No tasks were completed on ${format(selectedDate, 'MMM d')}.` : "No completed tasks yet.", <CheckCircle2 className="h-6 w-6 text-green-500" />)}
            </div>
          )}

          {/* Mobile Decision Log */}
          <div className="block lg:hidden mt-8">
            <DecisionLog />
          </div>

        </div>

        {/* Right Columns (Desktop Only) */}
        <div className="hidden lg:flex lg:w-80 flex-shrink-0 lg:mt-0 flex-col gap-6 sticky top-24 h-[calc(100vh-8rem)] overflow-y-auto pb-8 custom-scrollbar">
          <ConsistencyHeatmap weeksData={streakData.weeksData} />
          <DecisionLog />
        </div>
      </main>

      <Footer />

      <TaskModal
        isOpen={isModalOpen}
        taskToEdit={taskToEdit}
        onClose={() => {
          setIsModalOpen(false);
          setTaskToEdit(null);
        }}
      />
    </div>
  );
}
