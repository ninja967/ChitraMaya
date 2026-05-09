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
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-5">
          <p className="text-[11px] uppercase tracking-[0.22em] text-emerald-300/80">
            AMD Developer Cloud + Hugging Face Space
          </p>
          <h1 className="text-2xl font-bold tracking-tight mt-2">
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
              <div key={label} className="rounded-md border border-gray-800 bg-black/25 px-3 py-2 flex items-center gap-2">
                <Icon className="w-4 h-4 text-emerald-300" />
                <span className="text-xs text-gray-300">{label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-xs">
          <Metric label="Total assets" value={items.length} />
          <Metric label="Images" value={imageCount} />
          <Metric label="Videos" value={videoCount} />
          <div className="col-span-3 rounded-lg border border-gray-800 bg-[#0c0f13] p-3">
            <p className="text-[11px] uppercase tracking-wider text-gray-500">Track orientation</p>
            <p className="text-sm font-medium text-gray-200 mt-1">Agentic multimodal creation on AMD GPUs</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              The strongest angle is not a gallery. It is an API-first production loop: agent plans the asset, GPU
              executes it, and the human approves the result.
            </p>
          </div>
        </div>
      </section>

      <button
        onClick={onOpenProjects}
        className="group w-full rounded-lg border border-gray-800 bg-[#0c0f13] hover:border-emerald-500/40 transition flex items-center gap-4 px-5 py-4 text-left"
      >
        <div className="w-10 h-10 rounded-md border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Film className="w-5 h-5 text-emerald-300" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-100">Move from single renders to directed projects</p>
          <p className="text-xs text-gray-400 mt-1 leading-relaxed">
            Use Projects for finished pieces: outline scenes, define shots, generate storyboard frames, animate
            approved shots, and track each render through the API.
          </p>
        </div>
        <ArrowRight className="w-5 h-5 text-emerald-300 group-hover:translate-x-1 transition flex-shrink-0" />
      </button>

      <section className="grid gap-3 lg:grid-cols-4">
        {[
          { title: "Studio renders", body: "Fast image and video jobs for quick iteration.", icon: Image },
          { title: "Project pipeline", body: "Scene and shot structure for multi-clip stories.", icon: Film },
          { title: "Identity training", body: "Owned datasets and LoRA checkpoints on AMD.", icon: ShieldCheck },
          { title: "Deployment loop", body: "Hugging Face UI backed by cloud GPU APIs.", icon: Boxes },
        ].map(({ title, body, icon: Icon }) => (
          <div key={title} className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4">
            <Icon className="w-4 h-4 text-emerald-300" />
            <p className="text-sm font-semibold text-gray-200 mt-3">{title}</p>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-lg border border-gray-800 bg-[#0c0f13] p-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2">
          {[
            ["all", "All", SlidersHorizontal],
            ["images", "Images", Image],
            ["videos", "Videos", Video],
          ].map(([id, label, Icon]) => (
            <button
              key={id as string}
              onClick={() => setFilter(id as Filter)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition ${
                filter === id ? "bg-emerald-600 text-white" : "bg-gray-950 text-gray-500 hover:text-gray-200"
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
            placeholder="Search assets"
            className="w-full rounded-md bg-black/40 border border-gray-800 pl-9 pr-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-emerald-600 placeholder:text-gray-700"
          />
        </label>
      </section>

      {loading && items.length === 0 && jobs.length === 0 ? (
        <p className="text-gray-500">Loading...</p>
      ) : error ? (
        <div className="rounded-lg border border-red-900/60 bg-red-950/20 p-4 text-sm text-red-300">{error}</div>
      ) : jobs.length === 0 && visibleItems.length === 0 ? (
        <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-10 text-center">
          <Image className="w-8 h-8 text-gray-700 mx-auto mb-3" />
          <p className="text-sm text-gray-500">No media found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {jobs.map((job) => <TaskCard key={job.prompt_id} job={job} />)}
          {visibleItems.map((item) => (
            <AssetCard
              key={item.filename || item.url}
              item={item}
              onOpen={() => onOpen(item.url)}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-800 bg-[#0c0f13] px-3 py-3">
      <p className="text-gray-500">{label}</p>
      <p className="text-lg font-semibold text-gray-200">{value}</p>
    </div>
  );
}
