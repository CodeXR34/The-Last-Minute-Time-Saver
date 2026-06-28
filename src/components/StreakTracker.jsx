import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Flame, CheckCircle2, TrendingUp, RefreshCw } from 'lucide-react';

export default function StreakTracker({ streakData }) {
  const [tooltip, setTooltip] = useState({ show: false, x: 0, y: 0, data: null });

  if (!streakData) {
    return null; // or loading state
  }

  const { weeksData, calculatedCurrentStreak, stats } = streakData;

  const getHeatmapColor = (count) => {
    if (count === 0) return 'bg-gray-100 dark:bg-slate-800';
    if (count === 1) return 'bg-green-200 dark:bg-green-900/40';
    if (count <= 3) return 'bg-green-400 dark:bg-green-700/60';
    if (count <= 5) return 'bg-green-600 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-400'; // 6+ tasks
  };

  const getProductivityLevel = (count) => {
    if (count === 0) return 'No productivity recorded';
    if (count === 1) return 'Low';
    if (count <= 3) return 'Medium';
    if (count <= 5) return 'High';
    return 'Exceptional';
  };

  const getInsight = () => {
    if (calculatedCurrentStreak >= 4) {
      return {
        title: "Excellent Consistency",
        text: `You completed tasks for ${calculatedCurrentStreak} consecutive days.`,
        icon: <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />,
        bg: "bg-green-50 dark:bg-green-900/20",
        border: "border-green-200 dark:border-green-900/50",
        titleColor: "text-green-800 dark:text-green-300",
        textColor: "text-green-700 dark:text-green-400"
      };
    } else if (calculatedCurrentStreak > 0) {
      return {
        title: "Good Momentum",
        text: `Completing one more task tomorrow will extend your streak to ${calculatedCurrentStreak + 1} days.`,
        icon: <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400" />,
        bg: "bg-blue-50 dark:bg-blue-900/20",
        border: "border-blue-200 dark:border-blue-900/50",
        titleColor: "text-blue-800 dark:text-blue-300",
        textColor: "text-blue-700 dark:text-blue-400"
      };
    } else {
      return {
        title: "Getting Back on Track",
        text: "Consistency dropped this week. Try completing one task today to restart your streak.",
        icon: <RefreshCw className="w-5 h-5 text-orange-600 dark:text-orange-400" />,
        bg: "bg-orange-50 dark:bg-orange-900/20",
        border: "border-orange-200 dark:border-orange-900/50",
        titleColor: "text-orange-800 dark:text-orange-300",
        textColor: "text-orange-700 dark:text-orange-400"
      };
    }
  };

  const insight = getInsight();

  const handleMouseMove = (e, day) => {
    setTooltip({
      show: true,
      x: e.clientX,
      y: e.clientY,
      data: day
    });
  };

  const handleMouseLeave = () => {
    setTooltip({ ...tooltip, show: false });
  };

  // Calculate proportional month widths to naturally fit layout
  const monthLabels = [];
  let currentMonth = null;
  let currentMonthWeeks = 0;

  weeksData.forEach((week) => {
    const monthName = week[0].date.toLocaleString('default', { month: 'short' });
    if (!currentMonth) {
      currentMonth = monthName;
      currentMonthWeeks = 1;
    } else if (currentMonth === monthName) {
      currentMonthWeeks++;
    } else {
      monthLabels.push({ name: currentMonth, weeks: currentMonthWeeks });
      currentMonth = monthName;
      currentMonthWeeks = 1;
    }
  });
  if (currentMonth) {
    monthLabels.push({ name: currentMonth, weeks: currentMonthWeeks });
  }

  return (
    <div className="space-y-6">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-200 dark:border-slate-800 shadow-sm relative">
        
        {/* Tooltip */}
        <AnimatePresence>
          {tooltip.show && tooltip.data && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full pb-2"
              style={{ left: tooltip.x, top: tooltip.y - 10 }}
            >
              <div className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-3 py-2 rounded-lg shadow-xl text-xs whitespace-nowrap border border-gray-700 dark:border-gray-200">
                <p className="font-bold mb-0.5 text-center">
                  {tooltip.data.count} task{tooltip.data.count !== 1 ? 's' : ''} completed
                </p>
                <p className="text-gray-300 dark:text-gray-600 text-center">
                  {tooltip.data.date.toLocaleDateString(undefined, { 
                    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
                  })}
                </p>
                <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-gray-900 dark:border-t-white"></div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Consistency</h3>
          </div>
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">90 Days</span>
        </div>

        {/* REPLACED overflow-x-auto with standard block to fix horizontal scroll. Month labels redesign using proportion widths! */}
        <div className="pb-2 w-full overflow-x-auto scrollbar-width-none ms-overflow-style-none [&::-webkit-scrollbar]:hidden">
          <div className="min-w-max">
            {/* Month Labels */}
            <div className="flex justify-between mb-2 h-4 pl-[20px] pr-2">
              {monthLabels.map((m, i) => (
                <div key={i} className="text-[10px] font-medium text-gray-500 dark:text-gray-400 shrink-0">
                  {m.name}
                </div>
              ))}
            </div>

          {/* Grid */}
          <div className="flex gap-2">
            {/* Day of Week Labels */}
            <div className="flex flex-col gap-1 text-[9px] text-gray-400 font-medium justify-between py-1">
              <span className="leading-[12px]">Sun</span>
              <span className="leading-[12px] invisible">Mon</span>
              <span className="leading-[12px]">Tue</span>
              <span className="leading-[12px] invisible">Wed</span>
              <span className="leading-[12px]">Thu</span>
              <span className="leading-[12px] invisible">Fri</span>
              <span className="leading-[12px]">Sat</span>
            </div>

            {/* Heatmap Squares */}
            <div className="flex gap-1" onMouseLeave={handleMouseLeave}>
              {weeksData.map((week, wIndex) => (
                <div key={wIndex} className="flex flex-col gap-1">
                  {week.map((day, dIndex) => (
                    <div 
                      key={`${wIndex}-${dIndex}`}
                      onMouseMove={(e) => handleMouseMove(e, day)}
                      className={`w-3 h-3 rounded-[2px] transition-all duration-200 hover:ring-2 hover:ring-gray-400 hover:ring-offset-1 hover:ring-offset-white dark:hover:ring-offset-slate-900 ${
                        !day.inRange ? 'opacity-30' : ''
                      } ${getHeatmapColor(day.count)}`}
                    ></div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-end items-center mt-4 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex items-center gap-1.5">
              <span>Less</span>
              <div className="w-3 h-3 rounded-[2px] bg-gray-100 dark:bg-slate-800"></div>
              <div className="w-3 h-3 rounded-[2px] bg-green-200 dark:bg-green-900/40"></div>
              <div className="w-3 h-3 rounded-[2px] bg-green-400 dark:bg-green-700/60"></div>
              <div className="w-3 h-3 rounded-[2px] bg-green-600 dark:bg-green-500"></div>
              <div className="w-3 h-3 rounded-[2px] bg-green-700 dark:bg-green-400"></div>
              <span>More</span>
            </div>
          </div>
        </div>
        </div>
      </div>

      {/* AI Insight Card */}
      <div className={`p-4 rounded-xl border ${insight.bg} ${insight.border} flex items-start gap-3 transition-colors`}>
        <div className="shrink-0 mt-0.5">{insight.icon}</div>
        <div>
          <h4 className={`text-sm font-bold ${insight.titleColor}`}>{insight.title}</h4>
          <p className={`text-xs mt-1 ${insight.textColor}`}>{insight.text}</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium whitespace-normal break-normal leading-tight">Current Streak</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-auto">
            {calculatedCurrentStreak} <span className="text-xs font-medium text-gray-400">days</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium whitespace-normal break-normal leading-tight">Longest Streak</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-auto">
            {stats.longestStreak} <span className="text-xs font-medium text-gray-400">days</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium whitespace-normal break-normal leading-tight">Productive Days</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-auto">
            {stats.totalProductiveDays} <span className="text-xs font-medium text-gray-400">days</span>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-gray-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5 font-medium whitespace-normal break-normal leading-tight">Tasks Completed</div>
          <div className="text-xl font-bold text-gray-900 dark:text-white mt-auto">
            {stats.totalCompleted} <span className="text-xs font-medium text-gray-400">tasks</span>
          </div>
        </div>
      </div>
    </div>
  );
}
