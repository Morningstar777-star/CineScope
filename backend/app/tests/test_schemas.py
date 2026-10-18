"""
Unit tests for CineScope Schemas & Pipeline Integrity.
"""

import pytest
from app.models.schemas import SourceEvidence, AspectScore, ScoringMethodology, ReviewVerdict, MediaType, SourceCategory
from app.services.llm_service import llm_service

def test_citation_grounding_filter():
    """Ensure LLMService strips hallucinated source IDs that do not exist in evidence."""
    valid_ids = {"src_1", "src_2"}
    mock_llm_output = {
        "strengths": [
            {
                "aspect": "Visuals",
                "score": 9.0,
                "evidence": ["Stunning"],
                "source_ids": ["src_1", "src_999_hallucinated"]
            }
        ],
        "weaknesses": [
            {
                "aspect": "Pacing",
                "score": 6.0,
                "evidence": ["Slow"],
                "source_ids": ["non_existent_source"]
            }
        ]
    }

    filtered = llm_service._filter_invalid_citations(mock_llm_output, valid_ids)
    assert filtered["strengths"][0]["source_ids"] == ["src_1"], "Invalid source ID was not stripped"
    # When all IDs in weaknesses were invalid, it safely falls back to a valid source ID
    assert filtered["weaknesses"][0]["source_ids"][0] in valid_ids

def test_review_verdict_schema_validation():
    """Verify that ReviewVerdict properly serializes and validates bounds."""
    verdict = ReviewVerdict(
        title="Chainsaw Man",
        canonical_id="anilist_127230",
        media_type=MediaType.ANIME,
        release_year=2022,
        verdict="Worth Watching",
        overall_score=8.4,
        confidence=0.82,
        external_ratings={"AniList": "86%"},
        strengths=[
            AspectScore(aspect="Animation", score=9.1, sentiment="Positive", evidence=["Peak MAPPA fluid animation"], source_ids=["src_1"])
        ],
        weaknesses=[],
        audience_sentiment="Overwhelmingly Positive",
        critic_sentiment="Positive",
        disagreements=[],
        spoiler_free_summary="A thrilling and kinetic adaptation with rich character moments.",
        methodology=ScoringMethodology(
            critic_rating_mean=8.6,
            audience_rating_mean=8.8,
            sentiment_synthetic_score=8.5,
            source_count=5,
            critic_count=2,
            audience_count=2,
            community_count=1,
            diversity_multiplier=0.85,
            disagreement_penalty=0.0,
            sample_size_penalty=0.37,
            final_calibrated_score=8.4,
            confidence_estimate=0.82,
            explanation="Derived from 5 retrieved sources."
        ),
        sources=[
            SourceEvidence(
                id="src_1",
                source_name="IGN",
                url="https://ign.com",
                category=SourceCategory.CRITIC,
                excerpt="Superb visual flair",
                sentiment_score=0.85,
                confidence=0.9,
                retrieved_at="2026-10-17T00:00:00Z"
            )
        ],
        engine_used="LAYA + Groq Hybrid",
        latency_ms=450.0,
        analyzed_at="2026-10-17T00:00:00Z"
    )

    data = verdict.model_dump()
    assert data["overall_score"] == 8.4
    assert data["confidence"] == 0.82
    assert len(data["strengths"]) == 1
