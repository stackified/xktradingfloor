import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Star,
  ShieldCheck,
  Briefcase,
  Building2,
  CalendarDays,
} from "lucide-react";

const stats = [
  { icon: Users, value: "50,000+", label: "Active Traders" },
  { icon: Star, value: "24,369+", label: "Verified Reviews" },
  { icon: ShieldCheck, value: "$23.7M+", label: "Verified Payouts" },
  { icon: Briefcase, value: "150+", label: "Brokers Reviewed" },
  { icon: Building2, value: "100+", label: "Prop Firms" },
  { icon: CalendarDays, value: "300+", label: "Trading Events" },
];

function StatsSection() {
  return (
    <section className="bg-black border-y border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
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
