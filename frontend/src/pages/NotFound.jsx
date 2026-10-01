import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Star, CalendarDays, BookOpen } from "lucide-react";
import Seo from "../components/shared/Seo.jsx";

// Shown for any URL that isn't a page. It used to redirect to the homepage,
// which made every mistyped or removed URL look like a copy of the homepage
// to search engines (soft 404s). This page is marked noindex instead.
function NotFound() {
  const { pathname } = useLocation();
  const links = [
    { to: "/", label: "Home", icon: Home },
    { to: "/reviews", label: "Broker & prop firm reviews", icon: Star },
    { to: "/events", label: "Trading events", icon: CalendarDays },
    { to: "/blog", label: "Blog", icon: BookOpen },
  ];
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <Seo title="Page not found" description="This page doesn't exist on XK Trading Floor." path={pathname} noindex />
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.12em] text-blue-400">404</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white sm:text-4xl">Page not found</h1>
        <p className="mt-3 text-gray-300">
          The page you're looking for doesn't exist or has moved. Try one of these instead:
        </p>
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <Link
                to={to}
                className="flex min-h-[48px] items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-left text-white transition-colors hover:border-blue-500/60"
              >
                <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default NotFound;
