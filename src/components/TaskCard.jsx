import React, { useState, useRef, useEffect } from 'react';
import { format, isToday, isPast } from 'date-fns';
import { Calendar, CheckCircle2, Circle, Pencil, Trash2, Sparkles, Folder, Clock, ChevronDown, ChevronUp, Plus, X } from 'lucide-react';
import { db } from '../firebase';
import { doc, updateDoc, deleteDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { updateCalendarEventComplete } from '../services/calendarService';
import { generateSubtasks } from '../services/geminiService';
import { getSmartDateLabel, isTaskToday, isTaskOverdue } from '../utils/dateHelpers';
import { useToast } from '../contexts/ToastContext';
import { motion, AnimatePresence } from 'framer-motion';
import { logDecision, EVENT_TYPES } from '../services/decisionLogService';

// --- Subcomponents ---

const getPriorityEmoji = (p) => {
  if (p === 'High') return '🔴';
  if (p === 'Medium') return '🟡';
  return '🟢';
};

const priorityColors = {
  High: 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/20 dark:text-red-400',
  Medium: 'bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/20 dark:text-amber-400',
  Low: 'bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/20 dark:text-green-400'
};

const TaskHeader = ({ task, isCompleted, isUpdating, onToggle, isGeneratingSubtasks, onGenerateSubtasks }) => {
  const isToday = isTaskToday(task);
  const isOverdue = isTaskOverdue(task);

  return (
    <div className="flex flex-col mb-3 gap-2">
      {/* Badges Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] uppercase font-bold tracking-wider ring-1 ring-inset ${priorityColors[task.priority] || priorityColors.Medium} dark:bg-opacity-20`}>
            <span>{getPriorityEmoji(task.priority)}</span> {task.priority} Priority
          </span>
          {!isCompleted && isToday && (
            <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400">
              🔥 Today
            </span>
          )}
          {!isCompleted && isOverdue && (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400">
                {getSmartDateLabel(task.deadline)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] uppercase font-bold tracking-wider bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-600/20 dark:bg-orange-900/20 dark:text-orange-400">
                Due: {format(task.deadline.toDate ? task.deadline.toDate() : new Date(task.deadline), 'd MMM')}
              </span>
            </>
          )}
        </div>
      </div>
      
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
        <div 
          onClick={(e) => { e.stopPropagation(); onToggle(e); }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              e.stopPropagation();
              onToggle(e);
            }
          }}
          tabIndex={0}
          role="button"
          aria-label={isCompleted ? "Mark task as pending" : "Mark task as completed"}
          className="flex items-start gap-3 flex-1 min-w-0 cursor-pointer group/title focus:outline-none rounded"
        >
          <div className="mt-0.5 flex-shrink-0 text-[#B8AFA6] dark:text-gray-500 group-hover/title:text-[#4E8B7C] dark:group-hover/title:text-green-500 transition-colors duration-200">
            {isCompleted ? (
              <CheckCircle2 className="h-6 w-6 text-[#4E8B7C] dark:text-green-500" />
            ) : (
              <Circle className="h-6 w-6" />
            )}
          </div>
          <h3 className={`font-semibold text-lg leading-snug line-clamp-2 transition-all duration-200 ${isCompleted ? 'text-[#B8AFA6] dark:text-gray-500 line-through opacity-70' : 'text-[#3B2F2F] dark:text-white group-hover/title:text-[#4E8B7C] dark:group-hover/title:text-green-400'}`}>
            {task.title}
          </h3>
        </div>

        {!isCompleted && (
          <button 
            onClick={(e) => { e.stopPropagation(); onGenerateSubtasks(e); }}
            disabled={isGeneratingSubtasks}
            className="flex-shrink-0 flex items-center gap-1.5 text-[11px] font-medium text-[#7E65A3] dark:text-indigo-400 bg-[#F4EFFB] dark:bg-indigo-900/20 hover:bg-[#EBE2F6] dark:hover:bg-indigo-900/40 py-1.5 px-3 rounded transition-colors disabled:opacity-50"
            aria-label="Generate AI Subtasks"
          >
            {isGeneratingSubtasks ? (
              <>
                <div className="h-3.5 w-3.5 border-2 border-[#7E65A3] dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{task.subtasksGenerated ? "Regenerate AI" : "AI Subtasks"}</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const TaskDescription = ({ description, isCompleted }) => {
  if (!description) {
    return (
      <p className="text-sm text-[#B8AFA6] dark:text-gray-500 italic mb-3 pl-9">
        No description provided
      </p>
    );
  }
  return (
    <p className={`text-sm mb-3 line-clamp-2 pl-9 ${isCompleted ? 'text-[#B8AFA6] dark:text-gray-600 opacity-70' : 'text-[#7B6B5B] dark:text-gray-400'}`}>
      {description}
    </p>
  );
};

const SubtaskItem = ({ subtask, idx, onToggle, onEdit, onDelete, isUpdating }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(subtask.title);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      onEdit(idx, editTitle);
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditTitle(subtask.title);
    }
  };

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, overflow: 'hidden', transition: { duration: 0.2 } }}
      onClick={(e) => { e.stopPropagation(); onToggle(e, idx); }}
      className="flex items-start gap-3 text-sm group/subtask hover:bg-[#FDF8F1] dark:hover:bg-slate-800/80 p-2 -ml-2 rounded-lg transition-colors relative cursor-pointer"
    >
      <div className="mt-0.5 text-[#B8AFA6] group-hover/subtask:text-[#4E8B7C] dark:text-gray-400 dark:group-hover/subtask:text-green-500 transition-colors">
        {subtask.completed ? (
          <CheckCircle2 className="h-4 w-4 text-[#4E8B7C] dark:text-green-500" />
        ) : (
          <Circle className="h-4 w-4" />
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-start">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={editTitle}
            onChange={e => setEditTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              onEdit(idx, editTitle);
              setIsEditing(false);
            }}
            onClick={(e) => e.stopPropagation()}
            className="w-full bg-white dark:bg-slate-900 border border-[#E6D8C8] dark:border-slate-700 rounded px-2 py-1 text-sm text-[#3B2F2F] dark:text-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
          />
        ) : (
          <span className={`${subtask.completed ? 'text-[#B8AFA6] dark:text-gray-500 line-through opacity-70' : 'text-[#3B2F2F] dark:text-gray-200 group-hover/subtask:text-[#4E8B7C] dark:group-hover/subtask:text-green-400'} transition-all duration-200 break-words`}>
            {subtask.title}
          </span>
        )}
        <div className="mt-1.5 flex">
          <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold tracking-wider ${subtask.isManual ? 'bg-[#F2ECE4] text-[#8B7C6E] dark:bg-slate-800 dark:text-gray-400' : 'bg-[#F4EFFB] text-[#7E65A3] dark:bg-indigo-900/30 dark:text-indigo-400'}`}>
            {subtask.isManual ? '👤 MANUAL' : '✨ AI'}
          </span>
        </div>
      </div>

      <div className="opacity-0 group-hover/subtask:opacity-100 transition-opacity flex items-center gap-1 shrink-0 absolute right-2 top-2 bg-gradient-to-l from-[#FDF8F1] dark:from-slate-800 via-[#FDF8F1] dark:via-slate-800 pl-4">
        <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1.5 text-[#B8AFA6] hover:text-[#7E65A3] dark:text-gray-400 dark:hover:text-indigo-400 rounded transition-colors" aria-label="Edit subtask">
          <Pencil className="h-3.5 w-3.5" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(idx); }} className="p-1.5 text-[#B8AFA6] hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 rounded transition-colors" aria-label="Delete subtask">
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </motion.div>
  );
};

const SubtaskList = ({ subtasks, isCompleted, onToggle, onEdit, onDelete, isUpdating }) => {
  const [showAll, setShowAll] = useState(false);
  
  if (!subtasks || subtasks.length === 0) return null;

  const displaySubtasks = showAll ? subtasks : subtasks.slice(0, 5);
  const hasMore = subtasks.length > 5;
  const totalCount = subtasks.length;

  return (
    <div className="mb-2">
      <div className="space-y-1">
        <AnimatePresence initial={false}>
          {displaySubtasks.map((subtask, idx) => (
            <SubtaskItem 
              key={subtask.id || `${idx}-${subtask.title}`} 
              idx={idx}
              subtask={subtask}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
              isUpdating={isUpdating}
            />
          ))}
        </AnimatePresence>
      </div>

      {hasMore && (
        <button 
          onClick={(e) => { e.stopPropagation(); setShowAll(!showAll); }}
          className="mt-3 text-xs font-medium text-[#7B6B5B] dark:text-gray-400 hover:text-[#3B2F2F] dark:hover:text-gray-200 flex items-center gap-1 transition-colors"
        >
          {showAll ? <><ChevronUp className="h-3.5 w-3.5" /> Show Less</> : <><ChevronDown className="h-3.5 w-3.5" /> Show {totalCount - 5} More</>}
        </button>
      )}
    </div>
  );
};

const SubtaskSection = ({ task, isCompleted, onToggle, onEdit, onDelete, isUpdating, onAdd, onGenerateAI, isGeneratingAI }) => {
  const subtasks = task.subtasks || [];
  const hasSubtasks = subtasks.length > 0;
  const totalCount = subtasks.length;
  const completedCount = subtasks.filter(s => s.completed).length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);

  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    if (isAdding && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isAdding]);

  const handleAddSubmit = () => {
    if (newTitle.trim()) {
      onAdd(newTitle);
      setNewTitle('');
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAddSubmit();
    if (e.key === 'Escape') {
      setIsAdding(false);
      setNewTitle('');
    }
  };

  return (
    <div className={`bg-[#F9F4EC] dark:bg-slate-900/50 rounded-xl p-2 border border-[#E6D8C8] dark:border-slate-800 mb-3 transition-all`}>
      {/* Always show Progress Header & Bar */}
      <div className="px-1 pt-1 pb-2">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold text-[#7B6B5B] dark:text-gray-400 uppercase tracking-wider">Subtasks</span>
          <span className="text-xs font-medium text-[#7B6B5B] dark:text-gray-400 flex items-center gap-1.5">
            <span>{completedCount} / {totalCount} Completed</span>
            <span>&bull;</span>
            <div className="w-8 text-right font-semibold text-[#4E8B7C] dark:text-green-500 overflow-hidden relative h-4">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={progressPercent}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute inset-0 block"
                >
                  {progressPercent}%
                </motion.span>
              </AnimatePresence>
            </div>
          </span>
        </div>
        <div className="h-1 w-full bg-[#E6D8C8] dark:bg-slate-800 rounded-full mb-3 overflow-hidden">
          <motion.div 
            className="h-full bg-[#4E8B7C] dark:bg-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          />
        </div>
      </div>

      {hasSubtasks ? (
        <SubtaskList subtasks={subtasks} isCompleted={isCompleted} onToggle={onToggle} onEdit={onEdit} onDelete={onDelete} isUpdating={isUpdating} />
      ) : (
        <div className="flex flex-col items-center justify-center py-2">
          <p className="text-xs text-[#A89F91] dark:text-gray-500 mb-2 font-medium">No subtasks yet.</p>
          {!isCompleted && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
              <button 
                onClick={(e) => { e.stopPropagation(); onGenerateAI(); }}
                disabled={isGeneratingAI}
                className="text-xs font-medium text-[#7E65A3] dark:text-indigo-400 bg-[#F4EFFB] dark:bg-indigo-900/20 hover:bg-[#EBE2F6] dark:hover:bg-indigo-900/40 py-1.5 px-3 rounded-full transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {isGeneratingAI ? <div className="h-3.5 w-3.5 border-2 border-[#7E65A3] dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div> : <Sparkles className="h-3.5 w-3.5" />}
                {isGeneratingAI ? 'Generating...' : 'Generate with AI'}
              </button>
              <span className="text-[#A89F91] dark:text-gray-600 text-xs hidden sm:inline font-medium">or</span>
              <button 
                onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
                className="text-xs font-medium text-[#7B6B5B] dark:text-gray-400 hover:text-[#3B2F2F] dark:hover:text-gray-200 transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-4 w-4" /> Add manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Input Dropdown */}
      <AnimatePresence>
        {isAdding && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mt-2"
          >
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                placeholder="Write a new subtask..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={handleKeyDown}
                onClick={(e) => e.stopPropagation()}
                className="flex-1 bg-white dark:bg-slate-900 border border-[#E6D8C8] dark:border-slate-700 rounded-lg px-3 py-2 text-sm text-[#3B2F2F] dark:text-white focus:outline-none focus:border-[#B8AFA6] transition-colors"
              />
              <button onClick={(e) => { e.stopPropagation(); handleAddSubmit(); }} className="bg-[#3B2F2F] dark:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#251D1D] dark:hover:bg-slate-600 transition-colors">
                Add
              </button>
              <button onClick={(e) => { e.stopPropagation(); setIsAdding(false); setNewTitle(''); }} className="p-2 text-[#A89F91] hover:text-[#3B2F2F] dark:text-gray-400 dark:hover:text-white transition-colors" aria-label="Cancel">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {hasSubtasks && !isAdding && !isCompleted && (
        <button 
          onClick={(e) => { e.stopPropagation(); setIsAdding(true); }}
          className="mt-2 text-xs font-semibold text-[#7B6B5B] dark:text-gray-400 hover:text-[#3B2F2F] dark:hover:text-gray-200 transition-colors flex items-center gap-2 group"
        >
          <div className="bg-[#F2ECE4] dark:bg-slate-800 p-1 rounded group-hover:bg-[#E6D8C8] dark:group-hover:bg-slate-700 transition-colors">
            <Plus className="h-3.5 w-3.5" />
          </div>
          Add Subtask
        </button>
      )}
    </div>
  );
};

const TaskFooter = ({ task, isCompleted, onEdit, onDelete }) => {
  const deadlineDate = task.deadline?.toDate ? task.deadline.toDate() : new Date(task.deadline);
  
  return (
    <div className="flex flex-wrap items-center justify-between mt-auto pt-2 border-t border-[#E6D8C8] dark:border-slate-800/50">
      <div className="flex items-center gap-3 flex-wrap">
        <div className={`inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full text-xs transition-colors ${isCompleted ? 'bg-[#F2ECE4] text-[#A89F91] dark:bg-slate-800/50 dark:text-gray-500' : 'bg-white border border-[#E6D8C8] text-[#7B6B5B] dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300'}`}>
          <Calendar className="h-3.5 w-3.5" />
          {getSmartDateLabel(task.deadline)}
        </div>
        
        {task.category && (
          <div className={`inline-flex items-center gap-1.5 font-medium px-3 py-1.5 rounded-full text-xs transition-colors ${isCompleted ? 'bg-[#F2ECE4] text-[#A89F91] dark:bg-slate-800/50 dark:text-gray-500' : 'bg-white border border-[#E6D8C8] text-[#7B6B5B] dark:bg-slate-800 dark:border-slate-700 dark:text-gray-300'}`}>
            <Folder className="h-3.5 w-3.5" />
            {task.category}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit(task); }}
          className="p-2 text-[#A89F91] hover:text-[#3B2F2F] dark:text-gray-500 dark:hover:text-[#7E65A3] rounded-lg hover:bg-[#F2ECE4] dark:hover:bg-indigo-900/30 transition-colors"
          title="Edit Task"
          aria-label="Edit Task"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete(e); }}
          className="p-2 text-[#A89F91] hover:text-[#D95D5D] dark:text-gray-500 dark:hover:text-red-400 rounded-lg hover:bg-[#FDF3F3] dark:hover:bg-red-900/30 transition-colors"
          title="Delete Task"
          aria-label="Delete Task"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// --- Main TaskCard Component ---

export default function TaskCard({ task, isSelected, onClick, onEdit }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGeneratingSubtasks, setIsGeneratingSubtasks] = useState(false);
  const { addToast } = useToast();
  
  const isCompleted = task.status === 'Completed';

  // 4px left-border accent for Priority indicator
  let priorityAccentClass = 'border-[#E6D8C8] dark:border-slate-700';
  if (!isCompleted) {
    if (task.priority === 'High') {
      priorityAccentClass = 'border-l-[4px] border-l-[#D95D5D] border-y-[#E6D8C8] border-r-[#E6D8C8] dark:border-l-red-500 dark:border-y-slate-700 dark:border-r-slate-700';
    } else if (task.priority === 'Medium') {
      priorityAccentClass = 'border-l-[4px] border-l-[#D08C38] border-y-[#E6D8C8] border-r-[#E6D8C8] dark:border-l-amber-500 dark:border-y-slate-700 dark:border-r-slate-700';
    } else if (task.priority === 'Low') {
      priorityAccentClass = 'border-l-[4px] border-l-[#4E8B7C] border-y-[#E6D8C8] border-r-[#E6D8C8] dark:border-l-green-500 dark:border-y-slate-700 dark:border-r-slate-700';
    }
  }

  const handleToggle = async (e, subtaskIndex = null) => {
    e?.stopPropagation();
    if (isUpdating) return;
    setIsUpdating(true);
    
    try {
      const taskRef = doc(db, 'tasks', task.id);
      let newStatus = task.status;
      let newSubtasks = task.subtasks ? [...task.subtasks] : [];
      let newCompletedAt = task.completedAt;

      if (subtaskIndex !== null) {
        newSubtasks[subtaskIndex] = {
          ...newSubtasks[subtaskIndex],
          completed: !newSubtasks[subtaskIndex].completed
        };
        const allSubtasksCompleted = newSubtasks.length > 0 && newSubtasks.every(st => st.completed);
        
        if (allSubtasksCompleted) {
          newStatus = 'Completed';
          newCompletedAt = serverTimestamp();
        } else if (newStatus === 'Completed' && !newSubtasks[subtaskIndex].completed) {
          newStatus = 'Pending';
          newCompletedAt = null;
        }
      } else {
        const isCompleting = newStatus === 'Pending';
        newStatus = isCompleting ? 'Completed' : 'Pending';
        newCompletedAt = isCompleting ? serverTimestamp() : null;
        newSubtasks = newSubtasks.map(st => ({
          ...st,
          completed: isCompleting
        }));
      }

      const updateData = {
        status: newStatus,
        subtasks: newSubtasks,
      };
      
      if (newCompletedAt !== undefined) {
        updateData.completedAt = newCompletedAt;
      }

      await updateDoc(taskRef, updateData);

      const isNewlyCompleted = newStatus === 'Completed' && task.status !== 'Completed';

      if (isNewlyCompleted) {
        // Handle Calendar Sync
        const token = sessionStorage.getItem('googleCalendarToken');
        // --- TEMPORARILY DISABLED CALENDAR SYNC TO AVOID OAUTH WARNING ---
        // if (token && task.calendarEventId) {
        //   try {
        //     await updateCalendarEventComplete(task.calendarEventId, task, token);
        //     addToast('Task synced to Google Calendar!', 'success');
        //   } catch (err) {
        //     if (err.message === 'TOKEN_EXPIRED') {
        //       addToast('Google Calendar connection expired. Please reconnect in settings.', 'warning', 5000);
        //     } else if (err.message === 'PERMISSION_DENIED') {
        //       addToast('Calendar sync failed: Permission denied. App may be unverified.', 'warning', 5000);
        //     } else {
        //       console.error("Calendar update failed:", err);
        //     }
        //   }
        // }

        // Handle Streaks
        try {
          const userRef = doc(db, 'users', task.userId);
          await runTransaction(db, async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) {
              transaction.set(userRef, { currentStreak: 1, longestStreak: 1, lastCompletionDate: serverTimestamp() });
              return { newStreak: 1, increased: true };
            }
            
            const data = userDoc.data();
            const lastDate = data.lastCompletionDate?.toDate();
            const today = new Date();
            let newCurrent = data.currentStreak || 0;
            let newLongest = data.longestStreak || 0;
            let increased = false;

            if (!lastDate) {
              newCurrent = 1;
              increased = true;
            } else {
              const isTodayMatch = lastDate.toDateString() === today.toDateString();
              if (!isTodayMatch) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                if (lastDate.toDateString() === yesterday.toDateString()) {
                  newCurrent += 1;
                  increased = true;
                } else {
                  newCurrent = 1;
                  // If it resets to 1, we don't necessarily consider it "Streak Increased" in a positive sense, 
                  // but we did complete a task to start a new streak. Let's still count it as increased from 0.
                  increased = true; 
                }
              }
            }
            
            if (newCurrent > newLongest) newLongest = newCurrent;

            transaction.update(userRef, {
              currentStreak: newCurrent,
              longestStreak: newLongest,
              lastCompletionDate: serverTimestamp()
            });
            return { newStreak: newCurrent, increased };
          }).then(async ({ newStreak, increased }) => {
            if (increased) {
              await logDecision({
                userId: task.userId,
                eventType: EVENT_TYPES.STREAK_INCREASED,
                extraData: { streak: newStreak }
              });
            }

            if (newStreak === 7 || newStreak === 30 || newStreak === 100) {
              addToast(`🎉 Huge milestone: ${newStreak} day streak!`, 'success', 5000);
              window.dispatchEvent(new CustomEvent('streakMilestone', { detail: newStreak }));
            }
          });
        } catch(err) {
          console.error("Error updating streak:", err);
        }

        await logDecision({
          userId: task.userId,
          eventType: EVENT_TYPES.TASK_COMPLETED,
          taskId: task.id,
          taskTitle: task.title
        });
      }

    } catch (error) {
      console.error("Error updating task state:", error);
      addToast("Couldn't update task. Please try again.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGenerateSubtasks = async (e) => {
    e?.stopPropagation();
    if (isGeneratingSubtasks) return;
    setIsGeneratingSubtasks(true);
    
    try {
      const generated = await generateSubtasks(task);
      const subtasks = generated.map(s => ({ title: s.title, completed: false, isManual: false, id: crypto.randomUUID() }));
      
      const taskRef = doc(db, 'tasks', task.id);
      await updateDoc(taskRef, {
        subtasks,
        subtasksGenerated: true
      });
      addToast('Subtasks generated successfully!', 'success');
      
      await logDecision({
        userId: task.userId,
        eventType: EVENT_TYPES.AI_SUBTASKS,
        taskId: task.id,
        taskTitle: task.title
      });
    } catch (err) {
      console.error("Failed to generate subtasks:", err);
      if (err?.status === 429 || (err.message && err.message.includes('429')) || (err.message && err.message.toLowerCase().includes('quota'))) {
        addToast("AI quota reached, try again later", "error", 7000);
      } else {
        addToast("Failed to generate subtasks. Please try again.", "error");
      }
    } finally {
      setIsGeneratingSubtasks(false);
    }
  };

  const handleAddManualSubtask = async (title) => {
    if (!title.trim() || isUpdating) return;
    setIsUpdating(true);
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const newSubtask = { title, completed: false, isManual: true, id: crypto.randomUUID() };
      const newSubtasks = [...(task.subtasks || []), newSubtask];
      await updateDoc(taskRef, { subtasks: newSubtasks });
    } catch(err) {
      console.error("Error adding subtask:", err);
      addToast("Couldn't update task. Please try again.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditSubtask = async (idx, newTitle) => {
    if (!newTitle.trim() || isUpdating) return;
    setIsUpdating(true);
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const newSubtasks = [...task.subtasks];
      newSubtasks[idx] = { ...newSubtasks[idx], title: newTitle };
      await updateDoc(taskRef, { subtasks: newSubtasks });
    } catch(err) {
      console.error("Error editing subtask:", err);
      addToast("Couldn't update task. Please try again.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteSubtask = async (idx) => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const taskRef = doc(db, 'tasks', task.id);
      const newSubtasks = [...task.subtasks];
      newSubtasks.splice(idx, 1);
      
      let newStatus = task.status;
      let newCompletedAt = task.completedAt;
      if (newSubtasks.length > 0 && newSubtasks.every(s => s.completed)) {
        newStatus = 'Completed';
        newCompletedAt = serverTimestamp();
      } else if (newSubtasks.some(s => !s.completed) && newStatus === 'Completed') {
        newStatus = 'Pending';
        newCompletedAt = null;
      }

      const updateData = { subtasks: newSubtasks, status: newStatus };
      if (newCompletedAt !== undefined) {
        updateData.completedAt = newCompletedAt;
      }

      await updateDoc(taskRef, updateData);
    } catch(err) {
      console.error("Error deleting subtask:", err);
      addToast("Couldn't update task. Please try again.", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async (e) => {
    e?.stopPropagation();
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await deleteDoc(doc(db, 'tasks', task.id));
        await logDecision({
          userId: task.userId,
          eventType: EVENT_TYPES.TASK_DELETED,
          taskId: task.id,
          taskTitle: task.title
        });
      } catch (error) {
        console.error("Error deleting task:", error);
      }
    }
  };

  return (
    <div 
      id={`task-card-${task.id}`}
      onClick={onClick}
      className={`bg-[#FDF8F1] dark:bg-slate-900 rounded-[18px] p-5 flex flex-col min-h-[140px] transition-all duration-500 group cursor-pointer border ${priorityAccentClass} ${
        isCompleted ? 'opacity-60' : ''
      } ${
        isSelected ? 'ring-2 ring-indigo-500/50 shadow-md' : 
        'hover:shadow-md hover:border-[#D4C3B0] dark:hover:border-slate-600 dark:hover:shadow-none'
      }`}
    >
      <TaskHeader 
        task={task} 
        isCompleted={isCompleted} 
        isUpdating={isUpdating} 
        onToggle={handleToggle} 
        isGeneratingSubtasks={isGeneratingSubtasks} 
        onGenerateSubtasks={handleGenerateSubtasks} 
      />
      
      <TaskDescription description={task.description} isCompleted={isCompleted} />

      <SubtaskSection 
        task={task} 
        isCompleted={isCompleted} 
        onToggle={handleToggle} 
        onEdit={handleEditSubtask} 
        onDelete={handleDeleteSubtask} 
        isUpdating={isUpdating} 
        onAdd={handleAddManualSubtask} 
        onGenerateAI={handleGenerateSubtasks} 
        isGeneratingAI={isGeneratingSubtasks} 
      />

      <TaskFooter 
        task={task} 
        isCompleted={isCompleted} 
        onEdit={onEdit} 
        onDelete={handleDelete} 
      />
    </div>
  );
}
