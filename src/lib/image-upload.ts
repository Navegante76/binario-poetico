/**
 * Helper for processing local image files for dev-mode uploads.
 *
 * Reads a File via FileReader, then re-encodes it through a canvas:
 *  - SVGs are passed through unchanged (preserves vectorization)
 *  - Raster images are downscaled to `maxWidth` and re-encoded as JPEG
 *    with the given quality so the resulting data URL is small enough
 *    to fit in `localStorage` (5 MB cap per origin in Chrome).
 */

export interface ProcessedImageResult {
  dataUrl: string;
  width: number;
  height: number;
  /** Approximate byte size of the data URL (utf-16 chars). */
  bytes: number;
  format: string;
}

/** Returns a human readable byte string. */
export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

/**
 * Process a File picked by the user into a JPEG-compressed data URL.
 * Returns `data:image/jpeg;base64,…` ready to be persisted.
 */
export async function processLocalImage(
  file: File,
  maxWidth = 1600,
  quality = 0.82,
): Promise<ProcessedImageResult> {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("O ficheiro tem de ser uma imagem válida.");
  }

  // SVGs: skip canvas re-encoding to preserve vector quality.
  if (file.type === "image/svg+xml") {
    const dataUrl = await readFileAsDataURL(file);
    return {
      dataUrl,
      width: 0,
      height: 0,
      bytes: dataUrl.length * 2, // UTF-16 chars ≈ 2 bytes each
      format: "svg",
    };
  }

  const dataUrl = await readFileAsDataURL(file);
  const { width, height } = await loadImageDimensions(dataUrl);

  let targetW = width;
  let targetH = height;
  if (width > maxWidth) {
    targetW = maxWidth;
    targetH = Math.round((height * maxWidth) / width);
  }

  // Skip canvas work if image is already small enough and the browser
  // can output a reasonable JPEG. Otherwise re-encode.
  const compressed = await canvasEncode(dataUrl, targetW, targetH, quality);

  return {
    dataUrl: compressed,
    width: targetW,
    height: targetH,
    bytes: compressed.length * 2,
    format: "jpeg",
  };
}

/* ---------- internals ---------- */

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Falha ao ler o ficheiro."));
    reader.readAsDataURL(file);
  });
}

function loadImageDimensions(
  src: string,
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error("Falha ao descodificar a imagem."));
    img.src = src;
  });
}

function canvasEncode(
  src: string,
  width: number,
  height: number,
  quality: number,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(src); // soft-fail: keep original
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => reject(new Error("Falha ao descodificar a imagem."));
    img.src = src;
  });
}
