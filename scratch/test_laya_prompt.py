import laya

agent = laya.load("convaiinnovations/laya")

# Test different question framings
q_frames = [
    {
        "name": "binary_pos_neg",
        "q": {
            "sentiment": {
                "type": "choice",
                "instructions": "Is the sentiment of this review excerpt positive or negative?",
                "criteria": {
                    "positive": "Positive, praise, enjoyment, high recommendation, good quality.",
                    "negative": "Negative, criticism, dislike, poor quality, disappointment."
                }
            }
        }
    },
    {
        "name": "recommendation",
        "q": {
            "sentiment": {
                "type": "choice",
                "instructions": "Does this review recommend the movie or anime?",
                "criteria": {
                    "positive": "Yes, highly recommended, praised.",
                    "negative": "No, not recommended, criticized."
                }
            }
        }
    }
]

sentences = [
    "A Passionate Display of Art, and a Love Letter to Animation and Storytelling.",
    "The animation by MAPPA is breathtaking, with incredible fight choreography and emotional depth.",
    "Boring, terrible pacing, waste of time, awful CGI."
]

for frame in q_frames:
    print(f"\n--- Testing Frame: {frame['name']} ---")
    for s in sentences:
        res = agent.decide(state=s, questions=frame["q"])
        ans = res["sentiment"]["choice"]
        probs = res["sentiment"]["probabilities"]
        print(f"[{ans}] (pos: {probs.get('positive', 0):.2f}, neg: {probs.get('negative', 0):.2f}) :: {s[:60]}")
