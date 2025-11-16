import { createSlice } from '@reduxjs/toolkit';
import { getUserCookie, setUserCookie, clearUserCookies } from '../../utils/cookies.js';

// Initialize from cookie instead of sessionStorage
const initialUser = typeof window !== 'undefined' ? getUserCookie() : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
  },
  reducers: {
    loginSuccess(state, action) {
      state.user = action.payload;
      // Store in cookie for cross-tab persistence
      setUserCookie(action.payload);
      // Keep sessionStorage for backward compatibility during transition
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('xktf_user', JSON.stringify(action.payload));
      }
    },
    logout(state) {
      state.user = null;
      // Clear cookies
      clearUserCookies();
      // Clear sessionStorage for backward compatibility
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('xktf_user');
        sessionStorage.removeItem('userSession');
      }
    },
    updateProfile(state, action) {
      if (!state.user) return;
      state.user = { ...state.user, ...action.payload };
      // Update cookie
      setUserCookie(state.user);
      // Update sessionStorage for backward compatibility
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('xktf_user', JSON.stringify(state.user));
        sessionStorage.setItem('userSession', JSON.stringify(state.user));
      }
    },
    // Sync user from cookie (useful for cross-tab sync)
    syncUserFromCookie(state) {
      const cookieUser = typeof window !== 'undefined' ? getUserCookie() : null;
      if (cookieUser) {
        state.user = cookieUser;
      } else {
        state.user = null;
      }
    }
  }
});

export const { loginSuccess, logout, updateProfile, syncUserFromCookie } = authSlice.actions;
export default authSlice.reducer;


