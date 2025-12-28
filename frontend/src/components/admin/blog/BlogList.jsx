import React from "react";
import {
  Edit,
  Loader2,
  ShieldCheck,
  Trash2,
  Flag,
  Eye,
  EyeOff,
  Search,
  Filter,
  ChevronDown,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";
import CustomSelect from "../../shared/CustomSelect.jsx";

const statusStyles = {
  draft: "bg-yellow-500/10 text-yellow-300 border-yellow-500/40",
  published: "bg-emerald-500/10 text-emerald-300 border-emerald-500/40",
  archived: "bg-slate-500/10 text-slate-300 border-slate-500/40",
};

const noop = () => { };

function BlogList({
  blogs = [],
  loading = false,
  searchQuery = "",
  onSearchChange = noop,
  statusFilter = "",
  onStatusFilterChange = noop,
  onEdit = noop,
  onDelete = noop,
  onFlag = noop,
  onUnflag = noop,
  onPublish = noop,
  onUnpublish = noop,
  canDelete = true,
  canFlag = false,
  canUnflag = false,
}) {
  const hasBlogs = Array.isArray(blogs) && blogs.length > 0;

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-5">
      <div className="card border-white/10 bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm relative z-30">
        <div className="card-body">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search by title, author, or tag"
                className="input pl-10"
                type="search"
              />
            </div>
            <div className="relative">
              <CustomSelect
                icon={Filter}
                value={statusFilter}
                onChange={(event) => onStatusFilterChange(event.target.value)}
                options={[
                  { value: "", label: "All statuses" },
                  { value: "draft", label: "Draft" },
                  { value: "published", label: "Published" },
                  { value: "archived", label: "Archived" }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-gray-900/70 backdrop-blur">
        {loading && (
          <div className="flex items-center justify-center gap-3 py-16 text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            Loading blogs...
          </div>
        )}

        {!loading && !hasBlogs && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-lg font-medium mb-2">No blogs found</div>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or create a new blog post.
            </p>
          </div>
        )}

        {!loading && hasBlogs && (
          <div className="divide-y divide-white/5">
            {blogs.map((blog) => {
              const flags = Array.isArray(blog.flags) ? blog.flags : [];
              return (
                <div
                  key={blog._id || blog.id}
                  className="group relative flex flex-col gap-4 p-5 lg:flex-row lg:items-center hover:bg-gray-800/30 transition-all duration-300"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500/50 transition-all duration-300 rounded-r"></div>
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 text-white mb-2">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {blog.title || "Untitled blog"}
                      </h3>
                      {blog.isFeatured && (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-lg shadow-amber-500/10 backdrop-blur-sm">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-gray-400">
                      {blog.author?.fullName ||
                        blog.author?.name ||
                        blog.author?.email ||
                        "Unknown author"}
                      {" • "}
                      Updated {formatDate(blog.updatedAt || blog.createdAt)}
                    </div>
                    {blog.excerpt && (
                      <p className="mt-2 text-sm text-gray-300">
                        {blog.excerpt}
                      </p>
                    )}
                    {Array.isArray(blog.tags) && blog.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {blog.tags.slice(0, 6).map((tag) => (
                          <span
                            key={`${blog._id}-${tag}`}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-purple-500/10 text-purple-300 border border-purple-500/30 font-medium"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:w-auto">
                    <div
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm ${blog.status === "published"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                        : blog.status === "draft"
                          ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/50 shadow-lg shadow-yellow-500/10"
                          : "bg-slate-500/20 text-slate-300 border border-slate-500/50 shadow-lg shadow-slate-500/10"
                        }`}
                    >
                      {blog.status === "published" ? (
                        <CheckCircle2 className="h-3 w-3" />
                      ) : blog.status === "draft" ? (
                        <Clock className="h-3 w-3" />
                      ) : (
                        <FileText className="h-3 w-3" />
                      )}
                      {blog.status || "unknown"}
                    </div>
                    {flags.length > 0 && (
                      <div className="text-xs text-gray-400">
                        Flags:{" "}
                        <span className="font-semibold text-red-300">
                          {flags.length}
                        </span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-2 lg:flex-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit(blog._id || blog.id)}
                        className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20"
                      >
                        <Edit className="h-4 w-4 transition-transform group-hover:scale-110" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      {blog.status === "draft" && (
                        <button
                          type="button"
                          onClick={() => onPublish(blog._id || blog.id)}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
                        >
                          <Eye className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="text-sm font-medium">Publish</span>
                        </button>
                      )}
                      {blog.status === "published" && (
                        <button
                          type="button"
                          onClick={() => onUnpublish(blog._id || blog.id)}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 text-yellow-300 hover:bg-yellow-500/20 hover:border-yellow-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/20"
                        >
                          <EyeOff className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="text-sm font-medium">Unpublish</span>
                        </button>
                      )}
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(blog._id || blog.id)}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                        >
                          <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="text-sm font-medium">Delete</span>
                        </button>
                      )}
                      {(canFlag || (canUnflag && (flags.length > 0 || blog.isFlagged))) && (
                        <>
                          {canFlag && !blog.isFlagged && (
                            <button
                              type="button"
                              onClick={() => onFlag(blog._id || blog.id)}
                              className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 hover:border-amber-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-amber-500/20"
                            >
                              <Flag className="h-4 w-4 transition-transform group-hover:scale-110" />
                              <span className="text-sm font-medium">Flag</span>
                            </button>
                          )}
                          {canUnflag && (flags.length > 0 || blog.isFlagged) && (
                            <button
                              type="button"
                              onClick={() => onUnflag(blog._id || blog.id)}
                              className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 hover:border-emerald-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-emerald-500/20"
                            >
                              <ShieldCheck className="h-4 w-4 transition-transform group-hover:scale-110" />
                              <span className="text-sm font-medium">Unflag</span>
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlogList;
