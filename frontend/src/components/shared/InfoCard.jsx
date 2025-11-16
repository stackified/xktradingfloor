import React from 'react';
import { motion } from 'framer-motion';

export default function InfoCard({ icon: Icon, title, children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="card bg-gray-900/60 border border-border hover:scale-[1.02] transition-transform">
      <div className="card-body">
        <div className="flex items-center gap-3 mb-2">
          {Icon && <div className="h-9 w-9 rounded bg-accent/20 text-accent flex items-center justify-center" aria-hidden="true"><Icon /></div>}
          <div className="font-semibold">{title}</div>
        </div>
        <div className="text-gray-300 text-sm">
          {children}
        </div>
      </div>
    </motion.div>
  );
}


