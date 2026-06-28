import React from 'react';
import { Heart } from 'lucide-react';

const Github = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

const Twitter = (props) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z" />
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Brand & Socials */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="text-primary-500">Last Minute</span> Life Saver
            </h3>
            <p className="text-sm text-slate-400 max-w-xs leading-relaxed">
              Your intelligent task manager powered by AI. Never miss a deadline, build healthy habits, and manage your life with ease.
            </p>
            <div className="flex gap-4 pt-2">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-primary-400 transition-colors">Dashboard</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">GitHub Repo</a></li>
              <li><a href="#" className="hover:text-primary-400 transition-colors">Privacy Policy</a></li>
            </ul>
          </div>

          {/* Column 3: Credits & Tech */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Built With</h4>
            <p className="text-sm text-slate-400 flex items-center gap-1.5 flex-wrap">
              Made with <Heart className="h-4 w-4 text-red-500 inline" /> for Hackathon 2026
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <span className="px-3 py-1 bg-slate-800 text-cyan-400 rounded-full text-xs font-medium border border-slate-700">React</span>
              <span className="px-3 py-1 bg-slate-800 text-amber-500 rounded-full text-xs font-medium border border-slate-700">Firebase</span>
              <span className="px-3 py-1 bg-slate-800 text-indigo-400 rounded-full text-xs font-medium border border-slate-700">Gemini AI</span>
              <span className="px-3 py-1 bg-slate-800 text-fuchsia-400 rounded-full text-xs font-medium border border-slate-700">Framer Motion</span>
            </div>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-slate-800 text-sm text-center text-slate-500">
          &copy; {new Date().getFullYear()} Last Minute Life Saver. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
