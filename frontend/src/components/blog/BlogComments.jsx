import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { MessageSquare, Trash2, Loader2 } from "lucide-react";
import { getUserCookie } from "../../utils/cookies.js";
import { getBlogComments, addBlogComment, deleteBlogComment } from "../../controllers/blogsController.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

const MAX_LENGTH = 2000;
const PAGE_SIZE = 20;
const MODERATORS = ["admin", "operator"];

function timeAgo(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.round((then - Date.now()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const steps = [
    [60, "second"], [60, "minute"], [24, "hour"], [7, "day"], [4.345, "week"], [12, "month"], [Infinity, "year"],
  ];
  let amount = seconds;
  for (const [size, unit] of steps) {
    if (Math.abs(amount) < size) return unit === "second" ? "just now" : rtf.format(Math.round(amount), unit);
    amount /= size;
  }
  return "";
}

function Avatar({ author }) {
  const name = author?.fullName || "Member";
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1E293B] text-sm font-bold text-white">
      {author?.profileImage ? (
        <ImageWithFallback src={author.profileImage} fallback="/assets/users/default-avatar.jpg" alt="" className="h-full w-full object-cover" />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </div>
  );
}

// Reader comments under a blog post. Renders nothing if the backend does
// not have the comments API yet, so the page never shows a broken section.
function BlogComments({ blogId }) {
  const location = useLocation();
  const toast = useToast();
  const user = useSelector((state) => state.auth.user) || getUserCookie();
  const userId = user?._id || user?.id;
  const isModerator = MODERATORS.includes(String(user?.role || "").toLowerCase());

  const [state, setState] = React.useState({ status: "loading", comments: [], total: 0, page: 1, totalPages: 1 });
  const [draft, setDraft] = React.useState("");
  const [posting, setPosting] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [deleting, setDeleting] = React.useState(null);

  React.useEffect(() => {
    let cancelled = false;
    setState((s) => ({ ...s, status: "loading" }));
    getBlogComments(blogId, { page: 1, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        if (!res) return setState((s) => ({ ...s, status: "unavailable" }));
        setState({
          status: "ready",
          comments: res.comments,
          total: res.pagination.totalItems || res.comments.length,
          page: 1,
          totalPages: res.pagination.totalPages || 1,
        });
      })
      .catch(() => { if (!cancelled) setState((s) => ({ ...s, status: "error" })); });
    return () => { cancelled = true; };
  }, [blogId]);

  if (state.status === "unavailable") return null;

  const loginHref = `/login?redirect=${encodeURIComponent(`${location.pathname}#comments`)}`;
  const remaining = MAX_LENGTH - draft.length;
  const canPost = draft.trim().length >= 2 && remaining >= 0 && !posting;

  const submit = async (e) => {
    e.preventDefault();
    if (!canPost) return;
    setPosting(true);
    try {
      const comment = await addBlogComment(blogId, draft.trim());
      setState((s) => ({ ...s, comments: [comment, ...s.comments], total: s.total + 1 }));
      setDraft("");
    } catch (err) {
      const status = err?.response?.status;
      toast.error(
        status === 429
          ? "You're commenting too fast. Please wait a few minutes."
          : status === 401
            ? "Your session has expired. Please log in again."
            : err?.response?.data?.message || "Couldn't post your comment. Please try again."
      );
    } finally {
      setPosting(false);
    }
  };

  const remove = async (commentId) => {
    if (!window.confirm("Delete this comment?")) return;
    setDeleting(commentId);
    try {
      await deleteBlogComment(commentId);
      setState((s) => ({ ...s, comments: s.comments.filter((c) => c._id !== commentId), total: Math.max(0, s.total - 1) }));
    } catch (err) {
      toast.error(err?.response?.data?.message || "Couldn't delete the comment.");
    } finally {
      setDeleting(null);
    }
  };

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      const res = await getBlogComments(blogId, { page: state.page + 1, size: PAGE_SIZE });
      if (res) {
        setState((s) => {
          const seen = new Set(s.comments.map((c) => c._id));
          return {
            ...s,
            comments: [...s.comments, ...res.comments.filter((c) => !seen.has(c._id))],
            page: s.page + 1,
            totalPages: res.pagination.totalPages || s.totalPages,
          };
        });
      }
    } catch {
      toast.error("Couldn't load more comments.");
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <section id="comments" className="mt-12 scroll-mt-24" aria-labelledby="comments-heading">
      <h2 id="comments-heading" className="flex items-center gap-2.5 font-display text-xl font-bold text-white sm:text-2xl">
        <MessageSquare className="h-5 w-5 text-[#3B82F6]" />
        Comments
        {state.status === "ready" && state.total > 0 && (
          <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-sm font-semibold text-[#94A3B8]">{state.total}</span>
        )}
      </h2>

      {userId ? (
        <form onSubmit={submit} className="mt-5 rounded-2xl border border-white/[0.08] bg-[#0B1120] p-4 transition-colors focus-within:border-[#3B82F6]/50">
          <label htmlFor="comment-input" className="sr-only">Add a comment</label>
          <textarea
            id="comment-input"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) submit(e); }}
            rows={3}
            maxLength={MAX_LENGTH + 200}
            placeholder="Share your thoughts or ask a question..."
            className="w-full resize-y bg-transparent text-[15px] leading-relaxed text-white placeholder:text-[#64748B] focus:outline-none"
          />
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={`text-xs ${remaining < 0 ? "text-red-400" : remaining < 200 ? "text-amber-400" : "text-[#64748B]"}`}>
              {remaining < 200 ? `${remaining} characters left` : "Be respectful. Comments are public."}
            </span>
            <button
              type="submit"
              disabled={!canPost}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] px-4 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {posting && <Loader2 className="h-4 w-4 animate-spin" />}
              Post comment
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-white/[0.08] bg-[#0B1120] p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Join the discussion</div>
            <div className="mt-0.5 text-[13px] text-[#94A3B8]">Log in to comment on this article.</div>
          </div>
          <div className="flex gap-2">
            <Link to={loginHref} className="inline-flex h-9 items-center rounded-xl bg-gradient-to-br from-[#3B82F6] to-[#2563EB] px-4 text-sm font-semibold text-white hover:brightness-110">
              Log in
            </Link>
            <Link to="/signup" className="inline-flex h-9 items-center rounded-xl border border-white/[0.1] px-4 text-sm font-semibold text-white hover:border-[#3B82F6]/60">
              Sign up
            </Link>
          </div>
        </div>
      )}

      <div className="mt-6">
        {state.status === "loading" && (
          <div className="space-y-4">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="h-9 w-9 animate-pulse rounded-full bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-32 animate-pulse rounded bg-white/[0.06]" />
                  <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.06]" />
                </div>
              </div>
            ))}
          </div>
        )}

        {state.status === "error" && (
          <p className="text-sm text-[#94A3B8]">Comments couldn't be loaded right now.</p>
        )}

        {state.status === "ready" && state.comments.length === 0 && (
          <p className="text-sm text-[#94A3B8]">No comments yet. Be the first to share your thoughts.</p>
        )}

        {state.status === "ready" && state.comments.length > 0 && (
          <ul className="divide-y divide-white/[0.06]">
            {state.comments.map((c) => {
              const mine = userId && String(c.author?._id) === String(userId);
              const staff = ["admin", "operator"].includes(String(c.author?.role || "").toLowerCase());
              return (
                <li key={c._id} className="flex gap-3 py-5 first:pt-0">
                  <Avatar author={c.author} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-sm font-semibold text-white">{c.author?.fullName || "Member"}</span>
                      {staff && (
                        <span className="rounded-full bg-[#3B82F6]/15 px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[#93C5FD]">
                          XK Team
                        </span>
                      )}
                      <time dateTime={c.createdAt} title={new Date(c.createdAt).toLocaleString()} className="text-xs text-[#64748B]">
                        {timeAgo(c.createdAt)}
                      </time>
                      {(mine || isModerator) && (
                        <button
                          type="button"
                          onClick={() => remove(c._id)}
                          disabled={deleting === c._id}
                          className="ml-auto inline-flex h-7 w-7 items-center justify-center rounded-lg text-[#64748B] transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-40"
                          aria-label="Delete comment"
                          title="Delete comment"
                        >
                          {deleting === c._id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed text-[#CBD5E1]">{c.content}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {state.status === "ready" && state.page < state.totalPages && (
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-xl border border-white/[0.1] px-4 text-sm font-semibold text-[#94A3B8] transition-colors hover:border-[#3B82F6]/60 hover:text-white disabled:opacity-50"
          >
            {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
            Load more comments
          </button>
        )}
      </div>
    </section>
  );
}

export default BlogComments;
