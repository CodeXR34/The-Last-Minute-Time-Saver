import { useMemo } from 'react';
import { getTaskDate } from '../utils/dateHelpers';

export default function useStreakData(tasks = []) {
  return useMemo(() => {
    const rawCompletionData = {};
    let totalCompleted = 0;
    let totalProductiveDays = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const offset = today.getTimezoneOffset() * 60000;
    const todayStr = new Date(today.getTime() - offset).toISOString().split('T')[0];

    const yesterdayDate = new Date(today);
    yesterdayDate.setDate(today.getDate() - 1);
    const yesterdayStr = new Date(yesterdayDate.getTime() - offset).toISOString().split('T')[0];

    // Data structure for the current week (Mon-Sun) to find Most Productive Day
    const currentWeekData = {};
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // Find current week's Monday
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday
    const daysSinceMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const currentMonday = new Date(today);
    currentMonday.setDate(today.getDate() - daysSinceMonday);

    for (let i = 0; i < 7; i++) {
      const d = new Date(currentMonday);
      d.setDate(currentMonday.getDate() + i);
      const dStr = new Date(d.getTime() - offset).toISOString().split('T')[0];
      currentWeekData[dStr] = {
        total: 0,
        completed: 0,
        dayName: dayNames[d.getDay()],
        date: new Date(d)
      };
    }

    // Process tasks for raw completion and current week productivity
    tasks.forEach(task => {
      // 1. Raw Completion (for Streaks/Heatmap)
      if (task.status === 'Completed') {
        let date = new Date();
        const timestamp = task.completedAt || task.updatedAt || task.createdAt;

        if (timestamp) {
          if (typeof timestamp.toDate === 'function') date = timestamp.toDate();
          else if (timestamp instanceof Date) date = timestamp;
          else if (timestamp && typeof timestamp === 'object') {
            if (timestamp.seconds !== undefined) date = new Date(timestamp.seconds * 1000);
            else if (timestamp._seconds !== undefined) date = new Date(timestamp._seconds * 1000);
          } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            date = new Date(timestamp);
          }
        }
        if (isNaN(date.getTime())) date = new Date();

        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        const dateString = localDate.toISOString().split('T')[0];

        rawCompletionData[dateString] = (rawCompletionData[dateString] || 0) + 1;
      }

      // 2. Current Week Productivity Tracking
      // We look at the task's deadline to categorize it into a specific day of the week
      if (task.deadline) {
        const deadlineDate = getTaskDate(task.deadline);
        if (deadlineDate && !isNaN(deadlineDate.getTime())) {
          const localDeadline = new Date(deadlineDate.getTime() - (deadlineDate.getTimezoneOffset() * 60000));
          const deadlineStr = localDeadline.toISOString().split('T')[0];

          if (currentWeekData[deadlineStr]) {
            currentWeekData[deadlineStr].total += 1;
            if (task.status === 'Completed') {
              currentWeekData[deadlineStr].completed += 1;
            }
          }
        }
      }
    });

    // Calculate Streak
    let calcStreak = 0;
    let checkDateStr = todayStr;
    let checkDate = new Date(today);

    if (rawCompletionData[todayStr] && rawCompletionData[todayStr] > 0) {
      while (rawCompletionData[checkDateStr] && rawCompletionData[checkDateStr] > 0) {
        calcStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = new Date(checkDate.getTime() - offset).toISOString().split('T')[0];
      }
    } else if (rawCompletionData[yesterdayStr] && rawCompletionData[yesterdayStr] > 0) {
      checkDate = yesterdayDate;
      checkDateStr = yesterdayStr;
      while (rawCompletionData[checkDateStr] && rawCompletionData[checkDateStr] > 0) {
        calcStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
        checkDateStr = new Date(checkDate.getTime() - offset).toISOString().split('T')[0];
      }
    }

    // Calculate Longest Streak natively from data
    let derivedLongestStreak = 0;
    const sortedDates = Object.keys(rawCompletionData).filter(d => rawCompletionData[d] > 0).sort();
    let tempStreak = 0;
    let previousDate = null;

    for (const dStr of sortedDates) {
      const c = rawCompletionData[dStr];
      totalCompleted += c;
      totalProductiveDays++;

      const currentDate = new Date(dStr);
      currentDate.setHours(0, 0, 0, 0);

      if (previousDate) {
        const diffDays = Math.round((currentDate - previousDate) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      previousDate = currentDate;

      if (tempStreak > derivedLongestStreak) {
        derivedLongestStreak = tempStreak;
      }
    }
    if (calcStreak > derivedLongestStreak) derivedLongestStreak = calcStreak;

    // LOCAL STORAGE CACHING FOR LONGEST STREAK (Never goes down)
    const storedLongestStreak = parseInt(localStorage.getItem('hackathon_longestStreak') || '0', 10);
    const absoluteLongestStreak = Math.max(derivedLongestStreak, storedLongestStreak);

    if (absoluteLongestStreak > storedLongestStreak) {
      localStorage.setItem('hackathon_longestStreak', absoluteLongestStreak.toString());
    }

    // Heatmap / Grid Data
    const daysToShow = 90;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);

    const startDayOfWeek = startDate.getDay();
    const gridStartDate = new Date(startDate);
    gridStartDate.setDate(startDate.getDate() - startDayOfWeek);

    const totalDays = Math.floor((today - gridStartDate) / (1000 * 60 * 60 * 24)) + 1;
    const weeksData = [];
    let currentWeekList = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(gridStartDate);
      d.setDate(gridStartDate.getDate() + i);
      const dOffset = d.getTimezoneOffset() * 60000;
      const localD = new Date(d.getTime() - dOffset);
      const dateStr = localD.toISOString().split('T')[0];

      const count = rawCompletionData[dateStr] || 0;

      currentWeekList.push({
        date: d,
        dateStr,
        count,
        inRange: d >= startDate
      });

      if (currentWeekList.length === 7) {
        weeksData.push(currentWeekList);
        currentWeekList = [];
      }
    }
    if (currentWeekList.length > 0) weeksData.push(currentWeekList);

    // Calculate Most Productive Day
    let mostProductiveDay = null; // null represents zero-state
    let maxPercent = -1;

    // Convert to array and sort by date so tie-breakers automatically pick the most recent day
    const weekDaysArr = Object.values(currentWeekData).sort((a, b) => a.date - b.date);

    for (const dayData of weekDaysArr) {
      if (dayData.total > 0) {
        const percent = Math.round((dayData.completed / dayData.total) * 100);
        // Using >= ensures that ties are overridden by the more recent day (due to sorting)
        if (percent >= maxPercent && percent > 0) {
          maxPercent = percent;
          mostProductiveDay = {
            dayName: dayData.dayName,
            percent: percent
          };
        }
      }
    }

    return {
      rawCompletionData,
      calculatedCurrentStreak: calcStreak,
      stats: {
        longestStreak: absoluteLongestStreak,
        totalCompleted,
        totalProductiveDays,
        mostProductiveDay
      },
      weeksData
    };
  }, [tasks]);
}
