# ChitraMaya — Demo Walkthrough

> **Agent-native image and video generation on AMD MI300X GPUs.**
> Built for the AMD Developer Hackathon (May 4–10, 2026).

---

## What is ChitraMaya?

ChitraMaya lets **AI agents** create personalized images and videos using **LoRA fine-tuned models** running on **AMD MI300X GPUs** via **ComfyUI**.

Instead of hand-driving ComfyUI's browser UI, agents call a simple HTTP API. ChitraMaya builds and submits ComfyUI workflows behind the scenes — making GPU-powered generation accessible to any AI agent.

---

## Architecture

```
┌────────────────────┐
│  AI Agent / User   │  ← Natural language requests
└────────┬───────────┘
         │ HTTP API
┌────────▼───────────┐
│  ChitraMaya API       │  ← FastAPI service (:8190)
│  (Control Plane)    │
│  + PostgreSQL       │
└────────┬───────────┘
         │ ComfyUI HTTP API
┌────────▼───────────┐
│  ComfyUI (:8188)   │  ← Headless workflow engine
│  AMD MI300X + ROCm  │
│  192 GB VRAM        │
└────────────────────┘
```

---

## Demo Flow

### 1. Health Check

```bash
curl -sS http://127.0.0.1:8190/api/health
```

Verify the backend is online and ComfyUI nodes are connected.

### 2. LoRA Training (Fine-Tuning on AMD)

Upload a dataset of character images:

```bash
curl -sS -X POST http://127.0.0.1:8190/api/datasets/upload \
  -F "name=rigo-identity" \
  -F "file=@rigo-dataset.zip"
```

Start LoRA training on MI300X:

```bash
curl -sS -X POST http://127.0.0.1:8190/api/lora-training/start \
  -H "Content-Type: application/json" \
  -d '{
    "job_name": "rigo_flux2_v1",
    "trigger_word": "Rigo",
    "dataset_path": "/root/chitramaya-training/datasets/rigo-identity",
    "base_model": "flux2",
    "steps": 1800
  }'
```

Monitor training progress:

```bash
curl -sS http://127.0.0.1:8190/api/lora-training/status
```

### 3. Character-Aware Image Generation

Generate an image using the trained LoRA:

```bash
curl -sS -X POST http://127.0.0.1:8190/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{
    "character": "rigo",
    "prompt": "in an Iron Man suit, cinematic portrait, dramatic lighting"
  }'
```

**Before LoRA:** Generic person → **After LoRA:** Recognizable character identity.

### 4. Video Generation

Image-to-video animation using Wan 2.2:

```bash
curl -sS -X POST http://127.0.0.1:8190/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "i2v",
    "character": "rigo",
    "prompt": "cinematic tracking shot, walking through neon rain",
    "width": 1280, "height": 720, "length": 121, "fps": 16
  }'
```

### 5. Multi-Shot Project Pipeline

This is the flagship feature. An agent creates a full cinematic sequence:

**Step 1: Create project**
```bash
curl -sS -X POST http://127.0.0.1:8190/api/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Suit Up",
    "description": "Rigo suits up in his workshop and steps out into the rain.",
    "aspect_ratio": "9:16",
    "duration_seconds": 30,
    "characters": ["rigo"]
  }'
```

**Step 2: Add scenes and shots**
```bash
# Scene 1: Workshop
curl -sS -X POST http://127.0.0.1:8190/api/projects/{prj_id}/scenes \
  -H "Content-Type: application/json" \
  -d '{"scene_number": 1, "title": "INT. WORKSHOP - NIGHT", "setting": "interior"}'

# Shot 1: Wide of character on platform
curl -sS -X POST http://127.0.0.1:8190/api/projects/{prj_id}/scenes/{scn_id}/shots \
  -H "Content-Type: application/json" \
  -d '{
    "shot_number": 1,
    "description": "Wide shot, Rigo standing on assembly platform, dramatic uplighting",
    "subtitle": "Every hero has a moment where they stop being ordinary.",
    "image_prompt": "Rigo, wide shot standing on industrial assembly platform, dramatic blue uplighting, cinematic",
    "motion_prompt": "slow push in, machinery activating around subject"
  }'
```

