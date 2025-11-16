export async function getAllPodcasts() {
  return import('../models/podcastsData.js').then(m => m.podcasts);
}


