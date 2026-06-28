import { differenceInDays, format, startOfWeek, addDays, isBefore } from 'date-fns';

export const getTaskDate = (deadline) => {
  if (!deadline) return null;
  return deadline.toDate ? deadline.toDate() : new Date(deadline);
};

export const getCurrentBusinessDate = () => {
  // Use Asia/Kolkata timezone offset (+5:30)
  const d = new Date();
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  istDate.setHours(0, 0, 0, 0);
  return istDate;
};

const getBusinessDateWithoutTime = (date) => {
  // Convert the given date to IST
  const d = new Date(date);
  const utc = d.getTime() + (d.getTimezoneOffset() * 60000);
  const istDate = new Date(utc + (3600000 * 5.5));
  istDate.setHours(0, 0, 0, 0);
  return istDate;
};

export const isTaskOverdue = (task) => {
  if (task.status === 'Completed' || !task.deadline) return false;
  const date = getTaskDate(task.deadline);
  const dateWithoutTime = getBusinessDateWithoutTime(date);
  return dateWithoutTime.getTime() < getCurrentBusinessDate().getTime();
};

export const isTaskToday = (task) => {
  if (task.status === 'Completed' || !task.deadline) return false;
  const date = getTaskDate(task.deadline);
  const dateWithoutTime = getBusinessDateWithoutTime(date);
  return dateWithoutTime.getTime() === getCurrentBusinessDate().getTime();
};

export const isTaskUpcoming = (task) => {
  if (task.status === 'Completed' || !task.deadline) return false;
  const date = getTaskDate(task.deadline);
  const dateWithoutTime = getBusinessDateWithoutTime(date);
  return dateWithoutTime.getTime() > getCurrentBusinessDate().getTime();
};

export const getSmartDateLabel = (date) => {
  if (!date) return '';
  const d = getTaskDate(date);
  const dateWithoutTime = getBusinessDateWithoutTime(d);
  const today = getCurrentBusinessDate();
  
  const diffTime = dateWithoutTime.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    const daysLate = Math.abs(diffDays);
    return `${daysLate} Day${daysLate > 1 ? 's' : ''} Overdue`;
  }
  
  if (diffDays === 0) return '🔥 Today';
  if (diffDays === 1) return '🌅 Tomorrow';
  
  if (diffDays > 1 && diffDays <= 7) {
    return `⏳ In ${diffDays} Days`;
  }
  
  return format(d, 'MMM d, yyyy');
};

export const getCurrentWeekDays = () => {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
  const days = [];
  for (let i = 0; i < 7; i++) {
    days.push(addDays(start, i));
  }
  return days;
};

// Generates a week ID string based on the Monday of the given date's week (e.g. "2026-06-22")
export const getWeekId = (date) => {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  return format(start, 'yyyy-MM-dd');
};

export const getCurrentWeekId = () => {
  return getWeekId(new Date());
};

