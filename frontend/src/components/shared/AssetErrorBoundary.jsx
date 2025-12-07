import React from "react";
import { AlertCircle } from "lucide-react";

/**
 * Error Boundary for Asset Loading Failures
 * Catches errors during asset rendering and provides graceful fallback
 */
export class AssetErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging (only in development)
    if (import.meta.env.MODE === "development") {
      console.error("Asset loading error:", error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          className={`
            flex items-center justify-center
            bg-gray-800/50 border border-gray-700 rounded-lg
            ${this.props.className || "w-full h-full min-h-[200px]"}
          `}
          role="img"
          aria-label={this.props.alt || "Image failed to load"}
        >
          <div className="text-center p-4">
            <AlertCircle className="h-8 w-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-400">
              {this.props.errorMessage || "Failed to load image"}
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper component for images with error boundary
 */
export function SafeImage({ src, alt, className, fallback, ...props }) {
  return (
    <AssetErrorBoundary
      fallback={fallback}
      className={className}
      alt={alt}
      errorMessage="Image failed to load"
    >
      <img src={src} alt={alt} className={className} {...props} />
    </AssetErrorBoundary>
  );
}

