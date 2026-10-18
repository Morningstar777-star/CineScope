export type MediaType = 'movie' | 'anime' | 'series' | 'documentary' | 'all';

export type SourceCategory = 'critic' | 'audience' | 'community' | 'discussion' | 'specialist';

export interface SourceEvidence {
  id: string;
  source_name: string;
  url: string;
  published_date?: string | null;
  category: SourceCategory;
  excerpt: string;
  original_rating?: string | null;
  sentiment_score: number;
  confidence: number;
  retrieved_at: string;
}

export interface AspectScore {
  aspect: string;
  score: number;
  sentiment: string;
  evidence: string[];
  source_ids: string[];
}

export interface ScoringMethodology {
  critic_rating_mean?: number | null;
  audience_rating_mean?: number | null;
  sentiment_synthetic_score: number;
  source_count: number;
  critic_count: number;
  audience_count: number;
  community_count: number;
  diversity_multiplier: number;
  disagreement_penalty: number;
  sample_size_penalty: number;
  final_calibrated_score: number;
  confidence_estimate: number;
  explanation: string;
}

export interface DataScaleMetrics {
  total_signals_analyzed: number;
  audience_votes_count: number;
  critic_reviews_count: number;
  textual_reviews_analyzed: number;
  community_discussions_analyzed: number;
  sentiment_distribution: {
    positive?: number;
    mixed?: number;
    negative?: number;
  };
  platforms_covered: string[];
}

export interface ReviewVerdict {
  title: string;
  canonical_id: string;
  media_type: MediaType;
  release_year?: number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  genres: string[];
  overview: string;
  verdict: string;
  overall_score: number;
  confidence: number;
  data_scale?: DataScaleMetrics | null;
  external_critic_score?: number | null;
  external_audience_score?: number | null;
  external_ratings: Record<string, string>;
  strengths: AspectScore[];
  weaknesses: AspectScore[];
  audience_sentiment: string;
  critic_sentiment: string;
  disagreements: string[];
  spoiler_free_summary: string;
  methodology: ScoringMethodology;
  sources: SourceEvidence[];
  is_preliminary: boolean;
  engine_used: string;
  disambiguation_options?: { id: string; title: string; media_type: string; release_year?: number; poster_url?: string }[];
  latency_ms: number;
  analyzed_at: string;
}

export interface TitleSearchResult {
  id: string;
  title: string;
  english_title?: string | null;
  romaji_title?: string | null;
  media_type: MediaType;
  release_year?: number | null;
  genres: string[];
  overview: string;
  poster_url?: string | null;
  backdrop_url?: string | null;
  external_score?: number | null;
  popularity?: number | null;
}

export interface AspectComparison {
  aspect: string;
  winner_title: string;
  analysis: string;
  score_comparison: Record<string, number>;
}

export interface ComparisonResult {
  titles: ReviewVerdict[];
  comparative_summary: string;
  aspect_comparisons: AspectComparison[];
  final_recommendation: string;
}

export interface DiscoveryFeedItem {
  query: string;
  title_candidates: TitleSearchResult[];
  curated_tag: string;
  reasoning: string;
}

export interface SystemHealth {
  status: string;
  system: {
    ram_used_gb: number;
    ram_total_gb: number;
    ram_percent: number;
    vram_status: string;
  };
  models: {
    laya_local_loaded: boolean;
    laya_engine_name: string;
    llm_synthesis_model: string;
    llm_fast_model: string;
  };
}
