// Pull question/answer pairs out of article or review HTML so the page can
// publish FAQPage structured data (answer engines and AI search read it).
// Only content that is visibly on the page is used, as Google requires.
//
// Recognised:
//   - A heading such as "FAQs" / "Frequently Asked Questions", followed by
//     questions: sub-headings, or paragraphs like "<strong>Q: ...?</strong>",
//     each followed by its answer, up to the next heading of the same level.
//   - <details><summary>Question?</summary>Answer</details> anywhere.

const FAQ_HEADING = /\b(faqs?|frequently asked questions?)\b/i;
const MAX_ITEMS = 12;
const MAX_ANSWER = 700;

const clean = (t) => String(t || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
const stripQ = (t) => clean(t).replace(/^(q|question)\s*[:.)-]\s*/i, "");
const stripA = (t) => clean(t).replace(/^(a|answer)\s*[:.)-]\s*/i, "");
const level = (el) => (/^H[1-6]$/.test(el.tagName) ? Number(el.tagName[1]) : 0);

function isQuestionNode(el) {
  if (!el) return false;
  const text = clean(el.textContent);
  if (!text || text.length > 250) return false;
  if (level(el) >= 3) return text.endsWith("?") || /^(q|question)\s*[:.)-]/i.test(text);
  if (el.tagName === "P" || el.tagName === "DIV") {
    // A whole-line bold question, e.g. <p><strong>Q: Is it true?</strong></p>
    const strong = el.querySelector("strong, b");
    const strongText = clean(strong?.textContent);
    return Boolean(strongText) && strongText.length >= text.length - 2 &&
      (strongText.endsWith("?") || /^(q|question)\s*[:.)-]/i.test(strongText));
  }
  return false;
}

export function extractFaqs(html) {
  if (!html || typeof DOMParser === "undefined") return [];
  const doc = new DOMParser().parseFromString(String(html), "text/html");
  const out = [];
  const seen = new Set();
  const push = (q, a) => {
    const question = stripQ(q);
    const answer = stripA(a);
    if (!question || !answer || answer.length < 2 || seen.has(question.toLowerCase())) return;
    seen.add(question.toLowerCase());
    out.push({
      question,
      answer: answer.length > MAX_ANSWER ? `${answer.slice(0, MAX_ANSWER - 1).trimEnd()}…` : answer,
    });
  };

  // 1. <details><summary> blocks.
  doc.querySelectorAll("details").forEach((d) => {
    const summary = d.querySelector("summary");
    if (!summary) return;
    const q = summary.textContent;
    const clone = d.cloneNode(true);
    clone.querySelector("summary")?.remove();
    push(q, clone.textContent);
  });

  // 2. FAQ sections under a heading. Walk the document in order, flattening
  // wrapper divs so designed pages (sections/cards) work too.
  const blocks = [...doc.body.querySelectorAll("h1, h2, h3, h4, h5, h6, p, li, div")].filter(
    (el) => level(el) || !el.querySelector("h1, h2, h3, h4, h5, h6, p, li, div")
  );
  for (let i = 0; i < blocks.length && out.length < MAX_ITEMS; i++) {
    const h = blocks[i];
    if (!level(h) || !FAQ_HEADING.test(clean(h.textContent))) continue;
    const sectionLevel = level(h);
    let question = null;
    let answer = [];
    const flush = () => {
      if (question) push(question, answer.join(" "));
      question = null;
      answer = [];
    };
    for (let j = i + 1; j < blocks.length; j++) {
      const el = blocks[j];
      if (level(el) && level(el) <= sectionLevel) break;
      if (isQuestionNode(el)) {
        flush();
        question = el.textContent;
      } else if (question && !level(el) && !/^[\s\-_–—*=~]*$/.test(el.textContent || "")) {
        // Skip empty spacer paragraphs and rows of dashes used as dividers.
        answer.push(el.textContent);
      }
      i = j;
    }
    flush();
  }

  return out.slice(0, MAX_ITEMS);
}

export function faqJsonLd(faqs) {
  if (!Array.isArray(faqs) || faqs.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
}
