import { useEffect, useMemo, useState } from "react";
import type { LoraCheckpoint } from "../../models";

interface GenerateTabProps {
  checkpoints: LoraCheckpoint[];
  onQueued?: () => void;
}

type GenerateMode = "image" | "t2v" | "i2v";

interface GenerateResponse {
  ok: boolean;
  prompt_id?: string | null;
  checkpoint?: string | null;
  lora_name?: string | null;
  mode?: string;
  node_errors?: Record<string, unknown> | null;
}

interface CharacterSummary {
  id: string;
  name: string;
  trigger: string | null;
  loras: { workflow?: string; name?: string; strength?: number }[];
  source_images: string[];
}

interface UploadResponse {
  ok: boolean;
  image?: string | null;
}

const DEFAULT_IMAGE_PROMPT =
  "photorealistic editorial portrait inside a compact media operations room, video timeline screens in the background, confident subject, controlled studio key light, 85mm lens, shallow depth of field, realistic texture and sharp detail";
const DEFAULT_VIDEO_PROMPT =
  "cinematic tracking shot through a dense city street at night, controlled lighting, clear subject motion, polished short-form video style";

function checkpointLabel(checkpoint: LoraCheckpoint) {
  if (checkpoint.step == null) return `${checkpoint.name} · final`;
  return `${checkpoint.name} · step ${checkpoint.step.toLocaleString()}`;
}

function slugPrompt(prompt: string) {
  const slug = prompt
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);
  return slug || "generation";
}

function outputPrefix(mode: GenerateMode, prompt: string) {
  const bucket = mode === "image" ? "images" : "videos";
  return `${bucket}/${slugPrompt(prompt)}-${Date.now()}`;
}

