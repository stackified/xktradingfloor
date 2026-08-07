import React from "react";
import { motion } from "framer-motion";
import { MapPin, Minus, Plus, RotateCcw } from "lucide-react";
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  ZoomableGroup,
} from "react-simple-maps";

// TopoJSON vendored in /public so we don't hit an external CDN (CSP-safe,
// works offline, and doesn't add to the JS bundle).
const GEO_URL = "/geo/countries-110m.json";

// Region → { primary country IDs, secondary highlight IDs, pin center [lng, lat],
// zoom + center used when the region is drilled into }. IDs are ISO 3166-1
// numeric codes because that's what world-atlas' topojson uses as feature.id.
const REGION_CONFIG = {
  USA: {
    label: "USA",
    primaryIds: new Set([840]),
    zoomCenter: [-98, 39],
    zoom: 3,
    pin: [-98, 39],
  },
  UK: {
    label: "UK",
    primaryIds: new Set([826]),
    zoomCenter: [-2, 54],
    zoom: 5,
    pin: [-2, 54],
  },
  UAE: {
    label: "UAE",
    primaryIds: new Set([784]),
    zoomCenter: [54, 24],
    zoom: 5,
    pin: [54, 24],
  },
  India: {
    label: "India",
    primaryIds: new Set([356]),
    zoomCenter: [79, 22],
    zoom: 3,
    pin: [79, 22],
  },
  Europe: {
    label: "Europe",
    // Broad set of European ISO codes (subset — enough to visually cover the map).
    primaryIds: new Set([
      40, 56, 100, 191, 196, 203, 208, 233, 246, 250, 268, 276, 300, 348, 352,
      372, 380, 428, 440, 442, 470, 498, 499, 528, 578, 616, 620, 642, 703,
      705, 724, 752, 756, 792, 804,
    ]),
    zoomCenter: [15, 52],
    zoom: 3.5,
    pin: [15, 50],
  },
  Asia: {
    label: "Asia",
    primaryIds: new Set([
      50, 64, 96, 104, 116, 156, 158, 344, 360, 364, 368, 376, 392, 398, 400,
      408, 410, 414, 417, 418, 422, 446, 458, 462, 496, 512, 524, 586, 608,
      626, 634, 682, 702, 704, 760, 762, 764, 792, 795, 860, 887,
    ]),
    zoomCenter: [100, 30],
    zoom: 2.5,
    pin: [100, 25],
  },
  Global: {
    label: "Global",
    primaryIds: new Set(),
    zoomCenter: [0, 20],
    zoom: 1,
    pin: [0, 5],
  },
};

const REGIONS = Object.keys(REGION_CONFIG);

// Build a country-id → array of matching region keys, so we can tint a
// country based on ANY region whose set contains it.
const COUNTRY_TO_REGIONS = (() => {
  const map = new Map();
  Object.entries(REGION_CONFIG).forEach(([key, cfg]) => {
    cfg.primaryIds.forEach((id) => {
      if (!map.has(id)) map.set(id, []);
      map.get(id).push(key);
    });
  });
  return map;
})();

