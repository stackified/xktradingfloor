import React from 'react';
import { useDispatch } from 'react-redux';
import { addToCart } from '../../redux/slices/cartSlice.js';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function ProductDetailsView({ product }) {
  const dispatch = useDispatch();
  const [size, setSize] = React.useState(product.sizes?.[0] || null);
  const [qty, setQty] = React.useState(1);

  function handleAdd() {
    dispatch(addToCart({ id: product.id, name: product.name, price: product.price, size, image: product.image, quantity: qty }));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="card overflow-hidden">
        <ImageWithFallback src={product.image} fallback="/assets/placeholder.jpg" alt={product.name} className="w-full h-96 object-cover" />
      </div>
      <div className="card">
        <div className="card-body">
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <div className="text-gray-300 my-2">{product.description}</div>
          <div className="text-xl font-semibold">₹{product.price}</div>
          {product.sizes?.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-400 mb-1">Size</div>
              <select className="input w-40" value={size || ''} onChange={(e)=>setSize(e.target.value)}>
                {product.sizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}
          <div className="flex items-center gap-2 my-4">
            <label className="text-sm">Qty</label>
            <input type="number" min={1} value={qty} onChange={(e)=>setQty(Number(e.target.value))} className="input w-24" />
            <div className={`text-xs ${product.stock>0?'text-green-400':'text-red-400'}`}>{product.stock>0? 'In Stock' : 'Sold Out'}</div>
          </div>
          <button className="btn btn-primary w-full rounded-full" onClick={handleAdd} disabled={product.stock===0}>Add to Cart</button>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailsView;


