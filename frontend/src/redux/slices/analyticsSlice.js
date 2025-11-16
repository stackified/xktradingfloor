import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getDashboardOverview, getWeeklyActivity, getCategorySplit, getRecentActivity } from '../../controllers/dashboardController.js';

export const fetchAnalytics = createAsyncThunk('analytics/fetchAll', async () => {
  const [overview, weekly, categories, recent] = await Promise.all([
    getDashboardOverview(),
    getWeeklyActivity(),
    getCategorySplit(),
    getRecentActivity()
  ]);
  return { overview, weekly, categories, recent };
});

const analyticsSlice = createSlice({
  name: 'analytics',
  initialState: {
    overview: null,
    weekly: [],
    categories: [],
    recent: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnalytics.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchAnalytics.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.overview = action.payload.overview;
        state.weekly = action.payload.weekly;
        state.categories = action.payload.categories;
        state.recent = action.payload.recent;
      })
      .addCase(fetchAnalytics.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.error?.message || 'Failed to load analytics';
      });
  }
});

export default analyticsSlice.reducer;

