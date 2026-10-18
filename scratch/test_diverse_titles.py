import httpx
import json

titles_to_test = [
    ("Severance", "wiki_Severance_(TV_series)"),
    ("The Substance", "wiki_The_Substance")
]

with httpx.Client(timeout=45.0) as client:
    for name, cid in titles_to_test:
        print(f"\n--- Testing Title: {name} ({cid}) ---")
        resp = client.get(f"http://127.0.0.1:8000/api/titles/{cid}")
        if resp.status_code == 200:
            d = resp.json()
            print(f"Title: {d.get('title')}")
            print(f"Verdict: {d.get('verdict')}")
            print(f"Overall Score: {d.get('overall_score')}/10")
            print(f"External Critic: {d.get('external_critic_score')}, Audience: {d.get('external_audience_score')}")
            print(f"Ratings: {d.get('external_ratings')}")
        else:
            print("Error:", resp.status_code, resp.text[:100])
