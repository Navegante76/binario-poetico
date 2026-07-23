import { useEffect, useRef, useState } from "react";
import { Camera, ImageIcon, RefreshCw } from "lucide-react";
import { useContent } from "@/lib/dev-auth";

interface DevEditableImageProps {
  /** Dot-notation path in SiteContent (e.g. "assets.gallery.0.src"). */
  path?: string;
  /** Label shown in the dev-mode overlay (e.g. "Galeria #3"). */
  label?: string;
  /** Current image URL — read from content store */
  src: string;
  /** Alt text */
  alt?: string;
  /** Optional aspect ratio applied to the wrapper */
  aspectClass?: string;
  /** Apply as CSS background-image instead of an <img> element */
  asBackground?: boolean;
  /** Tailwind classes for outer wrapper */
  className?: string;
  /** Retained for API compatibility. */
  locked?: boolean;
}

/**
 * Image renderer with optional in-place dev-mode upload.
 *
 * Normal users (and the `employee` role) get a plain `<img>` — same UX
 * as before. Privileged devs (manager/boss/developer) get a hover overlay with:
 *   • "📷 Substituir imagem" — file picker → FileReader → data URL → useContent
 *   • "↺ Repor original"    — wipe the saved value (next load reseeds from
 *                             DEFAULT_CONTENT)
 *
 * Note: paths mirror DEFAULT_CONTENT shape; if a `path` is omitted the
 * component renders read-only.
 */
export function DevEditableImage({
  path,
  label,
  src,
  alt = "",
  aspectClass,
  asBackground = false,
  className = "",
}: DevEditableImageProps) {
  const { updateContent, canEditContent } = useContent();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Show the just-uploaded preview locally before the store round-trip;
  // clear it whenever the upstream `src` changes (e.g. another tab edited).
  const displaySrc = preview ?? src ?? "";
  useEffect(() => {
    setPreview((curr) => (curr && curr !== src ? null : curr));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src]);

  const handlePick = (e: React.MouseEvent) => {
    if (!canEditContent || !path) return;
    e.preventDefault();
    e.stopPropagation();
    fileInputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !path) return;
    setErrorMsg(null);
    // Cap file size to prevent blowing past localStorage quota (~5 MB).
    if (file.size > 4 * 1024 * 1024) {
      setErrorMsg("A imagem excede 4 MB — escolhe um ficheiro mais pequeno.");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await readAsDataUrl(file);
      setPreview(dataUrl);
      updateContent(path, dataUrl);
    } catch (err) {
      console.error("[DevEditableImage] upload failed:", err);
      setErrorMsg("Não foi possível carregar a imagem.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRevert = (e: React.MouseEvent) => {
    if (!canEditContent || !path) return;
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm("Repor a imagem original deste campo?")) return;
    // Wipe the saved value at this exact path. On next reload the loader
    // will fall through to cold-start and reseed from DEFAULT_CONTENT.
    try {
      const KEY = "oficina_site_content_v4";
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        deletePathInPlace(parsed, path);
        localStorage.setItem(KEY, JSON.stringify(parsed));
        updateContent(path, "");
      }
    } catch {
      /* fall through to resetContent if user confirms in caller */
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────

  const wrapperStyle = asBackground
    ? { backgroundImage: `url('${displaySrc}')` }
    : undefined;

  const canEdit = canEditContent && path;

  if (!displaySrc) {
    return (
      <div
        className={`flex items-center justify-center bg-secondary/60 text-muted-foreground ${aspectClass ?? ""} ${className}`}
      >
        <ImageIcon className="h-6 w-6 opacity-50" aria-hidden />
      </div>
    );
  }

  return (
    <div
      className={`relative ${aspectClass ?? ""} h-full w-full ${className}`}
      style={wrapperStyle}
      data-dev-editable={canEdit ? "true" : undefined}
    >
      {!asBackground && (
        <img
          src={displaySrc}
          alt={alt}
          loading="lazy"
          className={`h-full w-full object-cover ${className}`}
        />
      )}
      {asBackground && (
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url('${displaySrc}')` }}
        />
      )}

      {canEdit && (
        <>
          {/* Hover overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100"
            style={{
              background:
                "linear-gradient(180deg, rgba(15,23,42,0.0) 0%, rgba(15,23,42,0.65) 60%, rgba(15,23,42,0.85) 100%)",
            }}
            aria-hidden
          />
          <div className="pointer-events-none absolute left-2 top-2 z-10 hidden sm:flex items-center gap-1.5 rounded-full bg-[#DC2626]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white shadow-sm">
            <Camera className="h-3 w-3" />
            <span>{label ?? path ?? "editable"}</span>
          </div>
          <div className="absolute right-2 bottom-2 z-10 flex flex-wrap items-center gap-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100 focus-within:opacity-100">
            <button
              type="button"
              onClick={handlePick}
              disabled={uploading}
              title={uploading ? "A carregar…" : "Substituir imagem"}
              aria-label="Substituir imagem"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[#0F172A] shadow-md ring-1 ring-black/10 transition-colors hover:bg-white/90 disabled:opacity-60"
            >
              <Camera className="h-3.5 w-3.5" />
              {uploading ? "A carregar…" : "Substituir"}
            </button>
            <button
              type="button"
              onClick={handleRevert}
              title="Repor imagem original"
              aria-label="Repor imagem original"
              className="pointer-events-auto inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#DC2626] shadow-md ring-1 ring-black/10 transition-colors hover:bg-white"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Repor
            </button>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white shadow-lg ring-1 ring-black/20"
            >
              {errorMsg}
            </div>
          )}

          {/* Hidden file input — clicks bubble up from the buttons above */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFile}
          />
        </>
      )}
    </div>
  );
}

/* ─── helpers ─────────────────────────────────────────────────────────── */

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error ?? new Error("read failed"));
    reader.readAsDataURL(file);
  });
}

/** Mutates `obj` in place to remove `path` (dot.notation). */
function deletePathInPlace(obj: Record<string, unknown>, path: string): void {
  const parts = path.split(".");
  let curr: Record<string, unknown> | undefined = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const next = curr?.[parts[i]];
    if (!next || typeof next !== "object") return;
    curr = next as Record<string, unknown>;
  }
  if (curr && parts.length > 0) {
    delete curr[parts[parts.length - 1]];
  }
}