function EventWorldMap({ events = [], activeRegion = "", onSelectRegion }) {
  // Count events per region for the pin badges.
  const counts = React.useMemo(() => {
    const map = {};
    events.forEach((e) => {
      const r = (e.region || "").trim();
      if (!r) return;
      map[r] = (map[r] || 0) + 1;
    });
    return map;
  }, [events]);

  // Custom hover tooltip: {name, count, x, y}. Positioned via mouse coords
  // relative to the map container — a lot nicer than the native `<title>`.
  const [tooltip, setTooltip] = React.useState(null);
  const containerRef = React.useRef(null);

  const showTooltip = (evt, geo) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const regionKeys = COUNTRY_TO_REGIONS.get(Number(geo.id)) || [];
    // Sum event counts across every region this country is a member of. For
    // single-country regions (USA/UK/UAE/India) this is that region's count;
    // for a country in Europe/Asia it shows the broader region total.
    const total = regionKeys.reduce((sum, k) => sum + (counts[k] || 0), 0);
    setTooltip({
      name: geo.properties?.name || "Country",
      regionKeys,
      count: total,
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top,
    });
  };
  const moveTooltip = (evt) => {
    if (!tooltip || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setTooltip((t) => ({ ...t, x: evt.clientX - rect.left, y: evt.clientY - rect.top }));
  };
  const hideTooltip = () => setTooltip(null);

  // Zoom + center state, driven by clicks. When the user clicks a region pin
  // (or a country that belongs to a region), we drill into that region.
  const defaultView = { coordinates: [10, 25], zoom: 1 };
  const [view, setView] = React.useState(defaultView);

  // Keep view in sync with `activeRegion` so external controls (e.g. the
  // region dropdown in the parent grid) drill the map too.
  React.useEffect(() => {
    if (!activeRegion) {
      setView(defaultView);
      return;
    }
    const cfg = REGION_CONFIG[activeRegion];
    if (cfg) setView({ coordinates: cfg.zoomCenter, zoom: cfg.zoom });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeRegion]);

  const handleRegionClick = (regionKey) => {
    if (!onSelectRegion) return;
    onSelectRegion(activeRegion === regionKey ? "" : regionKey);
  };

  // When a country is clicked, drill into whichever region contains it (if any).
  const handleCountryClick = (geo) => {
    const regionKeys = COUNTRY_TO_REGIONS.get(Number(geo.id)) || [];
    // If the country maps to multiple regions (e.g. UK is in "UK" and could
    // conceptually be in "Europe" too), pick the first — regions are ordered
    // most-specific-first in REGION_CONFIG.
    const targetRegion = regionKeys.find((k) => counts[k]) || regionKeys[0];
    if (targetRegion) handleRegionClick(targetRegion);
  };

  const resetView = () => {
    if (onSelectRegion) onSelectRegion("");
    setView(defaultView);
  };

  // Country-fill tint: baseline for all, brighter for countries in the active
  // region, brightest for countries with events in a region that has some.
  const fillFor = (geo) => {
    const id = Number(geo.id);
    const regionKeys = COUNTRY_TO_REGIONS.get(id) || [];
    if (regionKeys.length === 0) return "#1a2540"; // no region
    const isActive = activeRegion && regionKeys.includes(activeRegion);
    const hasEvents = regionKeys.some((k) => counts[k]);
    if (isActive) return "#3b82f6"; // blue-500
    if (hasEvents) return "#1e3a8a"; // blue-900
    return "#1e293b"; // slate-800 — belongs to a region but no events
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-gray-900 to-black"
    >
      {/* Zoom controls */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => setView((v) => ({ ...v, zoom: Math.min(v.zoom + 1, 8) }))}
          className="h-7 w-7 rounded-md bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:border-blue-400/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Zoom in"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setView((v) => ({ ...v, zoom: Math.max(v.zoom - 1, 1) }))}
          className="h-7 w-7 rounded-md bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:border-blue-400/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Zoom out"
        >
          <Minus className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          className="h-7 w-7 rounded-md bg-gray-900/80 border border-white/10 text-gray-300 hover:text-white hover:border-blue-400/40 backdrop-blur-sm flex items-center justify-center"
          aria-label="Reset view"
          title="Reset view"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ scale: 140 }}
        style={{ width: "100%", height: "auto" }}
      >
        <ZoomableGroup
          zoom={view.zoom}
          center={view.coordinates}
          onMoveEnd={(pos) => setView({ coordinates: pos.coordinates, zoom: pos.zoom })}
          minZoom={1}
          maxZoom={8}
        >
          <Geographies geography={GEO_URL}>
            {({ geographies }) =>
              geographies.map((geo) => {
                const fill = fillFor(geo);
                const regionKeys = COUNTRY_TO_REGIONS.get(Number(geo.id)) || [];
                const clickable = regionKeys.length > 0;
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    onMouseEnter={(evt) => showTooltip(evt, geo)}
                    onMouseMove={moveTooltip}
                    onMouseLeave={hideTooltip}
                    onClick={() => clickable && handleCountryClick(geo)}
                    style={{
                      default: {
                        fill,
                        stroke: "#0b1220",
                        strokeWidth: 0.4,
                        outline: "none",
                        cursor: clickable ? "pointer" : "default",
                      },
                      hover: {
                        fill: clickable ? "#60a5fa" : "#334155",
                        stroke: "#0b1220",
                        strokeWidth: 0.4,
                        outline: "none",
                      },
                      pressed: {
                        fill: "#2563eb",
                        outline: "none",
                      },
                    }}
                  />
                );
              })
            }
          </Geographies>

          {/* Region pins with event counts */}
          {REGIONS.map((key) => {
            const cfg = REGION_CONFIG[key];
            const count = counts[key] || 0;
            const active = activeRegion === key;
            const hasEvents = count > 0;
            // All pins always render — an empty region is data too, and the
            // client wants counts visible at a glance without hovering.
            // Number-on-marker: sized to be readable at the default (zoom 1)
            // map viewport, then inverse-scaled with zoom so it stays roughly
            // the same visual size when the user drills in.
            const digitCount = String(count).length;
            const baseRadius = active ? 10 : hasEvents ? 8 : 7;
            const radius = baseRadius + Math.max(0, digitCount - 1) * 2;
            const scale = 1 / view.zoom;
            // Dim empty-region pins so populated ones stand out.
            const discFill = active
              ? "#60a5fa"
              : hasEvents
                ? "#3b82f6"
                : "#334155";
            const discOpacity = hasEvents || active ? 1 : 0.85;
            return (
              <Marker
                key={key}
                coordinates={cfg.pin}
                onClick={() => handleRegionClick(key)}
                onMouseEnter={(evt) => {
                  if (!containerRef.current) return;
                  const rect = containerRef.current.getBoundingClientRect();
                  setTooltip({
                    name: cfg.label,
                    regionKeys: [key],
                    count,
                    x: evt.clientX - rect.left,
                    y: evt.clientY - rect.top,
                  });
                }}
                onMouseMove={moveTooltip}
                onMouseLeave={hideTooltip}
                style={{ default: { cursor: "pointer" } }}
              >
                <g transform={`scale(${scale})`} opacity={discOpacity}>
                  {/* Outer glow only when the region has events or is active */}
                  {(active || hasEvents) && (
                    <circle
                      r={radius + 6}
                      fill="#3b82f6"
                      fillOpacity={active ? 0.3 : 0.18}
                    />
                  )}
                  {/* Solid disc */}
                  <circle
                    r={radius}
                    fill={discFill}
                    stroke="#0b1220"
                    strokeWidth={1.2}
                  />
                  {/* The count itself — big enough to read at zoom 1 */}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#ffffff"
                    fontSize={active ? 12 : 11}
                    fontWeight={800}
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {count}
                  </text>
                  {/* Region label sitting below the disc — visible by default */}
                  <text
                    textAnchor="middle"
                    y={radius + 12}
                    fill="#e2e8f0"
                    fontSize={9}
                    fontWeight={600}
                    stroke="#0b1220"
                    strokeWidth={2}
                    paintOrder="stroke"
                    style={{ pointerEvents: "none", userSelect: "none" }}
                  >
                    {cfg.label}
                  </text>
                </g>
              </Marker>
            );
          })}
        </ZoomableGroup>
      </ComposableMap>

      {/* Region-chip strip below the map — the source of truth for what pins
          highlight in the active region, and a fallback for users who don't
          discover click-on-country. */}
      <div className="absolute left-3 bottom-3 right-16 z-20 flex flex-wrap items-center gap-1.5">
        {REGIONS.map((key) => {
          const count = counts[key] || 0;
          const active = activeRegion === key;
          return (
            <button
              type="button"
              key={key}
              onClick={() => handleRegionClick(key)}
              className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm transition-all ${
                active
                  ? "border-blue-400 bg-blue-500/20 text-blue-100"
                  : count > 0
                    ? "border-white/10 bg-gray-900/80 text-gray-200 hover:border-blue-400/40 hover:text-blue-200"
                    : "border-white/5 bg-gray-900/60 text-gray-500 hover:text-gray-300"
              }`}
            >
              <MapPin className="h-2.5 w-2.5" />
              {REGION_CONFIG[key].label}
              {count > 0 && (
                <span
                  className={`ml-0.5 rounded-full px-1.5 text-[9px] ${
                    active
                      ? "bg-blue-400/30 text-blue-100"
                      : "bg-blue-500/25 text-blue-200"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Custom hover tooltip — country name + event count, positioned at cursor */}
      {tooltip && (
        <div
          className="absolute z-30 pointer-events-none rounded-lg border border-white/10 bg-gray-900/95 px-3 py-2 shadow-xl backdrop-blur-md"
          style={{
            left: Math.min(
              Math.max(tooltip.x + 12, 0),
              (containerRef.current?.clientWidth || 0) - 160
            ),
            top: Math.max(tooltip.y - 44, 0),
          }}
        >
          <div className="text-sm font-semibold text-white leading-tight">
            {tooltip.name}
          </div>
          {tooltip.count > 0 ? (
            <div className="mt-0.5 flex items-center gap-1 text-xs text-blue-300">
              <MapPin className="h-3 w-3" />
              {tooltip.count} event{tooltip.count === 1 ? "" : "s"}
              {tooltip.regionKeys.length > 0 && (
                <span className="text-gray-500">
                  · {tooltip.regionKeys.join(", ")}
                </span>
              )}
            </div>
          ) : tooltip.regionKeys.length > 0 ? (
            <div className="mt-0.5 text-[10px] text-gray-500">
              No events yet
            </div>
          ) : null}
        </div>
      )}

      {/* Live pulse on active region */}
      {activeRegion && REGION_CONFIG[activeRegion] && (
        <motion.div
          className="absolute inset-0 pointer-events-none z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {/* subtle vignette to draw eye to the zoomed area */}
          <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/40 pointer-events-none" />
        </motion.div>
      )}
    </div>
  );
}

export default EventWorldMap;
