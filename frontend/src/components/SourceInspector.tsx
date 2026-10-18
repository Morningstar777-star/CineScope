import React, { useState } from 'react';
import { ExternalLink, Calendar } from 'lucide-react';
import { motion } from 'framer-motion';
import { SourceEvidence, SourceCategory } from '../types';

interface SourceInspectorProps {
  sources: SourceEvidence[];
  highlightedSourceId?: string | null;
}

export const SourceInspector: React.FC<SourceInspectorProps> = ({
  sources,
  highlightedSourceId
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = ['all', 'critic', 'audience', 'community', 'specialist', 'discussion'];

  const filteredSources = selectedCategory === 'all'
    ? sources
    : sources.filter(s => s.category === selectedCategory);

  const getCategoryBadge = (cat: SourceCategory) => {
    switch (cat) {
      case 'critic':
        return 'text-purple-300 border-purple-500/30 bg-purple-500/10';
      case 'audience':
        return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
      case 'community':
        return 'text-cyan-300 border-cyan-500/30 bg-cyan-500/10';
      case 'specialist':
        return 'text-rose-300 border-rose-500/30 bg-rose-500/10';
      case 'discussion':
        return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
      default:
        return 'text-slate-300 border-white/10 bg-white/5';
    }
  };

  return (
    <div className="liquid-glass-strong p-6 sm:p-8 rounded-3xl space-y-6 border border-white/10 shadow-2xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <div className="flex items-center space-x-2.5">
            <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
              Evidence Sources & Audit Citations
            </h3>
            <span className="liquid-glass text-xs font-mono px-3 py-1 rounded-full text-slate-300 border border-white/10">
              {sources.length} Verified
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
            Every analytical claim is grounded in multi-platform citations. Inspect excerpts and calibrated sentiment.
          </p>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center flex-wrap gap-1.5 p-1 liquid-glass rounded-full border border-white/10 self-start sm:self-auto">
          {categories.map((cat) => {
            const count = cat === 'all' ? sources.length : sources.filter(s => s.category === cat).length;
            if (cat !== 'all' && count === 0) return null;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-semibold capitalize transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Source Cards List */}
      <div className="space-y-3.5">
        {filteredSources.map((s) => {
          const isHighlighted = highlightedSourceId === s.id;
          return (
            <motion.div
              key={s.id}
              id={s.id}
              layout
              className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 ${
                isHighlighted
                  ? 'liquid-glass-crimson border-rose-500/80 ring-2 ring-rose-500/30'
                  : 'liquid-glass border-white/[0.06] hover:border-white/20'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                  <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full liquid-glass text-slate-300 font-bold border border-white/10">
                    {s.id}
                  </span>
                  <span className="text-sm sm:text-base font-bold text-white font-sans">
                    {s.source_name}
                  </span>
                  <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${getCategoryBadge(s.category)}`}>
                    {s.category}
                  </span>
                </div>

                <div className="flex items-center space-x-3.5 text-xs text-slate-400 font-mono">
                  {s.original_rating && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-bold border border-amber-500/20">
                      ★ {s.original_rating}
                    </span>
                  )}
                  {s.published_date && (
                    <span className="flex items-center space-x-1 text-slate-400 text-[11px]">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{s.published_date}</span>
                    </span>
                  )}
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-1 text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Excerpt */}
              <div className="relative pl-3.5 border-l-2 border-rose-500/40 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans my-2.5">
                <p className="italic font-normal">"{s.excerpt}"</p>
              </div>

              {/* LAYA Calibrated Sentiment Telemetry */}
              <div className="mt-3.5 pt-2.5 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 font-mono">
                <div className="flex items-center space-x-2.5">
                  <span>LAYA Sentiment:</span>
                  <span className={`font-bold ${
                    s.sentiment_score > 0.2 ? 'text-emerald-400' : s.sentiment_score < -0.2 ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {s.sentiment_score > 0 ? `+${s.sentiment_score.toFixed(2)}` : s.sentiment_score.toFixed(2)}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span>Confidence: <strong className="text-slate-200">{Math.round(s.confidence * 100)}%</strong></span>
                </div>
                <div className="text-[10px] text-slate-500">
                  Retrieved: {s.retrieved_at.slice(0, 19).replace('T', ' ')} UTC
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};
