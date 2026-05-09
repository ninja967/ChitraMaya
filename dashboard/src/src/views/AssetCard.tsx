import { useState } from "react";
import { Check, Trash2, X, Play } from "lucide-react";
import type { MediaItem } from "../models";

interface AssetCardProps {
  item: MediaItem;
  onOpen: () => void;
  onDelete: (item: MediaItem) => Promise<void> | void;
}

export function AssetCard({ item, onOpen, onDelete }: AssetCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function confirm(event: React.MouseEvent) {
    event.stopPropagation();
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete(item);
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div
      onClick={onOpen}
      className="cursor-pointer rounded-xl overflow-hidden border border-white/[0.06] hover:border-emerald-500/25 aspect-video bg-[#080a0d] relative group transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/5 hover:-translate-y-1 hover:scale-[1.02]"
    >
      {/* Media */}
      {item.type === "video" ? (
        <video src={item.thumb || item.url} className="w-full h-full object-cover" preload="metadata" muted />
      ) : (
        <img src={item.thumb || item.url} alt={item.name || ""} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out" loading="lazy" />
      )}

      {/* Ambient gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Delete button */}
      {!confirmDelete && (
        <button
          onClick={(event) => {
            event.stopPropagation();
            setConfirmDelete(true);
          }}
          className="absolute top-2 right-2 z-10 w-8 h-8 rounded-lg bg-black/50 backdrop-blur-md text-white/70 flex items-center justify-center opacity-0 group-hover:opacity-100 hover:bg-red-600/90 hover:text-white transition-all duration-200 border border-white/[0.06]"
          title="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Bottom info bar */}
      <div className="absolute bottom-0 left-0 right-0 p-3 pt-8 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none translate-y-1 group-hover:translate-y-0">
        <p className="text-xs font-semibold truncate text-white/90 drop-shadow-lg">{item.name || "Untitled"}</p>
      </div>

      {/* Video badge */}
      {item.type === "video" && (
        <div className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 border border-white/[0.08]">
          <Play className="w-2.5 h-2.5 fill-white" />
          VIDEO
        </div>
      )}

      {/* Delete confirmation overlay */}
      {confirmDelete && (
        <div
          className="absolute inset-0 z-20 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 animate-fade-in"
          onClick={(event) => {
            event.stopPropagation();
            setConfirmDelete(false);
          }}
        >
          <span className="text-xs font-bold uppercase tracking-wider text-white/80">Delete this?</span>
          <div className="flex gap-3" onClick={(event) => event.stopPropagation()}>
            <button
              onClick={() => setConfirmDelete(false)}
              className="w-10 h-10 rounded-full bg-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.1] flex items-center justify-center transition-all duration-200 border border-white/[0.06]"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={confirm}
              disabled={deleting}
              className="w-10 h-10 rounded-full bg-red-600/80 text-white hover:bg-red-500 disabled:bg-gray-800 disabled:text-gray-600 flex items-center justify-center transition-all duration-200"
              title="Confirm delete"
            >
              <Check className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
