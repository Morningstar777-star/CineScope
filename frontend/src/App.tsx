import React, { useState } from 'react';
import { Navbar } from './components/Navbar';
import { AtmosphereBackground } from './components/AtmosphereBackground';
import { HeroSection } from './components/HeroSection';
import { SearchBar } from './components/SearchBar';
import { TrendingSection } from './components/TrendingSection';
import { TrendingWorldwideGrid } from './components/TrendingWorldwideGrid';
import { DiscoveryFeed } from './components/DiscoveryFeed';
import { TitleDetailPage } from './components/TitleDetailPage';
import { CompareSection } from './components/CompareSection';
import { ResearchProgressBar } from './components/ResearchProgressBar';
import { ReviewVerdict, DiscoveryFeedItem } from './types';
import { getTitleAnalysis, getDiscovery, streamTitleAnalysis } from './services/api';
import { X, GitCompare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const App: React.FC = () => {
  // Always land on 'discovery' first as requested
  const [activeTab, setActiveTab] = useState<'trending' | 'discovery' | 'compare'>('discovery');
  const [selectedVerdict, setSelectedVerdict] = useState<ReviewVerdict | null>(null);
  const [discoveryItem, setDiscoveryItem] = useState<DiscoveryFeedItem | null>(null);
  const [comparedTitleIds, setComparedTitleIds] = useState<string[]>([]);

  // Progressive research loading state
  const [isResearching, setIsResearching] = useState(false);
  const [researchStage, setResearchStage] = useState(1);
  const [stageMessage, setStageMessage] = useState('');

  const handleSelectTitle = (canonicalId: string) => {
    setIsResearching(true);
    setResearchStage(1);
    setStageMessage('Resolving canonical metadata and catalog ratings...');
    setSelectedVerdict(null);

    let hasCompleted = false;

    // Connect to real-time backend SSE stream
    streamTitleAnalysis(
      canonicalId,
      (update) => {
        if (update.step === 'metadata_resolved') {
          setResearchStage(2);
          setStageMessage(`Resolved "${update.title || canonicalId}". Gathering evidence from critics and communities...`);
        } else if (update.step === 'sources_gathered') {
          setResearchStage(3);
          setStageMessage(`Gathered ${update.source_count || 'multiple'} sources. Running local LAYA ModernBERT sentiment inference...`);
        } else if (update.step === 'preliminary_verdict') {
          setResearchStage(4);
          setStageMessage(`Calibrating Bayesian consensus for "${update.verdict || 'Verdict'}"...`);
        } else if (update.step === 'complete') {
          hasCompleted = true;
          setResearchStage(5);
          setStageMessage('Synthesis complete!');
          if (update.data) {
            setSelectedVerdict(update.data);
          }
          setTimeout(() => setIsResearching(false), 300);
        } else if (update.step === 'error') {
          console.warn('Streaming encountered an error, falling back to standard API fetch');
          fallbackFetch();
        }
      },
      (err) => {
        console.warn('SSE stream error, initiating REST fallback:', err);
        fallbackFetch();
      }
    );

    function fallbackFetch() {
      if (hasCompleted) return;
      getTitleAnalysis(canonicalId)
        .then((verdict) => {
          setSelectedVerdict(verdict);
          setIsResearching(false);
        })
        .catch((err) => {
          console.error('Final analysis fetch error:', err);
          setIsResearching(false);
        });
    }
  };

  const handleExecuteDiscovery = async (discoveryQuery: string) => {
    setIsResearching(true);
    setResearchStage(1);
    setStageMessage(`Searching global catalogs for: "${discoveryQuery}"...`);
    setSelectedVerdict(null);

    try {
      const feed = await getDiscovery(discoveryQuery);
      setDiscoveryItem(feed);
      setActiveTab('discovery');
    } catch (err) {
      console.error('Discovery search failed:', err);
    } finally {
      setIsResearching(false);
    }
  };

  const toggleCompare = (id: string) => {
    setComparedTitleIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 3) {
          return [...prev.slice(1), id];
        }
        return [...prev, id];
      }
    });
  };

  return (
    <div className="relative min-h-screen flex flex-col text-slate-100 font-sans selection:bg-rose-500/30 selection:text-rose-200">
      {/* 7-Layer Viewport Stacking Atmosphere */}
      <AtmosphereBackground />

      {/* Floating Liquid Glass Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          if (tab === 'trending' || tab === 'compare' || tab === 'discovery') {
            setSelectedVerdict(null);
            if (tab !== 'discovery') {
              setDiscoveryItem(null);
            }
          }
        }}
        comparisonCount={comparedTitleIds.length}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10 z-10">
        {/* Render Hero Section when on Home Discovery View (clean headline) */}
        {!selectedVerdict && activeTab === 'discovery' && !isResearching && (
          <HeroSection />
        )}

        {/* Universal Search Bar */}
        {activeTab !== 'compare' && (
          <section className="space-y-4 pt-1">
            <SearchBar
              onSelectTitle={handleSelectTitle}
              onExecuteDiscovery={handleExecuteDiscovery}
              hidePopularIntel={activeTab === 'trending'}
            />
          </section>
        )}

        {/* Progressive Research Loading Bar */}
        {isResearching && (
          <ResearchProgressBar
            currentStage={researchStage}
            stageMessage={stageMessage}
          />
        )}

        {/* View Switcher */}
        {!isResearching && (
          <AnimatePresence mode="wait">
            {/* Title Detail View */}
            {selectedVerdict ? (
              <TitleDetailPage
                key={selectedVerdict.canonical_id}
                verdict={selectedVerdict}
                onBack={() => setSelectedVerdict(null)}
                onToggleCompare={toggleCompare}
                isCompared={comparedTitleIds.includes(selectedVerdict.canonical_id)}
                onSelectTitle={handleSelectTitle}
              />
            ) : activeTab === 'compare' ? (
              <CompareSection
                key="compare"
                initialTitleIds={comparedTitleIds}
                onSelectTitle={handleSelectTitle}
                onClearQueue={() => setComparedTitleIds([])}
              />
            ) : activeTab === 'discovery' && discoveryItem ? (
              <DiscoveryFeed
                key="discovery-feed"
                feedItem={discoveryItem}
                onSelectTitle={handleSelectTitle}
                comparedIds={comparedTitleIds}
                onToggleCompare={toggleCompare}
                onClear={() => {
                  setDiscoveryItem(null);
                }}
              />
            ) : activeTab === 'discovery' ? (
              /* Trending Worldwide Live Grid on Discover */
              <TrendingWorldwideGrid
                key="trending-worldwide-grid"
                onSelectTitle={handleSelectTitle}
                comparedIds={comparedTitleIds}
                onToggleCompare={toggleCompare}
              />
            ) : (
              /* Trending Section with Curated Shelves Only */
              <TrendingSection
                key="trending-shelves"
                onSelectTitle={handleSelectTitle}
                comparedIds={comparedTitleIds}
                onToggleCompare={toggleCompare}
              />
            )}
          </AnimatePresence>
        )}
      </main>

      {/* Floating Comparison Tray (when titles are queued and user is not on compare page) */}
      <AnimatePresence>
        {comparedTitleIds.length > 0 && activeTab !== 'compare' && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 select-none"
          >
            <div className="liquid-glass-strong px-4 py-3 rounded-full border border-rose-500/50 shadow-2xl flex items-center space-x-3.5 backdrop-blur-2xl">
              <div className="flex items-center space-x-2 pl-1">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
                <span className="text-xs font-bold text-white font-mono">
                  {comparedTitleIds.length} Title{comparedTitleIds.length > 1 ? 's' : ''} Queued
                </span>
              </div>
              <button
                onClick={() => {
                  setActiveTab('compare');
                  setSelectedVerdict(null);
                }}
                className="liquid-glass-crimson px-3.5 py-1.5 rounded-full text-xs font-bold text-white hover:scale-105 active:scale-95 transition-all cursor-pointer shadow-md flex items-center space-x-1.5"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Open Compare Deck</span>
              </button>
              <button
                onClick={() => setComparedTitleIds([])}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                title="Clear comparison deck"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Elevated Editorial Footer */}
      <footer className="border-t border-white/[0.06] py-10 mt-16 bg-[#040609]/80 backdrop-blur-xl text-center text-xs text-slate-500 space-y-2.5 relative z-10">
        <p className="font-medium text-slate-400 font-sans text-sm">
          Cine<span className="font-serif italic text-rose-300 text-base">Scope</span> — Global Cinema, Anime & Series Intelligence Engine
        </p>
      </footer>
    </div>
  );
};
