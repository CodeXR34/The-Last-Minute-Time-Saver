import React from 'react';
import { format } from 'date-fns';
import * as Tooltip from '@radix-ui/react-tooltip';

export default function ConsistencyHeatmap({ weeksData }) {
  if (!weeksData || weeksData.length === 0) return null;

  return (
    <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-[#E6D8C8]/50 dark:border-slate-800/50 p-6 transition-colors">
      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Consistency (90 Days)</h3>

      <Tooltip.Provider delayDuration={0}>
        <div className="flex flex-col gap-3">
          <div className="flex gap-1 overflow-x-auto custom-scrollbar pb-2">
            {weeksData.map((week, weekIdx) => (
              <div key={`week-${weekIdx}`} className="flex flex-col gap-1">
                {week.map((day, dayIdx) => {
                  let colorClass = "bg-slate-100 dark:bg-slate-800";
                  if (day.inRange) {
                    if (day.count === 1) colorClass = "bg-green-300 dark:bg-green-800";
                    else if (day.count === 2) colorClass = "bg-green-400 dark:bg-green-600";
                    else if (day.count >= 3) colorClass = "bg-green-500 dark:bg-green-500";
                  }

                  let tooltipText = "";
                  if (day.inRange) {
                    const formattedDate = format(day.date, 'MMM d');
                    if (day.count > 1) {
                      tooltipText = `${day.count} tasks on ${formattedDate}`;
                    } else if (day.count === 1) {
                      tooltipText = `1 task on ${formattedDate}`;
                    } else {
                      tooltipText = `No tasks on ${formattedDate}`;
                    }
                  }

                  const dayBlock = (
                    <div
                      className={`w-3 h-3 rounded-sm ${colorClass} cursor-pointer transition-colors`}
                    />
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
                          sideOffset={4}
                          className="z-[9999] bg-slate-900 text-white text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap"
                        >
                          {tooltipText}
                          <Tooltip.Arrow className="fill-slate-900" />
                        </Tooltip.Content>
                      </Tooltip.Portal>
                    </Tooltip.Root>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-2 text-xs text-gray-500 dark:text-gray-400 mt-2">
            <span>Less</span>
            <div className="flex gap-1">
              <div className="w-3 h-3 rounded-sm bg-slate-100 dark:bg-slate-800"></div>
              <div className="w-3 h-3 rounded-sm bg-green-300 dark:bg-green-800"></div>
              <div className="w-3 h-3 rounded-sm bg-green-400 dark:bg-green-600"></div>
              <div className="w-3 h-3 rounded-sm bg-green-500 dark:bg-green-500"></div>
            </div>
            <span>More</span>
          </div>
        </div>
      </Tooltip.Provider>
    </div>
  );
}
