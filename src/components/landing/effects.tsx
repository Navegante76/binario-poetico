import {
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
} from "framer-motion";
import { useDeviceMotion } from "@/hooks/use-device-motion";

/* ─────────────────────────────────────────────────────────────────
 *  TiltCard — mouse-tracked 3D rotation + radial shine overlay
 *  Disabled on touch + reduced-motion devices.
 * ──────────────────────────────────────────────────────────────── */

const MAX_TILT_DEG = 8;

export function TiltCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [canTilt, setCanTilt] = useState(true);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    setCanTilt(mq.matches);
  }, []);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { stiffness: 250, damping: 30, mass: 0.5 };
  const rotateX = useSpring(useMotionValue(0), springConfig);
  const rotateY = useSpring(useMotionValue(0), springConfig);

  function handlePointerMove(e: ReactPointerEvent<HTMLDivElement>) {
    if (prefersReducedMotion || !canTilt || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const localX = e.clientX - rect.left;
    const localY = e.clientY - rect.top;

    mouseX.set(localX);
    mouseY.set(localY);

    const rX = ((localY / rect.height) - 0.5) * -2 * MAX_TILT_DEG;
    const rY = ((localX / rect.width) - 0.5) * 2 * MAX_TILT_DEG;
    rotateX.set(rX);
    rotateY.set(rY);
  }

  function handlePointerLeave() {
    if (prefersReducedMotion) return;
    rotateX.set(0);
    rotateY.set(0);
    mouseX.set(0);
    mouseY.set(0);
  }

  const shineMask = useMotionTemplate`radial-gradient(320px circle at ${mouseX}px ${mouseY}px, white, transparent 70%)`;

  if (prefersReducedMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className="h-full w-full [perspective:1200px]">
      <motion.div
        ref={ref}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        style={{
          rotateX: canTilt ? rotateX : 0,
          rotateY: canTilt ? rotateY : 0,
          transformStyle: "preserve-3d",
        }}
        className={className}
      >
        {canTilt && (
          <motion.div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-20 rounded-[inherit] bg-gradient-to-br from-white/30 via-white/10 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/15 dark:via-white/5"
            style={{
              maskImage: shineMask,
              WebkitMaskImage: shineMask,
            }}
          />
        )}
        {children}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
 *  HeroParticles — rising bokeh embers (desktop only)
 *  Fully disabled on touch / reduced-motion devices.
 * ──────────────────────────────────────────────────────────────── */

type Particle = {
  x: number;
  y: number;
  r: number;
  vx: number;
  vy: number;
  a: number;
  hue: "white" | "red" | "amber";
};

export function HeroParticles({
  density = 60,
}: {
  density?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const { isTouchDevice } = useDeviceMotion();

  useEffect(() => {
    if (
      prefersReducedMotion ||
      isTouchDevice ||
      !canvasRef.current ||
      typeof window === "undefined"
    ) {
      return;
    }
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId = 0;
    let particles: Particle[] = [];
    let dpr = Math.min(window.devicePixelRatio || 1, 2);

    const seedParticles = () => {
      particles = Array.from({ length: density }).map(() => {
        const dice = Math.random();
        return {
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          r: Math.random() * 1.6 + 0.4,
          vx: (Math.random() - 0.5) * 0.35,
          vy: -(Math.random() * 0.55 + 0.18),
          a: Math.random() * 0.55 + 0.15,
          hue:
            dice > 0.92 ? "red" : dice > 0.78 ? "amber" : "white",
        };
      });
    };

    const sizeCanvas = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const { clientWidth: w, clientHeight: h } = parent;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      seedParticles();
    };

    const ro = new ResizeObserver(() => sizeCanvas());
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const draw = () => {
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.y < -4) p.y = h + 4;
        if (p.x < -4) p.x = w + 4;
        else if (p.x > w + 4) p.x = -4;

        let fill: string;
        if (p.hue === "red")
          fill = `rgba(220, 38, 38, ${p.a})`;
        else if (p.hue === "amber")
          fill = `rgba(251, 191, 36, ${p.a})`;
        else fill = `rgba(255, 255, 255, ${p.a})`;

        if (p.r > 1.4) {
          ctx.beginPath();
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 4);
          grad.addColorStop(0, fill);
          grad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    sizeCanvas();
    draw();

    return () => {
      cancelAnimationFrame(animationFrameId);
      ro.disconnect();
    };
  }, [density, prefersReducedMotion, isTouchDevice]);

  if (prefersReducedMotion || isTouchDevice) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-[1] h-full w-full opacity-70 mix-blend-screen"
    />
  );
}
