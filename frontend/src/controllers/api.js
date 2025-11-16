import axios from 'axios';

// Axios instance for future backend integration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api',
  withCredentials: true,
});

// Dummy interceptor placeholders for JWT injection and error handling
api.interceptors.request.use((config) => {
  // const token = sessionStorage.getItem('xktf_token');
  // if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    // if (err.response?.status === 401) { /* handle logout or refresh */ }
    return Promise.reject(err);
  }
);

export default api;


