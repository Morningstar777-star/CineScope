import React from 'react';
import { HelpCircle, ShieldCheck, AlertTriangle, Scale } from 'lucide-react';
import { ScoringMethodology } from '../types';

interface ScoreMeterProps {
  score: number;
  confidence: number;
  verdict: string;
  methodology: ScoringMethodology;
  onOpenMethodology: () => void;
}

export const ScoreMeter: React.FC<ScoreMeterProps> = ({
  score,
  confidence,
  verdict,
  onOpenMethodology
}) => {
  const getVerdictTheme = (val: number) => {
    if (val >= 8.5) {
      return {
        gaugeColor: 'stroke-amber-400',
        textColor: 'text-amber-300',
        badgeBg: 'bg-amber-500/10 border-amber-500/30 text-amber-300',
        glow: 'from-amber-500/20 to-rose-500/10',
      };
    }
    if (val >= 7.5) {
      return {
        gaugeColor: 'stroke-rose-500',
        textColor: 'text-rose-400',
        badgeBg: 'bg-rose-500/10 border-rose-500/30 text-rose-300',
        glow: 'from-rose-500/20 to-purple-500/10',
      };
    }
    if (val >= 6.5) {
      return {
        gaugeColor: 'stroke-cyan-400',
        textColor: 'text-cyan-300',
        badgeBg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300',
        glow: 'from-cyan-500/20 to-blue-500/10',
      };
    }
    return {
      gaugeColor: 'stroke-slate-400',
      textColor: 'text-slate-300',
      badgeBg: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
      glow: 'from-slate-500/10 to-transparent',
    };
  };

  const theme = getVerdictTheme(score);
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 10) * circumference;
  const confPercent = Math.round(confidence * 100);

  return (
    <div className="liquid-glass-strong p-6 sm:p-7 rounded-3xl relative overflow-hidden flex flex-col sm:flex-row items-center sm:items-start gap-7 shadow-2xl border border-white/10">
      {/* Background ambient light orb */}
      <div className={`absolute -top-16 -right-16 w-56 h-56 bg-gradient-to-br ${theme.glow} rounded-full blur-3xl pointer-events-none opacity-60`} />

      {/* Circular Medallion Gauge */}
      <div className="relative flex items-center justify-center shrink-0">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-white/10"
            strokeWidth="9"
            fill="transparent"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={`transition-all duration-1200 ease-out ${theme.gaugeColor}`}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl sm:text-4xl font-black tracking-tight text-white font-mono leading-none">
            {score.toFixed(1)}
          </span>
          <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest mt-1">
            / 10
          </span>
        </div>
      </div>

      {/* Verdict & Calibration Content */}
      <div className="flex-1 text-center sm:text-left flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center justify-center sm:justify-start space-x-2 mb-1.5">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1">
              <Scale className="w-3.5 h-3.5 text-rose-400" />
              <span>Calibrated AI Verdict</span>
            </span>
            <button
              onClick={onOpenMethodology}
              className="text-slate-400 hover:text-white transition-colors"
              title="Inspect scoring formula & Bayesian weights"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-sans">
            {verdict}
          </h2>
        </div>

        {/* Confidence pill & methodology button */}
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 pt-3 border-t border-white/[0.08]">
          <div className="liquid-glass flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs">
            {confPercent >= 65 ? (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            )}
            <span className="text-slate-300 font-medium">
              Statistical Confidence: <strong className="text-white font-mono">{confPercent}%</strong>
            </span>
          </div>

          <button
            onClick={onOpenMethodology}
            className="text-xs text-rose-300 hover:text-white underline underline-offset-4 font-medium transition-colors"
          >
            Inspect Bayesian Scoring Breakdown →
          </button>
        </div>
      </div>
    </div>
  );
};
