// The TrustScore shown on cards, company pages and the homepage tables.
//
// Since backend B32 (PR #151) the server computes `trustScore` (0-100) from
// Sahil's factors: licence tier, reviews, his 1-5 scores and platforms. It is
// null until the XK team has checked the company (a licence for a broker, a
// 1-5 score for a prop firm). A number is used as is; null, or an older
// response without the field, falls back to the review score, average
// rating x 20.
function labelFor(score) {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Great";
  if (score >= 70) return "Good";
  if (score >= 60) return "Fair";
  return "Poor";
}

export function computeTrustScore(ratingsAggregate = 0, totalReviews = 0, trustScore) {
  if (typeof trustScore === "number" && Number.isFinite(trustScore)) {
    const score = Math.round(trustScore);
    return { score, label: labelFor(score) };
  }
  if (!totalReviews || totalReviews === 0) {
    return { score: 0, label: "No Reviews" };
  }

  const score = Math.round(ratingsAggregate * 20);
  return { score, label: labelFor(score) };
}

// The same for a company object from the API.
export const companyTrustScore = (company) =>
  computeTrustScore(company?.ratingsAggregate, company?.totalReviews, company?.trustScore);
