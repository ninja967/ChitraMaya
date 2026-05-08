import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Film, GitBranch, RefreshCw, UserCircle } from "lucide-react";

interface Project {
  id: string;
  title: string;
  content?: string | null;
  synopsis?: string | null;
  description?: string | null;
  aspect_ratio: string;
  duration_seconds: number | null;
  status: string;
  characters: string[];
  metadata: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
}

interface ProjectsResponse {
  projects?: Project[];
}

interface FilmsViewProps {
  compact?: boolean;
  onOpenProject?: (id: string) => void;
}

const STATUS_STYLES: Record<string, string> = {
  draft: "border-gray-700/60 bg-gray-800/40 text-gray-400",
  planning: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  ready: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
  rendering: "border-amber-500/30 bg-amber-500/10 text-amber-300",
  completed: "border-blue-500/30 bg-blue-500/10 text-blue-300",
  failed: "border-red-500/30 bg-red-500/10 text-red-300",
};

function formatRelative(iso?: string): string {
  if (!iso) return "-";
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "-";
  const diff = Date.now() - then;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function projectText(project: Project): string | null {
  return project.synopsis || project.content || project.description || null;
}

export function FilmsView({ compact = false, onOpenProject }: FilmsViewProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setError(null);
    try {
      const response = await fetch("/api/projects");
      if (!response.ok) throw new Error(`/api/projects returned ${response.status}`);
      const data = await response.json() as ProjectsResponse;
      setProjects(data.projects || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={compact ? "h-full overflow-y-auto p-4 space-y-5" : "h-full overflow-y-auto p-8 space-y-5"}>
      <section className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-emerald-300" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold tracking-tight text-gray-100">Projects</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Multi-shot media projects with reviewable scenes and shots.</p>
          </div>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="ml-auto w-8 h-8 rounded-md border border-gray-800 bg-gray-900/40 text-gray-500 hover:text-gray-200 hover:border-gray-600 transition flex items-center justify-center"
            title="Refresh projects"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </section>

      <section className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-300" />
          <p className="text-xs font-semibold text-gray-200 uppercase tracking-wider">Pipeline purpose</p>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Projects are the controlled path from concept to output: define the structure, review the plan, render each
          shot, then animate only approved frames.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {["Outline first", "Render selectively", "Track each job", "Approve outputs"].map((item) => (
            <div key={item} className="rounded-md border border-gray-800 bg-black/25 px-2.5 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span className="text-[11px] text-gray-400">{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Existing projects</p>
          <span className="text-[10px] text-gray-600">{projects.length}</span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs text-red-300">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-5 text-center">
            <UserCircle className="w-5 h-5 text-gray-600 mx-auto mb-2" />
            <p className="text-xs text-gray-400">No projects yet.</p>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">Create a project through the API, then review it here.</p>
          </div>
        )}

        {projects.map((project) => {
          const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.draft;
          const text = projectText(project);
          return (
            <article
              key={project.id}
              onClick={() => onOpenProject?.(project.id)}
              className={`rounded-lg border border-gray-800 bg-[#0c0f13] p-3 space-y-2 ${onOpenProject ? "cursor-pointer hover:bg-gray-900/50 hover:border-gray-700 transition" : ""}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="text-xs font-semibold text-gray-100 truncate">{project.title}</h3>
                  {text && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{text}</p>}
                </div>
                <span className={`flex-shrink-0 text-[9px] uppercase tracking-wider rounded-md border px-1.5 py-0.5 ${statusStyle}`}>
                  {project.status}
                </span>
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-800/40 text-[10px] text-gray-600">
                <span className="font-mono">{project.aspect_ratio}</span>
                {project.duration_seconds !== null && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{project.duration_seconds}s</span>
                )}
                <span className="ml-auto">{formatRelative(project.updated_at)}</span>
              </div>
            </article>
          );
        })}

        {loading && projects.length === 0 && !error && (
          <div className="text-center py-8">
            <RefreshCw className="w-5 h-5 text-gray-600 mx-auto animate-spin" />
            <p className="text-xs text-gray-600 mt-2">Loading projects...</p>
          </div>
        )}
      </section>
    </div>
  );
}
