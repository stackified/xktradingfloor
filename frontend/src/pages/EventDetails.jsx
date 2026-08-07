import React from "react";
import Seo from "../components/shared/Seo.jsx";
import { eventJsonLd, breadcrumbJsonLd } from "../utils/structuredData.js";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ExternalLink } from "lucide-react";
import { getEventById } from "../controllers/eventsController.js";
import ImageWithFallback from "../components/shared/ImageWithFallback.jsx";
import RegisterModal from "../components/academy/RegisterModal.jsx";
import { getUserCookie } from "../utils/cookies.js";

function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);

  React.useEffect(() => {
    async function loadEvent() {
      setLoading(true);
      try {
        const foundEvent = await getEventById(eventId);
        if (foundEvent) {
          setEvent(foundEvent);
        }
      } catch (error) {
        console.error("Error loading event:", error);
      } finally {
        setLoading(false);
      }
    }
    loadEvent();
  }, [eventId]);
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="text-center text-gray-400">Loading event...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="card">
          <div className="card-body text-center">
            <h2 className="text-xl font-semibold mb-2">Event not found</h2>
            <p className="text-gray-400 mb-4">
              The event you're looking for doesn't exist.
            </p>
            <Link to="/events" className="btn btn-primary">
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <Seo
        title={event.title}
        description={event.excerpt || event.description?.slice(0, 160) || "View event details and register for XK Trading Floor workshops and webinars."}
        path={`/events/${event._id}`}
        image={event.featuredImage || event.image}
        type="event"
        jsonLd={[
          eventJsonLd(event),
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "Events", url: "/events" },
            { name: event.title, url: `/events/${event._id}` },
          ]),
        ].filter(Boolean)}
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 card overflow-hidden">
          <div className="w-full aspect-[16/9] bg-muted overflow-hidden rounded-xl">
            <ImageWithFallback
              src={((event.featuredImage || event.image || '').trim() || null)}
              fallback="/assets/placeholder.jpg"
              alt={event.title}
              className="h-full w-full object-cover"
              useDynamicFallback={true}
            />
          </div>
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  {event.title}
                </span>
              </h1>
              {event.type && (
                <span
                  className={`text-xs px-2 py-0.5 rounded border ${
                    event.type === "online"
                      ? "text-blue-300 border-blue-700"
                      : "text-green-300 border-green-700"
                  }`}
                >
                  {event.type}
                </span>
              )}
            </div>
            <div className="text-xs sm:text-sm text-gray-300 mb-2">
              {event.dateTime
                ? new Date(event.dateTime).toLocaleString()
                : event.date}{" "}
              {event.location ? `• ${event.location}` : ""}
            </div>
            {(event.organizerName || event.region || event.category) && (
              <div className="text-xs sm:text-sm text-gray-400 mb-4 flex flex-wrap items-center gap-x-2 gap-y-1">
                {event.organizerName && (
                  <span>
                    Organized by{" "}
                    <span className="text-gray-200 font-medium">
                      {event.organizerName}
                    </span>
                  </span>
                )}
                {event.category && (
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-200 border border-purple-500/30">
                    {event.category}
                  </span>
                )}
                {event.region && (
                  <span className="inline-flex items-center text-[11px] px-2 py-0.5 rounded-full bg-gray-700/40 text-gray-300 border border-gray-600/40">
                    {event.region}
                  </span>
                )}
              </div>
            )}
            {(event.excerpt || event.description) && (
              <div className="mb-4">
                {event.excerpt && (
                  <p className="text-sm sm:text-base text-gray-300 mb-2">
                    {event.excerpt}
                  </p>
                )}
                {event.description && (
                  <div className="text-sm sm:text-base text-gray-300 whitespace-pre-line">
                    {event.description}
                  </div>
                )}
              </div>
            )}
            {event.freebiesIncluded && event.freebiesIncluded.length > 0 && (
              <div>
                <h3 className="font-semibold text-sm sm:text-base mb-1">
                  What you get
                </h3>
                <ul className="list-disc list-inside text-xs sm:text-sm text-gray-300">
                  {event.freebiesIncluded.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className="card h-fit">
          <div className="card-body">
            {(() => {
              // Parse price defensively — backend stores it as a number but
              // legacy events sometimes have "0" as a string. Any positive
              // amount renders as "$X"; anything <=0 or missing = free event.
              const priceNum = Number(event.price);
              const isPaid = Number.isFinite(priceNum) && priceNum > 0;
              const externalUrl = event.externalUrl?.trim();
              return (
                <>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-semibold text-blue-400 mb-1">
                      {isPaid ? `$${priceNum}` : "Free Event"}
                    </div>
                    {event.seats > 0 && (
                      <div className="text-sm text-gray-400">
                        {event.seats} seats available
                      </div>
                    )}
                  </div>

                  {/* External registration always wins if set — the event is
                      hosted elsewhere (e.g. Eventbrite, partner site). */}
                  {externalUrl ? (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
                    >
                      Register at Organizer
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  ) : user ? (
                    <button
                      className="btn btn-primary w-full"
                      onClick={() => setModalOpen(true)}
                    >
                      Register
                    </button>
                  ) : (
                    <Link to="/login" className="btn btn-primary w-full">
                      Login to Register
                    </Link>
                  )}

                  <div className="text-xs text-gray-400 mt-3 text-center">
                    {externalUrl
                      ? "Registration is handled on the organizer's site."
                      : isPaid
                        ? "Registration is required to attend."
                        : "This is a free event. Registration is required."}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      </div>
      <RegisterModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        selectedEvent={event} 
      />
    </div>
  );
}

export default EventDetails;
