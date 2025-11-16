import React from "react";
import HeroSection from "../components/shared/HeroSection.jsx";
import SectionHeader from "../components/shared/SectionHeader.jsx";
import InfoCard from "../components/shared/InfoCard.jsx";
import AnimatedDivider from "../components/shared/AnimatedDivider.jsx";
import { Rocket, ShieldCheck, Users } from "lucide-react";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import ImageWithFallback from "../components/shared/ImageWithFallback.jsx";

function About() {
  return (
    <div>
      <Helmet>
        <title>About | XK Trading Floor</title>
        <meta
          name="description"
          content="Learn about XK Trading Floor's mission to empower traders through education, data, and community."
        />
        <link rel="canonical" href="/about" />
        <meta property="og:title" content="About | XK Trading Floor" />
        <meta
          property="og:description"
          content="Empowering traders through technology and data."
        />
      </Helmet>

      <HeroSection
        title="About XK Trading Floor"
        subtitle="Empowering traders through technology, data, and a transparent community."
        buttonText="Explore Our Mission"
        scrollTo="#mission"
      />

      <section
        id="mission"
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"
      >
        <SectionHeader
          title="Vision & Mission"
          subtitle="What drives us every day"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <InfoCard icon={Rocket} title="Innovation">
            We build learning and review experiences that leverage modern UX and
            real-world practice.
          </InfoCard>
          <InfoCard icon={ShieldCheck} title="Integrity">
            Transparent reviews and honest insights to help traders make
            informed decisions.
          </InfoCard>
          <InfoCard icon={Users} title="Empowerment">
            A supportive community where traders learn, collaborate, and grow
            together.
          </InfoCard>
        </div>
        <AnimatedDivider />
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <SectionHeader
          title="Leadership Team"
          subtitle="Experienced operators and educators"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { id: 1, name: "Leader 1", role: "Co-founder" },
            { id: 2, name: "Sahil", role: "Founder" },
            { id: 3, name: "Leader 2", role: "Co-founder" },
          ].map((leader) => (
            <motion.div
              key={leader.id}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="card bg-gray-900/60 border border-border"
            >
              <div className="card-body">
                <ImageWithFallback
                  src={`/assets/leadership/leader-${leader.id}.jpg`}
                  fallback="/assets/placeholder.jpg"
                  alt={leader.name}
                  className="w-full aspect-[3.2/3] object-cover rounded-md mb-3"
                />
                <div className="font-semibold">{leader.name}</div>
                <div className="text-sm text-gray-400">{leader.role}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="card bg-gray-900/60 border border-border">
          <div className="card-body flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold">Join Our Network</h3>
              <p className="text-sm text-gray-400">
                Become part of a growing, supportive trading community.
              </p>
            </div>
            <a
              href="/academy"
              className="btn btn-primary bg-blue-600 hover:bg-blue-700 transition-all"
              aria-label="Explore Academy"
            >
              Get Started
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}

export default About;
