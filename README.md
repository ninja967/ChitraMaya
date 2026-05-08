# ChitraMaya

Agent-native image and video generation using ComfyUI as a headless execution engine on AMD MI300X GPUs.

ChitraMaya is designed for AI agents first. Agents call a simple HTTP API; ChitraMaya builds and submits ComfyUI workflows behind the scenes. ComfyUI's browser UI is not part of the workflow.

> **📋 For a full demo walkthrough, see [SHOWCASE.md](SHOWCASE.md).**
> **🤖 For agent integration instructions, see [AGENT.md](AGENT.md).**

## Features

| Feature | Status | Description |
|---|---|---|
| **Image Generation** | ✅ | FLUX.2 dev with character LoRA support |
| **Video Generation** | ✅ | Wan 2.2 14B text-to-video and image-to-video |
| **LoRA Training** | ✅ | Start/stop/monitor training via API (AI Toolkit + ROCm) |
| **Dataset Management** | ✅ | Upload/list training datasets via API |
| **Character System** | ✅ | Create characters, bind LoRAs, use trigger words |
| **Projects Pipeline** | ✅ | Structured multi-shot cinematic workflow |
| **Agent Chat** | ✅ | Tool-dispatching agent endpoint for assistant-ui |
| **Studio UI** | ✅ | React/Vite frontend with gallery, projects, characters |
| **Job Tracking** | ✅ | Real-time WebSocket bridge to ComfyUI |
| **GPU Monitoring** | ✅ | Multi-node health checks and status |
| **HF Space** | ✅ | Docker-based proxy for Hugging Face deployment |
| **AMD Infrastructure** | ✅ | Complete bootstrap scripts for MI300X droplets |

## Quick Start

```bash
# 1. Clone
git clone https://github.com/chitramaya-ai/chitramaya.git && cd chitramaya

# 2. Install Python deps
python3 -m venv .venv && . .venv/bin/activate
pip install -r requirements.txt

# 3. Start API (point at a ComfyUI server)
export COMFY_URL=http://127.0.0.1:8188
PYTHONPATH=core uvicorn chitramaya.server:app --host 0.0.0.0 --port 8190

# 4. Verify
curl http://127.0.0.1:8190/api/health
```

## API Reference

| Service | Port |
| --- | ---: |
| ComfyUI | `8188` |
| ChitraMaya API | `8190` |

### Core Endpoints

```bash
# Health
curl -sS http://127.0.0.1:8190/api/health

# Characters
curl -sS http://127.0.0.1:8190/api/characters

# Image generation (FLUX.2 + LoRA)
curl -sS -X POST http://127.0.0.1:8190/api/image/generate \
  -H "Content-Type: application/json" \
  -d '{"character": "rigo", "prompt": "portrait, cinematic lighting"}'

# Video generation (Wan 2.2)
curl -sS -X POST http://127.0.0.1:8190/api/video/generate \
  -H "Content-Type: application/json" \
  -d '{"mode": "t2v", "prompt": "cinematic tracking shot through a city at night", "width": 1280, "height": 720}'

# Job status
curl -sS http://127.0.0.1:8190/api/jobs/<prompt_id>
```

### LoRA Training

```bash
# Upload dataset
curl -sS -X POST http://127.0.0.1:8190/api/datasets/upload \
  -F "name=my-character" -F "file=@dataset.zip"

# Start training
curl -sS -X POST http://127.0.0.1:8190/api/lora-training/start \
  -H "Content-Type: application/json" \
  -d '{"job_name": "my_lora", "trigger_word": "MyChar", "base_model": "flux2"}'

# Monitor
curl -sS http://127.0.0.1:8190/api/lora-training/status
curl -sS http://127.0.0.1:8190/api/lora-training/checkpoints
```

### Projects (Multi-Shot Pipeline)

```bash
# Create project → Add scenes → Add shots → Generate images → Animate → Render
curl -sS -X POST http://127.0.0.1:8190/api/projects \
  -H "Content-Type: application/json" \
  -d '{"title": "My Short Film", "characters": ["rigo"]}'
```

## Repo Structure

```text
core/chitramaya/           # FastAPI service, workflow builders, DB layer
dashboard/                 # React/Vite Studio UI
hosting/                   # Hugging Face Space Docker proxy
infra/                     # AMD droplet bootstrap & model install
finetune/                  # AI Toolkit YAML config templates
schema/                    # PostgreSQL schema migrations
docs/                      # Project briefs, hackathon notes, ROCm research
AGENT.md                   # Agent integration instructions
SHOWCASE.md                # Judge demo walkthrough
```

## Hackathon Infrastructure

Built for the **AMD Developer Hackathon** (May 4–10, 2026).

| Resource | Spec |
| --- | --- |
| GPU | 1× AMD Instinct MI300X |
| VRAM | 192 GB |
| vCPU | 20 |
| RAM | 240 GB |
| Boot disk | 720 GB NVMe SSD |
| Scratch disk | 5 TB NVMe SSD |
| GPU software | ROCm 7.2 image |
| Cost | ~$1.99/GPU-hour |

### AMD Droplet Setup

```bash
bash infra/bootstrap.sh        # Bootstrap ROCm + ComfyUI
bash infra/setup-image-models.sh    # Download FLUX.2 models
bash infra/setup-video-models.sh    # Download Wan 2.2 models
bash infra/setup-training-env.sh     # Install training stack
```

## Hackathon Tracks

| Track | How ChitraMaya Addresses It |
|---|---|
| **Track 1: AI Agents** | Agents drive generation via HTTP API + AGENT.md |
| **Track 2: Fine-Tuning** | LoRA training on MI300X with AI Toolkit + ROCm |
| **Track 3: Vision/Multimodal** | FLUX.2 images + Wan 2.2 video generation |

## License

Apache 2.0
