import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Upload,
  XCircle,
  Save,
  Calendar,
  MapPin,
  Users,
  DollarSign,
  Globe,
  Building2,
} from "lucide-react";
import { createEvent, updateEvent, getEventById } from "../../../controllers/eventsController.js";
import { useToast } from "../../../contexts/ToastContext.jsx";
import ChipInput from "../../shared/ChipInput.jsx";
import CustomSelect from "../../shared/CustomSelect.jsx";

const EVENT_TYPES = ["online", "campus"];

const defaultState = {
  title: "",
  description: "",
  excerpt: "",
  type: "online",
  dateTime: "",
  location: "",
  price: 0,
  seats: 0,
  freebiesIncluded: [],
};

function EventForm({ redirectPath = "/admin/events", eventId: eventIdProp }) {
  const navigate = useNavigate();
  const params = useParams();
  const eventId = eventIdProp ?? params.eventId;
  const isEditing = Boolean(eventId);
  const toast = useToast();

  const [formState, setFormState] = React.useState(defaultState);
  const [featuredImageFile, setFeaturedImageFile] = React.useState(null);
  const [featuredImagePreview, setFeaturedImagePreview] = React.useState("");
  const [localError, setLocalError] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [fetching, setFetching] = React.useState(false);

  // Load event data when editing
  React.useEffect(() => {
    if (isEditing && eventId) {
      setFetching(true);
      getEventById(eventId)
        .then((event) => {
          if (event) {
            setFormState({
              title: event.title || "",
              description: event.description || "",
              excerpt: event.excerpt || "",
              type: event.type || "online",
              dateTime: event.dateTime
                ? new Date(event.dateTime).toISOString().slice(0, 16)
                : "",
              location: event.location || "",
              price: event.price || 0,
              seats: event.seats || 0,
              freebiesIncluded: Array.isArray(event.freebiesIncluded)
                ? event.freebiesIncluded
                : [],
            });
            if (event.featuredImage || event.image) {
              setFeaturedImagePreview(event.featuredImage || event.image);
            }
          }
        })
        .catch((err) => {
          console.error("Failed to load event:", err);
          setLocalError("Failed to load event. Please try again.");
        })
        .finally(() => {
          setFetching(false);
        });
    }
  }, [isEditing, eventId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormState((prev) => ({
      ...prev,
      [name]:
        type === "checkbox"
          ? checked
          : type === "number"
            ? parseFloat(value) || 0
            : value,
    }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setFeaturedImageFile(file);
    setFeaturedImagePreview(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setFeaturedImageFile(null);
    setFeaturedImagePreview("");
  };

  const handleFreebiesChange = (freebies) => {
    setFormState((prev) => ({
      ...prev,
      freebiesIncluded: freebies,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLocalError("");
    setLoading(true);

    // Validation
    if (!formState.title.trim()) {
      setLocalError("Title is required.");
      setLoading(false);
      return;
    }

    if (!formState.dateTime) {
      setLocalError("Date and time is required.");
      setLoading(false);
      return;
    }

    const payload = new FormData();
    payload.append("title", formState.title.trim());
    payload.append("description", formState.description.trim());
    payload.append("excerpt", formState.excerpt.trim());
    payload.append("type", formState.type);
    payload.append("dateTime", new Date(formState.dateTime).toISOString());
    payload.append("location", formState.location.trim());
    payload.append("price", formState.price.toString());
    payload.append("seats", formState.seats.toString());

    // Append freebies as array
    formState.freebiesIncluded.forEach((freebie) => {
      payload.append("freebiesIncluded", freebie);
    });

    if (featuredImageFile) {
      payload.append("featuredImage", featuredImageFile);
    }

    try {
      if (isEditing) {
        await updateEvent(eventId, payload);
        toast.success("Event updated successfully!");
      } else {
        await createEvent(payload);
        toast.success("Event created successfully!");
      }

      navigate(`${redirectPath}?refresh=${Date.now()}`, { replace: true });
    } catch (err) {
      const errorMessage =
        err?.message || err || "Failed to save event. Please try again.";
      setLocalError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(redirectPath);
  };

  if (fetching) {
    return (
      <div className="bg-gray-950 text-white min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-400">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading event...
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 text-white min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <div className="mb-6">
          <h1 className="text-2xl font-semibold mb-2">
            {isEditing ? "Edit Event" : "Create New Event"}
          </h1>
          <p className="text-sm text-gray-400">
            {isEditing
              ? "Update event details and settings"
              : "Add a new event to the academy"}
          </p>
        </div>

        {localError && (
          <div className="mb-6 p-4 rounded-lg border border-red-500/50 bg-red-500/10 text-red-300">
            {localError}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formState.title}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
              placeholder="Enter event title"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-sm font-medium mb-2">Excerpt</label>
            <textarea
              name="excerpt"
              value={formState.excerpt}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
              placeholder="Short description (optional)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formState.description}
              onChange={handleChange}
              rows={6}
              className="w-full px-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all resize-none"
              placeholder="Full event description (optional)"
            />
          </div>

          {/* Type and DateTime */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Type <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <CustomSelect
                  value={formState.type}
                  onChange={(e) => handleChange({ target: { name: 'type', value: e.target.value } })}
                  options={EVENT_TYPES.map(type => ({
                    value: type,
                    label: type.charAt(0).toUpperCase() + type.slice(1)
                  }))}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Date & Time <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="datetime-local"
                  name="dateTime"
                  value={formState.dateTime}
                  onChange={handleChange}
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Location, Price, Seats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  name="location"
                  value={formState.location}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="Event location"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  name="price"
                  value={formState.price}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Seats</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <input
                  type="number"
                  name="seats"
                  value={formState.seats}
                  onChange={handleChange}
                  min="0"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-gray-900/70 border border-white/10 text-white placeholder:text-gray-500 focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          {/* Freebies */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Freebies Included
            </label>
            <ChipInput
              chips={formState.freebiesIncluded}
              onChange={handleFreebiesChange}
              placeholder="Add freebies (e.g., Free T-shirt, Certificate)"
            />
          </div>

          {/* Featured Image */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Featured Image
            </label>
            {featuredImagePreview ? (
              <div className="relative">
                <img
                  src={featuredImagePreview}
                  alt="Featured"
                  className="w-full h-64 object-cover rounded-lg border border-white/10"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 p-2 rounded-full bg-red-500/20 text-red-300 hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="h-5 w-5" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-white/20 rounded-lg cursor-pointer bg-gray-900/50 hover:bg-gray-900/70 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 mb-2 text-gray-400" />
                  <p className="text-sm text-gray-400">
                    Click to upload or drag and drop
                  </p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 rounded-lg border border-white/20 text-white hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-lg shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {isEditing ? "Update Event" : "Create Event"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EventForm;

