import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

function BlogHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/10 via-transparent to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-12 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="font-display font-extrabold text-3xl sm:text-5xl"
        >
          Insights & Market Analysis
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-3 text-gray-300 max-w-3xl mx-auto"
        >
          Stay ahead of the markets with in-depth research, tutorials, and expert opinions.
        </motion.p>
        <div className="mt-5">
          <Link to="/contact" className="btn btn-primary rounded-full">Write for Us</Link>
        </div>
      </div>
    </section>
  );
}

export default BlogHero;


