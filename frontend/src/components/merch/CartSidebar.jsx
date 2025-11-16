import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { clearCart } from '../../redux/slices/cartSlice.js';
import CartItem from './CartItem.jsx';

function CartSidebar({ open, onClose }) {
  const items = useSelector(state => state.cart.items);
  const dispatch = useDispatch();
  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-full sm:w-[380px] bg-background border-l border-border transform transition-transform ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 flex items-center justify-between border-b border-border">
          <div className="font-semibold">Your Cart</div>
          <button onClick={onClose}>✕</button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100%-180px)]">
          {items.length === 0 ? (
            <div className="text-center text-gray-400 py-10">Your cart is empty.</div>
          ) : (
            items.map(i => <CartItem key={`${i.id}-${i.size || 'one'}`} item={i} />)
          )}
        </div>
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm text-gray-400">Subtotal</div>
            <div className="font-semibold">₹{subtotal}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary flex-1" onClick={onClose}>Continue Shopping</button>
            <button className="btn btn-primary flex-1" onClick={()=>alert('Checkout flow will integrate with gateway later.')}>Proceed to Checkout</button>
          </div>
          {items.length > 0 && <button className="text-xs text-red-400 mt-2" onClick={()=>dispatch(clearCart())}>Clear Cart</button>}
        </div>
      </div>
    </div>
  );
}

export default CartSidebar;


