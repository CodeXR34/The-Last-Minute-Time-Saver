import React from 'react';
import { Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MomentumBanner({ currentStreak, todayCompleted }) {
  if (currentStreak === 0 && !todayCompleted) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl mb-8 group"
    >
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-gradient opacity-90 transition-opacity duration-500 group-hover:opacity-100 bg-[length:200%_auto]"></div>

      <div className="relative p-6 sm:px-8 flex items-center justify-between z-10 bg-white/10 dark:bg-black/10 backdrop-blur-sm border border-white/20">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center text-white shadow-inner">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight drop-shadow-md">
              {todayCompleted ? "🔥 Good Momentum!" : "Save Your Streak!"}
            </h2>
            <p className="text-white/90 text-sm font-medium drop-shadow mt-1">
              {todayCompleted
                ? `Completing one more task tomorrow will extend your streak to ${currentStreak + 1} days.`
                : `Complete your task today to save your ${currentStreak}-day streak!`
              }
            </p>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 6s linear infinite;
        }
      `}} />
    </motion.div>
  );
}
