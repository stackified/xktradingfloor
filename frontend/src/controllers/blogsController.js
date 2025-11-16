export async function getAllBlogs() {
  return import('../models/blogsData.js').then(m => m.blogs);
}

export async function getBlogById(id) {
  const list = await import('../models/blogsData.js').then(m => m.blogs);
  return list.find((b) => b.id === parseInt(id));
}



