import React from 'react';
import { Search } from 'lucide-react';

function BlogSearch({ value, onChange }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        className="input pl-9"
        placeholder="Search by title or author"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export default BlogSearch;


