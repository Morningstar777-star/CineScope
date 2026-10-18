import React from 'react';
import { X, Compass } from 'lucide-react';
import { motion } from 'framer-motion';
import { DiscoveryFeedItem } from '../types';
import { TitleCard } from './TitleCard';

interface DiscoveryFeedProps {
  feedItem: DiscoveryFeedItem;
  onSelectTitle: (id: string) => void;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
  onClear: () => void;
}

export const DiscoveryFeed: React.FC<DiscoveryFeedProps> = ({
  feedItem,
  onSelectTitle,
  comparedIds,
  onToggleCompare,
  onClear
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-7"
    >
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl liquid-glass-strong border border-cyan-500/30 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div className="space-y-2.5">
            <div className="flex items-center space-x-2.5">
              <span className="text-xs px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center space-x-1.5 shadow-sm">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>{feedItem.curated_tag}</span>
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {feedItem.title_candidates.length} Curated Matches
              </span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight font-sans">
              "{feedItem.query}"
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 max-w-3xl leading-relaxed font-normal">
              {feedItem.reasoning}
            </p>
          </div>

          <button
            onClick={onClear}
            className="liquid-glass self-start sm:self-auto px-4 py-2 rounded-full text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer flex items-center space-x-1.5"
          >
            <X className="w-3.5 h-3.5" />
            <span>Clear Filter</span>
          </button>
        </div>
      </div>

      {/* Candidates Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {feedItem.title_candidates.map((title) => (
          <TitleCard
            key={title.id}
            title={title}
            onSelect={onSelectTitle}
            isCompared={comparedIds.includes(title.id)}
            onToggleCompare={onToggleCompare}
          />
        ))}
      </div>
    </motion.div>
  );
};
