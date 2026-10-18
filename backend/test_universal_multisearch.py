import asyncio
from app.services.metadata_service import metadata_service

async def test():
    test_queries = [
        "The Substance",
        "Squid Game",
        "Dune",
        "RRR",
        "Past Lives",
        "Chainsaw Man",
        "Breaking Bad"
    ]
    for q in test_queries:
        results = await metadata_service.search_titles(q, limit=3)
        print(f"=== Search: '{q}' ===")
        for r in results:
            print(f"  [{r.media_type.value.upper()}] {r.title} ({r.release_year}) -> {r.id} | Poster: {bool(r.poster_url)}")

if __name__ == "__main__":
    asyncio.run(test())
