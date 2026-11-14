# ChitraMaya Elite Upgrade Plan

## Product Positioning

ChitraMaya should present as an agent-directed visual production console, not a generic prompt gallery. The winning story is: an AI agent plans structured media, AMD GPUs execute training and rendering, and a human reviews each stage before publish.

## Track Fit

| Track | ChitraMaya Angle |
| --- | --- |
| Agentic workflows | API-first control plane where agents create projects, scenes, shots, render jobs, and training jobs. |
| AMD GPU fine-tuning | Owned identity LoRA training on AMD MI300X with ROCm and checkpoint tracking. |
| Vision and multimodal AI | Image generation, image-to-video, text-to-video, storyboard review, and media publishing. |
| Hugging Face deployment | Public Space as the demo surface, backed by cloud GPU APIs and reproducible deployment scripts. |

## High-Impact Upgrades

1. Add a real agent run log that records every tool call, payload, GPU job, and output asset.
2. Add a project timeline view with scene duration, shot status, generated image, generated clip, and approval state.
3. Add a LoRA training wizard with dataset upload, consent checkbox, trigger word validation, progress, and checkpoint selection.
4. Add GPU observability: node status, queue depth, VRAM, render duration, failure rate, and per-workflow cost/time estimates.
5. Add one-click demo presets for judge evaluation: product reel, cinematic short, identity portrait pack, and image-to-video clip.
6. Add a final assembly pipeline: approved clips stitched into one MP4 with captions and export metadata.
7. Add a public audit page showing that all demo identities are owned or synthetic.
8. Add model/workflow comparison cards: FLUX image, Wan text-to-video, Wan image-to-video, and LoRA variants.
9. Add webhook or polling events so the Hugging Face UI updates job progress without manual refresh.
10. Add a submission-ready case study page with architecture diagram, AMD-specific optimizations, and measurable output.

## Development Plan

### Phase 1: Demo Credibility

- Replace marketing-style UI copy with pipeline language.
- Add live health summary for API, ComfyUI, jobs, and training.
- Add curated demo presets that queue real API payloads.
- Keep all reference names, external project names, and private tokens out of source and history.

### Phase 2: Agent Proof

- Store agent action traces in the backend.
- Show a timeline of decisions: prompt parsed, project created, shot generated, clip animated.
- Add approval gates before expensive GPU actions.

### Phase 3: Fine-Tuning Proof

- Make dataset upload and LoRA training first-class in the UI.
- Add training logs, progress charts, checkpoint browser, and model-card-style output documentation.
- Enforce identity ownership language and consent metadata for every identity record.

### Phase 4: Final Output

- Add clip assembly, captions, render presets, and downloadable project packages.
- Add a public showcase mode with selected outputs, architecture, and benchmark metrics.
