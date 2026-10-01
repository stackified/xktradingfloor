import React from "react";
import { ChevronDown } from "lucide-react";

// Visible FAQ list. Pages pass the same `faqs` array to faqJsonLd() for their
// structured data, so the markup always matches what readers can see.
// Native <details> keeps every answer in the HTML (crawlers and answer engines
// read it) while staying collapsed for readers.
function FaqSection({ id = "faq", title = "Frequently asked questions", faqs = [], className = "" }) {
  if (!faqs.length) return null;
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className={`py-16 bg-black ${className}`}>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 id={`${id}-heading`} className="font-display font-bold text-2xl sm:text-3xl tracking-tight text-white mb-6">
          {title}
        </h2>
        <div className="divide-y divide-white/10 rounded-2xl border border-white/10 bg-white/[0.02]">
          {faqs.map(({ question, answer }) => (
            <details key={question} className="group px-5">
              <summary className="flex min-h-[56px] cursor-pointer list-none items-center justify-between gap-4 py-4 text-left font-semibold text-white [&::-webkit-details-marker]:hidden">
                <h3 className="text-base sm:text-lg">{question}</h3>
                <ChevronDown className="h-5 w-5 shrink-0 text-gray-400 transition-transform group-open:rotate-180" aria-hidden="true" />
              </summary>
              <p className="pb-5 text-sm sm:text-base leading-relaxed text-gray-300">{answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
