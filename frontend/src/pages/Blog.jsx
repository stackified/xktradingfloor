import React from "react";
import Seo from "../components/shared/Seo.jsx";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import BlogHero from "../components/blog/BlogHero.jsx";
import BlogInterestCategories from "../components/blog/BlogInterestCategories.jsx";
import BlogFeaturedSlider from "../components/blog/BlogFeaturedSlider.jsx";
import BlogCategories from "../components/blog/BlogCategories.jsx";
import BlogSidebar from "../components/blog/BlogSidebar.jsx";
import BlogCard from "../components/blog/BlogCard.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getPublishedBlogs } from "../controllers/blogsController.js";
import { fetchPublishedBlogs } from "../redux/slices/blogsSlice.js";
import { BLOG_CONTAINER, BLOG_SECTION_HEADING, BLOG_COLORS } from "../components/blog/blogLayout.js";

function transformBlog(blog) {
  const plainText = blog.content?.replace(/<[^>]*>/g, "") || "";
  const wordCount = plainText.split(/\s+/).filter(Boolean).length;

  return {
    id: blog._id || blog.id,
    title: blog.title,
    excerpt: blog.excerpt,
    category: Array.isArray(blog.categories)
      ? blog.categories[0]
      : blog.categories || blog.category || "",
    tags: blog.tags || [],
    author: blog.author?.fullName || blog.author || "Unknown",
    image: blog.coverImage || blog.featuredImage || blog.image,
    date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    readTime: `${Math.max(1, Math.ceil(wordCount / 200))} min read`,
  };
}

function Blog() {
  const [all, setAll] = React.useState([]);
  const [featuredPosts, setFeaturedPosts] = React.useState([]);
  const [query, setQuery] = React.useState("");
  const [category, setCategory] = React.useState("All");
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const perPage = 6;
  const trendingSectionRef = React.useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const {
    blogs: publishedBlogs,
    loading: blogsLoading,
    pagination,
  } = useSelector((state) => state.blogs);

  React.useEffect(() => {
    getPublishedBlogs({ featured: "true", size: 5 })
      .then((data) => setFeaturedPosts((data || []).map(transformBlog)))
      .catch(() => setFeaturedPosts([]));
  }, []);

  React.useEffect(() => {
    const primaryTag = selectedTags.length > 0 ? selectedTags[0] : "";

    dispatch(
      fetchPublishedBlogs({
        page,
        limit: perPage,
        category: category !== "All" ? category : "",
        tag: primaryTag,
        search: query,
      })
    );
  }, [dispatch, page, category, selectedTags, query]);

  React.useEffect(() => {
    if (publishedBlogs) {
      setAll(publishedBlogs.map(transformBlog));
    }
  }, [publishedBlogs]);

  const categories = React.useMemo(() => {
    const defaults = ["Trading", "Forex", "Stocks", "Crypto", "Companies", "Countries", "Events"];
    const currentCats = new Set(all.map((p) => p.category).filter(Boolean));
    return Array.from(new Set([...defaults, ...currentCats]));
  }, [all]);

  const tags = React.useMemo(() => {
    const counts = {};
    all.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map((x) => x[0]);
  }, [all]);

  const totalPages = pagination?.totalPages || 1;

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    setPage(1);
  };

  const handleTagToggle = (tag) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [tag]));
    setPage(1);
  };

  const handlePageChange = (nextPage) => {
    setPage(nextPage);
    requestAnimationFrame(() => {
      trendingSectionRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

  const sliderPosts =
    featuredPosts.length > 0 ? featuredPosts : all.length > 0 ? all.slice(0, 5) : [];

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLOG_COLORS.bg }}>
      <Seo
        title="Blog"
        description="Find the insights that matter to your trading journey. Stories, analysis, reviews, and industry updates."
        path="/blog"
      />

      <BlogHero searchValue={query} onSearchChange={(val) => { setQuery(val); setPage(1); }} />

      <BlogInterestCategories active={category} onSelect={handleCategoryChange} />

      <BlogFeaturedSlider posts={sliderPosts} />

      <div
        ref={trendingSectionRef}
        className={`${BLOG_CONTAINER} pt-16 pb-12 grid grid-cols-1 lg:grid-cols-3 gap-8 scroll-mt-24`}
      >
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className={`${BLOG_SECTION_HEADING} uppercase tracking-wide`}>
              Trending This Week
            </h2>
            {category !== "All" && (
              <button
                type="button"
                onClick={() => handleCategoryChange("All")}
                className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                Clear filter
              </button>
            )}
          </div>

          <BlogCategories
            categories={categories}
            active={category}
            onChange={handleCategoryChange}
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

          {blogsLoading ? (
            <CardLoader count={6} blog={true} />
          ) : all.length === 0 ? (
            <div className="card">
              <div className="card-body text-center py-12 text-gray-400">
                No articles found. Try a different search or category.
              </div>
            </div>
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
              type="button"
              className="btn btn-secondary rounded-full"
              disabled={page === 1}
              onClick={() => handlePageChange(Math.max(1, page - 1))}
            >
              Prev
            </button>
            <div className="text-sm text-gray-300">
              Page {page} of {totalPages}
            </div>
            <button
              type="button"
              className="btn btn-secondary rounded-full"
              disabled={page === totalPages}
              onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
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
