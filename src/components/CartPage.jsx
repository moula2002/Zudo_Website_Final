import React from 'react';
import { Trash2, ArrowLeft, ShoppingBag } from 'lucide-react';

export default function CartPage({ cartItems, onUpdateQuantity, onRemove, onNavigate }) {
  const subtotal = cartItems.reduce((acc, item) => {
    // Parse price string '₹140/kg' -> 140
    const price = parseInt(item.price.replace(/\D/g, ''));
    return acc + (price * item.quantity);
  }, 0);

  const deliveryFee = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-40 h-40 bg-emerald-50 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag size={64} className="text-emerald-500" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Your cart is empty</h2>
        <p className="text-gray-500 mb-8 font-medium">Looks like you haven't added anything to your cart yet.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-1"
        >
          Start Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 min-h-screen">
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> Continue Shopping
      </button>

      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-10">Shopping Cart</h1>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Cart Items List */}
        <div className="w-full lg:w-2/3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            {cartItems.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-6 border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                </div>
                
                <div className="flex-grow">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{item.name}</h3>
                  <div className="text-emerald-600 font-extrabold">{item.price}</div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center bg-gray-100 rounded-full p-1">
                    <button onClick={() => onUpdateQuantity(item.id, -1)} className="w-8 h-8 rounded-full bg-white text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition-colors">-</button>
                    <span className="w-10 text-center font-bold text-gray-900">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, 1)} className="w-8 h-8 rounded-full bg-white text-gray-700 font-bold shadow-sm hover:bg-gray-50 transition-colors">+</button>
                  </div>
                  
                  <button onClick={() => onRemove(item.id)} className="w-10 h-10 rounded-full bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="w-full lg:w-1/3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
            <h2 className="text-xl font-extrabold text-gray-900 mb-6">Order Summary</h2>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Subtotal ({cartItems.length} items)</span>
                <span>₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-600 font-medium">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-emerald-600 font-bold">Free</span> : `₹${deliveryFee}`}</span>
              </div>
              {subtotal < 500 && (
                <div className="text-xs text-emerald-500 bg-emerald-50 p-2 rounded-lg">
                  Add ₹{500 - subtotal} more to get Free Delivery!
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-4 mb-8">
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-3xl font-extrabold text-emerald-600">₹{total}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 text-right">Inclusive of all taxes</p>
            </div>

            <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/30 transform hover:-translate-y-1 transition-all">
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


