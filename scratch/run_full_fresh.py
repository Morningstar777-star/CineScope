import sqlite3
import httpx

with sqlite3.connect("backend/cinescope_cache.db") as conn:
    conn.execute("DELETE FROM cache_store WHERE cache_key LIKE '%171627%'")
print("Cache cleared. Requesting fresh analysis from server...")
r = httpx.get("http://127.0.0.1:8000/api/titles/anilist_171627", timeout=40.0)
print("Status:", r.status_code)
d = r.json()
print("Verdict:", d.get("verdict"))
print("Overall Score:", d.get("overall_score"))
print("Confidence:", d.get("confidence"))
print("Critic Score:", d.get("external_critic_score"))
print("Audience Score:", d.get("external_audience_score"))
print("Ratings:", d.get("external_ratings"))
print("Methodology:", d.get("methodology", {}).get("explanation"))
print("Sentiment Synthetic Score:", d.get("methodology", {}).get("sentiment_synthetic_score"))
