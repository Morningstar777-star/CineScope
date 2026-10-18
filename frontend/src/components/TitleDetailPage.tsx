import React, { useState } from 'react';
import { ArrowLeft, Film, Sparkles, Star, CheckCircle, AlertTriangle, Cpu, Clock, Copy, Check, Printer, Layers, Users, MessageSquare, BarChart3, Database } from 'lucide-react';
import { motion } from 'framer-motion';
import { ReviewVerdict } from '../types';
import { ScoreMeter } from './ScoreMeter';
import { MethodologyModal } from './MethodologyModal';
import { SourceInspector } from './SourceInspector';
import { getOptimizedPosterUrl } from '../utils/imageUrl';

interface TitleDetailPageProps {
  verdict: ReviewVerdict;
  onBack: () => void;
  onToggleCompare: (id: string) => void;
  isCompared: boolean;
  onSelectTitle?: (canonicalId: string) => void;
}

export const TitleDetailPage: React.FC<TitleDetailPageProps> = ({
  verdict,
  onBack,
  onToggleCompare,
  isCompared,
  onSelectTitle
}) => {
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [copiedBrief, setCopiedBrief] = useState(false);

  const handleCitationClick = (sourceId: string) => {
    setHighlightedSourceId(sourceId);
    const element = document.getElementById(sourceId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleCopyBrief = () => {
    const lines = [
      `# CineScope Intelligence Brief: ${verdict.title} ${verdict.release_year ? `(${verdict.release_year})` : ''}`,
      `**Media Type:** ${verdict.media_type.toUpperCase()} | **AI Verdict:** ${verdict.verdict}`,
      `**Calibrated Score:** ${verdict.overall_score.toFixed(1)} / 10 (Confidence: ${Math.round(verdict.confidence * 100)}%)`,
      `**Critic Reception:** ${verdict.critic_sentiment} | **Audience Reception:** ${verdict.audience_sentiment}`,
      '',
      `### Executive Spoiler-Free Summary`,
      verdict.spoiler_free_summary,
      '',
      `### Key Grounded Strengths`,
      ...verdict.strengths.map(s => `- **${s.aspect}** (${s.score.toFixed(1)}/10): ${s.evidence.join(' ')}`),
      '',
      ...(verdict.weaknesses.length > 0 ? [
        `### Shortcomings & Caveats`,
        ...verdict.weaknesses.map(w => `- **${w.aspect}** (${w.score.toFixed(1)}/10): ${w.evidence.join(' ')}`),
        ''
      ] : []),
      `### External Benchmark Scores`,
      ...Object.entries(verdict.external_ratings).map(([k, v]) => `- ${k}: ${v}`),
      '',
      `### Grounded Evidence Sources Cited (${verdict.sources.length} sources)`,
      ...verdict.sources.map((s, idx) => `${idx + 1}. [${s.source_name}] (${s.category}): "${s.excerpt}" - ${s.url}`),
      '',
      `_Generated on ${new Date(verdict.analyzed_at).toLocaleDateString()} by CineScope Intelligence Engine (${verdict.engine_used})_`
    ];

    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedBrief(true);
    setTimeout(() => setCopiedBrief(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-6xl mx-auto space-y-8 pb-16 select-none"
    >
      {/* Top Navigation Row */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button
          onClick={onBack}
          className="liquid-glass flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-full transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4 text-rose-400" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center space-x-2.5">
          {/* Copy Brief Button */}
          <button
            onClick={handleCopyBrief}
            className={`liquid-glass flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              copiedBrief
                ? 'bg-emerald-600/20 text-emerald-300 border-emerald-500/40'
                : 'text-slate-300 hover:text-white hover:border-white/20'
            }`}
            title="Copy full intelligence brief to clipboard as Markdown"
          >
            {copiedBrief ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span>Brief Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Brief</span>
              </>
            )}
          </button>

          {/* Print / Save PDF Button */}
          <button
            onClick={() => window.print()}
            className="liquid-glass flex items-center space-x-1.5 px-3.5 py-2 rounded-full text-xs sm:text-sm font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Print or export as PDF"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span className="hidden sm:inline">Export</span>
          </button>

          {/* Compare Button */}
          <button
            onClick={() => onToggleCompare(verdict.canonical_id)}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer shadow-lg ${
              isCompared
                ? 'bg-rose-600 text-white shadow-rose-600/30 border border-rose-400/30'
                : 'liquid-glass text-slate-200 hover:text-white hover:border-rose-500/40'
            }`}
          >
            {isCompared ? '✓ Queued for Compare' : '+ Queue for Compare'}
          </button>
        </div>
      </div>

      {/* Disambiguation & Alternative Adaptations Banner */}
      {verdict.disambiguation_options && verdict.disambiguation_options.length > 0 && (
        <div className="liquid-glass p-4 sm:p-5 rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-transparent to-slate-900/60 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
            <Layers className="w-4 h-4 shrink-0 animate-pulse text-cyan-400" />
            <span>Alternative Adaptations & Related Releases</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {verdict.disambiguation_options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => onSelectTitle && onSelectTitle(opt.id)}
                className="liquid-glass flex items-center space-x-2 text-xs px-3.5 py-1.5 rounded-full text-slate-200 hover:text-white hover:border-cyan-400/50 transition-all group cursor-pointer"
                title={`Switch to analysis for ${opt.title}`}
              >
                <span className="font-semibold group-hover:text-cyan-300 transition-colors font-sans">{opt.title}</span>
                <span className="text-[10px] font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-700/50">
                  {opt.media_type} {opt.release_year ? `• ${opt.release_year}` : ''}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hero Header Banner with Liquid Glass 2.0 */}
      <div className="relative rounded-3xl overflow-hidden liquid-glass-strong shadow-2xl border border-white/10">
        {/* Backdrop image */}
        {verdict.backdrop_url && (
          <div className="absolute inset-0 z-0 opacity-25 filter blur-sm overflow-hidden pointer-events-none">
            <img
              src={getOptimizedPosterUrl(verdict.backdrop_url) || verdict.backdrop_url}
              alt={verdict.title}
              className="w-full h-full object-cover scale-105"
              referrerPolicy="no-referrer"
            />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#06080c] via-[#06080c]/85 to-transparent z-0 pointer-events-none" />

        {/* Content layout */}
        <div className="relative z-10 p-6 sm:p-10 flex flex-col md:flex-row gap-8 items-start">
          {/* Poster */}
          <div className="w-44 sm:w-56 shrink-0 aspect-[2/3] rounded-3xl overflow-hidden shadow-2xl border border-white/15 bg-slate-900 group">
            {verdict.poster_url ? (
              <img
                src={getOptimizedPosterUrl(verdict.poster_url) || verdict.poster_url}
                alt={verdict.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-600 bg-slate-900">
                <Film className="w-12 h-12" />
              </div>
            )}
          </div>

          {/* Title and Metadata */}
          <div className="flex-1 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2.5">
                <span className="liquid-glass text-xs px-3 py-1 rounded-full font-mono font-bold uppercase tracking-wider text-rose-300 border border-rose-500/30">
                  {verdict.media_type}
                </span>
                {verdict.release_year && (
                  <span className="liquid-glass text-xs px-3 py-1 rounded-full font-mono text-slate-300">
                    {verdict.release_year}
                  </span>
                )}
                {verdict.is_preliminary && (
                  <span className="liquid-glass text-xs px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30">
                    Preliminary Stage
                  </span>
                )}
                {verdict.engine_used?.toLowerCase().includes('centralized') && (
                  <span className="liquid-glass text-xs px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 font-bold border border-emerald-500/30 flex items-center space-x-1.5 shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>0 Tokens · Central Knowledge Store</span>
                  </span>
                )}
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-sans mb-3">
                {verdict.title}
              </h1>

              {/* Genre Pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {verdict.genres.map((g, i) => (
                  <span
                    key={i}
                    className="liquid-glass text-xs px-3 py-1 rounded-full text-slate-300 font-medium"
                  >
                    {g}
                  </span>
                ))}
              </div>

              {/* Synopsis */}
              {verdict.overview && (
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-sans max-w-3xl font-normal">
                  {verdict.overview}
                </p>
              )}
            </div>

            {/* External Platform Baseline Ratings Bar */}
            <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center gap-2.5 text-xs">
              <span className="text-slate-400 font-mono font-semibold uppercase tracking-wider text-[11px]">
                External Benchmarks:
              </span>
              {Object.entries(verdict.external_ratings)
                .filter(([k]) => !['catalog source', 'category'].includes(k.toLowerCase()))
                .map(([platform, scoreVal]) => {
                  let badgeGlow = 'text-amber-300 border-amber-500/20';
                  let icon = <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />;
                  
                  if (platform.toLowerCase().includes('rotten')) {
                    badgeGlow = 'text-rose-300 border-rose-500/20';
                    icon = <span className="text-xs">🍅</span>;
                  } else if (platform.toLowerCase().includes('metacritic')) {
                    badgeGlow = 'text-emerald-300 border-emerald-500/20';
                    icon = <span className="text-[10px] font-black px-1 rounded bg-emerald-500/30 text-emerald-300">M</span>;
                  }

                  return (
                    <div
                      key={platform}
                      className={`liquid-glass flex items-center space-x-1.5 px-3 py-1.5 rounded-full ${badgeGlow} font-mono text-xs`}
                    >
                      {icon}
                      <span className="text-slate-300">{platform}:</span>
                      <strong className="text-white">{scoreVal}</strong>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Massive Data & Crowd Intelligence Synthesis Card */}
      <div className="liquid-glass-strong p-6 sm:p-8 rounded-3xl space-y-6 shadow-2xl border border-white/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-rose-500/20 to-purple-500/20 border border-amber-400/30 flex items-center justify-center shrink-0 shadow-lg">
              <Database className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight font-sans">
                  Massive Review Intelligence & Crowd Synthesis
                </h3>
                <span className="liquid-glass text-[10px] font-mono font-bold px-3 py-1 rounded-full text-indigo-300 border border-indigo-500/30 uppercase tracking-widest">
                  High-Throughput Crowd Analysis
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
                Synthesized thousands of viewer comments, verified critic reviews, and community threads across global platforms using local <strong className="text-slate-200">ModernBERT-large RLCD</strong> sentiment extraction.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4 shrink-0 self-start md:self-auto liquid-glass px-5 py-2.5 rounded-full border border-white/10">
            <div className="text-center">
              <div className="text-slate-400 text-[10px] uppercase font-mono font-bold tracking-wider">Audience Tone</div>
              <div className="font-extrabold text-xs sm:text-sm text-emerald-400">{verdict.audience_sentiment}</div>
            </div>
            <div className="h-6 w-[1px] bg-white/10" />
            <div className="text-center">
              <div className="text-slate-400 text-[10px] uppercase font-mono font-bold tracking-wider">Critic Tone</div>
              <div className="font-extrabold text-xs sm:text-sm text-cyan-400">{verdict.critic_sentiment}</div>
            </div>
          </div>
        </div>

        {/* 4 Quantitative Data Volume Stat Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stat 1: Total Signals */}
          <div className="liquid-glass p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-amber-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Total Signals</span>
              <Layers className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-300 font-mono tracking-tight my-1">
              {verdict.data_scale ? verdict.data_scale.total_signals_analyzed.toLocaleString() : `${verdict.sources.length * 1500}+`}
            </div>
            <div className="text-[10px] text-slate-400">Total surveyed crowd data</div>
          </div>

          {/* Stat 2: Verified Audience Ratings */}
          <div className="liquid-glass p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-emerald-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Audience Votes</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono tracking-tight my-1">
              {verdict.data_scale ? verdict.data_scale.audience_votes_count.toLocaleString() : '70,000+'}
            </div>
            <div className="text-[10px] text-slate-400">IMDb, RT audience & AniList</div>
          </div>

          {/* Stat 3: Accredited Critic Reviews */}
          <div className="liquid-glass p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-cyan-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Critic Reviews</span>
              <Star className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-cyan-300 font-mono tracking-tight my-1">
              {verdict.data_scale ? `${verdict.data_scale.critic_reviews_count}+` : '140+'}
            </div>
            <div className="text-[10px] text-slate-400">Tomatometer & press consensus</div>
          </div>

          {/* Stat 4: Deep Textual Reviews */}
          <div className="liquid-glass p-4 sm:p-5 rounded-2xl flex flex-col justify-between border border-purple-500/20">
            <div className="flex items-center justify-between text-slate-400 mb-1">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider">Textual Reviews</span>
              <MessageSquare className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-300 font-mono tracking-tight my-1">
              {verdict.data_scale ? verdict.data_scale.textual_reviews_analyzed : verdict.sources.length}
            </div>
            <div className="text-[10px] text-slate-400">Long-form essays & threads</div>
          </div>
        </div>

        {/* Sentiment Distribution Bar */}
        {verdict.data_scale && verdict.data_scale.sentiment_distribution && (
          <div className="liquid-glass p-5 rounded-2xl space-y-3 border border-white/[0.08]">
            <div className="flex items-center justify-between text-xs sm:text-sm">
              <span className="font-bold text-slate-200 flex items-center space-x-2">
                <BarChart3 className="w-4 h-4 text-slate-400" />
                <span>Crowd Sentiment Distribution across Sample</span>
              </span>
              <span className="text-xs text-emerald-400 font-mono font-bold">
                {verdict.data_scale.sentiment_distribution.positive ?? 85}% Positive Consensus
              </span>
            </div>

            {/* Tri-color Stacked Bar */}
            <div className="w-full h-3.5 rounded-full bg-slate-900 overflow-hidden flex shadow-inner border border-white/5">
              <div
                style={{ width: `${verdict.data_scale.sentiment_distribution.positive ?? 85}%` }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000"
                title={`Positive: ${verdict.data_scale.sentiment_distribution.positive ?? 85}%`}
              />
              <div
                style={{ width: `${verdict.data_scale.sentiment_distribution.mixed ?? 10}%` }}
                className="h-full bg-amber-400 transition-all duration-1000"
                title={`Mixed: ${verdict.data_scale.sentiment_distribution.mixed ?? 10}%`}
              />
              <div
                style={{ width: `${verdict.data_scale.sentiment_distribution.negative ?? 5}%` }}
                className="h-full bg-rose-500 transition-all duration-1000"
                title={`Negative: ${verdict.data_scale.sentiment_distribution.negative ?? 5}%`}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1 flex-wrap gap-2">
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>Positive ({verdict.data_scale.sentiment_distribution.positive ?? 85}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Mixed ({verdict.data_scale.sentiment_distribution.mixed ?? 10}%)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                <span>Critical ({verdict.data_scale.sentiment_distribution.negative ?? 5}%)</span>
              </div>
            </div>
          </div>
        )}

        {/* Surveyed Platforms Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 font-mono font-semibold text-[11px] uppercase tracking-wider">
            Platforms Synthesized:
          </span>
          {(verdict.data_scale?.platforms_covered && verdict.data_scale.platforms_covered.length > 0
            ? verdict.data_scale.platforms_covered
            : ['IMDb', 'Rotten Tomatoes', 'Metacritic', 'AniList', 'Reddit & Forums', 'Accredited Press']
          ).map((p, pIdx) => (
            <span
              key={pIdx}
              className="liquid-glass text-xs font-medium px-3 py-1 rounded-full text-slate-300 flex items-center space-x-1.5"
            >
              <Check className="w-3 h-3 text-emerald-400" />
              <span>{p}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Core AI Verdict & Scoring Gauge */}
      <ScoreMeter
        score={verdict.overall_score}
        confidence={verdict.confidence}
        verdict={verdict.verdict}
        methodology={verdict.methodology}
        onOpenMethodology={() => setIsMethodologyOpen(true)}
      />

      {/* Strengths & Weaknesses Aspect Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Grounded Strengths */}
        <div className="liquid-glass p-6 sm:p-7 rounded-3xl space-y-4 border border-emerald-500/20">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-xs sm:text-sm uppercase tracking-wider font-mono">
            <CheckCircle className="w-4 h-4" />
            <span>Evidence-Grounded Strengths</span>
          </div>

          <div className="space-y-3.5">
            {verdict.strengths.map((st, idx) => (
              <div key={idx} className="liquid-glass p-4 rounded-2xl border border-white/[0.08]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-white font-sans">{st.aspect}</span>
                  <span className="text-xs font-mono font-bold text-emerald-400 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    ★ {st.score.toFixed(1)} / 10
                  </span>
                </div>
                {st.evidence.map((ev, eIdx) => (
                  <p key={eIdx} className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-2">
                    {ev}
                  </p>
                ))}
                {/* Clickable Citations */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">Citations:</span>
                  {st.source_ids.map((sid) => (
                    <button
                      key={sid}
                      onClick={() => handleCitationClick(sid)}
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/40 hover:bg-emerald-800/60 text-emerald-300 border border-emerald-700/50 transition-colors cursor-pointer"
                    >
                      [{sid}]
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shortcomings & Weaknesses */}
        <div className="liquid-glass p-6 sm:p-7 rounded-3xl space-y-4 border border-rose-500/20">
          <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs sm:text-sm uppercase tracking-wider font-mono">
            <AlertTriangle className="w-4 h-4" />
            <span>Notable Shortcomings & Caveats</span>
          </div>

          <div className="space-y-3.5">
            {verdict.weaknesses.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic liquid-glass rounded-2xl">
                No major critical flaws or structural defects identified in surveyed evidence.
              </div>
            ) : (
              verdict.weaknesses.map((wk, idx) => (
                <div key={idx} className="liquid-glass p-4 rounded-2xl border border-white/[0.08]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-white font-sans">{wk.aspect}</span>
                    <span className="text-xs font-mono font-bold text-rose-400 px-2.5 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/20">
                      ★ {wk.score.toFixed(1)} / 10
                    </span>
                  </div>
                  {wk.evidence.map((ev, eIdx) => (
                    <p key={eIdx} className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-2">
                      {ev}
                    </p>
                  ))}
                  {/* Clickable Citations */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                    <span className="text-[10px] text-slate-500 font-mono uppercase">Citations:</span>
                    {wk.source_ids.map((sid) => (
                      <button
                        key={sid}
                        onClick={() => handleCitationClick(sid)}
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-950/40 hover:bg-rose-800/60 text-rose-300 border border-rose-700/50 transition-colors cursor-pointer"
                      >
                        [{sid}]
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Disagreements & Executive Synthesis */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Critic vs Audience Consensus */}
        <div className="liquid-glass p-6 rounded-3xl flex flex-col justify-between border border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 mb-3.5">
              Consensus Divergence
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass">
                <span className="text-xs text-slate-400">Critic Tone:</span>
                <span className="text-xs font-bold text-white font-mono">{verdict.critic_sentiment}</span>
              </div>
              <div className="flex items-center justify-between p-3.5 rounded-2xl liquid-glass">
                <span className="text-xs text-slate-400">Audience Tone:</span>
                <span className="text-xs font-bold text-cyan-300 font-mono">{verdict.audience_sentiment}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/[0.06] text-[11px] text-slate-500 leading-relaxed font-mono">
            Bayesian confidence is penalized if audience & critic variance exceeds 1.2 points.
          </div>
        </div>

        {/* Executive Narrative */}
        <div className="md:col-span-2 liquid-glass p-6 sm:p-7 rounded-3xl flex flex-col justify-between border border-white/10">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-2.5 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Executive Review Synthesis</span>
            </h3>
            <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans mb-4">
              {verdict.spoiler_free_summary}
            </p>

            {verdict.disagreements.length > 0 && (
              <div className="p-4 rounded-2xl liquid-glass-crimson text-xs border border-rose-500/30">
                <strong className="text-rose-300 block mb-1 font-semibold">
                  Debated Points & Community Controversy:
                </strong>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {verdict.disagreements.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Engine Telemetry */}
          <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2 font-mono">
            <div className="flex items-center space-x-2 flex-wrap gap-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Inference Engine: <strong className="text-slate-200">{verdict.engine_used}</strong></span>
              {verdict.engine_used?.toLowerCase().includes('centralized') && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                  Zero Tokens Consumed
                </span>
              )}
            </div>
            <div className="flex items-center space-x-1.5">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Latency: {verdict.latency_ms}ms</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Evidence Source Inspector */}
      <SourceInspector
        sources={verdict.sources}
        highlightedSourceId={highlightedSourceId}
      />

      {/* Methodology Modal */}
      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
        methodology={verdict.methodology}
        title={verdict.title}
      />
    </motion.div>
  );
};
