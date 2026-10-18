import React from 'react';
import { X, Cpu, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { ScoringMethodology } from '../types';

interface MethodologyModalProps {
  isOpen: boolean;
  onClose: () => void;
  methodology: ScoringMethodology;
  title: string;
}

export const MethodologyModal: React.FC<MethodologyModalProps> = ({
  isOpen,
  onClose,
  methodology,
  title
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-2xl liquid-glass-strong border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-6 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight font-sans">
                Bayesian Score Derivation & Calibration
              </h2>
              <p className="text-xs text-slate-400 font-mono">Statistical breakdown for {title}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {/* Explanation Alert */}
          <div className="p-4 rounded-2xl liquid-glass border border-emerald-500/30 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider mb-1">
                Calibrated Scoring Explanation
              </div>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
                {methodology.explanation}
              </p>
            </div>
          </div>

          {/* Core Metric Audit Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl liquid-glass">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">Critic Mean</span>
              <span className="text-lg font-black text-white font-mono">
                {methodology.critic_rating_mean !== null && methodology.critic_rating_mean !== undefined
                  ? `${methodology.critic_rating_mean.toFixed(1)}/10`
                  : 'N/A'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl liquid-glass">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">Audience Mean</span>
              <span className="text-lg font-black text-cyan-300 font-mono">
                {methodology.audience_rating_mean !== null && methodology.audience_rating_mean !== undefined
                  ? `${methodology.audience_rating_mean.toFixed(1)}/10`
                  : 'N/A'}
              </span>
            </div>
            <div className="p-3.5 rounded-2xl liquid-glass">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">Semantic Score</span>
              <span className="text-lg font-black text-rose-300 font-mono">
                {methodology.sentiment_synthetic_score.toFixed(1)}/10
              </span>
            </div>
            <div className="p-3.5 rounded-2xl liquid-glass">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">Final Score</span>
              <span className="text-lg font-black text-amber-300 font-mono">
                {methodology.final_calibrated_score.toFixed(1)}/10
              </span>
            </div>
          </div>

          {/* Counts and Multipliers */}
          <div className="p-4 rounded-2xl liquid-glass space-y-3">
            <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">
              Sample Counts & Diversity Factors
            </div>
            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-300">Total Sources Evaluated:</span>
                <span className="text-white font-bold">{methodology.source_count}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-300">Critic Sources Count:</span>
                <span className="text-white font-bold">{methodology.critic_count}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-300">Audience / Community Count:</span>
                <span className="text-white font-bold">{methodology.audience_count + methodology.community_count}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-white/[0.04]">
                <span className="text-slate-300">Diversity Multiplier:</span>
                <span className="text-emerald-400 font-bold">{methodology.diversity_multiplier.toFixed(2)}x</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-slate-300">Confidence Estimate:</span>
                <span className="text-amber-300 font-bold">{Math.round(methodology.confidence_estimate * 100)}%</span>
              </div>
            </div>
          </div>

          {/* Penalties */}
          <div className="grid grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3.5 rounded-2xl liquid-glass-crimson flex flex-col justify-between">
              <span className="text-rose-300">Divergence Penalty:</span>
              <strong className="text-rose-200 text-sm mt-1">-{methodology.disagreement_penalty.toFixed(2)} pts</strong>
            </div>
            <div className="p-3.5 rounded-2xl liquid-glass flex flex-col justify-between border border-white/10">
              <span className="text-slate-400">Sample Sparsity Penalty:</span>
              <strong className="text-slate-200 text-sm mt-1">-{methodology.sample_size_penalty.toFixed(2)} pts</strong>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
