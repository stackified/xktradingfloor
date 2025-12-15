import api from "./api.js";

// FORCE REAL DATA MODE - Mock functionality is hidden but code is kept for future use
const FORCE_REAL_DATA_MODE = true;

// Helper to check if mock mode is enabled
async function isMockModeEnabled() {
  if (FORCE_REAL_DATA_MODE) {
    return false;
  }
  try {
    const response = await api.get("/settings/mock-mode");
    if (response?.data?.data?.enabled !== undefined) {
      if (typeof window !== "undefined") {
        localStorage.setItem(
          "xk_mock_mode",
          response.data.data.enabled.toString()
        );
      }
      return response.data.data.enabled;
    }
  } catch (error) {
    // Backend not available, fall back to localStorage
  }
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("xk_mock_mode");
    return stored === "true";
  }
  return false;
}

// Get all events
// Backend endpoint: POST /api/admin/event/getallevents
// Query params: page, size, search
// Body: { type } (optional)
export async function getAllEvents(filters = {}) {
  const mockMode = await isMockModeEnabled();
  let backendEvents = [];

  // Always try to fetch from backend first
  if (!mockMode) {
    try {
      const { page, size, search, type } = filters;
      const requestBody = {};
      if (type) {
        requestBody.type = type;
      }

      const params = { page, size, search };
      
      // Try public endpoint first (if it exists), then fallback to admin endpoint
      let response;
      try {
        // Try public endpoint first
        response = await api.post(
          "/public/events/getallevents",
          requestBody,
          {
            params,
          }
        );
      } catch (publicError) {
        // If public endpoint doesn't exist (404) or fails, try admin endpoint
        // This allows unauthorized users to still see events if backend allows it
        // Suppress 404 error for public endpoint - it's expected to not exist
        if (publicError.response?.status !== 404) {
          // Only log non-404 errors
          console.warn("Public events endpoint error:", publicError.message);
        }
        response = await api.post(
          "/admin/event/getallevents",
          requestBody,
          {
            params,
          }
        );
      }

      // Backend returns: { success: true, data: { docs: [...], totalItems, currentPage, totalPages } }
      if (response.data?.success && response.data?.data?.docs) {
        backendEvents = response.data.data.docs.map((event) => ({
          ...event,
          id: event._id || event.id,
          // Map backend fields to frontend expected fields
          image: event.featuredImage || event.image,
          date: event.dateTime || event.date,
        }));
      } else if (Array.isArray(response.data?.data)) {
        backendEvents = response.data.data.map((event) => ({
          ...event,
          id: event._id || event.id,
          image: event.featuredImage || event.image,
          date: event.dateTime || event.date,
        }));
      }
    } catch (error) {
      // If backend fails and mock mode is OFF, return empty array
      if (!mockMode) {
        // Log error but don't block - allow mock data fallback if available
        console.warn("Failed to fetch events from backend:", error.message);
        // Return empty array - events will not be shown if backend blocks access
        // Backend needs to provide public endpoint for unauthorized users
        return [];
      }
    }
  }

  // If mock mode is OFF, return only backend data
  if (!mockMode) {
    return backendEvents;
  }

  // If mock mode is ON, return ONLY mock data
  const { default: mockEvents } = await import("../models/eventsData.js");
  return mockEvents?.events || [];
}

