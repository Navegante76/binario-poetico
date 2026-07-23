import { FadeUp, ScaleIn } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableImage } from "@/components/dev/DevEditableImage";
import { DevEditableIcon } from "@/components/dev/DevEditableIcon";

export function About() {
  const { content } = useContent();
  const c = content.about;

  return (
    <section id="sobre" className="relative bg-background py-24 lg:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-80 w-80 rounded-full bg-[#DC2626]/5 blur-3xl"
      />

      <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 lg:grid-cols-2 lg:gap-20 lg:px-8">
        {/* Text */}
        <div>
          <FadeUp>
            <span className="inline-flex items-center gap-2 rounded-full bg-secondary px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626]">
              <DevEditable path="about.badge" value={c.badge} />
            </span>
          </FadeUp>

          <FadeUp delay={0.05}>
            <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
              <DevEditable path="about.title1" value={c.title1} />
              <span className="text-[#DC2626]">
                <DevEditable path="about.titleHighlight" value={c.titleHighlight} />
              </span>
            </h2>
          </FadeUp>

          <FadeUp delay={0.1}>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              <DevEditable path="about.description" value={c.description} />
            </p>
          </FadeUp>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {c.highlights.map((item, i) => {
              const titlePath = `about.highlights.${i}.title`;
              const textPath = `about.highlights.${i}.text`;
              const iconPath = `about.highlights.${i}.icon`;
              return (
                <FadeUp key={titlePath} delay={0.15 + i * 0.05}>
                  <div className="group h-full rounded-2xl border border-border/60 bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-[#DC2626]/40 hover:shadow-lg hover:shadow-red-500/5">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#0F172A] text-white shadow-md transition-colors group-hover:bg-[#DC2626]">
                      <DevEditableIcon
                        path={iconPath}
                        iconName={item.icon}
                        className="h-5 w-5"
                      />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-foreground">
                      <DevEditable path={titlePath} value={item.title} />
                    </h3>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      <DevEditable path={textPath} value={item.text} />
                    </p>
                  </div>
                </FadeUp>
              );
            })}
          </div>
        </div>

        {/* Imagery */}
        <ScaleIn className="relative">
          <div className="relative">
            <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl shadow-2xl shadow-slate-900/10">
              <DevEditableImage
                path="assets.aboutMain"
                src={content.assets.aboutMain}
                alt="Mecânico profissional a trabalhar num veículo em oficina multimarcas"
                aspectClass="absolute inset-0 h-full w-full"
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/35 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Floating image */}
            <div className="absolute -bottom-10 -left-10 hidden h-44 w-44 overflow-hidden rounded-2xl border-4 border-background shadow-2xl shadow-slate-900/20 sm:block">
              <DevEditableImage
                path="assets.aboutSmall"
                src={content.assets.aboutSmall}
                alt="Detalhe de ferramentas profissionais na oficina"
                aspectClass="h-full w-full"
                className="h-full w-full object-cover"
              />
            </div>

            {/* Stats badge */}
            <div className="absolute -top-6 -right-6 hidden rounded-2xl bg-card p-5 shadow-xl shadow-slate-900/15 ring-1 ring-border/60 sm:block">
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#DC2626] text-white">
                  <DevEditableIcon
                    path="about.badgeIcon"
                    iconName="Award"
                    className="h-6 w-6"
                  />
                </span>
                <div>
                  <p className="text-2xl font-bold leading-none text-foreground">
                    <DevEditable path="about.badgeLabel" value={c.badgeLabel} />
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <DevEditable path="about.badgeSub" value={c.badgeSub} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </ScaleIn>
      </div>
    </section>
  );
}
