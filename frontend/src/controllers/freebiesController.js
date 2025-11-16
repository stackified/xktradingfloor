export async function getAllFreebies() {
  return import('../models/freebiesData.js').then(m => m.freebies);
}


