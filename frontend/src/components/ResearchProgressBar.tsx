import React from 'react';
import { Loader2, CheckCircle, Database, Search, Cpu, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResearchProgressBarProps {
  currentStage: number; // 1 to 4
  stageMessage: string;
}

export const ResearchProgressBar: React.FC<ResearchProgressBarProps> = ({
  currentStage,
  stageMessage
}) => {
  const stages = [
    { id: 1, label: 'Metadata & Catalogs', icon: Database },
    { id: 2, label: 'Evidence Gathering', icon: Search },
    { id: 3, label: 'LAYA Micro-Inference', icon: Cpu },
    { id: 4, label: 'Calibrated Synthesis', icon: Sparkles },
  ];

  const getProgressWidth = () => {
    switch (currentStage) {
      case 1: return '25%';
      case 2: return '55%';
      case 3: return '80%';
      case 4: return '100%';
      default: return '10%';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-2xl mx-auto liquid-glass-strong p-6 sm:p-7 rounded-3xl shadow-2xl my-8 border border-white/10"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2.5">
          <Loader2 className="w-4 h-4 animate-spin text-rose-500" />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Active Research Pipeline
          </span>
        </div>
        <span className="text-xs font-mono font-bold text-rose-400">
          {getProgressWidth()}
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden mb-6 relative border border-white/5 shadow-inner">
        <div 
          className="h-full bg-gradient-to-r from-rose-600 via-amber-400 to-cyan-400 transition-all duration-500 ease-out rounded-full shadow-lg"
          style={{ width: getProgressWidth() }}
        />
      </div>

      {/* Stage Step Indicators */}
      <div className="grid grid-cols-4 gap-2 text-center">
        {stages.map((st) => {
          const isDone = currentStage > st.id;
          const isCurrent = currentStage === st.id;
          const Icon = st.icon;

          return (
            <div key={st.id} className="flex flex-col items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1.5 transition-all ${
                isDone 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : isCurrent
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/60 ring-2 ring-rose-500/20 animate-pulse'
                  : 'bg-white/5 text-slate-500 border border-white/5'
              }`}>
                {isDone ? <CheckCircle className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
              </div>
              <span className={`text-[10px] font-mono leading-tight ${
                isCurrent ? 'text-white font-bold' : isDone ? 'text-slate-300' : 'text-slate-500'
              }`}>
                {st.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dynamic current activity message */}
      <div className="mt-5 pt-3.5 border-t border-white/[0.08] text-center">
        <p className="text-xs text-slate-300 font-sans italic">
          "{stageMessage}"
        </p>
      </div>
    </motion.div>
  );
};
