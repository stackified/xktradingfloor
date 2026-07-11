import api from "./api.js";

// Real backend API calls for authentication
export async function signup({
  fullName,
  email,
  password,
  role,
  mobileNumber,
}) {
  try {
    const response = await api.post("/auth/signup", {
      fullName,
      email,
      password,
      role: role || "User",
      mobileNumber,
    });
    return response;
  } catch (error) {
    throw error;
  }
}

export async function login({ email, password }) {
  try {
    const response = await api.post("/auth/login", { email, password });
    // Backend returns: { success: true, message, token, data: { user, permissions } }
    // The httpOnly cookie 'token' is automatically set by the backend
    // We also get the token in the response body for Authorization header
    if (response.data && response.data.data) {
      // Map backend response to frontend format
      const userData = response.data.data;
      return {
        data: {
          id: userData._id || userData.id,
          _id: userData._id || userData.id,
          email: userData.email,
          fullName: userData.fullName,
          name: userData.fullName,
          role: userData.role,
          mobileNumber: userData.mobileNumber,
          permissions: userData.permissions,
          token: response.data.token, // Store token for Authorization header
        },
      };
    }
    return response;
  } catch (error) {
    throw error;
  }
}

export async function logoutRequest() {
  try {
    // Backend should clear the httpOnly cookie
    // For now, just return success - cookie clearing happens server-side
    return { data: { success: true } };
  } catch (error) {
    // Even if logout fails, we should clear local state
    return { data: { success: true } };
  }
}

export async function forgotPassword({ email }) {
  try {
    const response = await api.post("/auth/forget-password", {
      email: String(email).trim().toLowerCase(),
    });
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function validateResetToken(token) {
  try {
    const response = await api.get(
      `/auth/reset-password/validate?token=${encodeURIComponent(token)}`
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}

export async function resetPassword({ token, newPassword, confirmPassword }) {
  try {
    const response = await api.post(
      `/auth/reset-password?token=${encodeURIComponent(token)}`,
      { newPassword, confirmPassword }
    );
    return response.data;
  } catch (error) {
    throw error;
  }
}
