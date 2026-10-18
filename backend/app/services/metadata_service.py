"""
Metadata Service for CineScope.
Fetches canonical title metadata, posters, genres, and external ratings
from AniList GraphQL, TVMaze API, and Wikipedia REST.
"""

import asyncio
import httpx
import re
from typing import List, Optional, Dict, Any
from app.models.schemas import TitleSearchResult, MediaType
from app.services.cache_service import cache_service

class MetadataService:
    def __init__(self):
        self.headers = {"User-Agent": "CineScope/1.0 (contact@cinescope.local; https://cinescope.local)"}

    async def search_titles(self, query: str, limit: int = 8) -> List[TitleSearchResult]:
        """
        Searches across TVMaze, Wikipedia Universal Entertainment, and AniList
        to return rich, high-accuracy entertainment candidates worldwide.
        """
        normalized_query = query.strip().lower()
        cache_key = f"search_meta_{normalized_query}_{limit}"
        cached = cache_service.get(cache_key)
        if cached:
            return [TitleSearchResult(**item) for item in cached]

        results: List[TitleSearchResult] = []

        # 1. Search Universal Movies, Series, K-Dramas & Documentaries (Wikipedia Worldwide Engine)
        try:
            wiki_items = await self._search_wikipedia(query, limit=5)
            results.extend(wiki_items)
        except Exception as e:
            print(f"[MetadataService] Wikipedia search error: {e}")

        # 2. Search AniList (Anime & Japanese Animation)
        try:
            anilist_items = await self._search_anilist(query, limit=5)
            results.extend(anilist_items)
        except Exception as e:
            print(f"[MetadataService] AniList search error: {e}")

        # 3. Search Global TV & Shows (TVMaze)
        try:
            tvmaze_items = await self._search_tvmaze(query, limit=4)
            results.extend(tvmaze_items)
        except Exception as e:
            print(f"[MetadataService] TVMaze search error: {e}")

        # Deduplicate results by normalized base title and media type
        seen_keys = set()
        deduped: List[TitleSearchResult] = []
        for r in results:
            clean_r_title = re.sub(r'\s*\([^)]*\)$', '', r.title).strip().lower()
            key = (clean_r_title, r.media_type)
            if key not in seen_keys:
                seen_keys.add(key)
                deduped.append(r)

        # Prominence & Relevance Ranking
        clean_q = re.sub(r'[^a-zA-Z0-9]', '', query.lower())

        def relevance_key(r: TitleSearchResult):
            clean_title = re.sub(r'\s*\([^)]*\)$', '', r.title)
            name = re.sub(r'[^a-zA-Z0-9]', '', clean_title.lower())

            # Prominence boost if title has a poster and release year
            has_poster_bonus = 25 if r.poster_url else 0
            has_year_bonus = 15 if r.release_year else 0

            # Normalized popularity
            raw_pop = r.popularity or 0
            if r.id.startswith("anilist_"):
                # AniList member counts scaled (50k members -> 50 points)
                pop_score = min(raw_pop / 1000.0, 100)
            elif r.id.startswith("tvmaze_"):
                pop_score = raw_pop
            elif r.id.startswith("wiki_"):
                pop_score = 75 + min(raw_pop / 200.0, 25)
            else:
                pop_score = 50

            total_prominence = pop_score + has_poster_bonus + has_year_bonus

            if name == clean_q:
                return (0, -total_prominence)
            if name.startswith(clean_q):
                return (1, -total_prominence)
            if clean_q in name:
                return (2, -total_prominence)
            return (3, -total_prominence)

        deduped.sort(key=relevance_key)

        final_results = deduped[:limit]
        if final_results:
            cache_service.set(cache_key, [r.model_dump() for r in final_results], ttl_seconds=3600*12)
        return final_results

    async def get_title_details(self, canonical_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieves in-depth metadata, synopses, and external scores for a canonical ID.
        IDs are prefixed, e.g. 'anilist_127230' or 'tvmaze_216' or 'wiki_Oppenheimer_(film)'.
        """
        cache_key = f"details_{canonical_id}"
        cached = cache_service.get(cache_key)
        if cached:
            return cached

        if canonical_id.startswith("anilist_"):
            anime_id = int(canonical_id.split("_")[1])
            data = await self._get_anilist_details(anime_id)
        elif canonical_id.startswith("tvmaze_"):
            show_id = int(canonical_id.split("_")[1])
            data = await self._get_tvmaze_details(show_id)
            if not data:
                # TVMaze timeout or offline fallback to universal Wikipedia
                show_query = canonical_id.replace("tvmaze_", "")
                wiki_candidates = await self._search_wikipedia(show_query, limit=1)
                if wiki_candidates:
                    data = await self._get_wikipedia_details(wiki_candidates[0].id.replace("wiki_", ""))
        elif canonical_id.startswith("wiki_"):
            wiki_title = canonical_id[5:]
            data = await self._get_wikipedia_details(wiki_title)
        else:
            # Fallback search
            candidates = await self.search_titles(canonical_id, limit=1)
            if candidates:
                return await self.get_title_details(candidates[0].id)
            return None

        if data:
            cache_service.set(cache_key, data, ttl_seconds=3600*24)
        return data

    async def get_trending(self, media_type: str = "all", limit: int = 12) -> List[TitleSearchResult]:
        """
        Fetches true real-time trending titles.
        """
        cache_key = f"trending_{media_type}_{limit}"
        cached = cache_service.get(cache_key)
        if cached:
            return [TitleSearchResult(**item) for item in cached]

        results = []
        if media_type in ("anime", "all"):
            try:
                anime_trending = await self._get_trending_anilist(limit=limit if media_type == "anime" else limit // 2)
                results.extend(anime_trending)
            except Exception as e:
                print(f"[MetadataService] AniList trending error: {e}")

        if media_type in ("series", "movie", "all"):
            try:
                series_trending = await self._get_popular_shows(limit=limit if media_type != "all" else limit // 2)
                results.extend(series_trending)
            except Exception as e:
                print(f"[MetadataService] TVMaze trending error: {e}")

        cache_service.set(cache_key, [r.model_dump() for r in results], ttl_seconds=3600*6)
        return results

    # --- Internal Handlers ---

    async def _search_anilist(self, query: str, limit: int = 5) -> List[TitleSearchResult]:
        query_gql = """
        query ($search: String, $perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(search: $search, sort: POPULARITY_DESC) {
              id
              type
              format
              title {
                romaji
                english
                native
              }
              seasonYear
              startDate { year }
              genres
              description(asHtml: false)
              coverImage {
                extraLarge
                large
              }
              bannerImage
              averageScore
              popularity
            }
          }
        }
        """
        async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
            resp = await client.post("https://graphql.anilist.co", json={"query": query_gql, "variables": {"search": query, "perPage": limit}})
            if resp.status_code != 200:
                return []
            data = resp.json().get("data", {}).get("Page", {}).get("media", [])
            items = []
            for m in data:
                m_type = MediaType.ANIME if m.get("type") == "ANIME" else MediaType.MOVIE
                clean_desc = re.sub(r'<[^>]+>', '', m.get("description") or "").strip()
                title = m["title"].get("english") or m["title"].get("romaji") or m["title"].get("native")
                year = m.get("seasonYear") or (m.get("startDate") or {}).get("year")
                avg_score = round(m["averageScore"] / 10.0, 1) if m.get("averageScore") else None
                items.append(TitleSearchResult(
                    id=f"anilist_{m['id']}",
                    title=title,
                    english_title=m["title"].get("english"),
                    romaji_title=m["title"].get("romaji"),
                    media_type=m_type,
                    release_year=year,
                    genres=m.get("genres", []),
                    overview=clean_desc[:400],
                    poster_url=m.get("coverImage", {}).get("extraLarge") or m.get("coverImage", {}).get("large"),
                    backdrop_url=m.get("bannerImage"),
                    external_score=avg_score,
                    popularity=m.get("popularity")
                ))
            return items

    async def _search_tvmaze(self, query: str, limit: int = 5) -> List[TitleSearchResult]:
        try:
            async with httpx.AsyncClient(timeout=3.5, headers=self.headers) as client:
                resp = await client.get(f"https://api.tvmaze.com/search/shows?q={query}")
                if resp.status_code != 200:
                    return []
                items = []
                for entry in resp.json()[:limit]:
                    show = entry.get("show", {})
                    clean_desc = re.sub(r'<[^>]+>', '', show.get("summary") or "").strip()
                    year = int(show["premiered"][:4]) if show.get("premiered") else None
                    rating = (show.get("rating") or {}).get("average")
                    image = (show.get("image") or {}).get("original") or (show.get("image") or {}).get("medium")
                    items.append(TitleSearchResult(
                        id=f"tvmaze_{show['id']}",
                        title=show.get("name", "Unknown"),
                        media_type=MediaType.SERIES,
                        release_year=year,
                        genres=show.get("genres", []),
                        overview=clean_desc[:400],
                        poster_url=image,
                        external_score=rating,
                        popularity=show.get("weight", 0)
                    ))
                return items
        except Exception as e:
            print(f"[MetadataService] TVMaze query '{query}' failed gracefully: {e}")
            return []

    async def _search_wikipedia(self, query: str, limit: int = 5) -> List[TitleSearchResult]:
        """
        Universal encyclopedia search across every movie, series, documentary, and miniseries in the world.
        Uses MediaWiki search API with entertainment filtering, then fetches rich summaries for top hits.
        """
        items = []
        try:
            params = {
                "action": "query",
                "list": "search",
                "srsearch": query,
                "srnamespace": 0,
                "srlimit": 12,
                "format": "json"
            }
            async with httpx.AsyncClient(timeout=4.5, headers=self.headers) as client:
                resp = await client.get("https://en.wikipedia.org/w/api.php", params=params)
                if resp.status_code != 200:
                    return []
                search_hits = resp.json().get("query", {}).get("search", [])

                entertainment_entries = []
                for hit in search_hits:
                    t = hit["title"]
                    s = (hit.get("snippet") or "").lower()
                    combined = (t + " " + s).lower()

                    if any(k in combined for k in [
                        "film", "series", "television", "drama", "movie", "anime",
                        "directed by", "starring", "miniseries", "documentary",
                        "episodes", "broadcast", "premiere", "jtbc", "netflix", "hbo"
                    ]):
                        if not any(skip in combined for skip in ["soundtrack", "discography", "list of episodes", "awards and nominations", "box office"]):
                            entertainment_entries.append((t, hit.get("wordcount", 5000)))

                for wiki_title, wordcount in entertainment_entries[:limit]:
                    try:
                        clean_page_name = wiki_title.replace(" ", "_")
                        sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{clean_page_name}"
                        sum_resp = await client.get(sum_url)
                        if sum_resp.status_code == 200:
                            data = sum_resp.json()
                            raw_title = data.get("title", wiki_title)
                            desc = data.get("description", "")
                            extract = data.get("extract", "")

                            display_title = re.sub(r'\s*\([^)]*\)$', '', raw_title).strip()

                            combined_text = (desc + " " + extract).lower()
                            if any(w in combined_text for w in ["documentary", "docuseries"]):
                                mtype = MediaType.DOCUMENTARY
                            elif any(w in combined_text for w in ["television series", "tv series", "drama series", "korean drama", "broadcast on", "sitcom", "miniseries", "episodes"]):
                                mtype = MediaType.SERIES
                            elif "anime" in combined_text:
                                mtype = MediaType.ANIME
                            else:
                                mtype = MediaType.MOVIE

                            year_match = re.search(r'\b(19\d{2}|20\d{2})\b', desc + " " + extract)
                            release_year = int(year_match.group(1)) if year_match else None

                            image = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")

                            genres = ["Entertainment"]
                            if desc:
                                genre_words = [w.capitalize() for w in re.split(r'[,–\-/\s]+', desc) if w.lower() in [
                                    "drama", "romance", "thriller", "action", "comedy", "horror", "mystery", "sci-fi", "fantasy", "crime", "history", "biography", "animation"
                                ]]
                                if genre_words:
                                    genres = list(set(genre_words))
                                else:
                                    genres = [desc[:25]]

                            items.append(TitleSearchResult(
                                id=f"wiki_{clean_page_name}",
                                title=display_title,
                                romaji_title=raw_title if display_title != raw_title else None,
                                media_type=mtype,
                                release_year=release_year,
                                genres=genres,
                                overview=extract[:400] if extract else desc,
                                poster_url=image,
                                backdrop_url=image,
                                external_score=None,
                                popularity=wordcount
                            ))
                    except Exception:
                        continue
        except Exception as e:
            print(f"[MetadataService] Universal Wikipedia search error: {e}")
        return items

    async def _get_anilist_details(self, anime_id: int) -> Dict[str, Any]:
        query_gql = """
        query ($id: Int) {
          Media(id: $id) {
            id
            type
            format
            title { romaji english native }
            seasonYear
            startDate { year }
            genres
            description(asHtml: false)
            coverImage { extraLarge large }
            bannerImage
            averageScore
            meanScore
            popularity
            favourites
            rankings { rank type context year allTime }
            reviews(page: 1, perPage: 25, sort: RATING_DESC) {
              nodes {
                id
                summary
                rating
                ratingAmount
                body(asHtml: false)
                siteUrl
                createdAt
                user { name avatar { medium } }
              }
            }
          }
        }
        """
        async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
            resp = await client.post("https://graphql.anilist.co", json={"query": query_gql, "variables": {"id": anime_id}})
            if resp.status_code != 200:
                return {}
            m = resp.json().get("data", {}).get("Media", {})
            title = m["title"].get("english") or m["title"].get("romaji") or m["title"].get("native")
            clean_desc = re.sub(r'<[^>]+>', '', m.get("description") or "").strip()
            score_10 = round(m["averageScore"] / 10.0, 1) if m.get("averageScore") else None
            return {
                "canonical_id": f"anilist_{anime_id}",
                "title": title,
                "english_title": m["title"].get("english"),
                "romaji_title": m["title"].get("romaji"),
                "media_type": MediaType.ANIME.value if m.get("type") == "ANIME" else MediaType.MOVIE.value,
                "release_year": m.get("seasonYear") or (m.get("startDate") or {}).get("year"),
                "poster_url": m.get("coverImage", {}).get("extraLarge") or m.get("coverImage", {}).get("large"),
                "backdrop_url": m.get("bannerImage"),
                "genres": m.get("genres", []),
                "overview": clean_desc,
                "external_score": score_10,
                "external_ratings": {
                    "AniList": f"{m.get('averageScore')}%" if m.get('averageScore') else "N/A",
                    "AniList Popularity": f"#{m.get('popularity', 'N/A')}"
                },
                "raw_reviews": m.get("reviews", {}).get("nodes", [])
            }

    async def _get_tvmaze_details(self, show_id: int) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=3.5, headers=self.headers) as client:
                resp = await client.get(f"https://api.tvmaze.com/shows/{show_id}")
                if resp.status_code != 200:
                    return {}
                show = resp.json()
                clean_desc = re.sub(r'<[^>]+>', '', show.get("summary") or "").strip()
                year = int(show["premiered"][:4]) if show.get("premiered") else None
                rating = (show.get("rating") or {}).get("average")
                image = (show.get("image") or {}).get("original") or (show.get("image") or {}).get("medium")
                return {
                    "canonical_id": f"tvmaze_{show_id}",
                    "title": show.get("name"),
                    "media_type": MediaType.SERIES.value,
                    "release_year": year,
                    "poster_url": image,
                    "backdrop_url": image,
                    "genres": show.get("genres", []),
                    "overview": clean_desc,
                    "external_score": rating,
                    "external_ratings": {
                        "TVMaze Rating": f"{rating}/10" if rating else "N/A",
                        "Network": show.get("network", {}).get("name") if show.get("network") else "Streaming"
                    },
                    "raw_reviews": []
                }
        except Exception as e:
            print(f"[MetadataService] TVMaze show {show_id} failed gracefully: {e}")
            return {}

    async def _get_wikipedia_details(self, wiki_title: str) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0, headers=self.headers) as client:
                resp = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{wiki_title}")
                if resp.status_code != 200:
                    return {}
                data = resp.json()
                raw_title = data.get("title", wiki_title.replace("_", " "))
                display_title = re.sub(r'\s*\([^)]*\)$', '', raw_title).strip()
                desc = data.get("description", "")
                extract = data.get("extract", "")

                combined_text = (desc + " " + extract).lower()
                if any(w in combined_text for w in ["documentary", "docuseries"]):
                    mtype = MediaType.DOCUMENTARY.value
                elif any(w in combined_text for w in ["television series", "tv series", "drama series", "korean drama", "broadcast on", "sitcom", "miniseries", "episodes"]):
                    mtype = MediaType.SERIES.value
                elif "anime" in combined_text:
                    mtype = MediaType.ANIME.value
                else:
                    mtype = MediaType.MOVIE.value

                year_match = re.search(r'\b(19\d{2}|20\d{2})\b', desc + " " + extract)
                release_year = int(year_match.group(1)) if year_match else None

                image = (data.get("thumbnail") or {}).get("source") or (data.get("originalimage") or {}).get("source")

                genres = ["Drama", "Television"] if mtype == MediaType.SERIES.value else ["Film", "Cinema"]
                if desc:
                    genre_words = [w.capitalize() for w in re.split(r'[,–\-/\s]+', desc) if w.lower() in [
                        "drama", "romance", "thriller", "action", "comedy", "horror", "mystery", "sci-fi", "fantasy", "crime", "history", "biography", "animation"
                    ]]
                    if genre_words:
                        genres = list(set(genre_words))

                return {
                    "canonical_id": f"wiki_{wiki_title}",
                    "title": display_title,
                    "romaji_title": raw_title,
                    "media_type": mtype,
                    "release_year": release_year,
                    "poster_url": image,
                    "backdrop_url": image,
                    "genres": genres,
                    "overview": extract,
                    "external_score": None,
                    "external_ratings": {
                        "Catalog Source": "Encyclopedic Verification",
                        "Category": desc or ("Television Series" if mtype == MediaType.SERIES.value else "Feature Film")
                    },
                    "raw_reviews": []
                }
        except Exception as e:
            print(f"[MetadataService] Error fetching Wikipedia details for {wiki_title}: {e}")
            return {}

    async def _get_trending_anilist(self, limit: int = 8) -> List[TitleSearchResult]:
        query_gql = """
        query ($perPage: Int) {
          Page(page: 1, perPage: $perPage) {
            media(sort: TRENDING_DESC, type: ANIME) {
              id
              type
              title { romaji english }
              seasonYear
              startDate { year }
              genres
              description(asHtml: false)
              coverImage { extraLarge large }
              bannerImage
              averageScore
              popularity
            }
          }
        }
        """
        async with httpx.AsyncClient(timeout=8.0, headers=self.headers) as client:
            resp = await client.post("https://graphql.anilist.co", json={"query": query_gql, "variables": {"perPage": limit}})
            if resp.status_code != 200:
                return []
            data = resp.json().get("data", {}).get("Page", {}).get("media", [])
            items = []
            for m in data:
                title = m["title"].get("english") or m["title"].get("romaji")
                clean_desc = re.sub(r'<[^>]+>', '', m.get("description") or "").strip()
                year = m.get("seasonYear") or (m.get("startDate") or {}).get("year")
                avg_score = round(m["averageScore"] / 10.0, 1) if m.get("averageScore") else None
                items.append(TitleSearchResult(
                    id=f"anilist_{m['id']}",
                    title=title,
                    english_title=m["title"].get("english"),
                    romaji_title=m["title"].get("romaji"),
                    media_type=MediaType.ANIME,
                    release_year=year,
                    genres=m.get("genres", []),
                    overview=clean_desc[:300],
                    poster_url=m.get("coverImage", {}).get("extraLarge") or m.get("coverImage", {}).get("large"),
                    backdrop_url=m.get("bannerImage"),
                    external_score=avg_score,
                    popularity=m.get("popularity")
                ))
            return items

    async def _get_popular_shows(self, limit: int = 6) -> List[TitleSearchResult]:
        try:
            async with httpx.AsyncClient(timeout=3.5, headers=self.headers) as client:
                # Query top rated classic shows
                resp = await client.get("https://api.tvmaze.com/shows?page=0")
                if resp.status_code != 200:
                    return []
                shows = sorted(resp.json(), key=lambda s: ((s.get("rating") or {}).get("average") or 0), reverse=True)[:limit]
                items = []
                for s in shows:
                    clean_desc = re.sub(r'<[^>]+>', '', s.get("summary") or "").strip()
                    year = int(s["premiered"][:4]) if s.get("premiered") else None
                    rating = (s.get("rating") or {}).get("average")
                    image = (s.get("image") or {}).get("original") or (s.get("image") or {}).get("medium")
                    items.append(TitleSearchResult(
                        id=f"tvmaze_{s['id']}",
                        title=s.get("name", "Unknown"),
                        media_type=MediaType.SERIES,
                        release_year=year,
                        genres=s.get("genres", []),
                        overview=clean_desc[:300],
                        poster_url=image,
                        external_score=rating,
                        popularity=s.get("weight", 0)
                    ))
                return items
        except Exception as e:
            print(f"[MetadataService] Popular shows query failed gracefully: {e}")
            return []

    async def get_curated_shelves(self) -> List[Dict[str, Any]]:
        """
        Returns rich curated category shelves with live, verified posters and metadata.
        """
        cache_key = "curated_shelves_v2"
        cached = cache_service.get(cache_key)
        if cached:
            return cached

        shelf_specs = [
            {
                "id": "highest-rated-anime",
                "title": "⚔️ Highest Rated Anime Masterpieces",
                "badge": "S-TIER ANIMATION",
                "tagline": "Definitive shonen, psychological epics, and world-renowned Japanese animation.",
                "queries": [
                    ("Frieren: Beyond Journey's End", "anime"),
                    ("Fullmetal Alchemist: Brotherhood", "anime"),
                    ("Attack on Titan", "anime"),
                    ("Steins;Gate", "anime"),
                    ("Hunter x Hunter 2011", "anime"),
                    ("Death Note", "anime"),
                    ("Chainsaw Man", "anime"),
                    ("Jujutsu Kaisen", "anime")
                ]
            },
            {
                "id": "highest-rated-indian",
                "title": "🇮🇳 Highest Rated Indian Cinema",
                "badge": "CRITICALLY ACCLAIMED CLASSICS",
                "tagline": "Monumental cinematic visions, groundbreaking storytelling, and worldwide audience acclaim.",
                "queries": [
                    ("RRR film", "movie"),
                    ("Dangal film", "movie"),
                    ("Gangs of Wasseypur", "movie"),
                    ("Tumbbad", "movie"),
                    ("3 Idiots", "movie"),
                    ("Kantara film", "movie"),
                    ("Lagaan", "movie"),
                    ("Baahubali 2: The Conclusion", "movie")
                ]
            },
            {
                "id": "prestige-series",
                "title": "📺 Prestige Television & Drama Series",
                "badge": "EMMY HEAVYWEIGHTS",
                "tagline": "Unmatched narrative architecture, airtight tension, and critical consensus.",
                "queries": [
                    ("Breaking Bad", "series"),
                    ("Chernobyl miniseries", "series"),
                    ("Succession TV series", "series"),
                    ("Severance TV series", "series"),
                    ("The Bear TV series", "series"),
                    ("Better Call Saul", "series"),
                    ("Arcane TV series", "series"),
                    ("The Sopranos", "series")
                ]
            },
            {
                "id": "top-korean-series",
                "title": "🇰🇷 Top Korean Series & Global Cinema",
                "badge": "K-DRAMA & FILM SENSATIONS",
                "tagline": "High-concept thrills, intricate emotional depth, and award-winning Korean productions.",
                "queries": [
                    ("Parasite 2019 film", "movie"),
                    ("Squid Game", "series"),
                    ("The Glory TV series", "series"),
                    ("Moving South Korean TV series", "series"),
                    ("Crash Landing on You", "series"),
                    ("Kingdom South Korean TV series", "series"),
                    ("Memories of Murder", "movie"),
                    ("Oldboy 2003 film", "movie")
                ]
            },
            {
                "id": "horror-psychological",
                "title": "🩸 Mind-Bending Horror & Thrillers",
                "badge": "HIGH TENSION & DREAD",
                "tagline": "Airtight tension, atmospheric terror, and deeply haunting psychological mysteries.",
                "queries": [
                    ("The Shining film", "movie"),
                    ("The Silence of the Lambs film", "movie"),
                    ("Hereditary film", "movie"),
                    ("Black Swan film", "movie"),
                    ("Get Out film", "movie"),
                    ("Shutter Island film", "movie"),
                    ("Midsommar film", "movie"),
                    ("Psycho 1960 film", "movie")
                ]
            },
            {
                "id": "underrated-gems",
                "title": "💎 Underrated Masterpieces & Hidden Gems",
                "badge": "AUDIENCE FAVORITES",
                "tagline": "Overwhelming positive reception with less mainstream saturation — pure cinematic gems.",
                "queries": [
                    ("Dark TV series", "series"),
                    ("Coherence film", "movie"),
                    ("Monster anime", "anime"),
                    ("Incendies", "movie"),
                    ("Primal TV series", "series"),
                    ("Past Lives film", "movie"),
                    ("Primer film", "movie"),
                    ("The Fall 2006 film", "movie")
                ]
            }
        ]

        async def resolve_item(q: str):
            try:
                candidates = await self.search_titles(q, limit=1)
                if candidates and candidates[0].poster_url:
                    return candidates[0].model_dump()
            except Exception as e:
                print(f"[MetadataService] Shelf resolution error for {q}: {e}")
            return None

        async def resolve_shelf(spec: Dict[str, Any]):
            tasks = [resolve_item(q) for q, _ in spec["queries"]]
            results = await asyncio.gather(*tasks)
            shelf_items = [r for r in results if r is not None]
            return {
                "id": spec["id"],
                "title": spec["title"],
                "badge": spec["badge"],
                "tagline": spec["tagline"],
                "items": shelf_items
            }

        shelf_tasks = [resolve_shelf(spec) for spec in shelf_specs]
        shelves = await asyncio.gather(*shelf_tasks)

        cache_service.set(cache_key, shelves, ttl_seconds=3600*24)
        return shelves

    async def get_shelf_more(self, shelf_id: str, page: int = 1, limit: int = 8) -> Dict[str, Any]:
        """
        Dynamically loads additional high-rated titles for category shelves as the user slides.
        Supports continuous pagination with verified CDN posters and metadata.
        """
        pool = EXPANDED_SHELF_POOLS.get(shelf_id, [])
        offset = (page - 1) * limit
        page_queries = pool[offset:offset + limit]

        if not page_queries:
            return {
                "shelf_id": shelf_id,
                "page": page,
                "has_more": False,
                "items": []
            }

        async def resolve_item(q: str):
            try:
                candidates = await self.search_titles(q, limit=1)
                if candidates and candidates[0].poster_url:
                    return candidates[0].model_dump()
            except Exception as e:
                print(f"[MetadataService] Shelf pagination error for {q}: {e}")
            return None

        tasks = [resolve_item(q) for q, _ in page_queries]
        results = await asyncio.gather(*tasks)
        valid_items = [r for r in results if r is not None]

        has_more = (offset + limit) < len(pool)
        return {
            "shelf_id": shelf_id,
            "page": page,
            "has_more": has_more,
            "items": valid_items
        }

EXPANDED_SHELF_POOLS = {
    "highest-rated-anime": [
        ("Hunter x Hunter 2011", "anime"),
        ("Spirited Away", "anime"),
        ("Vinland Saga", "anime"),
        ("Mob Psycho 100", "anime"),
        ("Cowboy Bebop", "anime"),
        ("Code Geass", "anime"),
        ("Neon Genesis Evangelion", "anime"),
        ("Violet Evergarden", "anime"),
        ("Monster anime", "anime"),
        ("Your Name", "anime"),
        ("One Punch Man", "anime"),
        ("Princess Mononoke", "anime"),
        ("Cyberpunk: Edgerunners", "anime"),
        ("Haikyuu!!", "anime"),
        ("Bleach: Thousand-Year Blood War", "anime"),
        ("Jujutsu Kaisen 0", "anime")
    ],
    "highest-rated-indian": [
        ("PK film", "movie"),
        ("Drishyam 2015 film", "movie"),
        ("Vikram 2022 film", "movie"),
        ("KGF Chapter 2", "movie"),
        ("Swades", "movie"),
        ("Andhadhun", "movie"),
        ("Taare Zameen Par", "movie"),
        ("Sholay", "movie"),
        ("Sardar Udham", "movie"),
        ("Super Deluxe film", "movie"),
        ("Kumbalangi Nights", "movie"),
        ("Jai Bhim film", "movie"),
        ("Gangs of Wasseypur Part 2", "movie"),
        ("Black Friday film", "movie"),
        ("Manichitrathazhu", "movie"),
        ("Pather Panchali", "movie")
    ],
    "prestige-series": [
        ("The Wire", "series"),
        ("Game of Thrones", "series"),
        ("True Detective", "series"),
        ("Fargo TV series", "series"),
        ("Mad Men", "series"),
        ("Fleabag", "series"),
        ("Mindhunter TV series", "series"),
        ("Sherlock TV series", "series"),
        ("Band of Brothers", "series"),
        ("Twin Peaks", "series"),
        ("Peaky Blinders", "series"),
        ("Dark TV series", "series"),
        ("Narcos", "series"),
        ("House of the Dragon", "series"),
        ("The Last of Us TV series", "series"),
        ("Mr. Robot", "series")
    ],
    "top-korean-series": [
        ("Train to Busan", "movie"),
        ("Reply 1988", "series"),
        ("My Mister", "series"),
        ("Vincenzo TV series", "series"),
        ("Itaewon Class", "series"),
        ("Signal South Korean TV series", "series"),
        ("Hospital Playlist", "series"),
        ("All of Us Are Dead", "series"),
        ("The Handmaiden", "movie"),
        ("I Saw the Devil", "movie"),
        ("Sweet Home TV series", "series"),
        ("Twenty-Five Twenty-One", "series"),
        ("A Taxi Driver 2017 film", "movie"),
        ("The Man from Nowhere", "movie"),
        ("Business Proposal", "series"),
        ("Hometown Cha-Cha-Cha", "series")
    ],
    "horror-psychological": [
        ("The Thing 1982 film", "movie"),
        ("Alien film", "movie"),
        ("Rosemary's Baby film", "movie"),
        ("Seven 1995 film", "movie"),
        ("Talk to Me 2022 film", "movie"),
        ("A Quiet Place film", "movie"),
        ("The Witch film", "movie"),
        ("The Sixth Sense", "movie"),
        ("The Exorcist film", "movie"),
        ("Alien Romulus", "movie"),
        ("Late Night with the Devil", "movie"),
        ("Babadook", "movie"),
        ("It Follows", "movie"),
        ("Sinister film", "movie"),
        ("Nosferatu", "movie"),
        ("The Conjuring", "movie")
    ],
    "underrated-gems": [
        ("Ex Machina film", "movie"),
        ("Whiplash 2014 film", "movie"),
        ("Nightcrawler film", "movie"),
        ("Drive 2011 film", "movie"),
        ("Arrival film", "movie"),
        ("Prisoners 2013 film", "movie"),
        ("Zodiac film", "movie"),
        ("The Truman Show", "movie"),
        ("Children of Men", "movie"),
        ("Memento film", "movie"),
        ("Her film", "movie"),
        ("Sicario film", "movie"),
        ("Gattaca", "movie"),
        ("Wind River film", "movie"),
        ("Incendies", "movie"),
        ("12 Angry Men 1957 film", "movie")
    ]
}

metadata_service = MetadataService()
