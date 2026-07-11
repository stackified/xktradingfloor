import React from "react";
import { NavLink } from "react-router-dom";
import { Landmark, TrendingUp, Users } from "lucide-react";

const TABS = [
  { to: "/reviews/broker", label: "Brokers", icon: Landmark },
  { to: "/reviews/propfirm", label: "Prop Firms", icon: TrendingUp },
  { to: "/reviews/traders", label: "Verified Traders", icon: Users },
];

function ReviewsTabs() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-center gap-2 sm:gap-3 flex-wrap">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end
              className={({ isActive }) =>
                `inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-sm font-medium transition-all border ${
                  isActive
                    ? "bg-blue-500 text-white border-blue-500 shadow-lg shadow-blue-500/20"
                    : "bg-gray-900/60 text-gray-300 border-gray-700 hover:border-blue-500/50 hover:text-white"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export default ReviewsTabs;