// Get event by ID
// Backend endpoint: GET /api/admin/event/:eventId/geteventbyid or /api/public/events/:eventId/geteventbyid
export async function getEventById(id) {
  const mockMode = await isMockModeEnabled();

  // Always try backend first
  if (!mockMode) {
    try {
      // Try public endpoint first (if it exists), then fallback to admin endpoint
      let response;
      try {
        // Try public endpoint first
        response = await api.get(`/public/events/${id}/geteventbyid`);
      } catch (publicError) {
        // If public endpoint doesn't exist (404) or fails, try admin endpoint
        // This allows unauthorized users to still see events if backend allows it
        response = await api.get(`/admin/event/${id}/geteventbyid`);
      }

      // Backend returns: { success: true, data: {...} }
      if (response.data?.success && response.data?.data) {
        const event = response.data.data;
        return {
          ...event,
          id: event._id || event.id,
          // Map backend fields to frontend expected fields
          image: event.featuredImage || event.image,
          date: event.dateTime || event.date,
        };
      }
      if (response.data?.data) {
        const event = response.data.data;
        return {
          ...event,
          id: event._id || event.id,
          image: event.featuredImage || event.image,
          date: event.dateTime || event.date,
        };
      }
    } catch (error) {
      // If backend fails and mock mode is OFF, return null
      if (!mockMode) {
        if (error.response?.status === 404) {
          return null;
        }
        return null;
      }
    }
  }

  // If mock mode is ON, try mock data
  if (mockMode) {
    const { default: eventsData } = await import("../models/eventsData.js");
    const events = eventsData?.events || [];
    return events.find((e) => String(e.id) === String(id)) || null;
  }

  return null;
}

// Register for an event
// Backend endpoint: POST /api/admin/event/:eventId/register
// Body: { name, email, phone } (required if not authenticated)
export async function registerForEvent(formData) {
  const mockMode = await isMockModeEnabled();
  const { eventId, name, email, phone } = formData;

  if (!eventId) {
    throw new Error("Event ID is required");
  }

  // Try backend API first
  if (!mockMode) {
    try {
      const payload = {
        name: name || "",
        email: email || "",
        phone: phone || "",
      };

      const response = await api.post(
        `/admin/event/${eventId}/register`,
        payload
      );

      // Backend returns: { success: true, message: "...", data: {...} }
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || "Registered successfully!",
          data: response.data.data || payload,
        };
      }
      return response;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error("You must be logged in to register for events");
      }
      if (error.response?.status === 400) {
        throw new Error(
          error.response?.data?.message ||
            "Name, email, and phone are required for registration"
        );
      }
      // If backend fails and mock mode is OFF, throw error
      if (!mockMode) {
        throw error;
      }
    }
  }

  // Mock data implementation (only if mock mode is ON or backend failed)
  const payload = { ...formData, registeredAt: new Date().toISOString() };
  return { success: true, message: "Registered successfully!", data: payload };
}

// Create event
// Backend endpoint: POST /api/admin/event/addevent
// Body: FormData with title, description, excerpt, type, dateTime, location, price, seats, freebiesIncluded[], featuredImage
export async function createEvent(formData) {
  const mockMode = await isMockModeEnabled();
  
  if (!mockMode) {
    try {
      const response = await api.post("/admin/event/addevent", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || "Event created successfully!",
          data: response.data.data,
        };
      }
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to create event";
      throw new Error(errorMessage);
    }
  }
  
  // Mock implementation
  return {
    success: true,
    message: "Event created successfully!",
    data: { id: Date.now().toString(), ...formData },
  };
}

// Update event
// Backend endpoint: PUT /api/admin/event/:eventId/updateEvent
// Body: FormData with any fields to update
export async function updateEvent(eventId, formData) {
  const mockMode = await isMockModeEnabled();
  
  if (!mockMode) {
    try {
      const response = await api.put(
        `/admin/event/${eventId}/updateEvent`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || "Event updated successfully!",
          data: response.data.data,
        };
      }
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to update event";
      throw new Error(errorMessage);
    }
  }
  
  // Mock implementation
  return {
    success: true,
    message: "Event updated successfully!",
    data: { id: eventId, ...formData },
  };
}

// Delete event
// Backend endpoint: DELETE /api/admin/event/:eventId/deleteEvent
export async function deleteEvent(eventId) {
  const mockMode = await isMockModeEnabled();
  
  if (!mockMode) {
    try {
      const response = await api.delete(
        `/admin/event/${eventId}/deleteEvent`
      );
      
      if (response.data?.success) {
        return {
          success: true,
          message: response.data.message || "Event deleted successfully!",
        };
      }
      return response.data;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to delete event";
      throw new Error(errorMessage);
    }
  }
  
  // Mock implementation
  return {
    success: true,
    message: "Event deleted successfully!",
  };
}