export function computeTrustScore(ratingsAggregate = 0, totalReviews = 0) {
  if (!totalReviews || totalReviews === 0) {
    return { score: 0, label: "No Reviews" };
  }

  const score = Math.round(ratingsAggregate * 20);

  let label = "Poor";
  if (score >= 90) label = "Excellent";
  else if (score >= 80) label = "Great";
  else if (score >= 70) label = "Good";
  else if (score >= 60) label = "Fair";

  return { score, label };
}
