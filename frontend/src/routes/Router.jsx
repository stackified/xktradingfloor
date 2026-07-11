import React, { Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { syncUserFromCookie } from "../redux/slices/authSlice.js";
import {
  syncMockModeFromStorage,
  fetchMockMode,
} from "../redux/slices/mockSlice.js";
import Header from "../components/Header.jsx";
import Footer from "../components/Footer.jsx";
import PageViewTracker from "../components/analytics/PageViewTracker.jsx";
import ProtectedRoute from "../components/dashboard/ProtectedRoute.jsx";

// Keep Home eager for fastest first paint on landing page
import Home from "../pages/Home.jsx";

const Academy = React.lazy(() => import("../pages/Academy.jsx"));
const EventDetails = React.lazy(() => import("../pages/EventDetails.jsx"));
const Blog = React.lazy(() => import("../pages/Blog.jsx"));
const BlogPost = React.lazy(() => import("../pages/BlogPost.jsx"));
const Reviews = React.lazy(() => import("../pages/Reviews.jsx"));
const CompanyDetails = React.lazy(() => import("../pages/CompanyDetails.jsx"));
const Merch = React.lazy(() => import("../pages/Merch.jsx"));
const ProductDetails = React.lazy(() => import("../pages/ProductDetails.jsx"));
const Signup = React.lazy(() => import("../pages/Signup.jsx"));
const Login = React.lazy(() => import("../pages/Login.jsx"));
const ForgotPassword = React.lazy(() => import("../pages/ForgotPassword.jsx"));
const ResetPassword = React.lazy(() => import("../pages/ResetPassword.jsx"));
const About = React.lazy(() => import("../pages/About.jsx"));
const Contact = React.lazy(() => import("../pages/Contact.jsx"));
const PrivacyPolicy = React.lazy(() => import("../pages/PrivacyPolicy.jsx"));
const Terms = React.lazy(() => import("../pages/Terms.jsx"));
const AdminDashboard = React.lazy(() => import("../pages/AdminDashboard.jsx"));
const Dashboard = React.lazy(() => import("../pages/Dashboard.jsx"));
const Profile = React.lazy(() => import("../pages/Profile.jsx"));
const OperatorDashboard = React.lazy(() => import("../pages/OperatorDashboard.jsx"));
const OperatorCompanyForm = React.lazy(() => import("../pages/CompanyForm.jsx"));
const AdminBlogs = React.lazy(() => import("../pages/admin/AdminBlogs.jsx"));
const AdminCompanies = React.lazy(() => import("../pages/admin/AdminCompanies.jsx"));
const AdminCompanyDetails = React.lazy(() => import("../pages/admin/AdminCompanyDetails.jsx"));
const AdminCompanyForm = React.lazy(() => import("../components/admin/companies/CompanyForm.jsx"));
const AdminEvents = React.lazy(() => import("../pages/admin/AdminEvents.jsx"));
const AboutEditor = React.lazy(() => import("../pages/admin/AboutEditor.jsx"));
const AdminSettings = React.lazy(() => import("../pages/admin/AdminSettings.jsx"));
const EmailCampaigns = React.lazy(() => import("../pages/admin/EmailCampaigns.jsx"));
const MyBlogs = React.lazy(() => import("../pages/MyBlogs.jsx"));
const OperatorBlogs = React.lazy(() => import("../pages/operator/OperatorBlogs.jsx"));
const OperatorReviews = React.lazy(() => import("../pages/operator/OperatorReviews.jsx"));
const BlogForm = React.lazy(() =>
  import("../components/admin/blog/index.js").then((m) => ({ default: m.BlogForm }))
);
const EventForm = React.lazy(() =>
  import("../components/admin/event/index.js").then((m) => ({ default: m.EventForm }))
);

function PageLoader() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div
        className="h-8 w-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"
        role="status"
        aria-label="Loading page"
      />
    </div>
  );
}

