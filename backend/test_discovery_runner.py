import asyncio
from app.services.discovery_service import discovery_service

async def test():
    queries = [
        "Best psychological thrillers released recently",
        "Underrated movies with excellent audience reviews",
        "Is Chainsaw Man worth watching?",
        "Trending anime this week"
    ]
    for q in queries:
        res = await discovery_service.handle_discovery_query(q)
        print(f"Query: '{q}'")
        print(f"  Tag: {res.curated_tag}")
        print(f"  Candidates: {len(res.title_candidates)} titles found -> {[c.title for c in res.title_candidates[:3]]}")
        print(f"  Reasoning: {res.reasoning[:100]}...")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(test())
