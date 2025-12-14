/**
 * Google Analytics Utility
 * Measurement ID: G-GYPE81F8N8
 * Stream ID: 13130862580
 */

const GA_MEASUREMENT_ID = "G-GYPE81F8N8";

/**
 * Initialize Google Analytics
 * This is called automatically when the script loads in index.html
 */
export const initGA = () => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: window.location.pathname + window.location.search,
    });
  }
};

/**
 * Track page view
 * @param {string} path - The page path (e.g., '/blog', '/about')
 * @param {string} title - Optional page title
 */
export const trackPageView = (path, title = "") => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  }
};

/**
 * Track custom event
 * @param {string} eventName - Event name (e.g., 'button_click', 'form_submit')
 * @param {object} eventParams - Event parameters (e.g., { button_name: 'Sign Up', location: 'header' })
 */
export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", eventName, eventParams);
  }
};

/**
 * Track button click
 * @param {string} buttonName - Name/identifier of the button
 * @param {string} location - Where the button is located (e.g., 'header', 'footer', 'hero')
 */
export const trackButtonClick = (buttonName, location = "") => {
  trackEvent("button_click", {
    button_name: buttonName,
    location: location,
  });
};

/**
 * Track form submission
 * @param {string} formName - Name/identifier of the form
 * @param {string} formType - Type of form (e.g., 'contact', 'signup', 'login')
 */
export const trackFormSubmit = (formName, formType = "") => {
  trackEvent("form_submit", {
    form_name: formName,
    form_type: formType,
  });
};

/**
 * Track link click
 * @param {string} linkText - Text of the link
 * @param {string} linkUrl - URL of the link
 * @param {string} location - Where the link is located
 */
export const trackLinkClick = (linkText, linkUrl, location = "") => {
  trackEvent("link_click", {
    link_text: linkText,
    link_url: linkUrl,
    location: location,
  });
};

/**
 * Track search
 * @param {string} searchTerm - The search query
 * @param {string} searchType - Type of search (e.g., 'blog', 'reviews', 'companies')
 */
export const trackSearch = (searchTerm, searchType = "") => {
  trackEvent("search", {
    search_term: searchTerm,
    search_type: searchType,
  });
};

/**
 * Track user engagement
 * @param {string} engagementType - Type of engagement (e.g., 'video_play', 'download', 'share')
 * @param {string} contentId - ID of the content
 * @param {string} contentType - Type of content (e.g., 'blog', 'event', 'video')
 */
export const trackEngagement = (
  engagementType,
  contentId = "",
  contentType = ""
) => {
  trackEvent("engagement", {
    engagement_type: engagementType,
    content_id: contentId,
    content_type: contentType,
  });
};
