import React from 'react';
import Seo from '../components/shared/Seo.jsx';
import HeroSection from '../components/home/HeroSection.jsx';
import StatsSection from '../components/home/StatsSection.jsx';
import TopCompaniesTables from '../components/home/TopCompaniesTables.jsx';
import WhatIsXK from '../components/home/WhatIsXK.jsx';
import MissionResourcesSection from '../components/home/MissionResourcesSection.jsx';
import CommunitySection from '../components/home/CommunitySection.jsx';
import FeaturesQuadrantSection from '../components/home/FeaturesQuadrantSection.jsx';
// Hidden per client request (revertible): "How Does It Work?" + "Freebies".
// Uncomment the import and its usage below to restore.
// import HowItWorks from '../components/home/HowItWorks.jsx';
// import FreebiesSection from '../components/home/FreebiesSection.jsx';
import PodcastSection from '../components/home/PodcastSection.jsx';
import TradingJournalSection from '../components/home/TradingJournalSection.jsx';
import FeaturedEvents from '../components/home/FeaturedEvents.jsx';
import LatestBlogs from '../components/home/LatestBlogs.jsx';
import CTASection from '../components/home/CTASection.jsx';
import HydrateChunk from '../components/shared/HydrateChunk.jsx';

function Home() {
  return (
    <div className="overflow-hidden">
      <Seo
        title=""
        description="Compare brokers and prop firms, explore verified trader profiles, compare spreads and payouts, and make confident trading decisions."
        path="/"
      />
      <HeroSection />
      {/* Everything below the hero hydrates as its own chunk; see HydrateChunk. */}
      <HydrateChunk><StatsSection /></HydrateChunk>
      <HydrateChunk><TopCompaniesTables /></HydrateChunk>
      <HydrateChunk><WhatIsXK /></HydrateChunk>
      <HydrateChunk><MissionResourcesSection /></HydrateChunk>
      <HydrateChunk><CommunitySection /></HydrateChunk>
      <HydrateChunk><FeaturesQuadrantSection /></HydrateChunk>
      {/* Hidden per client request (revertible) — restore by uncommenting:
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <FreebiesSection />
      */}
      <HydrateChunk><PodcastSection /></HydrateChunk>
      <HydrateChunk><TradingJournalSection /></HydrateChunk>
      <HydrateChunk><FeaturedEvents /></HydrateChunk>
      <HydrateChunk><LatestBlogs /></HydrateChunk>
      <HydrateChunk><CTASection /></HydrateChunk>
    </div>
  );
}

export default Home;


