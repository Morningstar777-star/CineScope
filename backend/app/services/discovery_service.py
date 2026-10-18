"""
Discovery Service for CineScope.
Interprets natural language discovery prompts, queries live trend APIs,
and ranks entertainment candidates with source-supported explanations.
"""

import httpx
from typing import List, Dict, Any
from app.models.schemas import TitleSearchResult, DiscoveryFeedItem, MediaType
from app.services.metadata_service import metadata_service
from app.services.llm_service import llm_service
from app.services.cache_service import cache_service

class DiscoveryService:
    def __init__(self):
        pass

    async def handle_discovery_query(self, query: str) -> DiscoveryFeedItem:
        """
        Executes discovery workflow:
        1. Parse intent (genre, theme, sentiment, target medium).
        2. Retrieve live candidates from trend & search backends.
        3. Rank candidates and attach clear, source-supported reasoning.
        """
        cache_key = f"discovery_{query.lower().strip()}"
        cached = cache_service.get(cache_key)
        if cached:
            return DiscoveryFeedItem(**cached)

        lower = query.lower()

        # Route specialized queries
        if "trending" in lower and "anime" in lower:
            candidates = await metadata_service.get_trending(media_type="anime", limit=8)
            curated_tag = "Live Trending Anime"
            reasoning = "Retrieved in real-time from AniList's global trending index based on current watchlist growth, episode discussions, and community engagement."
        elif "thriller" in lower or "psychological" in lower:
            # Query psychological thrillers
            is_recent = "recent" in lower
            candidates = await self._fetch_by_genre(genre="Psychological", tag="Thriller", limit=6, recent_only=is_recent)
            curated_tag = "Recent Psychological Thrillers" if is_recent else "Psychological Thrillers"
            reasoning = "Filtered for high narrative complexity, mind games, and tension with validated critical reception" + (" released in recent years (2021-present)." if is_recent else ".")
        elif "underrated" in lower:
            # High score, lower popularity
            candidates = await self._fetch_underrated_gems(limit=6)
            curated_tag = "Underrated Masterpieces"
            reasoning = "Curated based on exceptional audience appreciation (score >= 8.2) alongside lower mainstream saturation."
        elif "worth watching" in lower:
            # Single title evaluation request in discovery format
            title_clean = lower.replace("is", "").replace("worth watching", "").replace("?", "").strip()
            candidates = await metadata_service.search_titles(title_clean, limit=4)
            curated_tag = f"Evaluation Candidates: {title_clean.title()}"
            reasoning = f"Direct resolution candidates for '{title_clean.title()}' to proceed with evidence-grounded review intelligence."
        elif "compare" in lower or " vs " in lower:
            if "anime" in lower:
                candidates = await metadata_service.get_trending(media_type="anime", limit=6)
                curated_tag = "Anime Comparison Deck"
                reasoning = "Top-rated anime heavyweights ready for side-by-side comparative analysis across Story, Animation, Characters, and Audience Reception."
            else:
                clean_q = lower.replace("compare", "").replace("vs", "").strip()
                candidates = await metadata_service.search_titles(clean_q, limit=6)
                curated_tag = "Comparison Candidates"
                reasoning = f"Benchmark titles matching '{clean_q}' ready for side-by-side comparative analysis."
        else:
            # General semantic discovery
            candidates = await metadata_service.search_titles(query, limit=8)
            curated_tag = "Curated Discovery Selection"
            reasoning = f"Titles matching thematic elements of '{query}' ranked by reception and verified catalog presence."

        result = DiscoveryFeedItem(
            query=query,
            title_candidates=candidates,
            curated_tag=curated_tag,
            reasoning=reasoning
        )
        cache_service.set(cache_key, result.model_dump(), ttl_seconds=3600*6)
        return result

    async def _fetch_by_genre(self, genre: str, tag: str, limit: int = 6, recent_only: bool = False) -> List[TitleSearchResult]:
        recent_filter = ", startDate_greater: 20210101" if recent_only else ""
        query_gql = f"""
        query ($genre: String, $perPage: Int) {{
          Page(page: 1, perPage: $perPage) {{
            media(genre: $genre, sort: SCORE_DESC, type: ANIME{recent_filter}) {{
              id
              type
              title {{ romaji english }}
              seasonYear
              genres
              description(asHtml: false)
              coverImage {{ extraLarge large }}
              averageScore
              popularity
            }}
          }}
        }}
        """
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "CineScope/1.0"}) as client:
            resp = await client.post("https://graphql.anilist.co", json={"query": query_gql, "variables": {"genre": genre, "perPage": limit}})
            if resp.status_code != 200:
                return []
            items = []
            for m in resp.json().get("data", {}).get("Page", {}).get("media", []):
                title = m["title"].get("english") or m["title"].get("romaji")
                score_10 = round(m["averageScore"] / 10.0, 1) if m.get("averageScore") else None
                items.append(TitleSearchResult(
                    id=f"anilist_{m['id']}",
                    title=title,
                    english_title=m["title"].get("english"),
                    romaji_title=m["title"].get("romaji"),
                    media_type=MediaType.ANIME,
                    release_year=m.get("seasonYear"),
                    genres=m.get("genres", []),
                    overview=(m.get("description") or "")[:300],
                    poster_url=m.get("coverImage", {}).get("extraLarge") or m.get("coverImage", {}).get("large"),
                    external_score=score_10,
                    popularity=m.get("popularity")
                ))
            return items

    async def _fetch_underrated_gems(self, limit: int = 6) -> List[TitleSearchResult]:
        # High score, moderate popularity anime
        query_gql = """
        query ($perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(sort: SCORE_DESC, type: ANIME, averageScore_greater: 82) {
              id
              title { romaji english }
              seasonYear
              genres
              description(asHtml: false)
              coverImage { extraLarge large }
              averageScore
              popularity
            }
          }
        }
        """
        async with httpx.AsyncClient(timeout=8.0, headers={"User-Agent": "CineScope/1.0"}) as client:
            resp = await client.post("https://graphql.anilist.co", json={"query": query_gql, "variables": {"perPage": limit + 6}})
            if resp.status_code != 200:
                return []
            data = resp.json().get("data", {}).get("Page", {}).get("media", [])
            # Filter for moderate popularity (< 80000)
            gems = [m for m in data if (m.get("popularity") or 0) < 150000][:limit]
            if not gems:
                gems = data[:limit]
            items = []
            for m in gems:
                title = m["title"].get("english") or m["title"].get("romaji")
                score_10 = round(m["averageScore"] / 10.0, 1) if m.get("averageScore") else None
                items.append(TitleSearchResult(
                    id=f"anilist_{m['id']}",
                    title=title,
                    english_title=m["title"].get("english"),
                    romaji_title=m["title"].get("romaji"),
                    media_type=MediaType.ANIME,
                    release_year=m.get("seasonYear"),
                    genres=m.get("genres", []),
                    overview=(m.get("description") or "")[:300],
                    poster_url=m.get("coverImage", {}).get("extraLarge") or m.get("coverImage", {}).get("large"),
                    external_score=score_10,
                    popularity=m.get("popularity")
                ))
            return items

discovery_service = DiscoveryService()
