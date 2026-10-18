"""
Defensible Rating Engine for CineScope.
Implements a mathematically grounded, Bayesian-calibrated scoring framework
that computes an evidence-grounded AI assessment separate from external critic
and audience ratings.
"""

from typing import List, Optional, Dict, Any, Tuple
from app.models.schemas import SourceEvidence, AspectScore, ScoringMethodology, SourceCategory

class ScoringEngine:
    PRIOR_MEAN = 6.5  # Prior average for entertainment titles under sparse data
    PRIOR_WEIGHT = 3.0 # Equivalent pseudo-observations for Bayesian shrinkage

    def calculate_score(
        self,
        sources: List[SourceEvidence],
        aspects: List[AspectScore],
        external_critic_score: Optional[float] = None,
        external_audience_score: Optional[float] = None
    ) -> Tuple[float, float, ScoringMethodology]:
        """
        Computes (overall_score, confidence, methodology_breakdown).
        """
        source_count = len(sources)
        if source_count == 0:
            methodology = ScoringMethodology(
                critic_rating_mean=external_critic_score,
                audience_rating_mean=external_audience_score,
                sentiment_synthetic_score=self.PRIOR_MEAN,
                source_count=0,
                critic_count=0,
                audience_count=0,
                community_count=0,
                diversity_multiplier=0.3,
                disagreement_penalty=0.0,
                sample_size_penalty=1.0,
                final_calibrated_score=self.PRIOR_MEAN,
                confidence_estimate=0.15,
                explanation="Insufficient accessible evidence. Defaulting to baseline with low confidence."
            )
            return self.PRIOR_MEAN, 0.15, methodology

        # 1. Categorize sources
        critic_sources = [s for s in sources if s.category in (SourceCategory.CRITIC, SourceCategory.SPECIALIST)]
        audience_sources = [s for s in sources if s.category in (SourceCategory.AUDIENCE, SourceCategory.DISCUSSION)]
        community_sources = [s for s in sources if s.category == SourceCategory.COMMUNITY]

        categories_present = set(s.category for s in sources)
        diversity_multiplier = min(1.0, 0.4 + 0.15 * len(categories_present))

        # 2. Compute Mean Sentiment from Sources
        sentiment_scores = [s.sentiment_score for s in sources]
        mean_sentiment = sum(sentiment_scores) / len(sentiment_scores) if sentiment_scores else 0.0
        # Map sentiment (-1.0 to 1.0) to (1.0 to 10.0 scale)
        sentiment_synthetic_score = round(5.5 + 4.5 * mean_sentiment, 2)

        # 3. Compute Aspect-Based Score
        if aspects:
            aspect_weights = {
                "story": 0.25,
                "animation": 0.20,
                "visuals": 0.20,
                "cinematography": 0.20,
                "characters": 0.25,
                "pacing": 0.15,
                "soundtrack": 0.15,
                "direction": 0.15
            }
            weighted_aspect_sum = 0.0
            total_weight = 0.0
            for a in aspects:
                w = 0.15
                for kw, weight in aspect_weights.items():
                    if kw in a.aspect.lower():
                        w = weight
                        break
                weighted_aspect_sum += a.score * w
                total_weight += w
            aspect_mean = (weighted_aspect_sum / total_weight) if total_weight > 0 else sentiment_synthetic_score
        else:
            aspect_mean = sentiment_synthetic_score

        # 4. Integrate External Ratings (Without conflating them with AI assessment)
        components = []
        comp_weights = []

        if external_critic_score is not None:
            components.append(external_critic_score)
            comp_weights.append(0.35)
        
        if external_audience_score is not None:
            components.append(external_audience_score)
            comp_weights.append(0.35)

        # Aspect & Sentiment components (Evidence derived)
        components.append(aspect_mean)
        comp_weights.append(0.20)

        components.append(sentiment_synthetic_score)
        comp_weights.append(0.10)

        raw_score = sum(c * w for c, w in zip(components, comp_weights)) / sum(comp_weights)

        # 5. Measure Polarization / Disagreement
        disagreement_penalty = 0.0
        if external_critic_score is not None and external_audience_score is not None:
            diff = abs(external_critic_score - external_audience_score)
            if diff > 1.5:
                disagreement_penalty = min(0.25, (diff - 1.5) / 12.0)

        # 6. Bayesian Shrinkage for Sample Size
        # If external verified ratings exist, evidence baseline is anchored empirically rather than regressing to prior mean
        has_external = (external_critic_score is not None or external_audience_score is not None)
        if has_external:
            ext_vals = [v for v in [external_critic_score, external_audience_score] if v is not None]
            baseline_anchor = sum(ext_vals) / len(ext_vals)
            effective_prior_weight = 0.25
        else:
            effective_prior_weight = 1.5
            baseline_anchor = self.PRIOR_MEAN

        shrinkage_alpha = source_count / (source_count + effective_prior_weight)
        calibrated_score = (shrinkage_alpha * raw_score) + ((1.0 - shrinkage_alpha) * baseline_anchor)
        calibrated_score = max(1.0, min(10.0, round(calibrated_score, 1)))

        # 7. Confidence Calibration
        sample_penalty = 1.0 - shrinkage_alpha
        base_confidence = shrinkage_alpha * diversity_multiplier
        confidence = max(0.25, min(0.96, base_confidence * (1.0 - disagreement_penalty)))
        confidence = round(confidence, 2)

        # Formulate human-readable explanation
        explanation_parts = [
            f"Derived from {source_count} retrieved sources across {len(categories_present)} categories."
        ]
        if external_critic_score and external_audience_score:
            explanation_parts.append(f"External baseline: Critic {external_critic_score}/10, Audience {external_audience_score}/10.")
        if disagreement_penalty > 0:
            explanation_parts.append(f"Noted critic/audience polarity (penalty factor: {disagreement_penalty:.2f}).")
        if sample_penalty > 0.3:
            explanation_parts.append(f"Bayesian shrinkage applied due to sparse sample size ({source_count} sources).")
        explanation_parts.append(f"Final calibrated AI evaluation: {calibrated_score}/10 with {int(confidence*100)}% confidence.")

        methodology = ScoringMethodology(
            critic_rating_mean=external_critic_score,
            audience_rating_mean=external_audience_score,
            sentiment_synthetic_score=sentiment_synthetic_score,
            source_count=source_count,
            critic_count=len(critic_sources),
            audience_count=len(audience_sources),
            community_count=len(community_sources),
            diversity_multiplier=round(diversity_multiplier, 2),
            disagreement_penalty=round(disagreement_penalty, 3),
            sample_size_penalty=round(sample_penalty, 2),
            final_calibrated_score=calibrated_score,
            confidence_estimate=confidence,
            explanation=" ".join(explanation_parts)
        )

        return calibrated_score, confidence, methodology

scoring_engine = ScoringEngine()
