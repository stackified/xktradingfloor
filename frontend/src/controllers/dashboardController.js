export async function getDashboardOverview() {
  const { overview } = await import('../models/dashboardData.js');
  return overview;
}

export async function getWeeklyActivity() {
  const { weeklyActivity } = await import('../models/dashboardData.js');
  return weeklyActivity;
}

export async function getCategorySplit() {
  const { categorySplit } = await import('../models/dashboardData.js');
  return categorySplit;
}

export async function getRecentActivity() {
  const { recentActivity } = await import('../models/dashboardData.js');
  return recentActivity;
}

