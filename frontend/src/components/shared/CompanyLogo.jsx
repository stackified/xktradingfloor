import React from "react";

// One logo treatment for every place a company appears (home tables,
// reviews list, sidebar, profile header, admin), so the same upload looks
// the same everywhere instead of cropped in one place and tiny in another.
//
// • Square tile, fixed size per `size`, `object-contain`: the whole logo is
//   visible, never cropped. Non-square logos get breathing room; square ones
//   (already padded by the admin upload clean-up) fill the tile.
// • Dark tile, matching the site (the client's choice). Logos with dark
//   artwork on a transparent background get a light backing when they are
//   uploaded (utils/imageProcessing.js), so they stay visible here.
// • Many existing uploads are 1080×1350 "Launching Soon" posters with the
//   logo small in the middle of a black canvas. Those are detected on load
//   (tall aspect ratio) and shown cropped to the centre on a black tile,
//   which is what the logo actually sits on. New uploads are trimmed to a
//   tight square in the admin form (utils/imageProcessing.js), so this is
//   only a safety net for old files.
// • A missing or broken image falls back to the company's initials instead
//   of a placeholder photo.

const SIZES = {
  xs: { box: "h-8 w-8", pad: "p-1", radius: "rounded-md", text: "text-[10px]", px: 32 },
  sm: { box: "h-10 w-10", pad: "p-1", radius: "rounded-lg", text: "text-xs", px: 40 },
  md: { box: "h-14 w-14", pad: "p-1.5", radius: "rounded-xl", text: "text-sm", px: 56 },
  lg: { box: "h-20 w-20", pad: "p-2", radius: "rounded-xl", text: "text-lg", px: 80 },
  xl: { box: "h-20 w-20 sm:h-24 sm:w-24", pad: "p-2", radius: "rounded-xl", text: "text-xl", px: 96 },
};

function initials(name = "") {
  const words = String(name).trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

// Busts a response the browser may have cached while it was broken (R2
// served some logos with the wrong Content-Type before the upload fix).
function withCacheBuster(url) {
  return `${url}${url.includes("?") ? "&" : "?"}r=${Date.now()}`;
}

function CompanyLogo({ src, name = "", size = "md", className = "", priority = false }) {
  const s = SIZES[size] || SIZES.md;
  const url = typeof src === "string" ? src.trim() : "";
  const [current, setCurrent] = React.useState(url);
  const [failed, setFailed] = React.useState(!url);
  // "poster": old tall upload → centre crop on black.
  // "square": already a padded square (e.g. trimmed by the admin form) → fill the tile.
  // "other":  anything else → whole logo with breathing room.
  const [shape, setShape] = React.useState("other");
  const retried = React.useRef(false);

  React.useEffect(() => {
    setCurrent(url);
    setFailed(!url);
    setShape("other");
    retried.current = false;
  }, [url]);

  const handleLoad = (e) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget;
    if (!w) return;
    const ratio = h / w;
    setShape(ratio > 1.15 ? "poster" : ratio > 0.9 ? "square" : "other");
  };
  const poster = shape === "poster";

  const handleError = () => {
    if (!retried.current && /^https?:\/\//i.test(url)) {
      retried.current = true;
      setCurrent(withCacheBuster(url));
      return;
    }
    setFailed(true);
  };

  if (failed) {
    return (
      <div
        className={`${s.box} ${s.radius} flex-shrink-0 flex items-center justify-center font-bold text-white bg-gradient-to-br from-blue-600 to-indigo-700 border border-white/10 ${s.text} ${className}`}
        role="img"
        aria-label={name ? `${name} logo` : "Company logo"}
      >
        {initials(name)}
      </div>
    );
  }

  return (
    <div
      className={`${s.box} ${s.radius} flex-shrink-0 overflow-hidden flex items-center justify-center border ${
        poster
          ? "bg-black border-white/10"
          : shape === "square"
          ? "bg-[#0B1220] border-white/10"
          : `bg-[#0B1220] border-white/10 ${s.pad}`
      } ${className}`}
    >
      <img
        src={current}
        alt={name ? `${name} logo` : "Company logo"}
        width={s.px}
        height={s.px}
        onLoad={handleLoad}
        onError={handleError}
        className={`h-full w-full ${poster ? "object-cover" : "object-contain"}`}
        {...(priority ? { loading: "eager", fetchPriority: "high" } : { loading: "lazy", decoding: "async" })}
      />
    </div>
  );
}

export default CompanyLogo;
