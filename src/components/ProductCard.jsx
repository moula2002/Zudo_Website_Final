import React from 'react';
import { Heart, Plus, Minus, Star, Clock } from 'lucide-react';
import { IMAGE_BASE_URL, cleanImageUrl } from '../config';

export default function ProductCard({ product, onAddToCart, onUpdateQuantity, onToggleWishlist, isWishlisted, quantity = 0 }) {
  const isPending = product.price === 'Verification Pending';
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const isSeller = user?.role === 'seller';

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
        
        { (product.image || product.imageUrl) ? (
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
                   {typeof product.price === 'number' ? `₹${product.price}` : (product.price?.startsWith('₹') ? product.price : `₹${product.price}`)}
                 </span>
               </div>
               {quantity > 0 ? (
                 <div className="flex items-center gap-1.5 bg-black rounded-lg p-0.5 shadow-lg shadow-gray-900-600/30">
                   <button 
                     onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, -1); }}
                     className="w-6 h-6 rounded-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                   >
                     <Minus size={12} strokeWidth={3} />
                   </button>
                   <span className="text-white font-black text-xs min-w-[1rem] text-center">{quantity}</span>
                   <button 
                     onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, 1); }}
                     className="w-6 h-6 rounded-md flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                   >
                     <Plus size={12} strokeWidth={3} />
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product); }}
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
        
        <div className="mt-1 pt-3 border-t border-gray-50 flex items-center justify-between">
          <div className="flex flex-col">
            {!isPending && product.oldPrice && (
              <span className="text-gray-400 text-[11px] line-through font-bold mb-0.5 tracking-tight">₹{product.oldPrice}</span>
            )}
            <div className="flex flex-col">
              <span className={`font-black tracking-tighter ${isPending ? 'text-amber-600 text-sm flex items-center gap-1 animate-pulse' : 'text-gray-900 dark:text-white text-xl'}`}>
                {isPending && <Clock size={12} />}
                {typeof product.price === 'number' ? `₹${product.price}` : (product.price?.startsWith('₹') ? product.price : (isPending ? product.price : `₹${product.price}`))}
              </span>
              {product.isB2B && (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[8px] font-black bg-gray-900 text-white px-1.5 py-0.5 rounded uppercase tracking-tighter">B2B</span>
                </div>
              )}
              {isPending && (
                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Verification Required</span>
              )}
            </div>
          </div>
          
          {!isPending && (
            <>
              {quantity > 0 ? (
                <div className="md:hidden flex items-center gap-3 bg-black rounded-2xl p-1 shadow-lg shadow-gray-900-600/20">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, -1); }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Minus size={14} strokeWidth={3} />
                  </button>
                  <span className="text-white font-black text-sm w-4 text-center">{quantity}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onUpdateQuantity && onUpdateQuantity(product.id, 1); }}
                    className="w-7 h-7 rounded-xl flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                  >
                    <Plus size={14} strokeWidth={3} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product); }}
                  className="md:hidden bg-black text-white w-8 h-8 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg shadow-gray-900-600/20 active:scale-90"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
