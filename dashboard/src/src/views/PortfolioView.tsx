import { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Cpu,
  Film,
  Image,
  Layers3,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Video,
  Workflow,
  Sparkles,
} from "lucide-react";
import { TaskCard } from "./TaskCard";
import { AssetCard } from "./AssetCard";
import type { JobItem, MediaItem } from "../models";

type Filter = "all" | "images" | "videos";

interface PortfolioViewProps {
  items: MediaItem[];
  jobs: JobItem[];
  loading: boolean;
  error: string | null;
  onOpen: (url: string) => void;
  onDelete: (item: MediaItem) => Promise<void> | void;
  onOpenProjects?: () => void;
}

function isVideo(item: MediaItem) {
  return item.type === "video" || item.url.endsWith(".mp4") || item.url.endsWith(".webm");
}

export function PortfolioView({ items, jobs, loading, error, onOpen, onDelete, onOpenProjects }: PortfolioViewProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const imageCount = items.filter((item) => !isVideo(item)).length;
  const videoCount = items.length - imageCount;

  const visibleItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((item) => {
      if (filter === "images" && isVideo(item)) return false;
      if (filter === "videos" && !isVideo(item)) return false;
      if (!q) return true;
      return [item.name, item.filename, item.prompt].some((value) => String(value || "").toLowerCase().includes(q));
    });
  }, [filter, items, query]);

  return (
    <div className="p-5 lg:p-7 space-y-5 max-w-[1600px] mx-auto">
      {/* ── Hero Section ── */}
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr] animate-fade-in">
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.03] via-transparent to-emerald-500/[0.02] p-6 relative overflow-hidden noise-overlay">
          <div className="relative z-10">
            <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-400/90 font-semibold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              AMD Developer Cloud + Hugging Face Space
            </p>
            <h1 className="text-2xl font-display font-bold tracking-tight mt-2.5 bg-gradient-to-r from-white via-gray-100 to-gray-400 bg-clip-text text-transparent">
              Production Console for Agent-Directed Visual Media
            </h1>
            <p className="text-sm text-gray-400 mt-3 max-w-3xl leading-relaxed">
              ChitraMaya turns prompts, owned identities, and project outlines into renderable image and video jobs.
              The demo is organized around the actual pipeline: plan, generate, train, review, and publish.
            </p>
            <div className="grid sm:grid-cols-4 gap-2 mt-5">
              {[
                { label: "Agent workflows", icon: Workflow },
                { label: "Identity LoRA", icon: ShieldCheck },
                { label: "Image + video", icon: Layers3 },
                { label: "AMD GPU jobs", icon: Cpu },
              ].map(({ label, icon: Icon }) => (
                <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 flex items-center gap-2 hover:border-emerald-500/20 hover:bg-emerald-500/[0.03] transition-all duration-200 group">
                  <Icon className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  <span className="text-xs text-gray-300 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="Total assets" value={items.length} />
          <Metric label="Images" value={imageCount} />
          <Metric label="Videos" value={videoCount} />
          <div className="col-span-3 rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-3.5">
            <p className="text-[11px] uppercase tracking-wider text-gray-500 font-semibold">Track orientation</p>
            <p className="text-sm font-display font-semibold text-gray-200 mt-1">Agentic multimodal creation on AMD GPUs</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              The strongest angle is not a gallery. It is an API-first production loop: agent plans the asset, GPU
              executes it, and the human approves the result.
            </p>
          </div>
        </div>
      </section>

      {/* ── Projects CTA ── */}
      <button
        onClick={onOpenProjects}
        className="group w-full rounded-2xl border border-white/[0.06] bg-gradient-to-r from-white/[0.02] to-transparent hover:border-emerald-500/30 hover:from-emerald-500/[0.03] transition-all duration-300 flex items-center gap-4 px-5 py-4 text-left animate-fade-in stagger-1"
      >
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/15 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-300">
          <Film className="w-5 h-5 text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-display font-bold text-gray-100">Move from single renders to directed projects</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Use Projects for finished pieces: outline scenes, define shots, generate storyboard frames, animate
            approved shots, and track each render through the API.
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-emerald-400 group-hover:translate-x-1 transition-transform duration-200 flex-shrink-0" />
      </button>

      {/* ── Feature Cards ── */}
      <section className="grid gap-3 lg:grid-cols-4 animate-fade-in stagger-2">
        {[
          { title: "Studio renders", body: "Fast image and video jobs for quick iteration.", icon: Image },
          { title: "Project pipeline", body: "Scene and shot structure for multi-clip stories.", icon: Film },
          { title: "Identity training", body: "Owned datasets and LoRA checkpoints on AMD.", icon: ShieldCheck },
          { title: "Deployment loop", body: "Hugging Face UI backed by cloud GPU APIs.", icon: Boxes },
        ].map(({ title, body, icon: Icon }, i) => (
          <div key={title} className={`rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-4 hover:border-emerald-500/15 hover:from-emerald-500/[0.02] transition-all duration-300 group stagger-${i + 1}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-500/10 flex items-center justify-center group-hover:shadow-md group-hover:shadow-emerald-500/5 transition-all duration-300">
              <Icon className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-sm font-display font-semibold text-gray-200 mt-3">{title}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      {/* ── Filter Bar ── */}
      <section className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between animate-fade-in stagger-3">
        <div className="flex gap-1.5">
          {[
            ["all", "All", SlidersHorizontal],
            ["images", "Images", Image],
            ["videos", "Videos", Video],
          ].map(([id, label, Icon]) => (
            <button
              key={id as string}
              onClick={() => setFilter(id as Filter)}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 ${
                filter === id
                  ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-500/10"
                  : "bg-transparent text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label as string}
            </button>
          ))}
        </div>
        <label className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-gray-600 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search assets..."
            className="w-full rounded-lg bg-white/[0.02] border border-white/[0.08] pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 placeholder:text-gray-700 transition-all duration-200"
          />
        </label>
      </section>

      {/* ── Media Grid ── */}
      {loading && items.length === 0 && jobs.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-300 animate-fade-in">{error}</div>
      ) : jobs.length === 0 && visibleItems.length === 0 ? (
        <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-12 text-center animate-fade-in">
          <Image className="w-10 h-10 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500 font-display">No media found.</p>
          <p className="text-xs text-gray-600 mt-1">Generate your first asset using the sidebar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {jobs.map((job) => <TaskCard key={job.prompt_id} job={job} />)}
          {visibleItems.map((item, i) => (
            <div key={item.filename || item.url} className={`animate-fade-in stagger-${Math.min(i % 6 + 1, 6)}`}>
              <AssetCard
                item={item}
                onOpen={() => onOpen(item.url)}
                onDelete={onDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent px-3.5 py-3">
      <p className="text-gray-500 text-[11px] uppercase tracking-wider font-medium">{label}</p>
      <p className="text-xl font-display font-bold text-gray-100 mt-0.5">{value}</p>
    </div>
  );
}
