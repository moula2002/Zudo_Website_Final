import React, { useState } from 'react';
import { CreditCard, Truck, MapPin, Phone, User, CheckCircle2, ChevronRight, ArrowLeft } from 'lucide-react';

export default function CheckoutPage({ cartItems, onNavigate, user, onOrderSuccess }) {
  const [shippingData, setShippingData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: ''
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  const subtotal = cartItems.reduce((acc, item) => {
    const priceStr = String(item.price);
    const price = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
    return acc + (price * item.quantity);
  }, 0);
  
  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const handleInputChange = (e) => {
    setShippingData({ ...shippingData, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setLoading(true);

    const isB2B = localStorage.getItem('isB2B') === 'true';

    const orderPayload = {
      items: cartItems.map(item => {
        const priceStr = String(item.price);
        let basePrice = parseInt(priceStr.replace(/[^\d]/g, '')) || 0;
        
        // If B2B, apply 25% discount to the stored price
        if (isB2B) {
          basePrice = Math.floor(basePrice * 0.75);
        }

        return {
          product: item.id,
          quantity: item.quantity,
          price: basePrice
        };
      }),
      totalAmount: total,
      shippingAddress: shippingData,
      paymentMethod
    };

    try {
      const response = await fetch('https://zudo.onrender.com/api/orders', {
        method: 'POST',
        headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      if (paymentMethod === 'Razorpay') {
        // Razorpay logic would go here
        // For demo, we just proceed to success
        handleRazorpayPayment(data);
      } else {
        setOrderComplete(true);
        if (onOrderSuccess) onOrderSuccess();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpayPayment = (order) => {
    const options = {
      key: "rzp_test_placeholder", // Replace with real key
      amount: order.totalAmount * 100,
      currency: "INR",
      name: "Zudo",
      description: "Order Payment",
      order_id: order.razorpayOrderId,
      handler: async function (response) {
        // Verify payment on backend
        const verifyResponse = await fetch('https://zudo.onrender.com/api/orders/verify', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(response)
        });
        if (verifyResponse.ok) {
          setOrderComplete(true);
          if (onOrderSuccess) onOrderSuccess();
        }
      },
      prefill: {
        name: user?.name,
        email: user?.email,
        contact: shippingData.phone
      },
      theme: { color: "#059669" }
    };
    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  if (orderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-[scaleIn_0.5s_ease-out]">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-500 max-w-md mb-8">Thank you for shopping with Zudo. Your fresh groceries will be delivered shortly.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 hover:bg-emerald-700 transition-all transform hover:-translate-y-1"
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <button 
        onClick={() => onNavigate('cart')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold mb-8 transition-colors group"
      >
        <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
        Back to Cart
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left: Shipping & Payment */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="text-emerald-600" size={24} />
              Shipping Address
            </h3>
            <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="name"
                    value={shippingData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your name" 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                <div className="relative">
                  <CheckCircle2 size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="email" 
                    name="email"
                    value={shippingData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email" 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Phone Number</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="tel" 
                    name="phone"
                    value={shippingData.phone}
                    onChange={handleInputChange}
                    placeholder="10-digit mobile number" 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Pincode</label>
                <div className="relative">
                  <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    name="pincode"
                    value={shippingData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode" 
                    className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                    required
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Delivery Address</label>
                <textarea 
                  name="address"
                  value={shippingData.address}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Street, locality, landmark, etc." 
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold resize-none"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">City</label>
                <input 
                  type="text" 
                  name="city"
                  value={shippingData.city}
                  onChange={handleInputChange}
                  placeholder="Enter your city" 
                  className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                  required
                />
              </div>
            </form>
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <CreditCard className="text-emerald-600" size={24} />
              Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'COD' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-emerald-600' : 'border-gray-300'}`}>
                    {paymentMethod === 'COD' && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Cash on Delivery</p>
                    <p className="text-xs text-gray-500">Pay when you receive</p>
                  </div>
                </div>
                <Truck size={24} className="text-gray-400" />
              </button>

              <button 
                onClick={() => setPaymentMethod('Razorpay')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'Razorpay' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'Razorpay' ? 'border-emerald-600' : 'border-gray-300'}`}>
                    {paymentMethod === 'Razorpay' && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900">Online Payment</p>
                    <p className="text-xs text-gray-500">Razorpay / UPI / Cards</p>
                  </div>
                </div>
                <div className="px-2 py-1 bg-blue-50 rounded-lg text-[10px] font-black text-blue-600 uppercase tracking-tighter italic">Razorpay</div>
              </button>
            </div>
          </section>
        </div>

        {/* Right: Order Summary */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 sticky top-28">
            <h3 className="text-xl font-black text-gray-900 mb-6">Order Summary</h3>
            <div className="space-y-4 mb-8">
              {cartItems.map(item => (
                <div key={item.id} className="flex justify-between items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gray-50 flex-shrink-0 overflow-hidden border border-gray-100">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">{item.name}</p>
                      <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-gray-900">{item.price}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-50">
              <div className="flex justify-between text-gray-500">
                <span className="font-bold">Subtotal</span>
                <span className="font-black text-gray-900">₹{subtotal}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span className="font-bold">Shipping</span>
                <span className="font-black text-emerald-600">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              <div className="flex justify-between pt-4 mt-2 border-t-2 border-gray-100">
                <span className="text-lg font-black text-gray-900">Total</span>
                <span className="text-2xl font-black text-emerald-600">₹{total}</span>
              </div>
            </div>

            <button 
              onClick={handlePlaceOrder}
              disabled={loading || !shippingData.name || !shippingData.email || !shippingData.phone || !shippingData.address || !shippingData.city || !shippingData.pincode}
              className={`w-full mt-8 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
            >
              {loading ? (
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Place Order <ChevronRight size={20} />
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-gray-400 mt-4 font-bold uppercase tracking-widest">Secure SSL Encrypted Checkout</p>
          </div>
        </div>
      </div>
    </div>
  );
}
