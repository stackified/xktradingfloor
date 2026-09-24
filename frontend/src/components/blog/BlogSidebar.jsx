import React from "react";
import { Link } from "react-router-dom";
import { TrendingUp, Tag } from "lucide-react";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

const PANEL = "rounded-2xl border border-white/[0.08] bg-[#0B1120] p-5";

function BlogSidebar({
  latest = [],
  tags = [],
  selectedTags = [],
  onTagToggle,
}) {
  return (
    <aside className="space-y-6">
      {latest.length > 0 && (
        <div className={PANEL}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="font-semibold text-white">Latest Posts</h3>
          </div>
          <ul className="space-y-1">
            {latest.slice(0, 5).map((p) => (
              <li key={p.id}>
                <Link
                  to={`/blog/${p.slug || p.id}`}
                  className="group -mx-2 flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-[#05070D]">
                    <ImageWithFallback
                      src={p.image}
                      fallback="/assets/placeholder.jpg"
                      alt=""
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      useDynamicFallback={true}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[13.5px] font-medium leading-snug text-[#CBD5E1] transition-colors group-hover:text-white">
                      {p.title}
                    </div>
                    {p.date && <div className="mt-1 text-[11.5px] text-[#64748B]">{p.date}</div>}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      {tags.length > 0 && (
        <div className={PANEL}>
          <div className="mb-4 flex items-center gap-2">
            <Tag className="h-4 w-4 text-[#3B82F6]" />
            <h3 className="font-semibold text-white">Popular Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((t) => {
              const isSelected = selectedTags.includes(t);
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => onTagToggle && onTagToggle(t)}
                  aria-pressed={isSelected}
                  title={`#${t}`}
                  className={`max-w-full truncate rounded-full border px-3 py-1 text-xs transition-colors ${
                    isSelected
                      ? "border-[#3B82F6] bg-[#3B82F6]/15 text-[#93C5FD]"
                      : "border-white/[0.08] bg-white/[0.03] text-[#94A3B8] hover:border-[#3B82F6]/50 hover:text-white"
                  }`}
                >
                  #{t}
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <button
              type="button"
              onClick={() =>
                selectedTags.forEach((tag) => onTagToggle && onTagToggle(tag))
              }
              className="mt-4 text-xs font-semibold text-[#3B82F6] hover:text-[#60A5FA]"
            >
              Clear all tags
            </button>
          )}
        </div>
      )}
    </aside>
  );
}

export default BlogSidebar;
