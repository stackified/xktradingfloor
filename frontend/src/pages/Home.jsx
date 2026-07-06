import React from 'react';
import { Helmet } from 'react-helmet-async';
import HeroSection from '../components/home/HeroSection.jsx';
import WhatIsXK from '../components/home/WhatIsXK.jsx';
import MissionResourcesSection from '../components/home/MissionResourcesSection.jsx';
import CommunitySection from '../components/home/CommunitySection.jsx';
import FeaturesQuadrantSection from '../components/home/FeaturesQuadrantSection.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import FreebiesSection from '../components/home/FreebiesSection.jsx';
import PodcastSection from '../components/home/PodcastSection.jsx';
import FeaturedEvents from '../components/home/FeaturedEvents.jsx';
// import LatestBlogs from '../components/home/LatestBlogs.jsx';
import PodcastSponsorSection from '../components/home/PodcastSponsorSection.jsx';
import CTASection from '../components/home/CTASection.jsx';

function Home() {
  return (
    <div className="overflow-hidden">
      <Helmet>
        <title>XK Trading Floor | Trusted Forex, Prop Firm & Crypto Reviews</title>
        <meta name="description" content="Learn trading, compare brokers, discover prop firms, and read unbiased reviews from real traders." />
        <link rel="canonical" href="https://xktradingfloor.com/" />
      </Helmet>
      <HeroSection />
      <WhatIsXK />
      <MissionResourcesSection />
      <CommunitySection />
      <FeaturesQuadrantSection />
      <div id="how-it-works">
        <HowItWorks />
      </div>
      <FreebiesSection />
      <PodcastSection />
      <FeaturedEvents />
      {/* <LatestBlogs /> */}
      {/* <PodcastSponsorSection /> */}
      <CTASection />
    </div>
  );
}

export default Home;


