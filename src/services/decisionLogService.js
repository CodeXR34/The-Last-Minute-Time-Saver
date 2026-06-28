import { db } from '../firebase';
import { collection, addDoc, setDoc, doc, serverTimestamp } from 'firebase/firestore';

export const EVENT_TYPES = {
  TASK_CREATED: 'TASK_CREATED',
  TASK_UPDATED: 'TASK_UPDATED',
  TASK_COMPLETED: 'TASK_COMPLETED',
  TASK_DELETED: 'TASK_DELETED',
  AI_SUBTASKS: 'AI_SUBTASKS',
  STREAK_INCREASED: 'STREAK_INCREASED',
};

const getEventMetadata = (eventType, taskTitle, extraData) => {
  switch (eventType) {
    case EVENT_TYPES.TASK_CREATED:
      return {
        title: 'Task Created',
        description: `Created: "${taskTitle}"`,
        aiInsight: 'Task logged successfully. Capturing your intentions is the first step to execution.',
        impact: 'Neutral',
        icon: 'Plus',
        priority: 'Info'
      };
    case EVENT_TYPES.TASK_UPDATED:
      return {
        title: 'Task Updated',
        description: `Updated: "${taskTitle}"`,
        aiInsight: 'Task details refined. Clarity drives productivity.',
        impact: 'Neutral',
        icon: 'Pencil',
        priority: 'Info'
      };
    case EVENT_TYPES.TASK_COMPLETED:
      return {
        title: 'Task Completed',
        description: `Completed: "${taskTitle}"`,
        aiInsight: 'Excellent work. Completing tasks builds momentum and discipline.',
        impact: 'Positive',
        icon: 'CheckCircle2',
        priority: 'Success'
      };
    case EVENT_TYPES.TASK_DELETED:
      return {
        title: 'Task Deleted',
        description: `Deleted: "${taskTitle}"`,
        aiInsight: 'Task removed. Keeping your workspace uncluttered is essential for focus.',
        impact: 'Neutral',
        icon: 'Trash2',
        priority: 'Info'
      };
    case EVENT_TYPES.AI_SUBTASKS:
      return {
        title: 'AI Subtasks Generated',
        description: `Generated subtasks for: "${taskTitle}"`,
        aiInsight: 'AI generated smaller subtasks to reduce cognitive load and simplify execution.',
        impact: 'Positive',
        icon: 'Sparkles',
        priority: 'Success'
      };
    case EVENT_TYPES.STREAK_INCREASED:
      return {
        title: 'Streak Increased',
        description: `You hit a ${extraData?.streak || ''} day streak!`,
        aiInsight: 'Consistency improved! Your daily dedication is building a powerful habit.',
        impact: 'Positive',
        icon: 'Flame',
        priority: 'Success'
      };
    default:
      return {
        title: 'System Event',
        description: 'An unknown event occurred.',
        aiInsight: 'System state logged.',
        impact: 'Neutral',
        icon: 'Activity',
        priority: 'Info'
      };
  }
};

/**
 * Logs a decision to the AI Decision Timeline.
 * 
 * @param {Object} params
 * @param {string} params.userId - The ID of the user.
 * @param {string} params.eventType - The type of event (from EVENT_TYPES).
 * @param {string} [params.taskId] - The related task ID (optional).
 * @param {string} [params.taskTitle] - The related task title (optional).
 * @param {boolean} [params.useDeterministicId] - If true, uses a deterministic ID to overwrite state.
 * @param {string} [params.deterministicId] - The specific ID to use if useDeterministicId is true.
 * @param {Object} [params.extraData] - Any additional data needed for the template.
 */
export const logDecision = async ({ 
  userId, 
  eventType, 
  taskId = null, 
  taskTitle = '',
  useDeterministicId = false, 
  deterministicId = null,
  extraData = {}
}) => {
  try {
    const meta = getEventMetadata(eventType, taskTitle, extraData);
    
    const logData = {
      userId,
      taskId,
      eventType,
      title: meta.title,
      description: meta.description,
      aiInsight: meta.aiInsight,
      impact: meta.impact,
      icon: meta.icon,
      priority: meta.priority,
      createdAt: serverTimestamp(),
      metadata: extraData
    };

    if (useDeterministicId && deterministicId) {
      await setDoc(doc(db, 'decisionLogs', deterministicId), logData, { merge: true });
    } else {
      await addDoc(collection(db, 'decisionLogs'), logData);
    }
  } catch (error) {
    console.error("Failed to log decision event:", error);
    // Fail silently to not disrupt the core application flow
  }
};
