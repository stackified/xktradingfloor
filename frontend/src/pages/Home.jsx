import React from 'react';
import Seo from '../components/shared/Seo.jsx';
import HeroSection from '../components/home/HeroSection.jsx';
import StatsSection from '../components/home/StatsSection.jsx';
import TopCompaniesTables from '../components/home/TopCompaniesTables.jsx';
import WhatIsXK from '../components/home/WhatIsXK.jsx';
import MissionResourcesSection from '../components/home/MissionResourcesSection.jsx';
import CommunitySection from '../components/home/CommunitySection.jsx';
import FeaturesQuadrantSection from '../components/home/FeaturesQuadrantSection.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import FreebiesSection from '../components/home/FreebiesSection.jsx';
import PodcastSection from '../components/home/PodcastSection.jsx';
import TradingJournalSection from '../components/home/TradingJournalSection.jsx';
import FeaturedEvents from '../components/home/FeaturedEvents.jsx';
import CTASection from '../components/home/CTASection.jsx';

function Home() {
  return (
    <div className="overflow-hidden">
      <Seo
        title=""
        description="Compare brokers and prop firms, explore verified trader profiles, track live spreads and payouts, and make confident trading decisions."
        path="/"
      />
      <HeroSection />
      <StatsSection />
      <TopCompaniesTables />
      <WhatIsXK />
      <MissionResourcesSection />
      <CommunitySection />
      <FeaturesQuadrantSection />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <FreebiesSection />
      <PodcastSection />
      <TradingJournalSection />
      <FeaturedEvents />
      <CTASection />
    </div>
  );
}

export default Home;


