import React from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "../../utils/analytics.js";

/**
 * PageViewTracker Component
 * Automatically tracks page views when the route changes
 */
export default function PageViewTracker() {
  const location = useLocation();

  React.useEffect(() => {
    // Track page view when route changes
    const path = location.pathname + location.search;
    trackPageView(path);
  }, [location]);

  return null; // This component doesn't render anything
}
