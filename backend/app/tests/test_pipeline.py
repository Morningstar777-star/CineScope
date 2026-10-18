"""
Integration tests for CineScope metadata and review research pipeline.
"""

import pytest
import asyncio
from app.services.metadata_service import metadata_service
from app.services.review_pipeline import review_pipeline

@pytest.mark.asyncio
async def test_metadata_search_chainsaw_man():
    """Verify search properly resolves Chainsaw Man and differentiates anime/manga."""
    results = await metadata_service.search_titles("Chainsaw Man", limit=5)
    assert len(results) > 0
    first = results[0]
    assert "chainsaw man" in first.title.lower()
    assert first.media_type.value in ("anime", "movie")
    assert first.poster_url is not None

@pytest.mark.asyncio
async def test_trending_titles_retrieval():
    """Verify live trending titles return populated media with scores."""
    trending = await metadata_service.get_trending(media_type="anime", limit=4)
    assert len(trending) >= 2
    for t in trending:
        assert t.title != ""
        assert t.id.startswith("anilist_")

@pytest.mark.asyncio
async def test_end_to_end_analysis_chainsaw_man():
    """Verify full end-to-end evidence gathering and structured verdict."""
    results = await metadata_service.search_titles("Chainsaw Man", limit=1)
    assert len(results) > 0
    canonical_id = results[0].id

    verdict = await review_pipeline.analyze_title(canonical_id)
    assert verdict is not None
    assert verdict.title != ""
    assert 1.0 <= verdict.overall_score <= 10.0
    assert 0.0 <= verdict.confidence <= 1.0
    assert len(verdict.sources) > 0
    assert verdict.spoiler_free_summary != ""
    assert len(verdict.strengths) > 0
    # Every strength must have source IDs that match sources
    all_source_ids = {s.id for s in verdict.sources}
    for st in verdict.strengths:
        for sid in st.source_ids:
            assert sid in all_source_ids, f"Grounded citation check failed: {sid} not in sources"
