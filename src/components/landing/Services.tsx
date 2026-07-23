import { FadeUp, StaggerContainer, StaggerItem } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableIcon } from "@/components/dev/DevEditableIcon";

export function Services() {
  const { content } = useContent();
  const c = content.services;

  return (
    <section
      id="servicos"
      className="relative bg-secondary/40 py-24 lg:py-32 dark:bg-[#0b1426]"
    >
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626] ring-1 ring-border">
              <DevEditable path="services.badge" value={c.badge} />
            </span>
          </FadeUp>
          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              <DevEditable path="services.title1" value={c.title1} />
              <span className="text-[#DC2626]">
                <DevEditable path="services.titleHighlight" value={c.titleHighlight} />
              </span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
              <DevEditable path="services.description" value={c.description} />
            </p>
          </FadeUp>
        </div>

        <StaggerContainer className="mt-14 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {c.items.map((service, i) => {
            const titlePath = `services.items.${i}.title`;
            const descPath = `services.items.${i}.description`;
            const iconPath = `services.items.${i}.icon`;
            return (
              <StaggerItem key={titlePath}>
                <article className="group relative h-full overflow-hidden rounded-2xl border border-border/60 bg-card p-6 transition-all duration-500 hover:-translate-y-1.5 hover:border-[#DC2626]/40 hover:shadow-xl hover:shadow-red-500/5">
                  <span
                    aria-hidden
                    className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-[#DC2626] transition-transform duration-500 group-hover:scale-x-100"
                  />
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-secondary text-[#0F172A] transition-all duration-300 group-hover:bg-[#0F172A] group-hover:text-white dark:bg-white/5 dark:group-hover:bg-white/10">
                    <DevEditableIcon
                      path={iconPath}
                      iconName={service.icon}
                      className="h-6 w-6"
                      strokeWidth={1.75}
                    />
                  </span>
                  <h3 className="mt-5 text-lg font-semibold text-foreground">
                    <DevEditable path={titlePath} value={service.title} />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    <DevEditable path={descPath} value={service.description} />
                  </p>
                  <span
                    aria-hidden
                    className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:text-white"
                  >
                    Saber mais →
                  </span>
                </article>
              </StaggerItem>
            );
          })}
        </StaggerContainer>
      </div>
    </section>
  );
}
