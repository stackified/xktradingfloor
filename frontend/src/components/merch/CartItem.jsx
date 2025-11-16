import React from 'react';
import { useDispatch } from 'react-redux';
import { updateQuantity, removeFromCart } from '../../redux/slices/cartSlice.js';
import ImageWithFallback from '../shared/ImageWithFallback.jsx';

function CartItem({ item }) {
  const dispatch = useDispatch();
  return (
    <div className="flex gap-3 items-center">
      <div className="h-16 w-16 rounded bg-muted overflow-hidden">
        {item.image && <ImageWithFallback src={item.image} fallback="/assets/placeholder.jpg" alt={item.name} className="h-full w-full object-cover" />}
      </div>
      <div className="flex-1">
        <div className="text-sm font-semibold">{item.name}</div>
        <div className="text-xs text-gray-400">{item.size ? `Size: ${item.size}` : 'One Size'}</div>
        <div className="text-sm">₹{item.price}</div>
      </div>
      <div className="flex items-center gap-2">
        <input className="input w-16" type="number" min={1} value={item.quantity} onChange={(e)=>dispatch(updateQuantity({ id: item.id, size: item.size, quantity: Number(e.target.value) }))} />
        <button className="text-sm text-red-400 hover:text-red-300" onClick={()=>dispatch(removeFromCart({ id: item.id, size: item.size }))}>Remove</button>
      </div>
    </div>
  );
}

export default CartItem;


