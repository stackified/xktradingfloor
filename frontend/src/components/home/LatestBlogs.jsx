import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { getPublishedBlogs } from '../../controllers/blogsController.js';
import BlogCard from '../blog/BlogCard.jsx';

// Homepage "Latest articles" strip: up to 3 articles the admin marked as
// Featured, topped up with the newest posts.
//
// The homepage is prerendered with API calls left pending, so this renders
// nothing until data arrives on the client — the snapshot and first client
// render agree and hydration stays clean.

function toCard(blog) {
  const published = blog.publishedAt || blog.createdAt;
  return {
    id: blog._id || blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    image: blog.coverImage || blog.featuredImage || blog.image,
    category: Array.isArray(blog.categories) ? blog.categories[0] : blog.categories || blog.category || '',
    date: published
      ? new Date(published).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
      : '',
    readTime: blog.readingMinutes ? `${blog.readingMinutes} min read` : null,
  };
}

function LatestBlogs() {
  const [posts, setPosts] = React.useState([]);

  React.useEffect(() => {
    let cancelled = false;
    // The admin picks which articles show here with the blog's "Featured"
    // toggle. If fewer than 3 are featured, the newest posts fill the gaps.
    Promise.all([
      getPublishedBlogs({ page: 1, size: 3, featured: 'true' }).catch(() => []),
      getPublishedBlogs({ page: 1, size: 3 }).catch(() => []),
    ]).then(([featured, latest]) => {
      if (cancelled) return;
      const seen = new Set();
      const picked = [...(featured || []), ...(latest || [])].filter((b) => {
        const key = b._id || b.id;
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      setPosts(picked.slice(0, 3).map(toCard));
    });
    return () => { cancelled = true; };
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="relative overflow-hidden bg-black py-20" aria-labelledby="latest-blogs-heading">
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <h2
            id="latest-blogs-heading"
            className="font-display text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl lg:text-5xl"
          >
            Insights &{' '}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
              Market Analysis
            </span>
          </h2>
          <Link
            to="/blog"
            className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-[#3B82F6] transition-colors hover:text-[#60A5FA]"
          >
            View all articles
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <BlogCard key={post.id} post={post} href={`/blog/${post.slug || post.id}`} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default LatestBlogs;
