import sys
sys.path.insert(0, "C:/Users/Yash/Desktop/CineScope/backend")
import asyncio
from app.services.metadata_service import metadata_service
from app.services.research_service import research_service

async def main():
    details = await metadata_service.get_title_details("anilist_171627")
    print("Initial details critic score:", details.get("external_critic_score"))
    print("Initial details audience score:", details.get("external_audience_score"))
    sources = await research_service.gather_evidence(details["title"], "anime", details)
    print("After research details critic score:", details.get("external_critic_score"))
    print("After research details audience score:", details.get("external_audience_score"))
    print("Sources count:", len(sources))
    for s in sources:
        if s.original_rating:
            print(f" - {s.source_name}: {s.original_rating} (sentiment: {s.sentiment_score})")

asyncio.run(main())
