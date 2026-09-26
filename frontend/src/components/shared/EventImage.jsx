import React from "react";
import ImageWithFallback from "./ImageWithFallback.jsx";

// One image frame for events everywhere (events grid, homepage featured
// events, event details), so an image looks the same in every place.
//
// Always 16:9. The whole image is shown (`object-contain`) over a blurred,
// zoomed copy of itself, so a banner fills the frame edge to edge and a tall
// poster is shown complete instead of having its title cropped off — no
// letterbox bars, no stretching, whatever size was uploaded.
function EventImage({ src, alt = "", className = "", rounded = "", priority = false }) {
  const url = typeof src === "string" && src.trim() ? src.trim() : null;

  return (
    <div className={`relative w-full aspect-[16/9] overflow-hidden bg-gray-900 ${rounded} ${className}`}>
      {url && (
        <img
          src={url}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover scale-110 blur-xl opacity-60"
          loading={priority ? "eager" : "lazy"}
          decoding="async"
        />
      )}
      <div className="absolute inset-0">
        <ImageWithFallback
          src={url}
          fallback="/assets/placeholder.jpg"
          alt={alt}
          className={`h-full w-full ${url ? "object-contain" : "object-cover"}`}
          useDynamicFallback={true}
          priority={priority}
        />
      </div>
    </div>
  );
}

export default EventImage;
