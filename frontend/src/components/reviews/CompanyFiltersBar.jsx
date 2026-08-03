import React from "react";
import { SlidersHorizontal } from "lucide-react";
import CustomSelect from "../shared/CustomSelect.jsx";

function CompanyFiltersBar({ filters, onChange }) {
  const categories = [
    { label: "All", value: "" },
    { label: "Broker", value: "Broker" },
    { label: "Prop Firm", value: "PropFirm" },
    { label: "Crypto", value: "Crypto" },
  ];

  const ratingRanges = [
    { label: "All Ratings", value: "all" },
    { label: "4.5+ Stars", value: 4.5 },
    { label: "4.0+ Stars", value: 4.0 },
    { label: "3.5+ Stars", value: 3.5 },
    { label: "3.0+ Stars", value: 3.0 },
  ];

  const sortOptions = [
    { label: "Trust Score", value: "trustScore" },
    { label: "Highest Rated", value: "rating" },
    { label: "Most Reviews", value: "reviews" },
    { label: "Name A-Z", value: "name" },
  ];

  const hasActiveFilters =
    filters.category || filters.minRating || filters.search || filters.sortBy;

  return (
    <div className="bg-gray-900/40 border border-gray-800/60 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex flex-wrap items-end gap-3 lg:gap-4">
        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-500 mb-1.5 block">Category</label>
          <CustomSelect
            value={filters.category || ""}
            onChange={(e) => onChange({ ...filters, category: e.target.value })}
            options={categories}
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-500 mb-1.5 block">Rating</label>
          <CustomSelect
            value={filters.minRating || "all"}
            onChange={(e) =>
              onChange({
                ...filters,
                minRating: e.target.value === "all" ? "" : parseFloat(e.target.value),
              })
            }
            options={ratingRanges}
          />
        </div>

        <div className="flex-1 min-w-[140px]">
          <label className="text-xs text-gray-500 mb-1.5 block">Sort By</label>
          <CustomSelect
            value={filters.sortBy || "trustScore"}
            onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
            options={sortOptions}
          />
        </div>

        <div className="flex-[2] min-w-[180px]">
          <label className="text-xs text-gray-500 mb-1.5 block">Search</label>
          <input
            type="text"
            placeholder="Search companies..."
            value={filters.search || ""}
            onChange={(e) => onChange({ ...filters, search: e.target.value })}
            className="input text-sm w-full"
          />
        </div>

        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => onChange({ sortBy: filters.sortBy || "trustScore" })}
              className="btn btn-secondary text-sm px-4 py-2.5"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium transition-colors"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filter
          </button>
        </div>
      </div>
    </div>
  );
}

export default CompanyFiltersBar;
