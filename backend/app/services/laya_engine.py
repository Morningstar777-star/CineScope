"""
LAYA Local Model Intelligence Engine.
Integrates convaiinnovations/laya (ModernBERT-large RLCD agent)
for sub-50ms System 1 sentiment classification, aspect scoring,
and confidence calibration on local GPU/CPU.
"""

import re
import time
from typing import Dict, Any, List, Optional
from app.config import settings

class LayaEngine:
    def __init__(self):
        self.agent = None
        self.is_loaded = False
        self.load_error = None
        if settings.USE_LAYA_LOCAL:
            self._load_agent()

    def _load_agent(self):
        try:
            print("[LayaEngine] Loading local LAYA model (convaiinnovations/laya)...")
            t0 = time.time()
            import laya
            self.agent = laya.load(settings.LAYA_MODEL_PATH)
            self.is_loaded = True
            print(f"[LayaEngine] LAYA loaded successfully in {time.time()-t0:.2f}s.")
        except Exception as e:
            self.load_error = str(e)
            print(f"[LayaEngine] Note: LAYA load deferred or failed: {e}. Falling back to deterministic NLP.")

    def extract_numerical_sentiment(self, text: str) -> Optional[Dict[str, Any]]:
        """
        Extracts verified explicit numerical ratings or letter grades from review excerpts.
        Maps values directly to calibrated score (-1.0 to 1.0) with high confidence.
        """
        # 1. Percentages (e.g. 98%, 96% positive)
        pct_m = re.search(r'(\d{1,3})%\s*(?:positive|approval|fresh|tomatometer)?', text, re.I)
        if pct_m:
            pct = float(pct_m.group(1))
            score = (pct - 50.0) / 50.0
            score = max(-1.0, min(1.0, round(score, 3)))
            return {
                "sentiment": "positive" if score > 0.15 else "negative" if score < -0.15 else "mixed",
                "score": score,
                "confidence": 0.95,
                "probabilities": {"positive": max(0.01, min(0.99, (score + 1.0) / 2.0)), "negative": 1.0 - max(0.01, min(0.99, (score + 1.0) / 2.0))},
                "engine": f"Deterministic Numerical Grounding ({pct:.0f}%)"
            }

        # 2. X/100 ratings (e.g. 71/100, 85/100)
        score_100 = re.search(r'(\d+(?:\.\d+)?)\s*/\s*100', text)
        if score_100:
            val = float(score_100.group(1))
            score = (val - 50.0) / 50.0
            score = max(-1.0, min(1.0, round(score, 3)))
            return {
                "sentiment": "positive" if score > 0.15 else "negative" if score < -0.15 else "mixed",
                "score": score,
                "confidence": 0.95,
                "probabilities": {"positive": max(0.01, min(0.99, (score + 1.0) / 2.0)), "negative": 1.0 - max(0.01, min(0.99, (score + 1.0) / 2.0))},
                "engine": f"Deterministic Numerical Grounding ({val:.0f}/100)"
            }

        # 3. X/10 ratings (e.g. 8.3/10, 9/10, 4/10)
        score_10 = re.search(r'(\d+(?:\.\d+)?)\s*/\s*10', text)
        if score_10:
            val = float(score_10.group(1))
            score = (val - 5.0) / 5.0
            score = max(-1.0, min(1.0, round(score, 3)))
            return {
                "sentiment": "positive" if score > 0.15 else "negative" if score < -0.15 else "mixed",
                "score": score,
                "confidence": 0.94,
                "probabilities": {"positive": max(0.01, min(0.99, (score + 1.0) / 2.0)), "negative": 1.0 - max(0.01, min(0.99, (score + 1.0) / 2.0))},
                "engine": f"Deterministic Numerical Grounding ({val:.1f}/10)"
            }

        # 4. CinemaScore grades (A+, A, A-, B+, etc.)
        grade_m = re.search(r'grade\s+(?:of\s+)?[\'"]?([A-F][+-]?)[\'"]?', text, re.I)
        if grade_m:
            grade = grade_m.group(1).upper()
            grade_map = {
                'A+': 0.95, 'A': 0.88, 'A-': 0.80,
                'B+': 0.65, 'B': 0.50, 'B-': 0.30,
                'C+': 0.0, 'C': -0.30, 'D': -0.70, 'F': -0.95
            }
            if grade in grade_map:
                score = grade_map[grade]
                return {
                    "sentiment": "positive" if score > 0.15 else "negative" if score < -0.15 else "mixed",
                    "score": score,
                    "confidence": 0.95,
                    "probabilities": {"positive": max(0.01, min(0.99, (score + 1.0) / 2.0)), "negative": 1.0 - max(0.01, min(0.99, (score + 1.0) / 2.0))},
                    "engine": f"Deterministic Numerical Grounding (CinemaScore {grade})"
                }

        # 5. X/5 ratings (e.g. 4.5/5, 5/5)
        score_5 = re.search(r'(\d+(?:\.\d+)?)\s*/\s*5', text)
        if score_5:
            val = float(score_5.group(1))
            score = (val - 2.5) / 2.5
            score = max(-1.0, min(1.0, round(score, 3)))
            return {
                "sentiment": "positive" if score > 0.15 else "negative" if score < -0.15 else "mixed",
                "score": score,
                "confidence": 0.94,
                "probabilities": {"positive": max(0.01, min(0.99, (score + 1.0) / 2.0)), "negative": 1.0 - max(0.01, min(0.99, (score + 1.0) / 2.0))},
                "engine": f"Deterministic Numerical Grounding ({val:.1f}/5)"
            }

        return None

    def classify_review_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Classifies review sentiment using grounded numerical extraction, LAYA System 1 decision engine,
        and high-precision lexical calibration.
        Returns sentiment ('positive', 'negative', 'mixed'), score (-1.0 to 1.0), and calibrated confidence.
        """
        # 1. Check for concrete numerical benchmarks first
        num_res = self.extract_numerical_sentiment(text)
        if num_res is not None:
            return num_res

        # 2. Check offline heuristic
        heuristic = self._heuristic_sentiment(text)

        if not self.is_loaded or not self.agent:
            return heuristic

        try:
            # Contrastive binary choice framing calibrated for ModernBERT-large RLCD
            q = {
                "sentiment": {
                    "type": "choice",
                    "instructions": "Is the sentiment of this review excerpt positive or negative?",
                    "criteria": {
                        "positive": "Positive, praise, enjoyment, high recommendation, good quality.",
                        "negative": "Negative, criticism, dislike, poor quality, disappointment."
                    }
                }
            }
            res = self.agent.decide(state=text[:500], questions=q)
            probs = res.get("sentiment", {}).get("probabilities", {})
            conf = res.get("sentiment", {}).get("confidence", 0.75)

            pos_p = probs.get("positive", 0.5)
            neg_p = probs.get("negative", 0.5)
            raw_laya_score = pos_p - neg_p

            # Calibrate with lexical prior
            h_score = heuristic["score"]
            if h_score >= 0.4 and raw_laya_score >= 0:
                blended_score = max(raw_laya_score, h_score)
            elif h_score <= -0.4 and raw_laya_score <= 0:
                blended_score = min(raw_laya_score, h_score)
            else:
                blended_score = (raw_laya_score * 0.65) + (h_score * 0.35)

            blended_score = max(-1.0, min(1.0, round(blended_score, 3)))
            calibrated_choice = "positive" if blended_score > 0.15 else "negative" if blended_score < -0.15 else "mixed"

            return {
                "sentiment": calibrated_choice,
                "score": blended_score,
                "confidence": round(float(conf), 3),
                "probabilities": probs,
                "engine": "LAYA-ModernBERT-RLCD (Calibrated)"
            }
        except Exception as e:
            print(f"[LayaEngine] Inference error: {e}. Using heuristic fallback.")
            return heuristic

    def evaluate_aspect_opinions(self, text: str, aspects: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Evaluates specific aspects (e.g. 'Story', 'Animation', 'Characters', 'Pacing').
        """
        results = {}
        for aspect in aspects:
            lower_text = text.lower()
            if aspect.lower() not in lower_text:
                continue

            sent_res = self.classify_review_sentiment(text)
            # Map score [-1, 1] to [1, 10]
            mapped_10 = round(5.5 + (sent_res["score"] * 4.5), 1)
            results[aspect] = {
                "aspect": aspect,
                "score": max(1.0, min(10.0, mapped_10)),
                "sentiment": sent_res["sentiment"].title(),
                "confidence": sent_res["confidence"]
            }
        return results

    def _heuristic_sentiment(self, text: str) -> Dict[str, Any]:
        """
        Deterministic sentiment analyzer with comprehensive entertainment vocabulary.
        """
        lower = text.lower()
        strong_pos = [
            "masterpiece", "breathtaking", "stellar", "phenomenal", "brilliant", "unforgettable",
            "love letter", "peak", "superb", "top-tier", "flawless", "stunning", "acclaimed",
            "triumph", "exceptional", "must-watch", "magnificent", "exquisite", "astonishing"
        ]
        moderate_pos = [
            "great", "excellent", "good", "love", "compelling", "gripping", "captivating",
            "thrilling", "impressive", "engaging", "entertaining", "solid", "heartfelt",
            "emotional", "beautiful", "positive", "worth watching", "high quality", "dynamic",
            "passionate", "praise", "well-crafted", "wonderfully", "beloved"
        ]
        strong_neg = [
            "garbage", "unwatchable", "disaster", "horrible", "terrible", "abysmal", "trash",
            "awful", "waste of time", "insufferable", "dreadful", "atrocious"
        ]
        moderate_neg = [
            "boring", "disappointing", "cringe", "drag", "mess", "uninspired", "flat",
            "poor", "shallow", "mediocre", "cliché", "dull", "tedious", "skip", "forgettable",
            "flawed", "underwhelming", "confusing", "pointless"
        ]

        sp_count = sum(1 for w in strong_pos if w in lower)
        mp_count = sum(1 for w in moderate_pos if w in lower)
        sn_count = sum(1 for w in strong_neg if w in lower)
        mn_count = sum(1 for w in moderate_neg if w in lower)

        pos_score = (sp_count * 0.4) + (mp_count * 0.2)
        neg_score = (sn_count * 0.4) + (mn_count * 0.2)

        diff = pos_score - neg_score
        if diff > 0:
            score = min(0.95, round(0.35 + diff * 0.45, 3))
            sentiment = "positive"
        elif diff < 0:
            score = max(-0.95, round(-0.35 + diff * 0.45, 3))
            sentiment = "negative"
        else:
            sentiment = "mixed"
            score = 0.1

        return {
            "sentiment": sentiment,
            "score": round(score, 2),
            "confidence": 0.72,
            "probabilities": {
                "positive": max(0.05, min(0.95, (score + 1.0) / 2.0)),
                "negative": max(0.05, min(0.95, (1.0 - score) / 2.0))
            },
            "engine": "Deterministic Heuristic"
        }

laya_engine = LayaEngine()

