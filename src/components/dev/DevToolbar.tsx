import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Edit3,
  Eye,
  FolderArchive,
  Inbox,
  LogOut,
  NotebookPen,
  RotateCcw,
  Save,
  Users,
  X,
  ChevronUp,
} from "lucide-react";
import { useDevAuth, useContent } from "@/lib/dev-auth";
import { SubmissionsPanel } from "@/components/dev/SubmissionsPanel";
import { DevAccountsPanel } from "@/components/dev/DevAccountsPanel";
import { DevExportPanel } from "@/components/dev/DevExportPanel";
import { DevImagesPanel } from "@/components/dev/DevImagesPanel";
import { useSubmissions } from "@/lib/form-submissions";

interface DevNotesProps {
  open: boolean;
  onClose: () => void;
}

const NOTES_KEY = "binario_dev_notes";

function loadNotes(): string {
  try {
    return localStorage.getItem(NOTES_KEY) ?? "";
  } catch {
    return "";
  }
}

function saveNotesToFile(notes: string) {
  try {
    fetch("/api/dev-notes-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    }).catch(() => {});
  } catch {
    /* best-effort */
  }
}

export function DevNotes({ open, onClose }: DevNotesProps) {
  const [notes, setNotes] = useState(loadNotes);
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) setNotes(loadNotes());
  }, [open]);

  const handleSave = () => {
    localStorage.setItem(NOTES_KEY, notes);
    saveNotesToFile(notes);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

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
            initial={{ x: 360, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 360, opacity: 0 }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed right-0 top-0 z-[100001] flex h-full w-full max-w-md flex-col border-l border-border/40 bg-card shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
              <div className="flex items-center gap-2.5">
                <NotebookPen className="h-5 w-5 text-[#DC2626]" />
                <h3 className="text-base font-semibold text-foreground">
                  Anotações do Desenvolvedor
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                aria-label="Fechar anotações"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 p-5">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Escreva aqui as suas notas e lembretes sobre o website... 📝&#10;&#10;Exemplos:&#10;• Trocar imagem do Hero na próxima semana&#10;• Rever descrições dos serviços"
                className="h-full w-full resize-none rounded-xl border border-border/60 bg-secondary/40 p-4 text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-[#DC2626]/40"
              />
            </div>
            <div className="flex items-center justify-between border-t border-border/40 px-5 py-3.5">
              <p className="text-xs text-muted-foreground">
                Ctrl+S para guardar rapidamente
              </p>
              <div className="flex items-center gap-2">
                {saved && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-xs font-medium text-green-600 dark:text-green-400"
                  >
                    ✓ Guardado
                  </motion.span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[#DC2626] px-4 py-2 text-sm font-semibold text-white hover:bg-[#ef4444] transition-colors"
                >
                  <Save className="h-4 w-4" />
                  Guardar Notas
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(panel, document.body);
}

export function DevToolbar() {
  const { isDevAuthenticated, devName, devRole, logout } = useDevAuth();
  const { isDevMode, content, resetContent } = useContent();
  const subs = useSubmissions();
  const [collapsed, setCollapsed] = useState(false);
  const [notesOpen, setNotesOpen] = useState(false);
  const [submissionsOpen, setSubmissionsOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [imagesOpen, setImagesOpen] = useState(false);
  const [savedIndicator, setSavedIndicator] = useState(false);

  // Defensive quota reclaim: wipe the legacy content blobs that older
  // versions of this site used to write. They can be enormous (full
  // SiteContent snapshots) and counting against the ~5 MB localStorage
  // quota was what made every Save click throw QuotaExceededError once
  // the user had uploaded image data URLs.
  //
  // Bumping CONTENT_VERSION in dev-auth.tsx already migrates these
  // away; this is an extra safety net so the user recovers quota
  // headroom on the very next page load without having to clear
  // localStorage manually.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isDevAuthenticated) return;
    try {
      const LEGACY_KEYS = [
        "binario_site_content",
        "oficina_site_content_v1",
        "oficina_site_content_v2",
        "oficina_site_content_v3",
        "binario_dev_notes",
      ] as const;
      let reclaimedBytes = 0;
      for (const k of LEGACY_KEYS) {
        const raw = localStorage.getItem(k);
        if (raw !== null) {
          reclaimedBytes += raw.length;
          localStorage.removeItem(k);
        }
      }
      if (reclaimedBytes > 0) {
        console.info(
          `[DevToolbar] reclaimed ~${(reclaimedBytes / 1024).toFixed(1)} KB from legacy storage keys`,
        );
      }
    } catch {
      /* ignore */
    }
  }, [isDevAuthenticated]);

  if (!isDevAuthenticated) return null;

  const isEmployee = devRole === "employee";
  const isDeveloper = devRole === "developer";

  // Every content edit already auto-persists to the CURRENT key
  // (`oficina_site_content_v4`) via updateContent, so we deliberately
  // do NOT write to localStorage here. Crucially we also do NOT write
  // to the legacy `"binario_site_content"` key — that's a brand-rename
  // bug that caused the Save button to throw QuotaExceededError once
  // the user had uploaded image data URLs, AND that key is in the
  // auto-wipe list at boot time (so writing to it just destroyed the
  // user's data on the next reload).
  const handleSaveAll = () => {
    try {
      fetch("/api/dev-save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      }).catch(() => {});
    } catch {
      /* ignore */
    }
    setSavedIndicator(true);
    setTimeout(() => setSavedIndicator(false), 3000);
  };

  const handleReset = () => {
    if (window.confirm("Repor todo o conteúdo e imagens para os valores originais?")) {
      resetContent();
      window.location.reload();
    }
  };

  return (
    <>
      <motion.div
        initial={{ y: -80 }}
        animate={{ y: collapsed ? -80 : 0 }}
        transition={{ type: "spring", damping: 24, stiffness: 220 }}
        className="fixed left-1/2 top-3 z-[9999] -translate-x-1/2"
      >
        <div className="flex items-center gap-1.5 rounded-2xl border border-[#DC2626]/30 bg-[#0F172A]/95 px-2 py-2 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#DC2626]/15">
            {isDevMode ? (
              <Edit3 className="h-4 w-4 text-[#DC2626]" />
            ) : (
              <Eye className="h-4 w-4 text-green-400" />
            )}
          </span>

          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80">
            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
            {devName}
          </span>

          <div className="flex items-center gap-1">
            {!isEmployee && (
              <>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Sincronizar com o servidor e confirmar tudo guardado (auto-save já está ativo)"
                  aria-label="Guardar alterações"
                >
                  <Save className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setImagesOpen(true)}
                  className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Galeria · Editar imagens"
                  aria-label="Abrir galeria de imagens"
                >
                  <Camera className="h-4 w-4" />
                </button>

                <button
                  type="button"
                  onClick={() => setAccountsOpen(true)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                  title="Equipa · Contas de desenvolvimento"
                  aria-label="Gerir contas de desenvolvimento"
                >
                  <Users className="h-4 w-4" />
                </button>

                {isDeveloper && (
                  <button
                    type="button"
                    onClick={() => setExportOpen(true)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-[#DC2626]/30 hover:text-[#ef4444] transition-colors"
                    title="Exportar · Descarregar projeto completo"
                    aria-label="Exportar projeto"
                  >
                    <FolderArchive className="h-4 w-4" />
                  </button>
                )}
              </>
            )}

            <button
              type="button"
              onClick={() => setSubmissionsOpen(true)}
              className="relative flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              title="Inbox · Pedidos de orçamento"
              aria-label="Abrir inbox de pedidos"
            >
              <Inbox className="h-4 w-4" />
              {subs.newCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[9px] font-bold text-white">
                  {subs.newCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setNotesOpen(true)}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
              title="Anotações"
              aria-label="Abrir anotações"
            >
              <NotebookPen className="h-4 w-4" />
            </button>

            {!isEmployee && (
              <button
                type="button"
                onClick={handleReset}
                className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                title="Repor conteúdo original"
                aria-label="Repor conteúdo"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={logout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-white/50 hover:bg-red-500/20 hover:text-red-400 transition-colors"
              title="Terminar sessão de desenvolvimento"
              aria-label="Sair"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          {savedIndicator && (
            <motion.span
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="hidden sm:inline text-xs font-medium text-green-400"
            >
              ✓ Tudo guardado
            </motion.span>
          )}
        </div>

        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="mt-1 mx-auto flex h-5 w-8 items-center justify-center rounded-full bg-[#0F172A]/80 text-white/50 hover:text-white/80 transition-colors"
          aria-label={collapsed ? "Mostrar barra" : "Esconder barra"}
        >
          <motion.span
            animate={{ rotate: collapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronUp className="h-3 w-3" />
          </motion.span>
        </button>
      </motion.div>

      <DevNotes open={notesOpen} onClose={() => setNotesOpen(false)} />
      <SubmissionsPanel open={submissionsOpen} onClose={() => setSubmissionsOpen(false)} />
      <DevAccountsPanel open={accountsOpen} onClose={() => setAccountsOpen(false)} />
      <DevExportPanel open={exportOpen} onClose={() => setExportOpen(false)} />
      <DevImagesPanel open={imagesOpen} onClose={() => setImagesOpen(false)} />

      <style>{`
        .dev-editable:hover {
          outline-color: rgba(239, 68, 68, 0.6) !important;
          background: rgba(239, 68, 68, 0.04);
        }
        .dev-editable:focus {
          outline-color: rgba(239, 68, 68, 0.9) !important;
          outline-width: 2px;
          background: rgba(239, 68, 68, 0.06);
        }
      `}</style>
    </>
  );
}
