import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import BlogHero from '../components/blog/BlogHero.jsx';
import BlogSearch from '../components/blog/BlogSearch.jsx';
import BlogCategories from '../components/blog/BlogCategories.jsx';
import BlogList from '../components/blog/BlogList.jsx';
import BlogSidebar from '../components/blog/BlogSidebar.jsx';
import { getAllBlogs } from '../controllers/blogsController.js';

function Blog() {
  const [all, setAll] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [category, setCategory] = React.useState('All');
  const [page, setPage] = React.useState(1);
  const perPage = 6;
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => setAll(await getAllBlogs()))();
  }, []);

  const categories = Array.from(new Set(all.map(p => p.category)));
  const tags = Array.from(new Set(all.flatMap(p => p.tags || [])));

  const filtered = all.filter(p => {
    const matchCategory = category === 'All' ? true : p.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery = q === '' ? true : (p.title.toLowerCase().includes(q) || p.author.toLowerCase().includes(q));
    return matchCategory && matchQuery;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const start = (page - 1) * perPage;
  const current = filtered.slice(start, start + perPage);

  React.useEffect(() => {
    setPage(1);
  }, [query, category]);

  return (
    <div>
      <Helmet>
        <title>Blog | XK Trading Floor</title>
        <meta name="description" content="Stay ahead of the markets with in-depth research, tutorials, and expert opinions." />
      </Helmet>
      <BlogHero />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <BlogSearch value={query} onChange={setQuery} />
          <BlogCategories categories={categories} active={category} onChange={setCategory} />
          <BlogList posts={current} onOpen={(p)=>navigate(`/blog/${p.id}`)} />
          <div className="flex items-center justify-center gap-2 pt-2">
            <button className="btn btn-secondary rounded-full" disabled={page===1} onClick={()=>setPage(p=>Math.max(1,p-1))}>Prev</button>
            <div className="text-sm text-gray-300">Page {page} of {totalPages}</div>
            <button className="btn btn-secondary rounded-full" disabled={page===totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}>Next</button>
          </div>
        </div>
        <div>
          <BlogSidebar latest={all.slice(0,5)} tags={tags} />
        </div>
      </div>
    </div>
  );
}

export default Blog;


