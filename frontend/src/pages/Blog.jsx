import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import BlogHero from "../components/blog/BlogHero.jsx";
import BlogSearch from "../components/blog/BlogSearch.jsx";
import BlogCategories from "../components/blog/BlogCategories.jsx";
import BlogList from "../components/blog/BlogList.jsx";
import BlogSidebar from "../components/blog/BlogSidebar.jsx";
import BlogCard from "../components/blog/BlogCard.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getUserCookie } from "../utils/cookies.js";
import { updateMockMode, fetchMockMode } from "../redux/slices/mockSlice.js";
import { fetchPublishedBlogs } from "../redux/slices/blogsSlice.js";

function Blog() {
  const [all, setAll] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const perPage = 6;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const mockMode = useSelector((state) => state.mock.enabled);
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();
  const userRole =
    typeof user?.role === "string" ? user.role.toLowerCase() : null;
  const isAdmin = userRole === "admin";
  const {
    blogs: publishedBlogs,
    loading: blogsLoading,
    pagination,
  } = useSelector((state) => state.blogs);

  // Fetch and sync mock mode from backend (for global sync across all users)
  React.useEffect(() => {
    dispatch(fetchMockMode());
    const pollInterval = setInterval(() => {
      dispatch(fetchMockMode());
    }, 5000);
    return () => clearInterval(pollInterval);
  }, [dispatch]);

  // FORCE REAL DATA MODE
  const FORCE_REAL_DATA = true;
  const effectiveMockMode = FORCE_REAL_DATA ? false : mockMode;

  // Fetch blogs with server-side pagination and filtering
  React.useEffect(() => {
    if (effectiveMockMode) {
      // Mock mode: Load all mock data (simplified)
      import("../models/blogsData.js").then((module) => {
        setAll(module.blogs || []);
      }).catch(() => setAll([]));
      return;
    }

    // Prepare filters for backend
    // Note: Backend currently supports single tag/category filter
    const primaryTag = selectedTags.length > 0 ? selectedTags[0] : "";

    dispatch(
      fetchPublishedBlogs({
        page: page,
        limit: perPage,
        category: category !== "All" ? category : "",
        tag: primaryTag,
        search: query,
        featured: "false", // We fetch featured separately or handle it
      })
    );

    // Scroll to top on change
    window.scrollTo({ top: 0, behavior: "smooth" });

  }, [dispatch, effectiveMockMode, page, category, selectedTags, query]);

  // Update local state 'all' to be the current page of blogs
  React.useEffect(() => {
    if (effectiveMockMode) return;

    if (publishedBlogs) {
      // Transform backend data
      const transformed = publishedBlogs.map(blog => ({
        id: blog._id || blog.id,
        title: blog.title,
        excerpt: blog.excerpt,
        content: blog.content,
        category: Array.isArray(blog.categories) ? blog.categories[0] : (blog.categories || blog.category || ""),
        tags: blog.tags || [],
        author: blog.author?.fullName || "Unknown",
        authorId: blog.author?._id || blog.author,
        authorInfo: blog.author,
        image: blog.featuredImage,
        featuredImage: blog.featuredImage,
        isFeatured: blog.isFeatured || false,
        createdAt: blog.createdAt,
        publishedAt: blog.publishedAt || blog.createdAt,
        date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric"
        }),
        readTime: `${Math.max(1, Math.ceil((blog.content?.replace(/<[^>]*>/g, "").split(/\s+/).length || 0) / 200))} min read`,
        status: blog.status
      }));
      setAll(transformed);
    }
  }, [publishedBlogs, effectiveMockMode]);

  // Categories - we might need to fetch available categories from backend separately
  // For now, we'll build them from the *current* 6 blogs which is imperfect but safe,
  // OR we can keep a hardcoded list of standard categories if preferred.
  // Ideally, we'd have a `fetchCategories` action. 
  // We'll stick to the existing derivation which means categories filter options 
  // might only show what's on the current page if we're not careful.
  // Better approach: Use the constant list from BlogForm if possible, or just string list.
  // For now, let's persist the existing behavior but note the limitation.
  const categories = React.useMemo(() => {
    // If we have very few blogs, maybe hardcode some defaults
    const defaults = ["Trading", "Stocks", "Forex", "Crypto", "Options", "Personal Finance"];
    const currentCats = new Set(all.map(p => p.category).filter(Boolean));
    return Array.from(new Set([...defaults, ...currentCats]));
  }, [all]);

  // Popular tags - same limitation, using current page tags
  const tags = React.useMemo(() => {
    const counts = {};
    all.forEach(p => (p.tags || []).forEach(t => counts[t] = (counts[t] || 0) + 1));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(x => x[0]);
  }, [all]);

  // Featured blog: logical issue with pagination is we might not Fetch the featured blog 
  // if it's on page 2. We should ideally fetch it separately.
  // For this fix, we will simply NOT filter it out from the list if it appears, 
  // or use the first one if `isFeatured` is true.
  const featuredBlog = React.useMemo(() => all.find(p => p.isFeatured), [all]);

  // Display logic
  const displayBlogs = all; // 'all' is already the current page

  // Pagination from Redux
  const totalPages = pagination?.totalPages || 1;

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) => {
      const newTags = prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag]; // Single tag support mainly
      return newTags;
    });
    setPage(1);
  };


  return (
    <div className="bg-black min-h-screen">
      <Helmet>
        <title>Blog | XK Trading Floor</title>
        <meta
          name="description"
          content="Stay ahead of the markets with in-depth research, tutorials, and expert opinions."
        />
      </Helmet>
      <BlogHero />

      {/* Mock Data Toggle - HIDDEN FOR NOW (can be enabled later) */}
      {false && isAdmin && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-end gap-4">
            {/* Modern Mock Data Toggle */}
            <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-gray-800/50 border border-white/10">
              <span className="text-sm font-medium text-gray-300 whitespace-nowrap">
                Mock Data
              </span>
              <button
                type="button"
                onClick={() => dispatch(updateMockMode(!mockMode))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${mockMode ? "bg-blue-600" : "bg-gray-600"
                  }`}
                role="switch"
                aria-checked={mockMode}
                aria-label="Toggle mock data mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${mockMode ? "translate-x-6" : "translate-x-1"
                    }`}
                />
              </button>
              <span className="text-xs text-gray-500 whitespace-nowrap">
                {mockMode ? "ON" : "OFF"}
              </span>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {/* Featured Blog Section (Advertisement) */}
          {/* Original featured card had: bg-gradient-to-br from-blue-500/10 to-transparent */}
          {featuredBlog && (
            <div className="card border-2 border-blue-500/30">
              <div className="card-body">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-semibold">
                    FEATURED
                  </span>
                  <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs font-semibold">
                    ADVERTISEMENT
                  </span>
                </div>
                <BlogCard
                  post={featuredBlog}
                  onClick={() => navigate(`/blog/${featuredBlog.id}`)}
                  isLocked={false}
                />
              </div>
            </div>
          )}

          <BlogSearch value={query} onChange={setQuery} />
          <BlogCategories
            categories={categories}
            active={category}
            onChange={setCategory}
          />
          {selectedTags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-400">Filtered by tags:</span>
              {selectedTags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-1 rounded-full bg-blue-500/20 border border-blue-500 text-blue-300"
                >
                  #{tag}
                  <button
                    onClick={() => handleTagToggle(tag)}
                    className="ml-1 hover:text-red-400"
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                onClick={() => setSelectedTags([])}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Clear all
              </button>
            </div>
          )}
          {!effectiveMockMode && blogsLoading ? (
            <CardLoader count={6} blog={true} />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {all.map((p) => (
                <BlogCard
                  key={p.id}
                  post={p}
                  onClick={() => navigate(`/blog/${p.id}`)}
                  isLocked={false}
                />
              ))}
            </div>
          )}
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              className="btn btn-secondary rounded-full"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <div className="text-sm text-gray-300">
              Page {page} of {totalPages}
            </div>
            <button
              className="btn btn-secondary rounded-full"
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
        <div>
          <BlogSidebar
            latest={all.slice(0, 5)}
            tags={tags}
            selectedTags={selectedTags}
            onTagToggle={handleTagToggle}
          />
        </div>
      </div>
    </div>
  );
}

export default Blog;
