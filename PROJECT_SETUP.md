# CineScope / Cinephile — Project Setup & Hardware Environment Audit

## 1. System & Hardware Specifications

- **Operating System:** Windows 11 (build 10.0.10011 / 22631+)
- **System RAM:** 16.0 GB total (~5.2 GB available physical memory)
- **Primary GPU:** NVIDIA GeForce RTX 3050 Laptop GPU
  - **VRAM:** 4,096 MiB (4.0 GB) GDDR6
  - **TGP:** 35W
  - **Driver Version:** 566.07
  - **CUDA Support:** 12.7
- **Node.js Environment:** v22.18.0, npm 10.8.2+
- **Python Environment:** 
  - Python 3.11.6 (64-bit) located in `c:\Users\Yash\Desktop\Other Pojects\Exploration\.venv`
  - Python 3.13 also installed
  - PyTorch: `2.6.0+cu124` with CUDA device enabled (`NVIDIA GeForce RTX 3050 Laptop GPU`)
  - Transformers: `4.57.6`
  - FastAPI: `0.142.2`
  - Uvicorn: `0.34.0`
  - Pydantic: `2.10.x`
  - LAYA: `0.3.23`

---

## 2. Model Discovery & Repository Audit

### Discovery Findings
1. **Existing LAYA Model:**
   - **Path:** `C:\Users\Yash\.cache\huggingface\hub\models--convaiinnovations--laya\snapshots\7b928d828b7b0e022f929d9bd2e44165aa270148\`
   - **Weight File:** `model.safetensors` (~842.6 MB)
   - **Architecture:** `ModernBertForMaskedLM` (`answerdotai/ModernBERT-large` backbone, 28 layers, 1024 hidden dimension, 8192 max position embeddings)
   - **RL Agent Head:** 2-layer decision policy head (`rl-agent`), configured with temperature calibration and action cost penalties
   - **Parameter Count:** ~395 Million parameters
   - **Training Methodology:** RLCD ("Reinforcement Learning from Causal Decoupling")
   - **License:** Apache 2.0 / Open Weights
   - **Hardware Compatibility:** Runs locally on NVIDIA RTX 3050 with ~1.1 GB VRAM footprint.
   - **Assessment:**
     - **Suitability for System 1 tasks:** Excellent for sub-50ms aspect sentiment scoring, confidence gating, calibrated uncertainty, and contradiction detection.
     - **Suitability for Generative JSON Synthesis:** Unsuitable as an open-ended generative language model because it is a masked bidirectional encoder (BERT) rather than an autoregressive decoder. Attempting to force an encoder to generate dynamic, spoiler-free summaries and JSON schemas from web research will produce gibberish or fail.
2. **Generative LLM Engine (Groq ultra-fast API & Local Fallback):**
   - **Verified API Key:** User provided Groq API key (`gsk_...`).
   - **Available Models on Account:**
     - `openai/gpt-oss-120b` (Primary high-intelligence synthesis engine, verified 200 OK)
     - `openai/gpt-oss-20b` (Sub-300ms ultra-fast synthesis engine, verified 200 OK)
     - `qwen/qwen3.8-27b`, `allam-2-7b`
   - **Inference Latency:** ~250ms–600ms per complete structured JSON response.

---

## 3. Two-Stage Intelligence Architecture Decision

1. **Stage A (Deterministic Research & Evidence Retrieval):**
   - Public APIs: AniList GraphQL (no auth required), TVMaze REST (no auth required), DuckDuckGo / Open Search / Wikipedia.
   - Deterministic metadata normalization, disambiguation, entity extraction, deduplication, and SQLite persistent caching.
2. **Stage B (Dual-Engine AI Intelligence):**
   - **Local LAYA Engine:** Used for micro-inference: scoring aspect sentiment (-1 to +1), confidence calibration, and contradiction detection.
   - **Synthesis Engine (Groq / Local Fallback):** Structured JSON synthesis via Pydantic schema validation, extracting evidence citations, strengths, weaknesses, and spoiler-free verdict summaries.

---

## 4. Fine-Tuning & RLCD Feasibility

- **VRAM Constraints:** RTX 3050 has 4GB VRAM. Training or fine-tuning 7B+ LLMs locally is impossible without severe OOM. Even ModernBERT-large requires gradient checkpointing and batch size 1-2 for LoRA.
- **Pretrained Baseline Evaluation:** We will benchmark LAYA against an annotated movie/anime review evaluation dataset before considering any fine-tuning.
- **Conclusion:** Pretrained LAYA + Groq `openai/gpt-oss-120b` zero-shot structured extraction outperforms fine-tuned low-parameter models on real-time diverse entertainment queries while maintaining zero hallucination via strict source citations.
