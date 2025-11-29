import { configureStore } from "@reduxjs/toolkit";
import authReducer from "./slices/authSlice.js";
import cartReducer from "./slices/cartSlice.js";
import analyticsReducer from "./slices/analyticsSlice.js";
import blogsReducer from "./slices/blogsSlice.js";
import mockReducer from "./slices/mockSlice.js";

const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    analytics: analyticsReducer,
    blogs: blogsReducer,
    mock: mockReducer,
  },
  devTools: true,
});

export default store;
