import React, { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Copy, CheckCircle2, LineChart, ShieldCheck, Camera } from "lucide-react";

const LOCKITTRADE_URL =
  "https://www.lockittrade.com/?utm_source=xktf&utm_medium=journal_cta&utm_campaign=lockittrade";
const COUPON_CODE = "XKTF";

function TradingJournalSection() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (_) {
      const el = document.createElement("textarea");
      el.value = COUPON_CODE;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const perks = [
    {
      icon: LineChart,
      title: "Auto-computed PnL & R:R",
      body: "Every trade logs entry, exit, and lot size — the journal does the math so you can spot what actually moves your equity.",
    },
    {
      icon: Camera,
      title: "Screenshots & notes per trade",
      body: "Attach charts, mark up your setup, and pin the reasoning next to the result. Review honestly, learn faster.",
    },
    {
      icon: ShieldCheck,
      title: "Private by default",
      body: "Your journal is yours. Nothing on LockItTrade is public unless you explicitly choose to share it.",
    },
  ];

  return (
    <section
      id="trading-journal"
      className="py-20 bg-black relative overflow-hidden scroll-mt-24"
    >
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <p className="uppercase tracking-[0.3em] text-xs text-blue-400 font-semibold mb-3">
            Partner tool
          </p>
          <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-4 leading-tight">
            The trading journal we{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              actually use
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-300 max-w-2xl mx-auto">
            Consistent traders keep a journal. XK Trading Floor recommends{" "}
            <span className="text-white font-medium">LockItTrade</span> — a
            purpose-built trade log with everything a serious trader needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className="card p-6 lg:p-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700 relative overflow-hidden flex flex-col"
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl"></div>

            <div className="relative z-10 flex flex-col h-full">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-white/95 border border-gray-700 flex items-center justify-center p-2 shadow-lg">
                  <img
                    src="/assets/lockittrade-logo.png"
                    alt="LockItTrade"
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <div>
                  <p className="text-white font-display font-bold text-xl sm:text-2xl leading-none">
                    LockItTrade
                  </p>
                  <p className="text-gray-400 text-sm mt-1">
                    lockittrade.com
                  </p>
                </div>
              </div>

              <h3 className="font-display font-bold text-lg sm:text-xl lg:text-2xl text-white mb-3 leading-snug">
                Track every trade. Find the pattern behind your wins.
              </h3>
              <p className="text-sm sm:text-base text-gray-300 mb-8 leading-relaxed">
                Built for traders who are done relying on memory. Log entries,
                screenshots, strategies, and let the numbers show you which
                setups are actually paying off.
              </p>

              <div className="mt-auto space-y-4">
                <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-4 sm:p-5">
                  <p className="text-xs uppercase tracking-widest text-blue-300 font-semibold mb-2">
                    XK Trading Floor exclusive
                  </p>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <p className="text-sm text-gray-300 mb-1">
                        Use coupon code
                      </p>
                      <p className="font-mono font-bold text-2xl sm:text-3xl text-white tracking-widest">
                        {COUPON_CODE}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-gray-900 hover:bg-gray-100 border-2 border-white transition-all px-4 py-2 text-sm font-medium w-full sm:w-auto"
                      aria-label="Copy coupon code"
                    >
                      {copied ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-4 w-4" />
                          <span>Copy code</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <a
                  href={LOCKITTRADE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600 hover:scale-[1.02] transition-all shadow-lg shadow-blue-500/20 px-6 py-3 text-sm sm:text-base font-medium w-full"
                >
                  <span>Try this journal</span>
                  <ArrowRight className="h-4 w-4" />
                </a>
                <p className="text-xs text-gray-500 text-center">
                  You'll be taken to lockittrade.com in a new tab.
                </p>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col gap-4">
            {perks.map((perk, i) => {
              const Icon = perk.icon;
              return (
                <motion.div
                  key={perk.title}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.1 }}
                  className="card p-5 sm:p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 flex-1 flex gap-4"
                >
                  <div className="h-11 w-11 flex-shrink-0 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-base sm:text-lg text-white mb-2">
                      {perk.title}
                    </h4>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {perk.body}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TradingJournalSection;
