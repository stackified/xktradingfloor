import React from "react";
import { readingMinutes } from "../utils/richText.js";
import Seo from "../components/shared/Seo.jsx";
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
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useParams, useNavigate } from "react-router-dom";
import { BLOG_CATEGORIES, blogCategoryOf, categoryBySlug, categoryPath } from "../utils/blogCategories.js";
import NotFound from "./NotFound.jsx";
import DiscordLink from "../components/shared/DiscordLink.jsx";
import { BLOG_CONTAINER, BLOG_SECTION_HEADING, BLOG_COLORS } from "../components/blog/blogLayout.js";
import { authorDisplayName } from "../utils/authors.js";

const PAGE_BTN =
  "inline-flex h-10 min-w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-[#0B1120] px-3 " +
  "text-sm font-semibold text-[#94A3B8] transition-colors hover:border-[#3B82F6]/60 hover:text-white " +
  "disabled:pointer-events-none disabled:opacity-40";

function transformBlog(blog) {
  // The list endpoint does not send the article body, so a read time can
  // only be shown when content is present; otherwise the card omits it
  // rather than claiming "1 min read" for every post.
  const minutes = readingMinutes(blog.content) || blog.readingMinutes || null;

  return {
    id: blog._id || blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    category: blogCategoryOf(blog),
    tags: blog.tags || [],
    author: authorDisplayName(blog.author),
    image: blog.coverImage || blog.featuredImage || blog.image,
    date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    readTime: minutes ? `${minutes} min read` : null,
  };
}

