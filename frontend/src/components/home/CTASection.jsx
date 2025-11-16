import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function CTASection() {
  return (
    <section className="py-20 bg-gray-950">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto px-4 rounded-2xl bg-gradient-to-r from-blue-600/20 to-blue-400/10 border border-blue-900/40 text-center p-10 shadow-lg shadow-blue-500/20"
      >
        <h3 className="text-2xl font-semibold">Join thousands of traders mastering the markets.</h3>
        <p className="text-gray-300 mt-2">Access events, courses, reviews, and an active community.</p>
        <Link to="/signup" className="btn btn-primary rounded-full mt-5">Sign Up Now</Link>
      </motion.div>
    </section>
  );
}

export default CTASection;


