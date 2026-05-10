import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { BrowserRouter, Routes, Route, Outlet, useMatch, useNavigate, useParams } from "react-router-dom";
import { Activity, Download, Loader2, Menu, Server, UserCircle } from "lucide-react";
import { PortfolioView } from "./views/PortfolioView";
import { ActorProfileView } from "./views/ActorProfileView";
import { FilmsView } from "./views/FilmsView";
import { FilmDetailView } from "./views/FilmDetailView";
import { ControlPanel } from "./views/panel/ControlPanel";
import type { PanelTab } from "./views/panel/ControlPanel";
import type { JobItem, LoraCheckpoint, LoraTrainingStatus, MediaItem, Project, Scene, Shot, FilmPhase, FilmModeData } from "./models";

async function fetchJson<T>(url: string, timeoutMs = 5000): Promise<T> {
  const controller = new AbortController();
  const id = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`${url} returned ${response.status}`);
    return await response.json();
  } finally {
    window.clearTimeout(id);
  }
}

/* ── App Context ── */
interface AppContextType {
  items: MediaItem[];
  jobs: JobItem[];
  loading: boolean;
  hasLoadedOnce: boolean;
  error: string | null;
  selected: string | null;
  setSelected: (url: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  activePanelTab: PanelTab;
  setActivePanelTab: (tab: PanelTab) => void;
  checkpoints: LoraCheckpoint[];
  deleteItem: (item: MediaItem) => Promise<void>;
  load: () => Promise<void>;
  projectData: { project: Project; scenes: Scene[]; shots: Shot[] } | null;
  selectedSceneId: string | null;
  selectedShotId: string | null;
  setSelectedSceneId: (id: string | null) => void;
  setSelectedShotId: (id: string | null) => void;
  loadProject: (id: string) => Promise<void>;
  addScene: () => Promise<void>;
  deleteScene: (sceneId: string) => Promise<void>;
  deleteShot: (shotId: string) => Promise<void>;
  renderEvents: any[];
}

const AppContext = createContext<AppContextType>(null!);
export function useApp() {
  return useContext(AppContext);
}

/* ── Layout Shell: header + sidebar + <Outlet /> ── */
function Shell() {
  const ctx = useApp();
  const navigate = useNavigate();
  const projectMatch = useMatch("/projects/:projectId");

  // Load project when entering a project-detail route
  const lastProjectId = useRef<string | undefined>(undefined);
  useEffect(() => {
    const pid = projectMatch?.params.projectId;
    if (pid && pid !== lastProjectId.current) {
      lastProjectId.current = pid;
      ctx.loadProject(pid);
      ctx.setActivePanelTab("projects");
    }
  }, [projectMatch?.params.projectId]);

  const videoCount = ctx.items.filter(
    (item) => item.type === "video" || item.url.endsWith(".mp4") || item.url.endsWith(".webm")
  ).length;
  const imageCount = ctx.items.length - videoCount;

  const projectMode: FilmModeData | undefined =
    projectMatch && ctx.projectData
      ? {
          project: ctx.projectData.project,
          scenes: ctx.projectData.scenes,
          shots: ctx.projectData.shots,
          selectedSceneId: ctx.selectedSceneId,
          selectedShotId: ctx.selectedShotId,
          phase: "outline",
          onSelectScene: (id) => {
            ctx.setSelectedSceneId(id);
            ctx.setSelectedShotId(null);
          },
          onSelectShot: ctx.setSelectedShotId,
          onBack: () => {
            ctx.setSelectedShotId(null);
            navigate("/projects");
          },
          onRefresh: () => {
            const pid = projectMatch?.params.projectId;
            return pid ? ctx.loadProject(pid) : Promise.resolve();
          },
          onAddScene: ctx.addScene,
          onDeleteScene: ctx.deleteScene,
          onDeleteShot: ctx.deleteShot,
        }
      : undefined;

  return (
    <div className="min-h-screen bg-[#050608] text-white flex flex-col">
      {/* ── Premium Glassmorphic Header ── */}
      <header className="h-14 border-b border-white/[0.06] glass-heavy flex items-center justify-between px-5 sticky top-0 z-40">
        <div className="flex items-center gap-3 min-w-0">
          {!ctx.sidebarOpen && (
            <button
              onClick={() => ctx.setSidebarOpen(true)}
              className="w-9 h-9 rounded-lg border border-white/[0.06] bg-white/[0.02] text-gray-500 hover:text-emerald-300 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200"
              title="Open tools"
            >
              <Menu className="w-4 h-4 mx-auto" />
            </button>
          )}
          <button
            onClick={() => {
              navigate("/");
              ctx.setActivePanelTab("generate");
            }}
            className="flex items-center gap-3 min-w-0 group"
            title="Home"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-teal-500/20 border border-emerald-500/20 flex items-center justify-center group-hover:border-emerald-400/40 group-hover:shadow-lg group-hover:shadow-emerald-500/10 transition-all duration-300">
              <Activity className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="min-w-0 hidden sm:block">
              <h1 className="text-sm font-display font-bold tracking-tight bg-gradient-to-r from-white via-gray-100 to-gray-300 bg-clip-text text-transparent">ChitraMaya</h1>
              <p className="text-[10px] text-gray-600 tracking-wider font-medium uppercase">MI300X · Production</p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-2 text-[11px]">
          <div className="hidden md:flex items-center gap-1.5">
            {ctx.jobs.length > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/5 px-2.5 py-1 text-amber-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-glow-pulse" />
                {ctx.jobs.length} rendering
              </span>
            )}
            <span className="rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-gray-500 font-medium">
              {ctx.items.length} assets
            </span>
            <span className="hidden lg:inline rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-gray-500">
              {imageCount} img
            </span>
            <span className="hidden lg:inline rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-gray-500">
              {videoCount} vid
            </span>
            <span className="hidden xl:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-2.5 py-1 text-emerald-400/80">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              ComfyUI
            </span>
          </div>

          <div className="group relative">
            <button className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.02] px-3 py-1.5 text-gray-300 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-200">
              <UserCircle className="w-4 h-4" />
              <span className="hidden sm:inline font-medium text-xs">Operator</span>
              <span className="rounded-full bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-emerald-300 font-semibold">
                Live
              </span>
            </button>
            <div className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-white/[0.06] glass-heavy p-4 shadow-2xl shadow-black/80 opacity-0 translate-y-2 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto">
              <p className="text-xs font-semibold text-gray-100 font-display">Production Console</p>
              <p className="text-[11px] text-gray-500 mt-1.5 leading-relaxed">
                Enterprise control plane for image + video generation, identity LoRA training, and multi-shot cinematic production on AMD MI300X.
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0">
        {ctx.sidebarOpen && (
          <div className="animate-slide-right">
            <ControlPanel
              activeTab={ctx.activePanelTab}
              onTabChange={(tab) => {
                ctx.setActivePanelTab(tab);
                if (tab === "projects") navigate("/projects");
              }}
              onClose={() => ctx.setSidebarOpen(false)}
              checkpoints={ctx.checkpoints}
              onQueued={ctx.load}
              onSelectCharacter={(id) => {
                ctx.setActivePanelTab("characters");
                navigate(`/characters/${id}`);
              }}
              projectMode={projectMode}
            />
          </div>
        )}

