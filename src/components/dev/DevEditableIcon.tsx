import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  X,
  Wrench,
  Image as ImageIcon,
  Sparkles,
  Upload,
  Camera,
  FileWarning,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContent } from "@/lib/dev-auth";
import {
  DynamicIcon,
  ICON_PICKER_LIBRARY,
  isValidIcon,
  isIconUrl,
} from "@/lib/icon-registry";
import { processLocalImage, formatBytes } from "@/lib/image-upload";

type Mode = "icon" | "image";

interface DevEditableIconProps {
  /** Dot-notation path, e.g. "services.items.0.icon" */
  path: string;
  /** Current icon name OR image URL */
  iconName: string;
  /** Tailwind classes applied to the rendered icon / <img>. */
  className?: string;
  strokeWidth?: number;
  size?: number;
  locked?: boolean;
}

/**
 * Renders a Lucide icon (or image URL via DynamicIcon) and, in dev mode,
 * opens an inline picker popup when clicked. The popup is rendered through
 * a React Portal so ancestor stacking contexts (Hero `isolate`, framer-motion
 * transforms) cannot trap it.
 *
 * Supports two modes: "icon" (Lucide name picker) and "image" (URL or local
 * upload — JPEG/PNG/SVG, max 512 px for icons/logos, canvas-recompressed).
 */
