import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";

export interface LightboxImage {
  src: string;
  alt: string;
}

interface LightboxProps {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange: (index: number) => void;
}

export function Lightbox({
  images,
  index,
  open,
  onClose,
  onIndexChange,
}: LightboxProps) {
  const [mounted, setMounted] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setZoomed(false);
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const goPrev = useCallback(() => {
    const next = index === 0 ? images.length - 1 : index - 1;
    onIndexChange(next);
    setZoomed(false);
  }, [index, images.length, onIndexChange]);

  const goNext = useCallback(() => {
    const next = index === images.length - 1 ? 0 : index + 1;
    onIndexChange(next);
    setZoomed(false);
  }, [index, images.length, onIndexChange]);

  const toggleZoom = useCallback(() => {
    setZoomed((v) => !v);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goPrev, goNext]);

  const current = images[index];

  const overlay = (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[99999] bg-black/95 backdrop-blur-md"
          onClick={onClose}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Zoom toggle */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleZoom();
            }}
            className="absolute top-4 left-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
            aria-label={zoomed ? "Reduzir zoom" : "Ampliar"}
          >
            {zoomed ? (
              <ZoomOut className="h-5 w-5" />
            ) : (
              <ZoomIn className="h-5 w-5" />
            )}
          </button>

          {/* Image counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-white/10 px-4 py-1.5 text-xs font-mono text-white/80 backdrop-blur-sm">
            {index + 1} / {images.length}
          </div>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/25 hover:text-white transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
          )}

          {/* Next button */}
          {images.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/25 hover:text-white transition-colors"
              aria-label="Seguinte"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          )}

          {/* Image container */}
          <div
            className={`absolute inset-6 sm:inset-16 flex items-center justify-center ${
              zoomed ? "cursor-zoom-out overflow-auto" : "cursor-zoom-in"
            }`}
            onClick={(e) => {
              if (zoomed) return;
              e.stopPropagation();
              toggleZoom();
            }}
          >
            <motion.img
              key={current.src}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              src={current.src}
              alt={current.alt}
              className={`rounded-lg shadow-2xl transition-transform duration-300 ${
                zoomed
                  ? "max-w-none scale-150"
                  : "max-h-[85vh] max-w-[90vw] object-contain"
              }`}
              draggable={false}
            />
          </div>

          {/* Thumbnail strip at bottom */}
          {images.length > 1 && (
            <div className="absolute inset-x-0 bottom-4 z-10 flex items-center justify-center gap-2">
              {images.map((img, i) => (
                <button
                  key={img.src}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(i);
                    setZoomed(false);
                  }}
                  className={`h-14 w-14 overflow-hidden rounded-lg border-2 transition-all ${
                    i === index
                      ? "border-white scale-110 shadow-lg"
                      : "border-white/20 opacity-60 hover:opacity-100 hover:border-white/50"
                  }`}
                >
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  if (!mounted) return null;
  return createPortal(overlay, document.body);
}
