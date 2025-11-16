import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice.js';
import cartReducer from './slices/cartSlice.js';
import analyticsReducer from './slices/analyticsSlice.js';

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    analytics: analyticsReducer,
  },
  devTools: true,
});

export default store;


