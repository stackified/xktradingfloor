import React from "react";
import {
  Calendar,
  Globe,
  Building2,
  Presentation,
  Video,
  Users,
  Trophy,
  GraduationCap,
  Tent,
  Wrench,
} from "lucide-react";

// Event category → icon. Shared by the Events page, the homepage event cards
// and the event detail page so a "Webinar" looks the same everywhere.
export const CATEGORY_ICON = {
  Expo: Tent,
  Conference: Presentation,
  Webinar: Video,
  Meetup: Users,
  Workshop: Wrench,
  Competition: Trophy,
  Seminar: GraduationCap,
};

export const EVENT_CATEGORIES = Object.keys(CATEGORY_ICON);

// Online / Campus, category and region chips.
function EventBadges({ evt, showRegion = true, size = "sm", className = "" }) {
  if (!evt) return null;
  const text = size === "md" ? "text-sm px-2.5 py-1" : "text-xs px-2 py-0.5";
  const icon = size === "md" ? "h-4 w-4" : "h-3 w-3";
  const CatIcon = evt.category ? CATEGORY_ICON[evt.category] || Calendar : null;
  if (!evt.type && !CatIcon && !(showRegion && evt.region)) return null;
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {evt.type === "online" ? (
        <span className={`inline-flex items-center gap-1 rounded border border-blue-500/30 bg-blue-500/20 text-blue-400 ${text}`}>
          <Globe className={icon} aria-hidden="true" /> Online
        </span>
      ) : evt.type === "campus" ? (
        <span className={`inline-flex items-center gap-1 rounded border border-green-500/30 bg-green-500/20 text-green-400 ${text}`}>
          <Building2 className={icon} aria-hidden="true" /> Campus
        </span>
      ) : null}
      {CatIcon && (
        <span className={`inline-flex items-center gap-1 rounded border border-purple-500/30 bg-purple-500/20 text-purple-300 ${text}`}>
          <CatIcon className={icon} aria-hidden="true" />
          {evt.category}
        </span>
      )}
      {showRegion && evt.region && (
        <span className={`inline-flex items-center rounded border border-gray-600/40 bg-gray-700/40 text-gray-300 ${text}`}>
          {evt.region}
        </span>
      )}
    </div>
  );
}

export default EventBadges;