export function DevEditableIcon({
  path,
  iconName,
  className,
  strokeWidth,
  size,
  locked = false,
}: DevEditableIconProps) {
  const { isDevMode, updateContent } = useContent();
  const [popOpen, setPopOpen] = useState(false);
  const [mode, setMode] = useState<Mode>(isIconUrl(iconName) ? "image" : "icon");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState(iconName);
  const [mounted, setMounted] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [uploadError, setUploadError] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [draftLabel, setDraftLabel] = useState<string>("");
  const [draftSize, setDraftSize] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ICON_PICKER_LIBRARY;
    return ICON_PICKER_LIBRARY.filter((n) => n.toLowerCase().includes(q));
  }, [search]);

  const editable = isDevMode && !locked;

  const openPopup = () => {
    setDraft(iconName);
    setMode(isIconUrl(iconName) ? "image" : "icon");
    setSearch("");
    setImgError(false);
    setUploadError("");
    setDraftLabel(iconName.startsWith("data:") ? "Imagem carregada" : iconName);
    setDraftSize(0);
    setPopOpen(true);
  };

  const handleConfirm = () => {
    if (!isValidIcon(draft)) {
      setPopOpen(false);
      return;
    }
    if (draft !== iconName) {
      updateContent(path, draft);
    }
    setPopOpen(false);
  };

  const switchToIconMode = () => {
    setMode("icon");
    if (isIconUrl(draft)) {
      setDraft("");
    }
  };

  const openFilePicker = () => {
    setUploadError("");
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setBusy(true);
    setUploadError("");
    setImgError(false);
    try {
      // Icons/logos are small — keep tight budget so storage stays light.
      const result = await processLocalImage(file, 512, 0.85);
      setDraft(result.dataUrl);
      setDraftLabel(file.name);
      setDraftSize(result.bytes);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Erro a processar a imagem.";
      setUploadError(msg);
    } finally {
      setBusy(false);
    }
  };

  const wrapperClass = editable
    ? "relative z-[2] inline-flex cursor-pointer rounded-full ring-2 ring-[#DC2626]/40 hover:ring-[#DC2626]/80 transition-shadow"
    : "";

  const popup = (
    <AnimatePresence>
      {popOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/60 backdrop-blur-sm"
            onClick={() => setPopOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed left-1/2 top-1/2 z-[100001] w-[92vw] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0F172A] p-5 shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white inline-flex items-center gap-2">
                <Wrench className="h-4 w-4 text-[#DC2626]" /> Trocar ícone
              </h3>
              <button
                onClick={() => setPopOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Tab switcher */}
            <div className="flex border-b border-white/10 mb-4">
              <button
                type="button"
                onClick={switchToIconMode}
                className={`flex items-center gap-1.5 pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  mode === "icon"
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                <Sparkles className="h-3.5 w-3.5" />
                Ícone Lucide
              </button>
              <button
                type="button"
                onClick={() => setMode("image")}
                className={`flex items-center gap-1.5 pb-2 px-4 text-sm font-medium border-b-2 transition-colors ${
                  mode === "image"
                    ? "border-[#DC2626] text-[#DC2626]"
                    : "border-transparent text-white/50 hover:text-white"
                }`}
              >
                <ImageIcon className="h-3.5 w-3.5" />
                Imagem (URL)
              </button>
            </div>

            {mode === "icon" ? (
              <>
                <div className="relative mb-4">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Pesquisar ou escrever nome (ex: Wrench, Car, Battery)..."
                    className="w-full h-10 pl-10 pr-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/40"
                  />
                </div>

                <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 p-3 border border-[#DC2626]/30">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#DC2626]/15 text-[#DC2626]">
                    <DynamicIcon name={draft || iconName} className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-white/60">Ícone atual</p>
                    <p className="text-sm font-semibold text-white truncate">
                      {draft || iconName}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-32 h-8 rounded-md border border-white/10 bg-[#0F172A] text-sm text-white px-2 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/40"
                    placeholder="Nome Lucide"
                  />
                </div>

                <div className="max-h-64 overflow-y-auto -mx-1 px-1">
                  <div className="grid grid-cols-8 gap-1.5">
                    {filtered.map((name) => (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setDraft(name)}
                        className={`group flex h-12 w-full items-center justify-center rounded-md transition-all hover:bg-white/10 ${
                          draft === name
                            ? "bg-[#DC2626]/15 ring-2 ring-[#DC2626]"
                            : "bg-white/5 ring-1 ring-white/5"
                        }`}
                        title={name}
                      >
                        <DynamicIcon
                          name={name}
                          className={`h-5 w-5 transition-colors ${
                            draft === name ? "text-[#DC2626]" : "text-white/70 group-hover:text-white"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                {/* Local upload row */}
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-white/15 bg-white/[0.03] p-3">
                  <Camera className="h-5 w-5 text-[#DC2626] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-white/80">Carregar do computador</p>
                    <p className="text-[11px] text-white/40">
                      Máx. 512 px · SVG passa intacto · demais formatos re-encodados.
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button
                    type="button"
                    onClick={openFilePicker}
                    disabled={busy}
                    variant="outline"
                    className="h-9 px-3 border-white/15 bg-white/5 text-white hover:bg-white/10"
                  >
                    <Upload className="h-4 w-4 mr-1.5" />
                    {busy ? "A carregar…" : "Escolher"}
                  </Button>
                </div>

                {uploadError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-xs text-red-200">
                    <FileWarning className="h-4 w-4 mt-0.5 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                )}

                <input
                  type="text"
                  value={
                    draft && !draft.startsWith("data:") && !draft.startsWith("blob:")
                      ? draft
                      : ""
                  }
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setImgError(false);
                  }}
                  placeholder="…ou URL: https://exemplo.com/logo.png"
                  className="w-full h-10 px-3 rounded-lg border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/40"
                />

                <div className="p-4 border border-white/10 rounded-lg bg-white/5 flex items-center justify-center h-[150px]">
                  {isIconUrl(draft) ? (
                    imgError ? (
                      <span className="text-red-300 text-xs">
                        Não foi possível carregar a imagem. Verifique o URL.
                      </span>
                    ) : (
                      <img
                        src={draft}
                        alt="Preview"
                        className="max-w-full max-h-full object-contain"
                        onError={() => setImgError(true)}
                      />
                    )
                  ) : (
                    <span className="text-white/40 text-sm text-center px-6">
                      Carregue um ficheiro ou cole um URL para ver o preview.
                    </span>
                  )}
                </div>

                {draftLabel && (
                  <p className="text-[11px] text-white/40 truncate flex items-center gap-1.5">
                    <span className="truncate">{draftLabel}</span>
                    {draftSize > 0 && (
                      <>
                        <span className="text-white/25">·</span>
                        <span>{formatBytes(draftSize)}</span>
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            <div className="flex justify-between gap-2 mt-5">
              <p className="text-xs text-white/40 font-mono self-center truncate max-w-[40%]">
                {path}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setPopOpen(false)}
                  className="text-white/70 hover:text-white"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirm}
                  disabled={!isValidIcon(draft) || (mode === "image" && imgError)}
                  className="bg-[#DC2626] text-white hover:bg-[#ef4444] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Aplicar
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span
        onClick={
          editable
            ? (e) => {
                e.preventDefault();
                e.stopPropagation();
                openPopup();
              }
            : undefined
        }
        className={wrapperClass}
        title={editable ? `Trocar ícone (atual: ${iconName})` : undefined}
      >
        <DynamicIcon
          name={iconName}
          className={className}
          strokeWidth={strokeWidth}
          size={size}
        />
      </span>

      {mounted && createPortal(popup, document.body)}
    </>
  );
}
