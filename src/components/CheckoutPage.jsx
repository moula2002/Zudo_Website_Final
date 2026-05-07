import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, MapPin, Phone, User, CheckCircle2, ChevronRight, ArrowLeft, Search } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { API_URL } from '../config';

export default function CheckoutPage({ cartItems, onNavigate, user, onOrderSuccess }) {
  const { address: liveAddress, city: liveCity, refresh: getLiveLocation, loading: locationLoading } = useLocation();
  const [shippingData, setShippingData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: '',
    city: '',
    pincode: '',
    lat: null,
    lng: null
  });
  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [loading, setLoading] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [placedOrder, setPlacedOrder] = useState(null);
  const [showSaved, setShowSaved] = useState(false);
  const savedAddresses = user?.savedAddresses || [];

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
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: basePrice
        };
      }),
      totalAmount: total,
      shippingAddress: shippingData,
      paymentMethod
    };

    try {
      const response = await fetch(`${API_URL}/orders`, {
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
        setPlacedOrder(data);
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
        const verifyResponse = await fetch(`${API_URL}/orders/verify`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(response)
        });
        if (verifyResponse.ok) {
          setPlacedOrder(order); // 'order' is passed as argument to handleRazorpayPayment
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
        
        {placedOrder?.deliveryOtp && (
          <div className="mb-10 bg-[#107569] text-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/20 relative overflow-hidden group max-w-sm w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200 mb-3">Your Delivery OTP</p>
            <p className="text-5xl font-black tracking-[0.5em] font-mono mb-4">{placedOrder.deliveryOtp}</p>
            <p className="text-[10px] font-bold text-emerald-100/60 leading-tight">Please keep this code safe. You'll need to share it with the delivery partner at the time of collection.</p>
          </div>
        )}

        <button 
          onClick={() => onNavigate('home')}
          className="px-10 py-4 bg-gray-900 text-white font-black rounded-2xl shadow-xl shadow-gray-900/20 hover:bg-black transition-all transform hover:-translate-y-1 active:scale-95 flex items-center gap-3"
        >
          Continue Shopping
          <ChevronRight size={20} />
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
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                <MapPin className="text-emerald-600" size={24} />
                Shipping Address
              </h3>
            </div>

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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">Delivery Address</label>
                  <div className="flex gap-2">
                    {savedAddresses.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setShowSaved(!showSaved)}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:border-emerald-500 transition-all active:scale-95"
                      >
                        <User size={12} />
                        {showSaved ? 'Close' : 'Saved'}
                      </button>
                    )}
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          const loc = await getLiveLocation();
                          if (loc && loc.address) {
                            setShippingData(prev => ({
                              ...prev,
                              address: loc.address,
                              city: loc.city,
                              pincode: loc.pincode,
                              lat: loc.lat,
                              lng: loc.lng
                            }));
                          }
                        } catch (err) {
                          console.error('Location fetch failed:', err);
                        }
                      }}
                      className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all active:scale-95"
                    >
                      {locationLoading ? (
                        <div className="w-2.5 h-2.5 border-2 border-emerald-700/30 border-t-emerald-700 rounded-full animate-spin" />
                      ) : <Search size={12} />}
                      Live Location
                    </button>
                  </div>
                </div>

                {showSaved && savedAddresses.length > 0 && (
                  <div className="mb-4 grid grid-cols-1 gap-2 p-3 bg-gray-50 rounded-2xl animate-[fadeIn_0.2s_ease-out] border border-gray-100 max-h-60 overflow-y-auto">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 px-1">Select saved location</p>
                    {savedAddresses.map((addr) => (
                      <button
                        key={addr._id || addr.id}
                        type="button"
                        onClick={() => {
                          setShippingData(prev => ({
                            ...prev,
                            address: addr.address || addr.text,
                            city: addr.city || '',
                            pincode: addr.pincode || '',
                            lat: addr.lat,
                            lng: addr.lng
                          }));
                          setShowSaved(false);
                        }}
                        className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-500 transition-all text-left group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-1 h-3 w-3 rounded-full border-2 border-emerald-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="h-1.5 w-1.5 bg-emerald-600 rounded-full" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-800 line-clamp-1">{addr.address || addr.text}</p>
                            <p className="text-[9px] text-gray-400 font-bold uppercase">
                              {addr.city} {addr.pincode && `• ${addr.pincode}`}
                            </p>
                          </div>
                        </div>
                        {addr.isDefault && (
                          <span className="px-1.5 py-0.5 bg-emerald-600 text-white text-[7px] font-black uppercase tracking-widest rounded">Primary</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
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
