import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Phone } from "lucide-react";
import { FadeUp } from "./animations";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { resolveLinks } from "@/lib/links";

export function FAQSection() {
  const { content } = useContent();
  const c = content.faq;
  const L = resolveLinks(content.links);
  // Phone + WhatsApp hrefs + display string come straight from the
  // shared content store — no hardcoded fallbacks anywhere.
  const phoneDisplay = content.links.phoneDisplay || "928029314";
  const phoneHref = L.phoneHref || "tel:+351928029314";
  const whatsappHref = L.whatsAppHref || "https://wa.me/351928029314";

  return (
    <section className="relative bg-secondary/40 py-24 lg:py-32 dark:bg-[#0b1426]">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-16">
          <div className="lg:col-span-5">
            <FadeUp>
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#DC2626] ring-1 ring-border">
                <DevEditable path="faq.badge" value={c.badge} />
              </span>
            </FadeUp>
            <FadeUp delay={0.05}>
              <h2 className="mt-5 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                <DevEditable path="faq.title1" value={c.title1} />
                <span className="text-[#DC2626]">
                  <DevEditable path="faq.titleHighlight" value={c.titleHighlight} />
                </span>
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="mt-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
                <DevEditable path="faq.description" value={c.description} />
              </p>
            </FadeUp>

            <FadeUp delay={0.15}>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href={phoneHref}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-[#0F172A]"
                >
                  <Phone className="h-4 w-4 text-[#0F172A]" />
                  <DevEditable path="links.phoneDisplay" value={phoneDisplay} />
                </a>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-2 rounded-full border border-[#25D366] bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-900/20 transition-all hover:bg-[#1ebe5b] hover:shadow-lg"
                >
                  <WhatsAppIcon
                    mark="small"
                    color="white"
                    className="h-4 w-4 transition-transform group-hover:scale-110"
                  />
                  WhatsApp
                </a>
              </div>
            </FadeUp>
          </div>

          <FadeUp delay={0.1} className="lg:col-span-7">
            <Accordion type="single" collapsible className="w-full space-y-3">
              {c.items.map((item, i) => (
                <AccordionItem
                  key={i}
                  value={`item-${i}`}
                  className="group rounded-2xl border border-border/60 bg-card px-6 transition-all data-[state=open]:border-[#DC2626]/40 data-[state=open]:shadow-lg data-[state=open]:shadow-red-500/5"
                >
                  <AccordionTrigger className="py-5 text-left text-base font-semibold text-foreground hover:no-underline [&[data-state=open]>svg]:text-[#DC2626] [&[data-state=open]>svg]:rotate-180">
                    <DevEditable path={`faq.items.${i}.q`} value={item.q} />
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-sm leading-relaxed text-muted-foreground">
                    <DevEditable path={`faq.items.${i}.a`} value={item.a} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}
