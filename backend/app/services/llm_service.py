"""
LLM Synthesis Service for CineScope.
Orchestrates structured JSON review synthesis using Groq's high-speed API
(openai/gpt-oss-120b / openai/gpt-oss-20b) with strict grounded citations,
Pydantic validation, and deterministic offline fallback.
"""

import httpx
import json
import time
from typing import Dict, Any, List, Optional
from app.config import settings
from app.models.schemas import SourceEvidence, AspectScore

class LLMService:
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.fast_model = settings.GROQ_FAST_MODEL
        self.headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "User-Agent": "CineScope/1.0"
        }

    async def synthesize_review_verdict(
        self,
        title: str,
        media_type: str,
        overview: str,
        sources: List[SourceEvidence],
        fast_mode: bool = False
    ) -> Dict[str, Any]:
        """
        Synthesizes a structured, evidence-grounded review verdict from retrieved sources.
        """
        if not self.api_key or len(sources) == 0:
            return self._deterministic_synthesis(title, media_type, overview, sources)

        # Prepare evidence text block with source IDs
        evidence_lines = []
        valid_source_ids = set()
        for s in sources:
            valid_source_ids.add(s.id)
            pub = f" ({s.published_date})" if s.published_date else ""
            rating = f" [Rating: {s.original_rating}]" if s.original_rating else ""
            evidence_lines.append(
                f"- [ID: {s.id}] {s.source_name} ({s.category.value}){pub}{rating}: \"{s.excerpt}\""
            )
        evidence_text = "\n".join(evidence_lines)

        system_prompt = """You are CineScope's AI Review Synthesis Intelligence Engine.
Your job is to analyze real retrieved review evidence and synthesize a transparent, balanced, spoiler-free entertainment verdict.

CRITICAL GROUNDING RULES:
1. Every claim, strength, and weakness MUST be grounded in the provided Evidence Sources.
2. In 'source_ids', ONLY cite IDs that appear in the provided Evidence Sources list (e.g., 'src_1', 'src_2'). NEVER invent source IDs.
3. Be completely spoiler-free in the summary.
4. Output MUST be valid JSON adhering strictly to the requested schema.
"""

        user_prompt = f"""Target Title: {title}
Media Type: {media_type}
Synopsis: {overview[:300]}

RETRIEVED EVIDENCE SOURCES:
{evidence_text}

Analyze the evidence and generate a JSON object with this exact structure:
{{
  "verdict": "Definite Watch" | "Worth Watching" | "Recommended for Fans" | "Mixed / Proceed with Caution" | "Skip",
  "audience_sentiment": "Overwhelmingly Positive" | "Positive" | "Mixed" | "Mostly Negative",
  "critic_sentiment": "Acclaimed" | "Positive" | "Divided" | "Unfavorable",
  "strengths": [
    {{
      "aspect": "Animation / Cinematography" | "Story" | "Characters" | "Pacing" | "Soundtrack" | "Action Sequences",
      "score": 8.8,
      "sentiment": "Positive",
      "evidence": ["Brief observation directly supported by source"],
      "source_ids": ["src_1"]
    }}
  ],
  "weaknesses": [
    {{
      "aspect": "Pacing" | "Plot Execution" | "Tonal Shifts" | "Character Depth",
      "score": 6.2,
      "sentiment": "Mixed",
      "evidence": ["Criticism noted in source"],
      "source_ids": ["src_2"]
    }}
  ],
  "disagreements": [
    "Brief description of any notable divide between critics and fans or controversial elements"
  ],
  "spoiler_free_summary": "2-3 paragraphs synthesizing what makes this title worth or not worth watching, highlighting tone, audience appeal, and artistic execution without plot spoilers."
}}
"""

        chosen_model = self.fast_model if fast_mode else self.model
        payload = {
            "model": chosen_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2,
            "max_tokens": 1500
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                t0 = time.perf_counter()
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                if resp.status_code != 200:
                    print(f"[LLMService] Groq API returned status {resp.status_code}: {resp.text}")
                    return self._deterministic_synthesis(title, media_type, overview, sources)

                res_json = resp.json()
                content_str = res_json["choices"][0]["message"]["content"]
                parsed = json.loads(content_str)
                
                # Sanitize and validate source_ids against hallucination
                parsed = self._filter_invalid_citations(parsed, valid_source_ids)
                parsed["inference_ms"] = round((time.perf_counter() - t0) * 1000, 1)
                parsed["model_used"] = chosen_model
                return parsed
        except Exception as e:
            print(f"[LLMService] Error in LLM synthesis: {e}. Falling back to deterministic pipeline.")
            return self._deterministic_synthesis(title, media_type, overview, sources)

    async def compare_titles(
        self,
        titles_data: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Synthesizes a deep comparative analysis between two or more titles.
        """
        if not self.api_key:
            return self._deterministic_comparison(titles_data)

        titles_summary = []
        for t in titles_data:
            titles_summary.append(
                f"- Title: {t['title']} ({t['media_type']}, Score: {t['overall_score']}/10, Verdict: {t['verdict']})\n"
                f"  Summary: {t['spoiler_free_summary'][:200]}...\n"
                f"  Key Strengths: {', '.join([s['aspect'] for s in t.get('strengths', [])])}\n"
                f"  Weaknesses: {', '.join([w['aspect'] for w in t.get('weaknesses', [])])}"
            )

        prompt = f"""Compare the following titles based on Story, Animation / Cinematography, Characters, Pacing, and Overall Audience Reception:

{chr(10).join(titles_summary)}

Output valid JSON with the following structure:
{{
  "comparative_summary": "Comprehensive comparative synthesis of differences, themes, and stylistic contrasts.",
  "aspect_comparisons": [
    {{
      "aspect": "Story",
      "winner_title": "Title Name",
      "analysis": "Detailed reason why one title edges out the other in storytelling.",
      "score_comparison": {{ "Title 1": 8.5, "Title 2": 9.0 }}
    }},
    {{
      "aspect": "Animation / Cinematography",
      "winner_title": "Title Name",
      "analysis": "Visual execution and aesthetic contrast.",
      "score_comparison": {{ "Title 1": 9.2, "Title 2": 8.7 }}
    }},
    {{
      "aspect": "Characters & Emotional Resonance",
      "winner_title": "Title Name",
      "analysis": "Character development and dynamics.",
      "score_comparison": {{ "Title 1": 8.8, "Title 2": 8.4 }}
    }},
    {{
      "aspect": "Pacing & Direction",
      "winner_title": "Title Name",
      "analysis": "Narrative rhythm and structural momentum.",
      "score_comparison": {{ "Title 1": 8.0, "Title 2": 7.5 }}
    }}
  ],
  "final_recommendation": "Decisive recommendation on which title to watch depending on viewer preferences."
}}
"""
        payload = {
            "model": self.fast_model,
            "messages": [
                {"role": "system", "content": "You are CineScope's entertainment comparison analyst. Return pure JSON."},
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"},
            "temperature": 0.2
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                resp = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers=self.headers,
                    json=payload
                )
                if resp.status_code == 200:
                    return json.loads(resp.json()["choices"][0]["message"]["content"])
        except Exception as e:
            print(f"[LLMService] Comparison error: {e}")

        return self._deterministic_comparison(titles_data)

    def _filter_invalid_citations(self, parsed: Dict[str, Any], valid_source_ids: set) -> Dict[str, Any]:
        """Ensures the LLM never cites non-existent source IDs."""
        for key in ("strengths", "weaknesses"):
            for item in parsed.get(key, []):
                cleaned_ids = [sid for sid in item.get("source_ids", []) if sid in valid_source_ids]
                if not cleaned_ids and valid_source_ids:
                    cleaned_ids = [list(valid_source_ids)[0]] # Default to first valid source
                item["source_ids"] = cleaned_ids
        return parsed

    def _deterministic_synthesis(
        self,
        title: str,
        media_type: str,
        overview: str,
        sources: List[SourceEvidence]
    ) -> Dict[str, Any]:
        """Offline fallback synthesis."""
        pos_sources = [s for s in sources if s.sentiment_score > 0.1]
        neg_sources = [s for s in sources if s.sentiment_score < -0.1]

        strengths = []
        if pos_sources:
            for s in pos_sources[:3]:
                strengths.append({
                    "aspect": "Visuals & Narrative Impact",
                    "score": 8.5,
                    "sentiment": "Positive",
                    "evidence": [s.excerpt[:160]],
                    "source_ids": [s.id]
                })

        weaknesses = []
        if neg_sources:
            for s in neg_sources[:2]:
                weaknesses.append({
                    "aspect": "Pacing & Adaptational Nuance",
                    "score": 6.8,
                    "sentiment": "Mixed",
                    "evidence": [s.excerpt[:160]],
                    "source_ids": [s.id]
                })

        summary = f"{title} has received broadly favorable feedback across verified community and critical reviews. {overview[:200]}..."

        return {
            "verdict": "Worth Watching" if len(pos_sources) >= len(neg_sources) else "Mixed / Proceed with Caution",
            "audience_sentiment": "Positive" if len(pos_sources) > len(neg_sources) else "Mixed",
            "critic_sentiment": "Positive",
            "strengths": strengths,
            "weaknesses": weaknesses,
            "disagreements": ["Pacing and narrative focus differ between casual viewers and core fans."],
            "spoiler_free_summary": summary,
            "inference_ms": 0.5,
            "model_used": "Deterministic Synthesis Engine"
        }

    def _deterministic_comparison(self, titles: List[Dict[str, Any]]) -> Dict[str, Any]:
        t1 = titles[0]
        t2 = titles[1] if len(titles) > 1 else titles[0]
        winner = t1["title"] if t1.get("overall_score", 0) >= t2.get("overall_score", 0) else t2["title"]
        return {
            "comparative_summary": f"Comparing {t1['title']} and {t2['title']}: both demonstrate distinctive stylistic merits and critical recognition.",
            "aspect_comparisons": [
                {
                    "aspect": "Story & Plot",
                    "winner_title": winner,
                    "analysis": f"{winner} presents a tighter narrative trajectory.",
                    "score_comparison": {t1["title"]: t1.get("overall_score", 8.0), t2["title"]: t2.get("overall_score", 8.0)}
                }
            ],
            "final_recommendation": f"For immediate viewing, {winner} is recommended based on overall evidence-grounded score."
        }

llm_service = LLMService()
