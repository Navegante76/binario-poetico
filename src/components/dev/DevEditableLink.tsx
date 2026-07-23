import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Link as LinkIcon, X, ExternalLink, FileWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useContent } from "@/lib/dev-auth";

interface DevEditableLinkProps {
  /**
   * Dot-notation path in SiteContent, e.g. "links.phoneRaw"
   * The value is the canonical source (phone, url, anchor, …).
   */
  path: string;
  /**
   * The canonical value (e.g. the raw phone, the email, the URL).
   * The component persists this exact value to the content store.
   */
  value: string;
  /**
   * Title shown at top of popup (human readable).
   */
  label?: string;
  /**
   * The actual navigable URL — the *resolved* href. This is passed through.
   * Components derive this via `resolveLinks()` before passing it in.
   */
  computedHref: string;
  /**
   * Optional className for the floating "🔗 destino" pill.
   */
  pillClassName?: string;
  /**
   * Optional note shown beneath the input in the popup.
   */
  hint?: string;
}

/**
 * DevEditableLink shows a normal `<a>` (or any external element passed as
 * `children`) but, in developer mode, also shows a small floating pill
 * next to it that opens a portal popup to edit the *canonical* value at
 * `path`. The component does NOT enforce external vs. internal — it just
 * exposes the data the link uses and the resolved computed href for
 * downstream rendering.
 *
 * Use this together with `resolveLinks(links)` from `@/lib/links.tsx`.
 */
export function DevEditableLink({
  path,
  value,
  label,
  computedHref,
  pillClassName,
  hint,
  children,
}: DevEditableLinkProps & { children: React.ReactNode }) {
  const { isDevMode, updateContent } = useContent();
  const [popOpen, setPopOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => setDraft(value), [value]);

  const editable = isDevMode;

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) updateContent(path, trimmed);
    setPopOpen(false);
  };

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
            className="fixed left-1/2 top-1/2 z-[100001] w-[92vw] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-white/10 bg-[#0F172A] p-6 shadow-2xl shadow-black/50"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white inline-flex items-center gap-2">
                <LinkIcon className="h-4 w-4 text-[#DC2626]" />
                {label ?? "Editar destino"}
              </h3>
              <button
                onClick={() => setPopOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-white/40 hover:bg-white/10 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-white/70">Valor</label>
              <Input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="URL · telefone · email · #âncora…"
                className="h-10 rounded-lg border-white/10 bg-white/5 text-sm text-white placeholder:text-white/25 focus-visible:ring-[#DC2626]"
                autoFocus
              />
              {hint && (
                <p className="text-[11px] text-white/40">{hint}</p>
              )}
              <p className="text-[11px] font-mono text-white/40 truncate">
                {path}
              </p>
            </div>

            <div className="mt-4 rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <p className="text-[10px] uppercase tracking-[0.18em] text-white/40 mb-1">
                Resultado
              </p>
              <p className="font-mono text-xs text-white/85 break-all">
                {computedHref}
              </p>
            </div>

            <div className="flex justify-end gap-2 mt-5">
              <Button
                variant="ghost"
                onClick={() => setPopOpen(false)}
                className="text-white/70 hover:text-white"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                className="bg-[#DC2626] text-white hover:bg-[#ef4444]"
              >
                Guardar
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <span className="relative inline-flex items-center gap-2">
        {children}
        {editable && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setPopOpen(true);
            }}
            className={
              pillClassName ??
              "inline-flex items-center gap-1 rounded-full bg-[#DC2626] px-2 py-0.5 text-[10px] font-semibold text-white shadow hover:bg-[#ef4444] transition-colors"
            }
            title={`Editar destino (${path})`}
          >
            <LinkIcon className="h-3 w-3" />
            Destino
          </button>
        )}
      </span>
      {/* External-link indicator (dev-only) so the dev knows the link
          will open in a new tab if computedHref starts with http. */}
      {editable && computedHref.startsWith("http") && (
        <ExternalLink
          aria-hidden
          className="ml-1 inline h-3 w-3 text-white/30"
        />
      )}
      {mounted && createPortal(popup, document.body)}
    </>
  );
}
