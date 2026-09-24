import React from "react";
import { Link } from "react-router-dom";
import { Lock, Clock } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";
import { BLOG_IMAGE_BOX, BLOG_IMAGE } from "./blogLayout.js";

const CARD =
  "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0B1120] text-left " +
  "shadow-[0_4px_20px_rgba(0,0,0,0.25)] transition-all duration-300 ease-out " +
  "hover:-translate-y-1 hover:border-[#3B82F6]/45 hover:shadow-[0_12px_36px_rgba(59,130,246,0.12)] " +
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6]";

// `href` renders a real link (middle-click, open in new tab, crawlable).
// `onClick` alone keeps the old behaviour for callers that need it.
function BlogCard({ post, href, onClick, isLocked = false, onLockClick }) {
  const body = (
    <>
      <div className={BLOG_IMAGE_BOX}>
        <ImageWithFallback
          src={post.image}
          fallback="/assets/placeholder.jpg"
          alt={post.title}
          className={`${BLOG_IMAGE} transition-transform duration-500 ease-out ${
            isLocked ? "blur-sm" : "group-hover:scale-[1.04]"
          }`}
          useDynamicFallback={true}
        />
        {isLocked && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="text-center">
              <Lock className="mx-auto mb-2 h-8 w-8 text-yellow-400" />
              <p className="text-xs font-semibold text-white">Locked Content</p>
            </div>
          </div>
        )}
        {post.category && (
          <span className="absolute left-3 top-3 z-10 rounded-full border border-white/10 bg-[#05070D]/75 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#93C5FD] backdrop-blur-md">
            {post.category}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="line-clamp-2 text-[17px] font-semibold leading-snug text-white transition-colors duration-300 group-hover:text-[#93C5FD]">
          {post.title}
        </h3>
        {isLocked ? (
          <p className="mt-2 text-sm italic text-gray-400">Login to view full content</p>
        ) : (
          post.excerpt && (
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[#94A3B8]">{post.excerpt}</p>
          )
        )}
        <div className="mt-auto flex items-center gap-2 pt-4 text-xs text-[#64748B]">
          <span className="truncate">{post.date}</span>
          {post.readTime && (
            <>
              <span aria-hidden="true">·</span>
              <span className="inline-flex shrink-0 items-center gap-1">
                <Clock className="h-3 w-3" />
                {post.readTime}
              </span>
            </>
          )}
        </div>
      </div>
    </>
  );

  if (isLocked) {
    return (
      <button type="button" onClick={onLockClick} className={`${CARD} w-full opacity-80`}>
        {body}
      </button>
    );
  }
  if (href) {
    return (
      <Link to={href} className={CARD}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={`${CARD} w-full`}>
      {body}
    </button>
  );
}

export default BlogCard;