function Blog() {
  const [all, setAll] = React.useState([]);
  const [featuredPosts, setFeaturedPosts] = React.useState([]);
  // "Latest Posts" for the sidebar. Kept separate from `all` so it always
  // reflects the newest 5 posts globally, not just the current page or the
  // currently-active category/tag/search filter.
  const [latestPosts, setLatestPosts] = React.useState([]);
  const [query, setQuery] = React.useState("");
  // The category comes from the URL (/blog/category/<slug>), so each one is
  // its own indexable page and the back button works.
  const { categorySlug } = useParams();
  const navigate = useNavigate();
  const activeCategory = categorySlug ? categoryBySlug(categorySlug) : null;
  const category = activeCategory ? activeCategory.name : "All";
  const [selectedTags, setSelectedTags] = React.useState([]);
  const [page, setPage] = React.useState(1);
  const perPage = 6;
  const trendingSectionRef = React.useRef(null);
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

  // Latest posts sidebar — fetched once, unfiltered, so it stays "the newest
  // posts on the site" regardless of the current page or filters.
  React.useEffect(() => {
    getPublishedBlogs({ size: 5, page: 1 })
      .then((data) => setLatestPosts((data || []).map(transformBlog)))
      .catch(() => setLatestPosts([]));
  }, []);

  // Debounce the search query so we don't dispatch a fetch on every keystroke.
  const [debouncedQuery, setDebouncedQuery] = React.useState(query);
  React.useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    const primaryTag = selectedTags.length > 0 ? selectedTags[0] : "";

    // A category view loads every post and filters here: the stored
    // categories are still the old ones until backend task B18 migrates them
    // (see utils/blogCategories.js). There are only a handful of posts.
    const byCategory = category !== "All";
    dispatch(
      fetchPublishedBlogs({
        page: byCategory ? 1 : page,
        limit: byCategory ? 100 : perPage,
        category: "",
        tag: primaryTag,
        search: debouncedQuery,
      })
    );
  }, [dispatch, page, category, selectedTags, debouncedQuery]);

  React.useEffect(() => {
    if (publishedBlogs) {
      setAll(publishedBlogs.map(transformBlog));
    }
  }, [publishedBlogs]);

  const categories = React.useMemo(() => BLOG_CATEGORIES.map((c) => c.name), []);

  // The backend list endpoint only accepts a single `tag` param, so we send
  // the first tag to narrow at the server and then filter the fetched results
  // for the remaining tags client-side. A post must contain ALL selected tags
  // (AND semantics), which is the standard "chip-filter" expectation.
  const filteredPosts = React.useMemo(() => {
    let posts = category !== "All" ? all.filter((p) => p.category === category) : all;
    if (selectedTags.length > 1) {
      const extraTags = selectedTags.slice(1);
      posts = posts.filter((p) => extraTags.every((t) => (p.tags || []).includes(t)));
    }
    return posts;
  }, [all, category, selectedTags]);

  const visiblePosts = React.useMemo(
    () => (category !== "All" ? filteredPosts.slice((page - 1) * perPage, page * perPage) : filteredPosts),
    [filteredPosts, category, page]
  );

  const tags = React.useMemo(() => {
    const counts = {};
    all.forEach((p) => (p.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map((x) => x[0]);
  }, [all]);

  const totalPages =
    category !== "All"
      ? Math.max(1, Math.ceil(filteredPosts.length / perPage))
      : pagination?.totalPages || 1;

  const handleCategoryChange = (cat) => {
    setPage(1);
    navigate(cat === "All" ? "/blog" : categoryPath(cat));
  };

  // Back to page 1 whenever the category in the URL changes.
  React.useEffect(() => {
    setPage(1);
  }, [categorySlug]);

  // Real multi-select toggle. The old code replaced the array with [tag],
  // making it a single-select disguised as multi-select. Now clicking a tag
  // adds it, clicking it again removes it, and multiple tags can be active.
  const handleTagToggle = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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

  if (categorySlug && !activeCategory) return <NotFound />;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLOG_COLORS.bg }}>
      {activeCategory ? (
        <Seo
          title={`${activeCategory.name} articles`}
          description={`Read ${activeCategory.name} articles on XK Trading Floor: ${activeCategory.description}. Written for forex, prop firm and crypto traders.`}
          path={`/blog/category/${activeCategory.slug}`}
        />
      ) : (
        <Seo
          title="Blog"
          description="Trading insights from XK Trading Floor: market analysis, broker and prop firm news, trader interviews, promotions and guides to help you trade with confidence."
          path="/blog"
        />
      )}

      <BlogHero searchValue={query} onSearchChange={(val) => { setQuery(val); setPage(1); }} />

      {/* Learning happens in the Discord community; the Learn Trading
          category is where the site points people to it (client, 2 Oct 2026). */}
      {activeCategory?.slug === "learn-trading" && (
        <section className={`${BLOG_CONTAINER} pt-10`} aria-labelledby="learn-community-heading">
          <div className="flex flex-col gap-5 rounded-[18px] border border-[#3B82F6]/30 bg-[#0B1120] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div>
              <h2 id="learn-community-heading" className="font-display text-2xl font-bold text-white sm:text-3xl">
                Learn Trading.{" "}
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
                  Grow With The Community.
                </span>
              </h2>
              <p className="mt-2 max-w-2xl text-[15px] text-[#94A3B8]">
                Join our Discord community to learn, discuss markets, share ideas and connect with other traders.
              </p>
            </div>
            <DiscordLink className="btn inline-flex shrink-0 items-center justify-center gap-2 rounded-full border-2 border-white bg-white px-6 py-3 font-medium text-gray-900 transition-all hover:scale-105 hover:bg-gray-100">
              Join Our Discord
            </DiscordLink>
          </div>
        </section>
      )}

      <BlogInterestCategories active={category} />

      <BlogFeaturedSlider posts={sliderPosts} />

      <div
        ref={trendingSectionRef}
        className={`${BLOG_CONTAINER} pt-16 pb-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-10 scroll-mt-24`}
      >
        <div className="min-w-0 space-y-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className={`${BLOG_SECTION_HEADING} min-w-0 truncate`}>
              {debouncedQuery
                ? `Results for "${debouncedQuery}"`
                : category !== "All"
                  ? `${category} articles`
                  : "Latest articles"}
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
                  className="inline-flex max-w-full items-center gap-1 rounded-full border border-[#3B82F6]/60 bg-[#3B82F6]/15 py-1 pl-3 pr-1.5 text-xs text-[#93C5FD]"
                >
                  <span className="truncate">#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full hover:bg-white/10 hover:text-white"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={() => setSelectedTags([])}
                className="text-xs text-blue-400 hover:text-blue-300 underline"
              >
                Clear all
              </button>
            </div>
          )}

          {blogsLoading ? (
            <CardLoader count={6} blog={true} />
          ) : visiblePosts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0B1120] px-6 py-14 text-center">
              <div className="font-semibold text-white">No articles found</div>
              <p className="mt-1 text-sm text-[#94A3B8]">Try a different search, category or tag.</p>
              {(query || category !== "All" || selectedTags.length > 0) && (
                <button
                  type="button"
                  onClick={() => { setQuery(""); setSelectedTags([]); handleCategoryChange("All"); }}
                  className="mt-5 text-sm font-semibold text-[#3B82F6] hover:text-[#60A5FA]"
                >
                  Clear all filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {visiblePosts.map((p) => (
                <BlogCard key={p.id} post={p} href={`/blog/${p.slug || p.id}`} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1.5 pt-4" aria-label="Pagination">
              <button
                type="button"
                className={PAGE_BTN}
                disabled={page === 1}
                onClick={() => handlePageChange(Math.max(1, page - 1))}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handlePageChange(n)}
                  aria-current={n === page ? "page" : undefined}
                  className={`${PAGE_BTN} ${n === page ? "!border-[#2563EB] !bg-[#2563EB] !text-white" : ""}`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                className={PAGE_BTN}
                disabled={page === totalPages}
                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
          )}
        </div>

        <div>
          <BlogSidebar
            latest={latestPosts.length > 0 ? latestPosts : all.slice(0, 5)}
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
