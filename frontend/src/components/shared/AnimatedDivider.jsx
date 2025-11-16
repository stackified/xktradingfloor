import React from 'react';
import { motion } from 'framer-motion';

export default function AnimatedDivider() {
  return (
    <motion.hr initial={{ scaleX: 0 }} whileInView={{ scaleX: 1 }} viewport={{ once: true }} transition={{ duration: 0.5 }} className="my-8 border-t-2 border-border origin-left" />
  );
}


