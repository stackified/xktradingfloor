import React from 'react';

function ProductFilter({ categories, activeCategory, onCategory, sort, onSort }) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between mb-4">
      <div className="flex flex-wrap gap-2">
        {['All', ...categories].map(c => (
          <button key={c} className={`btn rounded-full ${activeCategory===c?'btn-primary':'btn-secondary'}`} onClick={()=>onCategory(c)}>{c}</button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Sort by</span>
        <select className="input w-44" value={sort} onChange={(e)=>onSort(e.target.value)}>
          <option value="popular">Popularity</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest</option>
        </select>
      </div>
    </div>
  );
}

export default ProductFilter;


