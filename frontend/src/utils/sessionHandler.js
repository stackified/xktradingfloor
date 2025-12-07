/**
 * Session Handler Utility
 * Handles expired sessions, forced logouts, and authentication errors
 */

import { logout } from "../redux/slices/authSlice.js";

/**
 * Handle expired session or forced logout
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} toast - Toast notification function (optional)
 * @param {string} message - Custom message to show (optional)
 */
export const handleExpiredSession = (dispatch, toast = null, message = null) => {
  // Clear user data
  dispatch(logout());

  // Show toast notification if available
  if (toast) {
    const toastMessage = message || "Your session has expired. Please log in again.";
    toast.warning(toastMessage, 5000);
  }

  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = "/login";
  }, 1000);
};

/**
 * Handle forced logout (e.g., by admin)
 * @param {Function} dispatch - Redux dispatch function
 * @param {Function} toast - Toast notification function (optional)
 * @param {string} reason - Reason for logout (optional)
 */
export const handleForcedLogout = (dispatch, toast = null, reason = null) => {
  // Clear user data
  dispatch(logout());

  // Show toast notification if available
  if (toast) {
    const toastMessage = reason 
      ? `You've been logged out: ${reason}`
      : "You've been logged out. Please contact support if you believe this is an error.";
    toast.warning(toastMessage, 6000);
  }

  // Redirect to login after a short delay
  setTimeout(() => {
    window.location.href = "/login";
  }, 1500);
};

/**
 * Check if error is an authentication error
 * @param {Error} error - Error object
 * @returns {boolean} - True if error is auth-related
 */
export const isAuthError = (error) => {
  const status = error?.response?.status;
  return status === 401 || status === 403;
};

/**
 * Get user-friendly error message for auth errors
 * @param {Error} error - Error object
 * @returns {string} - User-friendly error message
 */
export const getAuthErrorMessage = (error) => {
  const status = error?.response?.status;
  const message = error?.response?.data?.message;

  if (status === 401) {
    return message || "Your session has expired. Please log in again.";
  }
  if (status === 403) {
    return message || "You don't have permission to perform this action.";
  }

  return message || "An authentication error occurred.";
};

