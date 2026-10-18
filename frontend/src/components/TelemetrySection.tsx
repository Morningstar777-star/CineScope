import React, { useState, useEffect } from 'react';
import { Cpu, Zap, Database, Shield, Activity, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SystemHealth } from '../types';
import { getHealth, getStats } from '../services/api';

export const TelemetrySection: React.FC = () => {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [stats, setStats] = useState<Record<string, any>>({});

  useEffect(() => {
    async function fetchInfo() {
      try {
        const [h, s] = await Promise.all([getHealth(), getStats()]);
        setHealth(h);
        setStats(s);
      } catch (err) {
        console.error('Telemetry error:', err);
      }
    }
    fetchInfo();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-7 max-w-5xl mx-auto pb-16 select-none"
    >
      {/* Title */}
      <div className="border-b border-white/[0.08] pb-5">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Activity className="w-4 h-4 text-rose-500" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
            System Telemetry & Architecture Benchmark
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-400 mt-1 font-normal">
          Hardware utilization, local LAYA ModernBERT RLCD inference, and Groq synthesis acceleration.
        </p>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* GPU & CUDA Card */}
        <div className="liquid-glass-strong p-6 rounded-3xl space-y-3.5 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span>NVIDIA GPU</span>
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          </div>
          <div className="text-lg font-bold text-white font-sans">GeForce RTX 3050 Laptop</div>
          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-slate-400">Total VRAM:</span>
              <span className="font-bold text-white">4,096 MiB (4.0 GB)</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-slate-400">CUDA Driver:</span>
              <span className="text-emerald-400">12.7 (Driver 566.07)</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">VRAM Status:</span>
              <span className="text-cyan-400">{health?.system.vram_status || 'Operational'}</span>
            </div>
          </div>
        </div>

        {/* Local LAYA Model Card */}
        <div className="liquid-glass-strong p-6 rounded-3xl space-y-3.5 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Cpu className="w-4 h-4 text-rose-400" />
              <span>Local LAYA Engine</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-rose-600/20 text-rose-300 border border-rose-500/30 font-bold">
              RLCD Policy
            </span>
          </div>
          <div className="text-lg font-bold text-white font-sans">ModernBERT-large RLCD</div>
          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-slate-400">Parameters:</span>
              <span className="font-bold text-white">~395 Million</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-slate-400">Task Role:</span>
              <span className="text-slate-300">System 1 Micro-Inference</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Inference Latency:</span>
              <span className="text-emerald-400">~15ms – 40ms</span>
            </div>
          </div>
        </div>

        {/* Groq Generative Synthesis Card */}
        <div className="liquid-glass-strong p-6 rounded-3xl space-y-3.5 border border-white/10 shadow-xl">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Synthesis LPU</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
              Groq LPU
            </span>
          </div>
          <div className="text-lg font-bold text-white font-sans">openai/gpt-oss-120b</div>
          <div className="space-y-2 text-xs text-slate-300 font-mono">
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-slate-400">Fast Model:</span>
              <span className="text-white">openai/gpt-oss-20b</span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/[0.06]">
              <span className="text-slate-400">JSON Schema:</span>
              <span className="text-emerald-400">Strict Pydantic Grounding</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Synthesis Latency:</span>
              <span className="text-cyan-300">~300ms – 600ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two-Stage Architecture Documentation Card */}
      <div className="liquid-glass-strong p-6 sm:p-8 rounded-3xl space-y-5 border border-white/10 shadow-2xl">
        <h3 className="text-sm font-mono font-bold text-white uppercase tracking-wider flex items-center space-x-2">
          <Database className="w-4 h-4 text-rose-500" />
          <span>Two-Stage Intelligence Flow & Caching Layer</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-5 rounded-2xl liquid-glass border border-white/[0.06]">
            <h4 className="font-bold text-white mb-2 text-sm font-sans">Stage A: Deterministic Research</h4>
            <p className="leading-relaxed text-slate-300 mb-3 font-normal">
              Asynchronous queries across AniList GraphQL, TVMaze REST, and Wikipedia critical reception records. Eliminates hallucinated metadata before any LLM inference occurs.
            </p>
            <div className="text-[11px] font-mono text-slate-400">
              Cache: SQLite Persistent + In-Memory LRU ({stats.cache_in_memory_keys || 0} active keys)
            </div>
          </div>

          <div className="p-5 rounded-2xl liquid-glass border border-white/[0.06]">
            <h4 className="font-bold text-white mb-2 text-sm font-sans">Stage B: Dual-Model Intelligence</h4>
            <p className="leading-relaxed text-slate-300 mb-3 font-normal">
              Local LAYA model scores review aspect sentiment and confidence. Groq synthesizes balanced spoiler-free reviews with strict citation matching. Bayesian shrinkage prevents artificially inflated ratings.
            </p>
            <div className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Zero Hallucination: Citations rejected if not in evidence pool</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