function Layout({ children }) {
  const dispatch = useDispatch();

  // Sync user from cookie on mount for cross-tab persistence
  React.useEffect(() => {
    dispatch(syncUserFromCookie());
  }, [dispatch]);

  // Sync mock mode from backend globally (so admin changes affect all users across all browsers/devices)
  React.useEffect(() => {
    dispatch(fetchMockMode());

    const handleStorageChange = (e) => {
      if (e.key === "xk_mock_mode") {
        dispatch(syncMockModeFromStorage());
      }
    };

    const interval = setInterval(() => {
      dispatch(fetchMockMode());
    }, 60000);

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      clearInterval(interval);
    };
  }, [dispatch]);

  return (
    <div className="min-h-screen flex flex-col bg-black text-foreground">
      <Header />
      <main className="flex-1 pt-20 bg-black text-foreground">{children}</main>
      <Footer />
    </div>
  );
}

export default function AppRouter() {
  return (
    <Layout>
      <PageViewTracker />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/academy" element={<Academy />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/reviews" element={<Reviews />} />
          <Route path="/reviews/broker" element={<Reviews />} />
          <Route path="/reviews/propfirm" element={<Reviews />} />
          <Route path="/reviews/crypto" element={<Reviews />} />
          <Route
            path="/reviews/operator"
            element={
              <ProtectedRoute>
                <OperatorDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/company/new"
            element={
              <ProtectedRoute>
                <OperatorCompanyForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reviews/company/edit/:companyId"
            element={
              <ProtectedRoute>
                <OperatorCompanyForm />
              </ProtectedRoute>
            }
          />
          <Route path="/reviews/:companyId" element={<CompanyDetails />} />
          <Route path="/merch" element={<Merch />} />
          <Route path="/merch/:productId" element={<ProductDetails />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<Terms />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blogs"
            element={
              <ProtectedRoute role="admin">
                <AdminBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blogs/create"
            element={
              <ProtectedRoute role="admin">
                <BlogForm redirectPath="/admin/blogs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/blogs/edit/:blogId"
            element={
              <ProtectedRoute role="admin">
                <BlogForm redirectPath="/admin/blogs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies"
            element={
              <ProtectedRoute role="admin">
                <AdminCompanies />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies/create"
            element={
              <ProtectedRoute role="admin">
                <AdminCompanyForm redirectPath="/admin/companies" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies/edit/:companyId"
            element={
              <ProtectedRoute role="admin">
                <AdminCompanyForm redirectPath="/admin/companies" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/companies/:companyId"
            element={
              <ProtectedRoute role="admin">
                <AdminCompanyDetails />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/about/edit"
            element={
              <ProtectedRoute role="admin">
                <AboutEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute role="admin">
                <AdminSettings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/email-campaigns"
            element={
              <ProtectedRoute role="admin">
                <EmailCampaigns />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events"
            element={
              <ProtectedRoute role="admin">
                <AdminEvents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/create"
            element={
              <ProtectedRoute role="admin">
                <EventForm redirectPath="/admin/events" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/events/edit/:eventId"
            element={
              <ProtectedRoute role="admin">
                <EventForm redirectPath="/admin/events" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/my-blogs"
            element={
              <ProtectedRoute>
                <MyBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/create"
            element={
              <ProtectedRoute>
                <BlogForm redirectPath="/blogs/my-blogs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/blogs/edit/:blogId"
            element={
              <ProtectedRoute>
                <BlogForm redirectPath="/blogs/my-blogs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/blogs"
            element={
              <ProtectedRoute>
                <OperatorBlogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/blogs/create"
            element={
              <ProtectedRoute>
                <BlogForm redirectPath="/operator/blogs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/blogs/edit/:blogId"
            element={
              <ProtectedRoute>
                <BlogForm redirectPath="/operator/blogs" />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operator/reviews"
            element={
              <ProtectedRoute>
                <OperatorReviews />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Layout>
  );
}
