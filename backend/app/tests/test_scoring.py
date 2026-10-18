"""
Unit tests for CineScope Defensible Scoring Engine.
Verifies Bayesian shrinkage, polarization penalty, source diversity weighting,
and confidence calibration.
"""

import pytest
from app.models.schemas import SourceEvidence, AspectScore, SourceCategory
from app.services.scoring_engine import scoring_engine

def test_sparse_evidence_shrinkage():
    """Verify that a single source title does not get an artificially confident or extreme score."""
    single_source = [
        SourceEvidence(
            id="src_1",
            source_name="Random Blog",
            url="https://example.com",
            category=SourceCategory.DISCUSSION,
            excerpt="This was the best show ever created!",
            sentiment_score=0.9,
            confidence=0.7,
            retrieved_at="2026-10-17T00:00:00Z"
        )
    ]
    aspects = [
        AspectScore(aspect="Story", score=9.5, sentiment="Positive", evidence=["Great"], source_ids=["src_1"])
    ]

    score, confidence, methodology = scoring_engine.calculate_score(
        sources=single_source,
        aspects=aspects,
        external_critic_score=None,
        external_audience_score=None
    )

    # With only 1 source, shrinkage towards prior (6.5) must occur
    assert score < 9.5, "Single source extreme score should be shrunk towards prior mean"
    assert confidence <= 0.40, "Confidence with single source must be low"
    assert methodology.sample_size_penalty > 0.5

def test_diverse_evidence_high_confidence():
    """Verify that multiple diverse sources yield high calibrated confidence."""
    sources = [
        SourceEvidence(id=f"src_{i}", source_name=f"Critic {i}", url="https://example.com",
                       category=cat, excerpt="Phenomenal execution.", sentiment_score=0.85,
                       confidence=0.9, retrieved_at="2026-10-17T00:00:00Z")
        for i, cat in enumerate([SourceCategory.CRITIC, SourceCategory.AUDIENCE, SourceCategory.COMMUNITY, SourceCategory.SPECIALIST])
    ]
    aspects = [
        AspectScore(aspect="Animation", score=9.0, sentiment="Positive", evidence=["Flawless"], source_ids=["src_0"]),
        AspectScore(aspect="Story", score=8.8, sentiment="Positive", evidence=["Compelling"], source_ids=["src_1"])
    ]

    score, confidence, methodology = scoring_engine.calculate_score(
        sources=sources,
        aspects=aspects,
        external_critic_score=8.7,
        external_audience_score=9.1
    )

    assert 8.5 <= score <= 9.3
    assert confidence >= 0.50
    assert methodology.disagreement_penalty == 0.0

def test_critic_audience_polarization_penalty():
    """Verify that when critics and audience heavily disagree, a disagreement penalty is applied."""
    sources = [
        SourceEvidence(id="src_1", source_name="Critic", url="https://example.com", category=SourceCategory.CRITIC,
                       excerpt="Pretentious and dull.", sentiment_score=-0.7, confidence=0.8, retrieved_at="2026-10-17T00:00:00Z"),
        SourceEvidence(id="src_2", source_name="Audience", url="https://example.com", category=SourceCategory.AUDIENCE,
                       excerpt="Fun popcorn entertainment!", sentiment_score=0.8, confidence=0.8, retrieved_at="2026-10-17T00:00:00Z")
    ]
    aspects = [
        AspectScore(aspect="Entertainment", score=7.0, sentiment="Mixed", evidence=["Fun but flawed"], source_ids=["src_1", "src_2"])
    ]

    # Critic: 3.5, Audience: 8.8 (huge 5.3 point divergence)
    score, confidence, methodology = scoring_engine.calculate_score(
        sources=sources,
        aspects=aspects,
        external_critic_score=3.5,
        external_audience_score=8.8
    )

    assert methodology.disagreement_penalty > 0.1
    assert confidence < 0.60
