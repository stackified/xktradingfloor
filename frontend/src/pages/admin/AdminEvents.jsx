import React from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import {
  Plus,
  ChevronDown,
  Filter,
  Search,
  Loader2,
} from "lucide-react";
import { EventList } from "../../components/admin/event/index.js";
import { getAllEvents, deleteEvent } from "../../controllers/eventsController.js";
import { useToast } from "../../contexts/ToastContext.jsx";
import { getUserCookie } from "../../utils/cookies.js";
import ProtectedRoute from "../../components/dashboard/ProtectedRoute.jsx";
import ConfirmModal from "../../components/shared/ConfirmModal.jsx";

function AdminEventsContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const [events, setEvents] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [typeFilter, setTypeFilter] = React.useState("");
  const [deleteModal, setDeleteModal] = React.useState({
    isOpen: false,
    eventId: null,
  });

  // Load events
  const loadEvents = React.useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const filters = {
        search: searchQuery || undefined,
        type: typeFilter || undefined,
      };
      const data = await getAllEvents(filters);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.message || "Failed to load events");
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, typeFilter]);

  // Refresh when filters change
  React.useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Refresh when component mounts or when navigating back
  React.useEffect(() => {
    loadEvents();
  }, [location.pathname]);

  const handleEdit = (eventId) => {
    navigate(`/admin/events/edit/${eventId}`);
  };

  const handleDelete = (eventId) => {
    setDeleteModal({ isOpen: true, eventId });
  };

  const confirmDelete = async () => {
    if (!deleteModal.eventId) return;
    try {
      await deleteEvent(deleteModal.eventId);
      toast.success("Event deleted successfully");
      loadEvents();
      setDeleteModal({ isOpen: false, eventId: null });
    } catch (err) {
      const errorMessage =
        err?.message || err || "Failed to delete event";
      toast.error(errorMessage);
      console.error("Failed to delete event:", err);
    }
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <Helmet>
        <title>Event Management | XK Trading Floor Admin</title>
      </Helmet>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold mb-2">Event Management</h1>
            <p className="text-sm text-gray-400">
              Create, edit, and manage academy events
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/events/create")}
            className="group relative inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105"
          >
            <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
            <span>Create New Event</span>
          </button>
        </div>

        {error && (
          <div className="card mb-6 border-red-500/50 bg-red-500/10">
            <div className="card-body text-red-300">{error}</div>
          </div>
        )}

        {/* Event List */}
        <EventList
          events={events}
          loading={loading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          canDelete
        />
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, eventId: null })}
        onConfirm={confirmDelete}
        title="Delete Event"
        message="Are you sure you want to delete this event? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}

export default function AdminEvents() {
  return (
    <ProtectedRoute role="admin">
      <AdminEventsContent />
    </ProtectedRoute>
  );
}

