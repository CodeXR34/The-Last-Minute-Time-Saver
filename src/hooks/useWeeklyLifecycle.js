import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { getCurrentWeekId, getWeekId, getTaskDate } from '../utils/dateHelpers';

export default function useWeeklyLifecycle(currentUser, tasks) {
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!currentUser || !tasks || tasks.length === 0 || isProcessing) return;

    const checkAndArchiveWeek = async () => {
      setIsProcessing(true);
      try {
        const currentWeekId = getCurrentWeekId();
        const settingsRef = doc(db, 'userSettings', currentUser.uid);
        const settingsSnap = await getDoc(settingsRef);
        
        let lastArchivedWeek = null;
        if (settingsSnap.exists()) {
          lastArchivedWeek = settingsSnap.data().lastArchivedWeek;
        }

        // If this is the first time checking, just set the current week as lastArchivedWeek to prevent immediately archiving everything
        if (!lastArchivedWeek) {
          await setDoc(settingsRef, { lastArchivedWeek: currentWeekId }, { merge: true });
          setIsProcessing(false);
          return;
        }

        if (currentWeekId > lastArchivedWeek) {
          // A new week has started! We need to archive tasks from previous weeks.
          
          // Group tasks by their week ID
          const tasksToArchive = tasks.filter(task => {
             // Only archive tasks that are not already archived
             if (task.isArchived) return false;
             
             const taskDate = getTaskDate(task.deadline || task.completedAt || task.createdAt || new Date());
             if (!taskDate || isNaN(taskDate.getTime())) return false;
             
             const taskWeekId = getWeekId(taskDate);
             return taskWeekId < currentWeekId;
          });

          if (tasksToArchive.length === 0) {
            // No tasks to archive, just update the lastArchivedWeek
            await setDoc(settingsRef, { lastArchivedWeek: currentWeekId }, { merge: true });
            setIsProcessing(false);
            return;
          }

          // Group by weekId to create insights documents
          const tasksByWeek = {};
          tasksToArchive.forEach(task => {
            const taskDate = getTaskDate(task.deadline || task.completedAt || task.createdAt || new Date());
            const taskWeekId = getWeekId(taskDate);
            if (!tasksByWeek[taskWeekId]) {
              tasksByWeek[taskWeekId] = [];
            }
            tasksByWeek[taskWeekId].push(task);
          });

          // Perform batch writes
          const batch = writeBatch(db);

          for (const [weekId, weekTasks] of Object.entries(tasksByWeek)) {
            let completed = 0;
            let pending = 0;
            
            weekTasks.forEach(task => {
              if (task.status === 'Completed') completed++;
              else pending++;
              
              // Archive the task
              const taskRef = doc(db, 'tasks', task.id);
              batch.update(taskRef, { 
                isArchived: true, 
                archivedWeekId: weekId 
              });
            });

            // Create Insights document
            const insightsRef = doc(db, 'insights', `${currentUser.uid}_${weekId}`);
            batch.set(insightsRef, {
              weekId,
              userId: currentUser.uid,
              totalTasks: weekTasks.length,
              completedTasks: completed,
              pendingTasks: pending,
              completionRate: weekTasks.length > 0 ? Math.round((completed / weekTasks.length) * 100) : 0,
              archivedAt: new Date().toISOString()
            }, { merge: true });
          }

          // Update user settings
          batch.set(settingsRef, { lastArchivedWeek: currentWeekId }, { merge: true });

          // Commit batch
          await batch.commit();
          console.log(`Successfully archived ${tasksToArchive.length} tasks up to week ${lastArchivedWeek}`);
        }
      } catch (error) {
        console.error("Error during weekly lifecycle check:", error);
      } finally {
        setIsProcessing(false);
      }
    };

    checkAndArchiveWeek();
  }, [currentUser, tasks, isProcessing]);
}
