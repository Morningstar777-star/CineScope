import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, History, Film, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TitleSearchResult } from '../types';
import { searchTitles } from '../services/api';
import { getOptimizedPosterUrl } from '../utils/imageUrl';

interface SearchBarProps {
  onSelectTitle: (id: string) => void;
  onExecuteDiscovery: (query: string) => void;
  hidePopularIntel?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSelectTitle,
  onExecuteDiscovery,
  hidePopularIntel = false
}) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<TitleSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [history, setHistory] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('cinescope_search_history');
      return saved ? JSON.parse(saved) : ['Chainsaw Man', 'Severance', 'Oppenheimer'];
    } catch {
      return ['Chainsaw Man', 'Severance', 'Oppenheimer'];
    }
  });

  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close popup when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      setSelectedIndex(-1);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchTitles(query);
        setSuggestions(results);
        setIsOpen(true);
        setSelectedIndex(-1);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 240);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (item: TitleSearchResult) => {
    const updated = [item.title, ...history.filter(h => h.toLowerCase() !== item.title.toLowerCase())].slice(0, 6);
    setHistory(updated);
    try {
      localStorage.setItem('cinescope_search_history', JSON.stringify(updated));
    } catch {}

    setIsOpen(false);
    setQuery(item.title);
    onSelectTitle(item.id);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    if (selectedIndex >= 0 && suggestions[selectedIndex]) {
      handleSelect(suggestions[selectedIndex]);
      return;
    }

    const lower = query.toLowerCase();
    const isDiscovery = lower.includes('trending') || lower.includes('best') || lower.includes('underrated') || lower.includes('worth') || lower.includes('anime with') || lower.includes('compare') || lower.includes(' vs ');

    if (isDiscovery) {
      onExecuteDiscovery(query);
      setIsOpen(false);
    } else if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
    } else {
      onExecuteDiscovery(query);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const quickPills = [
    'Chainsaw Man',
    'Severance',
    'Dune: Part Two',
    'Best psychological thrillers',
    'Trending anime this week'
  ];

  return (
    <div ref={wrapperRef} className="relative w-full max-w-3xl mx-auto z-40 select-none">
      {/* Search Input Shell with Liquid Glass 2.0 */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="liquid-glass-strong rounded-full p-1.5 flex items-center shadow-2xl transition-all duration-300 focus-within:shadow-[0_0_35px_rgba(244,63,94,0.25)]">
          <div className="pl-4 pr-2 text-slate-400">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-rose-500" />
            ) : (
              <Search className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search any movie, anime, or ask 'Best psychological thrillers'..."
            className="w-full py-3 px-2 bg-transparent text-white placeholder-slate-400 text-sm sm:text-base focus:outline-none font-sans tracking-tight"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="p-2 text-slate-400 hover:text-white transition-colors mr-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            type="submit"
            className="liquid-glass-crimson px-5 py-2.5 rounded-full text-white text-xs sm:text-sm font-semibold tracking-wide hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center space-x-1.5 cursor-pointer shadow-md shrink-0"
          >
            <span>Analyze</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>

      {/* Autocomplete / History Dropdown with Liquid Glass 2.0 */}
      <AnimatePresence>
        {isOpen && (suggestions.length > 0 || history.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute left-0 right-0 mt-2.5 liquid-glass-strong rounded-3xl overflow-hidden shadow-2xl z-50 divide-y divide-white/[0.06] text-left"
          >
            {/* Live Autocomplete Results */}
            {suggestions.length > 0 && (
              <div className="py-2.5 text-left">
                <div className="px-5 py-1 text-[11px] font-mono uppercase tracking-wider text-slate-400 font-semibold text-left">
                  Verified Matches
                </div>
                {suggestions.map((item, idx) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item)}
                    className={`px-5 py-2.5 flex items-center justify-between cursor-pointer transition-colors text-left ${
                      idx === selectedIndex ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center space-x-3.5 min-w-0 flex-1 text-left">
                      {item.poster_url ? (
                        <img
                          src={getOptimizedPosterUrl(item.poster_url) || item.poster_url}
                          alt={item.title}
                          className="w-9 h-12 object-cover rounded-lg bg-slate-800 shrink-0 shadow-md"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-9 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500 shrink-0">
                          {item.media_type === 'anime' ? <Sparkles className="w-4 h-4 text-rose-400" /> : <Film className="w-4 h-4 text-cyan-400" />}
                        </div>
                      )}
                      <div className="min-w-0 flex-1 text-left">
                        <div className="text-sm font-semibold text-white truncate text-left font-sans">
                          {item.title}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono mt-0.5 text-left">
                          <span className="capitalize text-slate-300">{item.media_type}</span>
                          {item.release_year && <span>• {item.release_year}</span>}
                          {item.genres.length > 0 && <span className="hidden sm:inline text-slate-500">• {item.genres.slice(0, 2).join(', ')}</span>}
                        </div>
                      </div>
                    </div>
                    {item.external_score && (
                      <div className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-white/10 text-amber-300 border border-amber-400/20 shrink-0 ml-3">
                        ★ {item.external_score}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Search History */}
            {history.length > 0 && (
              <div className="px-5 py-3 bg-black/20">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <History className="w-3 h-3 mr-1 text-slate-400" /> Recent Inquiries
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setHistory([]);
                      localStorage.removeItem('cinescope_search_history');
                    }}
                    className="text-[10px] text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    Clear history
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {history.map((h, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setQuery(h);
                        onExecuteDiscovery(h);
                        setIsOpen(false);
                      }}
                      className="text-xs px-3 py-1 rounded-full liquid-glass text-slate-300 hover:text-white hover:border-rose-500/30 transition-all"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suggested Quick Searches */}
      {!hidePopularIntel && (
        <div className="mt-3.5 flex items-center flex-wrap gap-2 justify-center">
          <span className="text-xs text-slate-400 flex items-center font-medium">
            <Sparkles className="w-3 h-3 text-rose-500 mr-1.5" /> Popular Intel:
          </span>
          {quickPills.map((pill, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(pill);
                onExecuteDiscovery(pill);
              }}
              className="text-xs px-3 py-1 rounded-full liquid-glass text-slate-300 hover:text-white hover:scale-105 active:scale-95 transition-all cursor-pointer font-medium"
            >
              {pill}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
