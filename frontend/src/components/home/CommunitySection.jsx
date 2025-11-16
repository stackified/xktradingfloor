import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function CommunitySection() {
  return (
    <section className="py-20 bg-gray-950 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8 }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              whileInView={{ scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-blue-500/10 backdrop-blur-sm mb-6"
            >
              <MessageCircle className="h-5 w-5 text-blue-400" />
              <h2 className="text-xl font-semibold text-blue-400">Community</h2>
            </motion.div>
            <p className="text-gray-300 text-lg sm:text-xl leading-relaxed mb-8">
              Looking for a community of traders which can help you understand more about trading 
              not just technical but also fundamental and free? Our non-toxic and friendly atmosphere 
              makes us the perfect choice for anyone looking to trade forex in a supportive and 
              collaborative environment.
            </p>
            <Link to="/academy" className="btn rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600 hover:scale-105 transition-all shadow-lg shadow-blue-500/20">
              Join Now
            </Link>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="relative"
          >
            {/* Seamless glow effect */}
            <motion.div
              animate={{
                opacity: [0.3, 0.5, 0.3],
                scale: [1, 1.05, 1]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute -inset-4 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-blue-500/30 rounded-3xl blur-2xl -z-10"
            />
            <div className="relative rounded-2xl overflow-hidden border border-gray-800 shadow-2xl">
              <ImageWithFallback
                src="/assets/community_trading.jpg"
                fallback="/assets/placeholder.jpg"
                alt="Community trading platform"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default CommunitySection;

