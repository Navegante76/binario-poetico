import { useState } from "react";
import { Image as ImageIcon, Search } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "./animations";
import { Lightbox } from "./Lightbox";
import { useContent } from "@/lib/dev-auth";
import { DevEditableImage } from "@/components/dev/DevEditableImage";
import { useDeviceMotion } from "@/hooks/use-device-motion";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export function Gallery() {
  const { content } = useContent();
  const c = content.gallery;
  const images = asArray<{ src: string; alt: string; category: string }>(
    content.assets.gallery,
  );
  const { reduceMotion } = useDeviceMotion();

  // Lightbox state — null = closed; otherwise the index of the active image.
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const openLightbox = (i: number) => setLightboxIndex(i);
  const closeLightbox = () => setLightboxIndex(null);

  return (
    <section
      id="galeria"
      className="relative bg-secondary/40 py-20 sm:py-24 lg:py-32 dark:bg-[#0b1426]"
    >
      {/* Blur blob — disabled on mobile */}
      {!reduceMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/4 h-72 w-72 rounded-full bg-[#DC2626]/10 blur-3xl"
        />
      )}
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626] ring-1 ring-border">
              {c.badge}
            </span>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl sm:text-5xl">
              {c.title1}
              <span className="text-[#DC2626]">{c.titleHighlight}</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              {c.description}
            </p>
          </FadeUp>
        </div>

        {images.length > 0 ? (
          <StaggerContainer className="mt-12 sm:mt-14 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 lg:gap-6">
            {images.map((img, i) => (
              // CRITICAL: key is just the array index — never include the URL.
              // The parent StaggerContainer uses `viewport={{ once: true }}`:
              // once the entrance animation has fired for the visible children,
              // a remount would stay at `opacity: 0`. Index keys are safe
              // because gallery order never re-sorts.
              <StaggerItem key={i}>
                <button
                  type="button"
                  onClick={() => openLightbox(i)}
                  aria-label={`Ampliar imagem ${i + 1}: ${img.alt}`}
                  className="group relative block aspect-square w-full cursor-pointer overflow-hidden rounded-2xl bg-card ring-1 ring-border/60 shadow-md transition-transform duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#DC2626]/60 focus-visible:ring-offset-2 [will-change:transform]"
                >
                  <DevEditableImage
                    path={`assets.gallery.${i}.src`}
                    src={img.src}
                    alt={img.alt}
                    aspectClass="absolute inset-0"
                    className="h-full w-full object-cover transition-transform duration-300 sm:duration-500 group-hover:scale-110"
                  />

                  {/* Mouse-only zoom affordance:
                       - Hidden on EVERY device by default (opacity-0, scale-90).
                       - Only animates in on hover-CAPABLE devices via the
                         @media (hover: hover) query. On touch devices there's
                         no hover state, so the loupe never appears — the tap
                         itself opens the lightbox directly. This prevents the
                         "sticky hover after tap" problem on iOS Safari. */}
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-[opacity,background-color] duration-300 [@media(hover:hover)]:group-hover:bg-black/40 [@media(hover:hover)]:group-hover:opacity-100"
                  >
                    <span className="flex h-14 w-14 scale-90 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm transition-transform duration-300 [@media(hover:hover)]:group-hover:scale-100">
                      <Search className="h-5 w-5 text-white drop-shadow-md" />
                    </span>
                  </div>
                </button>
              </StaggerItem>
            ))}
          </StaggerContainer>
        ) : (
          <div className="mt-14 flex flex-col items-center gap-2 text-center text-sm text-muted-foreground">
            <ImageIcon className="h-8 w-8 text-muted-foreground/60" />
            <p>Sem imagens configuradas na galeria.</p>
          </div>
        )}
      </div>

      {/* Fullscreen Lightbox overlay — opens on click, closes with Esc/overlay/button.
          Lightbox loads alt + category from the content store but only renders
          thumbnails; captions are intentionally not painted under the thumbs. */}
      <Lightbox
        images={images.map((img) => ({ src: img.src, alt: img.alt }))}
        index={lightboxIndex ?? 0}
        open={lightboxIndex !== null}
        onClose={closeLightbox}
        onIndexChange={setLightboxIndex}
      />
    </section>
  );
}
