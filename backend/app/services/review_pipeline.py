"""
Review Pipeline Orchestrator for CineScope.
Coordinates two-stage intelligence architecture:
Stage A: Disambiguation, asynchronous web research, source deduplication, metadata.
Stage B: Local LAYA aspect classification, calibrated Bayesian scoring, and Groq JSON synthesis.
Supports staged progressive execution (immediate metadata -> preliminary verdict -> final analysis).
"""

import time
import datetime
from typing import Dict, Any, Optional, AsyncGenerator
from app.models.schemas import ReviewVerdict, AspectScore, MediaType
from app.services.metadata_service import metadata_service
from app.services.research_service import research_service
from app.services.scoring_engine import scoring_engine
from app.services.llm_service import llm_service
from app.services.cache_service import cache_service
from app.services.central_store import central_store
from app.services.laya_autotrain import laya_autotrainer

class ReviewPipeline:
    def __init__(self):
        pass

    async def analyze_title(
        self,
        canonical_id: str,
        preliminary_only: bool = False,
        force_refresh: bool = False
    ) -> Optional[ReviewVerdict]:
        """
        Executes end-to-end evidence gathering and structured review synthesis.
        Integrates Central Knowledge Store for instant 0-token hits.
        """
        if force_refresh:
            cache_service.delete(f"%{canonical_id}%")

        # 0. Check Central Knowledge Store (0 LLM Tokens Consumed)
        if not force_refresh and not preliminary_only:
            central_hit = central_store.get(canonical_id)
            if central_hit:
                return ReviewVerdict(**central_hit)

        cache_key = f"verdict_{canonical_id}_{'prelim' if preliminary_only else 'full'}"
        if not force_refresh:
            cached = cache_service.get(cache_key)
            if cached:
                return ReviewVerdict(**cached)

        t_start = time.perf_counter()

        # 1. Resolve Title Metadata
        details = await metadata_service.get_title_details(canonical_id)
        if not details:
            return None

        title = details["title"]
        media_type = details.get("media_type", "movie")
        overview = details.get("overview", "")
        ext_score = details.get("external_score")

        # 2. Gather Evidence Sources
        sources = await research_service.gather_evidence(title, media_type, details, force_refresh=force_refresh)
        
        # If preliminary mode, evaluate on first 2-3 sources
        active_sources = sources[:3] if preliminary_only else sources

        # 3. Synthesize Review Verdict via LLM
        synthesis = await llm_service.synthesize_review_verdict(
            title=title,
            media_type=media_type,
            overview=overview,
            sources=active_sources,
            fast_mode=preliminary_only
        )

        # 4. Formulate Aspect Scores
        raw_strengths = synthesis.get("strengths", [])
        raw_weaknesses = synthesis.get("weaknesses", [])
        
        aspects = []
        for s in raw_strengths:
            aspects.append(AspectScore(**s))
        for w in raw_weaknesses:
            aspects.append(AspectScore(**w))

        # 5. Calculate Defensible Calibrated Rating
        critic_score = details.get("external_critic_score") or ext_score
        audience_score = details.get("external_audience_score") or ext_score
        overall_score, confidence, methodology = scoring_engine.calculate_score(
            sources=active_sources,
            aspects=aspects,
            external_critic_score=critic_score,
            external_audience_score=audience_score
        )

        # 6. Align Verdict with Calibrated Evidence Score
        raw_verdict = synthesis.get("verdict", "")
        ext_ratings = details.get("external_ratings", {})
        is_universal_acclaim = False
        rt_str = str(ext_ratings.get("Rotten Tomatoes", ""))
        if "%" in rt_str:
            try:
                rt_val = float(rt_str.replace("%", "").strip())
                if rt_val >= 95.0 and (audience_score or 0) >= 8.0:
                    is_universal_acclaim = True
            except ValueError:
                pass

        if overall_score >= 8.7 or (is_universal_acclaim and overall_score >= 8.5):
            final_verdict = "Masterpiece / Must-Watch"
        elif overall_score >= 7.8:
            final_verdict = "Highly Recommended / Acclaimed"
        elif overall_score >= 7.0:
            final_verdict = "Worth Watching"
        elif overall_score >= 6.0:
            final_verdict = "Decent / Mixed Appeal"
        else:
            final_verdict = "Proceed with Caution / Flawed"

        # If LLM predicted a thoughtful acclaim verdict and score aligns, preserve it
        if raw_verdict and any(k in raw_verdict for k in ["Masterpiece", "Acclaimed", "Must-Watch"]) and overall_score >= 8.0:
            final_verdict = raw_verdict

        # 7. Check for sister adaptations / disambiguation options
        disambiguation = []
        try:
            candidates = await metadata_service.search_titles(title, limit=5)
            for c in candidates:
                if c.id != canonical_id:
                    disambiguation.append({
                        "id": c.id,
                        "title": c.title,
                        "media_type": c.media_type.value,
                        "release_year": c.release_year,
                        "poster_url": c.poster_url
                    })
        except Exception:
            pass

        # 8. Build ReviewVerdict Model
        total_latency_ms = int((time.perf_counter() - t_start) * 1000)
        verdict = ReviewVerdict(
            title=title,
            canonical_id=canonical_id,
            media_type=MediaType(media_type) if media_type in MediaType._value2member_map_ else MediaType.MOVIE,
            release_year=details.get("release_year"),
            poster_url=details.get("poster_url"),
            backdrop_url=details.get("backdrop_url"),
            genres=details.get("genres", []),
            overview=overview,
            verdict=final_verdict,
            overall_score=overall_score,
            confidence=confidence,
            data_scale=details.get("data_scale"),
            external_critic_score=critic_score,
            external_audience_score=audience_score,
            external_ratings=details.get("external_ratings", {}),
            strengths=[AspectScore(**s) for s in raw_strengths],
            weaknesses=[AspectScore(**w) for w in raw_weaknesses],
            audience_sentiment=synthesis.get("audience_sentiment", "Positive"),
            critic_sentiment=synthesis.get("critic_sentiment", "Positive"),
            disagreements=synthesis.get("disagreements", []),
            spoiler_free_summary=synthesis.get("spoiler_free_summary", overview),
            methodology=methodology,
            sources=active_sources,
            is_preliminary=preliminary_only,
            engine_used=synthesis.get("model_used", "LAYA + Groq Hybrid"),
            disambiguation_options=disambiguation,
            latency_ms=total_latency_ms,
            analyzed_at=datetime.datetime.now(datetime.timezone.utc).isoformat()
        )

        verdict_dict = verdict.model_dump()
        if not preliminary_only:
            central_store.save(canonical_id, verdict_dict)
            try:
                laya_autotrainer.record_experience(
                    canonical_id=canonical_id,
                    media_type=media_type,
                    predicted_score=overall_score,
                    ground_truth_score=critic_score or audience_score or overall_score,
                    aspects=[a.model_dump() for a in verdict.strengths + verdict.weaknesses],
                    critic_sentiment=verdict.critic_sentiment,
                    sources_count=len(active_sources)
                )
            except Exception as e:
                print(f"[ReviewPipeline] LAYA auto-trainer record error: {e}")

        cache_service.set(cache_key, verdict_dict, ttl_seconds=3600*12)
        return verdict

    async def stream_research_progress(self, canonical_id: str) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Yields progressive research stages for real-time frontend streaming.
        Stage 1: Resolved Metadata & Baseline Ratings
        Stage 2: Retrieved Sources & Categories Count
        Stage 3: Preliminary Assessment
        Stage 4: Completed Refined Analysis
        """
        # Fast path: If already in Central Knowledge Store, stream immediately (0 tokens consumed)
        central_hit = central_store.get(canonical_id)
        if central_hit:
            yield {
                "step": "metadata_resolved",
                "title": central_hit.get("title", ""),
                "poster_url": central_hit.get("poster_url"),
                "external_score": central_hit.get("external_critic_score") or central_hit.get("overall_score"),
                "external_ratings": central_hit.get("external_ratings", {}),
                "progress": 35
            }
            yield {
                "step": "sources_gathered",
                "source_count": len(central_hit.get("sources", [])),
                "categories": ["central_archive", "critic_consensus", "audience_debate"],
                "progress": 75
            }
            yield {
                "step": "complete",
                "verdict": central_hit.get("verdict"),
                "score": central_hit.get("overall_score"),
                "confidence": central_hit.get("confidence"),
                "data": central_hit,
                "progress": 100
            }
            return

        # Stage 1: Metadata
        details = await metadata_service.get_title_details(canonical_id)
        if not details:
            yield {"step": "error", "message": f"Title '{canonical_id}' could not be resolved."}
            return

        yield {
            "step": "metadata_resolved",
            "title": details["title"],
            "poster_url": details.get("poster_url"),
            "external_score": details.get("external_score"),
            "external_ratings": details.get("external_ratings", {}),
            "progress": 25
        }

        # Stage 2: Evidence Gathering
        sources = await research_service.gather_evidence(details["title"], details.get("media_type", "movie"), details)
        yield {
            "step": "sources_gathered",
            "source_count": len(sources),
            "categories": list(set(s.category.value for s in sources)),
            "progress": 55
        }

        # Stage 3: Preliminary Verdict
        preliminary = await self.analyze_title(canonical_id, preliminary_only=True)
        if preliminary:
            yield {
                "step": "preliminary_verdict",
                "verdict": preliminary.verdict,
                "score": preliminary.overall_score,
                "confidence": preliminary.confidence,
                "data": preliminary.model_dump(),
                "progress": 80
            }

        # Stage 4: Completed Analysis
        completed = await self.analyze_title(canonical_id, preliminary_only=False)
        if completed:
            yield {
                "step": "complete",
                "verdict": completed.verdict,
                "score": completed.overall_score,
                "confidence": completed.confidence,
                "data": completed.model_dump(),
                "progress": 100
            }

review_pipeline = ReviewPipeline()
