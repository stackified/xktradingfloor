import React from 'react';
import { motion } from 'framer-motion';

function WhatIsXK() {
  return (
    <section className="py-20 bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.9 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="inline-block px-8 py-3 rounded-full bg-blue-500/10 backdrop-blur-sm mb-6"
          >
            <h2 className="text-xl font-semibold text-blue-400">What is XK Trading Floor?</h2>
          </motion.div>
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-4xl sm:text-5xl font-bold mb-8 bg-gradient-to-r from-white via-blue-200 to-white bg-clip-text text-transparent"
          >
            Its a Traders Empire.
          </motion.h3>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="max-w-3xl mx-auto"
          >
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed">
              A place where you can learn trading, explore and test EAs, indicators, and strategies. 
              Join a community that's always ahead of the curve and discover the tools and knowledge 
              you need to succeed in trading.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export default WhatIsXK;

