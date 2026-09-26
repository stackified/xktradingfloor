import React from 'react';
import Seo from '../components/shared/Seo.jsx';
import { articleJsonLd, breadcrumbJsonLd } from '../utils/structuredData.js';
import { prepareArticle, readingMinutes } from '../utils/richText.js';
import DesignedHtml from '../components/shared/DesignedHtml.jsx';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronRight, Clock, CalendarDays, ArrowLeft, ListOrdered } from 'lucide-react';
import { fetchBlogById, fetchBlogBySlug, fetchPublishedBlogs } from '../redux/slices/blogsSlice.js';
import { getAllBlogs, getBlogById } from '../controllers/blogsController.js';
import BlogAuthorInfo from '../components/blog/BlogAuthorInfo.jsx';
import BlogCard from '../components/blog/BlogCard.jsx';
import BlogShare from '../components/blog/BlogShare.jsx';
import BlogComments from '../components/blog/BlogComments.jsx';
import ImageWithFallback from '../components/shared/ImageWithFallback.jsx';
import { BLOG_IMAGE_BOX, BLOG_IMAGE, BLOG_COLORS } from '../components/blog/blogLayout.js';

// 24-hex-char Mongo ObjectId. Anything else is treated as a slug.
const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;

function formatDate(value) {
  const d = value ? new Date(value) : null;
  if (!d || Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function firstCategory(blog) {
  return Array.isArray(blog.categories) ? blog.categories[0] : blog.categories || blog.category || '';
}

function authorName(author) {
  if (!author) return 'XK Trading Floor';
  if (typeof author === 'string') return author;
  return author.fullName || author.name || 'XK Trading Floor';
}

// Thin bar at the top of the viewport that fills as the article is read.
// Written straight to the DOM so scrolling never re-renders the page.
function ReadingProgress({ targetRef }) {
  const barRef = React.useRef(null);
  React.useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const el = targetRef.current;
      const bar = barRef.current;
      if (!el || !bar) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const ratio = total <= 0 ? (rect.top < 0 ? 1 : 0) : Math.min(1, Math.max(0, -rect.top / total));
      bar.style.transform = `scaleX(${ratio})`;
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [targetRef]);
  return (
    <div className="fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true">
      <div
        ref={barRef}
        className="h-full origin-left bg-gradient-to-r from-[#60A5FA] to-[#2563EB]"
        style={{ transform: 'scaleX(0)' }}
      />
    </div>
  );
}

// "On this page" list; highlights the section currently being read.
// `scrollable` gives it its own scroll area (the sticky desktop sidebar):
// no native scrollbar track, a thin thumb on hover, soft fades at whichever
// edge has more items, and the active entry kept in view as the reader moves
// through the article.
function TableOfContents({ headings, onNavigate, scrollable = false }) {
  const [active, setActive] = React.useState(headings[0]?.id);
  const scrollRef = React.useRef(null);
  const [edges, setEdges] = React.useState({ top: false, bottom: false });

  const updateEdges = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const top = el.scrollTop > 2;
    const bottom = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    setEdges((prev) => (prev.top === top && prev.bottom === bottom ? prev : { top, bottom }));
  }, []);

  React.useEffect(() => {
    if (!scrollable) return undefined;
    updateEdges();
    window.addEventListener('resize', updateEdges);
    return () => window.removeEventListener('resize', updateEdges);
  }, [scrollable, updateEdges, headings]);

  // Keep the active entry visible inside the list without moving the page.
  React.useEffect(() => {
    const box = scrollRef.current;
    if (!scrollable || !box || !active) return;
    const link = box.querySelector(`a[href="#${CSS.escape(active)}"]`);
    if (!link) return;
    const linkTop = link.offsetTop;
    const linkBottom = linkTop + link.offsetHeight;
    const pad = 48;
    if (linkTop - pad < box.scrollTop) {
      box.scrollTo({ top: Math.max(0, linkTop - pad), behavior: 'smooth' });
    } else if (linkBottom + pad > box.scrollTop + box.clientHeight) {
      box.scrollTo({ top: linkBottom + pad - box.clientHeight, behavior: 'smooth' });
    }
  }, [active, scrollable]);
  React.useEffect(() => {
    const els = headings.map((h) => document.getElementById(h.id)).filter(Boolean);
    if (!els.length || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-96px 0px -65% 0px' }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const jump = (e, id) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    window.history.replaceState(window.history.state, '', `#${id}`);
    setActive(id);
    onNavigate?.();
  };

  const list = (
    <ul className="space-y-0.5 border-l border-white/[0.08]">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => jump(e, h.id)}
              className={`-ml-px block border-l-2 py-1.5 text-[13.5px] leading-snug transition-colors duration-200 ${
                h.level === 3 ? 'pl-6' : 'pl-4'
              } ${
                active === h.id
                  ? 'border-[#3B82F6] text-white'
                  : 'border-transparent text-[#94A3B8] hover:border-white/25 hover:text-white'
              }`}
            >
              {h.text}
            </a>
          </li>
        ))}
    </ul>
  );

  return (
    <nav aria-label="On this page">
      {scrollable ? (
        <div
          ref={scrollRef}
          onScroll={updateEdges}
          className={`toc-scroll relative max-h-[calc(100vh-10rem)] overflow-y-auto overscroll-contain pr-2 ${
            edges.top ? 'toc-fade-top' : ''
          } ${edges.bottom ? 'toc-fade-bottom' : ''}`}
        >
          {list}
        </div>
      ) : (
        list
      )}
    </nav>
  );
}

