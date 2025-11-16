import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Clock, Signal } from 'lucide-react';

function PreferredBroker() {
  return (
    <section className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center mb-6">Preferred Broker</h2>
          <div className="card">
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="mb-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-16 w-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <TrendingUp className="h-8 w-8 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="text-2xl font-bold text-yellow-400">EXCELLENCE FX</h3>
                        <p className="text-sm text-gray-400">INFINITE HORIZONS IN FOREX</p>
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xl font-semibold mb-3">Trading is better with Blueberry Markets</h4>
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-gray-300">
                      <TrendingUp className="h-5 w-5 text-blue-400" />
                      <span>Raw spreads.</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Signal className="h-5 w-5 text-blue-400" />
                      <span>Real time trade signals.</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-300">
                      <Clock className="h-5 w-5 text-blue-400" />
                      <span>Round the clock support.</span>
                    </div>
                  </div>
                  <button className="btn btn-secondary rounded-full">
                    Create Live Account
                  </button>
                </div>
                <div className="text-center">
                  <div className="inline-block p-8 rounded-xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border-2 border-yellow-500/30">
                    <TrendingUp className="h-24 w-24 text-yellow-400 mx-auto mb-4" />
                    <div className="text-2xl font-bold text-yellow-400">EXCELLENCE FX</div>
                    <div className="text-sm text-gray-400 mt-2">INFINITE HORIZONS IN FOREX</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

export default PreferredBroker;

