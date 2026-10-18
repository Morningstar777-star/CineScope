import React, { useState } from 'react';
import { Film, Sparkles, Star, Plus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { TitleSearchResult } from '../types';
import { getOptimizedPosterUrl } from '../utils/imageUrl';

interface TitleCardProps {
  title: TitleSearchResult;
  onSelect: (id: string) => void;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
}

export const TitleCard: React.FC<TitleCardProps> = ({
  title,
  onSelect,
  isCompared,
  onToggleCompare
}) => {
  const [imgError, setImgError] = useState(false);
  const optimizedPoster = getOptimizedPosterUrl(title.poster_url);

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.015 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="liquid-glass rounded-3xl overflow-hidden flex flex-col group relative cursor-pointer select-none shadow-xl border border-white/5 hover:border-rose-500/30"
      onClick={() => onSelect(title.id)}
    >
      {/* Compare button overlay */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare(title.id);
        }}
        className={`absolute top-3 right-3 z-20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 backdrop-blur-md transition-all ${
          isCompared
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/40'
            : 'liquid-glass text-slate-300 hover:text-white hover:border-white/30'
        }`}
      >
        {isCompared ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        <span>{isCompared ? 'Queued' : 'Compare'}</span>
      </button>

      {/* Poster Image Container */}
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-[#0a0e17]">
        {optimizedPoster && !imgError ? (
          <img
            src={optimizedPoster}
            alt={title.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-b from-slate-900 to-[#070b12] p-4 text-center">
            <Film className="w-10 h-10 mb-2 text-slate-700" />
            <span className="text-[11px] font-mono text-slate-400 font-bold">{title.title}</span>
          </div>
        )}

        {/* Cinematic Vignette Shadow Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0e131f] via-transparent to-black/30 pointer-events-none" />

        {/* Media type badge */}
        <div className="absolute top-3 left-3 z-10">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider liquid-glass text-slate-200 border border-white/10 flex items-center space-x-1">
            {title.media_type === 'anime' ? (
              <Sparkles className="w-2.5 h-2.5 text-rose-400" />
            ) : (
              <Film className="w-2.5 h-2.5 text-cyan-400" />
            )}
            <span>{title.media_type}</span>
          </span>
        </div>

        {/* External score pill */}
        {title.external_score && (
          <div className="absolute bottom-3 left-3 z-10 flex items-center space-x-1.5 liquid-glass-strong px-2.5 py-1 rounded-full text-amber-300 text-xs font-bold font-mono">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{title.external_score}</span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between bg-gradient-to-b from-transparent to-[#0a0e17]/80">
        <div>
          <div className="flex items-baseline justify-between mb-1.5">
            <h3 className="font-bold text-white text-base leading-snug line-clamp-1 group-hover:text-rose-400 transition-colors font-sans">
              {title.title}
            </h3>
            {title.release_year && (
              <span className="text-xs text-slate-400 font-mono ml-2 shrink-0">
                {title.release_year}
              </span>
            )}
          </div>

          {/* Genres */}
          {title.genres.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {title.genres.slice(0, 3).map((g, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-full liquid-glass text-slate-400 font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action Hint */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-200 transition-colors">
          <span className="font-serif italic text-sm text-slate-300">Inspect verdict</span>
          <span className="font-mono text-[11px] text-rose-400 group-hover:translate-x-1 transition-transform">
            →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
