import React from 'react';
import CustomSelect from "../shared/CustomSelect.jsx";

function ProductFilter({ categories, activeCategory, onCategory, sort, onSort }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map(c => (
          <button key={c} className={`btn rounded-full ${activeCategory === c ? 'btn-primary' : 'btn-secondary'}`} onClick={() => onCategory(c)}>{c}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Sort by</span>
        <CustomSelect
          className="w-44"
          value={sort}
          onChange={(e) => onSort(e.target.value)}
          options={[
            { value: "popular", label: "Popularity" },
            { value: "price-asc", label: "Price: Low to High" },
            { value: "price-desc", label: "Price: High to Low" },
            { value: "newest", label: "Newest" }
          ]}
        />
      </div>
    </div>
  );
}

export default ProductFilter;



