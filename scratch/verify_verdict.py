import httpx
import json
import time

url = "http://127.0.0.1:8000/api/titles/anilist_171627"
print(f"Requesting fresh verdict from {url}...")
t0 = time.time()
with httpx.Client(timeout=45.0) as client:
    resp = client.get(url)
    print(f"Status Code: {resp.status_code} in {time.time()-t0:.2f}s")
    if resp.status_code == 200:
        data = resp.json()
        print("\n=== CINESCOPE CALIBRATED VERDICT RESULTS ===")
        print(f"Title: {data.get('title')}")
        print(f"Verdict: {data.get('verdict')}")
        print(f"Overall AI Score: {data.get('overall_score')} / 10.0")
        print(f"Confidence: {int(data.get('confidence', 0) * 100)}%")
        print(f"External Critic Score: {data.get('external_critic_score')}")
        print(f"External Audience Score: {data.get('external_audience_score')}")
        print(f"External Ratings: {json.dumps(data.get('external_ratings'), indent=2)}")
        print(f"Strengths: {[s.get('aspect') + ' (' + str(s.get('score')) + ')' for s in data.get('strengths', [])]}")
        print(f"Weaknesses: {[w.get('aspect') + ' (' + str(w.get('score')) + ')' for w in data.get('weaknesses', [])]}")
        meth = data.get("methodology", {})
        print(f"\nMethodology: {meth.get('explanation')}")
        print(f"Sentiment Synthetic Score: {meth.get('sentiment_synthetic_score')}")
        print(f"Critic Count: {meth.get('critic_count')}, Audience Count: {meth.get('audience_count')}")
    else:
        print("Error:", resp.text)
