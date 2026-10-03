import React from "react";
import { X, ZoomIn, ZoomOut, Move } from "lucide-react";

// Lets a member position and zoom their photo inside a round frame before it
// is uploaded (Sahil, 3 Oct 2026: "I uploaded my picture, I was not able to
// adjust it"). Drag, mouse wheel, the slider and the keyboard (arrows to move,
// + / - to zoom) all work. The result is a 512×512 JPEG of exactly what was
// inside the frame, so the backend receives a small, already-square avatar.

const OUT = 512; // exported avatar, px
const MAX_ZOOM = 4;

const clampOffset = (offset, size, view) => {
  const max = Math.max(0, (size - view) / 2);
  return Math.min(max, Math.max(-max, offset));
};

export default function AvatarCropper({ file, onCancel, onDone }) {
  // on-screen frame (CSS px): 300, or less on narrow phones
  const VIEW = React.useMemo(() => Math.min(300, Math.max(220, window.innerWidth - 88)), []);
  const [url, setUrl] = React.useState("");
  const [natural, setNatural] = React.useState(null); // { w, h }
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });
  const [error, setError] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const imgRef = React.useRef(null);
  const dialogRef = React.useRef(null);
  const drag = React.useRef(null);

  React.useEffect(() => {
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setNatural(null);
    setError("");
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  React.useEffect(() => {
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onCancel]);

  // Scale at zoom 1 makes the shorter side exactly fill the frame.
  const baseScale = natural ? VIEW / Math.min(natural.w, natural.h) : 1;
  const scale = baseScale * zoom;
  const shownW = natural ? natural.w * scale : VIEW;
  const shownH = natural ? natural.h * scale : VIEW;

  const applyOffset = React.useCallback(
    (x, y, z = zoom) => {
      if (!natural) return;
      const s = baseScale * z;
      setOffset({ x: clampOffset(x, natural.w * s, VIEW), y: clampOffset(y, natural.h * s, VIEW) });
    },
    [natural, baseScale, zoom, VIEW],
  );

  const applyZoom = (z) => {
    const next = Math.min(MAX_ZOOM, Math.max(1, z));
    setZoom(next);
    // keep the same point in the centre while zooming
    const ratio = next / zoom;
    applyOffset(offset.x * ratio, offset.y * ratio, next);
  };

  const onPointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, ox: offset.x, oy: offset.y };
  };
  const onPointerMove = (e) => {
    if (!drag.current) return;
    applyOffset(drag.current.ox + e.clientX - drag.current.x, drag.current.oy + e.clientY - drag.current.y);
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  const onWheel = (e) => {
    applyZoom(zoom * (e.deltaY < 0 ? 1.08 : 1 / 1.08));
  };
  const onFrameKey = (e) => {
    const step = e.shiftKey ? 30 : 10;
    const moves = { ArrowLeft: [step, 0], ArrowRight: [-step, 0], ArrowUp: [0, step], ArrowDown: [0, -step] };
    if (moves[e.key]) {
      e.preventDefault();
      applyOffset(offset.x + moves[e.key][0], offset.y + moves[e.key][1]);
    } else if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      applyZoom(zoom + 0.2);
    } else if (e.key === "-") {
      e.preventDefault();
      applyZoom(zoom - 0.2);
    }
  };

  async function save() {
    if (!natural || !imgRef.current) return;
    setBusy(true);
    try {
      // The frame's top-left corner, in the photo's own pixels.
      const left = VIEW / 2 - shownW / 2 + offset.x;
      const top = VIEW / 2 - shownH / 2 + offset.y;
      const sx = -left / scale;
      const sy = -top / scale;
      const size = VIEW / scale;
      const canvas = document.createElement("canvas");
      canvas.width = OUT;
      canvas.height = OUT;
      const ctx = canvas.getContext("2d");
      ctx.imageSmoothingQuality = "high";
      ctx.fillStyle = "#ffffff"; // transparent PNGs get a white backing, not black
      ctx.fillRect(0, 0, OUT, OUT);
      ctx.drawImage(imgRef.current, sx, sy, size, size, 0, 0, OUT, OUT);
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("export failed"))), "image/jpeg", 0.9),
      );
      const base = file.name.replace(/\.[^.]+$/, "") || "avatar";
      onDone(new File([blob], `${base}.jpg`, { type: "image/jpeg" }));
    } catch {
      setError("Could not save this photo. Please try another image.");
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="avatar-cropper-title"
        tabIndex={-1}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0d1424] p-5 shadow-2xl outline-none sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 id="avatar-cropper-title" className="text-lg font-semibold text-white">
              Adjust your photo
            </h2>
            <p className="mt-1 text-sm text-gray-400">Drag to position, zoom to fit your face in the circle.</p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-white/5 hover:text-white"
            aria-label="Close"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex justify-center">
          <div
            role="application"
            aria-label="Photo position. Use the arrow keys to move the photo, plus and minus to zoom."
            tabIndex={0}
            onKeyDown={onFrameKey}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onWheel={onWheel}
            className="relative cursor-grab touch-none select-none overflow-hidden rounded-xl bg-black outline-none ring-blue-500 focus-visible:ring-2 active:cursor-grabbing"
            style={{ width: VIEW, height: VIEW }}
          >
            {url && (
              <img
                ref={imgRef}
                src={url}
                alt=""
                draggable={false}
                onLoad={(e) => setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
                onError={() => setError("This file can't be opened as an image. Try a JPG or PNG.")}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: shownW,
                  height: shownH,
                  left: VIEW / 2 - shownW / 2 + offset.x,
                  top: VIEW / 2 - shownH / 2 + offset.y,
                }}
              />
            )}
            {/* darken everything outside the round crop */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 rounded-full"
              style={{ boxShadow: "0 0 0 9999px rgba(0,0,0,0.6)", border: "2px solid rgba(255,255,255,0.85)" }}
            />
            {natural && (
              <span className="pointer-events-none absolute bottom-7 left-1/2 inline-flex -translate-x-1/2 items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] text-gray-200">
                <Move className="h-3 w-3" aria-hidden="true" /> Drag to move
              </span>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => applyZoom(zoom - 0.2)}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-white/5"
            aria-label="Zoom out"
          >
            <ZoomOut className="h-5 w-5" aria-hidden="true" />
          </button>
          <input
            type="range"
            min="1"
            max={MAX_ZOOM}
            step="0.01"
            value={zoom}
            onChange={(e) => applyZoom(Number(e.target.value))}
            className="h-1.5 flex-1 cursor-pointer accent-blue-500"
            aria-label="Zoom"
          />
          <button
            type="button"
            onClick={() => applyZoom(zoom + 0.2)}
            className="rounded-lg p-1.5 text-gray-300 hover:bg-white/5"
            aria-label="Zoom in"
          >
            <ZoomIn className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-400" role="alert">
            {error}
          </p>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-medium text-gray-200 hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!natural || busy}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {busy ? "Saving…" : "Use photo"}
          </button>
        </div>
      </div>
    </div>
  );
}
