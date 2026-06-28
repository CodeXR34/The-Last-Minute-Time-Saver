import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeProvider';
import { LogOut, CheckCircle, Moon, Sun, Flame, Bell, Menu, X, Settings, User } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import SettingsModal from './SettingsModal';

export default function Navbar({ currentStreak = 0 }) {
  const { currentUser, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const getDisplayName = () => {
    if (currentUser?.displayName) return currentUser.displayName;
    if (currentUser?.email) return currentUser.email.split('@')[0];
    return 'User';
  };

  const displayName = currentUser ? getDisplayName() : '';

  return (
    <>
      <nav className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-lg border-b-0 sticky top-0 z-40 transition-colors duration-200 shadow-sm relative after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1px] after:bg-gradient-to-r after:from-indigo-500 after:via-primary-500 after:to-green-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Left: Logo */}
            <div className="flex items-center">
              <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-500 mr-2" />
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-primary-600 dark:from-indigo-400 dark:to-primary-400 tracking-tight hidden sm:block">
                Last Minute Life Saver
              </span>
              <span className="font-extrabold text-xl bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-primary-600 dark:from-indigo-400 dark:to-primary-400 tracking-tight sm:hidden">
                LMLS
              </span>
            </div>

            {/* Center: Nav Links */}
            {currentUser && (
              <div className="hidden md:flex items-center space-x-6">
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm">Dashboard</Link>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm">Tasks</Link>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm">Streaks</Link>
                <Link to="/dashboard" className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 font-medium transition-colors text-sm">Insights</Link>
              </div>
            )}

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {currentUser && (
                <>
                  {/* Streak Counter */}
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium border border-orange-200 dark:border-orange-800/50">
                    <motion.div
                      key={currentStreak}
                      initial={{ scale: 1.3, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    >
                      <Flame className="h-4 w-4 fill-orange-500" />
                    </motion.div>
                    {currentStreak}
                  </div>

                  {/* Notification Bell */}
                  <button className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-400 rounded-full transition-colors hidden sm:block">
                    <Bell className="h-5 w-5" />
                  </button>
                </>
              )}

              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-all duration-300 relative overflow-hidden"
                aria-label="Toggle theme"
              >
                <div className={`transition-transform duration-500 flex items-center justify-center ${isDarkMode ? 'rotate-180 scale-0' : 'rotate-0 scale-100'}`}>
                  <Moon className="h-5 w-5 absolute" />
                </div>
                <div className={`transition-transform duration-500 flex items-center justify-center ${isDarkMode ? 'rotate-0 scale-100' : '-rotate-180 scale-0'}`}>
                  <Sun className="h-5 w-5" />
                </div>
              </button>

              {currentUser && (
                <div className="relative ml-2">
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <img 
                      src={currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`} 
                      alt="Profile" 
                      className="h-8 w-8 rounded-full border-2 border-indigo-200 dark:border-indigo-800 transition-transform hover:scale-105"
                    />
                  </button>

                  {/* Avatar Dropdown */}
                  <AnimatePresence>
                    {isDropdownOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-xl shadow-lg py-1 border border-gray-100 dark:border-slate-700"
                      >
                        <div className="px-4 py-2 border-b border-gray-100 dark:border-slate-700 mb-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{displayName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{currentUser?.email || 'No email'}</p>
                        </div>
                        <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2">
                          <User className="h-4 w-4" /> Profile
                        </button>
                        <button 
                          onClick={() => { setIsSettingsOpen(true); setIsDropdownOpen(false); }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 flex items-center gap-2"
                        >
                          <Settings className="h-4 w-4" /> Settings
                        </button>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <LogOut className="h-4 w-4" /> Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              {currentUser && (
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden ml-2 p-2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                >
                  {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && currentUser && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-gray-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md overflow-hidden"
            >
              <div className="px-4 py-3 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium w-max">
                    <Flame className="h-4 w-4 fill-orange-500" /> {currentStreak} Day Streak
                  </div>
                  <button className="p-2 text-gray-500 hover:text-indigo-600 dark:text-gray-400 rounded-full">
                    <Bell className="h-5 w-5" />
                  </button>
                </div>
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-slate-800">Dashboard</Link>
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900">Tasks</Link>
                <Link to="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="block px-3 py-2 rounded-md text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 hover:text-gray-900">Streaks</Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </>
  );
}
