import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function FreebiesSection() {
  return (
    <section className="py-20 bg-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-6 leading-tight"
          >
            Access Our <span className="bg-gradient-to-r from-green-400 via-green-300 to-green-500 bg-clip-text text-transparent font-semibold">Freebies</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto"
          >
            Get free trading tools and resources to enhance your trading journey
          </motion.p>
        </motion.div>

        {/* Single centered card (the XKTF Trading Indicator freebie was removed
            per client request). Kept in a constrained, centered column so it
            doesn't stretch awkwardly now that it's the only card. */}
        <div className="max-w-md mx-auto">
          {/* Trading Journal */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="card hover:scale-[1.02] transition-transform duration-300 overflow-hidden"
          >
            <div className="card-body p-0">
              {/* Image with fixed height */}
              <div className="relative h-48 w-full overflow-hidden">
                <ImageWithFallback
                  src="/assets/trade_journal.jpg"
                  fallback="/assets/placeholder.jpg"
                  alt="Trading journal"
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-2 right-2 bg-green-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-green-500/30">
                  <span className="text-xs text-green-400 font-semibold">Coming Soon</span>
                </div>
              </div>
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="font-display font-bold text-base sm:text-lg tracking-tight">Trading Journal</h3>
                </div>
                <p className="text-sm sm:text-base text-gray-300 mb-4 line-clamp-3">
                  Our trade journal is perfectly set up to help you keep track of all your trades. It has our
                  strategy built into it and helps you have statistics on each setup and entry.
                </p>
                <button className="btn inline-flex items-center justify-center w-full rounded-full bg-green-500 hover:bg-green-600 opacity-50 cursor-not-allowed text-white border-2 border-green-500 px-6 py-3" disabled>
                  Coming Soon
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default FreebiesSection;
