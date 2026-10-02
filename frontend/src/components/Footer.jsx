import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle } from 'lucide-react';
import { getAssetPath } from '../utils/assets.js';
import DiscordLink from './shared/DiscordLink.jsx';


function Footer() {
  return (
    <footer className="mt-12 border-t border-border/60 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <Link to="/" className="flex items-center mb-4">
            <img
              src={getAssetPath("/assets/navbar logo.png")}
              alt="XK Trading Floor Logo"
              width="640"
              height="141"
              className="h-16 w-auto rounded object-contain"
            />
          </Link>
          <p className="text-sm text-gray-400">Learn, trade, and grow with a modern trading community.</p>
        </div>
        <div>
          <h2 className="font-semibold text-base mb-3">Links</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/events" className="hover:text-white">Events</Link></li>
            <li><Link to="/blog" className="hover:text-white">Blog</Link></li>
            <li><Link to="/blog/category/learn-trading" className="hover:text-white">Learn Trading</Link></li>
            <li><Link to="/reviews" className="hover:text-white">Reviews</Link></li>
            <li><Link to="/live-spreads" className="hover:text-white">Live Spreads</Link></li>
            <li><Link to="/payouts" className="hover:text-white">Payout Tracker</Link></li>
            {/* <li><Link to="/merch" className="hover:text-white">Merch</Link></li> */} {/* Hidden - uncomment to re-enable */}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-base mb-3">Company</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><Link to="/about" className="hover:text-white">About</Link></li>
            <li><Link to="/contact" className="hover:text-white">Contact</Link></li>
            <li><Link to="/services" className="hover:text-white">For Brands</Link></li>
            <li><Link to="/privacy-policy" className="hover:text-white">Privacy</Link></li>
            <li><Link to="/terms" className="hover:text-white">Terms</Link></li>
          </ul>
        </div>
        <div>
          <h2 className="font-semibold text-base mb-3">Stay updated</h2>
          {/* The client chose Discord over an email newsletter: updates,
              events and trading discussion all happen there. */}
          <p className="mb-3 text-sm text-gray-300">
            Get updates, event news and trading discussion in our Discord community.
          </p>
          <DiscordLink
            className="btn btn-primary inline-flex items-center gap-2"
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            Join our Discord
          </DiscordLink>
        </div>
      </div>
      {/* One template string, not `© {year} XK…`: that JSX yields three adjacent text
          nodes, which the browser merges when parsing the prerendered HTML, so
          hydration saw one node where React expected three and threw #418. */}
      <div className="border-t border-border/60 py-4 text-center text-xs text-gray-400">{`© ${new Date().getFullYear()} XK Trading Floor`}</div>
    </footer>
  );
}

export default Footer;


