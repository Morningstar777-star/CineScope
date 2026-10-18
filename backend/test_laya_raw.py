from app.services.laya_engine import laya_engine

texts = [
    "Rotten Tomatoes Tomatometer approval rating: 96% positive reviews from certified industry critics.",
    "Verified global audience consensus across 70,184 viewer thoughts and ratings. Average user score: 8.3/10.",
    "Audiences polled by CinemaScore gave the film an average grade of 'A' on an A+ to F scale.",
    "David Ehrlich of IndieWire graded the film an A, calling it an epic, audacious body horror masterpiece.",
    "Chainsaw Man - Reze Arc: a Passionate Display of Art, and a Love Letter to one of Fujimoto's Best Works."
]

for t in texts:
    res = laya_engine.classify_review_sentiment(t)
    print("---")
    print("Text:", t)
    print("Result:", res)
    # Check raw decide output
    q = {
        "sentiment": {
            "type": "choice",
            "instructions": "What is the overall sentiment of this entertainment review excerpt?",
            "criteria": {
                "positive": "Praise, masterpiece, highly recommended, great performance, stunning visuals, emotional resonance.",
                "negative": "Disappointing, boring, plot holes, bad acting, terrible pacing, waste of time, skip.",
                "mixed": "Average, flawed but entertaining, uneven pacing, great concepts with poor execution."
            }
        }
    }
    raw = laya_engine.agent.decide(state=t[:500], questions=q)
    print("Raw decide:", raw)
