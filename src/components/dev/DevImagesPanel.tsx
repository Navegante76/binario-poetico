import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Copy,
  Image as ImageIcon,
  Link2,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
import { useContent } from "@/lib/dev-auth";
import { DEFAULT_CONTENT } from "@/data/site-content";

interface DevImagesPanelProps {
  open: boolean;
  onClose: () => void;
}

interface ImageEntry {
  /** Path inside SiteContent (dot.notation) */
  path: string;
  /** Human-friendly section label */
  section: string;
  /** Index/instance label, e.g. "#3" */
  index: string;
}

const ENTRIES: ImageEntry[] = [
  { path: "assets.heroBg", section: "Hero", index: "Fundo" },
  { path: "assets.aboutMain", section: "Sobre Nós", index: "Principal" },
  { path: "assets.aboutSmall", section: "Sobre Nós", index: "Pequena (flutuante)" },
  { path: "assets.ctaBg", section: "CTA Strip", index: "Fundo dramático" },
  ...Array.from({ length: 16 }, (_, i) => ({
    path: `assets.gallery.${i}.src`,
    section: "Galeria",
    index: `#${i + 1}`,
  })),
];

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB — keeps headroom under the 5 MB quota

// ============================================================
// Pure helpers
// ============================================================

function readAsDataUrl(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () =>
      reject(reader.error ?? new Error("Falha ao ler o ficheiro."));
    reader.readAsDataURL(file);
  });
}

