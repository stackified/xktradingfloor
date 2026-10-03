import React from "react";
import { Link } from "react-router-dom";
import { Star, ShieldCheck, MessageSquareText, BarChart3, Wallet, CalendarDays, HandCoins, Mail } from "lucide-react";
import Seo from "../components/shared/Seo.jsx";
import FaqSection from "../components/shared/FaqSection.jsx";
import { faqJsonLd } from "../utils/faq.js";
import { breadcrumbJsonLd } from "../utils/structuredData.js";

// /how-we-rate: how XK's ratings, reviews, Verified Trader badges and data
// work, and how XK makes money. Answer engines and AI assistants weigh a
// review site by whether it explains its methods and conflicts of interest;
// in Oct 2026 Perplexity described XK as lacking exactly this. Every statement
// here must stay true to the code and the team's process: the TrustScore
// formula is utils/trustScore.js, review rules are the backend's.

const TRUST_LEVELS = [
  ["90–100", "Excellent"],
  ["80–89", "Great"],
  ["70–79", "Good"],
  ["60–69", "Fair"],
  ["Below 60", "Poor"],
];

const FAQS = [
  {
    question: "How is the XK TrustScore calculated?",
    answer:
      "The TrustScore is the average star rating from trader reviews (1 to 5 stars) multiplied by 20, giving a score from 0 to 100. 90 and above is Excellent, 80 to 89 Great, 70 to 79 Good, 60 to 69 Fair and below 60 Poor. A company with no reviews has no score.",
  },
  {
    question: "Who writes the reviews on XK Trading Floor?",
    answer:
      "Traders who use the companies. Anyone with an XK Trading Floor account can review a broker, prop firm or crypto platform, once per company, and can edit their review later. Reviewers can attach a screenshot, for example of their account, challenge dashboard or payout, as proof.",
  },
  {
    question: "Does XK Trading Floor get paid by brokers or prop firms?",
    answer:
      "Yes. XK Trading Floor earns a commission when you open an account or buy a challenge through our links or promo codes, and can also earn from sponsored content and featured placements. Commissions and partnerships do not change a company's rating or TrustScore, which are calculated only from trader reviews.",
  },
  {
    question: "What does the Verified Trader badge mean?",
    answer:
      "A trader applies from their profile and uploads proof of their trading, such as broker statements or payout proofs. The XK team reviews the documents, holds a short call with the trader and then approves or declines the application. The badge confirms XK checked the trader's evidence; it is not a promise of future results.",
  },
  {
    question: "Are the spreads on XK Trading Floor live?",
    answer:
      "The spread comparison is built from Myfxbook's public spread data, collected automatically and corrected by the XK team where needed. Until the live feed is public, the page shows sample figures and labels them as sample data. When live data is shown, the page says Live and shows when it was last updated.",
  },
  {
    question: "Is the payout tracker real data?",
    answer:
      "Not yet. The payout tracker currently shows sample data and is labelled as such. Real, verified payout records will replace it as they are collected.",
  },
];

function Section({ icon: Icon, id, title, children }) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24 rounded-2xl border border-white/10 bg-white/[0.02] p-6 sm:p-8">
      <div className="mb-4 flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10">
          <Icon className="h-5 w-5 text-blue-400" aria-hidden="true" />
        </span>
        <h2 id={`${id}-heading`} className="font-display text-xl font-bold text-white sm:text-2xl">
          {title}
        </h2>
      </div>
      <div className="space-y-3 text-[15px] leading-relaxed text-gray-300">{children}</div>
    </section>
  );
}

