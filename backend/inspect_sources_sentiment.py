import sqlite3
import json

conn = sqlite3.connect('cinescope_cache.db')
c = conn.cursor()
row = c.execute("SELECT data_json FROM cache_store WHERE cache_key = 'verdict_anilist_171627_full'").fetchone()
if row:
    d = json.loads(row[0])
    print("Title:", d.get("title"))
    print("Sources count:", len(d.get("sources", [])))
    for s in d.get("sources", []):
        print(f" - [{s['category']}] {s['source_name']}: score={s.get('sentiment_score')}, conf={s.get('confidence')}")
        print(f"   Excerpt: {s.get('excerpt')[:120]}")
