import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { CheckCircle, Clock, Zap, ArrowRight } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Landing() {
  const { currentUser, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  if (currentUser) {
    return <Navigate to="/dashboard" />;
  }

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (error) {
      console.error("Failed to log in", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-slate-950 transition-colors duration-200 relative overflow-hidden font-sans">
      
      {/* Subtle Background Pattern (Radial Glow) */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-emerald-100/40 to-transparent dark:from-emerald-900/20 blur-[100px] pointer-events-none rounded-full"></div>

      <Navbar />
      
      <div className="relative z-10 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl w-full text-center space-y-12 py-32 md:py-40">
          
          <div className="space-y-8 flex flex-col items-center">
            {/* Top Badge */}
            <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/40 dark:bg-slate-800/40 backdrop-blur-md text-emerald-700 dark:text-emerald-400 text-sm font-semibold mb-2 border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
              <Zap className="h-4 w-4 text-amber-500" />
              <span>The smart way to manage your deadlines</span>
            </div>
            
            {/* Hero Headline */}
            <h1 className="animate-fade-in-up delay-100 text-6xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1] max-w-4xl">
              Stop missing deadlines.<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 pb-2 inline-block">
                Start taking action.
              </span>
            </h1>
            
            {/* Sub-headline */}
            <p className="animate-fade-in-up delay-200 mt-6 text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
              Last Minute Life Saver is a modern productivity platform designed to keep your tasks organized, prioritized, and delivered on time.
            </p>
          </div>

          <div className="animate-fade-in-up delay-300 pt-4 flex flex-col items-center justify-center">
            {/* Premium CTA Button */}
            <button
              onClick={handleLogin}
              className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-900 dark:bg-white dark:text-slate-900 rounded-full transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(15,23,42,0.2)] dark:hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] dark:shadow-[inset_0_-1px_1px_rgba(0,0,0,0.1)]"
            >
              <span className="relative flex items-center gap-2.5">
                <svg className="w-5 h-5 bg-white rounded-full p-0.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25C22.56 11.47 22.49 10.73 22.36 10.03H12V14.23H17.92C17.66 15.58 16.89 16.73 15.75 17.49V20.24H19.32C21.4 18.32 22.56 15.54 22.56 12.25Z" fill="#4285F4"/>
                  <path d="M12 23C14.97 23 17.46 22.02 19.32 20.24L15.75 17.49C14.74 18.17 13.48 18.57 12 18.57C9.13 18.57 6.7 16.63 5.82 14.04H2.15V16.89C3.96 20.49 7.69 23 12 23Z" fill="#34A853"/>
                  <path d="M5.82 14.04C5.59 13.36 5.46 12.65 5.46 11.91C5.46 11.17 5.59 10.46 5.82 9.78V6.93H2.15C1.41 8.41 1 10.1 1 11.91C1 13.72 1.41 15.41 2.15 16.89L5.82 14.04Z" fill="#FBBC05"/>
                  <path d="M12 5.25C13.62 5.25 15.06 5.8 16.2 6.89L19.4 3.69C17.45 1.88 14.97 0.82 12 0.82C7.69 0.82 3.96 3.33 2.15 6.93L5.82 9.78C6.7 7.19 9.13 5.25 12 5.25Z" fill="#EA4335"/>
                </svg>
                Get Started with Google
                <ArrowRight className="h-5 w-5 ml-1 group-hover:translate-x-1.5 transition-transform" />
              </span>
            </button>
            <p className="mt-5 text-sm font-medium text-slate-400 dark:text-slate-500">Free forever for basic use.</p>
          </div>
          
          {/* Bento Box Feature Cards */}
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-24 text-left">
            <div className="animate-fade-in-up delay-200 group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-200 dark:hover:border-emerald-900/50">
              <div className="h-14 w-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <CheckCircle className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Capture Everything</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Quickly add tasks with titles, descriptions, and categories. Never lose a thought again.</p>
            </div>
            
            <div className="animate-fade-in-up delay-300 group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-blue-200 dark:hover:border-blue-900/50">
              <div className="h-14 w-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Track Deadlines</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Set precise deadlines and estimated hours. Know exactly what needs to be done and when.</p>
            </div>
            
            <div className="animate-fade-in-up delay-400 group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-sm border border-slate-200/80 dark:border-slate-800 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl hover:border-purple-200 dark:hover:border-purple-900/50">
              <div className="h-14 w-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
                <Zap className="h-7 w-7 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">Lightning Fast</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">Built for speed. A Notion-inspired interface that gets out of your way so you can work.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
