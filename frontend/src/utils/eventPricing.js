// How an event's price and registration read on the site.
//
// Expos and conferences sell their own tickets: with no price on XK and an
// organiser link, the page says "Tickets on the organiser's site". Any other
// event with no price (a seminar, webinar or meetup) is free, even when people
// register through an outside form, e.g. the Surat seminar (1 Nov 2026) with
// its Google Form.
const ORGANISER_TICKETED = new Set(["Expo", "Conference"]);

export function eventPricing(event) {
  const priceNum = Number(event?.price);
  const isPaid = Number.isFinite(priceNum) && priceNum > 0;
  const externalUrl = (event?.externalUrl || "").trim();
  const ticketsAtOrganiser =
    !isPaid && Boolean(externalUrl) && ORGANISER_TICKETED.has(event?.category);
  return {
    isPaid,
    price: isPaid ? priceNum : 0,
    isFree: !isPaid && !ticketsAtOrganiser,
    ticketsAtOrganiser,
    externalUrl,
  };
}
