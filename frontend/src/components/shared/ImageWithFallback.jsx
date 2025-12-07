import React from "react";
import { getAssetPath } from "../../utils/assets.js";
import { getCdnAssetUrl, getCdnAssetWithFallback } from "../../utils/cdn.js";

/**
 * Generate a dynamic fallback image with text (blog title)
 * Creates a data URL with the title text displayed
 */
function generateTextImage(text, width = 800, height = 400) {
  // Create a canvas element
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1e3a8a"); // blue-800
  gradient.addColorStop(1, "#3b82f6"); // blue-500
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Text styling
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px system-ui, -apple-system, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  // Word wrap text
  const words = text.split(" ");
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const testLine = currentLine + " " + word;
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > width - 80 && currentLine.length > 0) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine);

  // Draw text lines
  const lineHeight = 40;
  const startY = (height - (lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });

  return canvas.toDataURL("image/png");
}

/**
 * ImageWithFallback - A reusable image component with fallback handling
 *
 * @param {string} src - Primary image source path
 * @param {string} fallback - Fallback image path (defaults to /assets/placeholder.jpg)
 * @param {string} alt - Alt text for accessibility (used for dynamic fallback if provided)
 * @param {string} className - Additional CSS classes
 * @param {boolean} useDynamicFallback - If true, generates dynamic image with alt text
 * @param {object} ...props - Other img element props
 */

export default function ImageWithFallback({
  src,
  fallback = "/assets/placeholder.jpg",
  alt = "",
  className = "",
  useDynamicFallback = false,
  useCdn = true, // Enable CDN by default
  ...props
}) {
  // Get CDN URLs with fallback
  const { cdnUrl, fallbackUrl } = React.useMemo(() => {
    if (useCdn && src) {
      return getCdnAssetWithFallback(src, fallback);
    }
    return {
      cdnUrl: getAssetPath(src),
      fallbackUrl: getAssetPath(fallback),
    };
  }, [src, fallback, useCdn]);

  const [imgSrc, setImgSrc] = React.useState(cdnUrl);
  const [hasError, setHasError] = React.useState(false);
  const [dynamicFallback, setDynamicFallback] = React.useState(null);
  const [errorCount, setErrorCount] = React.useState(0);

  React.useEffect(() => {
    setImgSrc(cdnUrl);
    setHasError(false);
    setErrorCount(0);
    // Generate dynamic fallback if alt text is provided and useDynamicFallback is true
    if (useDynamicFallback && alt && typeof window !== "undefined") {
      try {
        const dynamicImg = generateTextImage(alt);
        setDynamicFallback(dynamicImg);
      } catch (error) {
        console.warn("Failed to generate dynamic fallback image:", error);
        setDynamicFallback(null);
      }
    }
  }, [src, alt, useDynamicFallback, cdnUrl]);

  const handleError = () => {
    // Prevent infinite error loops
    if (errorCount >= 2) {
      return;
    }

    setErrorCount((prev) => prev + 1);
    setHasError(true);

    // Fallback chain: CDN -> Local -> Dynamic -> Static placeholder
    if (errorCount === 0 && useCdn && imgSrc === cdnUrl) {
      // First error: try local fallback
      setImgSrc(fallbackUrl);
    } else if (useDynamicFallback && dynamicFallback) {
      // Second error: use dynamic fallback if available
      setImgSrc(dynamicFallback);
    } else {
      // Final fallback: static placeholder
      setImgSrc(fallbackUrl);
    }
  };

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
