import { Plus, GitBranch, UserCircle, Clapperboard, Trash2 } from "lucide-react";
import type { FilmModeData } from "../../models";

interface FilmSidebarProps {
  data: FilmModeData;
  onDeleteScene: (sceneId: string) => void;
}

export function FilmSidebar({ data, onDeleteScene }: FilmSidebarProps) {
  const { project, scenes, shots, selectedSceneId, phase, onSelectScene, onAddScene } = data;

  if (scenes.length === 0) {
    return <OutlineSidebar data={data} onDeleteScene={onDeleteScene} />;
  }

  return (
    <div className="flex-1 min-h-0 flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800/40 flex-shrink-0">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Description</p>
        <p className="text-xs text-gray-300 mt-1 leading-relaxed line-clamp-3">
          {project.description || <span className="italic text-gray-600">No description yet.</span>}
        </p>
      </div>

      <div className="px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <span className="text-[11px] uppercase tracking-wider text-gray-500 font-medium">Scenes</span>
        <button
          onClick={onAddScene}
          title="Add scene"
          className="inline-flex items-center gap-1 rounded-md border border-gray-800 hover:border-gray-700 hover:bg-gray-900/60 px-2 py-1 text-[10px] text-gray-400 hover:text-gray-200 transition"
        >
          <Plus className="w-3 h-3" /> Add scene
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto px-2 pb-3 space-y-1">
        {scenes.map((scene) => {
          const sceneShots = shots.filter((s) => s.scene_id === scene.id);
          const generated = sceneShots.filter((s) => s.image_file).length;
          const active = scene.id === selectedSceneId;
          return (
            <button
              key={scene.id}
              onClick={() => onSelectScene(scene.id)}
              className={`w-full text-left rounded-md px-3 py-2.5 transition group ${active ? "bg-emerald-600/10 ring-1 ring-emerald-500/30" : "hover:bg-gray-900/50"}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`text-[10px] font-mono ${active ? "text-emerald-300" : "text-gray-500"}`}>S{scene.scene_number}</span>
                  <span className={`text-xs font-medium truncate ${active ? "text-gray-100" : "text-gray-300"}`}>
                    {scene.title || "Untitled scene"}
                  </span>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); onDeleteScene(scene.id); }}
                  className="flex-shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-red-900/40 text-gray-600 hover:text-red-400 transition"
                  title="Delete scene"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              {scene.summary && (
                <p className="text-[11px] text-gray-500 leading-relaxed line-clamp-2">{scene.summary}</p>
              )}
              <div className="flex items-center gap-2 mt-2 text-[10px] text-gray-600">
                <span>{sceneShots.length} shot{sceneShots.length === 1 ? "" : "s"}</span>
                {generated > 0 && (
                  <span className={phase === "animate" ? "text-blue-400/70" : "text-emerald-400/70"}>
                    - {generated} rendered
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function OutlineSidebar({ data }: FilmSidebarProps) {
  const { project, onAddScene } = data;
  return (
    <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
      <section className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-emerald-300" />
          <span className="text-[11px] uppercase tracking-wider text-gray-200 font-semibold">Start the outline</span>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">
          Add scenes and shots before rendering. Once the outline exists, this panel becomes a scene switcher for review and generation.
        </p>
        <div className="rounded-md border border-gray-800 bg-black/30 p-3 space-y-1.5">
          <p className="text-[10px] uppercase tracking-wider text-gray-500">Recommended structure</p>
          <p className="text-[11px] text-gray-300 leading-relaxed">Scene: location, time, mood, cast.</p>
          <p className="text-[11px] text-gray-300 leading-relaxed">Shot: framing, image prompt, motion prompt, duration.</p>
        </div>
      </section>

      <section className="space-y-2.5">
        <p className="text-[10px] uppercase tracking-wider text-gray-500 font-medium">Project</p>
        <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-3 space-y-2">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-gray-600">Title</p>
            <p className="text-sm text-gray-100 mt-0.5">{project.title}</p>
          </div>
          {project.description && (
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-600">Description</p>
              <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{project.description}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-600">Aspect</p>
              <p className="text-xs text-gray-300 mt-0.5 font-mono">{project.aspect_ratio}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-600">Duration</p>
              <p className="text-xs text-gray-300 mt-0.5">{project.duration_seconds ?? "-"}s</p>
            </div>
          </div>
          {project.characters.length > 0 && (
            <div className="pt-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-600 mb-1.5">Cast</p>
              <div className="flex flex-wrap gap-1">
                {project.characters.map((id) => (
                  <span key={id} className="inline-flex items-center gap-1 rounded-md border border-gray-800 bg-gray-900/40 px-2 py-0.5 text-[11px] text-gray-300 font-mono">
                    <UserCircle className="w-3 h-3 text-gray-500" /> {id}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <button
        onClick={onAddScene}
        className="w-full inline-flex items-center justify-center gap-2 rounded-md border border-gray-700 bg-gray-900/40 hover:bg-gray-900 hover:border-gray-600 px-3 py-2.5 text-xs text-gray-300 transition"
      >
        <Plus className="w-3.5 h-3.5" /> Add scene manually
      </button>

      <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-3 flex items-start gap-2.5">
        <Clapperboard className="w-3.5 h-3.5 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-[11px] text-gray-500 leading-relaxed">
          Scenes hold the story beats. Shots inside scenes get rendered into images, then animated. Outline first; only generate after the structure is approved.
        </p>
      </div>
    </div>
  );
}
