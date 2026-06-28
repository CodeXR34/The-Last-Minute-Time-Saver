import React from 'react';
import { format, isToday } from 'date-fns';
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';

export default function ConsistencyHeatmap({ weeksData }) {
  if (!weeksData || weeksData.length === 0) return null;

  const totalTasks = weeksData.reduce((acc, week) => acc + week.reduce((wAcc, day) => wAcc + (day.inRange ? day.count : 0), 0), 0);
  const isEmpty = totalTasks === 0;

  const sizeClass = "w-[10px] h-[10px] sm:w-[12px] sm:h-[12px] rounded-[2px]";

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[20px] shadow-sm border border-gray-100 dark:border-slate-800/60 p-5 md:p-6 transition-colors">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Consistency (90 Days)</h3>
        <p className="text-[13px] text-gray-500 dark:text-gray-400 mt-0.5">Maintain your daily productivity habit.</p>
      </div>

      {isEmpty ? (
        <div className="py-10 flex flex-col items-center justify-center text-center bg-gray-50/50 dark:bg-slate-800/30 rounded-xl border border-dashed border-gray-200 dark:border-slate-700">
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium px-4">
            Complete your first task to start building your consistency.
          </p>
        </div>
      ) : (
        <Tooltip.Provider delayDuration={0}>
          <div className="flex flex-col gap-4">
            {/* Heatmap Grid */}
            <div className="flex justify-between w-full md:w-auto md:justify-start md:gap-[3px] overflow-visible pb-1">
              {weeksData.map((week, weekIdx) => (
                <div key={`week-${weekIdx}`} className="flex flex-col gap-[3px] md:gap-[3px]">
                  {week.map((day, dayIdx) => {
                    let colorClass = "bg-[#F3F4F6] dark:bg-slate-800/80";
                    if (day.inRange) {
                      if (day.count === 1) colorClass = "bg-emerald-200 dark:bg-emerald-900/60";
                      else if (day.count === 2) colorClass = "bg-emerald-300 dark:bg-emerald-700/70";
                      else if (day.count === 3) colorClass = "bg-emerald-500 dark:bg-emerald-600";
                      else if (day.count >= 4) colorClass = "bg-emerald-600 dark:bg-emerald-500";
                    }

                    let tooltipContent = null;
                    if (day.inRange) {
                      const formattedDate = format(day.date, 'MMMM d');
                      const score = day.count > 0 ? Math.min(100, Math.round((day.count / 4) * 100)) : 0; 

                      tooltipContent = (
                        <div className="flex flex-col gap-1.5">
                          <div className="font-semibold text-[13px] border-b border-white/10 pb-1 mb-0.5 tracking-wide">{formattedDate}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-[14px]">✅</span>
                            <span className="text-[12px] text-gray-200">Tasks Completed: <strong className="font-medium text-white">{day.count}</strong></span>
                          </div>
                          {day.count > 0 && (
                            <div className="flex items-center gap-2">
                              <span className="text-[14px]">🔥</span>
                              <span className="text-[12px] text-gray-200">Productivity Score: <strong className="font-medium text-white">{score}%</strong></span>
                            </div>
                          )}
                        </div>
                      );
                    }

                    const isCurrentDay = day.inRange && isToday(day.date);

                    const dayBlock = (
                      <div className="relative">
                        <div
                          className={`${sizeClass} ${colorClass} cursor-pointer transition-colors relative z-10 ${
                            isCurrentDay ? 'ring-1 ring-offset-[1px] ring-offset-white dark:ring-offset-slate-900 ring-gray-400 dark:ring-gray-500' : ''
                          }`}
                        />
                        {isCurrentDay && (
                          <motion.div
                            className="absolute -inset-[3px] rounded-[4px] bg-emerald-500/20 dark:bg-emerald-400/20 z-0 pointer-events-none"
                            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                          />
                        )}
                      </div>
                    );

                    if (!day.inRange) {
                      return (
                        <div key={`day-${weekIdx}-${dayIdx}`}>
                          {dayBlock}
                        </div>
                      );
                    }

                    return (
                      <Tooltip.Root key={`day-${weekIdx}-${dayIdx}`}>
                        <Tooltip.Trigger asChild>
                          {dayBlock}
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            side="top"
                            sideOffset={8}
                            asChild
                            className="z-[9999]"
                          >
                            <motion.div
                              initial={{ opacity: 0, scale: 0.98 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.18, ease: "easeOut" }}
                              className="bg-slate-900 dark:bg-slate-800 text-white px-3 py-2.5 rounded-xl shadow-xl whitespace-nowrap"
                            >
                              {tooltipContent}
                              <Tooltip.Arrow className="fill-slate-900 dark:fill-slate-800" />
                            </motion.div>
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-2 font-medium">
              <span>Less</span>
              <div className="flex gap-[3px]">
                <div className={`${sizeClass} bg-[#F3F4F6] dark:bg-slate-800/80`}></div>
                <div className={`${sizeClass} bg-emerald-200 dark:bg-emerald-900/60`}></div>
                <div className={`${sizeClass} bg-emerald-300 dark:bg-emerald-700/70`}></div>
                <div className={`${sizeClass} bg-emerald-500 dark:bg-emerald-600`}></div>
                <div className={`${sizeClass} bg-emerald-600 dark:bg-emerald-500`}></div>
              </div>
              <span>More</span>
            </div>
          </div>
        </Tooltip.Provider>
      )}
    </div>
  );
}
