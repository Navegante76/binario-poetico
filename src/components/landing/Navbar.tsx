import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, Moon, Sun, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";
import { useMounted } from "@/hooks/use-mounted";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableLink } from "@/components/dev/DevEditableLink";
import { resolveLinks } from "@/lib/links";
import { handleAnchorClick } from "@/lib/smooth-scroll";
import { useDeviceMotion } from "@/hooks/use-device-motion";

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const mounted = useMounted();
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const { content } = useContent();
  const c = content.navbar;
  const L = resolveLinks(content.links);
  const navAnchors = L.navAnchors;
  const { reduceMotion } = useDeviceMotion();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 sm:duration-500 ${
        scrolled
          ? reduceMotion
            ? "bg-white border-b border-slate-200/70 shadow-sm dark:bg-[#0b1426] dark:border-white/10"
            : "bg-white/85 backdrop-blur-xl border-b border-slate-200/70 shadow-[0_2px_20px_-12px_rgba(15,23,42,0.25)] dark:bg-[#0b1426]/85 dark:border-white/10"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 sm:h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        {/* Brand — NV76 HUB round logo (never cropped, never deformed) */}
        <a
          href={navAnchors[0] ?? "#inicio"}
          onClick={(e) => handleAnchorClick(e, navAnchors[0] ?? "#inicio")}
          className="group flex shrink-0 items-center"
          aria-label="NV76 HUB — Início"
        >
          <span className="sr-only">
            <DevEditable path="navbar.brandName" value={c.brandName} />
          </span>
          {/* h-fixed + w-auto + object-contain + shrink-0 → aspect ratio intact,
              no stretch, no crop, ever. */}
          <img
            src="/images/nv76-hub-logo.svg"
            alt="NV76 HUB"
            className="h-12 sm:h-14 w-auto shrink-0 object-contain transition-transform duration-300 group-hover:scale-[1.04]"
            draggable={false}
          />
        </a>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 lg:flex">
          {c.items.map((item, i) => (
            <a
              key={`${item}-${navAnchors[i] ?? i}`}
              href={navAnchors[i] ?? "#"}
              onClick={(e) => handleAnchorClick(e, navAnchors[i] ?? "#")}
              className={`relative rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                scrolled
                  ? "text-slate-700 hover:text-[#0F172A] dark:text-slate-200 dark:hover:text-white"
                  : "text-white/85 hover:text-white"
              }`}
            >
              <DevEditable path={`navbar.items.${i}`} value={item} locked />
            </a>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Alternar tema"
            className={`hidden sm:inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
              scrolled
                ? "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
                : "text-white/90 hover:bg-white/10"
            }`}
          >
            {mounted && isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
          </button>

          <DevEditableLink
            path="links.orcamentoAnchor"
            value={content.links.orcamentoAnchor}
            label="CTA Orçamento · Âncora"
            computedHref={L.orcamentoAnchor}
            pillClassName="hidden lg:inline-flex items-center gap-1 rounded-full bg-[#DC2626]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#DC2626] hover:bg-[#DC2626]/25 transition-colors"
            hint="Âncora interna, ex: #orcamento, #contactos, ou um URL completo."
          >
            <Button
              asChild
              size="sm"
              className="rounded-full bg-[#DC2626] px-5 font-semibold text-white shadow-lg shadow-red-900/20 hover:bg-[#ef4444]"
            >
              <a href={L.orcamentoAnchor} onClick={(e) => handleAnchorClick(e, L.orcamentoAnchor)}>
                <DevEditable path="navbar.ctaButton" value={c.ctaButton} />
              </a>
            </Button>
          </DevEditableLink>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
            aria-expanded={open}
            className={`lg:hidden inline-flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-full transition-colors ${
              scrolled
                ? "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
                : "text-white hover:bg-white/10"
            }`}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu — simpler transition on mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="mobile"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -10 }}
            transition={{ duration: reduceMotion ? 0.15 : 0.25, ease: "easeOut" }}
            className="lg:hidden overflow-hidden border-t border-border/40 bg-background"
          >
            <nav className="flex flex-col gap-1 px-5 py-6">
              {c.items.map((item, i) => (
                <a
                  key={`${item}-mobile`}
                  href={navAnchors[i] ?? "#"}
                  onClick={(e) => { setOpen(false); handleAnchorClick(e, navAnchors[i] ?? "#"); }}
                  className="rounded-xl px-4 py-3 text-base font-medium text-foreground active:bg-secondary"
                >
                  {item}
                </a>
              ))}
              <a
                href={L.orcamentoAnchor}
                onClick={(e) => { setOpen(false); handleAnchorClick(e, L.orcamentoAnchor); }}
                className="mt-3 inline-flex items-center justify-center rounded-xl bg-[#DC2626] px-4 py-3 text-base font-semibold text-white shadow-md active:bg-[#ef4444]"
              >
                <DevEditable path="navbar.ctaButton" value={c.ctaButton} locked />
              </a>
              <button
                type="button"
                onClick={toggleTheme}
                className="mt-1 inline-flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-medium text-foreground"
              >
                {mounted && isDark ? <><Sun className="h-4 w-4" /> Modo claro</> : <><Moon className="h-4 w-4" /> Modo escuro</>}
              </button>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
