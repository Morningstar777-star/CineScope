import httpx
import re
import asyncio

headers = {"User-Agent": "CineScope/1.0 (contact: info@cinescope.local)"}

async def search_wiki_entertainment(query):
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&srnamespace=0&srlimit=10&format=json"
    async with httpx.AsyncClient(timeout=5.0, headers=headers) as client:
        r = await client.get(url)
        hits = r.json().get("query", {}).get("search", [])
        entertainment_hits = []
        for h in hits:
            t = h["title"]
            s = (h.get("snippet") or "").lower()
            combined = (t + " " + s).lower()
            if any(k in combined for k in ["film", "series", "television", "drama", "movie", "anime", "directed by", "starring", "miniseries", "documentary", "episodes", "jtbc"]):
                if not any(skip in combined for skip in ["soundtrack", "discography", "list of episodes", "awards and nominations"]):
                    entertainment_hits.append(t)
        
        results = []
        for title in entertainment_hits[:4]:
            try:
                sum_r = await client.get(f"https://en.wikipedia.org/api/rest_v1/page/summary/{title.replace(' ', '_')}")
                if sum_r.status_code == 200:
                    d = sum_r.json()
                    desc = d.get("description", "")
                    mtype = "series" if any(w in desc.lower() for w in ["series", "television", "drama", "broadcast"]) else "movie"
                    year_match = re.search(r"\b(19\d{2}|20\d{2})\b", desc + " " + d.get("extract", ""))
                    results.append({
                        "title": d.get("title"),
                        "desc": desc,
                        "media_type": mtype,
                        "year": int(year_match.group(1)) if year_match else None,
                        "poster": (d.get("thumbnail") or {}).get("source"),
                        "overview": d.get("extract", "")[:180]
                    })
            except Exception as e:
                pass
        return results

async def main():
    queries = ["Snowdrop", "The Substance", "Queen of Tears", "RRR", "Past Lives"]
    for q in queries:
        res = await search_wiki_entertainment(q)
        print(f"=== Query: {q} ===")
        for r in res:
            print(f"  -> {r['title']} ({r['year']}) [{r['media_type']}] Poster: {bool(r['poster'])}")
            print(f"     {r['overview'][:110]}...")

if __name__ == "__main__":
    asyncio.run(main())
