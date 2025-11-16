import React from 'react';
import { motion } from 'framer-motion';
import { getAllProducts } from '../../controllers/productsController.js';
import { Link, useNavigate } from 'react-router-dom';

function ProductCard({ product, onClick }) {
  return (
    <motion.div whileHover={{ y: -4 }} className="card overflow-hidden cursor-pointer" onClick={onClick}>
      <div className="h-44 w-full bg-muted">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="card-body">
        <div className="font-semibold">{product.name}</div>
        <div className="text-sm text-gray-300">₹{product.price}</div>
      </div>
    </motion.div>
  );
}

function MerchPreview() {
  const [products, setProducts] = React.useState([]);
  const navigate = useNavigate();

  React.useEffect(() => {
    (async () => setProducts(await getAllProducts()))();
  }, []);

  return (
    <section className="py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Official XK Merch</h2>
          <Link to="/merch" className="text-sm text-accent hover:underline">Shop Now</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.slice(0,4).map((p) => (
            <ProductCard key={p.id} product={p} onClick={() => navigate(`/merch/${p.id}`)} />
          ))}
        </div>
      </div>
    </section>
  );
}

export default MerchPreview;


