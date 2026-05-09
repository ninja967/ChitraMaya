# ChitraMaya Engine Training

Scripts/config templates for disposable AMD MI300X droplets.

## Install AI Toolkit on the droplet

After `infra/bootstrap.sh` finishes on a fresh droplet:

```bash
cd /root/chitramaya
bash infra/setup-training-env.sh
```

The installer creates:

- `/root/ai-toolkit` — Ostris AI Toolkit checkout
- `/root/ai-toolkit-venv` — isolated ROCm Python venv
- `/root/chitramaya-training` — datasets/configs/output workspace
- `/root/chitramaya-training/run-ai-toolkit.sh` — CLI runner

## Train

Copy a config into `/root/chitramaya-training/config/`, put media in `/root/chitramaya-training/datasets/...`, then:

```bash
/root/chitramaya-training/run-ai-toolkit.sh /root/chitramaya-training/config/<job>.yaml
```

## Optional UI

The installer creates but does not start:

```bash
ai-toolkit-ui.service
```

Before exposing it, set a real `AI_TOOLKIT_AUTH` value in the service or an override.
