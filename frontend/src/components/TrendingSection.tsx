import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Star, Plus, Check, Film, Sparkles, Loader2 } from 'lucide-react';
import { getCuratedShelves, getShelfMore } from '../services/api';
import { CURATED_SHELVES } from '../data/curatedShelves';
import { getOptimizedPosterUrl } from '../utils/imageUrl';

interface ShelfItem {
  id: string;
  title: string;
  media_type: string;
  release_year?: number | null;
  poster_url?: string | null;
  external_score?: number | null;
  genres?: string[];
  overall_score?: number;
  verdict?: string;
  genre?: string;
}

interface CuratedShelfData {
  id: string;
  title: string;
  badge: string;
  tagline: string;
  items: ShelfItem[];
}

interface TrendingSectionProps {
  onSelectTitle: (id: string) => void;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
}

const ShelfCard: React.FC<{
  item: ShelfItem;
  onSelectTitle: (id: string) => void;
  isCompared: boolean;
  onToggleCompare: (id: string) => void;
}> = ({ item, onSelectTitle, isCompared, onToggleCompare }) => {
  const [imgError, setImgError] = useState(false);
  const score = item.overall_score || item.external_score || 8.5;
  const optimizedPoster = getOptimizedPosterUrl(item.poster_url);

  return (
    <div
      onClick={() => onSelectTitle(item.id)}
      className="w-[185px] sm:w-[210px] flex-shrink-0 group select-none flex flex-col justify-between p-3.5 rounded-3xl liquid-glass border border-white/10 hover:border-rose-500/40 hover:scale-[1.02] transition-all duration-300 shadow-xl relative cursor-pointer"
    >
      {/* Compare button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onToggleCompare(item.id);
        }}
        className={`absolute top-5 right-5 z-20 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 backdrop-blur-md transition-all shadow-md cursor-pointer ${
          isCompared
            ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30 border border-rose-400/40'
            : 'liquid-glass text-slate-300 hover:text-white hover:border-white/30'
        }`}
        title={isCompared ? 'Queued for comparison' : 'Add to comparison'}
      >
        {isCompared ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
        <span className="text-[10px]">{isCompared ? 'Queued' : 'Compare'}</span>
      </button>

      {/* Poster Image */}
      <div className="relative aspect-[2/3] w-full rounded-2xl overflow-hidden bg-[#0a0e17] shadow-inner mb-3">
        {optimizedPoster && !imgError ? (
          <img
            src={optimizedPoster}
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-gradient-to-b from-slate-900 to-[#070b12] p-3 text-center">
            <Film className="w-10 h-10 mb-2 text-slate-700" />
            <span className="text-[11px] font-mono text-slate-400 font-bold line-clamp-2">{item.title}</span>
          </div>
        )}

        {/* Media Type Tag */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider liquid-glass text-slate-200 border border-white/10 flex items-center space-x-1">
            {item.media_type === 'anime' ? (
              <Sparkles className="w-2.5 h-2.5 text-rose-400" />
            ) : (
              <Film className="w-2.5 h-2.5 text-cyan-400" />
            )}
            <span>{item.media_type || 'Film'}</span>
          </span>
        </div>

        {/* Score Tag */}
        <div className="absolute bottom-2.5 left-2.5 z-10 flex items-center space-x-1 liquid-glass-strong px-2 py-0.5 rounded-full text-amber-300 text-[11px] font-bold font-mono">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span>{score.toFixed(1)}</span>
        </div>
      </div>

      {/* Info */}
      <div className="space-y-1">
        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-rose-300 transition-colors line-clamp-1 font-sans">
          {item.title}
        </h4>
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="capitalize">{item.media_type}</span>
          {item.release_year && <span>{item.release_year}</span>}
        </div>
      </div>
    </div>
  );
};

const ShelfRow: React.FC<{
  shelf: CuratedShelfData;
  onSelectTitle: (id: string) => void;
  comparedIds: string[];
  onToggleCompare: (id: string) => void;
}> = ({ shelf, onSelectTitle, comparedIds, onToggleCompare }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<ShelfItem[]>(shelf.items || []);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  useEffect(() => {
    if (shelf.items && shelf.items.length > 0) {
      setItems(shelf.items);
    }
  }, [shelf.items]);

  const loadMore = async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);
    try {
      const nextPage = page + 1;
      const res = await getShelfMore(shelf.id, nextPage, 8);
      if (res && Array.isArray(res.items) && res.items.length > 0) {
        setItems(prev => {
          const existingIds = new Set(prev.map(i => i.id));
          const filtered = res.items.filter((i: any) => !existingIds.has(i.id));
          return [...prev, ...filtered];
        });
        setPage(nextPage);
        setHasMore(res.has_more);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.warn(`[TrendingSection] Dynamic loading failed for ${shelf.id}:`, err);
      setHasMore(false);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -500 : 500;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });

      // Trigger automatic loading when sliding towards the end
      if (direction === 'right') {
        setTimeout(() => {
          if (scrollRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
            if (scrollLeft + clientWidth >= scrollWidth - 550) {
              loadMore();
            }
          }
        }, 220);
      }
    }
  };

  const handleScroll = () => {
    if (scrollRef.current && hasMore && !isLoadingMore) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      if (scrollLeft + clientWidth >= scrollWidth - 380) {
        loadMore();
      }
    }
  };

  if (!items || items.length === 0) return null;

  return (
    <div className="space-y-3.5">
      {/* Shelf Header */}
      <div className="flex items-center justify-between border-b border-white/[0.04] pb-3">
        <div className="space-y-0.5">
          <div className="flex items-center space-x-2.5">
            <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-sans">
              {shelf.title}
            </h3>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-white/10 text-amber-300 border border-white/10 hidden sm:inline-block">
              {shelf.badge}
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hidden md:inline-block">
              {items.length} titles
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            {shelf.tagline}
          </p>
        </div>

        {/* Scroll Controls */}
        <div className="flex items-center space-x-1.5 shrink-0">
          <button
            onClick={() => scroll('left')}
            className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-8 h-8 rounded-full liquid-glass flex items-center justify-center text-slate-300 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            title="Slide right & load more"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Scroll Deck */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex space-x-4 overflow-x-auto scrollbar-none scroll-smooth pb-3 pt-1 -mx-2 px-2 items-stretch"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {items.map((item) => (
          <ShelfCard
            key={item.id}
            item={item}
            onSelectTitle={onSelectTitle}
            isCompared={comparedIds.includes(item.id)}
            onToggleCompare={onToggleCompare}
          />
        ))}

        {/* Dynamic Infinite Load More Tile */}
        {hasMore && (
          <div
            onClick={loadMore}
            className="w-[185px] sm:w-[210px] flex-shrink-0 flex flex-col items-center justify-center p-6 rounded-3xl liquid-glass border border-dashed border-white/20 hover:border-amber-400/50 hover:bg-white/[0.06] transition-all group cursor-pointer text-center space-y-3 select-none"
            title="Click to load more high-rated titles"
          >
            {isLoadingMore ? (
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg">
                <ChevronRight className="w-6 h-6 text-amber-400" />
              </div>
            )}
            <div>
              <span className="text-xs font-bold text-white group-hover:text-amber-300 transition-colors block font-sans">
                {isLoadingMore ? 'Loading Masterpieces...' : 'Explore More'}
              </span>
              <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                {isLoadingMore ? 'Querying Catalog...' : 'Slide or Click to Expand'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const TrendingSection: React.FC<TrendingSectionProps> = ({
  onSelectTitle,
  comparedIds,
  onToggleCompare
}) => {
  const [shelves, setShelves] = useState<CuratedShelfData[]>(CURATED_SHELVES);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveShelves() {
      try {
        const liveShelves = await getCuratedShelves();
        if (isMounted && Array.isArray(liveShelves) && liveShelves.length > 0) {
          // Merge live items with fallback to guarantee high-res posters
          setShelves(liveShelves);
        }
      } catch (err) {
        console.warn('Live shelves fetch fallback to curated cache:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadLiveShelves();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="space-y-12 select-none pb-12">
      {/* Category Header */}
      <div className="border-b border-white/[0.06] pb-5 space-y-1">
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-sans">
          Curated Entertainment <span className="font-serif italic font-normal text-rose-300">Archives</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-400 font-normal">
          Benchmark collections across highest-rated anime, Indian cinema, prestige television, Korean series, horror, and hidden gems.
        </p>
      </div>

      {/* Curated Category Shelves */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
          <p className="text-xs text-slate-400 font-mono">
            Extracting verified posters and catalog rankings...
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {shelves.map((shelf) => (
            <ShelfRow
              key={shelf.id}
              shelf={shelf}
              onSelectTitle={onSelectTitle}
              comparedIds={comparedIds}
              onToggleCompare={onToggleCompare}
            />
          ))}
        </div>
      )}
    </div>
  );
};
