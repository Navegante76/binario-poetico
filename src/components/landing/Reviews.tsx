import { useMemo } from "react";
import { Star } from "lucide-react";
import { FadeUp, StaggerContainer, StaggerItem } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";

type Review = {
  name: string;
  rating: number;
  text: string;
  date: string;
};

const REVIEW_DATES = [
  "há 2 meses",
  "há 1 mês",
  "há 3 meses",
  "há 1 mês",
  "há 2 meses",
  "há 4 meses",
];

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className="h-4 w-4"
          fill={i < rating ? "currentColor" : "transparent"}
          strokeWidth={1.5}
        />
      ))}
    </div>
  );
}

export function Reviews() {
  const { content } = useContent();
  const c = content.reviews;

  // Build the Google search URL dynamically from the brand name + location so
  // it's never out of sync with the rest of the site content.
  const googleReviewsHref = useMemo(() => {
    const brand = content.navbar.brandName || "Oficina";
    const locality = content.contact.address?.split("·")?.[1]?.trim() || "";
    const query = locality ? `${brand} ${locality}` : brand;
    return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  }, [content.navbar.brandName, content.contact.address]);

  return (
    <section className="relative bg-background py-24 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-[#0F172A]/5 blur-3xl dark:bg-white/5"
      />

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626]">
              <DevEditable path="reviews.badge" value={c.badge} />
            </span>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              <DevEditable path="reviews.title1" value={c.title1} />
              <span className="text-[#DC2626]">
                <DevEditable path="reviews.titleHighlight" value={c.titleHighlight} />
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <DevEditable path="reviews.description" value={c.description} />
            </p>
          </FadeUp>

          <FadeUp delay={0.15}>
            <div className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold leading-none text-foreground">
                  <DevEditable path="reviews.ratingSummary" value={c.ratingSummary} />
                </p>
                <p className="text-xs text-muted-foreground">
                  <DevEditable path="reviews.ratingCount" value={c.ratingCount} />
                </p>
              </div>
            </div>
          </FadeUp>
        </div>

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {c.items.map((review, i) => (
            <StaggerItem key={i}>
              <article className="group h-full rounded-2xl border border-border/60 bg-card p-7 transition-all duration-300 hover:-translate-y-1 hover:border-[#DC2626]/30 hover:shadow-lg hover:shadow-red-500/5">
                <div className="flex items-start justify-between">
                  <Stars rating={5} />
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#0F172A]/30 group-hover:text-[#DC2626] transition-colors" aria-hidden>
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z" opacity="0.7" />
                  </svg>
                </div>
                <p className="mt-5 text-base leading-relaxed text-foreground">
                  "<DevEditable path={`reviews.items.${i}.text`} value={review.text} />"
                </p>
                <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      <DevEditable path={`reviews.items.${i}.name`} value={review.name} locked />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Cliente verificado · {REVIEW_DATES[i] ?? "recentemente"}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#0F172A]/70">Google</span>
                </div>
              </article>
            </StaggerItem>
          ))}
        </StaggerContainer>

        <FadeUp delay={0.2}>
          <div className="mt-12 flex justify-center">
            <a
              href={googleReviewsHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 rounded-full border-2 border-[#0F172A] bg-background px-7 py-3.5 text-sm font-semibold text-[#0F172A] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#0F172A] hover:text-white dark:hover:bg-white dark:hover:text-[#0F172A]"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1Z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0 0 12 23Z" opacity="0.7" />
              </svg>
              <DevEditable path="reviews.ctaGoogle" value={c.ctaGoogle} />
              <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">→</span>
            </a>
          </div>
        </FadeUp>
      </div>
    </section>
  );
}