function PostSkeleton() {
  const bar = 'animate-pulse rounded-md bg-white/[0.06]';
  return (
    <div className="min-h-screen" style={{ backgroundColor: BLOG_COLORS.bg }}>
      <div className="mx-auto max-w-4xl px-4 pb-16 pt-10 sm:px-6 sm:pt-12">
        <div className={`${bar} h-4 w-40`} />
        <div className={`${bar} mt-6 h-10 w-full`} />
        <div className={`${bar} mt-3 h-10 w-2/3`} />
        <div className={`${bar} mt-6 h-5 w-full`} />
        <div className={`${bar} mt-8 h-16 w-full`} />
        <div className={`${bar} mt-8 aspect-[16/9] w-full rounded-2xl`} />
        <div className="mt-10 space-y-3">
          {[100, 96, 92, 98, 70].map((w) => (
            <div key={w} className={`${bar} h-4`} style={{ width: `${w}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

function BlogPost() {
  // Route param is `:slug`, but it can also be a legacy Mongo ObjectId. We
  // decide which lookup to run based on shape and redirect legacy URLs after.
  const { slug: routeParam } = useParams();
  const isLegacyId = OBJECT_ID_RE.test(routeParam || '');
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentBlog, blogs: publishedBlogs, loading } = useSelector((state) => state.blogs);
  const mockMode = useSelector((state) => state.mock.enabled);
  const [post, setPost] = React.useState(null);
  const [all, setAll] = React.useState([]);
  const articleRef = React.useRef(null);
  const mobileTocRef = React.useRef(null);

  React.useEffect(() => {
    const loadBlog = async () => {
      if (mockMode) {
        // Mock mode still keys by id — mock data isn't slug-aware.
        const mockBlog = await getBlogById(routeParam);
        if (mockBlog) setPost(mockBlog);
        const mockBlogs = await getAllBlogs();
        setAll(mockBlogs);
      } else {
        // Slug lookup is the primary path; ObjectId falls back to id lookup so
        // old links / notification emails don't 404.
        if (isLegacyId) {
          dispatch(fetchBlogById(routeParam));
        } else {
          dispatch(fetchBlogBySlug(routeParam));
        }
        dispatch(fetchPublishedBlogs({ limit: 1000 }));
      }
    };
    loadBlog();
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [dispatch, routeParam, isLegacyId, mockMode]);

  // Once a blog resolved via legacy ObjectId lookup, replace the URL with its
  // canonical slug — no reload, and search engines / share cards see the slug.
  React.useEffect(() => {
    if (!isLegacyId || !currentBlog?.slug) return;
    if (currentBlog.slug === routeParam) return;
    navigate(`/blog/${currentBlog.slug}`, { replace: true });
  }, [isLegacyId, currentBlog, routeParam, navigate]);

  // Transform currentBlog to post format (only when not using mock mode)
  React.useEffect(() => {
    if (!mockMode && currentBlog) {
      const minutes = readingMinutes(currentBlog.content);
      setPost({
        id: currentBlog._id || currentBlog.id,
        _id: currentBlog._id || currentBlog.id,
        slug: currentBlog.slug,
        title: currentBlog.title,
        excerpt: currentBlog.excerpt,
        content: currentBlog.content,
        category: firstCategory(currentBlog),
        tags: currentBlog.tags || [],
        author: authorName(currentBlog.author),
        authorInfo: currentBlog.author,
        image: currentBlog.featuredImage || currentBlog.coverImage,
        coverImage: currentBlog.coverImage || currentBlog.featuredImage,
        // SEO fields — needed by <Seo> for canonical/OG and by articleJsonLd.
        metaTitle: currentBlog.metaTitle,
        metaDescription: currentBlog.metaDescription,
        canonicalUrl: currentBlog.canonicalUrl,
        seoKeywords: currentBlog.seoKeywords || [],
        publishedAt: currentBlog.publishedAt,
        updatedAt: currentBlog.updatedAt,
        createdAt: currentBlog.createdAt,
        date: formatDate(currentBlog.publishedAt || currentBlog.createdAt),
        readTime: minutes ? `${minutes} min read` : null,
      });
    }
  }, [currentBlog, mockMode]);

  // Transform published blogs for related posts (only when not using mock mode)
  React.useEffect(() => {
    if (!mockMode && publishedBlogs && Array.isArray(publishedBlogs)) {
      setAll(
        publishedBlogs.map((blog) => ({
          id: blog._id || blog.id,
          slug: blog.slug,
          title: blog.title,
          excerpt: blog.excerpt,
          image: blog.coverImage || blog.featuredImage || blog.image,
          category: firstCategory(blog),
          tags: blog.tags || [],
          date: formatDate(blog.publishedAt || blog.createdAt),
          publishedAt: blog.publishedAt || blog.createdAt,
          readTime: blog.readingMinutes ? `${blog.readingMinutes} min read` : null,
        }))
      );
    }
  }, [publishedBlogs, mockMode]);

  const article = React.useMemo(() => prepareArticle(post?.content || ''), [post?.content]);

  // Same category or a shared tag first, then the newest other posts, so the
  // section is never empty.
  const related = React.useMemo(() => {
    if (!post) return [];
    const others = all.filter((p) => p.id !== post.id);
    const score = (p) =>
      (p.category && p.category === post.category ? 2 : 0) +
      (p.tags || []).filter((t) => post.tags?.includes(t)).length;
    return [...others]
      .sort((a, b) => score(b) - score(a) || new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
      .slice(0, 3);
  }, [all, post]);

  if (!mockMode && loading && !post) {
    return <PostSkeleton />;
  }

  if (!post) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center px-4" style={{ backgroundColor: BLOG_COLORS.bg }}>
        <div className="max-w-md text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#3B82F6]">404</p>
          <h1 className="mt-3 font-display text-3xl font-bold text-white">Article not found</h1>
          <p className="mt-3 text-[#94A3B8]">It may have been moved or unpublished.</p>
          <Link
            to="/blog"
            className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] px-5 text-sm font-semibold text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  const showToc = article.headings.filter((h) => h.level === 2).length >= 3;
  const cover = post.image || post.coverImage;

  return (
    <div className="min-h-screen" style={{ backgroundColor: BLOG_COLORS.bg }}>
      <Seo
        title={post?.metaTitle || post?.title || 'Blog Post'}
        description={post?.metaDescription || post?.excerpt || 'Read our latest trading insights and market analysis.'}
        path={post ? `/blog/${post.slug || post._id}` : '/blog'}
        canonical={post?.canonicalUrl || undefined}
        keywords={post?.seoKeywords?.length ? post.seoKeywords.join(', ') : undefined}
        image={post?.coverImage || post?.image}
        type="article"
        publishedTime={post?.publishedAt || post?.createdAt}
        modifiedTime={post?.updatedAt}
        author={post?.author}
        jsonLd={post ? [
          articleJsonLd(post),
          breadcrumbJsonLd([
            { name: 'Home', url: '/' },
            { name: 'Blog', url: '/blog' },
            { name: post.title, url: `/blog/${post.slug || post._id}` },
          ]),
        ].filter(Boolean) : null}
      />
      <ReadingProgress targetRef={articleRef} />

      <header className="relative">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] overflow-hidden"
          style={{ background: 'radial-gradient(ellipse 60% 100% at 50% 0%, rgba(59,130,246,0.14) 0%, transparent 70%)' }}
        />
        <div className="relative mx-auto max-w-[768px] px-4 pt-8 sm:px-6 sm:pt-12">
          <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-1.5 text-[13px] text-[#94A3B8]">
            <Link to="/blog" className="inline-flex items-center gap-1.5 transition-colors hover:text-white">
              <ArrowLeft className="h-3.5 w-3.5" />
              Blog
            </Link>
            {post.category && (
              <>
                <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#475569]" />
                <span className="truncate font-medium text-[#93C5FD]">{post.category}</span>
              </>
            )}
          </nav>

          <h1 className="mt-5 font-display text-[28px] font-bold leading-[1.15] tracking-[-0.02em] text-white sm:text-[38px] lg:text-[44px]">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="mt-4 text-[17px] leading-relaxed text-[#94A3B8] sm:text-[19px]">{post.excerpt}</p>
          )}

          <div className="mt-7 flex flex-col gap-4 border-y border-white/[0.07] py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1E293B] text-sm font-bold text-white">
                {post.authorInfo?.profileImage ? (
                  <ImageWithFallback
                    src={post.authorInfo.profileImage}
                    fallback="/assets/users/default-avatar.jpg"
                    alt={post.author}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  post.author.charAt(0).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-white">{post.author}</div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-[#94A3B8]">
                  {post.date && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <time dateTime={post.publishedAt || post.createdAt}>{post.date}</time>
                    </span>
                  )}
                  {post.readTime && (
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      {post.readTime}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <BlogShare title={post.title} />
          </div>
        </div>

        {cover && (
          <div className="relative mx-auto mt-8 max-w-[1008px] px-4 sm:px-6">
            <div className={`${BLOG_IMAGE_BOX} rounded-2xl border border-white/[0.08] shadow-[0_20px_60px_rgba(0,0,0,0.45)]`}>
              <ImageWithFallback
                src={cover}
                fallback="/assets/placeholder.jpg"
                alt={post.title}
                className={BLOG_IMAGE}
                useDynamicFallback={true}
                priority={true}
              />
            </div>
          </div>
        )}
      </header>

      {/* Three columns from xl up: the article is centred on the same 720px
          measure as the header, and the contents list sits in the right
          gutter so it never pushes the text off-centre. */}
      <div className="mx-auto max-w-[1400px] px-4 pb-16 pt-10 sm:px-6 sm:pt-14 xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,720px)_minmax(0,1fr)]">
        <div className="contents">
          <div className="mx-auto w-full max-w-[720px] xl:col-start-2">
            {showToc && (
              <details ref={mobileTocRef} className="group mb-8 rounded-xl border border-white/[0.08] bg-[#0B1120] xl:hidden">
                <summary className="flex cursor-pointer select-none list-none items-center justify-between gap-2 px-4 py-3 text-sm font-semibold text-white [&::-webkit-details-marker]:hidden">
                  <span className="inline-flex items-center gap-2">
                    <ListOrdered className="h-4 w-4 text-[#3B82F6]" />
                    On this page
                  </span>
                  <ChevronRight className="h-4 w-4 text-[#94A3B8] transition-transform duration-200 group-open:rotate-90" />
                </summary>
                <div className="px-4 pb-4">
                  <TableOfContents
                    headings={article.headings}
                    onNavigate={() => mobileTocRef.current?.removeAttribute('open')}
                  />
                </div>
              </details>
            )}

            {article.designed ? (
              // A designed post keeps its own styling, isolated from the
              // article typography (.article-content would leak into it).
              <article ref={articleRef}>
                <DesignedHtml rendered={article.designed} className="rounded-2xl overflow-hidden" />
              </article>
            ) : (
              <article
                ref={articleRef}
                className="article-content"
                dangerouslySetInnerHTML={{ __html: article.html }}
              />
            )}

            {post.tags?.length > 0 && (
              <div className="mt-10 flex flex-wrap gap-2">
                {post.tags.map((t) => (
                  <span
                    key={t}
                    className="max-w-full truncate rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-1 text-xs text-[#94A3B8]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            )}

            <div className="mt-10 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0B1120] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Found this useful?</div>
                <div className="mt-0.5 text-[13px] text-[#94A3B8]">Share it with a trader who should read it.</div>
              </div>
              <BlogShare title={post.title} />
            </div>

            <BlogAuthorInfo author={post.authorInfo} />

            {!mockMode && OBJECT_ID_RE.test(String(post._id || '')) && <BlogComments blogId={post._id} />}
          </div>

          {showToc && (
            <aside className="hidden xl:col-start-3 xl:block xl:pl-12">
              <div className="sticky top-24 max-w-[250px] pb-4">
                <div className="mb-3 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#94A3B8]">
                  <ListOrdered className="h-3.5 w-3.5" />
                  On this page
                </div>
                <TableOfContents headings={article.headings} scrollable />
              </div>
            </aside>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="border-t border-white/[0.06] bg-[#070A12]" aria-labelledby="related-heading">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="mb-6 flex items-end justify-between gap-4">
              <h2 id="related-heading" className="font-display text-2xl font-bold text-white sm:text-[28px]">
                Keep reading
              </h2>
              <Link to="/blog" className="shrink-0 text-sm font-semibold text-[#3B82F6] transition-colors hover:text-[#60A5FA]">
                All articles
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <BlogCard key={r.id} post={r} href={`/blog/${r.slug || r.id}`} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default BlogPost;
