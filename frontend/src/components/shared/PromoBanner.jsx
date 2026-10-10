import React from "react";
import { Link, useLocation } from "react-router-dom";
import { CalendarDays, MapPin, Ticket, Users, ArrowRight } from "lucide-react";
import { trackEvent } from "../../utils/analytics.js";
import { getAssetPath } from "../../utils/assets.js";

// Sahil's banner for the Surat trading seminar (FundingPips x Akash.FRX x
// Sahil Shaikh, Sun 1 Nov 2026), shown on the homepage and the Events page:
// the poster tells people to register at "XKTradingFloor.com -> Events".
// It hides itself once the seminar is over; remove it and public/banners/
// in the next release after that.
//
// eventPath: Sahil's event page for the seminar. Without it the banner
// points to the Events page. Entry is $25 (Sahil, 10 Oct), so nothing here
// says "free"; the free part is the $5,000 funded account on the poster.
const BANNER = {
  id: "surat-seminar-2026",
  eventPath: "/events/surat-trading-seminar-2026-fundingpips-akash-frx-sahil-shaikh-6ac93428f42efd8eb2faa791",
  endsAt: Date.parse("2026-11-01T14:00:00+05:30"),
  src: (w) => getAssetPath(`/banners/surat-seminar-2026-v2-${w}.webp`),
  widths: [800, 1200, 2000],
  alt:
    "Surat Trading Seminar: FundingPips x Akash.FRX x Sahil Shaikh. Sunday 1 November 2026, 10 AM to 2 PM, in Surat. " +
    "Free $5,000 two-step Pro funded account for all 50 participants. Only 50 slots.",
};

// The wide image is hard to read on a phone, so the key facts and the
// button also sit underneath it as text.
function PromoBanner() {
  const { pathname } = useLocation();
  if (Date.now() > BANNER.endsAt) return null;

  const href = BANNER.eventPath || "/events";
  const linked = href !== pathname;
  const onClick = () =>
    trackEvent("promo_banner_click", { banner: BANNER.id, page: pathname });

  const image = (
    <img
      src={BANNER.src(1200)}
      srcSet={BANNER.widths.map((w) => `${BANNER.src(w)} ${w}w`).join(", ")}
      sizes="(min-width: 1280px) 1216px, calc(100vw - 32px)"
      width={1200}
      height={400}
      alt={BANNER.alt}
      loading="lazy"
      decoding="async"
      className="block w-full h-auto"
    />
  );

  return (
    <section
      aria-label="Surat Trading Seminar"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <div className="overflow-hidden rounded-2xl border border-blue-500/30 bg-gray-950 shadow-lg shadow-blue-500/10">
        {linked ? (
          <Link to={href} onClick={onClick} className="block">
            {image}
          </Link>
        ) : (
          image
        )}
        <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-300">
            <li className="font-semibold text-white">Trading seminar</li>
            <li className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4 text-blue-400" aria-hidden="true" />
              Sun 1 Nov, 10 AM to 2 PM
            </li>
            <li className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-400" aria-hidden="true" />
              Surat
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Ticket className="h-4 w-4 text-blue-400" aria-hidden="true" />
              $25 entry
            </li>
            <li className="inline-flex items-center gap-1.5">
              <Users className="h-4 w-4 text-blue-400" aria-hidden="true" />
              50 seats
            </li>
          </ul>
          {linked && (
            <Link
              to={href}
              onClick={onClick}
              className="btn btn-primary w-full gap-2 sm:w-auto"
            >
              {BANNER.eventPath ? "Register" : "See event"}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

export default PromoBanner;
