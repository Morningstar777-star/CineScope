import React, { useState, useEffect } from 'react';
import { X, Trophy, GitCompare, Sparkles, Loader2, Award, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { ComparisonResult } from '../types';
import { compareTitles } from '../services/api';

interface ComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  titleIds: string[];
  onRemoveTitle: (id: string) => void;
  onOpenTitle: (id: string) => void;
}

export const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  titleIds,
  onRemoveTitle,
  onOpenTitle
}) => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || titleIds.length < 2) return;

    let isMounted = true;
    async function runComparison() {
      setLoading(true);
      setError(null);
      try {
        const data = await compareTitles(titleIds);
        if (isMounted) setResult(data);
      } catch (err: any) {
        if (isMounted) setError(err.message || 'Comparison failed');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    runComparison();
    return () => { isMounted = false; };
  }, [isOpen, titleIds]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-4xl liquid-glass-strong border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight font-sans">
                Head-to-Head Comparison Deck
              </h2>
              <p className="text-xs text-slate-400">
                Comparative intelligence across Story, Visuals, Characters, and Audience Sentiment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {titleIds.length < 2 ? (
            <div className="text-center py-14 text-slate-400">
              <GitCompare className="w-12 h-12 mx-auto mb-3 text-slate-600" />
              <p className="text-base font-semibold text-white mb-1">
                Select At Least 2 Titles to Compare
              </p>
              <p className="text-xs text-slate-400">
                Click "+ Compare" on any movie or anime card to add them to your comparison deck.
              </p>
            </div>
          ) : loading ? (
            <div className="text-center py-20 space-y-3">
              <Loader2 className="w-9 h-9 animate-spin text-rose-500 mx-auto" />
              <p className="text-sm font-semibold text-white font-mono">
                Synthesizing Comparative Intelligence...
              </p>
              <p className="text-xs text-slate-400">
                Evaluating aspect strengths and audience consensus side-by-side
              </p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-2xl bg-rose-950/20 border border-rose-500/40 text-rose-300 text-sm">
              {error}
            </div>
          ) : result ? (
            <>
              {/* Titles Scoreboard Cards */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {result.titles.map((t) => (
                  <div
                    key={t.canonical_id}
                    className="p-4 rounded-2xl liquid-glass border border-white/10 relative flex flex-col justify-between"
                  >
                    <button
                      onClick={() => onRemoveTitle(t.canonical_id)}
                      className="absolute top-2.5 right-2.5 text-slate-500 hover:text-rose-400 p-1"
                      title="Remove from comparison"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div>
                      <div className="flex items-center space-x-3 mb-3">
                        {t.poster_url && (
                          <img
                            src={t.poster_url}
                            alt={t.title}
                            className="w-12 h-16 object-cover rounded-lg bg-slate-800 shadow"
                          />
                        )}
                        <div>
                          <h4 
                            onClick={() => onOpenTitle(t.canonical_id)}
                            className="font-bold text-white text-sm hover:text-rose-400 cursor-pointer font-sans"
                          >
                            {t.title}
                          </h4>
                          <span className="text-[10px] text-slate-400 capitalize font-mono">
                            {t.media_type} • {t.release_year || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-2.5 rounded-xl liquid-glass mb-2">
                        <span className="text-xs text-slate-300 font-medium">AI Score:</span>
                        <span className="text-sm font-black text-amber-300 font-mono">
                          {t.overall_score.toFixed(1)} / 10
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-3">
                        Verdict: <strong className="text-white font-medium">{t.verdict}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => onOpenTitle(t.canonical_id)}
                      className="w-full py-1.5 rounded-xl text-xs font-semibold liquid-glass text-slate-200 hover:text-white transition-all flex items-center justify-center space-x-1 cursor-pointer"
                    >
                      <span>Full Analysis</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Comparative Summary */}
              <div className="p-5 rounded-2xl liquid-glass border border-rose-500/20">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-2 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Executive Comparative Synthesis</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                  {result.comparative_summary}
                </p>
              </div>

              {/* Aspect-by-Aspect Head-to-Head */}
              <div className="space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                  Aspect Breakdowns & Category Winners
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {result.aspect_comparisons.map((asp, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-2xl liquid-glass border border-white/[0.06] flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-bold text-white font-sans">{asp.aspect}</span>
                          <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center space-x-1 font-mono">
                            <Trophy className="w-3 h-3 text-amber-400" />
                            <span>Winner: {asp.winner_title}</span>
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">
                          {asp.analysis}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-4 rounded-2xl liquid-glass-crimson border border-rose-500/30 flex items-start space-x-3">
                <Award className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300 mb-1">
                    Final Recommendation
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {result.final_recommendation}
                  </p>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
};
