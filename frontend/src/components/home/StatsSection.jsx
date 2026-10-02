import React from "react";
import { m as motion } from "framer-motion";
import { Users, Building2, CalendarDays } from "lucide-react";

// Realistic figures agreed with the client (2 Oct 2026). No review or payout
// totals and no "verified" claims until there is real verified data behind
// them; update these as the community and listings grow.
const stats = [
  { icon: Users, value: "1,000+", label: "Traders" },
  { icon: Building2, value: "70+", label: "Brokers & Prop Firms" },
  { icon: CalendarDays, value: "25+", label: "Trading Events" },
];

function StatsSection() {
  return (
    <section className="bg-black border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-3 gap-6 lg:gap-6 max-w-3xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10 border border-blue-500/20">
                  <Icon className="h-5 w-5 text-blue-400" />
                </div>
                <div className="font-display font-bold text-xl sm:text-2xl text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm text-gray-400 leading-snug">
                  {stat.label}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default StatsSection;
