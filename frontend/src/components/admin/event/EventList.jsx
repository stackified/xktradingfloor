import React from "react";
import {
  Edit,
  Loader2,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Globe,
  Building2,
} from "lucide-react";
import CustomSelect from "../../shared/CustomSelect.jsx";

const noop = () => { };

function EventList({
  events = [],
  loading = false,
  searchQuery = "",
  onSearchChange = noop,
  typeFilter = "",
  onTypeFilterChange = noop,
  onEdit = noop,
  onDelete = noop,
  canDelete = true,
}) {
  const hasEvents = Array.isArray(events) && events.length > 0;

  const formatDate = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
                placeholder="Search by title, description, or location"
                className="input pl-10"
                type="search"
              />
            </div>
            <div className="relative group">
              <CustomSelect
                icon={Filter}
                value={typeFilter}
                onChange={(event) => onTypeFilterChange(event.target.value)}
                options={[
                  { value: "", label: "All types" },
                  { value: "online", label: "Online" },
                  { value: "campus", label: "Campus" }
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
            Loading events...
          </div>
        )}

        {!loading && !hasEvents && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-lg font-medium mb-2">No events found</div>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or create a new event.
            </p>
          </div>
        )}

        {!loading && hasEvents && (
          <div className="divide-y divide-white/5">
            {events.map((event) => {
              const eventId = event._id || event.id;
              const registrations = Array.isArray(event.registrations)
                ? event.registrations
                : [];
              const freebies = Array.isArray(event.freebiesIncluded)
                ? event.freebiesIncluded
                : [];

              return (
                <div
                  key={eventId}
                  className="group relative flex flex-col gap-4 p-5 lg:flex-row lg:items-center hover:bg-gray-800/30 transition-all duration-300"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-blue-500/50 transition-all duration-300 rounded-r"></div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 text-white mb-2">
                      <h3 className="text-lg font-semibold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                        {event.title || "Untitled event"}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold backdrop-blur-sm ${event.type === "online"
                          ? "bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-lg shadow-blue-500/10"
                          : "bg-purple-500/20 text-purple-300 border border-purple-500/50 shadow-lg shadow-purple-500/10"
                          }`}
                      >
                        {event.type === "online" ? (
                          <Globe className="h-3 w-3" />
                        ) : (
                          <Building2 className="h-3 w-3" />
                        )}
                        {event.type === "online" ? "Online" : "Campus"}
                      </span>
                    </div>
                    {event.excerpt && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {event.excerpt}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                      {event.dateTime && (
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-4 w-4" />
                          {formatDate(event.dateTime)}
                        </span>
                      )}
                      {event.location && (
                        <span className="inline-flex items-center gap-1.5">
                          <MapPin className="h-4 w-4" />
                          {event.location}
                        </span>
                      )}
                      {event.seats !== undefined && (
                        <span className="inline-flex items-center gap-1.5">
                          <Users className="h-4 w-4" />
                          {event.seats} seats
                          {registrations.length > 0 && (
                            <span className="text-gray-500">
                              ({registrations.length} registered)
                            </span>
                          )}
                        </span>
                      )}
                      {event.price !== undefined && (
                        <span className="inline-flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4" />
                          {event.price === 0 ? "Free" : `$${event.price}`}
                        </span>
                      )}
                    </div>
                    {freebies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {freebies.map((freebie, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-500/10 text-purple-300 border border-purple-500/30"
                          >
                            {freebie}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-3 lg:w-auto">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEdit(eventId)}
                        className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 hover:border-indigo-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-indigo-500/20"
                      >
                        <Edit className="h-4 w-4 transition-transform group-hover:scale-110" />
                        <span className="text-sm font-medium">Edit</span>
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(eventId)}
                          className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:border-red-500/50 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-red-500/20"
                        >
                          <Trash2 className="h-4 w-4 transition-transform group-hover:scale-110" />
                          <span className="text-sm font-medium">Delete</span>
                        </button>
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

export default EventList;

