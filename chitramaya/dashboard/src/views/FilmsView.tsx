import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Film, GitBranch, Plus, RefreshCw, Trash2, UserCircle } from "lucide-react";

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
  draft: "border-gray-700/40 bg-white/[0.02] text-gray-400",
  planning: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
  ready: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
  rendering: "border-amber-500/25 bg-amber-500/5 text-amber-300",
  completed: "border-blue-500/25 bg-blue-500/5 text-blue-300",
  failed: "border-red-500/25 bg-red-500/5 text-red-300",
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
      const data = (await response.json()) as ProjectsResponse;
      setProjects(data.projects || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load projects");
    } finally {
      setLoading(false);
    }
  }

  async function createProject() {
    const title = window.prompt("Enter project title:", "New Creative Project");
    if (!title) return;
    setLoading(true);
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, aspect_ratio: "9:16", status: "draft" }),
      });
      if (!response.ok) throw new Error(`Create failed: ${response.status}`);
      const created = await response.json();
      await load();
      onOpenProject?.(created.id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create project");
      setLoading(false);
    }
  }

  async function deleteProject(id: string) {
    if (!window.confirm("Are you sure you want to delete this project and all its content?")) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
      if (!response.ok) throw new Error(`Delete failed: ${response.status}`);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete project");
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className={compact ? "h-full overflow-y-auto p-4 space-y-5" : "h-full overflow-y-auto p-8 space-y-5"}>
      {/* ── Header ── */}
      <section className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-4 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/15 border border-emerald-500/20 flex items-center justify-center">
            <Film className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-display font-bold tracking-tight text-gray-100">Projects</h2>
            <p className="text-xs text-gray-500 leading-relaxed">Multi-shot media projects with reviewable scenes and shots.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={createProject}
              className="inline-flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-600/10 hover:bg-rose-600/20 px-3 py-1.5 text-xs font-medium text-rose-100 transition shadow-lg shadow-rose-500/5"
            >
              <Plus className="w-3.5 h-3.5" /> New Project
            </button>
            <button
              onClick={() => {
                setLoading(true);
                load();
              }}
              className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-gray-500 hover:text-emerald-300 hover:border-emerald-500/25 hover:bg-emerald-500/5 transition-all duration-200 flex items-center justify-center"
              title="Refresh projects"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      </section>

      {/* ── Pipeline Purpose ── */}
      <section className="rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-4 space-y-3 animate-fade-in stagger-1">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          <p className="text-xs font-display font-bold text-gray-200 uppercase tracking-wider">Pipeline purpose</p>
        </div>
        <p className="text-xs text-gray-400 leading-relaxed">
          Projects are the controlled path from concept to output: define the structure, review the plan, render each
          shot, then animate only approved frames.
        </p>
        <div className="grid grid-cols-2 gap-2">
          {["Outline first", "Render selectively", "Track each job", "Approve outputs"].map((item) => (
            <div key={item} className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-2 flex items-center gap-2 hover:border-emerald-500/15 transition-all duration-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-gray-400 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Project List ── */}
      <section className="space-y-3 animate-fade-in stagger-2">
        <div className="flex items-center justify-between">
          <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Existing projects</p>
          <span className="text-[10px] text-gray-600 font-mono">{projects.length}</span>
        </div>

        {error && (
          <div className="rounded-xl border border-red-500/20 bg-red-500/5 px-3 py-2.5 text-xs text-red-300 animate-fade-in">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-6 text-center">
            <UserCircle className="w-6 h-6 text-gray-700 mx-auto mb-2" />
            <p className="text-xs text-gray-400 font-display font-semibold">No projects yet.</p>
            <p className="text-[11px] text-gray-600 mt-1 leading-relaxed">Create a project through the API, then review it here.</p>
          </div>
        )}

        {projects.map((project, i) => {
          const statusStyle = STATUS_STYLES[project.status] || STATUS_STYLES.draft;
          const text = projectText(project);
          return (
            <article
              key={project.id}
              onClick={() => onOpenProject?.(project.id)}
              className={`rounded-xl border border-white/[0.06] bg-gradient-to-br from-white/[0.02] to-transparent p-3.5 space-y-2 transition-all duration-200 animate-fade-in stagger-${Math.min(i + 1, 6)} ${onOpenProject ? "cursor-pointer hover:border-emerald-500/20 hover:from-emerald-500/[0.02] hover:shadow-lg hover:shadow-emerald-500/5" : ""}`}
            >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1" onClick={() => onOpenProject?.(project.id)}>
                    <h3 className="text-xs font-display font-bold text-gray-100 truncate">{project.title}</h3>
                    {text && <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed">{text}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className={`flex-shrink-0 text-[9px] uppercase tracking-wider rounded-full border px-2 py-0.5 font-bold ${statusStyle}`}>
                      {project.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(project.id);
                      }}
                      className="p-1 rounded-md text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Delete project"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04] text-[10px] text-gray-600">
                <span className="font-mono font-medium">{project.aspect_ratio}</span>
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
            <div className="w-6 h-6 rounded-full border-2 border-emerald-500/30 border-t-emerald-400 animate-spin mx-auto" />
            <p className="text-xs text-gray-600 mt-3">Loading projects...</p>
          </div>
        )}
      </section>
    </div>
  );
}
