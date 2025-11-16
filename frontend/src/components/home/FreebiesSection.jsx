import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function FreebiesSection() {
  return (
    <section className="py-20 bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="inline-block px-6 py-2 rounded-full bg-blue-500/10 backdrop-blur-sm mb-4">
            <h2 className="text-xl font-semibold text-blue-400">Access our Freebies</h2>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mt-4">
            Get free trading tools and resources to enhance your trading journey
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Simple XKTF Trading Indicator */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.8 }}
            className="card hover:scale-[1.02] transition-transform duration-300 overflow-hidden"
          >
            <div className="card-body p-0">
              {/* Image with fixed height */}
              <div className="relative h-48 w-full overflow-hidden">
                <ImageWithFallback
                  src="/assets/xktf_indicator.jpg"
                  fallback="/assets/placeholder.jpg"
                  alt="Trading indicator chart"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="h-5 w-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold">Simple XKTF Trading Indicator</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  I Build This indicator based on a simple strategy While I do Analysis on Chart Check this Indicator out.
                </p>
                <Link to="/signup" className="btn btn-primary w-full rounded-full bg-green-500 hover:bg-green-600 text-sm">
                  Sign Up For Free
                </Link>
              </div>
            </div>
          </motion.div>

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
                  <h3 className="text-lg font-semibold">Trading Journal</h3>
                </div>
                <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                  Our trade journal is perfectly set up to help you keep track of all your trades. It has our 
                  strategy built into it and helps you have statistics on each setup and entry.
                </p>
                <button className="btn w-full rounded-full bg-green-500 hover:bg-green-600 opacity-50 cursor-not-allowed text-sm" disabled>
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

