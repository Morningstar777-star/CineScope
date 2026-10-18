"""
Benchmark & Performance Telemetry Script for CineScope.
Measures real hardware metrics on NVIDIA RTX 3050 Laptop GPU & Intel CPU:
- Metadata retrieval latency
- Local LAYA System 1 inference latency
- Groq structured synthesis latency
- Cache hit vs miss latency
- RAM & GPU VRAM utilization
- Evaluation on annotated review benchmark dataset
"""

import time
import json
import asyncio
import psutil
from app.services.metadata_service import metadata_service
from app.services.laya_engine import laya_engine
from app.services.llm_service import llm_service
from app.services.review_pipeline import review_pipeline
from app.services.scoring_engine import scoring_engine
from app.services.cache_service import cache_service
from app.models.schemas import SourceEvidence, SourceCategory, AspectScore

# Annotated ground truth evaluation dataset for sentiment & aspect quality
BENCHMARK_DATASET = [
    {
        "text": "The animation in Chainsaw Man is breathtaking and MAPPA delivered cinematic masterclass visuals, though pacing stumbles occasionally.",
        "true_sentiment": "positive",
        "aspect": "Animation",
        "expected_score_range": (8.5, 9.8)
    },
    {
        "text": "Completely disjointed narrative, unlikable shallow characters, and a plodding middle act that killed all momentum.",
        "true_sentiment": "negative",
        "aspect": "Story",
        "expected_score_range": (2.0, 4.5)
    },
    {
        "text": "A mixed bag with stellar musical composition and great voice acting, held back by awkward tonal shifts.",
        "true_sentiment": "mixed",
        "aspect": "Soundtrack",
        "expected_score_range": (6.0, 7.5)
    },
    {
        "text": "Cillian Murphy's restrained performance captures historical devastation, backed by relentless sonic direction and stunning tension.",
        "true_sentiment": "positive",
        "aspect": "Characters",
        "expected_score_range": (8.5, 9.8)
    },
    {
        "text": "Uninspired generic plotline that relies heavily on genre clichés and lackluster action sequences.",
        "true_sentiment": "negative",
        "aspect": "Plot",
        "expected_score_range": (2.5, 4.5)
    }
]

async def run_full_benchmark():
    print("=" * 75)
    print(" CINESCOPE HARDWARE & PIPELINE PERFORMANCE BENCHMARK")
    print("=" * 75)

    # 1. System Telemetry
    ram = psutil.virtual_memory()
    print(f"\n[1. Hardware Environment]")
    print(f"System RAM: {ram.total / (1024**3):.2f} GB total | {ram.available / (1024**3):.2f} GB available")
    
    vram_str = "N/A"
    try:
        import torch
        if torch.cuda.is_available():
            vram_alloc = torch.cuda.memory_allocated(0) / (1024**2)
            vram_total = torch.cuda.get_device_properties(0).total_memory / (1024**2)
            vram_str = f"{vram_alloc:.1f} MB allocated / {vram_total:.1f} MB total ({torch.cuda.get_device_name(0)})"
    except Exception as e:
        vram_str = str(e)
    print(f"GPU VRAM:   {vram_str}")

    # 2. Local LAYA Benchmark on Annotated Dataset
    print(f"\n[2. Local LAYA Model Evaluation (Annotated Ground Truth)]")
    correct_sentiments = 0
    laya_latencies = []

    for idx, item in enumerate(BENCHMARK_DATASET, 1):
        t0 = time.perf_counter()
        res = laya_engine.classify_review_sentiment(item["text"])
        lat = (time.perf_counter() - t0) * 1000
        laya_latencies.append(lat)

        pred_sent = res.get("sentiment", "").lower()
        is_correct = (pred_sent == item["true_sentiment"])
        if is_correct:
            correct_sentiments += 1

        print(f"  Sample {idx}: True={item['true_sentiment']} | Pred={pred_sent} ({lat:.1f}ms) -> {'[PASS]' if is_correct else '[FAIL]'}")

    accuracy = (correct_sentiments / len(BENCHMARK_DATASET)) * 100
    avg_laya_lat = sum(laya_latencies) / len(laya_latencies)
    print(f"  -> LAYA Accuracy: {accuracy:.1f}%")
    print(f"  -> Mean LAYA Inference Latency: {avg_laya_lat:.2f} ms")

    # 3. Search & Metadata Resolution Latency
    print(f"\n[3. Search & Metadata Resolution Latency]")
    t0 = time.perf_counter()
    candidates = await metadata_service.search_titles("Chainsaw Man", limit=5)
    search_lat = (time.perf_counter() - t0) * 1000
    print(f"  Resolved {len(candidates)} candidates in {search_lat:.1f} ms")

    # 4. End-to-End Pipeline Latency (First run = Cache Miss)
    print(f"\n[4. End-to-End Pipeline Latency (Cold Cache Miss)]")
    test_id = candidates[0].id if candidates else "anilist_127230"
    
    t0 = time.perf_counter()
    verdict_cold = await review_pipeline.analyze_title(test_id)
    cold_lat = (time.perf_counter() - t0) * 1000
    print(f"  Title: {verdict_cold.title}")
    print(f"  Overall Calibrated Score: {verdict_cold.overall_score}/10 (Confidence: {int(verdict_cold.confidence*100)}%)")
    print(f"  Verdict: {verdict_cold.verdict}")
    print(f"  Sources Retrieved: {len(verdict_cold.sources)}")
    print(f"  Total Cold Latency: {cold_lat:.1f} ms")

    # 5. Pipeline Latency on Warm Cache Hit
    print(f"\n[5. Pipeline Latency (Warm Cache Hit)]")
    t0 = time.perf_counter()
    verdict_warm = await review_pipeline.analyze_title(test_id)
    warm_lat = (time.perf_counter() - t0) * 1000
    print(f"  Total Warm Latency: {warm_lat:.2f} ms (Speedup: {cold_lat / max(0.1, warm_lat):.1f}x)")

    # 6. Groq Synthesis Latency
    print(f"\n[6. Groq Structured JSON Synthesis Latency]")
    t0 = time.perf_counter()
    sample_sources = verdict_cold.sources[:3]
    synthesis = await llm_service.synthesize_review_verdict("Chainsaw Man", "anime", "Synopsis", sample_sources, fast_mode=True)
    groq_lat = (time.perf_counter() - t0) * 1000
    print(f"  Synthesized structured verdict in {groq_lat:.1f} ms using {synthesis.get('model_used')}")

    # Summary Report
    print("\n" + "=" * 75)
    print(" BENCHMARK PERFORMANCE REPORT SUMMARY")
    print("=" * 75)
    print(f" - System: Windows 11 | RTX 3050 Laptop GPU (CUDA 12.7) | 16 GB RAM")
    print(f" - Local Model: {laya_engine.agent.__class__.__name__ if laya_engine.agent else 'LAYA Engine'} (ModernBERT-large)")
    print(f" - LAYA Inference Latency:   {avg_laya_lat:.1f} ms")
    print(f" - Search & Metadata Latency: {search_lat:.1f} ms")
    print(f" - Groq Synthesis Latency:    {groq_lat:.1f} ms")
    print(f" - Cold Pipeline Latency:     {cold_lat:.1f} ms")
    print(f" - Warm Cache Hit Latency:    {warm_lat:.2f} ms")
    print("=" * 75)

if __name__ == "__main__":
    asyncio.run(run_full_benchmark())
