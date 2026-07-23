import { useEffect, useState } from "react";

/**
 * Device motion + user preference detector.
 *
 * Returns THREE independent flags so components can make fine-grained
 * decisions:
 *   1. `prefersReduced` — true when the user has `prefers-reduced-motion:
 *      reduce` enabled at the OS level (Settings → Accessibility). This is
 *      the WCAG 2.1 / 2.3 signals that an accessibility-conscious audience
 *      cares about — e.g. users with vestibular disorders, migraine
 *      triggers, ADHD, motion sickness. Honoring it is a public-relations
 *      + legal compliance win and is independent of the device type.
 *
 *   2. `reduceMotion` — composed flag for the common case of "skip the
 *      animations" (prefersReduced OR touch-only OR small viewport). Most
 *      components can use this for blanket gating.
 *
 *   3. `isTouchDevice` / `isMobile` — raw predicates for components that
 *      want to make per-platform decisions (e.g. swap a hover affordance
 *      for a tap affordance).
 *
 * Side effect: writes `data-prefers-reduced-motion="true|false"` on the
 * `<html>` element whenever the OS-level flag changes. That lets CSS rules
 * match the flag without JavaScript, e.g.
 *
 *   html[data-prefers-reduced-motion="true"] .parallax-bg {
 *     transform: none !important;
 *   }
 *
 * The prefersReduced flag is exposed independently so you (or future
 * audits) can verify WCAG 2.3.3 compliance on a per-feature basis, not
 * only via the composite `reduceMotion` boolean.
 */
export function useDeviceMotion() {
  const [state, setState] = useState(() => getDeviceState());

  useEffect(() => {
    // Mirror OS preference to <html data-attribute> so plain CSS can react.
    const mirrorPreference = () => {
      const pr = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      document.documentElement.dataset.prefersReducedMotion = String(pr);
    };
    mirrorPreference();
    const mqReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mqTouch = window.matchMedia("(hover: none) and (pointer: coarse)");
    const mqWidth = window.matchMedia("(max-width: 1023px)");

    const refresh = () => {
      setState(getDeviceState());
      mirrorPreference();
    };
    mqReduced.addEventListener("change", refresh);
    mqTouch.addEventListener("change", refresh);
    mqWidth.addEventListener("change", refresh);

    return () => {
      mqReduced.removeEventListener("change", refresh);
      mqTouch.removeEventListener("change", refresh);
      mqWidth.removeEventListener("change", refresh);
    };
  }, []);

  return state;
}

function getDeviceState() {
  if (typeof window === "undefined") {
    return {
      prefersReduced: false,
      reduceMotion: false,
      isTouchDevice: false,
      isMobile: false,
    };
  }

  const prefersReduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch =
    window.matchMedia("(hover: none) and (pointer: coarse)").matches;
  const isMobile = window.innerWidth < 1024;

  return {
    /** Independent OS-level motion preference — WCAG 2.3.3 indicator. */
    prefersReduced,
    /** True when we should use minimal or no animation. */
    reduceMotion: prefersReduced || isTouch || isMobile,
    /** True when the device uses touch as primary input. */
    isTouchDevice: isTouch,
    /** True when viewport is tablet/phone sized (< 1024px). */
    isMobile,
  };
}
