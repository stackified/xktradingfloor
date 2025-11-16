import React from 'react';
import HeroSection from '../components/shared/HeroSection.jsx';
import SectionHeader from '../components/shared/SectionHeader.jsx';
import AnimatedDivider from '../components/shared/AnimatedDivider.jsx';
import { motion } from 'framer-motion';
import { Mail, Phone, MessageSquare, Linkedin, Twitter } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

function Contact() {
  const [ok, setOk] = React.useState(false);
  const [form, setForm] = React.useState({ name: '', email: '', type: 'General', message: '' });
  function submit(e) {
    e.preventDefault();
    setOk(true);
    setTimeout(() => setOk(false), 1500);
  }

  return (
    <div>
      <Helmet>
        <title>Contact | XK Trading Floor</title>
        <meta name="description" content="Get in touch with XK Trading Floor for support, partnerships, or feedback." />
        <link rel="canonical" href="/contact" />
        <meta property="og:title" content="Contact | XK Trading Floor" />
        <meta property="og:description" content="We'd love to hear from you." />
      </Helmet>

      <HeroSection
        title="Get in Touch"
        subtitle="Questions, feedback, or collaboration ideas? We’re here to help."
        buttonText="Contact Form"
        scrollTo="#contact-form"
      />

      <section id="contact-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SectionHeader title="Send a Message" subtitle="We usually respond within 1–2 business days" />
          <form onSubmit={submit} className="card bg-gray-900/60 border border-border p-0">
            <div className="card-body space-y-4">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Your Name</span>
                <input required className="input" aria-label="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Email</span>
                <input required className="input" type="email" aria-label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Inquiry Type</span>
                <select className="input" aria-label="Inquiry Type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>General</option>
                  <option>Support</option>
                  <option>Partnership</option>
                  <option>Press</option>
                </select>
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-gray-300">Message</span>
                <textarea required className="input h-32" aria-label="Message" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
              </label>
              <button type="submit" className="btn btn-primary w-full bg-blue-600 hover:bg-blue-700 transition-all duration-300" aria-label="Send message">Send</button>
              <div className="text-xs text-gray-400">We will integrate an email provider later (SendGrid/Mailgun).</div>
            </div>
          </form>

          <div className="mt-6 card bg-gray-900/60 border border-border">
            <div className="card-body flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <div className="font-semibold">Support & Collaboration</div>
                <div className="text-sm text-gray-400">Interested in partnering or need help? Reach out to our team.</div>
              </div>
              <a href="mailto:support@xktrading.com" className="btn btn-secondary" aria-label="Email support">Email Support</a>
            </div>
          </div>
        </div>

        <aside>
          <SectionHeader title="Contact Details" />
          <ul className="space-y-3">
            <li className="flex items-center gap-3 text-sm text-gray-300"><Mail className="text-accent" aria-hidden="true" /> support@xktrading.com</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><Phone className="text-accent" aria-hidden="true" /> +1 (555) 010-9876</li>
            <li className="flex items-center gap-3 text-sm text-gray-300"><MessageSquare className="text-accent" aria-hidden="true" /> Live chat (coming soon)</li>
          </ul>
          <AnimatedDivider />
          <div className="flex items-center gap-3">
            <a href="#" title="Twitter" aria-label="Twitter" className="p-2 rounded bg-gray-800 hover:bg-gray-700" data-tooltip="Twitter"><Twitter /></a>
            <a href="#" title="LinkedIn" aria-label="LinkedIn" className="p-2 rounded bg-gray-800 hover:bg-gray-700" data-tooltip="LinkedIn"><Linkedin /></a>
          </div>
        </aside>
      </section>

      {ok && (
        <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="fixed bottom-6 right-6 bg-gray-900/90 border border-border rounded-md px-4 py-3 shadow-card">
          <div className="text-sm">Thanks! Your message has been sent.</div>
        </motion.div>
      )}
    </div>
  );
}

export default Contact;


