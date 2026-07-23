import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { useDeviceMotion } from "@/hooks/use-device-motion";

/* ------------------------------------------------------------------ */
/*  Variants — shorter distances / delays on mobile for performance  */
/* ------------------------------------------------------------------ */

const fadeUpDesktop: Variants = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const fadeUpMobile: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" },
  },
};

const scaleInDesktop: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

const scaleInMobile: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

/* ------------------------------------------------------------------ */
/*  Exported hooks — use internally to keep the public API clean     */
/* ------------------------------------------------------------------ */

function useMotionTuning() {
  const { reduceMotion } = useDeviceMotion();
  return {
    viewportMargin: reduceMotion ? "-40px" as const : "-80px" as const,
    staggerDelay: reduceMotion ? 0.04 : 0.08,
    fadeUpVariant: reduceMotion ? fadeUpMobile : fadeUpDesktop,
    scaleInVariant: reduceMotion ? scaleInMobile : scaleInDesktop,
  };
}

/* ------------------------------------------------------------------ */
/*  Public components                                                */
/* ------------------------------------------------------------------ */

export function FadeUp({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { viewportMargin, fadeUpVariant: variant } = useMotionTuning();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: viewportMargin }}
      variants={{
        hidden: variant.hidden,
        visible: {
          ...variant.visible,
          transition: {
            ...(variant.visible as { transition: object }).transition,
            delay,
          },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerContainer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { staggerDelay, viewportMargin } = useMotionTuning();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: viewportMargin }}
      variants={{
        hidden: {},
        visible: {
          transition: { staggerChildren: staggerDelay, delayChildren: 0.03 },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { fadeUpVariant: variant } = useMotionTuning();
  return (
    <motion.div className={className} variants={variant}>
      {children}
    </motion.div>
  );
}

export function ScaleIn({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const { viewportMargin, scaleInVariant: variant } = useMotionTuning();
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: viewportMargin }}
      variants={variant}
    >
      {children}
    </motion.div>
  );
}
