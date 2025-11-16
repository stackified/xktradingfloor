import React from 'react';

function CompanyFilters({ filters, onChange }) {
  const categories = ['All', 'Broker', 'PropFirm', 'Crypto'];
  const ratingRanges = [
    { label: 'All Ratings', value: 'all' },
    { label: '4.5+ Stars', value: 4.5 },
    { label: '4.0+ Stars', value: 4.0 },
    { label: '3.5+ Stars', value: 3.5 },
    { label: '3.0+ Stars', value: 3.0 }
  ];

  return (
    <div className="card">
      <div className="card-body">
        <h3 className="font-semibold mb-4">Filters</h3>
        <div className="space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Category</label>
            <div className="space-y-2">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="category"
                    value={cat}
                    checked={filters.category === cat || (!filters.category && cat === 'All')}
                    onChange={(e) => onChange({ ...filters, category: cat === 'All' ? '' : cat })}
                    className="w-4 h-4 text-accent"
                  />
                  <span className="text-sm">{cat}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating Filter */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Minimum Rating</label>
            <select
              value={filters.minRating || 'all'}
              onChange={(e) => onChange({ ...filters, minRating: e.target.value === 'all' ? '' : parseFloat(e.target.value) })}
              className="input text-sm"
            >
              {ratingRanges.map(range => (
                <option key={range.value} value={range.value}>
                  {range.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="text-sm text-gray-400 mb-2 block">Search</label>
            <input
              type="text"
              placeholder="Search companies..."
              value={filters.search || ''}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="input text-sm"
            />
          </div>

          {/* Clear Filters */}
          {(filters.category || filters.minRating || filters.search) && (
            <button
              onClick={() => onChange({})}
              className="btn btn-secondary w-full text-sm"
            >
              Clear Filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CompanyFilters;

