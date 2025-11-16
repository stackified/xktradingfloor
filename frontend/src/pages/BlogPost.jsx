import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { getAllBlogs, getBlogById } from '../controllers/blogsController.js';
import BlogAuthorInfo from '../components/blog/BlogAuthorInfo.jsx';
import ImageWithFallback from '../components/shared/ImageWithFallback.jsx';

function BlogPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = React.useState(null);
  const [all, setAll] = React.useState([]);

  React.useEffect(() => {
    (async () => {
      setPost(await getBlogById(id));
      setAll(await getAllBlogs());
      window.scrollTo({ top: 0, behavior: 'smooth' });
    })();
  }, [id]);

  if (!post) return <div className="max-w-3xl mx-auto px-4 py-10">Post not found.</div>;

  const related = all.filter(p => p.id !== post.id && (p.category === post.category || p.tags?.some(t => post.tags?.includes(t)))).slice(0,3);

  return (
    <div>
      <Helmet>
        <title>{post ? `${post.title} | XK Trading Floor` : 'Blog Post | XK Trading Floor'}</title>
        <meta name="description" content={post?.excerpt || 'Read our latest trading insights and market analysis.'} />
      </Helmet>
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} className="bg-gray-900/50 border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="h-64 w-full rounded-xl overflow-hidden bg-muted mb-6">
            {post.image && <ImageWithFallback src={post.image} fallback="/assets/placeholder.jpg" alt={post.title} className="h-full w-full object-cover" />}
          </div>
          <h1 className="text-3xl font-semibold">{post.title}</h1>
          <div className="text-sm text-gray-400 mt-1">{post.author} • {post.date} • {post.readTime}</div>
        </div>
      </motion.section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <article className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: post.content }} />
        <BlogAuthorInfo author={post.authorInfo} />

        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-4">Related Posts</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {related.map(r => (
              <div key={r.id} className="card cursor-pointer" onClick={() => navigate(`/blog/${r.id}`)}>
                <div className="card-body">
                  <div className="text-xs text-blue-300">{r.category}</div>
                  <div className="font-semibold mt-1 line-clamp-2">{r.title}</div>
                </div>
              </div>
            ))}
            {related.length === 0 && <div className="text-sm text-gray-400">No related posts found.</div>}
          </div>
        </div>

        <div className="mt-10">
          <h3 className="text-xl font-semibold mb-2">Comments</h3>
          <div className="text-sm text-gray-400">Comments will be available after backend integration.</div>
        </div>

        <div className="mt-8"><Link to="/blog" className="text-accent hover:underline">← Back to Blog</Link></div>
      </section>
    </div>
  );
}

export default BlogPost;


