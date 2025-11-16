import React from 'react';

function BlogCategories({ categories, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {['All', ...categories].map((c) => (
        <button
          key={c}
          className={`btn rounded-full ${active === c ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => onChange(c)}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

export default BlogCategories;


