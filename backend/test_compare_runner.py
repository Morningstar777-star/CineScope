import asyncio
from app.services.review_pipeline import review_pipeline
from app.services.llm_service import llm_service
from app.models.schemas import ComparisonResult

async def test_comparison():
    print("Fetching verdicts for Chainsaw Man & Jujutsu Kaisen...")
    csm = await review_pipeline.analyze_title("anilist_127230")
    # Search JJK
    from app.services.metadata_service import metadata_service
    jjk_search = await metadata_service.search_titles("Jujutsu Kaisen", limit=1)
    jjk_id = jjk_search[0].id
    print(f"Comparing CSM ({csm.canonical_id}) vs JJK ({jjk_id})...")
    jjk = await review_pipeline.analyze_title(jjk_id)

    comp = await llm_service.compare_titles([csm.model_dump(), jjk.model_dump()])
    print("\n--- COMPARATIVE SUMMARY ---")
    print(comp.get("comparative_summary"))
    print("\n--- ASPECT BREAKDOWNS ---")
    for a in comp.get("aspect_comparisons", []):
        print(f"Aspect: {a.get('aspect')} | Winner: {a.get('winner_title')} | Scores: {a.get('score_comparison')}")
        print(f"  Analysis: {a.get('analysis')}")
    print("\n--- FINAL RECOMMENDATION ---")
    print(comp.get("final_recommendation"))

if __name__ == "__main__":
    asyncio.run(test_comparison())
