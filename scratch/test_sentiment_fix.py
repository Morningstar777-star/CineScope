import re
import laya

def extract_numerical_sentiment(text: str):
    # 1. Percentages (e.g. 98%, 96% positive)
    pct_m = re.search(r'(\d{1,3})%\s*(?:positive|approval|fresh|tomatometer)?', text, re.I)
    if pct_m:
        pct = float(pct_m.group(1))
        # 98% -> +0.96, 90% -> +0.80, 75% -> +0.50, 50% -> 0.0, 30% -> -0.40
        score = (pct - 50.0) / 50.0
        return max(-1.0, min(1.0, score)), f"percentage_{pct}%"

    # 2. X/10 ratings (e.g. 8.3/10, 9/10, 4/10)
    score_10 = re.search(r'(\d+(?:\.\d+)?)\s*/\s*10', text)
    if score_10:
        val = float(score_10.group(1))
        # 8.3/10 -> +0.66, 9.0/10 -> +0.80, 5.0/10 -> 0.0, 3.0/10 -> -0.40
        score = (val - 5.0) / 5.0
        return max(-1.0, min(1.0, score)), f"score_{val}/10"

    # 3. CinemaScore grades (A+, A, A-, B+, etc.)
    grade_m = re.search(r'grade\s+(?:of\s+)?[\'"]?([A-F][+-]?)[\'"]?', text, re.I)
    if grade_m:
        grade = grade_m.group(1).upper()
        grade_map = {
            'A+': 0.95, 'A': 0.88, 'A-': 0.80,
            'B+': 0.65, 'B': 0.50, 'B-': 0.30,
            'C+': 0.0, 'C': -0.30, 'D': -0.70, 'F': -0.95
        }
        if grade in grade_map:
            return grade_map[grade], f"grade_{grade}"

    # 4. X/5 ratings (e.g. 4.5/5, 5/5)
    score_5 = re.search(r'(\d+(?:\.\d+)?)\s*/\s*5', text)
    if score_5:
        val = float(score_5.group(1))
        score = (val - 2.5) / 2.5
        return max(-1.0, min(1.0, score)), f"score_{val}/5"

    return None, None

def heuristic_text_sentiment(text: str) -> float:
    lower = text.lower()
    strong_pos = [
        "masterpiece", "breathtaking", "stellar", "phenomenal", "brilliant", "unforgettable",
        "love letter", "peak", "superb", "top-tier", "flawless", "stunning", "acclaimed",
        "triumph", "exceptional", "must-watch", "magnificent", "exquisite", "astonishing"
    ]
    moderate_pos = [
        "great", "excellent", "good", "love", "compelling", "gripping", "captivating",
        "thrilling", "impressive", "engaging", "entertaining", "solid", "heartfelt",
        "emotional", "beautiful", "positive", "worth watching", "high quality", "dynamic"
    ]
    strong_neg = [
        "garbage", "unwatchable", "disaster", "horrible", "terrible", "abysmal", "trash",
        "awful", "waste of time", "insufferable", "dreadful", "atrocious"
    ]
    moderate_neg = [
        "boring", "disappointing", "cringe", "drag", "mess", "uninspired", "flat",
        "poor", "shallow", "mediocre", "cliché", "dull", "tedious", "skip", "forgettable"
    ]

    sp_count = sum(1 for w in strong_pos if w in lower)
    mp_count = sum(1 for w in moderate_pos if w in lower)
    sn_count = sum(1 for w in strong_neg if w in lower)
    mn_count = sum(1 for w in moderate_neg if w in lower)

    pos_score = (sp_count * 0.4) + (mp_count * 0.2)
    neg_score = (sn_count * 0.4) + (mn_count * 0.2)

    diff = pos_score - neg_score
    if diff > 0:
        return min(0.95, round(0.35 + diff * 0.5, 3))
    elif diff < 0:
        return max(-0.95, round(-0.35 + diff * 0.5, 3))
    return 0.1

tests = [
    "Rotten Tomatoes reports a 98% approval rating based on 5000 critic reviews.",
    "Verified global audience consensus across 70,184 viewer thoughts. Average user score: 8.3/10.",
    "CinemaScore average grade of 'A' from opening night audiences.",
    "Metacritic score: 71/100",
    "A Passionate Display of Art, and a Love Letter to Animation and Storytelling.",
    "The animation by MAPPA is breathtaking, with incredible fight choreography and emotional depth.",
    "Boring, terrible pacing, waste of time, awful CGI."
]

for t in tests:
    num_score, kind = extract_numerical_sentiment(t)
    if num_score is not None:
        final_score = num_score
        source = f"Numeric ({kind})"
    else:
        final_score = heuristic_text_sentiment(t)
        source = "Lexical Sentiment"
    print(f"{t[:55]}... => score={final_score:.3f} [{source}]")
