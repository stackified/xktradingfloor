import api from './api.js';

// Placeholder content fetchers. Swap to real API when backend is ready.
export async function fetchEvents() {
  // return api.get('/events');
  const { default: data } = await import('../models/events.json');
  return { data };
}

export async function fetchBlogPosts() {
  // return api.get('/blog');
  const { default: data } = await import('../models/blogPosts.json');
  return { data };
}

export async function fetchCompanies() {
  // return api.get('/companies');
  // Use the companies controller for consistency
  const { getAllCompanies } = await import('./companiesController.js');
  return getAllCompanies();
}

export async function fetchProducts() {
  // return api.get('/products');
  const { default: data } = await import('../models/products.json');
  return { data };
}


