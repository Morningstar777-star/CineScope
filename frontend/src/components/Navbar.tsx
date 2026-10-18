import React from 'react';
import { Film, Sparkles, Layers, GitCompare } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  activeTab: 'trending' | 'discovery' | 'compare';
  setActiveTab: (tab: 'trending' | 'discovery' | 'compare') => void;
  comparisonCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  comparisonCount
}) => {
  return (
    <header className="sticky top-3 z-50 w-full px-4 sm:px-6">
      <div className="max-w-6xl mx-auto liquid-glass-strong rounded-full px-5 sm:px-7 h-14 sm:h-16 flex items-center justify-between shadow-2xl transition-all duration-300">
        {/* Brand */}
        <div 
          className="flex items-center space-x-3 cursor-pointer group select-none"
          onClick={() => setActiveTab('discovery')}
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110">
            <Film className="w-4 h-4 text-white drop-shadow" />
            <div className="absolute inset-0 rounded-full bg-rose-400/20 blur-sm pointer-events-none" />
          </div>
          <span className="text-base sm:text-lg font-black tracking-tight text-white font-sans">
            Cine<span className="font-serif italic font-normal text-rose-300">Scope</span>
          </span>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center space-x-1 sm:space-x-1.5">
          <button
            onClick={() => setActiveTab('trending')}
            className={`relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'trending'
                ? 'text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === 'trending' && (
              <motion.div
                layoutId="navTabIndicator"
                className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-inner"
                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-rose-400" />
              <span>Trending</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('discovery')}
            className={`relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'discovery'
                ? 'text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === 'discovery' && (
              <motion.div
                layoutId="navTabIndicator"
                className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-inner"
                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Discover</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('compare')}
            className={`relative px-3.5 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all cursor-pointer ${
              activeTab === 'compare'
                ? 'text-white'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {activeTab === 'compare' && (
              <motion.div
                layoutId="navTabIndicator"
                className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-inner"
                transition={{ type: 'spring', damping: 20, stiffness: 220 }}
              />
            )}
            <span className="relative z-10 flex items-center space-x-1.5">
              <GitCompare className="w-3.5 h-3.5 text-amber-400" />
              <span>Compare</span>
              {comparisonCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-600 text-white font-mono font-bold animate-pulse">
                  {comparisonCount}
                </span>
              )}
            </span>
          </button>
        </nav>
      </div>
    </header>
  );
};
