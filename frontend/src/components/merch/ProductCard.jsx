import React from 'react';
import { motion } from 'framer-motion';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function ProductCard({ product, onClick }) {
  return (
    <motion.div whileHover={{ y: -4, scale: 1.01 }} className="card overflow-hidden cursor-pointer hover:bg-gray-800/70" onClick={onClick}>
      <div className="h-44 w-full bg-muted">
        <ImageWithFallback src={product.image} fallback="/assets/placeholder.jpg" alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="card-body">
        <div className="text-xs text-blue-300">{product.category}</div>
        <div className="font-semibold">{product.name}</div>
        <div className="text-sm text-gray-300">₹{product.price}</div>
      </div>
    </motion.div>
  );
}

export default ProductCard;


