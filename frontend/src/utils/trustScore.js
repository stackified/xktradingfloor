// The TrustScore shown on cards, company pages and the homepage tables.
//
// Since backend B32 (PR #151) the server computes `trustScore` (0-100) from
// Sahil's factors: licence tier, reviews, his 1-5 scores and platforms; it is
// null when a company has no data at all. When a response carries it, that
// number is used as is. Older responses without the field fall back to the
// previous rule, average rating x 20.
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
  if (trustScore === null) {
    return { score: 0, label: "Not rated yet" };
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
