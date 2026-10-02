import React from "react";
import { Link } from "react-router-dom";
import { MessageCircle, LineChart, Lightbulb, Users, ArrowRight } from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import DiscordLink from "../components/shared/DiscordLink.jsx";
import BlogCard from "../components/blog/BlogCard.jsx";
import CardLoader from "../components/shared/CardLoader.jsx";
import { getPublishedBlogs } from "../controllers/blogsController.js";
import { blogCategoryOf } from "../utils/blogCategories.js";
import { readingMinutes } from "../utils/richText.js";
import { breadcrumbJsonLd } from "../utils/structuredData.js";

// /learn. XK has no academy yet, so this is the community landing page the
// client asked for (2 Oct 2026): the Discord invite first, then the blog's
// learning articles. When an academy exists, it replaces the article list.

const PERKS = [
  {
    icon: Lightbulb,
    title: "Learn",
    body: "Ask questions and pick up how other traders approach risk, rules and strategy.",
  },
  {
    icon: LineChart,
    title: "Discuss markets",
    body: "Talk through forex, gold, crypto and indices with traders who follow them every day.",
  },
  {
    icon: MessageCircle,
    title: "Share ideas",
    body: "Post your setups and trade ideas, and get honest feedback.",
  },
  {
    icon: Users,
    title: "Connect",
    body: "Meet traders from around the world, from first funded account to full-time.",
  },
];

// Articles shown on this page: the "Learn Trading" and "Tools & Guides"
// categories of the blog.
const LEARNING_CATEGORIES = new Set(["Learn Trading", "Tools & Guides"]);

function toCard(blog) {
  const minutes = readingMinutes(blog.content) || blog.readingMinutes || null;
  return {
    id: blog._id || blog.id,
    slug: blog.slug,
    title: blog.title,
    excerpt: blog.excerpt,
    category: blogCategoryOf(blog),
    image: blog.coverImage || blog.featuredImage || blog.image,
    date: new Date(blog.publishedAt || blog.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }),
    readTime: minutes ? `${minutes} min read` : null,
  };
}

function Learn() {
  const [posts, setPosts] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    getPublishedBlogs({ size: 100, page: 1 })
      .then((data) => {
        if (cancelled) return;
        setPosts(
          (data || [])
            .map(toCard)
            .filter((p) => LEARNING_CATEGORIES.has(p.category))
            .slice(0, 6)
        );
      })
      .catch(() => !cancelled && setPosts([]));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="bg-black">
      <Seo
        title="Learn Trading"
        description="Learn trading with the XK Trading Floor community. Join our Discord to learn, discuss markets, share ideas and connect with other traders, plus free trading guides."
        path="/learn"
        jsonLd={breadcrumbJsonLd([
          { name: "Home", url: "/" },
          { name: "Learn", url: "/learn" },
        ])}
      />

      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-12 text-center">
        <h1 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl tracking-tight leading-tight mb-5">
          Learn Trading.{" "}
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
            Grow With The Community.
          </span>
        </h1>
        <p className="text-base sm:text-lg text-gray-300 max-w-2xl mx-auto mb-8">
          Join our Discord community to learn, discuss markets, share ideas and
          connect with other traders.
        </p>
        <DiscordLink className="btn inline-flex items-center justify-center gap-2 rounded-full bg-white text-gray-900 hover:bg-gray-100 border-2 border-white hover:scale-105 transition-all shadow-lg px-7 py-3 font-medium">
          <MessageCircle className="h-4 w-4" aria-hidden="true" />
          Join Our Discord
        </DiscordLink>
        <p className="mt-3 text-xs text-gray-400">Free to join. Opens Discord in a new tab.</p>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16" aria-labelledby="learn-perks">
        <h2 id="learn-perks" className="sr-only">
          What you get in the community
        </h2>
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0 m-0">
          {PERKS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="rounded-2xl border border-white/[0.08] bg-[#0B1120] p-5">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
              </div>
              <h3 className="font-semibold text-white mb-1">{title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20" aria-labelledby="learn-articles">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 id="learn-articles" className="font-display font-bold text-2xl sm:text-3xl">
              Start with these guides
            </h2>
            <p className="mt-1 text-sm text-gray-400">
              From our blog: trading basics, prop firm rules and practical guides.
            </p>
          </div>
          <Link
            to="/blog/category/learn-trading"
            className="hidden sm:inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            All Learn Trading articles
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {posts === null ? (
          <CardLoader count={3} blog={true} />
        ) : posts.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/[0.1] bg-[#0B1120] px-6 py-12 text-center">
            <p className="text-white font-semibold">New guides are on the way</p>
            <p className="mt-1 text-sm text-gray-400">
              Meanwhile, ask the community on Discord or browse the{" "}
              <Link to="/blog" className="text-blue-400 hover:text-blue-300">
                blog
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((p) => (
              <BlogCard key={p.id} post={p} href={`/blog/${p.slug || p.id}`} />
            ))}
          </div>
        )}

        <Link
          to="/blog/category/learn-trading"
          className="mt-6 sm:hidden inline-flex items-center gap-1.5 text-sm font-medium text-blue-400 hover:text-blue-300"
        >
          All Learn Trading articles
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}

export default Learn;
