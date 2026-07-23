import { motion } from "framer-motion";
import { useMounted } from "@/hooks/use-mounted";
import { useContent } from "@/lib/dev-auth";
import { resolveLinks } from "@/lib/links";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";
import { useDeviceMotion } from "@/hooks/use-device-motion";

export function WhatsAppButton() {
  const mounted = useMounted();
  const { content } = useContent();
  const links = resolveLinks(content.links);
  const { reduceMotion } = useDeviceMotion();

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 group">
      <motion.a
        href={links.whatsAppHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar via WhatsApp"
        initial={mounted ? { opacity: 0, y: 24, scale: 0.8 } : false}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 1.2, duration: reduceMotion ? 0.35 : 0.6, ease: [0.22, 1, 0.36, 1] }}
        whileHover={reduceMotion ? {} : { scale: 1.08 }}
        whileTap={reduceMotion ? {} : { scale: 0.95 }}
        className="relative block"
      >
        {/* Glow pulsing — disabled on mobile */}
        {!reduceMotion && (
          <span
            aria-hidden
            className="absolute inset-0 -z-10 rounded-full bg-[#25D366] opacity-60 group-hover:opacity-80 blur-md animate-pulse"
          />
        )}
        {/* Ping ring — disabled on mobile */}
        {!reduceMotion && (
          <span
            aria-hidden
            className="absolute inset-0 rounded-full ring-2 ring-[#25D366]/40 animate-[ping_2.5s_ease-out_infinite]"
          />
        )}
        <span className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-[#25D366] text-white shadow-2xl shadow-emerald-900/30 ring-4 ring-white/70 dark:ring-white/10 active:bg-[#1ebe5b] sm:group-hover:bg-[#1ebe5b]">
          <WhatsAppIcon
            mark="small"
            className="h-7 w-7 sm:h-8 sm:w-8"
            color="white"
          />
        </span>
        {/* Tooltip — desktop only */}
        <span className="pointer-events-none absolute right-full top-1/2 -translate-y-1/2 mr-3 hidden whitespace-nowrap rounded-md bg-foreground/95 px-3 py-1.5 text-xs font-medium text-background shadow-lg sm:opacity-0 sm:group-hover:opacity-100 sm:transition-opacity sm:block">
          WhatsApp
        </span>
      </motion.a>
    </div>
  );
}
