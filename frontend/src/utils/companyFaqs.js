// Question-and-answer pairs for a company page, built only from the facts XK
// holds for that company (regulation, platforms, deposit, funding, country,
// years active, instruments, reviews, promo codes). Shown on the page and sent
// as FAQPage structured data, so answer engines get direct, quotable answers
// ("What is the minimum deposit at Pipze?"). A question is only asked when
// the data to answer it exists; nothing is guessed.

import { computeTrustScore } from "./trustScore.js";

const list = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  return String(value).split(",").map((v) => v.trim()).filter(Boolean);
};

const join = (items) =>
  items.length <= 1 ? items.join("") : `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;

const KIND = { Broker: "broker", PropFirm: "prop firm", Crypto: "crypto platform" };

function activePromo(company, now = Date.now()) {
  return (company.promoCodes || []).find((p) => {
    if (!p?.code) return false;
    if (p.validTo && new Date(p.validTo).getTime() < now) return false;
    if (p.validFrom && new Date(p.validFrom).getTime() > now) return false;
    return true;
  });
}

export function companyFaqs(company) {
  if (!company?.name) return [];
  const name = company.name.trim();
  const kind = KIND[company.category] || "company";
  const faqs = [];

  const reviews = Number(company.totalReviews) || 0;
  if (reviews > 0) {
    const avg = Number(company.ratingsAggregate) || 0;
    const { score, label } = computeTrustScore(avg, reviews);
    faqs.push({
      question: `What do traders say about ${name}?`,
      answer: `${reviews} ${reviews === 1 ? "trader has" : "traders have"} reviewed ${name} on XK Trading Floor, with an average rating of ${avg.toFixed(1)} out of 5 (TrustScore ${score}/100, ${label}). The reviews are the opinions of the traders who wrote them.`,
    });
  } else {
    faqs.push({
      question: `What do traders say about ${name}?`,
      answer: `No trader has reviewed ${name} on XK Trading Floor yet. If you have traded with ${name}, you can write the first review.`,
    });
  }

  const regulation = list(company.regulation);
  if (regulation.length) {
    faqs.push({
      question: `Is ${name} regulated?`,
      answer: `The regulation or registration listed for ${name} on XK Trading Floor is: ${join(regulation)}. Always check a ${kind}'s licence on the regulator's own register before depositing.`,
    });
  }

  if (company.country) {
    faqs.push({
      question: `Where is ${name} based?`,
      answer: `${name} is listed as based in ${String(company.country).trim()}.`,
    });
  }

  if (company.yearsActive) {
    const years = String(company.yearsActive).trim();
    faqs.push({
      question: `How long has ${name} been operating?`,
      answer: /^\d+$/.test(years)
        ? `${name} has been operating for about ${years} ${years === "1" ? "year" : "years"}.`
        : `${name} has been operating for ${years}.`,
    });
  }

  const platforms = list(company.platforms);
  if (platforms.length) {
    faqs.push({
      question: `Which trading platforms does ${name} offer?`,
      answer: `${name} offers ${join(platforms)}.`,
    });
  }

  const assets = list(company.assets);
  if (assets.length) {
    faqs.push({
      question: `What can you trade with ${name}?`,
      answer: `${name} lists ${join(assets)}.`,
    });
  }

  if (company.minDeposit && String(company.minDeposit).trim()) {
    faqs.push({
      question: `What is the minimum deposit at ${name}?`,
      answer: `The minimum deposit listed for ${name} is ${String(company.minDeposit).trim()}.`,
    });
  }

  if (company.maxAllocation && String(company.maxAllocation).trim()) {
    faqs.push({
      question: `How much funding does ${name} offer?`,
      answer: `${name} lists a maximum allocation of ${String(company.maxAllocation).trim()}.`,
    });
  }

  const promo = activePromo(company);
  if (promo) {
    const off = promo.discountType === "fixed" ? `${promo.discount} off` : `${promo.discount}% off`;
    faqs.push({
      question: `Is there a ${name} discount code?`,
      answer: `Yes: use code ${promo.code} for ${off}${promo.validTo ? `, valid until ${new Date(promo.validTo).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}.${promo.terms ? ` ${promo.terms}` : ""}`,
    });
  }

  return faqs;
}

// Meta description for a company page, built from the same facts as the FAQs
// (Bing flagged the old "<promo text> <name> on XK Trading Floor." as too
// short, and it read badly: "…with Vantir Vantir on XK Trading Floor").
// Facts first, then the current offer if there is room; kept to ~160 chars.
export function companySeoDescription(company) {
  if (!company?.name) return "";
  const name = company.name.trim();
  const kind = KIND[company.category] || "company";
  const facts = [];
  const regulation = list(company.regulation);
  if (regulation.length) facts.push(`regulated by ${join(regulation.slice(0, 3))}`);
  if (company.minDeposit && String(company.minDeposit).trim()) facts.push(`minimum deposit ${String(company.minDeposit).trim()}`);
  if (company.maxAllocation && String(company.maxAllocation).trim()) facts.push(`funding up to ${String(company.maxAllocation).trim()}`);
  const platforms = list(company.platforms);
  if (platforms.length) facts.push(join(platforms.slice(0, 3)));
  const where = company.country ? ` (${String(company.country).trim()})` : "";
  let text = facts.length
    ? `${name} ${kind} review${where}: ${facts.join(", ")}, trader reviews and TrustScore on XK Trading Floor.`
    : `Is ${name} legit? Read trader reviews of this ${kind}${where}, its TrustScore and current promo codes on XK Trading Floor.`;
  const extra = String(company.details || "").replace(/\s+/g, " ").trim().replace(/[.!\s]+$/, "");
  if (extra && text.length + extra.length + 2 <= 160) text += ` ${extra}.`;
  if (text.length <= 160) return text;
  const cut = text.slice(0, 157);
  return `${cut.slice(0, cut.lastIndexOf(" "))}…`;
}