        <main className="flex-1 min-w-0 overflow-y-auto bg-[#050608]">
          <Outlet />
        </main>
      </div>

      {/* ── Cinematic Lightbox ── */}
      {ctx.selected && (
        <div
          className="fixed inset-0 z-50 bg-black/98 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in"
          onClick={() => ctx.setSelected(null)}
        >
          <div className="max-w-full max-h-full animate-scale-in relative group" onClick={(e) => e.stopPropagation()}>
            <a
              href={ctx.selected}
              download="chitramaya-render"
              className="absolute top-4 right-4 z-[60] w-12 h-12 rounded-full bg-black/60 hover:bg-emerald-600 text-white flex items-center justify-center backdrop-blur-md transition-all border border-white/20 opacity-0 group-hover:opacity-100"
              title="Download high-res"
            >
              <Download className="w-6 h-6" />
            </a>
            {ctx.selected.endsWith(".mp4") || ctx.selected.endsWith(".webm") ? (
              <video src={ctx.selected} controls autoPlay className="max-w-full max-h-[90vh] rounded-xl shadow-2xl shadow-black/80 ring-1 ring-white/[0.06]" />
            ) : (
              <img src={ctx.selected} alt="" className="max-w-full max-h-[90vh] rounded-xl shadow-2xl shadow-black/80 ring-1 ring-white/[0.06]" />
            )}
          </div>
        </div>
      )}

