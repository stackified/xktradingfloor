/**
 * Secure Cookie Management Utility
 * 
 * In a production environment with a backend, cookies should be set by the server
 * with HttpOnly and Secure flags. This utility simulates cookie-based auth
 * for the frontend. When backend is integrated, these cookies will be set
 * server-side via Set-Cookie headers.
 */

/**
 * Set a cookie
 * @param {string} name - Cookie name
 * @param {string} value - Cookie value
 * @param {number} days - Days until expiration (default: 7)
 */
export function setCookie(name, value, days = 7) {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  const cookieValue = encodeURIComponent(value) + `; expires=${expires.toUTCString()}; path=/; SameSite=Strict`;
  document.cookie = `${name}=${cookieValue}`;
}

/**
 * Get a cookie value
 * @param {string} name - Cookie name
 * @returns {string|null} - Cookie value or null
 */
export function getCookie(name) {
  const nameEQ = name + "=";
  const ca = document.cookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') c = c.substring(1, c.length);
    if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
  }
  return null;
}

/**
 * Delete a cookie
 * @param {string} name - Cookie name
 */
export function deleteCookie(name) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}

/**
 * Set user session cookie
 * @param {object} userData - User object to store
 */
export function setUserCookie(userData) {
  try {
    const userString = JSON.stringify(userData);
    setCookie('xktf_user', userString, 7); // 7 days expiration
    // Also set a session indicator for cross-tab sync
    setCookie('xktf_session', 'active', 7);
  } catch (error) {
    console.error('Error setting user cookie:', error);
  }
}

/**
 * Get user from cookie
 * @returns {object|null} - User object or null
 */
export function getUserCookie() {
  try {
    const userString = getCookie('xktf_user');
    if (!userString) return null;
    return JSON.parse(userString);
  } catch (error) {
    console.error('Error getting user cookie:', error);
    return null;
  }
}

/**
 * Clear user session cookies
 */
export function clearUserCookies() {
  deleteCookie('xktf_user');
  deleteCookie('xktf_session');
}

/**
 * Check if user session exists
 * @returns {boolean}
 */
export function hasSession() {
  return getCookie('xktf_session') === 'active' && getUserCookie() !== null;
}

