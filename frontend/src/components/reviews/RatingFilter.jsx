import React from "react";

function RatingFilter({ value, onChange }) {
  const options = ["All", 5, 4, 3, 2, 1];
  return (
    <div className="flex items-center gap-2">
      {options.map((o) => (
        <button
          key={o}
          className={`btn rounded-full ${
            value === o ? "btn-primary" : "btn-secondary"
          }`}
          onClick={() => onChange(o)}
        >
          {o === "All" ? "All" : `${o}★`}
        </button>
      ))}
    </div>
  );
}

export default RatingFilter;
