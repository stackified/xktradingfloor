import React from 'react';
import BlogCard from './BlogCard.jsx';

function BlogList({ posts, onOpen }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {posts.map((p) => (
        <BlogCard key={p.id} post={p} onClick={() => onOpen(p)} />
      ))}
    </div>
  );
}

export default BlogList;


