import { CheckCircle2, Film, GitBranch, ShieldCheck, Terminal } from "lucide-react";

export function FilmsGuide({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "h-full overflow-y-auto p-4 space-y-4" : "max-w-3xl mx-auto p-8 space-y-5"}>
      <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-md border border-emerald-500/20 bg-emerald-500/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <h2 className={compact ? "text-lg font-bold tracking-tight" : "text-xl font-bold tracking-tight"}>
              Project Pipeline
            </h2>
            <p className="text-sm text-gray-500">Structured scenes, shots, approvals, and render jobs.</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4 space-y-3">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-emerald-300" />
          <span className="text-sm font-semibold text-gray-200">Recommended judge demo flow</span>
        </div>
        <div className="space-y-3">
          {[
            "Create a project record with title, aspect ratio, duration, and owned identity assets.",
            "Break the story into scenes and shots before spending GPU time.",
            "Generate storyboard images one shot at a time.",
            "Animate approved frames into short clips.",
            "Export or present the final sequence with job metadata and model provenance.",
          ].map((item, index) => (
            <div key={item} className="flex gap-3">
              <div className="w-6 h-6 rounded-md bg-gray-900 border border-gray-800 flex items-center justify-center flex-shrink-0">
                <span className="text-[10px] text-gray-400">{index + 1}</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed pt-1">{item}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {[
          {
            icon: CheckCircle2,
            title: "Why this matters",
            body: "A project is reviewable before rendering. That makes the demo feel controlled, auditable, and GPU-aware.",
          },
          {
            icon: ShieldCheck,
            title: "Identity safety",
            body: "Only owned or synthetic identity assets should be attached to projects. Keep consent and dataset provenance visible.",
          },
          {
            icon: Terminal,
            title: "Developer proof",
            body: "Every action maps to an API endpoint, so an agent can operate the same pipeline that the UI exposes.",
          },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="rounded-lg border border-gray-800 bg-[#0c0f13] p-4">
            <Icon className="w-4 h-4 text-emerald-300" />
            <p className="text-sm font-semibold text-gray-200 mt-3">{title}</p>
            <p className="text-xs text-gray-500 leading-relaxed mt-1">{body}</p>
          </div>
        ))}
      </div>

      <details className="rounded-lg border border-gray-800 bg-[#0c0f13] overflow-hidden">
        <summary className="px-4 py-2.5 cursor-pointer hover:bg-gray-900 transition list-none">
          <span className="text-[11px] text-gray-500">API endpoints</span>
        </summary>
        <div className="px-4 pb-4">
          <pre className="text-[10px] text-gray-500 font-mono leading-relaxed whitespace-pre-wrap">
{`POST   /api/projects
POST   /api/projects/:id/scenes
POST   /api/projects/:id/scenes/:sid/shots
POST   /api/projects/:id/scenes/:sid/shots/:shot/generate-image
POST   /api/projects/:id/scenes/:sid/shots/:shot/animate
GET    /api/projects/:id`}
          </pre>
        </div>
      </details>
    </div>
  );
}
