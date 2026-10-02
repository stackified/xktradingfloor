import React from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowLeft, Download, Loader2, Search } from "lucide-react";
import {
  EVENT_LEADS_LIVE,
  getAllEvents,
  getEventRegistrations,
  downloadEventRegistrationsCsv,
} from "../../controllers/eventsController.js";
import { useToast } from "../../contexts/ToastContext.jsx";

// Event registration leads (client, 2 Oct 2026). Admin only: the client asked
// that Operators can't see or export them. Lists who registered for which
// event and downloads them as CSV. The data comes from backend task B16; the
// screen says so until VITE_EVENT_LEADS is switched on.

const PAGE_SIZE = 25;

const fmt = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
    : "";

function AdminEventRegistrations() {
  const toast = useToast();
  const [events, setEvents] = React.useState([]);
  const [eventId, setEventId] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [pagination, setPagination] = React.useState({ totalItems: 0, totalPages: 1 });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [downloading, setDownloading] = React.useState(false);

  React.useEffect(() => {
    getAllEvents({ size: 200 })
      .then((res) => setEvents(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setEvents([]));
  }, []);

  React.useEffect(() => {
    const t = setTimeout(() => setSearch(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  React.useEffect(() => {
    setPage(1);
  }, [eventId, search]);

  React.useEffect(() => {
    if (!EVENT_LEADS_LIVE) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    getEventRegistrations({ eventId, search, page, size: PAGE_SIZE })
      .then((res) => {
        if (cancelled) return;
        setRows(res.data);
        setPagination(res.pagination);
      })
      .catch((err) => !cancelled && setError(err?.response?.data?.message || err.message || "Couldn't load registrations."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [eventId, search, page]);

  async function handleDownload() {
    setDownloading(true);
    try {
      await downloadEventRegistrationsCsv({ eventId });
    } catch (err) {
      toast.error(err?.message || "Couldn't download the CSV.");
    } finally {
      setDownloading(false);
    }
  }

  const totalPages = Math.max(1, pagination?.totalPages || 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Helmet>
        <title>Event registrations | Admin | XK Trading Floor</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <Link to="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Events
      </Link>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold">Event registrations</h1>
          <p className="mt-1 text-sm text-gray-400">
            Everyone who registered through the site, and the event they registered for. Visible to Admins only.
          </p>
        </div>
        <button
          type="button"
          onClick={handleDownload}
          disabled={!EVENT_LEADS_LIVE || downloading}
          className="btn btn-primary inline-flex items-center gap-2 rounded-full disabled:opacity-50"
        >
          {downloading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
          Download CSV{eventId ? " (this event)" : ""}
        </button>
      </div>

      {!EVENT_LEADS_LIVE ? (
        <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-5 text-sm text-amber-100">
          Registrations will appear here once the backend for event registration is live (backend task B16). Until
          then the site's Register buttons work as before.
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-col gap-3 sm:flex-row">
            <label htmlFor="reg-event" className="sr-only">
              Event
            </label>
            <select
              id="reg-event"
              value={eventId}
              onChange={(e) => setEventId(e.target.value)}
              className="rounded-lg border border-white/10 bg-gray-900/70 px-3 py-2.5 text-sm text-white sm:w-80"
            >
              <option value="">All events</option>
              {events.map((evt) => (
                <option key={evt._id || evt.id} value={evt._id || evt.id}>
                  {evt.title}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <label htmlFor="reg-search" className="sr-only">
                Search by name or email
              </label>
              <input
                id="reg-search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or email"
                className="w-full rounded-lg border border-white/10 bg-gray-900/70 py-2.5 pl-10 pr-3 text-sm text-white placeholder:text-gray-500"
              />
            </div>
          </div>

          <p className="mb-2 text-xs text-gray-400" aria-live="polite">
            {loading ? "Loading…" : `${(pagination?.totalItems || 0).toLocaleString()} registration${pagination?.totalItems === 1 ? "" : "s"}`}
          </p>

          {error ? (
            <p role="alert" className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="bg-gray-900 text-xs uppercase tracking-wide text-gray-400">
                  <tr>
                    <th className="px-4 py-3 font-medium">Registered</th>
                    <th className="px-4 py-3 font-medium">Event</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Phone</th>
                    <th className="px-4 py-3 font-medium">Country</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Consent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                        No registrations yet{eventId || search ? " for this filter" : ""}.
                      </td>
                    </tr>
                  ) : (
                    rows.map((r) => (
                      <tr key={r._id} className="hover:bg-white/[0.02]">
                        <td className="whitespace-nowrap px-4 py-3 text-gray-300">{fmt(r.registeredAt)}</td>
                        <td className="px-4 py-3">
                          {r.eventId ? (
                            <Link to={`/events/${r.eventId}`} className="text-blue-400 hover:text-blue-300">
                              {r.eventTitle || "Event"}
                            </Link>
                          ) : (
                            r.eventTitle
                          )}
                        </td>
                        <td className="px-4 py-3 text-white">{r.fullName}</td>
                        <td className="px-4 py-3">
                          <a href={`mailto:${r.email}`} className="text-gray-300 hover:text-white">
                            {r.email}
                          </a>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-gray-300">{r.phone || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{r.country || "—"}</td>
                        <td className="px-4 py-3 text-gray-300">{r.company || "—"}</td>
                        <td className="px-4 py-3">{r.consent ? <span className="text-green-400">Yes</span> : <span className="text-gray-400">No</span>}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-4 flex items-center justify-end gap-2" aria-label="Pagination">
              <button type="button" className="btn btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </button>
              <span className="text-sm text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button type="button" className="btn btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}

export default AdminEventRegistrations;
