import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { logDecision, EVENT_TYPES } from '../services/decisionLogService';

import { createCalendarEvent } from '../services/calendarService';
import { useToast } from '../contexts/ToastContext';

const PRIORITIES = ['Low', 'Medium', 'High'];

export default function TaskModal({ isOpen, onClose, taskToEdit = null }) {
  const { currentUser } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    deadline: '',
    priority: 'Medium'
  });

  useEffect(() => {
    if (isOpen) {
      if (taskToEdit) {
        let dateStr = '';
        if (taskToEdit.deadline) {
          const d = taskToEdit.deadline.toDate ? taskToEdit.deadline.toDate() : new Date(taskToEdit.deadline);
          dateStr = d.toISOString().split('T')[0];
        }
        setFormData({
          title: taskToEdit.title || '',
          description: taskToEdit.description || '',
          deadline: dateStr,
          priority: taskToEdit.priority || 'Medium'
        });
      } else {
        setFormData({ title: '', description: '', deadline: '', priority: 'Medium' });
      }
      setShowWarning(false);
    }
  }, [isOpen, taskToEdit]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'description' && showWarning && value.trim().length > 0) {
      setShowWarning(false);
    }
  };

  const handleClose = () => {
    setShowWarning(false);
    onClose();
  };



  const handleSubmit = async (e, forceSubmit = false) => {
    if (e) e.preventDefault();
    if (!currentUser) return;
    
    // Prevent Invalid Date crash if somehow submitted empty
    if (!formData.title.trim() || !formData.deadline) {
      addToast("Please fill in the required fields (Title and Deadline).", "error");
      return;
    }

    if (!formData.description.trim() && !forceSubmit) {
      setShowWarning(true);
      return;
    }
    
    setLoading(true);
    try {
      let docId = taskToEdit?.id;
      
      const deadlineDate = new Date(formData.deadline);
      // Validate date object
      if (isNaN(deadlineDate.getTime())) {
         addToast("Invalid deadline date provided.", "error");
         setLoading(false);
         return;
      }

      if (taskToEdit) {
        await updateDoc(doc(db, 'tasks', docId), {
          title: formData.title,
          description: formData.description,
          deadline: deadlineDate,
          priority: formData.priority
        });
        
        await logDecision({
          userId: currentUser.uid,
          eventType: EVENT_TYPES.TASK_UPDATED,
          taskId: docId,
          taskTitle: formData.title
        });
      } else {
        const taskData = {
          userId: currentUser.uid,
          title: formData.title,
          description: formData.description,
          deadline: deadlineDate,
          priority: formData.priority,
          status: 'Pending',
          createdAt: serverTimestamp()
        };

        const token = sessionStorage.getItem('googleCalendarToken');
        // --- TEMPORARILY DISABLED CALENDAR SYNC TO AVOID OAUTH WARNING ---
        // if (token && formData.deadline) {
        //   try {
        //     const eventId = await createCalendarEvent(taskData, token);
        //     taskData.calendarEventId = eventId;
        //   } catch (err) {
        //     if (err.message === 'TOKEN_EXPIRED') {
        //       addToast('Google Calendar sync paused. Please reconnect in settings.', 'warning', 5000);
        //     } else if (err.message === 'PERMISSION_DENIED') {
        //       addToast('Calendar sync failed: Permission denied. App may be unverified.', 'warning', 5000);
        //     } else {
        //       console.error("Calendar creation failed:", err);
        //     }
        //   }
        // }

        const docRef = await addDoc(collection(db, 'tasks'), taskData);
        docId = docRef.id;

        await logDecision({
          userId: currentUser.uid,
          eventType: EVENT_TYPES.TASK_CREATED,
          taskId: docId,
          taskTitle: formData.title
        });
      }
      
      setFormData({
        title: '',
        description: '',
        deadline: '',
        priority: 'Medium'
      });
      setShowWarning(false);
      onClose();
    } catch (error) {
      console.error("Error adding document: ", error);
      addToast("An error occurred while saving the task.", "error");
    } finally {
      // Always reset loading state!
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:p-0">
        
        <div className="fixed inset-0 bg-gray-500/75 dark:bg-slate-900/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={handleClose}></div>

        <div className="relative inline-block align-bottom bg-white dark:bg-slate-900 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-100 dark:border-slate-800">
          <div className="bg-white dark:bg-slate-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-gray-100 dark:border-slate-800">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-xl leading-6 font-bold text-gray-900 dark:text-white" id="modal-title">
                {taskToEdit ? 'Edit Task' : 'Create New Task'}
              </h3>
              <button onClick={handleClose} className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-300 rounded-full p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Task Title <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  placeholder="e.g. Finish quarterly report"
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                  <span>Description</span>
                  <span className="text-xs text-primary-600 dark:text-primary-400 font-normal bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-full">Highly Recommended</span>
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  className={`mt-1 block w-full bg-white dark:bg-slate-950 border ${showWarning ? 'border-amber-400 dark:border-amber-500 ring-1 ring-amber-400 dark:ring-amber-500' : 'border-gray-300 dark:border-slate-700'} text-gray-900 dark:text-white rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors`}
                  placeholder="Describe the task in detail. Include requirements, goals, expected work, submission details, or anything that will help AI understand the task."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Deadline <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    name="deadline"
                    id="deadline"
                    required
                    value={formData.deadline}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <select
                    name="priority"
                    id="priority"
                    value={formData.priority}
                    onChange={handleChange}
                    className="mt-1 block w-full bg-white dark:bg-slate-950 border border-gray-300 dark:border-slate-700 text-gray-900 dark:text-white rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm transition-colors"
                  >
                    {PRIORITIES.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {showWarning ? (
                <div className="mt-6">
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 mr-3 flex-shrink-0" />
                      <p className="text-sm text-amber-800 dark:text-amber-200 font-medium">
                        Detailed descriptions help AI generate better schedules, estimates and recommendations.
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => handleSubmit(null, true)}
                      disabled={loading}
                      className="bg-white dark:bg-slate-800 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors disabled:opacity-50"
                    >
                      Continue Anyway
                    </button>
                    <button
                      type="button"
                      onClick={() => document.getElementById('description').focus()}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                    >
                      Add Description
                    </button>
                  </div>
                </div>
              ) : (
                <div className="pt-4 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="bg-white dark:bg-slate-800 py-2 px-4 border border-gray-300 dark:border-slate-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 transition-colors"
                  >
                    {loading ? 'Saving...' : taskToEdit ? 'Save Changes' : 'Add Task'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
