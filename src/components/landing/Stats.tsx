import { useEffect, useRef } from "react";
import { motion, animate, useInView } from "framer-motion";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableIcon } from "@/components/dev/DevEditableIcon";
import { useDeviceMotion } from "@/hooks/use-device-motion";

/**
 * Numerical values shown when the stat is a counter.
 * The order MUST match DEFAULT_CONTENT.stats.items in site-content.ts.
 * Kept as a hardcoded array here because the public landing page is a
 * shipped demo brand — by contract these counters always reflect the
 * hardcoded sample story (128 avaliações + 4.7★ + 100% dedicação).
 * Only the labels are editable in dev mode (via DevEditable).
 */
const STAT_VALUES = [128, 4.7, 100, 0];
const STAT_DECIMALS = [0, 1, 0, 0];
/** Index 3 is the "Multimarcas" callout — text, not a counter. */
const STAT_IS_TEXT = [false, false, false, true];

/**
 * Animated counter — completely REACT-RENDER-FREE.
 *
 * Problem with the previous implementation: it called `setN(value)` from a
 * requestAnimationFrame loop 60 times per second, forcing React to re-render
 * the Stats card (and its parent grid item) and reconcile DOM nodes while
 * the user was scrolling. On low-end phones this was a major jank source
 * because every scroll frame bumped the React scheduler.
 *
 * Solution: framer-motion's `animate(motionValue, target, opts)` writes to
 * a MotionValue (which is just a ref). We mirror it to the DOM via
 * textContent inside an `onUpdate` callback — no React render, no DOM
 * reconciliation, just a single text-node write per frame. The browser
 * paints on its own time (browser handles transform + text, not React).
 */
function Counter({
  to,
  decimals = 0,
  duration = 1800,
  active,
}: {
  to: number;
  decimals?: number;
  duration?: number;
  active: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !active) return;
    // Initial paint at 0 (no React render — we just write text).
    el.textContent = (0).toFixed(decimals);

    // animate() returns a controls object; we use the onUpdate hook so we
    // can mirror numeric MotionValue updates to a DOM textContent. No
    // React renders are involved.
    const controls = animate(0, to, {
      duration: duration / 1000,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (el) el.textContent = v.toFixed(decimals);
      },
    });
    return () => controls.stop();
  }, [active, to, decimals, duration]);

  return <span ref={ref} aria-live="polite">{(0).toFixed(decimals)}</span>;
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const { content } = useContent();
  const c = content.stats;
  const { reduceMotion } = useDeviceMotion();

  return (
    <section className="relative isolate overflow-hidden bg-[#0F172A] py-16 text-white sm:py-20 lg:py-24">
      {/* Blur blobs — disabled on mobile */}
      {!reduceMotion && (
        <>
          <div aria-hidden className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-[#DC2626]/30 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-32 right-1/4 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
        </>
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-fade opacity-20" />

      <div ref={ref} className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mb-10 sm:mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#DC2626]">
            <DevEditable path="stats.badge" value={c.badge} />
          </p>
          <h2 className="mt-3 text-balance text-2xl font-bold tracking-tight text-white sm:text-3xl sm:text-4xl">
            <DevEditable path="stats.title" value={c.title} />
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-8">
          {c.items.map((stat, i) => {
            const isText = STAT_IS_TEXT[i] ?? false;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: reduceMotion ? 10 : 28 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: reduceMotion ? 0.35 : 0.6, delay: i * (reduceMotion ? 0.05 : 0.1), ease: "easeOut" }}
                className="group relative rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6"
              >
                <span className="inline-flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-[#DC2626]/15 text-[#DC2626] ring-1 ring-[#DC2626]/30">
                  <DevEditableIcon
                    path={`stats.items.${i}.icon`}
                    iconName={stat.icon || "Star"}
                    className="h-5 w-5 sm:h-6 sm:w-6"
                    strokeWidth={2}
                  />
                </span>

                <div className="mt-4 sm:mt-5 flex items-baseline gap-1">
                  {isText ? (
                    <span className="text-2xl font-bold tracking-tight text-white sm:text-4xl">
                      <DevEditable path={`stats.items.${i}.label`} value={stat.label} />
                    </span>
                  ) : (
                    <span className="text-3xl font-bold tracking-tight text-white sm:text-5xl">
                      <Counter
                        to={STAT_VALUES[i]}
                        decimals={STAT_DECIMALS[i]}
                        duration={reduceMotion ? 1000 : 1800}
                        active={inView}
                      />
                    </span>
                  )}
                  {!isText && stat.suffix && (
                    <span className="text-xl font-bold text-[#DC2626] sm:text-3xl">
                      {stat.suffix}
                    </span>
                  )}
                </div>

                {!isText && (
                  <p className="mt-2 text-sm font-medium text-white/70">
                    <DevEditable path={`stats.items.${i}.label`} value={stat.label} />
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
