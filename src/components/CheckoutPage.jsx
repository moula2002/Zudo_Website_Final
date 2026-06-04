import React, { useState, useEffect } from 'react';
import { CreditCard, Truck, MapPin, Phone, User, CheckCircle2, ChevronRight, ArrowLeft, Search, AlertTriangle, QrCode, Banknote, Clock, Calendar } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { API_URL, cleanImageUrl } from '../config';

export default function CheckoutPage({ cartItems, onNavigate, user, onOrderSuccess }) {
  const { address: liveAddress, city: liveCity, refresh: getLiveLocation, loading: locationLoading } = useLocation();
  const [deliverySlots, setDeliverySlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState('');

  useEffect(() => {
    const fetchSlots = async () => {
      setSlotsLoading(true);
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const res = await fetch(`${API_URL}/deliveryslots`, {
          headers: {
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        if (!res.ok) throw new Error('Failed to fetch delivery slots');
        const data = await res.json();
        setDeliverySlots(data);
      } catch (err) {
        console.error('Error fetching delivery slots:', err);
        setSlotsError('Could not load delivery slots.');
      } finally {
        setSlotsLoading(false);
      }
    };
    fetchSlots();
  }, []);

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

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '0';
    const priceStr = String(val).replace(/[^\d.]/g, '');
    const num = parseFloat(priceStr) || 0;
    return Number.isInteger(num) ? String(num) : num.toFixed(2);
  };

  const subtotal = cartItems.reduce((acc, item) => {
    const priceStr = String(item.price);
    const price = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;
    return acc + (price * item.quantity);
  }, 0);

  const shipping = subtotal > 500 ? 0 : 50;
  const total = subtotal + shipping;

  const [pincodeError, setPincodeError] = useState('');

  const checkPincode = async (code) => {
    if (code.length === 6) {
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const res = await fetch(`${API_URL}/tenancy/find/${code}`, {
          headers: {
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        const data = await res.json();

        if (!res.ok) {
          setPincodeError('Delivery not available for this location');
        } else {
          // Check if the pincode belongs to the currently selected database
          if (data.dbName !== savedTenantId) {
            setPincodeError(`This pincode belongs to ${data.city}. Please select ${data.city} at the homepage to shop there.`);
          } else {
            setPincodeError('');
          }
        }
      } catch (err) {
        console.error('Pincode check failed');
      }
    } else {
      setPincodeError('');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Strict 6-digit pincode validation
    if (name === 'pincode') {
      const sanitized = value.replace(/\D/g, '').slice(0, 6);
      setShippingData({ ...shippingData, [name]: sanitized });
      checkPincode(sanitized);
      return;
    }

    setShippingData({ ...shippingData, [name]: value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (pincodeError) {
      alert('Cannot place order: Delivery is not available for your pincode.');
      return;
    }
    setLoading(true);

    const isB2B = localStorage.getItem('isB2B') === 'true';

    const orderPayload = {
      items: cartItems.map(item => {
        const priceStr = String(item.price);
        let basePrice = parseFloat(priceStr.replace(/[^\d.]/g, '')) || 0;

        return {
          product: item.id,
          name: item.name,
          image: item.image,
          quantity: item.quantity,
          price: basePrice,
          selectedPacketSize: item.selectedPacketSize || null,
          sellerName: item.sellerName || 'Zudo Official'
        };
      }),
      totalAmount: total,
      shippingAddress: shippingData,
      paymentMethod,
      deliverySlot: selectedSlot || null
    };

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${API_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message);

      setPlacedOrder(data);
      setOrderComplete(true);
      if (onOrderSuccess) onOrderSuccess();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Find active location ID from physical slots
  const physicalSlot = deliverySlots.find(slot => slot.startTime && slot.endTime);
  const activeLocationId = physicalSlot ? physicalSlot.locationId : null;

  // Find the matching cutoff slot for this location (supporting isSameDay and globalIsSameDay fields)
  const cutoffSlot = deliverySlots.find(slot => 
    (slot.isSameDay || slot.globalIsSameDay) && 
    slot.SameDayCutoff && 
    (!activeLocationId || String(slot.locationId) === String(activeLocationId))
  ) || deliverySlots.find(slot => (slot.isSameDay || slot.globalIsSameDay) && slot.SameDayCutoff);

  const sameDayCutoffTime = cutoffSlot ? cutoffSlot.SameDayCutoff : null;

  const isPastCutoff = (cutoffTimeStr) => {
    if (!cutoffTimeStr) return false;
    const match = cutoffTimeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return false;
    
    let [_, hours, minutes, ampm] = match;
    hours = parseInt(hours, 10);
    minutes = parseInt(minutes, 10);
    
    if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12;
    if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0;
    
    const now = new Date();
    const cutoffDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
    
    return now > cutoffDate;
  };

  const sameDayClosed = isPastCutoff(sameDayCutoffTime);

  useEffect(() => {
    if (sameDayClosed && selectedSlot && selectedSlot.startsWith('Same Day:')) {
      setSelectedSlot('');
    }
  }, [sameDayClosed, selectedSlot]);

  if (orderComplete) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-[scaleIn_0.5s_ease-out]">
          <CheckCircle2 size={40} className="text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-gray-900 mb-2">Order Placed Successfully!</h2>
        <p className="text-gray-500 max-w-md mb-8">Thank you for shopping with Zudo. Your fresh groceries will be delivered shortly.</p>

        {placedOrder?.paymentMethod === 'COD_QR' && (
          <div className="mb-8 bg-white border-2 border-emerald-100 p-6 rounded-[2.5rem] shadow-xl max-w-sm w-full animate-[fadeIn_0.5s_ease-out]">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mb-4">
                <QrCode size={24} />
              </div>
              <h4 className="text-lg font-black text-gray-900 mb-1">Pay via QR</h4>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full mb-6">Status: Pending QR Scan</p>

              <div className="w-48 h-48 bg-gray-50 rounded-3xl border-4 border-emerald-50 flex items-center justify-center mb-6 relative overflow-hidden group">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=zudo@upi&pn=Zudo&am=${total}&cu=INR`}
                  alt="Payment QR"
                  className="w-40 h-40 group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 border-2 border-emerald-500/20 rounded-2xl pointer-events-none"></div>
              </div>

              <div className="text-center space-y-1">
                <p className="text-xs font-black text-gray-900 uppercase tracking-tight">Total to Pay: ₹{total}</p>
                <p className="text-[10px] font-bold text-gray-400 max-w-[200px] mx-auto leading-tight uppercase">Scan this QR or show it to the delivery partner upon arrival</p>
              </div>
            </div>
          </div>
        )}

        {placedOrder?.deliveryOtp && (
          <div className="mb-10 bg-[#107569] text-white p-8 rounded-[2.5rem] shadow-2xl shadow-emerald-900/20 relative overflow-hidden group max-w-sm w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
            <div className="flex items-center gap-2 mb-3">
              <Truck size={14} className="text-emerald-300" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-200">Delivery OTP</p>
            </div>
            <p className="text-5xl font-black tracking-[0.5em] font-mono mb-4">{placedOrder.deliveryOtp}</p>
            <p className="text-[10px] font-bold text-emerald-100/60 leading-tight">Share this code with the partner during delivery.</p>
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
                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.1em] mb-2">Email Address</label>
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
                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.1em] mb-2">Phone Number</label>
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
                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.1em] mb-2">Pincode</label>
                <div className="relative group">
                  <MapPin size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${pincodeError ? 'text-red-500' : 'text-gray-400'}`} />
                  <input
                    type="text"
                    name="pincode"
                    value={shippingData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    maxLength="6"
                    inputMode="numeric"
                    className={`w-full pl-12 pr-4 py-3.5 rounded-2xl border-2 transition-all font-black text-sm outline-none ${pincodeError
                      ? 'border-red-100 bg-red-50 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10'
                      : 'border-gray-100 bg-gray-50/50 text-gray-900 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10'
                      }`}
                    required
                  />
                  {pincodeError && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 animate-bounce">
                      <AlertTriangle size={16} />
                    </div>
                  )}
                </div>
                {pincodeError && (
                  <div className="mt-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-[shake_0.4s_ease-in-out]">
                    <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-wider leading-none">{pincodeError}</p>
                  </div>
                )}
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
                            if (loc.pincode) checkPincode(loc.pincode);
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
                          if (addr.pincode) checkPincode(addr.pincode);
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
                <label className="block text-xs font-black text-gray-900 uppercase tracking-[0.1em] mb-2">City</label>
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
              <Clock className="text-emerald-600" size={24} />
              Preferred Delivery Slot
            </h3>

            {slotsLoading ? (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-8 h-8 border-4 border-emerald-600/30 border-t-emerald-600 rounded-full animate-spin mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading slots...</p>
              </div>
            ) : slotsError ? (
              <p className="text-xs font-bold text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3 uppercase tracking-wider">{slotsError}</p>
            ) : deliverySlots.length === 0 ? (
              <p className="text-xs font-bold text-gray-400 bg-gray-50 rounded-xl px-4 py-3 uppercase tracking-widest text-center">Standard delivery will be scheduled for your order.</p>
            ) : (
              <div className="space-y-8">
                {/* Same Day Slots Section */}
                {deliverySlots.some(slot => slot.isSameDay && slot.startTime && slot.endTime) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className={`w-2 h-2 rounded-full ${sameDayClosed ? 'bg-amber-500' : 'bg-emerald-500 animate-ping'}`} />
                      <h4 className="text-xs font-black text-gray-950 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                        Same Day Delivery Slots
                        {sameDayCutoffTime && !sameDayClosed && (
                          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full normal-case font-bold ml-2">
                            Order before {sameDayCutoffTime}
                          </span>
                        )}
                      </h4>
                    </div>

                    {sameDayClosed ? (
                      <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3 animate-[fadeIn_0.3s_ease-out]">
                        <AlertTriangle className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
                        <div>
                          <p className="text-xs font-black text-amber-800 uppercase tracking-wider mb-0.5">Same-Day Delivery Closed</p>
                          <p className="text-xs text-amber-600/80 font-bold leading-tight">
                            Orders must be placed before {sameDayCutoffTime || '12:00 PM'} for same-day delivery. Please select a Next Day delivery slot below.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fadeIn_0.3s_ease-out]">
                        {deliverySlots
                          .filter(slot => slot.isSameDay && slot.startTime && slot.endTime)
                          .map(slot => {
                            const slotString = `${slot.startTime} - ${slot.endTime}`;
                            const slotValue = `Same Day: ${slotString}`;
                            const isSelected = selectedSlot === slotValue;

                            return (
                              <button
                                key={slot._id || slot.id}
                                type="button"
                                onClick={() => setSelectedSlot(slotValue)}
                                className={`flex flex-col p-4 rounded-2xl border-2 text-left relative transition-all group ${isSelected
                                    ? 'border-emerald-600 bg-emerald-50/50 ring-4 ring-emerald-500/10'
                                    : 'border-gray-100 hover:border-gray-200'
                                  }`}
                              >
                                <div className="flex items-center justify-between w-full mb-1">
                                  <span className="font-black text-gray-900 text-sm flex items-center gap-2">
                                    <Clock size={14} className={isSelected ? 'text-emerald-600' : 'text-gray-400'} />
                                    {slotString}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                  )}
                                </div>
                                <div className="flex items-center justify-between w-full mt-2">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md font-bold">
                                    Same Day
                                  </span>
                                  {(slot.orderedBeforeTime || sameDayCutoffTime) && (
                                    <span className="text-[9px] font-bold text-gray-400 uppercase font-bold">
                                      Before {slot.orderedBeforeTime || sameDayCutoffTime}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                      </div>
                    )}
                  </div>
                )}

                {/* Next Day Slots Section */}
                {deliverySlots.some(slot => !slot.isSameDay && slot.startTime && slot.endTime) && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full" />
                      <h4 className="text-xs font-black text-gray-950 dark:text-blue-400 uppercase tracking-wider">
                        Next Day Delivery Slots
                      </h4>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fadeIn_0.3s_ease-out]">
                      {deliverySlots
                        .filter(slot => !slot.isSameDay && slot.startTime && slot.endTime)
                        .map(slot => {
                          const slotString = `${slot.startTime} - ${slot.endTime}`;
                          const slotValue = `Next Day: ${slotString}`;
                          const isSelected = selectedSlot === slotValue;

                          return (
                            <button
                              key={slot._id || slot.id}
                              type="button"
                              onClick={() => setSelectedSlot(slotValue)}
                              className={`flex flex-col p-4 rounded-2xl border-2 text-left relative transition-all group ${isSelected
                                  ? 'border-emerald-600 bg-emerald-50/50 ring-4 ring-emerald-500/10'
                                  : 'border-gray-100 hover:border-gray-200'
                                }`}
                            >
                              <div className="flex items-center justify-between w-full mb-1">
                                <span className="font-black text-gray-900 text-sm flex items-center gap-2">
                                  <Clock size={14} className={isSelected ? 'text-emerald-600' : 'text-gray-400'} />
                                  {slotString}
                                </span>
                                {isSelected && (
                                  <CheckCircle2 size={16} className="text-emerald-600" />
                                )}
                              </div>
                              <div className="flex items-center justify-between w-full mt-2">
                                <span className="text-[9px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-bold">
                                  Next Day
                                </span>
                                {slot.orderedBeforeTime && (
                                  <span className="text-[9px] font-bold text-gray-400 uppercase font-bold">
                                    Before {slot.orderedBeforeTime}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3">
              <CreditCard className="text-emerald-600" size={24} />
              Payment Method
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('COD')}
                className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'COD' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD' ? 'border-emerald-600' : 'border-gray-300'}`}>
                    {paymentMethod === 'COD' && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}
                  </div>
                  <div className="text-left">
                    <p className="font-black text-gray-900 text-sm">Cash on Delivery</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pay cash at your doorstep</p>
                  </div>
                </div>
                <Banknote size={24} className="text-emerald-600/40" />
              </button>

              {(user?.role === 'b2b' || localStorage.getItem('isB2B') === 'true') && (
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD_QR')}
                  className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${paymentMethod === 'COD_QR' ? 'border-emerald-600 bg-emerald-50/50' : 'border-gray-100 hover:border-gray-200'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'COD_QR' ? 'border-emerald-600' : 'border-gray-300'}`}>
                      {paymentMethod === 'COD_QR' && <div className="w-3 h-3 bg-emerald-600 rounded-full" />}
                    </div>
                    <div className="text-left">
                      <p className="font-black text-gray-900 text-sm">Pay on Delivery (QR)</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Scan QR code at delivery</p>
                    </div>
                  </div>
                  <QrCode size={24} className="text-emerald-600/40" />
                </button>
              )}
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
                      <img src={cleanImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800 line-clamp-1">
                        {item.name} {item.selectedPacketSize && `(${item.selectedPacketSize})`}
                      </p>
                      <p className="text-xs text-gray-400 font-bold">Qty: {item.quantity}</p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-gray-900">₹{formatPrice(item.price)}</p>
                </div>
              ))}
            </div>

            <div className="space-y-3 pt-6 border-t border-gray-50">
              <div className="space-y-3 pt-6 border-t border-gray-50">
                <div className="flex justify-between text-gray-500">
                  <span className="font-bold">Subtotal</span>
                  <span className="font-black text-gray-900">₹{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span className="font-bold">Shipping</span>
                  <span className="font-black text-emerald-600">{shipping === 0 ? 'FREE' : `₹${formatPrice(shipping)}`}</span>
                </div>
                <div className="flex justify-between pt-4 mt-2 border-t-2 border-gray-100">
                  <span className="text-lg font-black text-gray-900">Total</span>
                  <span className="text-2xl font-black text-emerald-600">₹{formatPrice(total)}</span>
                </div>
                {localStorage.getItem('isB2B') === 'true' && total < 2000 && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2">
                    <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
                    <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-tight">
                      Minimum order for B2B is ₹2000. Add ₹{formatPrice(2000 - total)} more.
                    </p>
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  const isB2B = localStorage.getItem('isB2B') === 'true';
                  if (isB2B && total < 2000) {
                    alert('B2B orders must be at least ₹2000. Please add more items to your cart.');
                    return;
                  }
                  handlePlaceOrder(e);
                }}
                disabled={loading || !!pincodeError || !shippingData.name || !shippingData.email || !shippingData.phone || !shippingData.address || !shippingData.city || !shippingData.pincode || (deliverySlots.length > 0 && !selectedSlot) || (localStorage.getItem('isB2B') === 'true' && total < 2000)}
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
    </div>
  );
}
