export async function getAllProducts() {
  return import('../models/productsData.js').then(m => m.products);
}

export async function getProductById(id) {
  const list = await import('../models/productsData.js').then(m => m.products);
  return list.find(p => p.id === parseInt(id));
}