function HowWeRate() {
  return (
    <div className="bg-black text-white">
      <Seo
        title="How We Rate Brokers, Prop Firms and Traders"
        description="How XK Trading Floor calculates TrustScores, collects trader reviews, verifies traders, sources spreads and payouts, and makes money. Our methods and disclosures in one place."
        path="/how-we-rate"
        jsonLd={[
          breadcrumbJsonLd([
            { name: "Home", url: "/" },
            { name: "How we rate", url: "/how-we-rate" },
          ]),
          faqJsonLd(FAQS),
        ]}
      />

      <header className="mx-auto max-w-4xl px-4 pb-10 pt-14 text-center sm:px-6 lg:px-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
          How We{" "}
          <span className="bg-gradient-to-r from-blue-400 via-blue-300 to-blue-500 bg-clip-text text-transparent">
            Rate and Review
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-gray-300 sm:text-lg">
          How the ratings, reviews, Verified Trader badges and data on XK Trading Floor work, where the numbers come
          from, and how we make money.
        </p>
      </header>

      <div className="mx-auto max-w-4xl space-y-6 px-4 pb-6 sm:px-6 lg:px-8">
        <Section icon={Star} id="trustscore" title="Ratings and the TrustScore">
          <p>
            Every broker, prop firm and crypto platform on XK has a star rating and a TrustScore, both calculated only
            from trader reviews.
          </p>
          <ul className="list-disc space-y-1 pl-5">
            <li>The star rating is the average of all review ratings, from 1 to 5 stars.</li>
            <li>The TrustScore is that average multiplied by 20, on a scale of 0 to 100.</li>
            <li>A company with no reviews has no score and is listed after the rated ones.</li>
            <li>Rankings such as &ldquo;Top Rated&rdquo; sort by TrustScore, then by number of reviews.</li>
          </ul>
          <div className="overflow-x-auto">
            <table className="mt-2 w-full max-w-sm text-left text-sm">
              <caption className="sr-only">TrustScore levels</caption>
              <thead className="text-gray-400">
                <tr>
                  <th scope="col" className="py-1 pr-6 font-medium">TrustScore</th>
                  <th scope="col" className="py-1 font-medium">Level</th>
                </tr>
              </thead>
              <tbody>
                {TRUST_LEVELS.map(([range, level]) => (
                  <tr key={range} className="border-t border-white/10">
                    <td className="py-1.5 pr-6">{range}</td>
                    <td className="py-1.5">{level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section icon={MessageSquareText} id="reviews" title="Trader reviews">
          <ul className="list-disc space-y-1 pl-5">
            <li>Reviews are written by traders. Anyone with an XK Trading Floor account can review a company.</li>
            <li>One review per trader per company; traders can edit their own review later.</li>
            <li>
              Reviewers can attach a screenshot as proof, for example of their account, challenge dashboard or a
              payout. Please hide personal details such as account numbers before uploading.
            </li>
            <li>
              The XK team can flag and hide reviews that look fake, abusive or like spam. If you think a review breaks
              these rules, <Link to="/contact" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">tell us</Link>.
            </li>
          </ul>
          <p>
            Reviews are the opinions of the traders who wrote them, not XK Trading Floor&rsquo;s verdict. Read them
            alongside the company&rsquo;s own terms.{" "}
            <Link to="/reviews" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              Browse company reviews
            </Link>
            .
          </p>
        </Section>

        <Section icon={ShieldCheck} id="verified-traders" title="Verified Trader badges">
          <ol className="list-decimal space-y-1 pl-5">
            <li>The trader applies from their XK profile.</li>
            <li>They upload proof of their trading, such as broker statements or payout proofs.</li>
            <li>The XK team reviews the documents and holds a short call with the trader.</li>
            <li>The application is approved or declined.</li>
          </ol>
          <p>
            The badge confirms that XK checked the trader&rsquo;s evidence. It is not a promise of future results or a
            recommendation to copy anyone&rsquo;s trades.{" "}
            <Link to="/reviews/traders" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              See verified traders
            </Link>
            .
          </p>
        </Section>

        <Section icon={BarChart3} id="spreads" title="Spread comparison">
          <p>
            The{" "}
            <Link to="/live-spreads" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              spread comparison
            </Link>{" "}
            uses Myfxbook&rsquo;s public spread data for each broker, collected automatically. The XK team corrects
            figures where a broker&rsquo;s data is missing or wrong.
          </p>
          <p>
            Until the live feed is public, the page shows sample figures and labels them as sample data. When live data
            is shown, the page says <span className="text-white">Live</span> and shows when it was last updated.
            Spreads change constantly, so always check them with the broker before you trade.
          </p>
        </Section>

        <Section icon={Wallet} id="payouts" title="Payout tracker">
          <p>
            The{" "}
            <Link to="/payouts" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              payout tracker
            </Link>{" "}
            currently shows <span className="text-white">sample data</span>, labelled on the page. Real, verified
            payout records will replace it as they are collected.
          </p>
        </Section>

        <Section icon={CalendarDays} id="events" title="Events">
          <p>
            Expos, conferences, webinars and meetups are researched and added by the XK team, with links to the
            official organiser. Dates and times are shown in the event&rsquo;s local time.{" "}
            <Link to="/events" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              See upcoming events
            </Link>
            .
          </p>
        </Section>

        <Section icon={HandCoins} id="disclosure" title="How XK Trading Floor makes money">
          <p>
            XK Trading Floor earns a <span className="text-white">commission when you sign up through our links</span>
            : when you open an account with a broker, or buy a prop-firm challenge, using an XK link or promo code, the
            company pays us a share. It costs you nothing extra, and the promo codes often save you money.
          </p>
          <p>
            We can also earn from sponsored content and featured placements (see{" "}
            <Link to="/services" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              For Brands
            </Link>
            ).
          </p>
          <p>
            Commissions and partnerships do not change a company&rsquo;s star rating or TrustScore: those are
            calculated only from trader reviews, by the formula above.
          </p>
          <p>
            Nothing on XK Trading Floor is financial advice. Trading carries a high risk of losing money; do your own
            research before choosing a broker or prop firm.
          </p>
        </Section>

        <Section icon={Mail} id="corrections" title="Corrections">
          <p>
            Found something wrong, outdated or missing? Email{" "}
            <a href="mailto:x.tradersz@gmail.com" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              x.tradersz@gmail.com
            </a>{" "}
            or use the{" "}
            <Link to="/contact" className="text-blue-400 underline underline-offset-2 hover:text-blue-300">
              contact form
            </Link>
            . Companies listed on XK can contact us the same way to update their details.
          </p>
        </Section>
      </div>

      <FaqSection id="how-we-rate-faq" faqs={FAQS} />
    </div>
  );
}

export default HowWeRate;
