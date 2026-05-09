import { useEffect, useMemo, useRef, useState } from "react";
import { Upload, Zap, ImageIcon, Film, Sparkles, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
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

const MODE_CONFIG: { id: GenerateMode; label: string; icon: typeof ImageIcon; desc: string }[] = [
  { id: "image", label: "Image", icon: ImageIcon, desc: "Still frame" },
  { id: "t2v", label: "Text → Video", icon: Film, desc: "From prompt" },
  { id: "i2v", label: "Image → Video", icon: Sparkles, desc: "Animate image" },
];

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
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [width, setWidth] = useState(1248);
  const [height, setHeight] = useState(832);
  const [steps, setSteps] = useState(20);
  const [guidance, setGuidance] = useState(4);
  const [loraStrength, setLoraStrength] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

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
    setUploadFile(null);
    setUploadPreview(null);
    setUploadSuccess(false);
    setSourceImage("");
  }

  function handleFileSelect(file: File | null) {
    if (!file) return;
    setUploadFile(file);
    setUploadSuccess(false);
    setSourceImage("");
    const reader = new FileReader();
    reader.onload = (e) => setUploadPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  function clearUpload() {
    setUploadFile(null);
    setUploadPreview(null);
    setUploadSuccess(false);
    setSourceImage("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) handleFileSelect(file);
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
      const response = await fetch("/api/images/upload", { method: "POST", body: form });
      const data = await response.json().catch(() => ({} as UploadResponse));
      if (!response.ok || !data.image) {
        throw new Error((data as { detail?: string }).detail || "Failed to upload source image.");
      }
      setSourceImage(data.image);
      setUploadSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    const cleanPrompt = prompt.trim();
    if (!cleanPrompt) { setError("Prompt is required."); return; }
    if (mode === "i2v" && !sourceImage.trim()) {
      setError("Please upload a source image first for Image → Video.");
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
            prompt: cleanPrompt, width, height, steps, guidance,
            lora_strength: loraStrength, filename_prefix: filenamePrefix, submit: true,
          }
        : {
            mode,
            character: useCharacter ? characterId : undefined,
            image: mode === "i2v" ? sourceImage.trim() : undefined,
            prompt: cleanPrompt, width, height,
            filename_prefix: filenamePrefix, submit: true,
          };
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data?.detail || `${response.status}: failed to queue generation`);
      setResult(data);
      onQueued?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-5">
      {/* ── Header ── */}
      <section className="relative rounded-2xl border border-white/[0.06] overflow-hidden animate-fade-in">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/[0.06] via-transparent to-violet-500/[0.04]" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-radial from-emerald-500/10 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/15 border border-emerald-500/20 flex items-center justify-center">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-sm font-display font-bold text-gray-50">Render Engine</h2>
                <p className="text-[10px] text-gray-600 font-medium">GPU-accelerated pipeline</p>
              </div>
            </div>
            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/5 px-2.5 py-0.5 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Online
            </span>
          </div>
          <p className="text-[11px] text-gray-500 leading-relaxed">
            Submit controlled render jobs to the AMD MI300X pipeline. Choose your mode, configure parameters, and queue.
          </p>
        </div>
      </section>

      {/* ── Mode Selector ── */}
      <div className="grid grid-cols-3 gap-2 animate-fade-in stagger-1">
        {MODE_CONFIG.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => selectMode(id)}
            className={`group relative rounded-xl border px-2.5 py-3 text-center transition-all duration-300 overflow-hidden ${
              mode === id
                ? "border-emerald-500/40 bg-gradient-to-br from-emerald-500/[0.12] to-teal-500/[0.08] shadow-lg shadow-emerald-500/5"
                : "border-white/[0.06] bg-white/[0.01] hover:border-white/[0.12] hover:bg-white/[0.03]"
            }`}
          >
            {mode === id && (
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent" />
            )}
            <div className="relative">
              <Icon className={`w-4 h-4 mx-auto mb-1.5 transition-colors ${mode === id ? "text-emerald-300" : "text-gray-600 group-hover:text-gray-400"}`} />
              <p className={`text-xs font-semibold transition-colors ${mode === id ? "text-emerald-200" : "text-gray-400"}`}>{label}</p>
              <p className={`text-[9px] mt-0.5 transition-colors ${mode === id ? "text-emerald-400/60" : "text-gray-700"}`}>{desc}</p>
            </div>
            {mode === id && (
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Identity Asset ── */}
      <label className="block space-y-2 animate-fade-in stagger-2">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-emerald-500/60" />
          Identity Asset
        </span>
        <select
          value={characterId}
          onChange={(event) => setCharacterId(event.target.value)}
          className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 appearance-none hover:border-white/[0.12]"
        >
          <option value="none">No identity asset / raw workflow</option>
          {characters.map((character) => (
            <option key={character.id} value={character.id}>
              {character.name}{character.trigger ? ` · trigger: ${character.trigger}` : ""}
            </option>
          ))}
        </select>
        {selectedCharacter && (
          <p className="text-[10px] text-gray-600 leading-relaxed pl-2.5 border-l-2 border-emerald-500/20">
            Uses identity LoRA. Trigger <span className="text-emerald-400/80 font-mono">{selectedCharacter.trigger || "none"}</span> auto-injected.
          </p>
        )}
      </label>

      {/* ── Prompt ── */}
      <label className="block space-y-2 animate-fade-in stagger-3">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-violet-500/60" />
          Prompt
        </span>
        <div className="relative group">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            rows={6}
            className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white leading-relaxed resize-y focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 placeholder:text-gray-700 hover:border-white/[0.12]"
            placeholder="Describe what you want to generate..."
          />
          <div className="absolute bottom-2 right-2 text-[9px] text-gray-700 font-mono">
            {prompt.length} chars
          </div>
        </div>
      </label>

      {/* ── Checkpoint (image mode, no character) ── */}
      {mode === "image" && characterId === "none" && (
        <label className="block space-y-2 animate-fade-in">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-amber-500/60" />
            Checkpoint
          </span>
          <select
            value={checkpoint}
            onChange={(event) => setCheckpoint(event.target.value)}
            className="w-full rounded-xl bg-white/[0.02] border border-white/[0.08] px-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all duration-200 appearance-none hover:border-white/[0.12]"
          >
            <option value="base">Base Flux2 model — no LoRA</option>
            <option value="latest">Latest available LoRA checkpoint</option>
            {checkpoints.map((item) => (
              <option key={item.name} value={item.name}>
                {checkpointLabel(item)}
              </option>
            ))}
          </select>
        </label>
      )}

      {/* ── Missing LoRA warning ── */}
      {mode === "image" && characterId !== "none" && selectedCharacter && !selectedCharacterHasImageLora && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.04] p-3 text-xs text-amber-300 flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>This identity asset does not have an image LoRA registered for the current workflow yet.</span>
        </div>
      )}

      {/* ── Image-to-Video: Upload Zone ── */}
      {mode === "i2v" && (
        <div className="space-y-3 animate-fade-in">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-rose-500/60" />
            Source Image
            {uploadSuccess && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1" />}
          </span>

          {/* Drop zone / Upload area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-xl border-2 border-dashed transition-all duration-300 cursor-pointer overflow-hidden ${
              dragOver
                ? "border-emerald-400/60 bg-emerald-500/[0.06]"
                : uploadPreview
                ? "border-emerald-500/30 bg-emerald-500/[0.03]"
                : "border-white/[0.1] bg-white/[0.01] hover:border-emerald-500/30 hover:bg-emerald-500/[0.02]"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
              className="hidden"
            />

            {uploadPreview ? (
              <div className="relative">
                <img src={uploadPreview} alt="Preview" className="w-full h-36 object-cover rounded-lg" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg" />
                <button
                  onClick={(e) => { e.stopPropagation(); clearUpload(); }}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white/80 hover:bg-red-500/60 hover:border-red-400/40 transition-all"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                  <span className="text-[10px] text-white/80 font-medium truncate max-w-[60%]">
                    {uploadFile?.name}
                  </span>
                  {uploadSuccess ? (
                    <span className="text-[10px] text-emerald-300 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Uploaded
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-300/80">Ready to upload</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2.5">
                <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center transition-all duration-300 ${
                  dragOver
                    ? "border-emerald-400/40 bg-emerald-500/10"
                    : "border-white/[0.08] bg-white/[0.02]"
                }`}>
                  <Upload className={`w-5 h-5 transition-colors ${dragOver ? "text-emerald-300" : "text-gray-600"}`} />
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-300 font-medium">Drop image here or click to browse</p>
                  <p className="text-[10px] text-gray-600 mt-0.5">PNG, JPEG, WebP supported</p>
                </div>
              </div>
            )}
          </div>

          {/* Upload button */}
          {uploadFile && !uploadSuccess && (
            <button
              type="button"
              onClick={uploadSourceImage}
              disabled={uploading}
              className="w-full rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 hover:from-emerald-500/15 hover:to-teal-500/15 disabled:from-transparent disabled:to-transparent disabled:border-white/[0.06] disabled:text-gray-700 px-4 py-2.5 text-sm text-emerald-200 transition-all duration-300 font-medium flex items-center justify-center gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Upload for animation
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ── Dimension Controls ── */}
      <div className="space-y-2 animate-fade-in stagger-4">
        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
          <span className="w-1 h-1 rounded-full bg-cyan-500/60" />
          Parameters
        </span>
        <div className="grid grid-cols-2 gap-2.5">
          <SliderField label="Width" value={width} onChange={setWidth} min={512} max={2048} step={64} unit="px" />
          <SliderField label="Height" value={height} onChange={setHeight} min={512} max={2048} step={64} unit="px" />
          {mode === "image" && <SliderField label="Steps" value={steps} onChange={setSteps} min={1} max={60} step={1} />}
          {mode === "image" && <SliderField label="Guidance" value={guidance} onChange={setGuidance} min={1} max={10} step={0.5} />}
        </div>
        {mode === "image" && (
          <SliderField label="LoRA Strength" value={loraStrength} onChange={setLoraStrength} min={0} max={2} step={0.05} />
        )}
      </div>

      {/* ── Submit Button ── */}
      <button
        onClick={submit}
        disabled={submitting}
        className="group w-full relative rounded-xl overflow-hidden px-4 py-3.5 text-sm font-bold transition-all duration-300 disabled:opacity-40"
      >
        <div className={`absolute inset-0 transition-all duration-300 ${
          submitting
            ? "bg-gray-800"
            : "bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 group-hover:from-emerald-500 group-hover:via-emerald-400 group-hover:to-teal-400"
        }`} />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        {!submitting && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/0 via-white/10 to-emerald-400/0 animate-shimmer" style={{ backgroundSize: "200% 100%" }} />
          </div>
        )}
        <span className="relative flex items-center justify-center gap-2">
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Queueing render job...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              {mode === "image" ? "Generate Image" : "Generate Video"}
            </>
          )}
        </span>
      </button>

      {/* ── Error ── */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3.5 flex items-start gap-2.5 animate-fade-in">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      {/* ── Success ── */}
      {result && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4 space-y-2.5 animate-scale-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <p className="text-sm font-display font-semibold text-emerald-200">Render job queued</p>
          </div>
          <div className="text-xs text-emerald-300/60 space-y-1 break-all font-mono pl-6">
            <p>ID: {result.prompt_id}</p>
            {result.checkpoint && <p>Checkpoint: {result.checkpoint}</p>}
            {result.lora_name && <p>LoRA: {result.lora_name}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Slider Field Component ── */
function SliderField({
  label, value, onChange, min, max, step, unit,
}: {
  label: string; value: number; onChange: (value: number) => void;
  min?: number; max?: number; step?: number; unit?: string;
}) {
  return (
    <label className="block space-y-1.5 group">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{label}</span>
        <span className="text-[10px] font-mono text-emerald-400/60">{value}{unit || ""}</span>
      </div>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] cursor-pointer accent-emerald-500 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-400 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-300 [&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:hover:scale-125"
      />
    </label>
  );
}
