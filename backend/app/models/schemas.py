"""
Pydantic schemas for CineScope.
Defines strongly typed models for searches, evidence citations,
aspect breakdowns, AI verdicts, comparisons, and discovery feeds.
"""

from typing import List, Optional, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field

class MediaType(str, Enum):
    MOVIE = "movie"
    ANIME = "anime"
    SERIES = "series"
    DOCUMENTARY = "documentary"
    ALL = "all"

class SourceCategory(str, Enum):
    CRITIC = "critic"
    AUDIENCE = "audience"
    COMMUNITY = "community"
    DISCUSSION = "discussion"
    SPECIALIST = "specialist"

class SourceEvidence(BaseModel):
    id: str = Field(..., description="Unique source identifier, e.g. 'src_1'")
    source_name: str = Field(..., description="Name of the outlet or platform, e.g. 'IGN', 'Anime News Network'")
    url: str = Field(..., description="Direct link to original publication")
    published_date: Optional[str] = Field(None, description="Publication date if available")
    category: SourceCategory = Field(SourceCategory.COMMUNITY, description="Category of the source")
    excerpt: str = Field(..., description="Verbatim or relevant excerpt summarizing the opinion")
    original_rating: Optional[str] = Field(None, description="Original numerical or letter rating, e.g. '9/10'")
    sentiment_score: float = Field(0.0, description="Sentiment score from -1.0 to +1.0")
    confidence: float = Field(1.0, description="Confidence in relevance and source authority (0.0 to 1.0)")
    retrieved_at: str = Field(..., description="ISO timestamp of retrieval")

class AspectScore(BaseModel):
    aspect: str = Field(..., description="Evaluated aspect, e.g. 'Story', 'Animation / Visuals', 'Characters', 'Pacing', 'Soundtrack'")
    score: float = Field(..., ge=1.0, le=10.0, description="Calibrated score from 1.0 to 10.0")
    sentiment: str = Field("Positive", description="'Positive', 'Mixed', or 'Negative'")
    evidence: List[str] = Field(default_factory=list, description="Specific grounded observations from sources")
    source_ids: List[str] = Field(default_factory=list, description="IDs of cited sources")

class ScoringMethodology(BaseModel):
    critic_rating_mean: Optional[float] = None
    audience_rating_mean: Optional[float] = None
    sentiment_synthetic_score: float
    source_count: int
    critic_count: int
    audience_count: int
    community_count: int
    diversity_multiplier: float
    disagreement_penalty: float
    sample_size_penalty: float
    final_calibrated_score: float
    confidence_estimate: float
    explanation: str

class DataScaleMetrics(BaseModel):
    total_signals_analyzed: int = Field(..., description="Grand total of audience votes, critic reviews, and community thoughts parsed")
    audience_votes_count: int = Field(0, description="Total verified viewer ratings across platforms like IMDb, AniList, RT")
    critic_reviews_count: int = Field(0, description="Total certified critic and press reviews surveyed")
    textual_reviews_analyzed: int = Field(0, description="Individual in-depth review essays, critic excerpts, and forum threads parsed")
    community_discussions_analyzed: int = Field(0, description="Discussions and forum comments analyzed")
    sentiment_distribution: Dict[str, float] = Field(default_factory=dict, description="Percentage breakdown: {'positive': 92.5, 'mixed': 5.0, 'negative': 2.5}")
    platforms_covered: List[str] = Field(default_factory=list, description="List of verified data sources surveyed")

class ReviewVerdict(BaseModel):
    title: str = Field(..., description="Resolved official title")
    canonical_id: str = Field(..., description="Unique canonical identifier")
    media_type: MediaType = Field(..., description="Movie, Anime, Series, or Documentary")
    release_year: Optional[int] = Field(None, description="Year of release")
    poster_url: Optional[str] = Field(None, description="High-resolution poster image URL")
    backdrop_url: Optional[str] = Field(None, description="Backdrop / banner image URL")
    genres: List[str] = Field(default_factory=list, description="Genre tags")
    overview: str = Field("", description="Official synopsis")
    verdict: str = Field(..., description="Definitive AI verdict, e.g. 'Definite Watch', 'Worth Watching'")
    overall_score: float = Field(..., ge=1.0, le=10.0, description="Evidence-grounded score on a 1-10 scale")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence calibration (0.0 to 1.0)")
    data_scale: Optional[DataScaleMetrics] = Field(None, description="Detailed scale metrics of reviews and audience signals analyzed")
    external_critic_score: Optional[float] = Field(None, description="Aggregate external critic score (0-10)")
    external_audience_score: Optional[float] = Field(None, description="Aggregate external audience score (0-10)")
    external_ratings: Dict[str, str] = Field(default_factory=dict, description="e.g. {'MyAnimeList': '8.5/10', 'AniList': '86%'}")
    strengths: List[AspectScore] = Field(default_factory=list, description="Top positive aspects grounded in evidence")
    weaknesses: List[AspectScore] = Field(default_factory=list, description="Notable shortcomings grounded in evidence")
    audience_sentiment: str = Field("Positive", description="Audience reception tone")
    critic_sentiment: str = Field("Positive", description="Critic reception tone")
    disagreements: List[str] = Field(default_factory=list, description="Notable polarizations or critic vs audience divides")
    spoiler_free_summary: str = Field(..., description="Synthesis of overall reception without narrative spoilers")
    methodology: ScoringMethodology = Field(..., description="Complete audit trail of score derivation")
    sources: List[SourceEvidence] = Field(default_factory=list, description="Full list of inspected evidence sources")
    is_preliminary: bool = Field(False, description="True if initial quick result before deep research completed")
    engine_used: str = Field("LAYA + Groq Hybrid", description="AI inference engine used")
    disambiguation_options: List[Dict[str, Any]] = Field(default_factory=list, description="Other media formats/adaptations of this title")
    latency_ms: float = Field(0.0, description="Total pipeline latency in milliseconds")
    analyzed_at: str = Field(..., description="ISO timestamp")

class TitleSearchResult(BaseModel):
    id: str
    title: str
    english_title: Optional[str] = None
    romaji_title: Optional[str] = None
    media_type: MediaType
    release_year: Optional[int] = None
    genres: List[str] = Field(default_factory=list)
    overview: str = ""
    poster_url: Optional[str] = None
    backdrop_url: Optional[str] = None
    external_score: Optional[float] = None
    popularity: Optional[int] = None

class ComparisonRequest(BaseModel):
    title_ids: List[str] = Field(..., min_length=2, max_length=4)

class AspectComparison(BaseModel):
    aspect: str
    winner_title: str
    analysis: str
    score_comparison: Dict[str, float]

class ComparisonResult(BaseModel):
    titles: List[ReviewVerdict]
    comparative_summary: str
    aspect_comparisons: List[AspectComparison]
    final_recommendation: str

class DiscoveryFeedItem(BaseModel):
    query: str
    title_candidates: List[TitleSearchResult]
    curated_tag: str
    reasoning: str
