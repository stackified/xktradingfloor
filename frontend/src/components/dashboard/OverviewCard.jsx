import React from 'react';
import { motion } from 'framer-motion';

export default function OverviewCard({ icon: Icon, label, value }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="card bg-gray-900/60 border border-border">
      <div className="card-body flex items-center gap-4">
        <div className="h-10 w-10 rounded bg-accent/20 text-accent flex items-center justify-center">
          {Icon && <Icon aria-hidden="true" />}
        </div>
        <div>
          <div className="text-sm text-gray-400">{label}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </motion.div>
  );
}


