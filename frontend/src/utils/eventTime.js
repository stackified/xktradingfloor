// Event dates in the event's own local time, e.g.
//   "Fri, 28 Aug 2026 · 10:00 AM – 6:00 PM (IST)"
//   "28 – 30 Aug 2026 · 10:00 AM – 6:00 PM (GST)"
// as the client asked (2 Oct 2026). Needs the event's IANA time zone
// (`timeZone`, e.g. "Asia/Dubai") and optional `endDateTime`, which arrive with
// backend task B17. Events without a time zone keep the old display, in the
// visitor's own time.

// Zones offered in the admin event form. Covers where the expos Sahil's team
// tracks take place; any other IANA name typed in still works.
export const EVENT_TIME_ZONES = [
  { value: "Asia/Dubai", label: "Dubai, Abu Dhabi (GST)" },
  { value: "Asia/Kolkata", label: "India (IST)" },
  { value: "Asia/Riyadh", label: "Riyadh (AST)" },
  { value: "Asia/Qatar", label: "Doha (AST)" },
  { value: "Asia/Bangkok", label: "Bangkok (ICT)" },
  { value: "Asia/Singapore", label: "Singapore (SGT)" },
  { value: "Asia/Kuala_Lumpur", label: "Kuala Lumpur (MYT)" },
  { value: "Asia/Hong_Kong", label: "Hong Kong (HKT)" },
  { value: "Asia/Shanghai", label: "China (CST)" },
  { value: "Asia/Tokyo", label: "Tokyo (JST)" },
  { value: "Asia/Ho_Chi_Minh", label: "Vietnam (ICT)" },
  { value: "Asia/Manila", label: "Manila (PHT)" },
  { value: "Asia/Jakarta", label: "Jakarta (WIB)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "Europe/Nicosia", label: "Cyprus (EET/EEST)" },
  { value: "Europe/Paris", label: "Central Europe (CET/CEST)" },
  { value: "Europe/Istanbul", label: "Istanbul (TRT)" },
  { value: "Africa/Cairo", label: "Cairo (EET/EEST)" },
  { value: "Africa/Johannesburg", label: "South Africa (SAST)" },
  { value: "Africa/Lagos", label: "Lagos (WAT)" },
  { value: "Australia/Sydney", label: "Sydney (AEST/AEDT)" },
  { value: "America/New_York", label: "New York (ET)" },
  { value: "America/Chicago", label: "Chicago (CT)" },
  { value: "America/Los_Angeles", label: "Los Angeles (PT)" },
  { value: "America/Sao_Paulo", label: "São Paulo (BRT)" },
  { value: "UTC", label: "UTC" },
];

// Intl's "short" names for many zones are just "GMT+4"; the familiar
// abbreviations people expect on an event page come from this table.
const ABBR = {
  "Asia/Dubai": "GST",
  "Asia/Muscat": "GST",
  "Asia/Kolkata": "IST",
  "Asia/Calcutta": "IST",
  "Asia/Riyadh": "AST",
  "Asia/Qatar": "AST",
  "Asia/Bahrain": "AST",
  "Asia/Kuwait": "AST",
  "Asia/Bangkok": "ICT",
  "Asia/Ho_Chi_Minh": "ICT",
  "Asia/Singapore": "SGT",
  "Asia/Kuala_Lumpur": "MYT",
  "Asia/Hong_Kong": "HKT",
  "Asia/Shanghai": "CST",
  "Asia/Tokyo": "JST",
  "Asia/Manila": "PHT",
  "Asia/Jakarta": "WIB",
  "Europe/Istanbul": "TRT",
  "Africa/Johannesburg": "SAST",
  "Africa/Lagos": "WAT",
  "America/Sao_Paulo": "BRT",
};

const isValidZone = (tz) => {
  if (!tz) return false;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
};

// Zones with summer time: [standard, summer] names.
const SEASONAL = {
  "Europe/London": ["GMT", "BST"],
  "Europe/Dublin": ["GMT", "IST"],
  "Europe/Paris": ["CET", "CEST"],
  "Europe/Berlin": ["CET", "CEST"],
  "Europe/Madrid": ["CET", "CEST"],
  "Europe/Rome": ["CET", "CEST"],
  "Europe/Amsterdam": ["CET", "CEST"],
  "Europe/Nicosia": ["EET", "EEST"],
  "Europe/Athens": ["EET", "EEST"],
  "Africa/Cairo": ["EET", "EEST"],
  "Australia/Sydney": ["AEST", "AEDT"],
  "Australia/Melbourne": ["AEST", "AEDT"],
};

export function zoneAbbreviation(timeZone, date = new Date()) {
  if (!isValidZone(timeZone)) return "";
  if (ABBR[timeZone]) return ABBR[timeZone];
  if (SEASONAL[timeZone]) {
    const y = date.getUTCFullYear();
    const jan = offsetMinutes(timeZone, new Date(Date.UTC(y, 0, 1)));
    const jul = offsetMinutes(timeZone, new Date(Date.UTC(y, 6, 1)));
    const now = offsetMinutes(timeZone, date);
    const summer = now === Math.max(jan, jul) && jan !== jul;
    return SEASONAL[timeZone][summer ? 1 : 0];
  }
  const part = new Intl.DateTimeFormat("en-US", { timeZone, timeZoneName: "short" })
    .formatToParts(date)
    .find((p) => p.type === "timeZoneName");
  return part?.value || "";
}

// en-GB order ("28 Aug 2026"), with "Sep" rather than its "Sept".
const parts = (date, timeZone, opts) =>
  new Intl.DateTimeFormat("en-GB", { timeZone, ...opts }).format(date).replace("Sept", "Sep");

const timeOf = (date, timeZone) =>
  new Intl.DateTimeFormat("en-US", { timeZone, hour: "numeric", minute: "2-digit" }).format(date);

const dayKey = (date, timeZone) =>
  new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);

