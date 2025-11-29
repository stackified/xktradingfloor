// Helper to check if mock mode is enabled
// TODO: Replace with backend API call once backend is ready
// Backend endpoint: GET /api/public/settings/mock-mode
async function isMockModeEnabled() {
  // Try to fetch from backend first (when backend is ready)
  try {
    const { default: api } = await import("./api.js");
    const response = await api.get("/public/settings/mock-mode");
    if (response?.data?.enabled !== undefined) {
      return response.data.enabled;
    }
  } catch (error) {
    // Backend not available or endpoint not implemented yet
    // Fall back to localStorage for now
  }

  // Fallback to localStorage (current implementation)
  if (typeof window !== "undefined") {
    const stored = localStorage.getItem("xk_mock_mode");
    return stored === "true";
  }
  return false;
}

export async function getAllBlogs() {
  const mockMode = await isMockModeEnabled();

  // If mock mode is OFF, return empty array (no mock data)
  if (!mockMode) {
    return [];
  }

  // If mock mode is ON, return mock data
  return import("../models/blogsData.js").then((m) => m.blogs);
}

export async function getBlogById(id) {
  const mockMode = await isMockModeEnabled();

  // If mock mode is OFF, return null (no mock data)
  if (!mockMode) {
    return null;
  }

  // If mock mode is ON, return mock data
  const list = await import("../models/blogsData.js").then((m) => m.blogs);
  return list.find((b) => b.id === parseInt(id));
}
