import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { ArrowRight, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableImage } from "@/components/dev/DevEditableImage";
import { DevEditableLink } from "@/components/dev/DevEditableLink";
import { resolveLinks } from "@/lib/links";
import { useDeviceMotion } from "@/hooks/use-device-motion";

export function CtaStrip() {
  const { content } = useContent();
  const c = content.ctaStrip;
  const ref = useRef<HTMLDivElement>(null);
  const { reduceMotion } = useDeviceMotion();

  /* Parallax scale — only on desktop */
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const scale = useTransform(scrollYProgress, [0, 0.5], [reduceMotion ? 1 : 1.15, 1]);

  const L = resolveLinks(content.links);

  return (
    <section ref={ref} className="relative isolate overflow-hidden bg-[#0F172A] py-16 sm:py-20 lg:py-24">
      {/* Parallax bg — style binding is dropped entirely when reduceMotion,
           so framer-motion does NOT continuously write a transform property
           while this section is on screen on mobile. */}
      <motion.div
        aria-hidden
        style={reduceMotion ? undefined : { scale }}
        className="absolute inset-0 -z-10 will-change-transform"
      >
        <DevEditableImage
          path="assets.ctaBg"
          src={content.assets.ctaBg}
          alt="CTA strip background"
          asBackground
          className="absolute inset-0"
        />
        <div className="pointer-events-none absolute inset-0 bg-[#0F172A]/85" />
      </motion.div>

      {/* Blur blobs — lighter on mobile */}
      {!reduceMotion && (
        <div aria-hidden className="pointer-events-none absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-[#DC2626]/25 blur-3xl" />
      )}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid-fade opacity-15" />

      <div className="relative mx-auto max-w-4xl px-5 text-center lg:px-8">
        <motion.p
          initial={{ opacity: 0, y: reduceMotion ? 10 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.4 : 0.6, ease: "easeOut" }}
          className="text-balance text-2xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl"
        >
          <DevEditable path="ctaStrip.question" value={c.question} />
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: reduceMotion ? 10 : 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0.4 : 0.6, delay: 0.15, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10 sm:gap-4"
        >
          <DevEditableLink
            path="links.orcamentoAnchor"
            value={content.links.orcamentoAnchor}
            label="CTA Orçamento · Âncora"
            computedHref={L.orcamentoAnchor}
            pillClassName="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/15 px-2 py-0.5 text-[10px] font-semibold text-[#DC2626] hover:bg-[#DC2626]/25 transition-colors"
            hint="Âncora interna (#orcamento) ou URL completo."
          >
            <Button asChild size={reduceMotion ? "default" : "lg"}
              className="group h-12 rounded-full bg-[#DC2626] px-6 text-sm font-semibold shadow-lg shadow-red-900/40 hover:bg-[#ef4444] sm:h-14 sm:px-8 sm:text-base sm:shadow-2xl">
              <a href={L.orcamentoAnchor}>
                <DevEditable path="ctaStrip.ctaPrimary" value={c.ctaPrimary} />
                <ArrowRight className="ml-2 h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:translate-x-1" />
              </a>
            </Button>
          </DevEditableLink>
          <DevEditableLink
            path="links.phoneRaw"
            value={content.links.phoneRaw}
            label="Telefone"
            computedHref={L.phoneHref}
            pillClassName="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/15 px-2 py-0.5 text-[10px] font-semibold text-[#DC2626] hover:bg-[#DC2626]/25 transition-colors"
            hint="Formato internacional com +, ex: +351969064519"
          >
            <Button asChild size={reduceMotion ? "default" : "lg"} variant="outline"
              className="h-12 rounded-full border-2 border-white/30 bg-white/5 px-6 text-sm font-semibold text-white hover:bg-white/10 hover:text-white sm:h-14 sm:px-8 sm:text-base">
              <a href={L.phoneHref}>
                <Phone className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                <DevEditable path="ctaStrip.ctaSecondary" value={c.ctaSecondary} />
              </a>
            </Button>
          </DevEditableLink>
        </motion.div>
      </div>
    </section>
  );
}
