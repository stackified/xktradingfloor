// How an event's price and registration read on the site.
//
// Expos and conferences sell their own tickets: with no price on XK and an
// organiser link, the page says "Tickets on the organiser's site". Any other
// event with no price (a seminar, webinar or meetup) is free, even when people
// register through an outside form, e.g. the Surat seminar (1 Nov 2026) with
// its Google Form.
//
// Since backend B30 (live 27 Oct 2026) an event has its own `currency` (ISO
// code, default USD) and optional `ticketTiers` [{ name, price, fullPrice?,
// notes? }]; `price` is then the cheapest tier.
const ORGANISER_TICKETED = new Set(["Expo", "Conference"]);

// Currencies offered in the admin form (the backend accepts these and more).
export const EVENT_CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "AED", "SAR", "QAR", "SGD", "HKD", "AUD", "CAD",
  "JPY", "CNY", "MYR", "THB", "IDR", "PHP", "VND", "LAK", "UZS", "ZAR", "NGN",
  "KES", "TRY", "CHF",
];

// "₹499", "$25", "€1,250.50" in the event's currency.
export function formatMoney(amount, currency = "USD") {
  const n = Number(amount);
  if (!Number.isFinite(n)) return "";
  const code = String(currency || "USD").toUpperCase();
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `${code} ${n.toLocaleString("en-US")}`;
  }
}

export function eventPricing(event) {
  const currency = String(event?.currency || "USD").toUpperCase();
  const tiers = (Array.isArray(event?.ticketTiers) ? event.ticketTiers : [])
    .filter((t) => t && t.name && Number.isFinite(Number(t.price)))
    .map((t) => ({
      name: t.name,
      price: Number(t.price),
      fullPrice: Number.isFinite(Number(t.fullPrice)) && Number(t.fullPrice) > Number(t.price) ? Number(t.fullPrice) : null,
      notes: t.notes || "",
    }));
  const lowestTier = tiers.length ? Math.min(...tiers.map((t) => t.price)) : null;
  const priceNum = lowestTier ?? Number(event?.price);
  const isPaid = Number.isFinite(priceNum) && priceNum > 0;
  const externalUrl = (event?.externalUrl || "").trim();
  const ticketsAtOrganiser =
    !isPaid && !tiers.length && Boolean(externalUrl) && ORGANISER_TICKETED.has(event?.category);
  const isFree = !isPaid && !ticketsAtOrganiser;
  const several = tiers.length > 1;

  // Short label for cards: "From ₹499", "$25", "Free" (null when the
  // organiser sells the tickets).
  let label = null;
  if (isPaid) label = several ? `From ${formatMoney(priceNum, currency)}` : formatMoney(priceNum, currency);
  else if (several && tiers.some((t) => t.price > 0)) label = "Free and paid passes";
  else if (isFree) label = "Free";

  return {
    isPaid,
    price: isPaid ? priceNum : 0,
    currency,
    tiers,
    isFree,
    ticketsAtOrganiser,
    externalUrl,
    label,
  };
}
