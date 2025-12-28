import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import HeroAcademy from '../components/academy/HeroAcademy.jsx';
import EventsGrid from '../components/academy/EventsGrid.jsx';
import FreeResources from '../components/academy/FreeResources.jsx';
import PodcastSection from '../components/academy/PodcastSection.jsx';
import RegisterModal from '../components/academy/RegisterModal.jsx';
import { getUserCookie } from '../utils/cookies.js';

function Academy() {
  const navigate = useNavigate();
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || getUserCookie();
  const userRole = user?.role?.toLowerCase();
  const isAdmin = userRole === 'admin' || userRole === 'subadmin';

  const [modalOpen, setModalOpen] = React.useState(false);
  const [selectedEvent, setSelectedEvent] = React.useState(null);

  function handleOpenRegister(evt) {
    setSelectedEvent(evt);
    setModalOpen(true);
  }

  return (
    <div className="bg-black min-h-screen">
      <Helmet>
        <title>Academy | XK Trading Floor</title>
        <meta name="description" content="Master the markets with expert-led programs, live workshops, strategy sessions, and trading bootcamps." />
      </Helmet>
      <HeroAcademy />
      <div className="bg-black">
        {isAdmin && (
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-end gap-4">
              <Link
                to="/admin/events"
                className="group relative inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 backdrop-blur-md text-white/90 text-sm font-medium shadow-sm hover:bg-white/10 hover:border-white/20 hover:text-white hover:scale-105 hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <span className="relative z-10">Manage Events</span>
              </Link>
              <Link to="/admin/events/create" className="btn btn-primary">
                + Add Event
              </Link>
            </div>
          </section>
        )}
        <EventsGrid onOpenRegister={handleOpenRegister} />
        <FreeResources />
        <PodcastSection />
      </div>
      <RegisterModal isOpen={modalOpen} onClose={() => setModalOpen(false)} selectedEvent={selectedEvent} />
    </div>
  );
}

export default Academy;


