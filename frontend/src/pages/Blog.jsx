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
import { getAllBlogs } from "../controllers/blogsController.js";
import { getUserCookie } from "../utils/cookies.js";
import { updateMockMode } from "../redux/slices/mockSlice.js";

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

  React.useEffect(() => {
    (async () => setAll(await getAllBlogs()))();
  }, [mockMode]); // Reload when mock mode changes

  const categories = Array.from(new Set(all.map((p) => p.category)));
  const tags = Array.from(new Set(all.flatMap((p) => p.tags || [])));

  // Get featured blog (advertisement) - first blog marked as featured or first blog
  const featuredBlog = all.find((p) => p.isFeatured) || all[0];

  const filtered = all.filter((p) => {
    const matchCategory = category === "All" ? true : p.category === category;
    const q = query.trim().toLowerCase();
    const matchQuery =
      q === ""
        ? true
        : p.title.toLowerCase().includes(q) ||
          p.author.toLowerCase().includes(q);
    const matchTags =
      selectedTags.length === 0
        ? true
        : selectedTags.some((tag) => (p.tags || []).includes(tag));
    return matchCategory && matchQuery && matchTags;
  });

  // Exclude featured blog from regular list
  const filteredWithoutFeatured = filtered.filter(
    (p) => p.id !== featuredBlog?.id
  );

  const totalPages = Math.max(
    1,
    Math.ceil(filteredWithoutFeatured.length / perPage)
  );
  const start = (page - 1) * perPage;
  const current = filteredWithoutFeatured.slice(start, start + perPage);

  React.useEffect(() => {
    setPage(1);
  }, [query, category, selectedTags]);

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  return (
    <div>
      <Helmet>
        <title>Blog | XK Trading Floor</title>
        <meta
          name="description"
          content="Stay ahead of the markets with in-depth research, tutorials, and expert opinions."
        />
      </Helmet>
      <BlogHero />

      {isAdmin && (
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
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 ${
                  mockMode ? "bg-blue-600" : "bg-gray-600"
                }`}
                role="switch"
                aria-checked={mockMode}
                aria-label="Toggle mock data mode"
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    mockMode ? "translate-x-6" : "translate-x-1"
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
          {featuredBlog && (
            <div className="card border-2 border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-transparent">
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
          <BlogList posts={current} onOpen={(p) => navigate(`/blog/${p.id}`)} />
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
