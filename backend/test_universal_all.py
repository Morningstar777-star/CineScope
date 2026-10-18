import asyncio
import httpx
import re

headers = {"User-Agent": "CineScope/1.0 (contact: info@cinescope.local)"}

async def search_universal_entertainment(query):
    url = f"https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch={query}&srnamespace=0&srlimit=8&format=json"
    items = []
    async with httpx.AsyncClient(timeout=4.0, headers=headers) as client:
        r = await client.get(url)
        hits = r.json().get("query", {}).get("search", [])
        clean_q = re.sub(r'[^a-zA-Z0-9]', '', query.lower())

        for h in hits:
            t = h["title"]
            s = (h.get("snippet") or "").lower()
            combined = (t + " " + s).lower()

            if any(k in combined for k in [
                "film", "series", "television", "drama", "movie", "anime", 
                "directed by", "starring", "miniseries", "documentary", 
                "episodes", "broadcast", "premiere", "jtbc", "netflix", "hbo", "south korean"
            ]):
                if not any(skip in combined for skip in ["soundtrack", "discography", "list of episodes", "awards and nominations"]):
                    items.append((t, h["title"], h["wordcount"]))

        # Fetch summaries for top 3
        results = []
        for raw_title, title, wc in items[:3]:
            try:
                page_name = raw_title.replace(" ", "_")
                sum_url = f"https://en.wikipedia.org/api/rest_v1/page/summary/{page_name}"
                sum_r = await client.get(sum_url)
                if sum_r.status_code == 200:
                    d = sum_r.json()
                    desc = d.get("description", "")
                    extract = d.get("extract", "")
                    clean_title = re.sub(r'\s*\([^)]*\)$', '', d.get("title", raw_title)).strip()

                    combined_text = (desc + " " + extract).lower()
                    if any(w in combined_text for w in ["documentary", "docuseries"]):
                        mtype = "documentary"
                    elif any(w in combined_text for w in ["television series", "tv series", "drama series", "korean drama", "broadcast on", "sitcom", "miniseries", "episodes", "south korean television"]):
                        mtype = "series"
                    elif "anime" in combined_text:
                        mtype = "anime"
                    else:
                        mtype = "movie"

                    year_match = re.search(r'\b(19\d{2}|20\d{2})\b', desc + " " + extract)
                    year = int(year_match.group(1)) if year_match else None
                    poster = (d.get("thumbnail") or {}).get("source")

                    results.append({
                        "id": f"wiki_{page_name}",
                        "title": clean_title,
                        "raw_title": raw_title,
                        "media_type": mtype,
                        "year": year,
                        "poster": poster,
                        "overview": extract[:120]
                    })
            except Exception:
                pass
        return results

async def main():
    queries = [
        "Snowdrop",
        "The Substance",
        "Squid Game",
        "RRR",
        "Past Lives",
        "Queen of Tears",
        "Severance",
        "Oppenheimer",
        "Chainsaw Man"
    ]
    for q in queries:
        res = await search_universal_entertainment(q)
        print(f"Query: '{q}' -> Top hit:")
        if res:
            top = res[0]
            print(f"   [{top['media_type'].upper()}] {top['title']} ({top['year']}) | ID: {top['id']} | Poster: {bool(top['poster'])}")
        else:
            print("   None")

if __name__ == "__main__":
    asyncio.run(main())
