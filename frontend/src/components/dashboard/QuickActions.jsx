import React from "react";
import { Link } from "react-router-dom";
import {
  User,
  Ticket,
  MessageSquare,
  ShoppingBag,
  FileText,
} from "lucide-react";
import { useSelector } from "react-redux";
import { getUserCookie } from "../../utils/cookies.js";

export default function QuickActions() {
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();

  const baseActions = [
    { to: "/profile", label: "Edit Profile", icon: User },
    { to: "/academy", label: "View Tickets", icon: Ticket },
    { to: "/reviews", label: "Manage Reviews", icon: MessageSquare },
    { to: "/merch", label: "Open Shop", icon: ShoppingBag },
  ];

  // Add blog management based on role
  const blogAction =
    user?.role === "admin"
      ? { to: "/admin/blogs", label: "Manage Blogs", icon: FileText }
      : user?.role === "operator"
        ? { to: "/operator/blogs", label: "My Blogs", icon: FileText }
        : user?.role === "User" || user?.role === "user"
          ? { to: "/blogs/my-blogs", label: "My Blogs", icon: FileText }
          : null;

  const actions = blogAction ? [...baseActions, blogAction] : baseActions;

  return (
    <div
      className="card bg-gray-900/60 border border-border"
      role="region"
      aria-label="Quick actions"
    >
      <div className="card-body grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((a) => (
          <Link
            key={a.to}
            to={a.to}
            className="group relative inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-white/90 text-sm font-medium shadow-sm hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105 hover:shadow-blue-500/10 transition-all duration-300"
            aria-label={a.label}
          >
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <a.icon className="h-4 w-4 text-gray-400 group-hover:text-blue-300 transition-colors" aria-hidden="true" />
            <span className="relative z-10">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
