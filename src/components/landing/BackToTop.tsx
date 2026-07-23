import { useEffect, useState } from "react";
import {
  motion,
  useMotionValueEvent,
  useScroll,
  useTransform,
} from "framer-motion";
import { ArrowUp } from "lucide-react";
import { scrollToElement } from "@/lib/smooth-scroll";
import { useDeviceMotion } from "@/hooks/use-device-motion";

/**
 * Back-to-top floating button + scroll progress indicator.
 *
 * Performance contract:
 *  - This component MUST NOT call setState on every scroll event. Previously,
 *    `handleScroll` did `setVisible(scrollY > 300)` + `setProgress(...)` on
 *    every native scroll tick — on mobile flicks that's 100+ React renders
 *    per second and visibly freezes the page.
 *
 *  - Replacement: subscribe ONCE via framer-motion's `useScroll()`, which
 *    already batches updates to the animation frame and exposes the value as
 *    a MotionValue<number> with zero React renders. The progress bar reads
 *    `scrollYProgress` directly via `scaleX` on a `motion.div` (composited,
 *    no layout). Visibility is toggled via `useMotionValueEvent` which ONLY
 *    fires setState when the threshold is crossed, not on every scroll tick.
 */
export function BackToTop() {
  const { reduceMotion } = useDeviceMotion();
  const [visible, setVisible] = useState(false);

  // `target: window` reads window scroll position; `offset` defines "start of
  // page" → "end of page" → scrollYProgress goes 0 → 1.
  const { scrollYProgress } = useScroll();

  // Cross the visibility threshold (8% of page) without polling on every
  // tick — useMotionValueEvent only invokes the callback when the value
  // CHANGES, so a slow scroll still fires once, a fast scroll still fires
  // once when it crosses the boundary.
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const shouldShow = v > 0.08;
    setVisible((prev) => (prev === shouldShow ? prev : shouldShow));
  });

  const scrollToTop = () => {
    scrollToElement("#inicio", 0, reduceMotion ? 800 : 1500);
  };

  return (
    <motion.button
      type="button"
      onClick={scrollToTop}
      aria-label="Voltar ao topo"
      initial={false}
      animate={
        visible
          ? { opacity: 1, y: 0, scale: 1 }
          : { opacity: 0, y: 20, scale: 0.85 }
      }
      whileHover={reduceMotion ? {} : { scale: 1.06 }}
      whileTap={reduceMotion ? {} : { scale: 0.94 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ pointerEvents: visible ? "auto" : "none" }}
      className="group fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50 flex h-11 sm:h-13 items-center gap-2 sm:gap-2.5 rounded-full bg-[#DC2626] px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg sm:shadow-xl shadow-red-900/30 active:bg-[#ef4444] sm:hover:bg-[#ef4444] sm:hover:shadow-2xl sm:hover:shadow-red-900/40"
    >
      {/* Seta com pulsação — desativada em mobile */}
      <motion.span
        aria-hidden
        animate={reduceMotion ? {} : { scale: [1, 1.03, 1] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        className="inline-flex"
      >
        <ArrowUp className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
      </motion.span>

      <span className="hidden sm:inline">Voltar ao topo</span>

      {/* Barra de progresso — agora com scaleX direto via MotionValue.
           transform-origin: left para crescer da esquerda para a direita.
           GPU-only — não causa layout/paint em scroll. */}
      <span
        aria-hidden
        className="absolute inset-x-1.5 bottom-1 h-0.5 overflow-hidden rounded-full bg-white/20"
      >
        <motion.span
          aria-hidden
          style={{ scaleX: scrollYProgress, transformOrigin: "0% 50%" }}
          className="block h-full w-full rounded-full bg-white/80 will-change-transform"
        />
      </span>
    </motion.button>
  );
}
