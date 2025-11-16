import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import ImageWithFallback from "../shared/ImageWithFallback.jsx";

function AboutIntro() {
  return (
    <section className="py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <ImageWithFallback
            src="/assets/knowledge_execution.jpg"
            fallback="/assets/placeholder.jpg"
            alt="Where knowledge meets execution - Trading education and community"
            className="aspect-video rounded-xl object-cover border border-border"
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <h2 className="text-2xl font-semibold">
            Where knowledge meets execution.
          </h2>
          <p className="text-gray-300 mt-3">
            We combine practical education, honest reviews, and a supportive
            community to help you trade with clarity and confidence.
          </p>
          <Link to="/about" className="btn btn-primary rounded-full mt-5 w-fit">
            Learn More
          </Link>
        </motion.div>
      </div>
    </section>
  );
}

export default AboutIntro;
