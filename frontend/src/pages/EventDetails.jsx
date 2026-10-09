import React from "react";
import Seo from "../components/shared/Seo.jsx";
import { eventJsonLd, breadcrumbJsonLd } from "../utils/structuredData.js";
import { useParams, Link } from "react-router-dom";
import { useSelector } from "react-redux";
import { ExternalLink } from "lucide-react";
import { getEventById, EVENT_LEADS_LIVE } from "../controllers/eventsController.js";
import EventImage from "../components/shared/EventImage.jsx";
import EventBadges from "../components/shared/EventBadges.jsx";
import RegisterModal from "../components/academy/RegisterModal.jsx";
import EventRegisterModal from "../components/academy/EventRegisterModal.jsx";
import { formatEventWhen, formatEventPlace } from "../utils/eventTime.js";
import { eventPricing } from "../utils/eventPricing.js";
import { getUserCookie } from "../utils/cookies.js";
import DesignedHtml from "../components/shared/DesignedHtml.jsx";
import { eventDescriptionView, eventSummary } from "../utils/eventDescription.js";

function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  // Plain text, rich text or a designed HTML page (utils/eventDescription.js).
  const descriptionView = React.useMemo(
    () => eventDescriptionView(event?.description, { pageTitle: event?.title }),
    [event?.description, event?.title]
  );

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
      <div className="max-w-5xl mx-auto px-4 py-10 min-h-screen">
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
        description={eventSummary(event, 160) || "View event details and register for XK Trading Floor workshops and webinars."}
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
          <EventImage
            src={event.featuredImage || event.image}
            alt={event.title}
            rounded="rounded-xl"
            priority
          />
          <div className="card-body">
            <div className="flex items-center justify-between mb-2">
              <h1 className="font-display font-bold text-xl sm:text-2xl lg:text-3xl">
                <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
                  {event.title}
                </span>
              </h1>
            </div>
            <EventBadges evt={event} size="md" className="mb-3" />
            <div className="text-xs sm:text-sm text-gray-300 mb-2">
              {formatEventWhen(event)}{" "}
              {formatEventPlace(event) ? `• ${formatEventPlace(event)}` : ""}
            </div>
            {event.city && event.location && (
              <div className="text-xs sm:text-sm text-gray-400 mb-2">Venue: {event.location}</div>
            )}
            {event.organizerName && (
              <div className="text-xs sm:text-sm text-gray-400 mb-4">
                Organized by{" "}
                <span className="text-gray-200 font-medium">
                  {event.organizerName}
                </span>
              </div>
            )}
            {(event.excerpt || event.description) && (
              <div className="mb-4">
                {event.excerpt && (
                  <p className="text-sm sm:text-base text-gray-300 mb-2">
                    {event.excerpt}
                  </p>
                )}
                {descriptionView.kind === "text" && (
                  <div className="text-sm sm:text-base text-gray-300 whitespace-pre-line">
                    {descriptionView.text}
                  </div>
                )}
                {descriptionView.kind === "html" && (
                  <div
                    className="article-content text-sm sm:text-base"
                    dangerouslySetInnerHTML={{ __html: descriptionView.html }}
                  />
                )}
                {descriptionView.kind === "designed" && (
                  <DesignedHtml rendered={descriptionView.designed} className="rounded-2xl overflow-hidden" />
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
              // Expos with an organiser link sell their own tickets; any other
              // event without a price is free (utils/eventPricing.js).
              const { isPaid, price: priceNum, ticketsAtOrganiser, externalUrl } = eventPricing(event);
              return (
                <>
                  <div className="text-center mb-4">
                    {!ticketsAtOrganiser ? (
                      <div className="text-2xl font-semibold text-blue-400 mb-1">
                        {isPaid ? `$${priceNum}` : "Free Event"}
                      </div>
                    ) : (
                      <div className="text-base font-semibold text-blue-300 mb-1">
                        Tickets on the organiser&apos;s site
                      </div>
                    )}
                    {event.seats > 0 && (
                      <div className="text-sm text-gray-400">
                        {event.seats} seats available
                      </div>
                    )}
                  </div>

                  {/* With lead capture on, everyone registers with XK first
                      (no account needed); the organiser's own link is shown
                      after the form is sent. Without it, the old flow: the
                      external link wins, else logged-in registration. */}
                  {EVENT_LEADS_LIVE ? (
                    <button
                      type="button"
                      className="btn btn-primary w-full"
                      onClick={() => setModalOpen(true)}
                    >
                      Register
                    </button>
                  ) : externalUrl ? (
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-primary w-full inline-flex items-center justify-center gap-2"
                    >
                      {ticketsAtOrganiser ? "Register at Organizer" : "Register"}
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
                    {EVENT_LEADS_LIVE
                      ? "No account needed."
                      : ticketsAtOrganiser
                      ? "Registration is handled on the organizer's site."
                      : externalUrl
                      ? `${isPaid ? "Registration" : "This is a free event. Registration"} opens in a new tab.`
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
      {EVENT_LEADS_LIVE ? (
        <EventRegisterModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          event={event}
        />
      ) : (
        <RegisterModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          selectedEvent={event}
        />
      )}
    </div>
  );
}

export default EventDetails;
