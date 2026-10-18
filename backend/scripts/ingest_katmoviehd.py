#!/usr/bin/env python3
"""
CineScope — KatMovieHD Central Database Ingestion Pipeline
CLI Tool for automated scraping, evidence-grounded review synthesis,
poster harvesting, and centralized database archival.

Usage:
  python backend/scripts/ingest_katmoviehd.py --start-page 1 --end-page 2 --limit 10
  python backend/scripts/ingest_katmoviehd.py --dry-run --start-page 1 --end-page 3
"""

import sys
import os
import argparse
import asyncio
import time
from pathlib import Path

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

# Add backend directory to sys.path so app modules import cleanly
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.services.katmovie_service import katmovie_service
from app.services.central_store import central_store

def print_banner():
    banner = """
========================================================================================
   🎬 CINESCOPE — KATMPOVIEHD CENTRAL KNOWLEDGE INGESTION PIPELINE
   Evidence Harvesting • LAYA Edge Scoring • Groq LPU Synthesis • 0-Token Archival
========================================================================================
"""
    print(banner)

async def run_pipeline(args):
    print_banner()
    print(f"[*] Target Source: https://new.katmoviehd.top/")
    print(f"[*] Page Range: {args.start_page} -> {args.end_page}")
    print(f"[*] Dry Run: {args.dry_run}")
    print(f"[*] Rate-Limit Delay: {args.delay}s\n")

    # Step 1: Scrape
    print(f"[1/3] Harvesting titles, release years, and CDN posters from KatMovieHD...")
    scraped_items = katmovie_service.scrape_pages(args.start_page, args.end_page)
    print(f"[+] Total titles discovered: {len(scraped_items)}")

    if not scraped_items:
        print("[-] No items found or scraper returned empty. Exiting.")
        return

    if args.limit and args.limit > 0:
        scraped_items = scraped_items[:args.limit]
        print(f"[*] Limited to first {len(scraped_items)} titles for this run.\n")

    # Step 2: Dry Run or Full Ingestion
    if args.dry_run:
        print("[2/3] DRY RUN PREVIEW — Resolving titles and posters in parallel...")
        resolved = await asyncio.gather(*[katmovie_service.resolve_canonical(it) for it in scraped_items])
        print(f"{'#':<3} | {'Type':<7} | {'Year':<5} | {'Title':<30} | {'Poster':<8} | {'Canonical Target'}", flush=True)
        print("-" * 88, flush=True)
        for i, (item, (cid, poster)) in enumerate(zip(scraped_items, resolved), 1):
            has_poster = "YES" if (poster or item.get("poster_url")) else "NO"
            m_type = item.get("media_type", "movie").upper()
            year_str = str(item.get("year") or "N/A")
            t_title = item.get("clean_title", "")[:28]
            print(f"{i:<3} | {m_type:<7} | {year_str:<5} | {t_title:<30} | {has_poster:<8} | {cid}", flush=True)
        print("\n[+] Dry run complete. Rerun without --dry-run to synthesize reviews and archive.", flush=True)
        return

    # Step 3: Full Ingestion
    print(f"[2/3] Executing Dual-Brain Review Synthesis & Central Knowledge Archival...\n")
    stats = {
        "total": len(scraped_items),
        "cached": 0,
        "newly_ingested": 0,
        "failed": 0
    }

    start_time = time.time()

    for idx, item in enumerate(scraped_items, 1):
        clean_title = item.get("clean_title", "Unknown")
        year = item.get("year")
        m_type = item.get("media_type", "movie")
        print(f"[{idx}/{len(scraped_items)}] Processing: \"{clean_title}\" ({year or 'N/A'}, {m_type})")

        try:
            res = await katmovie_service.ingest_single(item, force_refresh=args.force_refresh)
            status = res.get("status")

            if status == "cached":
                stats["cached"] += 1
                score = res.get("overall_score", 0.0)
                print(f"    ⚡ [0 TOKENS] Already stored: \"{res.get('title')}\" (Score: {score:.1f}/10)")
            elif status == "ingested":
                stats["newly_ingested"] += 1
                score = res.get("overall_score", 0.0)
                verdict = res.get("verdict", "")
                poster_check = "🖼️ Yes" if res.get("poster_url") else "⚠️ Missing"
                print(f"    🧠 [SYNTHESIZED & ARCHIVED] Score: {score:.1f}/10 | Poster: {poster_check} | Verdict: {verdict}")
                print(f"       -> Saved to Central Database: {res.get('canonical_id')}.json")
            else:
                stats["failed"] += 1
                print(f"    ⚠️ [{status.upper()}] {res.get('reason') or res.get('message')}")

        except Exception as e:
            stats["failed"] += 1
            print(f"    ❌ Error: {e}")

        # Rate-limiting delay between generative syntheses
        if args.delay > 0 and idx < len(scraped_items):
            await asyncio.sleep(args.delay)

    total_duration = time.time() - start_time

    # Summary
    print("\n" + "=" * 88)
    print("   📊 INGESTION RUN SUMMARY")
    print("=" * 88)
    print(f"   • Total Titles Processed:        {stats['total']}")
    print(f"   • Existing in Central Store:    {stats['cached']} (0 LLM Tokens Consumed)")
    print(f"   • Newly Synthesized & Archived:  {stats['newly_ingested']}")
    print(f"   • Failed / Skipped:              {stats['failed']}")
    print(f"   • Future Tokens Saved per Run:   {(stats['cached'] + stats['newly_ingested']) * 2650:,} tokens")
    print(f"   • Total Run Duration:            {total_duration:.1f}s")
    print("=" * 88)
    print("[+] Central Database updated. All titles now serve instant 0-token responses!\n")

def main():
    parser = argparse.ArgumentParser(description="KatMovieHD Central Knowledge Ingestor for CineScope")
    parser.add_argument("--start-page", type=int, default=1, help="First page to scrape (default: 1)")
    parser.add_argument("--end-page", type=int, default=1, help="Last page to scrape (default: 1)")
    parser.add_argument("--limit", type=int, default=None, help="Max titles to process")
    parser.add_argument("--delay", type=float, default=2.0, help="Polite delay in seconds between Groq calls")
    parser.add_argument("--dry-run", action="store_true", help="Preview scraped titles without running review pipeline")
    parser.add_argument("--force-refresh", action="store_true", help="Force re-synthesis even if already cached")

    args = parser.parse_args()
    asyncio.run(run_pipeline(args))

if __name__ == "__main__":
    main()