/** Read a value at a dot-path inside an arbitrary object. */
function getNested(obj: unknown, path: string): unknown {
  const parts = path.split(".");
  let curr: unknown = obj;
  for (const p of parts) {
    if (curr && typeof curr === "object" && p in (curr as Record<string, unknown>)) {
      curr = (curr as Record<string, unknown>)[p];
    } else {
      return undefined;
    }
  }
  return curr;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function truncate(text: string, max = 56): string {
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1)}…`;
}

function isDataUrl(src: string): boolean {
  return src.startsWith("data:");
}

/** True when the saved value for `path` differs from the default. */
function isCustomized(content: typeof DEFAULT_CONTENT, path: string): boolean {
  const current = getNested(content, path);
  const def = getNested(DEFAULT_CONTENT, path);
  if (current === def) return false;
  if (current === undefined && def === undefined) return false;
  // Different empty/missing cases
  if (!current && !def) return false;
  // At this point anything that's not literally equal counts as customised —
  // including any data: URL the user uploaded.
  return String(current) !== String(def);
}

/** Copy a string to clipboard with graceful fallback for older browsers. */
async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* fall through to legacy fallback */
  }
  try {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.top = "-9999px";
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ============================================================
// Component
// ============================================================

export function DevImagesPanel({ open, onClose }: DevImagesPanelProps) {
  const { content, updateContent } = useContent();
  const [busy, setBusy] = useState<string | null>(null); // path currently being processed
  const [confirming, setConfirming] = useState<string | null>(null); // path awaiting reset confirmation
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [refreshTick, setRefreshTick] = useState(0);
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<string>("all");

  const confirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-dismiss toast after 3 s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Auto-cancel inline confirm after 4 s
  useEffect(() => {
    if (!confirming) return;
    confirmTimerRef.current = setTimeout(() => setConfirming(null), 4000);
    return () => {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    };
  }, [confirming]);

  const flashOk = useCallback((msg: string) => setToast({ kind: "ok", msg }), []);
  const flashErr = useCallback((msg: string) => setToast({ kind: "err", msg }), []);

  // --- Browse flow (clicks "Substituir") ---------------------------------

  const handleReplace = useCallback(
    async (entry: ImageEntry, file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        flashErr(
          `Imagem demasiado grande (${(file.size / 1024 / 1024).toFixed(1)} MB). Limite: 4 MB.`,
        );
        return;
      }
      setBusy(entry.path);
      try {
        const dataUrl = await readAsDataUrl(file);
        updateContent(entry.path, dataUrl);
        setRefreshTick((t) => t + 1);
        flashOk(
          `${entry.section} · ${entry.index} atualizada (${formatBytes(file.size)}).`,
        );
      } catch (err) {
        console.error("[DevImagesPanel] replace failed:", err);
        flashErr(
          err instanceof Error ? err.message : "Não foi possível processar a imagem.",
        );
      } finally {
        setBusy(null);
      }
    },
    [updateContent, flashOk, flashErr],
  );

  const handleFilePicker = useCallback((entry: ImageEntry) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    const onChange = async () => {
      const file = input.files?.[0];
      if (file) await handleReplace(entry, file);
      input.remove();
    };
    input.addEventListener("change", onChange, { once: true });
    document.body.appendChild(input);
    input.click();
  }, [handleReplace]);

  // --- Drag-and-drop ----------------------------------------------------

  const handleDragOver = useCallback((e: React.DragEvent, entry: ImageEntry) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setDragOver(entry.path);
  }, []);

  const handleDragLeave = useCallback((entry: ImageEntry) => {
    setDragOver((curr) => (curr === entry.path ? null : curr));
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, entry: ImageEntry) => {
      e.preventDefault();
      e.stopPropagation();
      setDragOver(null);
      const file = Array.from(e.dataTransfer.files).find((f) =>
        f.type.startsWith("image/"),
      );
      if (!file) {
        flashErr("Apenas ficheiros de imagem são aceites.");
        return;
      }
      await handleReplace(entry, file);
    },
    [handleReplace, flashErr],
  );

  // --- Reset flow (two-step confirm) ------------------------------------

  const handleReset = useCallback(
    (entry: ImageEntry) => {
      // Stage 1: click → ask for confirmation
      if (confirming !== entry.path) {
        setConfirming(entry.path);
        return;
      }
      // Stage 2: confirmed → restore the DEFAULT_CONTENT value
      const defaultValue = getNested(DEFAULT_CONTENT, entry.path);
      if (defaultValue === undefined) {
        flashErr("Não foi possível encontrar o valor original.");
        setConfirming(null);
        return;
      }
      setBusy(entry.path);
      try {
        // Write the default value back via updateContent so the in-memory
        // store AND the localStorage persist it consistently. This is
        // strictly better than the previous "delete + push '' " approach
        // which left a blank image on next reload.
        updateContent(entry.path, defaultValue);
        setRefreshTick((t) => t + 1);
        flashOk(`${entry.section} · ${entry.index} reposta para o original.`);
      } catch (err) {
        console.error("[DevImagesPanel] reset failed:", err);
        flashErr(
          err instanceof Error ? err.message : "Não foi possível repor.",
        );
      } finally {
        setBusy(null);
        setConfirming(null);
      }
    },
    [confirming, updateContent, flashOk, flashErr],
  );

  const handleResetCancel = useCallback(() => setConfirming(null), []);

  // --- Copy URL ---------------------------------------------------------

  const handleCopy = useCallback(
    async (entry: ImageEntry, src: string) => {
      if (!src) return;
      const ok = await copyToClipboard(src);
      flashOk(ok ? `URL copiada · ${entry.section} · ${entry.index}` : "Não foi possível copiar.");
    },
    [flashOk],
  );

  // --- Filtering --------------------------------------------------------

  const filteredEntries = useMemo(() => {
    if (filter === "all") return ENTRIES;
    return ENTRIES.filter((e) => e.section === filter);
  }, [filter]);

  const sections = useMemo(() => {
    const set = new Set<string>();
    ENTRIES.forEach((e) => set.add(e.section));
    return ["all", ...Array.from(set)];
  }, []);

  // --- Render -----------------------------------------------------------

  const panel = (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100000] bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ x: 480, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 480, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-2xl flex-col border-l border-border/40 bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#DC2626]/15">
                  <Camera className="h-4.5 w-4.5 text-[#DC2626]" />
                </span>
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Galeria de Imagens
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {ENTRIES.length} imagens · arrasta ou clica para substituir
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Fechar painel"
                title="Fechar (Esc)"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Filter chips */}
            <div className="flex flex-wrap items-center gap-1.5 border-b border-border/40 bg-secondary/30 px-6 py-3">
              {sections.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(s)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    filter === s
                      ? "bg-[#DC2626] text-white shadow-sm"
                      : "bg-card text-muted-foreground ring-1 ring-border hover:text-foreground"
                  }`}
                  aria-pressed={filter === s}
                >
                  {s === "all" ? "Todas" : s}
                  <span
                    className={`rounded-full px-1.5 text-[9px] font-bold ${
                      filter === s ? "bg-white/20" : "bg-secondary"
                    }`}
                  >
                    {s === "all"
                      ? ENTRIES.length
                      : ENTRIES.filter((e) => e.section === s).length}
                  </span>
                </button>
              ))}
            </div>

            {/* Banner */}
            <div className="px-6 pt-4">
              <div className="rounded-xl border border-amber-300/60 bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:border-amber-300/30 dark:bg-amber-900/20 dark:text-amber-200">
                ⚠ Limite: <strong>4 MB</strong> por imagem (quota do
                localStorage ~5 MB). Cada ficheiro é convertido para data URL e
                gravado em
                <code className="mx-1 rounded bg-amber-100 px-1 dark:bg-amber-900/40">
                  oficina_site_content_v4
                </code>
                .
              </div>
            </div>

            {/* Cards */}
            <div className="flex-1 overflow-y-auto p-6">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {filteredEntries.map((entry) => {
                  const isBusy = busy === entry.path;
                  const isConfirming = confirming === entry.path;
                  const isHovered = dragOver === entry.path;
                  const currentSrc = String(getNested(content, entry.path) ?? "");
                  const defaultSrc = String(getNested(DEFAULT_CONTENT, entry.path) ?? "");
                  const customized = isCustomized(content, entry.path);
                  return (
                    <li
                      key={entry.path}
                      className={`group flex flex-col overflow-hidden rounded-2xl border bg-secondary/40 transition-colors ${
                        isHovered
                          ? "border-[#DC2626] ring-2 ring-[#DC2626]/30"
                          : "border-border/60"
                      }`}
                      onDragOver={(e) => handleDragOver(e, entry)}
                      onDragLeave={() => handleDragLeave(entry)}
                      onDrop={(e) => handleDrop(e, entry)}
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-muted">
                        {currentSrc ? (
                          <img
                            key={`${entry.path}-${refreshTick}`}
                            src={currentSrc}
                            alt={`${entry.section} ${entry.index}`}
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-muted-foreground/60">
                            <ImageIcon className="h-10 w-10" aria-hidden />
                          </div>
                        )}

                        {/* Hover badges */}
                        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-[#DC2626]/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm">
                            {entry.section}
                          </span>
                          {customized && (
                            <span
                              title="Esta imagem foi substituída e difere do original"
                              className="inline-flex items-center gap-1 rounded-md bg-amber-500/95 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.16em] text-white shadow-sm"
                            >
                              <span className="h-1.5 w-1.5 rounded-full bg-white" />
                              Personalizado
                            </span>
                          )}
                          {isDataUrl(currentSrc) && (
                            <span className="rounded-md bg-black/70 px-2 py-0.5 text-[10px] font-medium text-white shadow-sm">
                              LOCAL
                            </span>
                          )}
                        </div>

                        {/* Drag-overlay */}
                        {isHovered && (
                          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#DC2626]/70 text-sm font-semibold text-white">
                            <Upload className="mr-2 h-5 w-5" />
                            Solta para substituir
                          </div>
                        )}

                        {/* Busy overlay */}
                        {isBusy && (
                          <div
                            aria-hidden
                            className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs font-semibold text-white"
                          >
                            <span className="flex items-center gap-2">
                              <span className="h-2 w-2 animate-pulse rounded-full bg-white" />
                              A processar…
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Metadata + actions */}
                      <div className="flex flex-col gap-2 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-xs font-semibold text-foreground">
                              {entry.index}
                            </p>
                            <p
                              className="truncate font-mono text-[10px] text-muted-foreground"
                              title={entry.path}
                            >
                              {entry.path}
                            </p>
                          </div>
                        </div>
                        {customized && defaultSrc && (
                          <button
                            type="button"
                            onClick={() => handleCopy(entry, defaultSrc)}
                            className="group/orig inline-flex items-center gap-1.5 rounded-md bg-secondary/60 px-2 py-1 text-left text-[10px] text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                            title="Copiar URL original"
                          >
                            <Link2 className="h-3 w-3 shrink-0" />
                            <span className="truncate font-mono">
                              Original: {truncate(defaultSrc, 48)}
                            </span>
                            <Copy className="h-3 w-3 shrink-0 opacity-0 transition-opacity group-hover/orig:opacity-100" />
                          </button>
                        )}

                        {/* Two-stage Repor confirm */}
                        {isConfirming ? (
                          <div className="flex flex-col gap-1.5 rounded-xl bg-amber-50/80 px-3 py-2 text-xs text-amber-900 dark:bg-amber-900/20 dark:text-amber-200">
                            <span className="font-medium">Repor original?</span>
                            <p className="text-[10px] opacity-80">
                              A tua imagem personalizada será substituída pela
                              foto original do site.
                            </p>
                            <div className="mt-1 flex gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReset(entry)}
                                className="flex-1 rounded-full bg-[#DC2626] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white transition-colors hover:bg-[#ef4444]"
                                disabled={isBusy}
                                autoFocus
                              >
                                Sim, repor
                              </button>
                              <button
                                type="button"
                                onClick={handleResetCancel}
                                className="flex-1 rounded-full border border-amber-300/60 bg-background px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-foreground transition-colors hover:bg-secondary"
                                disabled={isBusy}
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex gap-2">
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => handleFilePicker(entry)}
                              title="Escolher imagem (clique ou arrastra)"
                              aria-label={`Substituir ${entry.section} ${entry.index}`}
                              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-[#DC2626] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#ef4444] disabled:opacity-60"
                            >
                              <Camera className="h-3.5 w-3.5" />
                              Substituir
                            </button>
                            <button
                              type="button"
                              disabled={isBusy || !customized}
                              onClick={() => handleReset(entry)}
                              title={
                                customized
                                  ? "Repor imagem original"
                                  : "Já está no valor original"
                              }
                              aria-label={`Repor ${entry.section} ${entry.index}`}
                              className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-[#DC2626] transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Repor
                            </button>
                            {currentSrc && (
                              <button
                                type="button"
                                onClick={() => handleCopy(entry, currentSrc)}
                                title="Copiar URL atual"
                                aria-label="Copiar URL atual"
                                className="inline-flex items-center justify-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
              {filteredEntries.length === 0 && (
                <div className="mt-8 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
                  <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
                  <p>Nenhuma imagem nesta secção.</p>
                </div>
              )}
            </div>

            {/* Footer hints */}
            <div className="border-t border-border/40 bg-secondary/20 px-6 py-3.5">
              <p className="text-[11px] text-muted-foreground">
                💡 As alterações são persistidas em <code>localStorage</code> e
                sobrevivem a reloads. Arrasta um ficheiro directamente sobre
                um cartão para o substituir — ou usa o botão
                <Camera className="mx-1 inline h-3 w-3 align-text-bottom" />
                Substituir.
              </p>
            </div>

            {/* Toasts */}
            <AnimatePresence>
              {toast && (
                <motion.div
                  initial={{ y: 30, opacity: 0, scale: 0.95 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  exit={{ y: 30, opacity: 0, scale: 0.95 }}
                  role={toast.kind === "err" ? "alert" : "status"}
                  className={`absolute bottom-20 left-1/2 z-10 inline-flex items-center gap-1.5 -translate-x-1/2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg ring-1 ring-black/10 ${
                    toast.kind === "err"
                      ? "bg-red-600 text-white"
                      : "bg-emerald-600 text-white"
                  }`}
                >
                  {toast.kind === "err" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  {toast.msg}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;
  return createPortal(panel, document.body);
}