**Step 3: Generate images per shot**
```bash
curl -sS -X POST http://127.0.0.1:8190/api/projects/{prj_id}/scenes/{scn_id}/shots/{sht_id}/generate-image
```

**Step 4: Animate approved shots**
```bash
curl -sS -X POST http://127.0.0.1:8190/api/projects/{prj_id}/scenes/{scn_id}/shots/{sht_id}/animate
```

**Step 5: Render final video with subtitles**
```bash
curl -sS -X POST http://127.0.0.1:8190/api/projects/{prj_id}/render
```

### 6. Studio UI

The React-based Studio UI provides:
- **Gallery** — browse all generated images and videos
- **Generate** — sidebar panels for image/video generation
- **Projects** — visual director interface for multi-shot pipelines
- **Characters** — manage character profiles and LoRA bindings
- **Nodes** — GPU node status and health monitoring
- **LoRA Training** — live training progress and checkpoint management

---

## AMD GPU Stack

| Component | Spec |
|---|---|
| GPU | 1× AMD Instinct MI300X |
| VRAM | 192 GB |
| Software | ROCm 7.2 |
| PyTorch | ROCm-native wheels |
| Inference | ComfyUI (headless) |
| Training | Ostris AI Toolkit |
| Models | FLUX.2 dev (fp8), Wan 2.2 14B I2V/T2V |

---

## Why AMD?

- **192 GB VRAM** — run 14B parameter video models without quantization compromises
- **ROCm 7.2** — native PyTorch support, no CUDA dependency
- **Single-GPU simplicity** — no multi-GPU orchestration needed for even the largest open models
- **LoRA training** — fine-tune FLUX.2 and Wan 2.2 character models directly on MI300X

---

## Hackathon Tracks Addressed

| Track | How ChitraMaya Addresses It |
|---|---|
| **Track 1: AI Agents** | Agents drive generation via HTTP API + AGENT.md instructions |
| **Track 2: Fine-Tuning on AMD** | LoRA training on MI300X with AI Toolkit + ROCm |
| **Track 3: Vision & Multimodal** | Image generation (FLUX.2) + video generation (Wan 2.2) |

---

## Quick Start (Judge Self-Hosting)

```bash
# 1. Clone repo
git clone https://github.com/chitramaya-ai/chitramaya.git
cd chitramaya

# 2. Bootstrap AMD droplet
# (on a DigitalOcean MI300X ROCm droplet)
bash infra/bootstrap.sh

# 3. Install model stacks
bash infra/setup-image-models.sh
bash infra/setup-video-models.sh
bash infra/setup-training-env.sh

# 4. Start API
pip install -r requirements.txt
PYTHONPATH=core uvicorn chitramaya.server:app --host 0.0.0.0 --port 8190

# 5. Verify
curl http://127.0.0.1:8190/api/health
```

---

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Backend + GPU node status |
| GET | `/api/characters` | List characters |
| POST | `/api/characters` | Create character |
| POST | `/api/image/generate` | Generate image (FLUX.2 + LoRA) |
| POST | `/api/video/generate` | Generate video (Wan 2.2 T2V/I2V) |
| POST | `/api/images/upload` | Upload image for I2V |
| GET | `/api/jobs` | List active jobs |
| GET | `/api/jobs/{id}` | Job status + outputs |
| GET | `/api/listing` | Media gallery |
| POST | `/api/projects` | Create project |
| POST | `/api/projects/{id}/scenes` | Add scene |
| POST | `/api/projects/{id}/scenes/{id}/shots` | Add shot |
| POST | `.../shots/{id}/generate-image` | Generate shot image |
| POST | `.../shots/{id}/animate` | Animate shot |
| POST | `/api/projects/{id}/render` | Render final video |
| POST | `/api/lora-training/start` | Start LoRA training |
| GET | `/api/lora-training/status` | Training progress |
| GET | `/api/lora-training/checkpoints` | List checkpoints |
| POST | `/api/lora-training/stop` | Stop training |
| POST | `/api/datasets/upload` | Upload training dataset |
| GET | `/api/datasets` | List datasets |
| POST | `/api/agent/chat` | Agent chat with tool dispatch |
| GET | `/api/nodes` | GPU node status |

---

## License

Apache 2.0
