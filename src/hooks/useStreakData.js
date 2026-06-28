import { useMemo } from 'react';

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

    tasks.forEach(task => {
      if (task.status === 'Completed') {
        let date = new Date(); // Fallback to today if timestamps are missing or pending
        const timestamp = task.completedAt || task.updatedAt || task.createdAt;
        
        if (timestamp) {
          if (typeof timestamp.toDate === 'function') {
            date = timestamp.toDate();
          } else if (timestamp instanceof Date) {
            date = timestamp;
          } else if (timestamp && typeof timestamp === 'object') {
            if (timestamp.seconds !== undefined && timestamp.seconds !== null) {
              date = new Date(timestamp.seconds * 1000);
            } else if (timestamp._seconds !== undefined && timestamp._seconds !== null) {
              date = new Date(timestamp._seconds * 1000);
            }
          } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
            date = new Date(timestamp);
          }
        }

        if (isNaN(date.getTime())) {
          date = new Date(); // Ensure validity
        }

        const dOffset = date.getTimezoneOffset() * 60000;
        const localDate = new Date(date.getTime() - dOffset);
        const dateString = localDate.toISOString().split('T')[0];
        
        rawCompletionData[dateString] = (rawCompletionData[dateString] || 0) + 1;
      }
    });

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

    let absoluteLongestStreak = 0;
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
      
      if (tempStreak > absoluteLongestStreak) {
        absoluteLongestStreak = tempStreak;
      }
    }

    if (calcStreak > absoluteLongestStreak) {
      absoluteLongestStreak = calcStreak;
    }

    const daysToShow = 90;
    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysToShow + 1);

    const startDayOfWeek = startDate.getDay();
    const gridStartDate = new Date(startDate);
    gridStartDate.setDate(startDate.getDate() - startDayOfWeek);

    const totalDays = Math.floor((today - gridStartDate) / (1000 * 60 * 60 * 24)) + 1;

    const weeksData = [];
    let currentWeek = [];

    for (let i = 0; i < totalDays; i++) {
      const d = new Date(gridStartDate);
      d.setDate(gridStartDate.getDate() + i);
      const dOffset = d.getTimezoneOffset() * 60000;
      const localD = new Date(d.getTime() - dOffset);
      const dateStr = localD.toISOString().split('T')[0];
      
      const count = rawCompletionData[dateStr] || 0;

      currentWeek.push({
        date: d,
        dateStr,
        count,
        inRange: d >= startDate
      });

      if (currentWeek.length === 7) {
        weeksData.push(currentWeek);
        currentWeek = [];
      }
    }
    
    if (currentWeek.length > 0) {
      weeksData.push(currentWeek);
    }

    return {
      rawCompletionData,
      calculatedCurrentStreak: calcStreak,
      stats: { longestStreak: absoluteLongestStreak, totalCompleted, totalProductiveDays },
      weeksData
    };
  }, [tasks]);
}
