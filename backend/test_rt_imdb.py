import asyncio
import httpx
import json
import re

async def test_rt_imdb():
    # 1. Rotten Tomatoes search API
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    rt_url = "https://www.rottentomatoes.com/napi/search/all?query=The+Substance"
    async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
        try:
            r = await client.get(rt_url)
            print("RT search status:", r.status_code)
            if r.status_code == 200:
                data = r.json()
                print("RT data keys:", data.keys())
                movies = data.get("movie", {}).get("items", [])
                for m in movies[:3]:
                    print(" - RT Movie:", m.get("name"), m.get("releaseYear"), "Critics:", m.get("tomatometerScore"), "Audience:", m.get("audienceScore"))
        except Exception as e:
            print("RT search error:", e)

    # 2. IMDb suggestion API
    imdb_url = "https://v3.sg.media-imdb.com/suggestion/x/the_substance.json"
    async with httpx.AsyncClient(timeout=6.0, headers=headers) as client:
        try:
            r = await client.get(imdb_url)
            print("IMDb suggestion status:", r.status_code)
            if r.status_code == 200:
                d = r.json().get("d", [])
                for item in d[:3]:
                    print(" - IMDb item:", item.get("l"), f"({item.get('y')})", "ID:", item.get("id"), "Stars:", item.get("s"))
        except Exception as e:
            print("IMDb error:", e)

if __name__ == "__main__":
    asyncio.run(test_rt_imdb())
