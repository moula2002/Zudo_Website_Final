import React from 'react';
import { Trash2, ArrowLeft, ShoppingBag, CreditCard, ChevronRight, ShieldCheck, Clock } from 'lucide-react';
import { cleanImageUrl, API_URL } from '../config';

export default function CartPage({ cartItems, onUpdateQuantity, onRemove, onNavigate, isB2B }) {
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isB2BPending = user?.role === 'b2b' && !user.isVerified;

  const [settings, setSettings] = React.useState({
    minimumBillAmountB2B: 2000,
    minimumBillAmountB2C: 1000
  });

  React.useEffect(() => {
    const fetchSettings = async () => {
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const res = await fetch(`${API_URL}/commissions/public/minimum-billing`, {
          headers: {
            'x-tenant-id': locationHeader,
            'x-location': locationHeader
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(data);
        }
      } catch (err) {
        console.error('Failed to fetch billing settings:', err);
      }
    };
    fetchSettings();
  }, []);

  const minBillingAmount = isB2B ? settings.minimumBillAmountB2B : settings.minimumBillAmountB2C;

  const formatPrice = (val) => {
    if (val === undefined || val === null) return '0';
    const priceStr = String(val).replace(/[^\d.]/g, '');
    const num = parseFloat(priceStr) || 0;
    return Number.isInteger(num) ? String(num) : num.toFixed(2);
  };

  // Helper to get tiered price
  const getItemPrice = (item) => {
    let basePrice = 0;
    if (item.priceTiers && item.priceTiers.length > 0) {
      const sortedTiers = [...item.priceTiers].sort((a, b) => b.minQty - a.minQty);
      const activeTier = sortedTiers.find(t => item.quantity >= t.minQty);
      if (activeTier) basePrice = activeTier.price;
    }
    if (!basePrice) {
      const priceStr = String(item.price);
      const cleanedPrice = priceStr.replace(/[^\d.]/g, '');
      basePrice = parseFloat(cleanedPrice) || 0;
    }
    
    // For B2B, include GST in the displayed cart price
    if (isB2B && item.gstPercent) {
      return Number((basePrice * (1 + item.gstPercent / 100)).toFixed(2));
    }
    
    return basePrice;
  };

  const subtotal = cartItems.reduce((acc, item) => {
    return acc + (getItemPrice(item) * item.quantity);
  }, 0);

  const deliveryFee = subtotal > 500 ? 0 : 50;
  const total = subtotal + deliveryFee;

  if (isB2BPending) {
    return (
      <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-48 h-48 bg-amber-50 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-amber-100 rounded-full animate-ping opacity-20"></div>
          <Clock size={80} className="text-amber-500 relative z-10" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Verification Pending</h2>
        <p className="text-gray-500 mb-10 font-bold max-w-sm text-center leading-relaxed">
          Your business account is currently under review. Once verified, you'll be able to access wholesale prices and complete your purchase.
        </p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-gray-900 hover:bg-black text-white font-black py-4 px-12 rounded-2xl shadow-2xl shadow-gray-900/30 transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <ArrowLeft size={20} /> Return to Store
        </button>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[70vh]">
        <div className="w-48 h-48 bg-emerald-50 rounded-full flex items-center justify-center mb-8 relative">
          <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-20"></div>
          <ShoppingBag size={80} className="text-emerald-200 relative z-10" />
        </div>
        <h2 className="text-4xl font-black text-gray-900 mb-4 tracking-tight">Your cart is empty</h2>
        <p className="text-gray-500 mb-10 font-bold max-w-sm text-center leading-relaxed">Ready to fill your kitchen with the freshest ingredients? Let's start shopping!</p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 px-12 rounded-2xl shadow-2xl shadow-emerald-600/30 transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95"
        >
          Explore Store
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfd] min-h-screen pb-24">
      {/* Page Header Area */}
      <div className="bg-emerald-600 pt-10 pb-20 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="max-w-6xl mx-auto relative z-10">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-emerald-100 hover:text-white font-black text-xs uppercase tracking-widest mb-4 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> 
            Back to Store
          </button>
          <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">Shopping Cart</h1>
          <p className="text-emerald-100/60 font-bold mt-1 text-sm">You have {cartItems.length} items in your basket</p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Cart Items List */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-[2rem] shadow-xl shadow-emerald-900/5 border border-gray-100 overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                <h3 className="text-xl font-black text-gray-900">Items Summary</h3>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-full">{cartItems.length} Products</span>
              </div>
              
              <div className="divide-y divide-gray-50">
                {cartItems.map(item => (
                  <div key={item.id} className="flex flex-col sm:flex-row sm:items-center gap-6 p-8 hover:bg-emerald-50/10 transition-all group">
                    <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 border border-gray-100 group-hover:scale-105 transition-transform duration-500">
                      {item.image && <img src={cleanImageUrl(item.image)} alt={item.name} className="w-full h-full object-cover" />}
                    </div>
                    
                    <div className="flex-grow">
                      <h3 className="text-lg font-black text-gray-900 mb-0.5 leading-tight">
                        {item.name} {item.selectedPacketSize && `(${item.selectedPacketSize})`}
                      </h3>
                      <div className="flex items-center gap-1.5 mb-2">
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seller:</span>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
                          {item.sellerName && item.sellerName !== 'Zudo Official' 
                            ? item.sellerName 
                            : (item.sellerId?.businessName || item.sellerId?.name || item.sellerName || 'Zudo Official')}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <div className="text-emerald-600 font-black text-xl tracking-tighter">₹{formatPrice(getItemPrice(item))}</div>
                        {item.priceTiers?.some(t => item.quantity >= t.minQty) && (
                          <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-50 px-1.5 py-0.5 rounded-md mt-1 border border-emerald-100">Bulk Applied</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="flex items-center bg-gray-50 dark:bg-white/5 rounded-2xl p-1.5 border border-gray-100 dark:border-white/10 shadow-inner">
                        <button 
                          onClick={() => onUpdateQuantity(item.id, -1)} 
                          className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-600 text-gray-900 dark:text-white font-black shadow-sm hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-black text-gray-900 dark:text-white text-lg">{item.quantity}</span>
                        <button 
                          onClick={() => onUpdateQuantity(item.id, 1)} 
                          className="w-10 h-10 rounded-xl bg-white dark:bg-emerald-600 text-gray-900 dark:text-white font-black shadow-sm hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                        >
                          +
                        </button>
                      </div>
                      
                      <button 
                        onClick={() => onRemove(item.id)} 
                        className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all shadow-sm hover:shadow-red-500/20 active:scale-90"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="w-full lg:w-1/3">
            <div className="bg-white rounded-[2rem] shadow-2xl shadow-emerald-900/10 border border-gray-100 p-8 sticky top-32">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shadow-inner">
                  <CreditCard size={20} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 tracking-tight">Order Summary</h2>
              </div>
              
              <div className="space-y-5 mb-8">
                <div className="flex justify-between text-gray-500 font-bold">
                  <span className="text-sm">Subtotal ({cartItems.length} items)</span>
                  <span className="text-gray-900 font-black">₹{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-500 font-bold">
                  <span className="text-sm">Delivery Fee</span>
                  <span className="text-gray-900">
                    {deliveryFee === 0 ? <span className="text-emerald-600 font-black uppercase text-xs tracking-widest">Free</span> : `₹${formatPrice(deliveryFee)}`}
                  </span>
                </div>
                {subtotal < 500 && (
                  <div className="text-[10px] font-black text-emerald-700 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 text-center uppercase tracking-widest">
                    Add ₹{formatPrice(500 - subtotal)} more for Free Delivery!
                  </div>
                )}
              </div>

              <div className="border-t-2 border-dashed border-gray-100 pt-6 mb-10">
                <div className="flex justify-between items-end">
                  <span className="text-lg font-black text-gray-900">Total Bill</span>
                  <div className="text-right">
                    <span className="text-4xl font-black text-emerald-600 tracking-tighter">₹{formatPrice(total)}</span>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Inc. all taxes</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Settings Info Card */}
              <div className="mb-6 p-5 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl">
                <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-3 leading-none">
                  {isB2B ? 'B2B Wholesale Settings' : 'B2C Retail Settings'}
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                    <span>Minimum Bill Amount</span>
                    <span className="text-gray-900 dark:text-white font-black">₹{minBillingAmount}</span>
                  </div>
                </div>
              </div>

              {subtotal < minBillingAmount && (
                <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <p className="text-[10px] font-black text-red-600 uppercase tracking-widest leading-tight">
                    Minimum {isB2B ? 'B2B' : 'B2C'} order value is ₹{formatPrice(minBillingAmount)}. Add ₹{formatPrice(minBillingAmount - subtotal)} more.
                  </p>
                </div>
              )}

              <button 
                onClick={() => {
                  if (subtotal < minBillingAmount) {
                    alert(`${isB2B ? 'B2B' : 'B2C'} orders must be at least ₹${minBillingAmount}`);
                    return;
                  }
                  onNavigate('checkout');
                }}
                disabled={subtotal < minBillingAmount}
                className={`w-full ${subtotal < minBillingAmount ? 'bg-gray-400 cursor-not-allowed' : 'bg-[#107569] hover:bg-[#0d6359]'} text-white font-black py-5 rounded-2xl shadow-2xl shadow-emerald-900/20 transform hover:-translate-y-1 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 group`}
              >
                Proceed to Checkout
                <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