// Full date and time line for an event page.
export function formatEventWhen(event) {
  if (!event?.dateTime) return event?.date || "";
  const start = new Date(event.dateTime);
  if (Number.isNaN(start.getTime())) return event?.date || "";
  const tz = isValidZone(event.timeZone) ? event.timeZone : null;
  if (!tz) return start.toLocaleString();

  const end = event.endDateTime ? new Date(event.endDateTime) : null;
  const validEnd = end && !Number.isNaN(end.getTime()) && end > start ? end : null;
  const abbr = zoneAbbreviation(tz, start);

  let datePart;
  if (validEnd && dayKey(validEnd, tz) !== dayKey(start, tz)) {
    const sameMonth =
      parts(start, tz, { month: "short", year: "numeric" }) ===
      parts(validEnd, tz, { month: "short", year: "numeric" });
    datePart = sameMonth
      ? `${parts(start, tz, { day: "numeric" })} – ${parts(validEnd, tz, { day: "numeric", month: "short", year: "numeric" })}`
      : `${parts(start, tz, { day: "numeric", month: "short" })} – ${parts(validEnd, tz, { day: "numeric", month: "short", year: "numeric" })}`;
  } else {
    datePart = parts(start, tz, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  }

  const timePart = validEnd
    ? `${timeOf(start, tz)} – ${timeOf(validEnd, tz)}`
    : timeOf(start, tz);
  return `${datePart} · ${timePart}${abbr ? ` (${abbr})` : ""}`;
}

// Short date for cards, in the event's zone when it has one.
export function formatEventDate(event, opts = { day: "numeric", month: "short", year: "numeric" }) {
  if (!event?.dateTime) return "";
  const d = new Date(event.dateTime);
  if (Number.isNaN(d.getTime())) return "";
  const tz = isValidZone(event.timeZone) ? event.timeZone : undefined;
  return new Intl.DateTimeFormat("en-GB", { timeZone: tz, ...opts }).format(d).replace("Sept", "Sep");
}

// Start time for cards: "10:00 AM GST" in the event's zone, or the
// visitor's local time for events without one.
export function formatEventTimeShort(event) {
  if (!event?.dateTime) return "";
  const d = new Date(event.dateTime);
  if (Number.isNaN(d.getTime())) return "";
  const tz = isValidZone(event.timeZone) ? event.timeZone : undefined;
  const t = new Intl.DateTimeFormat("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit" }).format(d);
  const abbr = tz ? zoneAbbreviation(tz, d) : "";
  return abbr ? `${t} ${abbr}` : t;
}

// "City, Country" if the event has them, else the old free-text location.
export function formatEventPlace(event) {
  const place = [event?.city, event?.country].filter(Boolean).join(", ");
  return place || event?.location || "";
}

// --- Admin form helpers ------------------------------------------------------
// The admin types times as the event's local time ("10:00 in Dubai"); the API
// stores a real instant. These convert between a datetime-local string
// ("2026-08-28T10:00") and an ISO instant for a given IANA zone.

function offsetMinutes(timeZone, date) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  const asUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  return (asUtc - date.getTime()) / 60000;
}

export function zonedLocalToIso(local, timeZone) {
  if (!local) return "";
  if (!isValidZone(timeZone)) return new Date(local).toISOString();
  const [d, t = "00:00"] = local.split("T");
  const [y, mo, da] = d.split("-").map(Number);
  const [h, mi] = t.split(":").map(Number);
  const guess = Date.UTC(y, mo - 1, da, h, mi);
  // Two passes settle the offset around daylight-saving changes.
  let ts = guess - offsetMinutes(timeZone, new Date(guess)) * 60000;
  ts = guess - offsetMinutes(timeZone, new Date(ts)) * 60000;
  return new Date(ts).toISOString();
}

export function isoToZonedLocal(iso, timeZone) {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  if (!isValidZone(timeZone)) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
  const p = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      hourCycle: "h23",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
      .formatToParts(date)
      .map((x) => [x.type, x.value])
  );
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
}
