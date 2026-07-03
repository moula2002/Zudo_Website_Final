import React from 'react';
import { Heart, Plus, Minus, Star, Clock, Trash2 } from 'lucide-react';
import { IMAGE_BASE_URL, cleanImageUrl } from '../config';

export default function ProductCard({ product, onAddToCart, onUpdateQuantity, onToggleWishlist, isWishlisted, quantity = 0, cartItems = [], showRemoveButton = false }) {
  const isPending = product.price === 'Verification Pending';
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  // Get active variant lists based on portal mode (B2B vs B2C)
  const variantsList = product.isB2B ? (product.b2b || []) : (product.b2c || []);

  // Track selected packet size variant locally in the card
  const [selectedVariant, setSelectedVariant] = React.useState(() => {
    if (variantsList && variantsList.length > 0) {
      return variantsList[0];
    }
    return null;
  });

  // Keep state sync if product changes
  React.useEffect(() => {
    if (variantsList && variantsList.length > 0) {
      setSelectedVariant(variantsList[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product.id, product.isB2B]);

  // Derived state values based on active selector
  const activeSize = selectedVariant ? selectedVariant.packetSize : (product.packetSize || product.unit || '1 unit');
  const rawPrice = selectedVariant ? selectedVariant.price : product.price;
  const rawMrp = selectedVariant ? selectedVariant.mrp : (product.oldPrice || product.price);
  const activeStock = selectedVariant ? (selectedVariant.stock !== undefined ? selectedVariant.stock : product.stock) : product.stock;
  const activeGst = selectedVariant ? (selectedVariant.gstPercent || product.gstPercent || 0) : (product.gstPercent || 0);
  const activeMoq = product.isB2B ? (product.moq || 1) : 1;
  
  // For B2B, prices in the database are exclusive of GST, but we want to show them inclusive of GST
  const activePrice = (product.isB2B && rawPrice != null) ? Number((rawPrice * (1 + activeGst / 100)).toFixed(2)) : rawPrice;
  const activeMrp = (product.isB2B && rawMrp != null) ? Number((rawMrp * (1 + activeGst / 100)).toFixed(2)) : rawMrp;

  // Uniquely identify the selected item size variant in the shopping cart
  const cartItemKey = `${product.id}_${activeSize}`;
  const cartItem = cartItems?.find(item => item.cartKey === cartItemKey);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  return (
    <div className="bg-white rounded-3xl p-2 transition-all duration-500 group relative border border-gray-100 hover:border-gray-900-200 hover:shadow-[0_40px_80px_-20px_rgba(17,24,39,0.15)] flex flex-col h-full transform hover:-translate-y-2 max-w-[280px] mx-auto w-full shadow-sm">

      {/* Top Image Section */}
      <div className="w-full h-52 bg-[#fdfdfd] rounded-2xl overflow-hidden relative transition-all duration-500">
        {product.badge && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
            <span className="bg-black text-white text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg shadow-gray-900-600/20 uppercase tracking-widest animate-pulse">
              {product.badge}
            </span>
          </div>
        )}

        <button
          onClick={(e) => { e.stopPropagation(); onToggleWishlist && onToggleWishlist(product); }}
          className={`absolute top-4 right-4 z-10 p-2.5 rounded-full shadow-xl backdrop-blur-xl transition-all duration-300 transform hover:scale-110 active:scale-95 ${isWishlisted ? 'bg-amber-500 text-white shadow-amber-500/30' : 'bg-white/90 text-gray-400 hover:text-amber-500 hover:bg-white'}`}
        >
          <Heart size={18} className={isWishlisted ? "fill-white" : ""} />
        </button>

        {(product.image || product.imageUrl) ? (
          <img
            src={cleanImageUrl(product.image || product.imageUrl)}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-1000 ease-out"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-7xl opacity-80 group-hover:scale-110 transition-transform duration-700">
            🛍️
          </div>
        )}

        {/* Action Overlay (Desktop Only) */}
        {!isPending && (
          <div className="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out z-20 hidden md:block">
            <div className="bg-white/90 backdrop-blur-md rounded-2xl p-3 shadow-2xl flex items-center justify-between border border-white/20">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Price per unit</span>
                <span className="text-sm font-black text-black">
                  ₹{activePrice}
                </span>
              </div>
              {currentQuantity > 0 ? (
                <div className="flex items-center gap-1.5 bg-black rounded-lg p-0.5 shadow-lg shadow-gray-900-600/30">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(cartItemKey, -1); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Minus size={12} strokeWidth={3} />
                  </button>
                  <span className="text-white font-black text-xs min-w-[1rem] text-center">{currentQuantity}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(cartItemKey, 1); }}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Plus size={12} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product, selectedVariant); }}
                  className="bg-black text-white w-8 h-8 rounded-xl flex items-center justify-center hover:bg-gray-900-700 transition-colors shadow-lg shadow-gray-900-600/30"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Subtle dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
      </div>

      {/* Content Section */}
      <div className="flex-grow px-4 pt-3 pb-1 flex flex-col">
        <div className="flex items-center flex-wrap gap-2 mb-3">
          <span className="bg-gray-50 text-gray-600 text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider">{product.category || 'Grocery'}</span>
          {product.subcategory && (
            <span className="bg-amber-50 text-amber-500 text-[9px] font-bold px-2 py-0.5 rounded-md border border-amber-100 tracking-wide">
              {product.subcategory}
            </span>
          )}
          <div className="flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-100/50">
            <Star size={12} className="fill-amber-400 text-amber-400" />
            <span className="text-amber-700 text-[10px] font-black">{product.rating}</span>
          </div>
        </div>

        <h3 className="text-gray-900 font-black leading-tight group-hover:text-gray-900 transition-colors line-clamp-2 min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Seller:</span>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100/50">
            {product.sellerName && product.sellerName !== 'Zudo Official' ? product.sellerName : (product.sellerId?.businessName || product.sellerId?.name || 'Zudo Official')}
          </span>
        </div>

        {/* Packet Size Option Pill Selectors */}
        {variantsList && variantsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3" onClick={(e) => e.stopPropagation()}>
            {variantsList.map((v, i) => (
              <button
                key={i}
                onClick={() => setSelectedVariant(v)}
                className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg border transition-all duration-300 ${activeSize === v.packetSize
                    ? 'bg-emerald-600 border-emerald-600 text-white shadow-sm'
                    : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-600'
                  }`}
              >
                {v.packetSize}
              </button>
            ))}
          </div>
        )}

        {/* Dynamic Stock, GST, and MOQ Micro-badges */}
        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-wider text-gray-400 mt-2.5">
          <span className={activeStock > 0 ? "text-emerald-600" : "text-red-500"}>
            {activeStock > 0 ? `Stock: ${activeStock} pcs` : 'Out of Stock'}
          </span>
          {product.isB2B && activeGst > 0 && (
            <span className="bg-gray-100 px-1.5 py-0.5 rounded text-[7px] text-gray-500">GST: {activeGst}%</span>
          )}
          {product.isB2B && activeMoq > 1 && (
            <span className="text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded text-[7px]">MOQ: {activeMoq}</span>
          )}
        </div>

        <div className="mt-2.5 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            {!isPending && activeMrp && Number(activeMrp) > Number(activePrice) && (
              <span className="text-gray-400 text-[11px] line-through font-bold mb-0.5 tracking-tight">₹{activeMrp}</span>
            )}
            <div className="flex flex-col">
              <span className={`font-black tracking-tighter ${isPending ? 'text-amber-600 text-sm flex items-center gap-1 animate-pulse' : 'text-gray-900 dark:text-white text-xl'}`}>
                {isPending && <Clock size={12} />}
                {isPending ? 'Verification Pending' : `₹${activePrice}`}
              </span>
              {product.isB2B && (
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[7px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">B2B Wholesale</span>
                </div>
              )}
            </div>
          </div>

          {!isPending && (
            <>
              {currentQuantity > 0 ? (
                <div className="md:hidden flex items-center gap-3 bg-black rounded-2xl p-1 shadow-lg shadow-gray-900-600/20">
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(cartItemKey, -1); }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="text-white font-black text-sm w-4 text-center">{currentQuantity}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(cartItemKey, 1); }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product, selectedVariant); }}
                  className="md:hidden bg-black text-white w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-gray-900-600/20 active:scale-90"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              )}
            </>
          )}
        </div>

        {showRemoveButton && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleWishlist && onToggleWishlist(product);
            }}
            className="mt-3 w-full py-2.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-red-100/50 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Trash2 size={13} strokeWidth={2.5} />
            Remove from Wishlist
          </button>
        )}
      </div>
    </div>
  );
}
