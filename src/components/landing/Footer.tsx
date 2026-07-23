import {
  Mail,
  MapPin,
  Phone,
  Star,
} from "lucide-react";
import { useState } from "react";
import { useContent } from "@/lib/dev-auth";
import { DevEditable } from "@/components/dev/DevEditable";
import { DevEditableLink } from "@/components/dev/DevEditableLink";
import { DevLoginModal } from "@/components/dev/DevLoginModal";
import {
  resolveLinks,
  buildEmailHref,
} from "@/lib/links";
import { DynamicIcon } from "@/lib/icon-registry";

export function Footer() {
  const { content } = useContent();
  const c = content.footer;
  const [loginOpen, setLoginOpen] = useState(false);
  const L = resolveLinks(content.links);

  const navLinks = [
    { label: "Início", href: L.navAnchors[0] ?? "#inicio", kind: "anchor" as const },
    { label: "Serviços", href: L.navAnchors[1] ?? "#servicos", kind: "anchor" as const },
    { label: "Sobre Nós", href: L.navAnchors[2] ?? "#sobre", kind: "anchor" as const },
    { label: "Galeria", href: L.navAnchors[3] ?? "#galeria", kind: "anchor" as const },
    { label: "Contactos", href: L.navAnchors[4] ?? "#contactos", kind: "anchor" as const },
    { label: "Login", href: "#__dev-login", kind: "login" as const },
  ];

  // Defensive coercion: even if resolver is bypassed, .filter() can't crash.
  const socials = Array.isArray(L.socials) ? L.socials : [];
  const activeSocials = socials.filter(
    (s): s is { id: string; name: string; url: string; active: boolean; icon: string } =>
      Boolean(s && s.active && s.url),
  );

  return (
    <footer className="relative isolate overflow-hidden bg-[#0F172A] text-white">
      <div aria-hidden className="pointer-events-none absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-[#DC2626]/15 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />
      <div aria-hidden className="absolute inset-0 bg-grid-fade opacity-10" />

      <div className="relative mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand */}
          <div className="md:col-span-5">
            <a href={L.navAnchors[0] ?? "#inicio"} className="inline-flex items-center gap-3" aria-label="Binário Poético">
              <span className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-white/15">
                <span className="text-base font-bold tracking-tight">BP</span>
                <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full bg-[#DC2626]" />
              </span>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight">
                  <DevEditable path="footer.brandName" value={c.brandName} />
                </span>
                <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white/60">
                  <DevEditable path="footer.brandSub" value={c.brandSub} />
                </span>
              </div>
            </a>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-white/70">
              <DevEditable path="footer.description" value={c.description} />
            </p>

            <div className="mt-6 inline-flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="flex items-center gap-1 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4" fill="currentColor" strokeWidth={0} />
                ))}
              </div>
              <div>
                <p className="text-sm font-semibold leading-tight">
                  <DevEditable path="footer.rating" value={c.rating} />
                </p>
                <p className="text-xs text-white/60">
                  <DevEditable path="footer.ratingCount" value={c.ratingCount} />
                </p>
              </div>
            </div>

            {/* Render the socials dynamically from links.socials[] */}
            {activeSocials.length > 0 && (
              <div className="mt-6 flex flex-wrap items-center gap-3">
                {activeSocials.map((social) => (
                  <DevEditableLink
                    key={social.id}
                    path={`links.socials.${socials.findIndex((s) => s.id === social.id)}.url`}
                    value={social.url}
                    label={`${social.name} · URL`}
                    computedHref={social.url}
                    pillClassName="inline-flex items-center gap-1 rounded-full bg-[#DC2626]/15 px-1.5 py-0.5 text-[10px] font-semibold text-[#DC2626] hover:bg-[#DC2626]/25 transition-colors"
                    hint="URL completa, ex: https://instagram.com/minhapagina"
                  >
                    <a
                      href={social.url || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={social.name}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/80 transition-all hover:-translate-y-0.5 hover:border-[#DC2626] hover:bg-[#DC2626] hover:text-white"
                    >
                      <DynamicIcon
                        name={social.icon}
                        className="h-4 w-4"
                      />
                    </a>
                  </DevEditableLink>
                ))}
              </div>
            )}
          </div>

          {/* Serviços */}
          <div className="md:col-span-3">
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
              <DevEditable path="footer.servicesTitle" value={c.servicesTitle} />
            </h4>
            <ul className="mt-5 space-y-2.5">
              {c.services.map((s, i) => (
                <li key={i}>
                  <a href={L.navAnchors[1] ?? "#servicos"} className="text-sm text-white/80 transition-colors hover:text-white">
                    <DevEditable path={`footer.services.${i}`} value={s} />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Navegação */}
          <div className="md:col-span-4">
            <h4 className="text-sm font-bold uppercase tracking-[0.18em] text-white/60">
              <DevEditable path="footer.navTitle" value={c.navTitle} />
            </h4>
            <ul className="mt-5 space-y-2.5">
              {navLinks.map((link) => (
                <li key={`${link.label}-${link.href}`}>
                  {link.kind === "login" ? (
                    <button
                      type="button"
                      onClick={() => setLoginOpen(true)}
                      className="text-sm text-white/80 transition-colors hover:text-white cursor-pointer"
                    >
                      {link.label}
                    </button>
                  ) : (
                    <a href={link.href} className="text-sm text-white/80 transition-colors hover:text-white">
                      {link.label}
                    </a>
                  )}
                </li>
              ))}
            </ul>

            <h4 className="mt-8 text-sm font-bold uppercase tracking-[0.18em] text-white/60">
              <DevEditable path="footer.contactsTitle" value={c.contactsTitle} />
            </h4>
            <ul className="mt-5 space-y-3 text-sm">
              <li>
                <DevEditableLink
                  path="links.mapCoords"
                  value={content.links.mapCoords}
                  label="Mapa · Coordenadas"
                  computedHref={L.mapSearchHref}
                  hint="Coordenadas lat,lng, ex: 40.9964,-8.5150 — usadas tanto no iframe como no link do Maps."
                >
                  <a
                    href={L.mapSearchHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-start gap-2.5 text-white/80 transition-colors hover:text-white"
                  >
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                    <DevEditable path="footer.address" value={c.address} />
                  </a>
                </DevEditableLink>
              </li>
              <li>
                <DevEditableLink
                  path="links.phoneRaw"
                  value={content.links.phoneRaw}
                  label="Telefone"
                  computedHref={L.phoneHref}
                  hint="Formato internacional com +, ex: +351969064519 — usado tanto em tel: como em WhatsApp (sem o +)."
                >
                  <a
                    href={L.phoneHref}
                    className="group flex items-start gap-2.5 text-white/80 transition-colors hover:text-white"
                  >
                    <Phone className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                    <DevEditable path="footer.phone" value={c.phone} />
                  </a>
                </DevEditableLink>
              </li>
              <li>
                <DevEditableLink
                  path="links.email"
                  value={content.links.email}
                  label="Email"
                  computedHref={buildEmailHref(content.links.email)}
                >
                  <a
                    href={buildEmailHref(content.links.email)}
                    className="group flex items-start gap-2.5 text-white/80 transition-colors hover:text-white"
                  >
                    <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                    <DevEditable path="footer.email" value={c.email} />
                  </a>
                </DevEditableLink>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-8 text-xs text-white/55 sm:flex-row sm:items-center">
          <p>
            © {new Date().getFullYear()}{" "}
            <DevEditable path="footer.copyright" value={c.copyright} />
          </p>
          <p className="flex items-center gap-3">
            <a href="#" className="hover:text-white">
              <DevEditable path="footer.privacyLink" value={c.privacyLink} />
            </a>
            <span className="h-1 w-1 rounded-full bg-white/30" />
            <a href="#" className="hover:text-white">
              <DevEditable path="footer.termsLink" value={c.termsLink} />
            </a>
          </p>
        </div>
      </div>

      {/* Dev login modal */}
      <DevLoginModal open={loginOpen} onClose={() => setLoginOpen(false)} />
    </footer>
  );
}
