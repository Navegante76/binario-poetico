import { FadeUp, StaggerContainer, StaggerItem } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableIcon } from "@/components/dev/DevEditableIcon";
import { useDeviceMotion } from "@/hooks/use-device-motion";

export function Features() {
  const { content } = useContent();
  const c = content.features;
  const { reduceMotion } = useDeviceMotion();

  return (
    <section className="relative bg-background py-20 sm:py-24 lg:py-32">
      {/* Radial gradient backdrop — disabled on mobile (expensive paint) */}
      {!reduceMotion && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -z-10 h-96 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.07),transparent_60%)]"
        />
      )}

      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626]">
              <DevEditable path="features.badge" value={c.badge} />
            </span>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-balance text-3xl font-bold tracking-tight text-foreground sm:text-4xl sm:text-5xl">
              <DevEditable path="features.title1" value={c.title1} />
              <span className="text-[#DC2626]">
                <DevEditable path="features.titleHighlight" value={c.titleHighlight} />
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <DevEditable path="features.description" value={c.description} />
            </p>
          </FadeUp>
        </div>

        <StaggerContainer className="mt-12 sm:mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
          {c.items.map((feature, i) => {
            const titlePath = `features.items.${i}.title`;
            const descPath = `features.items.${i}.description`;
            const iconPath = `features.items.${i}.icon`;
            return (
              <StaggerItem key={titlePath}>
                <div className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-5 sm:p-7 [will-change:transform]">
                  {/* Glow effect — disabled on mobile */}
                  {!reduceMotion && (
                    <span className="pointer-events-none absolute -inset-2 -z-10 rounded-2xl bg-[#DC2626]/0 blur-xl transition-all duration-500 group-hover:bg-[#DC2626]/15" />
                  )}
                  <span className="inline-flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-2xl bg-[#0F172A] text-white shadow-lg">
                    <DevEditableIcon
                      path={iconPath}
                      iconName={feature.icon}
                      className="h-6 w-6 sm:h-7 sm:w-7"
                      strokeWidth={1.75}
                    />
                  </span>
                  <h3 className="mt-5 sm:mt-6 text-lg font-semibold text-foreground">
                    <DevEditable path={titlePath} value={feature.title} />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <DevEditable path={descPath} value={feature.description} />
                  </p>
                  <span
                    aria-hidden
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[#DC2626]"
                  >
                    ✓ Verificado
                  </span>
                </div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
