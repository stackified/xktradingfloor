// Browser-side clean-up of images before an admin uploads them, so every
// logo and event image arrives in one predictable shape and the site can show
// it the same way everywhere. Pure canvas work on the local file — nothing is
// sent anywhere until the form is saved.
//
// The backend accepts JPEG/PNG (not WebP), so logos are saved as PNG (keeps
// transparency) and event images as JPEG.

const LOGO_SIZE = 512;
const LOGO_PADDING = 0.1; // 10% breathing room on each side
const EVENT_MAX_WIDTH = 1600;
const SCAN_MAX = 600; // trim detection runs on a downscaled copy

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, url });
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file could not be read as an image."));
    };
    img.src = url;
  });
}

function canvasToFile(canvas, type, quality, name) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(new File([blob], name, { type })) : reject(new Error("Could not process image."))),
      type,
      quality
    );
  });
}

function baseName(file) {
  return (file.name || "image").replace(/\.[^.]+$/, "").replace(/[^\w-]+/g, "_").slice(0, 60) || "image";
}

// Find the box that holds the actual artwork: everything that differs from
// the background colour, read from the four corners (or transparency).
function findContentBox(img) {
  const scale = Math.min(1, SCAN_MAX / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const px = (x, y) => {
    const i = (y * w + x) * 4;
    return [data[i], data[i + 1], data[i + 2], data[i + 3]];
  };

  const corners = [px(0, 0), px(w - 1, 0), px(0, h - 1), px(w - 1, h - 1)];
  const transparent = corners.filter((c) => c[3] < 20).length >= 3;
  const bg = transparent
    ? null
    : [0, 1, 2].map((k) => Math.round(corners.reduce((s, c) => s + c[k], 0) / corners.length));
  // Corners that disagree strongly → no uniform background to trim.
  if (!transparent && corners.some((c) => Math.max(...[0, 1, 2].map((k) => Math.abs(c[k] - bg[k]))) > 40)) {
    return { box: null, bg: null, transparent: false, darkInk: false };
  }

  const isContent = (c) =>
    transparent ? c[3] > 24 : c[3] > 24 && Math.max(...[0, 1, 2].map((k) => Math.abs(c[k] - bg[k]))) > 32;

  let minX = w, minY = h, maxX = -1, maxY = -1;
  let lumSum = 0;
  let lumCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const c = px(x, y);
      if (isContent(c)) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        lumSum += (0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]) / 255;
        lumCount++;
      }
    }
  }
  // Mostly-dark artwork on a transparent background would vanish on the
  // site's dark logo tiles.
  const darkInk = transparent && lumCount > 0 && lumSum / lumCount < 0.35;
  if (maxX < 0) return { box: null, bg, transparent, darkInk: false };

  const inv = 1 / scale;
  const pad = 1; // one scan pixel of slack so anti-aliased edges survive
  const box = {
    x: Math.max(0, (minX - pad) * inv),
    y: Math.max(0, (minY - pad) * inv),
    w: Math.min(img.naturalWidth, (maxX - minX + 1 + pad * 2) * inv),
    h: Math.min(img.naturalHeight, (maxY - minY + 1 + pad * 2) * inv),
  };
  return { box, bg, transparent, darkInk };
}

/**
 * Logo → 512×512 square: empty borders trimmed, artwork centred with padding
 * on its own background colour (PNG if transparent, JPEG otherwise). SVGs are
 * left untouched — they already scale cleanly.
 * Returns { file, previewUrl, trimmed }.
 */
export async function processLogo(file) {
  if (!file || !file.type?.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.type === "image/svg+xml" || file.type === "image/gif") {
    return { file, previewUrl: URL.createObjectURL(file), trimmed: false };
  }

  const { img, url } = await loadImage(file);
  try {
    const { box, bg: detectedBg, transparent: detectedTransparent, darkInk } = findContentBox(img);
    // Dark artwork on transparency gets a white backing so it stays visible
    // on the site's dark tiles.
    const transparent = detectedTransparent && !darkInk;
    const bg = darkInk ? [255, 255, 255] : detectedBg;
    const src = box || { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight };

    const canvas = document.createElement("canvas");
    canvas.width = LOGO_SIZE;
    canvas.height = LOGO_SIZE;
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    if (!transparent && bg) {
      ctx.fillStyle = `rgb(${bg[0]},${bg[1]},${bg[2]})`;
      ctx.fillRect(0, 0, LOGO_SIZE, LOGO_SIZE);
    }
    const inner = LOGO_SIZE * (1 - LOGO_PADDING * 2);
    const fit = Math.min(inner / src.w, inner / src.h);
    const dw = src.w * fit;
    const dh = src.h * fit;
    ctx.drawImage(img, src.x, src.y, src.w, src.h, (LOGO_SIZE - dw) / 2, (LOGO_SIZE - dh) / 2, dw, dh);

    // Transparent logos stay PNG; logos on a solid background are much
    // smaller as JPEG and look identical.
    const out = transparent
      ? await canvasToFile(canvas, "image/png", undefined, `${baseName(file)}-logo.png`)
      : await canvasToFile(canvas, "image/jpeg", 0.92, `${baseName(file)}-logo.jpg`);
    return { file: out, previewUrl: URL.createObjectURL(out), trimmed: Boolean(box) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Event image → JPEG no wider than 1600px, aspect ratio kept (the site shows
 * it in a 16:9 frame without cropping). GIFs are left untouched.
 * Returns { file, previewUrl }.
 */
export async function processEventImage(file) {
  if (!file || !file.type?.startsWith("image/")) throw new Error("Please choose an image file.");
  if (file.type === "image/gif" || file.type === "image/svg+xml") {
    return { file, previewUrl: URL.createObjectURL(file) };
  }

  const { img, url } = await loadImage(file);
  try {
    const scale = Math.min(1, EVENT_MAX_WIDTH / img.naturalWidth);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.naturalWidth * scale);
    canvas.height = Math.round(img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height); // JPEG has no transparency
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const out = await canvasToFile(canvas, "image/jpeg", 0.86, `${baseName(file)}.jpg`);
    // Keep the original if re-encoding would only make it bigger.
    const file_ = out.size < file.size || scale < 1 ? out : file;
    return { file: file_, previewUrl: URL.createObjectURL(file_) };
  } finally {
    URL.revokeObjectURL(url);
  }
}
