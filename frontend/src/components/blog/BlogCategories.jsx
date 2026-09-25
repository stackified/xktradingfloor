import React from 'react';

// Category filter chips. One horizontally scrolling row on phones instead of
// a wall of wrapped buttons; wraps normally from the sm breakpoint up.
function BlogCategories({ categories, active, onChange }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] sm:mx-0 sm:overflow-visible sm:px-0 [&::-webkit-scrollbar]:hidden">
      <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap" role="group" aria-label="Filter by category">
        {['All', ...categories].map((c) => {
          const isActive = active === c;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(c)}
              className={`h-9 shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] ${
                isActive
                  ? 'border-[#3B82F6] bg-[#3B82F6] text-white shadow-[0_4px_14px_rgba(59,130,246,0.3)]'
                  : 'border-white/[0.08] bg-[#0B1120] text-[#94A3B8] hover:border-[#3B82F6]/50 hover:text-white'
              }`}
            >
              {c}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default BlogCategories;
