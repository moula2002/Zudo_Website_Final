import React from 'react';
import { Heart, Plus, Star } from 'lucide-react';

export default function ProductCard({ product, onAddToCart, onToggleWishlist, isWishlisted }) {
  return (
    <div className="bg-white rounded-[2rem] p-2 transition-all duration-500 group relative border border-gray-100 hover:border-emerald-100 hover:shadow-[0_20px_40px_-15px_rgba(16,185,129,0.15)] flex flex-col h-full">
      
      {/* Top Image Section */}
      <div className="w-full h-56 bg-gradient-to-br from-gray-50 to-gray-100 rounded-[1.5rem] mb-4 overflow-hidden relative group-hover:shadow-inner transition-all">
        {product.badge && (
          <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-md text-emerald-700 text-[10px] font-extrabold px-3 py-1.5 rounded-full z-10 shadow-sm uppercase tracking-widest">
            {product.badge}
          </span>
        )}
        
        <button 
          onClick={(e) => { e.stopPropagation(); onToggleWishlist && onToggleWishlist(product); }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full shadow-sm backdrop-blur-md transition-all duration-300 transform active:scale-90 ${isWishlisted ? 'bg-red-50 text-red-500' : 'bg-white/80 text-gray-400 hover:text-red-500 hover:bg-white'}`}
        >
          <Heart size={18} className={isWishlisted ? "fill-red-500" : ""} />
        </button>
        
        {product.image ? (
          <img 
            src={product.image} 
            alt={product.name} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl opacity-80 group-hover:scale-110 transition-transform duration-500">
            🛍️
          </div>
        )}

        {/* Subtle dark overlay on hover to make badge/heart pop */}
        <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
      </div>
      
      {/* Content Section */}
      <div className="flex-grow px-4 pb-4 flex flex-col">
        <div className="flex items-center justify-between mb-2">
          <span className="text-emerald-600 text-xs font-bold uppercase tracking-wider">{product.category || 'Grocery'}</span>
          <div className="flex items-center gap-1 bg-yellow-50 px-2 py-0.5 rounded-md">
            <Star size={12} className="fill-yellow-400 text-yellow-400" />
            <span className="text-yellow-700 text-xs font-bold">{product.rating}</span>
          </div>
        </div>
        
        <h3 className="text-gray-900 font-extrabold mb-1 line-clamp-2 text-lg leading-tight group-hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>
        
        <div className="mt-auto pt-4 flex items-end justify-between">
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs line-through font-medium mb-1">{product.oldPrice}</span>
            <span className="text-gray-900 font-black text-2xl leading-none">{product.price}</span>
          </div>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onAddToCart && onAddToCart(product); }}
            className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white h-11 px-5 rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 transition-all duration-300 transform active:scale-95 shadow-sm hover:shadow-lg hover:shadow-emerald-600/30"
          >
            <Plus size={18} strokeWidth={3} /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
