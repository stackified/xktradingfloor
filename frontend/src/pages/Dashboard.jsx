import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { fetchAnalytics } from '../redux/slices/analyticsSlice.js';
import OverviewCard from '../components/dashboard/OverviewCard.jsx';
import ActivityChart from '../components/dashboard/ActivityChart.jsx';
import PieChartWidget from '../components/dashboard/PieChartWidget.jsx';
import RecentActivity from '../components/dashboard/RecentActivity.jsx';
import QuickActions from '../components/dashboard/QuickActions.jsx';
import { Users, CalendarDays, Star, ShoppingCart } from 'lucide-react';
import { motion } from 'framer-motion';
import { getUserCookie } from '../utils/cookies.js';

export default function Dashboard() {
  const dispatch = useDispatch();
  const { overview, weekly, categories, recent, status } = useSelector(s => s.analytics);
  const reduxUser = useSelector(s => s.auth.user);
  const user = reduxUser || getUserCookie();

  // Restrict access to admin and operators only - check early
  if (!user || (user.role !== 'admin' && user.role !== 'operator')) {
    return <Navigate to="/" replace />;
  }

  React.useEffect(() => { 
    if (user && (user.role === 'admin' || user.role === 'operator')) {
      dispatch(fetchAnalytics()); 
    }
  }, [dispatch, user]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-white">
      <Helmet>
        <title>Dashboard | XK Trading Floor</title>
        <meta name="description" content="Your trading dashboard with analytics, activities, and quick actions." />
      </Helmet>
      <motion.h1 initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-semibold mb-6">Welcome back{user?.name ? `, ${user.name}` : ''}</motion.h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <OverviewCard icon={Users} label="Registrations" value={overview?.registrations ?? '—'} />
        <OverviewCard icon={CalendarDays} label="Events Attended" value={overview?.eventsAttended ?? '—'} />
        <OverviewCard icon={Star} label="Reviews Posted" value={overview?.reviewsPosted ?? '—'} />
        <OverviewCard icon={ShoppingCart} label="Store Orders" value={overview?.storeOrders ?? '—'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityChart data={weekly} />
        </div>
        <div className="lg:col-span-1">
          <PieChartWidget data={categories} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-2">
          <RecentActivity items={recent} />
        </div>
        <div className="lg:col-span-1">
          <QuickActions />
          {user?.role === 'admin' && (
            <div className="card bg-gray-900/60 border border-border mt-6">
              <div className="card-body">
                <div className="text-sm text-gray-400 mb-2">Admin Preview</div>
                <div className="text-sm text-gray-300">Future admin widgets will render here.</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {status === 'loading' && <div className="text-sm text-gray-400 mt-4">Loading analytics…</div>}
    </div>
  );
}