export function GenerateTab({ checkpoints, onQueued }: GenerateTabProps) {
  const latestCheckpoint = useMemo(() => {
    const final = checkpoints.find((checkpoint) => checkpoint.step == null);
    return final?.name || checkpoints[checkpoints.length - 1]?.name || "latest";
  }, [checkpoints]);

  const [mode, setMode] = useState<GenerateMode>("image");
  const [characters, setCharacters] = useState<CharacterSummary[]>([]);
  const [characterId, setCharacterId] = useState("none");
  const [checkpoint, setCheckpoint] = useState("base");
  const [prompt, setPrompt] = useState(DEFAULT_IMAGE_PROMPT);
  const [sourceImage, setSourceImage] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [width, setWidth] = useState(1248);
  const [height, setHeight] = useState(832);
  const [steps, setSteps] = useState(20);
  const [guidance, setGuidance] = useState(4);
  const [loraStrength, setLoraStrength] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/characters")
      .then((response) => response.json())
      .then((data) => setCharacters(data.characters || []))
      .catch(() => setCharacters([]));
  }, []);

  const selectedCharacter = characters.find((character) => character.id === characterId);
  const selectedCharacterHasImageLora = Boolean(selectedCharacter?.loras?.some((lora) => lora.workflow === "flux2_lora"));

  function selectMode(nextMode: GenerateMode) {
    setMode(nextMode);
    setPrompt(nextMode === "image" ? DEFAULT_IMAGE_PROMPT : DEFAULT_VIDEO_PROMPT);
    setResult(null);
    setError(null);
  }

  async function uploadSourceImage() {
    if (!uploadFile) {
      setError("Choose an image file to upload first.");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const form = new FormData();
      form.append("file", uploadFile);

      const response = await fetch("/api/images/upload", {
        method: "POST",
        body: form,
      });

      const data = await response.json().catch(() => ({} as UploadResponse));
      if (!response.ok || !data.image) {
        throw new Error((data as { detail?: string }).detail || "Failed to upload source image.");
      }

      setSourceImage(data.image);
      setUploadFile(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) {
      setError("Prompt is required.");
      return;
    }
    if (mode === "i2v" && !sourceImage.trim()) {
      setError("Image-to-video needs a source image path from the gallery, like images/example.png.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setResult(null);

    try {
      const filenamePrefix = outputPrefix(mode, cleanPrompt);
      const endpoint = mode === "image" ? "/api/image/generate" : "/api/video/generate";
      const useCharacter = characterId !== "none";
      const useCheckpoint = !useCharacter && checkpoint !== "base";
      const body = mode === "image"
        ? {
            workflow: "flux2_lora",
            character: useCharacter ? characterId : undefined,
            checkpoint: useCheckpoint ? (checkpoint || latestCheckpoint) : undefined,
            prompt: cleanPrompt,
            width,
            height,
            steps,
            guidance,
            lora_strength: loraStrength,
            filename_prefix: filenamePrefix,
            submit: true,
          }
        : {
            mode,
            character: useCharacter ? characterId : undefined,
            image: mode === "i2v" ? sourceImage.trim() : undefined,
            prompt: cleanPrompt,
            width,
            height,
            filename_prefix: filenamePrefix,
            submit: true,
          };

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data?.detail || `${response.status}: failed to queue generation`);
      }

      setResult(data);
      onQueued?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* ── Header Section ── */}
      <section className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-4 space-y-2 animate-fade-in">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-display font-bold text-gray-50">Render Job</h2>
          <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
            API-backed
          </span>
        </div>
        <p className="text-xs text-gray-500 leading-relaxed">
          Submit one controlled image or video job. For multi-shot work, use Projects so each scene and shot can be
          reviewed before GPU time is spent.
        </p>
      </section>

      {/* ── Mode Selector ── */}
      <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-white/[0.06] bg-white/[0.01] p-1.5 animate-fade-in stagger-1">
        {[
          ["image", "Image"],
          ["t2v", "Text → Video"],
          ["i2v", "Image → Video"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => selectMode(id as GenerateMode)}
            className={`rounded-lg border px-2 py-2.5 text-xs font-semibold transition-all duration-200 ${
              mode === id
                ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/15 to-teal-500/10 text-emerald-200 shadow-lg shadow-emerald-500/5"
                : "border-transparent bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Identity Asset ── */}
      <label className="block space-y-2 animate-fade-in stagger-2">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Identity asset</span>
        <select
          value={characterId}
          onChange={(event) => setCharacterId(event.target.value)}
          className="w-full rounded-lg bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 appearance-none"
        >
          <option value="none">No identity asset / raw workflow</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}{character.trigger ? ` · trigger: ${character.trigger}` : ""}
            </option>
          ))}
        </select>
        {selectedCharacter && (
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Uses this identity LoRA when available. Trigger word <span className="text-emerald-400/80 font-mono">{selectedCharacter.trigger || "none"}</span> is added automatically if missing.
          </p>
        )}
      </label>

      {/* ── Prompt ── */}
      <label className="block space-y-2 animate-fade-in stagger-3">
        <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prompt</span>
        <textarea
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          rows={8}
          className="w-full rounded-lg bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 placeholder:text-gray-700"
          placeholder="Describe what you want to generate..."
        />
      </label>

      {/* ── Checkpoint (image mode, no character) ── */}
      {mode === "image" && characterId === "none" && (
        <label className="block space-y-2 animate-fade-in">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Checkpoint</span>
          <select
            value={checkpoint}
            onChange={(event) => setCheckpoint(event.target.value)}
            className="w-full rounded-lg bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 appearance-none"
          >
            <option value="base">Base Flux2 model - no LoRA</option>
            <option value="latest">Latest available LoRA checkpoint</option>
            {checkpoints.map((item) => (
              <option key={item.name} value={item.name}>
                {checkpointLabel(item)}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-gray-600 leading-relaxed">
            Raw image mode bypasses identity selection. Use base Flux2 or apply a LoRA checkpoint directly.
          </p>
        </label>
      )}

      {/* ── Missing LoRA warning ── */}
      {mode === "image" && characterId !== "none" && selectedCharacter && !selectedCharacterHasImageLora && (
        <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-300 animate-fade-in">
          <span className="font-semibold">⚠</span> This identity asset does not have an image LoRA registered for the current workflow yet.
        </div>
      )}

      {/* ── Image-to-Video Upload ── */}
      {mode === "i2v" && (
        <div className="space-y-3 animate-fade-in">
          <label className="block space-y-2">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Source image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
              className="w-full rounded-lg bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white file:mr-3 file:rounded-lg file:border-0 file:bg-gradient-to-r file:from-emerald-600 file:to-teal-600 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:from-emerald-500 hover:file:to-teal-500 focus:outline-none focus:border-emerald-500/40 transition-all duration-200"
            />
          </label>

          <button
            type="button"
            onClick={uploadSourceImage}
            disabled={!uploadFile || uploading}
            className="w-full rounded-lg border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.12] disabled:bg-transparent disabled:text-gray-700 disabled:border-white/[0.04] px-4 py-2.5 text-sm text-gray-200 transition-all duration-200 font-medium"
          >
            {uploading ? "Uploading..." : "Upload image for i2v"}
          </button>
        </div>
      )}

      {/* ── Dimension Controls ── */}
      <div className="grid grid-cols-2 gap-3 animate-fade-in stagger-4">
        <NumberField label="Width" value={width} onChange={setWidth} min={512} max={2048} step={64} />
        <NumberField label="Height" value={height} onChange={setHeight} min={512} max={2048} step={64} />
        {mode === "image" && <NumberField label="Steps" value={steps} onChange={setSteps} min={1} max={60} step={1} />}
        {mode === "image" && <NumberField label="Guidance" value={guidance} onChange={setGuidance} min={1} max={10} step={0.5} />}
      </div>

      {mode === "image" && (
        <NumberField
          label="LoRA strength"
          value={loraStrength}
          onChange={setLoraStrength}
          min={0}
          max={2}
          step={0.05}
        />
      )}

      {/* ── Submit Button ── */}
      <button
        onClick={submit}
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:via-emerald-400 hover:to-teal-400 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-600 px-4 py-3 text-sm font-bold transition-all duration-300 shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/20 disabled:shadow-none"
      >
        {submitting ? "Queueing..." : mode === "image" ? "⚡ Generate image" : "⚡ Generate video"}
      </button>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3 text-sm text-red-300 animate-fade-in">
          {error}
        </div>
      )}

      {/* ── Success ── */}
      {result && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 animate-scale-in">
          <p className="text-sm font-display font-semibold text-emerald-200">✓ Queued successfully</p>
          <div className="text-xs text-emerald-300/70 space-y-1 break-all font-mono">
            <p>ID: {result.prompt_id}</p>
            {result.checkpoint && <p>Checkpoint: {result.checkpoint}</p>}
            {result.lora_name && <p>LoRA: {result.lora_name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full rounded-lg bg-white/[0.02] border border-white/[0.08] px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 font-mono"
      />
    </label>
  );
}
