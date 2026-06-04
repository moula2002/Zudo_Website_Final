import React, { useState, useEffect } from 'react';
import { API_BASE_URL, cleanImageUrl } from '../config';
import ProductCard from './ProductCard';
import { 
  X, ShoppingBag, Newspaper, Phone, 
  Mail, MapPin, ChevronRight, AlertCircle 
} from 'lucide-react';

export default function FeedsPage({ 
  allProducts = [], 
  onAddToCart, 
  onUpdateQuantity, 
  onToggleWishlist, 
  cartItems = [], 
  wishlistItems = [], 
  onNavigateToProduct, 
  getDisplayPrice,
  onNavigate
}) {
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerModalTab, setSellerModalTab] = useState('products'); // 'products' or 'feeds'

  useEffect(() => {
    const fetchFeeds = async () => {
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const response = await fetch(`${API_BASE_URL}/api/feedposts`, {
          headers: {
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        if (!response.ok) {
          throw new Error('Failed to fetch feeds');
        }
        const data = await response.json();
        setFeeds(data);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFeeds();
  }, []);

  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filter products by selected seller ID
  const sellerProducts = selectedSeller 
    ? allProducts.filter(p => {
        const sId = p.sellerId?._id || p.sellerId;
        const currentSId = selectedSeller._id;
        return sId && sId.toString() === currentSId.toString();
      })
    : [];

  // Filter feeds by selected seller ID
  const sellerFeeds = selectedSeller
    ? feeds.filter(f => {
        const sId = f.sellerId?._id || f.sellerId;
        const currentSId = selectedSeller._id;
        return sId && sId.toString() === currentSId.toString();
      })
    : [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fcfdfd] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-bold text-gray-500">Loading latest feeds & updates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fcfdfd] min-h-screen pb-20">
      {/* Banner / Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-600 text-white py-12 md:py-16">
        <div className="container mx-auto px-6 text-center max-w-3xl">
          <span className="bg-white/20 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-[0.2em] inline-block mb-3 backdrop-blur-sm">
            Seller Spotlights
          </span>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4">
            Zudo Feeds & Offers
          </h1>
          <p className="text-sm md:text-base text-emerald-100 font-bold max-w-xl mx-auto leading-relaxed">
            Discover real-time store updates, new arrivals, and special coupon codes directly from verified sellers.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-12 max-w-5xl">
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-8 text-center max-w-md mx-auto">
            <AlertCircle className="text-red-500 mx-auto mb-3" size={32} />
            <h3 className="font-black text-gray-900 mb-1">Failed to load feeds</h3>
            <p className="text-xs text-gray-500 font-bold mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {!error && feeds.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2rem] border border-gray-100 max-w-md mx-auto shadow-sm">
            <Newspaper className="text-gray-300 mx-auto mb-4" size={48} />
            <h3 className="font-black text-gray-900 text-lg mb-1">No feeds posted yet</h3>
            <p className="text-xs text-gray-500 font-bold max-w-xs mx-auto">
              Check back later for fresh updates, flash sales, and coupons from sellers in your region.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {feeds.map((feed) => {
              const sellerObj = feed.sellerId || {};
              const sellerName = sellerObj.businessName || sellerObj.name || 'Zudo Partner';

              return (
                <div 
                  key={feed._id} 
                  className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Seller Header */}
                  <div className="p-5 flex items-center justify-between border-b border-gray-50">
                    <div 
                      onClick={() => {
                        setSelectedSeller(sellerObj);
                        setSellerModalTab('products');
                      }}
                      className="flex items-center gap-3 cursor-pointer group/seller"
                    >
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-700 font-black rounded-xl flex items-center justify-center text-sm group-hover/seller:bg-emerald-600 group-hover/seller:text-white transition-all shadow-inner">
                        {sellerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h4 className="font-black text-gray-900 text-sm group-hover/seller:text-emerald-700 transition-colors flex items-center gap-1">
                          {sellerName}
                          <ChevronRight size={14} className="text-gray-400 group-hover/seller:translate-x-0.5 transition-transform" />
                        </h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Verified Seller</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-1 rounded-md">
                      {new Date(feed.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </span>
                  </div>

                  {/* Feed Image */}
                  {feed.imageUrl && (
                    <div className="aspect-[16/9] w-full overflow-hidden bg-slate-50 relative">
                      <img 
                        src={cleanImageUrl(feed.imageUrl)} 
                        alt={feed.title}
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                      />
                    </div>
                  )}

                  {/* Feed Info */}
                  <div className="p-6 flex-1 flex flex-col">
                    <h3 className="font-black text-gray-900 text-lg tracking-tight mb-2">
                      {feed.title}
                    </h3>
                    <p className="text-xs text-gray-500 font-bold leading-relaxed mb-6 flex-1">
                      {feed.description}
                    </p>


                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Seller Profile / Storefront Modal */}
      {selectedSeller && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-0 md:p-6 animate-[fadeIn_0.2s_ease-out]">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedSeller(null)}></div>
          
          <div className="bg-white w-full max-w-4xl h-full md:h-[85vh] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col animate-[scaleIn_0.3s_ease-out]">
            {/* Modal Header */}
            <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-emerald-50 text-emerald-700 rounded-2xl flex items-center justify-center font-black text-2xl shadow-inner">
                  {(selectedSeller.businessName || selectedSeller.name || 'S').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">
                    {selectedSeller.businessName || selectedSeller.name}
                  </h2>
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    Zudo Verified Seller Storefront
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedSeller(null)}
                className="p-3 bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-2xl transition-all shadow-sm"
              >
                <X size={20} />
              </button>
            </div>

            {/* Seller Contact Info Strip */}
            <div className="px-6 py-4 bg-slate-50 border-b border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {selectedSeller.phone && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Phone size={14} className="text-emerald-600" />
                  <span className="font-bold">{selectedSeller.phone}</span>
                </div>
              )}
              {selectedSeller.email && (
                <div className="flex items-center gap-2 text-gray-600 truncate">
                  <Mail size={14} className="text-emerald-600" />
                  <span className="font-bold truncate">{selectedSeller.email}</span>
                </div>
              )}
              {selectedSeller.businessAddress && (
                <div className="flex items-center gap-2 text-gray-600 truncate">
                  <MapPin size={14} className="text-emerald-600 flex-shrink-0" />
                  <span className="font-bold truncate">{selectedSeller.businessAddress}</span>
                </div>
              )}
            </div>

            {/* Tab Navigation */}
            <div className="flex border-b border-gray-100 bg-white">
              <button 
                onClick={() => setSellerModalTab('products')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-2 ${sellerModalTab === 'products' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                <ShoppingBag size={16} />
                Products ({sellerProducts.length})
              </button>
              <button 
                onClick={() => setSellerModalTab('feeds')}
                className={`flex-1 py-4 font-black text-xs uppercase tracking-widest border-b-2 transition-all flex items-center justify-center gap-2 ${sellerModalTab === 'feeds' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
              >
                <Newspaper size={16} />
                Feeds ({sellerFeeds.length})
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-50/30">
              {sellerModalTab === 'products' && (
                <div>
                  {sellerProducts.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                      <ShoppingBag className="text-gray-300 mx-auto mb-3" size={36} />
                      <p className="text-sm font-bold text-gray-500">No products uploaded by this seller yet.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                      {sellerProducts.map((product) => {
                        const cartItem = cartItems.find(item => item.id === product.id);
                        const displayData = getDisplayPrice ? getDisplayPrice(product) : { price: product.price, oldPrice: product.oldPrice };
                        const productWithPrice = { ...product, ...displayData };

                        return (
                          <div 
                            key={product.id}
                            onClick={() => {
                              setSelectedSeller(null);
                              onNavigateToProduct(productWithPrice);
                            }}
                            className="cursor-pointer"
                          >
                            <ProductCard 
                              product={productWithPrice} 
                              onAddToCart={onAddToCart}
                              onUpdateQuantity={onUpdateQuantity}
                              onToggleWishlist={onToggleWishlist}
                              isWishlisted={wishlistItems.some(item => item.id === product.id)}
                              quantity={cartItem ? cartItem.quantity : 0}
                              cartItems={cartItems}
                            />
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {sellerModalTab === 'feeds' && (
                <div className="space-y-6">
                  {sellerFeeds.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-3xl border border-gray-100">
                      <Newspaper className="text-gray-300 mx-auto mb-3" size={36} />
                      <p className="text-sm font-bold text-gray-500">No other feeds posted by this seller.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {sellerFeeds.map((feed) => (
                        <div key={feed._id} className="bg-white rounded-3xl border border-gray-100 p-5 space-y-4 shadow-sm flex flex-col">
                          {feed.imageUrl && (
                            <div className="aspect-[16/9] w-full rounded-2xl overflow-hidden bg-slate-50">
                              <img src={cleanImageUrl(feed.imageUrl)} alt={feed.title} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col">
                            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1.5 block">
                              {new Date(feed.createdAt).toLocaleDateString()}
                            </span>
                            <h4 className="font-black text-gray-900 text-base mb-1">{feed.title}</h4>
                            <p className="text-xs text-gray-500 font-bold leading-relaxed mb-4 flex-1">{feed.description}</p>
                            

                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 md:p-8 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setSelectedSeller(null)}
                className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all"
              >
                Close Storefront
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
