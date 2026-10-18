import React, { useState, useEffect } from 'react';
import { Flame, Sparkles, Tv, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { TitleSearchResult, MediaType } from '../types';
import { TitleCard } from './TitleCard';
import { getTrending } from '../services/api';

interface TrendingWorldwideGridProps {
  onSelectTitle: (id: string) => void;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
}

export const TrendingWorldwideGrid: React.FC<TrendingWorldwideGridProps> = ({
  onSelectTitle,
  comparedIds,
  onToggleCompare
}) => {
  const [selectedType, setSelectedType] = useState<MediaType>('all');
  const [titles, setTitles] = useState<TitleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadTrending() {
      setLoading(true);
      setError(null);
      try {
        const data = await getTrending(selectedType);
        if (isMounted) setTitles(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Failed to fetch trending titles');
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadTrending();
    return () => { isMounted = false; };
  }, [selectedType]);

  const tabs: { label: string; value: MediaType; icon: React.ReactNode }[] = [
    { label: 'All Popular', value: 'all', icon: <Flame className="w-3.5 h-3.5" /> },
    { label: 'Trending Anime', value: 'anime', icon: <Sparkles className="w-3.5 h-3.5 text-rose-400" /> },
    { label: 'Top TV Series', value: 'series', icon: <Tv className="w-3.5 h-3.5 text-cyan-400" /> },
  ];

  return (
    <div className="space-y-6 pt-2 select-none">
      {/* Section Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
              Trending <span className="font-serif italic font-normal text-rose-300">Worldwide</span>
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
            Real-time community watch-velocity, episode discussion surges, and verified ratings.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center space-x-1 p-1 liquid-glass rounded-full border border-white/10 self-start sm:self-auto">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedType(tab.value)}
              className={`relative px-4 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center space-x-1.5 cursor-pointer ${
                selectedType === tab.value
                  ? 'text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {selectedType === tab.value && (
                <motion.div
                  layoutId="trendingGridTabIndicator"
                  className="absolute inset-0 rounded-full bg-white/10 border border-white/20 shadow-inner"
                  transition={{ type: 'spring', damping: 20, stiffness: 220 }}
                />
              )}
              <span className="relative z-10 flex items-center space-x-1.5">
                {tab.icon}
                <span>{tab.label}</span>
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Titles */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="w-9 h-9 animate-spin text-rose-500" />
          <p className="text-xs text-slate-400 font-mono">
            Synchronizing live entertainment signals...
          </p>
        </div>
      ) : error ? (
        <div className="p-5 rounded-2xl liquid-glass border border-rose-500/30 text-rose-300 text-sm">
          {error}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
        >
          {titles.map((title) => (
            <TitleCard
              key={title.id}
              title={title}
              onSelect={onSelectTitle}
              isCompared={comparedIds.includes(title.id)}
              onToggleCompare={onToggleCompare}
            />
          ))}
        </motion.div>
      )}
    </div>
  );
};
