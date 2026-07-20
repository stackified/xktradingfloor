import React from "react";
import { motion } from "framer-motion";
import {
  Megaphone,
  Users,
  Youtube,
  TrendingUp,
  Sparkles,
  Handshake,
  Send,
  CheckCircle2,
} from "lucide-react";
import HeroSection from "../components/shared/HeroSection.jsx";
import Seo from "../components/shared/Seo.jsx";
import { useToast } from "../contexts/ToastContext.jsx";

const CONTACT_EMAIL = "hello@xktradingfloor.com";

function Services() {
  const toast = useToast();
  const [form, setForm] = React.useState({
    name: "",
    email: "",
    company: "",
    budget: "",
    message: "",
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);

  const services = [
    {
      icon: Youtube,
      title: "Sponsored YouTube integrations",
      body: "Native placements inside XK Trading Floor YouTube content — reaching engaged retail traders where they already spend hours a week.",
    },
    {
      icon: Users,
      title: "Community campaigns",
      body: "Announcements, contests, and AMAs across our Discord, Telegram, and email list — direct access to a self-selected trading audience.",
    },
    {
      icon: Megaphone,
      title: "Podcast sponsorships",
      body: "Host-read spots and full-episode sponsorships on the XK Trading Floor podcast. Longform trust, delivered by the host.",
    },
    {
      icon: TrendingUp,
      title: "Broker & prop-firm partnerships",
      body: "Featured placement across reviews, live spreads, payout tracker, and event pages — with clear disclosure and audience-first standards.",
    },
    {
      icon: Sparkles,
      title: "Creator collaborations",
      body: "Co-produced content with our verified traders — case studies, walkthroughs, and campaign series tailored to your brand.",
    },
    {
      icon: Handshake,
      title: "Event & expo partnerships",
      body: "On-site presence, speaking slots, and audience activations at fintech and trading events we host or attend.",
    },
  ];

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const buildMailto = () => {
    const subject = encodeURIComponent(
      `Influencer marketing enquiry — ${form.company || form.name || "New enquiry"}`
    );
    const body = encodeURIComponent(
      [
        `Name: ${form.name}`,
        `Email: ${form.email}`,
        `Company: ${form.company}`,
        `Budget: ${form.budget}`,
        "",
        "Message:",
        form.message,
      ].join("\n")
    );
    return `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast.error("Please add your name, email, and a short message.");
      return;
    }
    setSubmitting(true);
    try {
      window.location.href = buildMailto();
      setSubmitted(true);
      toast.info("Opening your email client...");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-black min-h-screen">
      <Seo
        title="Influencer Marketing & Partnerships"
        description="Reach engaged retail traders through sponsored YouTube integrations, podcast placements, community campaigns, and broker/prop-firm partnerships with XK Trading Floor."
        path="/services"
      />

      <HeroSection
        title={
          <>
            Reach traders who{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent font-semibold">
              actually trade
            </span>
          </>
        }
        subtitle="Influencer marketing, sponsorships, and partnerships for fintech brands. XK Trading Floor puts your message in front of an audience built on trust, not clicks."
      />

      <section className="py-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl tracking-tight mb-3">
              What we offer
            </h2>
            <p className="text-gray-300 max-w-2xl mx-auto text-sm sm:text-base">
              Every placement is aligned with our editorial standards. We only
              work with brands we'd recommend ourselves.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className="card p-6 bg-gradient-to-br from-gray-900 to-gray-800 border-gray-700 hover:border-blue-500/40 transition-colors"
                >
                  <div className="h-11 w-11 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <h3 className="font-display font-bold text-lg text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-sm text-gray-300 leading-relaxed">
                    {s.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="services-contact" className="py-16 bg-black scroll-mt-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="card p-6 sm:p-8 lg:p-10 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-gray-700"
          >
            <div className="text-center mb-8">
              <h2 className="font-display font-bold text-2xl sm:text-3xl tracking-tight mb-3">
                Let's build something
              </h2>
              <p className="text-gray-300 text-sm sm:text-base">
                Send us a quick brief. We usually reply within two business
                days.
              </p>
            </div>

            {submitted ? (
              <div className="text-center py-8">
                <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="font-display font-bold text-xl text-white mb-2">
                  Thanks — your email client is opening
                </h3>
                <p className="text-sm text-gray-300">
                  If it didn't, email us directly at{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-blue-400 hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                  .
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Your name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={handleChange("name")}
                      required
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2.5 text-white text-sm"
                      placeholder="Jane Trader"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Work email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={handleChange("email")}
                      required
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2.5 text-white text-sm"
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Company / brand
                    </label>
                    <input
                      type="text"
                      value={form.company}
                      onChange={handleChange("company")}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2.5 text-white text-sm"
                      placeholder="Broker or prop firm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-300 mb-2">
                      Approx. budget
                    </label>
                    <input
                      type="text"
                      value={form.budget}
                      onChange={handleChange("budget")}
                      className="w-full rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-2.5 text-white text-sm"
                      placeholder="$5k / month, one-off, etc."
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-300 mb-2">
                    What are you looking for?{" "}
                    <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={form.message}
                    onChange={handleChange("message")}
                    required
                    rows={5}
                    className="w-full rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none px-4 py-3 text-white text-sm resize-y"
                    placeholder="Tell us about your product, target audience, campaign goals, and timeline."
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn w-full inline-flex items-center justify-center gap-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-500 hover:border-blue-600 hover:scale-[1.01] transition-all shadow-lg shadow-blue-500/20 px-6 py-3 text-sm sm:text-base font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  <span>Send enquiry</span>
                </button>

                <p className="text-xs text-gray-500 text-center">
                  We'll open your email client. Prefer to email us directly?{" "}
                  <a
                    href={`mailto:${CONTACT_EMAIL}`}
                    className="text-blue-400 hover:underline"
                  >
                    {CONTACT_EMAIL}
                  </a>
                </p>
              </form>
            )}
          </motion.div>
        </div>
      </section>
    </div>
  );
}

export default Services;
