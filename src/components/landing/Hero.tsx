import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowRight, ChevronDown, Phone, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FadeUp } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableImage } from "@/components/dev/DevEditableImage";
import { resolveLinks } from "@/lib/links";
import { scrollToElement } from "@/lib/smooth-scroll";
import { useDeviceMotion } from "@/hooks/use-device-motion";

export function Hero() {
  const { content } = useContent();
  const c = content.hero;
  const { reduceMotion } = useDeviceMotion();

  /* ----- Parallax (desktop only — skip on mobile for 60 fps) ----- */
  const { scrollY } = useScroll();
  // Transform ranges collapse to constants when reduceMotion so framer-motion
  // still subscribes but writes the same numeric value every frame (cheap).
  const y = useTransform(scrollY, [0, 800], reduceMotion ? [0, 0] : [0, 220]);
  const opacity = useTransform(scrollY, [0, 600], reduceMotion ? [1, 1] : [1, 0.35]);

  const L = resolveLinks(content.links);

  const scrollToOrcamento = () => {
    scrollToElement(L.orcamentoAnchor, 100, reduceMotion ? 800 : 1500);
  };

  return (
    <section
      id="inicio"
      className="relative isolate flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#0F172A] text-white"
    >
      {/* Parallax background — style binding is dropped entirely when
           reduceMotion, so framer-motion does NOT continuously write a
           transform property while scrolling on mobile. */}
      <motion.div
        aria-hidden
        style={reduceMotion ? undefined : { y, opacity }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <DevEditableImage
          path="assets.heroBg"
          src={content.assets.heroBg}
          alt="Hero background"
          asBackground
        />
        <div className="absolute inset-0 bg-hero-overlay" />
        <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-[#0F172A]" />
        <div className="absolute inset-0 bg-grid-fade opacity-30" />
      </motion.div>

      {/* Floating accent blobs — lighter on mobile */}
      {!reduceMotion && (
        <>
          <div aria-hidden className="pointer-events-none absolute -top-40 -right-32 h-96 w-96 rounded-full bg-[#DC2626]/20 blur-3xl" />
          <div aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
        </>
      )}

      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-5 pb-24 pt-16 sm:gap-10 sm:pb-28 sm:pt-32 lg:px-8 lg:pt-40">
        <FadeUp>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.18em] text-white/85 backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-[#DC2626] animate-pulse" />
            <DevEditable path="hero.tagline" value={c.tagline} />
          </span>
        </FadeUp>

        <FadeUp delay={0.05}>
          <h1 className="max-w-4xl text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl xl:text-[5.5rem]">
            <DevEditable path="hero.titlePart1" value={c.titlePart1} />
            <span className="block text-[#DC2626]">
              <DevEditable path="hero.titlePart2" value={c.titlePart2} />
            </span>
          </h1>
        </FadeUp>

        <FadeUp delay={0.1}>
          <p className="max-w-2xl text-lg font-light text-white/90 sm:text-xl md:text-2xl">
            <DevEditable path="hero.subtitle" value={c.subtitle} />
          </p>
        </FadeUp>

        <FadeUp delay={0.15}>
          <p className="max-w-2xl text-sm leading-relaxed text-white/75 sm:text-base sm:text-lg">
            <DevEditable path="hero.description" value={c.description} />
          </p>
        </FadeUp>

        <FadeUp delay={0.2}>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
            <div className="flex items-center gap-1 text-amber-400">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className="h-3.5 w-3.5 sm:h-5 sm:w-5"
                  fill="currentColor"
                  strokeWidth={0}
                />
              ))}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold leading-none sm:text-3xl">
                <DevEditable path="hero.ratingValue" value={c.ratingValue} />
              </span>
              <span className="text-sm text-white/70">/5</span>
            </div>
            <span className="hidden h-5 w-px bg-white/20 sm:block" />
            <div className="flex items-center gap-1.5 text-sm text-white/80">
              <span className="font-semibold text-white">
                <DevEditable path="hero.ratingTotal" value={c.ratingTotal} />
              </span>
              <DevEditable path="hero.ratingLabel" value={c.ratingLabel} />
            </div>
          </div>
        </FadeUp>

        <FadeUp delay={0.25}>
          <div className="flex flex-wrap items-center gap-3 pt-1 sm:gap-4 sm:pt-2">
            {/* Pedir Orçamento — pulsação contínua (mais leve em mobile) */}
            <motion.div
              animate={reduceMotion ? {} : { scale: [1, 1.03, 1] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Button
                asChild
                size={reduceMotion ? "default" : "lg"}
                className="group h-12 rounded-full bg-[#DC2626] px-6 text-sm font-semibold shadow-lg shadow-red-900/40 hover:bg-[#ef4444] sm:h-13 sm:px-7 sm:text-base sm:shadow-2xl sm:text-lg"
              >
                <a
                  href={L.orcamentoAnchor}
                  onClick={(e) => { e.preventDefault(); scrollToOrcamento(); }}
                >
                  <DevEditable path="hero.ctaPrimary" value={c.ctaPrimary} />
                  <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
                </a>
              </Button>
            </motion.div>

            <Button
              asChild
              size={reduceMotion ? "default" : "lg"}
              variant="outline"
              className="h-12 rounded-full border-2 border-white/30 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white sm:h-13 sm:px-7 sm:text-base sm:text-lg"
            >
              <a href={L.phoneHref}>
                <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <DevEditable path="hero.ctaSecondary" value={c.ctaSecondary} />
              </a>
            </Button>
          </div>
        </FadeUp>

        {/* Floating reliability chips at bottom */}
        <FadeUp delay={0.35} className="w-full">
          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/80 sm:mt-6 sm:gap-x-8 sm:gap-y-3 sm:text-sm">
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 text-[#DC2626]" />
              <DevEditable path="hero.trustBadge1" value={c.trustBadge1} />
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" />
              <DevEditable path="hero.trustBadge2" value={c.trustBadge2} />
            </span>
            <span className="inline-flex items-center gap-1.5 sm:gap-2">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 text-amber-400" fill="currentColor" />
              <DevEditable path="hero.trustBadge3" value={c.trustBadge3} />
            </span>
          </div>
        </FadeUp>
      </div>

      {/* Scroll indicator — lets the user know there's more below the fold */}
      {!reduceMotion && (
        <motion.div
          aria-hidden
          className="absolute bottom-6 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="h-5 w-5 text-white/40" />
        </motion.div>
      )}
    </section>
  );
}
