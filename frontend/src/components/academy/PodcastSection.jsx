import React from 'react';
import { motion } from 'framer-motion';
import { getAllPodcasts } from '../../controllers/podcastsController.js';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function PodcastCard({ item }) {
  const [playing, setPlaying] = React.useState(false);
  return (
    <motion.div whileHover={{ y: -4 }} className="min-w-[260px] card overflow-hidden">
      <div className="h-36 w-full bg-muted">
        <ImageWithFallback src={item.thumbnail} fallback="/assets/placeholder.jpg" alt={item.title} className="h-full w-full object-cover" />
      </div>
      <div className="card-body">
        <div className="text-xs text-gray-400">{item.duration}</div>
        <div className="font-semibold mt-1 line-clamp-2">{item.title}</div>
        <button className="btn btn-secondary rounded-full mt-3" onClick={() => setPlaying(p => !p)}>
          {playing ? 'Pause' : 'Play'}
        </button>
      </div>
    </motion.div>
  );
}

function PodcastSection() {
  const [list, setList] = React.useState([]);

  React.useEffect(() => {
    (async () => setList(await getAllPodcasts()))();
  }, []);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">XK Talks — Trading Insights on the Go</h2>
          <a href="https://spotify.com" target="_blank" rel="noreferrer" className="text-sm text-accent hover:underline">Listen on Spotify</a>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-2">
          {list.map(p => (
            <PodcastCard key={p.id} item={p} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default PodcastSection;


