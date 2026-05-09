---
title: ChitraMaya Control Room
emoji: 🎬
colorFrom: green
colorTo: gray
sdk: docker
app_port: 7860
pinned: true
tags:
  - amd
  - amd-hackathon-2026
  - comfyui
  - video-generation
  - lora
  - text-to-video
  - image-to-video
  - text-to-image
  - flux
  - wan-video
  - agentic-ai
---

# ChitraMaya Control Room

Hosted ChitraMaya production console for the AMD MI300X hackathon demo.

This Space serves the React/Vite control room UI and proxies API/media requests to the ChitraMaya engine API.

## Required Space Secret

| Secret | Description |
| --- | --- |
| `CHITRAMAYA_API_URL` | URL for the ChitraMaya API |
