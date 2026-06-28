import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Crown, CheckCircle2, Trophy } from 'lucide-react';

const Card = ({ title, value, subtitle, icon: Icon, colorClass, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-2xl shadow-sm border border-[#E6D8C8]/50 dark:border-slate-800/50 p-6 hover:scale-105 transition-all cursor-pointer flex flex-col justify-between h-full"
  >
    <div className="flex justify-between items-start mb-4">
      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</h3>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${colorClass}`}>
        <Icon className="h-4 w-4" />
      </div>
    </div>

    <div>
      <div className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
        {value}
      </div>
      {subtitle && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  </motion.div>
);

export default function VitalStats({ stats, currentStreak }) {
  // Safe extraction of stats with fallback
  const { longestStreak = 0, totalCompleted = 0, mostProductiveDay } = stats || {};

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <Card
        title="Current Streak"
        value={`${currentStreak} ${currentStreak === 1 ? 'Day' : 'Days'}`}
        subtitle="Keep the momentum going"
        icon={Flame}
        colorClass="bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400"
        delay={0.1}
      />
      <Card
        title="Longest Streak"
        value={`${longestStreak} ${longestStreak === 1 ? 'Day' : 'Days'}`}
        subtitle="Your all-time best"
        icon={Crown}
        colorClass="bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
        delay={0.2}
      />
      <Card
        title="Tasks Completed"
        value={totalCompleted}
        subtitle="Lifetime productivity"
        icon={CheckCircle2}
        colorClass="bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400"
        delay={0.3}
      />
      <Card
        title="Most Productive Day"
        value={mostProductiveDay ? mostProductiveDay.dayName : "N/A"}
        subtitle={mostProductiveDay ? `${mostProductiveDay.percent}% completion this week` : "Start your week strong!"}
        icon={Trophy}
        colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400"
        delay={0.4}
      />
    </div>
  );
}