      {/* ── Real-time Render Progress Overlay ── */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        {ctx.renderEvents
          .filter((e) => e.type === "job_update" && e.status === "rendering")
          .slice(0, 1)
          .map((event) => (
            <div
              key={event.job_id}
              className="w-80 glass-heavy border border-emerald-500/30 rounded-2xl p-4 shadow-2xl shadow-black pointer-events-auto animate-slide-up"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Rendering Film
                </span>
                <span className="text-[10px] font-mono text-emerald-300/60">{event.progress}%</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${event.progress}%` }}
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-2 font-medium truncate">
                {event.message || "Processing shots..."}
              </p>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ── Route wrappers that connect URL params to existing components ── */
function PortfolioRoute() {
  const ctx = useApp();
  return (
    <PortfolioView
      items={ctx.items}
      jobs={ctx.jobs}
      loading={ctx.loading && !ctx.hasLoadedOnce && !(ctx.jobs.length > 0 || ctx.items.length > 0)}
      error={ctx.error}
      onOpen={ctx.setSelected}
      onDelete={ctx.deleteItem}
      onOpenProjects={() => window.location.href = "/projects"}
    />
  );
}

function FilmsRoute() {
  const navigate = useNavigate();
  return <FilmsView onOpenProject={(id) => navigate(`/projects/${id}`)} />;
}

function FilmRoute() {
  const { projectId } = useParams<{ projectId: string }>();
  const ctx = useApp();

  useEffect(() => {
    if (projectId) ctx.loadProject(projectId);
  }, [projectId]);

  const navigate = useNavigate();

  if (!ctx.projectData) {
    return <div className="p-8 text-center text-gray-500">Loading project…</div>;
  }

  return (
    <FilmDetailView
      project={ctx.projectData.project}
      scenes={ctx.projectData.scenes}
      shots={ctx.projectData.shots}
      jobs={ctx.jobs}
      selectedSceneId={ctx.selectedSceneId}
      selectedShotId={ctx.selectedShotId}
      onSelectScene={(id) => {
        ctx.setSelectedSceneId(id);
        ctx.setSelectedShotId(null);
      }}
      onSelectShot={ctx.setSelectedShotId}
      onRefresh={() => (projectId ? ctx.loadProject(projectId) : Promise.resolve())}
      onBack={() => {
        ctx.setSelectedShotId(null);
        navigate("/projects");
      }}
      onDeleteScene={ctx.deleteScene}
      onDeleteShot={ctx.deleteShot}
    />
  );
}

function ActorRoute() {
  const { characterId } = useParams<{ characterId: string }>();
  const { items, setSelected, deleteItem, setActivePanelTab } = useApp();
  if (!characterId) return null;
  return (
    <ActorProfileView
      characterId={characterId}
      items={items}
      onOpen={setSelected}
      onDelete={deleteItem}
      onGenerate={() => setActivePanelTab("generate")}
    />
  );
}

/* ── App Root ── */
export default function App() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [jobs, setJobs] = useState<JobItem[]>([]);
  const [training, setTraining] = useState<LoraTrainingStatus | null>(null);
  const [checkpoints, setCheckpoints] = useState<LoraCheckpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activePanelTab, setActivePanelTab] = useState<PanelTab>("generate");
  const [projectData, setProjectData] = useState<{
    project: Project;
    scenes: Scene[];
    shots: Shot[];
  } | null>(null);
  const [selectedSceneId, setSelectedSceneId] = useState<string | null>(null);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [renderEvents, setRenderEvents] = useState<any[]>([]);

  const load = useCallback(async () => {
    if (!hasLoadedOnce) setLoading(true);
    try {
      setError(null);
      const listing = await fetchJson<{ images?: MediaItem[] }>("/api/listing", 8000);
      setItems(listing.images || []);
      setHasLoadedOnce(true);
    } catch (e) {
      console.error("Failed to load gallery", e);
      setError(e instanceof Error ? e.message : "Failed to load gallery");
    } finally {
      setLoading(false);
    }

    const [jobsResult, trainingResult, checkpointsResult] = await Promise.allSettled([
      fetchJson<{ jobs?: JobItem[] }>("/api/jobs", 3500),
      fetchJson<LoraTrainingStatus & { ok?: boolean }>("/api/lora-training/status", 3500),
      fetchJson<{ checkpoints?: LoraCheckpoint[] }>("/api/lora-training/checkpoints", 3500),
    ]);

    if (jobsResult.status === "fulfilled") setJobs(jobsResult.value.jobs || []);
    if (trainingResult.status === "fulfilled")
      setTraining(trainingResult.value.ok ? trainingResult.value : null);
    if (checkpointsResult.status === "fulfilled")
      setCheckpoints(checkpointsResult.value.checkpoints || []);
  }, [hasLoadedOnce]);

  useEffect(() => {
    load();
    const id = window.setInterval(load, 5000);

    const es = new EventSource("/api/events");
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        setRenderEvents((prev) => [data, ...prev].slice(0, 50));
        if (data.type === "job_update") {
          if (data.status === "completed" || data.status === "failed") {
            load();
            if (data.project_id) {
              loadProject(data.project_id);
            }
          }
        }
      } catch (err) {
        console.error("SSE parse error", err);
      }
    };

    return () => {
      window.clearInterval(id);
      es.close();
    };
  }, [load]);

  const loadProject = useCallback(async (id: string) => {
    setProjectId(id);
    try {
      const response = await fetch(`/api/projects/${id}`);
      if (!response.ok) throw new Error(`Project fetch failed: ${response.status}`);
      const data = await response.json();
      const scenes: Scene[] = (data.scenes || []).slice().sort(
        (a: Scene, b: Scene) => a.scene_number - b.scene_number
      );
      const shots: Shot[] = (data.shots || []).slice().sort(
        (a: Shot, b: Shot) => a.shot_number - b.shot_number
      );
      setProjectData({ project: data.project, scenes, shots });
      setSelectedSceneId((current) => {
        if (current && scenes.some((scene) => scene.id === current)) return current;
        return scenes.length > 0 ? scenes[0].id : null;
      });
    } catch (e) {
      console.error("Failed to load project", e);
    }
  }, []);

  const addScene = useCallback(async () => {
    if (!projectId || !projectData) return;
    const next =
      projectData.scenes.length > 0
        ? Math.max(...projectData.scenes.map((scene) => scene.scene_number)) + 1
        : 1;
    try {
      const response = await fetch(`/api/projects/${projectId}/scenes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scene_number: next, heading: `SCENE ${next}` }),
      });
      if (!response.ok) throw new Error(`Add scene failed: ${response.status}`);
      const created = await response.json();
      await loadProject(projectId);
      setSelectedSceneId(created.id);
      setSelectedShotId(null);
    } catch (e) {
      console.error("Failed to add scene", e);
    }
  }, [projectId, projectData, loadProject]);

  const deleteScene = useCallback(async (sceneId: string) => {
    if (!projectId) return;
    if (!confirm("Delete this scene and all its shots?")) return;
    await fetch(`/api/projects/${projectId}/scenes/${sceneId}`, { method: "DELETE" });
    if (selectedSceneId === sceneId) {
      setSelectedSceneId("");
      setSelectedShotId(null);
    }
    loadProject(projectId);
  }, [projectId, selectedSceneId, loadProject]);

  const deleteShot = useCallback(async (shotId: string) => {
    if (!projectId || !projectData) return;
    if (!confirm("Delete this shot?")) return;
    const shot = projectData.shots.find((s) => s.id === shotId);
    if (!shot) return;
    await fetch(`/api/projects/${projectId}/scenes/${shot.scene_id}/shots/${shotId}`, { method: "DELETE" });
    if (selectedShotId === shotId) setSelectedShotId(null);
    loadProject(projectId);
  }, [projectId, projectData, selectedShotId, loadProject]);

  const deleteItem = useCallback(
    async (item: MediaItem) => {
      const filename = item.filename || item.url.replace(/^\/media\//, "");
      const response = await fetch("/api/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ files: [filename] }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.detail || `Failed to delete ${filename}`);
      }
      setItems((current) =>
        current.filter(
          (candidate) =>
            (candidate.filename || candidate.url) !== (item.filename || item.url)
        )
      );
      if (selected === item.url) setSelected(null);
    },
    [selected]
  );

  const ctxValue: AppContextType = {
    items,
    jobs,
    loading,
    hasLoadedOnce,
    error,
    selected,
    setSelected,
    sidebarOpen,
    setSidebarOpen,
    activePanelTab,
    setActivePanelTab,
    checkpoints,
    deleteItem,
    load,
    projectData,
    selectedSceneId,
    selectedShotId,
    setSelectedSceneId,
    setSelectedShotId,
    loadProject,
    addScene,
    deleteScene,
    deleteShot,
    renderEvents,
  };

  return (
    <BrowserRouter>
      <AppContext.Provider value={ctxValue}>
        <Routes>
          <Route element={<Shell />}>
            <Route index element={<PortfolioRoute />} />
            <Route path="projects" element={<FilmsRoute />} />
            <Route path="projects/:projectId" element={<FilmRoute />} />
            <Route path="characters/:characterId" element={<ActorRoute />} />
          </Route>
        </Routes>
      </AppContext.Provider>
    </BrowserRouter>
  );
}
