"""
FastAPI Server for CineScope — Local AI Movie, Anime & Series Review Intelligence.
Exposes endpoints for autocomplete search, trending feeds, discovery queries,
evidence-grounded review analysis, progressive SSE streaming, and title comparisons.
"""

import json
import time
import asyncio
import psutil
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.config import settings
from app.models.schemas import (
    TitleSearchResult,
    ReviewVerdict,
    ComparisonRequest,
    ComparisonResult,
    DiscoveryFeedItem
)
from app.services.metadata_service import metadata_service
from app.services.discovery_service import discovery_service
from app.services.review_pipeline import review_pipeline
from app.services.llm_service import llm_service
from app.services.laya_engine import laya_engine
from app.services.cache_service import cache_service
from app.services.central_store import central_store
from app.services.laya_autotrain import laya_autotrainer

app = FastAPI(
    title="CineScope Intelligence API",
    description="Evidence-based entertainment review synthesis using local LAYA inference & Groq high-speed acceleration.",
    version="1.0.0"
)

# Enable CORS for local frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    """Returns engine health, hardware telemetry, and model status."""
    vram_used = "N/A"
    try:
        import torch
        if torch.cuda.is_available():
            vram_used = f"{round(torch.cuda.memory_allocated(0) / (1024**2), 1)} MB / {round(torch.cuda.get_device_properties(0).total_memory / (1024**2), 1)} MB"
    except Exception:
        pass

    ram = psutil.virtual_memory()
    return {
        "status": "online",
        "system": {
            "ram_used_gb": round((ram.total - ram.available) / (1024**3), 2),
            "ram_total_gb": round(ram.total / (1024**3), 2),
            "ram_percent": ram.percent,
            "vram_status": vram_used
        },
        "models": {
            "laya_local_loaded": laya_engine.is_loaded,
            "laya_engine_name": "convaiinnovations/laya (ModernBERT-large RLCD)",
            "llm_synthesis_model": settings.GROQ_MODEL,
            "llm_fast_model": settings.GROQ_FAST_MODEL
        }
    }

@app.get("/api/search")
async def search_titles(q: str = Query(..., min_length=1)) -> list[TitleSearchResult]:
    """Disambiguated search across movies, anime, and series."""
    return await metadata_service.search_titles(q, limit=8)

@app.get("/api/trending")
async def get_trending(type: str = Query("all", regex="^(all|anime|series|movie)$")):
    """Real-time trending entertainment media based on live activity."""
    return await metadata_service.get_trending(media_type=type, limit=12)

@app.get("/api/shelves")
async def get_curated_shelves():
    """Returns curated category shelves with live, automatically extracted posters."""
    return await metadata_service.get_curated_shelves()

@app.get("/api/discovery")
async def discovery_search(q: str = Query(..., min_length=2)) -> DiscoveryFeedItem:
    """Interprets complex thematic queries (e.g. 'trending anime', 'best psychological thrillers')."""
    return await discovery_service.handle_discovery_query(q)

@app.get("/api/titles/{canonical_id}")
async def get_title_analysis(canonical_id: str, preliminary: bool = Query(False), refresh: bool = Query(False)) -> ReviewVerdict:
    """Retrieves full or preliminary evidence-based review verdict for a title."""
    verdict = await review_pipeline.analyze_title(canonical_id, preliminary_only=preliminary, force_refresh=refresh)
    if not verdict:
        raise HTTPException(status_code=404, detail="Title could not be resolved or analyzed.")
    return verdict

@app.get("/api/titles/{canonical_id}/stream")
async def stream_analysis(canonical_id: str):
    """
    Server-Sent Events (SSE) streaming research progress:
    Stage 1: Metadata -> Stage 2: Sources Gathered -> Stage 3: Preliminary Verdict -> Stage 4: Completed Refinement.
    """
    async def event_generator():
        async for stage in review_pipeline.stream_research_progress(canonical_id):
            yield f"data: {json.dumps(stage)}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@app.post("/api/compare")
async def compare_titles(req: ComparisonRequest) -> ComparisonResult:
    """Deep comparison between two or more titles on Story, Visuals, Characters, and Audience Reception."""
    verdict_tasks = [review_pipeline.analyze_title(cid) for cid in req.title_ids]
    raw_verdicts = await asyncio.gather(*verdict_tasks)
    verdicts = [v for v in raw_verdicts if v is not None]

    if len(verdicts) < 2:
        raise HTTPException(status_code=400, detail="At least two valid titles are required for comparison.")

    titles_data = [v.model_dump() for v in verdicts]
    comp_analysis = await llm_service.compare_titles(titles_data)

    return ComparisonResult(
        titles=verdicts,
        comparative_summary=comp_analysis.get("comparative_summary", "Comparative analysis generated."),
        aspect_comparisons=comp_analysis.get("aspect_comparisons", []),
        final_recommendation=comp_analysis.get("final_recommendation", "Both titles are strong in their genres.")
    )

@app.get("/api/knowledge/stats")
async def get_knowledge_stats():
    """Returns telemetry from the Centralized Knowledge Flywheel."""
    return central_store.get_telemetry()

@app.get("/api/knowledge/recent")
async def get_knowledge_recent(limit: int = Query(16, ge=1, le=50)):
    """Returns recently indexed and retrieved titles from the central knowledge base."""
    return central_store.get_recent_catalog(limit=limit)

@app.get("/api/laya/telemetry")
async def get_laya_telemetry():
    """Returns real-time continuous auto-training and Bayesian calibration stats for LAYA."""
    return laya_autotrainer.get_telemetry()

@app.post("/api/laya/train-pass")
async def trigger_laya_train_pass():
    """Triggers an explicit auto-training iteration on pending experience buffers."""
    laya_autotrainer._run_training_iteration()
    return laya_autotrainer.get_telemetry()

@app.get("/api/shelves/{shelf_id}/more")
async def get_shelf_more(shelf_id: str, page: int = Query(1, ge=1), limit: int = Query(8, ge=1, le=16)):
    """Dynamically loads the next page of high-rated titles for a category shelf as user slides."""
    return await metadata_service.get_shelf_more(shelf_id=shelf_id, page=page, limit=limit)

@app.get("/api/stats")
async def get_performance_stats():
    """Returns latency benchmarks, cache statistics, and resource metrics."""
    return {
        "status": "operational",
        "cache_in_memory_keys": len(cache_service.memory_cache),
        "default_search_provider": settings.DEFAULT_SEARCH_PROVIDER,
        "laya_status": "active" if laya_engine.is_loaded else "standby",
        "knowledge_store": central_store.get_telemetry(),
        "laya_autotraining": laya_autotrainer.get_telemetry()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="127.0.0.1", port=settings.PORT, reload=True)
