import sqlite3
import json

conn = sqlite3.connect('cinescope_cache.db')
c = conn.cursor()
rows = c.execute("SELECT cache_key, data_json FROM cache_store WHERE cache_key LIKE 'verdict_%' ORDER BY created_at DESC LIMIT 5").fetchall()
for key, data_json in rows:
    try:
        d = json.loads(data_json)
        print(f"Key: {key}")
        print(f"Title: {d.get('title')}")
        print(f"Score: {d.get('overall_score')}, Verdict: {d.get('verdict')}")
        print(f"Ratings: {d.get('external_ratings')}")
        print(f"Critic Score: {d.get('external_critic_score')}, Audience: {d.get('external_audience_score')}")
        print(f"Methodology: {d.get('methodology')}")
        print("-" * 50)
    except Exception as e:
        print("Error parsing:", e)
