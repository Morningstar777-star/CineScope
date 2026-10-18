import React, { useState, useEffect, useRef } from 'react';
import { 
  GitCompare, 
  Search, 
  Trophy, 
  Award, 
  Sparkles, 
  X, 
  ArrowRight, 
  Loader2, 
  Film, 
  Plus, 
  RotateCcw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { TitleSearchResult, ComparisonResult } from '../types';
import { searchTitles, compareTitles } from '../services/api';
import { getOptimizedPosterUrl } from '../utils/imageUrl';

interface CompareSectionProps {
  initialTitleIds?: string[];
  onSelectTitle: (canonicalId: string) => void;
  onClearQueue?: () => void;
}

interface SlotState {
  id: string;
  title: string;
  media_type?: string;
  release_year?: number | null;
  poster_url?: string | null;
}

const PRESET_MATCHUPS = [
  {
    label: 'Dune: Part Two vs Oppenheimer',
    tag: 'Sci-Fi vs Historical Epic',
    icon: '🎬',
    titles: [
      { id: 'wiki_Dune:_Part_Two', title: 'Dune: Part Two', media_type: 'movie', release_year: 2024, poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/5/52/Dune_Part_Two_poster.jpeg&w=480' },
      { id: 'wiki_Oppenheimer_(film)', title: 'Oppenheimer', media_type: 'movie', release_year: 2023, poster_url: 'https://images.weserv.nl/?url=upload.wikimedia.org/wikipedia/en/4/4a/Oppenheimer_%28film%29.jpg&w=480' }
    ]
  },
  {
    label: 'Chainsaw Man vs Jujutsu Kaisen',
    tag: 'Dark Shonen Heavyweights',
    icon: '⚔️',
    titles: [
      { id: 'anilist_171627', title: 'Chainsaw Man', media_type: 'anime', release_year: 2022, poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx171627-ZN9D7P46yHnw.png' },
      { id: 'anilist_113415', title: 'Jujutsu Kaisen', media_type: 'anime', release_year: 2020, poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx113415-LHBAeoZDIsnF.jpg' }
    ]
  },
  {
    label: 'Severance vs Succession',
    tag: 'Prestige Corporate Drama',
    icon: '📺',
    titles: [
      { id: 'wiki_Severance_(TV_series)', title: 'Severance', media_type: 'series', release_year: 2022, poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/548/1371406.jpg' },
      { id: 'wiki_Succession_(TV_series)', title: 'Succession', media_type: 'series', release_year: 2018, poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/453/1134275.jpg' }
    ]
  },
  {
    label: 'Arcane vs Cyberpunk: Edgerunners',
    tag: 'Gaming Masterpiece Adaptations',
    icon: '⚡',
    titles: [
      { id: 'wiki_Arcane_(TV_series)', title: 'Arcane', media_type: 'series', release_year: 2021, poster_url: 'https://static.tvmaze.com/uploads/images/original_untouched/536/1340287.jpg' },
      { id: 'anilist_120377', title: 'Cyberpunk: Edgerunners', media_type: 'anime', release_year: 2022, poster_url: 'https://s4.anilist.co/file/anilistcdn/media/anime/cover/large/bx120377-p4R57b4WkI3p.jpg' }
    ]
  }
];

export const CompareSection: React.FC<CompareSectionProps> = ({
  initialTitleIds = [],
  onSelectTitle,
  onClearQueue
}) => {
  const [slots, setSlots] = useState<(SlotState | null)[]>([null, null]);
  const [searchQueries, setSearchQueries] = useState<string[]>(['', '']);
  const [searchResults, setSearchResults] = useState<TitleSearchResult[][]>([[], []]);
  const [isSearchingSlot, setIsSearchingSlot] = useState<number | null>(null);
  
  const [isComparing, setIsComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [comparisonError, setComparisonError] = useState<string | null>(null);

  const searchTimeoutRefs = useRef<(ReturnType<typeof setTimeout> | null)[]>([null, null]);

  // Initialize from props if provided
  useEffect(() => {
    if (initialTitleIds && initialTitleIds.length >= 2) {
      const newSlots: (SlotState | null)[] = initialTitleIds.slice(0, 3).map(id => ({
        id,
        title: id.replace('wiki_', '').replace(/_/g, ' ').replace('anilist_', 'Title #')
      }));
      while (newSlots.length < 2) newSlots.push(null);
      setSlots(newSlots);
      triggerComparisonWithIds(initialTitleIds.slice(0, 3));
    }
  }, []);

  const handleSearchChange = (slotIndex: number, text: string) => {
    const updatedQueries = [...searchQueries];
    updatedQueries[slotIndex] = text;
    setSearchQueries(updatedQueries);

    if (searchTimeoutRefs.current[slotIndex]) {
      clearTimeout(searchTimeoutRefs.current[slotIndex]!);
    }

    if (!text.trim() || text.length < 2) {
      const updatedResults = [...searchResults];
      updatedResults[slotIndex] = [];
      setSearchResults(updatedResults);
      return;
    }

    setIsSearchingSlot(slotIndex);
    searchTimeoutRefs.current[slotIndex] = setTimeout(async () => {
      try {
        const results = await searchTitles(text.trim());
        setSearchResults(prev => {
          const next = [...prev];
          next[slotIndex] = results.slice(0, 6);
          return next;
        });
      } catch (err) {
        console.error('Search error in slot:', err);
      } finally {
        setIsSearchingSlot(null);
      }
    }, 280);
  };

  const handleSelectTitleForSlot = (slotIndex: number, title: TitleSearchResult) => {
    const updatedSlots = [...slots];
    updatedSlots[slotIndex] = {
      id: title.id,
      title: title.title,
      media_type: title.media_type,
      release_year: title.release_year,
      poster_url: title.poster_url
    };
    setSlots(updatedSlots);

    // Clear search for that slot
    const updatedQueries = [...searchQueries];
    updatedQueries[slotIndex] = '';
    setSearchQueries(updatedQueries);

    const updatedResults = [...searchResults];
    updatedResults[slotIndex] = [];
    setSearchResults(updatedResults);

    // If both slots are now filled, prompt or auto-run
    if (updatedSlots[0] && updatedSlots[1]) {
      triggerComparisonWithIds(updatedSlots.filter(Boolean).map(s => s!.id));
    }
  };

  const handleRemoveSlot = (slotIndex: number) => {
    const updatedSlots = [...slots];
    updatedSlots[slotIndex] = null;
    setSlots(updatedSlots);
    setComparisonResult(null);
    setComparisonError(null);
  };

  const handleAddSlot = () => {
    if (slots.length >= 3) return;
    setSlots([...slots, null]);
    setSearchQueries([...searchQueries, '']);
    setSearchResults([...searchResults, []]);
  };

  const triggerComparisonWithIds = async (ids: string[]) => {
    if (ids.length < 2) return;
    setIsComparing(true);
    setComparisonError(null);
    setComparisonResult(null);

    try {
      const res = await compareTitles(ids);
      setComparisonResult(res);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setComparisonError(err.message || 'Failed to generate comparison. Please verify your selected titles.');
    } finally {
      setIsComparing(false);
    }
  };

  const handleRunComparison = () => {
    const validIds = slots.filter(Boolean).map(s => s!.id);
    if (validIds.length < 2) {
      setComparisonError('Please select at least 2 titles to compare.');
      return;
    }
    triggerComparisonWithIds(validIds);
  };

  const handleSelectPreset = (preset: typeof PRESET_MATCHUPS[0]) => {
    setSlots(preset.titles);
    setComparisonResult(null);
    setComparisonError(null);
    triggerComparisonWithIds(preset.titles.map(t => t.id));
  };

  const handleResetAll = () => {
    setSlots([null, null]);
    setSearchQueries(['', '']);
    setSearchResults([[], []]);
    setComparisonResult(null);
    setComparisonError(null);
    if (onClearQueue) onClearQueue();
  };

  const validSlotsCount = slots.filter(Boolean).length;

  return (
    <div className="space-y-10 select-none pb-16">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/[0.06] pb-6">
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <div className="w-8 h-8 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
              <GitCompare className="w-4 h-4 text-amber-400" />
            </div>
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-300">
              Comparative Intelligence Deck
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight font-sans">
            Head-to-Head <span className="font-serif italic font-normal text-rose-300">Showdowns</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl leading-relaxed">
            Side-by-side evidence synthesis evaluating story arcs, cinematography, character depth, and audience consensus across any entertainment titles.
          </p>
        </div>

        {validSlotsCount > 0 && (
          <button
            onClick={handleResetAll}
            className="self-start md:self-auto px-4 py-2 rounded-full text-xs font-semibold text-slate-400 hover:text-white liquid-glass hover:bg-white/10 transition-all flex items-center space-x-2 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Matchup</span>
          </button>
        )}
      </div>

      {/* Quick Curated Matchups */}
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-mono font-semibold text-slate-400 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-rose-400" />
          <span>Curated Iconic Battles (One-Click Intel)</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESET_MATCHUPS.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className="liquid-glass text-left p-3.5 rounded-2xl hover:border-amber-500/40 hover:bg-white/[0.07] transition-all group cursor-pointer flex flex-col justify-between space-y-2"
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{preset.icon}</span>
                <span className="text-[10px] font-mono text-slate-400 group-hover:text-amber-300 transition-colors">
                  {preset.tag}
                </span>
              </div>
              <div>
                <p className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-200 transition-colors font-sans">
                  {preset.label}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Title Slot Pickers Deck */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
            Selected Competitors ({validSlotsCount} of {slots.length})
          </span>
          {slots.length < 3 && (
            <button
              onClick={handleAddSlot}
              className="text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors flex items-center space-x-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add 3rd Title</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {slots.map((slot, index) => (
            <div
              key={index}
              className={`p-5 rounded-3xl liquid-glass border transition-all relative ${
                slot ? 'border-white/20 bg-white/[0.04]' : 'border-dashed border-white/15'
              }`}
            >
              {slot ? (
                /* Filled Slot Card */
                <div className="flex flex-col justify-between h-full space-y-4">
                  <div className="flex items-start justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/10 text-amber-300 font-bold">
                      Slot {String.fromCharCode(65 + index)}
                    </span>
                    <button
                      onClick={() => handleRemoveSlot(index)}
                      className="text-slate-400 hover:text-rose-400 p-1 rounded-full hover:bg-white/10 transition-colors"
                      title="Remove this title"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center space-x-3.5">
                    {slot.poster_url ? (
                      <img
                        src={getOptimizedPosterUrl(slot.poster_url) || slot.poster_url}
                        alt={slot.title}
                        className="w-14 h-20 object-cover rounded-xl shadow-lg border border-white/10 bg-slate-900"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-14 h-20 rounded-xl bg-slate-800 border border-white/10 flex items-center justify-center text-slate-500">
                        <Film className="w-6 h-6" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <h4 className="text-base font-bold text-white font-sans leading-tight">
                        {slot.title}
                      </h4>
                      <div className="flex items-center space-x-2 text-xs text-slate-400 capitalize font-mono">
                        <span>{slot.media_type || 'Entertainment'}</span>
                        {slot.release_year && <span>• {slot.release_year}</span>}
                      </div>
                      <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-400 font-mono">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Ready for synthesis</span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRemoveSlot(index)}
                    className="w-full py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white liquid-glass hover:bg-white/10 transition-all cursor-pointer text-center"
                  >
                    Change Title
                  </button>
                </div>
              ) : (
                /* Empty Slot with Live Search */
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-slate-400 font-bold">
                      Slot {String.fromCharCode(65 + index)}
                    </span>
                    <span className="text-xs text-slate-500">Choose Title</span>
                  </div>

                  {/* Search Input for Slot */}
                  <div className="relative">
                    <div className="liquid-glass rounded-xl px-3 py-2 flex items-center space-x-2 border border-white/10 focus-within:border-amber-400/50">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search movie, anime, or series..."
                        value={searchQueries[index] || ''}
                        onChange={(e) => handleSearchChange(index, e.target.value)}
                        className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
                      />
                      {isSearchingSlot === index && (
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                      )}
                    </div>

                    {/* Autocomplete Results Dropdown */}
                    {searchResults[index] && searchResults[index].length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 z-30 liquid-glass-strong rounded-2xl shadow-2xl border border-white/15 overflow-hidden max-h-60 overflow-y-auto">
                        {searchResults[index].map((result) => (
                          <div
                            key={result.id}
                            onClick={() => handleSelectTitleForSlot(index, result)}
                            className="p-2.5 hover:bg-white/10 transition-colors cursor-pointer flex items-center space-x-3 border-b border-white/[0.04] last:border-0"
                          >
                            {result.poster_url ? (
                              <img
                                src={getOptimizedPosterUrl(result.poster_url) || result.poster_url}
                                alt={result.title}
                                className="w-8 h-11 object-cover rounded bg-slate-900"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <div className="w-8 h-11 rounded bg-slate-800 flex items-center justify-center text-slate-500 text-xs">
                                🎬
                              </div>
                            )}
                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white truncate font-sans">
                                {result.title}
                              </p>
                              <span className="text-[10px] text-slate-400 capitalize font-mono">
                                {result.media_type} • {result.release_year || 'N/A'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 text-center font-mono">
                    Type any title in the world to benchmark
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Synthesis Action Trigger */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-3">
          <button
            onClick={handleRunComparison}
            disabled={validSlotsCount < 2 || isComparing}
            className={`px-8 py-3.5 rounded-full text-sm font-bold shadow-xl transition-all flex items-center space-x-2.5 cursor-pointer ${
              validSlotsCount >= 2 && !isComparing
                ? 'liquid-glass-crimson text-white hover:scale-105 active:scale-95 shadow-rose-900/40'
                : 'bg-white/5 text-slate-500 cursor-not-allowed border border-white/5'
            }`}
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Synthesizing Comparative Intel...</span>
              </>
            ) : (
              <>
                <GitCompare className="w-4 h-4 text-amber-300" />
                <span>Launch Head-to-Head Comparison</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Feedback */}
      {comparisonError && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-rose-300 text-xs sm:text-sm flex items-center space-x-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-400" />
          <span>{comparisonError}</span>
        </div>
      )}

      {/* Comparison Loading Skeleton */}
      {isComparing && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center py-16 space-y-4 liquid-glass rounded-3xl border border-white/10"
        >
          <div className="relative w-14 h-14 mx-auto flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-rose-500 animate-spin absolute" />
            <GitCompare className="w-5 h-5 text-amber-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-white font-sans">
              Parallelizing Research & LLM Analysis
            </h4>
            <p className="text-xs text-slate-400 font-mono">
              Gathering critic essays, audience debates, and calibrating aspect victor scores...
            </p>
          </div>
        </motion.div>
      )}

      {/* Detailed Comparative Results View */}
      {comparisonResult && !isComparing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Executive Comparative Synthesis Banner */}
          <div className="p-6 rounded-3xl liquid-glass border border-rose-500/30 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-rose-400 mb-3">
              <Sparkles className="w-4 h-4" />
              <span>Executive Comparative Intelligence Verdict</span>
            </div>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed font-sans">
              {comparisonResult.comparative_summary}
            </p>
          </div>

          {/* Side-by-Side Title Scorecards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {comparisonResult.titles.map((title) => (
              <div
                key={title.canonical_id}
                className="p-5 rounded-3xl liquid-glass border border-white/10 flex flex-col justify-between space-y-4 shadow-xl hover:border-white/20 transition-all"
              >
                <div>
                  <div className="flex items-start space-x-4 mb-4">
                    {title.poster_url && (
                      <img
                        src={getOptimizedPosterUrl(title.poster_url) || title.poster_url}
                        alt={title.title}
                        className="w-16 h-24 object-cover rounded-xl shadow-lg border border-white/10 bg-slate-900 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="overflow-hidden">
                      <h3
                        onClick={() => onSelectTitle(title.canonical_id)}
                        className="text-lg font-bold text-white hover:text-rose-400 transition-colors cursor-pointer font-sans leading-tight line-clamp-2"
                      >
                        {title.title}
                      </h3>
                      <p className="text-xs text-slate-400 font-mono capitalize mt-1">
                        {title.media_type} • {title.release_year || 'N/A'}
                      </p>
                      <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded-full bg-white/10 text-[11px] font-mono text-slate-300">
                        {title.verdict}
                      </div>
                    </div>
                  </div>

                  {/* Score Matrix */}
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="p-3 rounded-2xl liquid-glass border border-white/5 text-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                        CineScope Score
                      </span>
                      <span className="text-lg font-black text-amber-300 font-mono">
                        {title.overall_score.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 10</span>
                      </span>
                    </div>
                    <div className="p-3 rounded-2xl liquid-glass border border-white/5 text-center">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block mb-0.5">
                        Confidence
                      </span>
                      <span className="text-lg font-black text-emerald-300 font-mono">
                        {Math.round(title.confidence * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Key Strengths Pills */}
                  {title.strengths && title.strengths.length > 0 && (
                    <div className="space-y-1.5 mb-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 tracking-wider">
                        Hallmark Strengths:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {title.strengths.slice(0, 3).map((s, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[10px] font-medium"
                          >
                            {s.aspect} ({s.score.toFixed(1)})
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => onSelectTitle(title.canonical_id)}
                  className="w-full py-2.5 rounded-2xl text-xs font-bold liquid-glass hover:bg-white/10 text-white transition-all flex items-center justify-center space-x-1.5 cursor-pointer group"
                >
                  <span>Read In-Depth Review</span>
                  <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>

          {/* Aspect-by-Aspect Head-to-Head */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
              <Trophy className="w-4 h-4 text-amber-400" />
              <span>Category Breakdown & Aspect Victor Analysis</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisonResult.aspect_comparisons.map((aspect, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-3xl liquid-glass border border-white/[0.08] shadow-lg flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-bold text-white font-sans">
                        {aspect.aspect}
                      </h4>
                      <span className="px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center space-x-1.5 shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        <span>Winner: {aspect.winner_title}</span>
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {aspect.analysis}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Final Unified Recommendation Banner */}
          <div className="p-6 rounded-3xl liquid-glass-crimson border border-rose-500/40 flex items-start space-x-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center shrink-0">
              <Award className="w-5 h-5 text-rose-300" />
            </div>
            <div className="space-y-1.5">
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-rose-300">
                Final Algorithmic Recommendation
              </h4>
              <p className="text-sm sm:text-base text-white leading-relaxed font-sans">
                {comparisonResult.final_recommendation}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
