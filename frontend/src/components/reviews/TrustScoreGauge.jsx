import React from "react";
import { computeTrustScore } from "../../utils/trustScore.js";

function TrustScoreGauge({ ratingsAggregate = 0, totalReviews = 0, size = "md" }) {
  const { score, label } = computeTrustScore(ratingsAggregate, totalReviews);

  const dimensions = {
    sm: { outer: 64, stroke: 5, fontSize: "text-lg", labelSize: "text-[10px]" },
    md: { outer: 80, stroke: 6, fontSize: "text-2xl", labelSize: "text-xs" },
    lg: { outer: 96, stroke: 7, fontSize: "text-3xl", labelSize: "text-sm" },
  };

  const { outer, stroke, fontSize, labelSize } = dimensions[size] || dimensions.md;
  const radius = (outer - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const strokeColor =
    score >= 90
      ? "#22c55e"
      : score >= 80
        ? "#3b82f6"
        : score >= 70
          ? "#eab308"
          : score >= 60
            ? "#f97316"
            : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: outer, height: outer }}>
        <svg width={outer} height={outer} className="-rotate-90">
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke="#1f2937"
            strokeWidth={stroke}
          />
          <circle
            cx={outer / 2}
            cy={outer / 2}
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-700 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`${fontSize} font-bold text-white leading-none`}>
            {score || "—"}
          </span>
        </div>
      </div>
      <span className={`${labelSize} text-gray-400 mt-1 font-medium`}>Trust Score</span>
      {label && (
        <span
          className={`${labelSize} mt-0.5 font-semibold`}
          style={{ color: strokeColor }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

export default TrustScoreGauge;
