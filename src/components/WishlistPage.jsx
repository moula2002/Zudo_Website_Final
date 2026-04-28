import React from 'react';
import ProductCard from './ProductCard';
import { Heart, ArrowLeft } from 'lucide-react';

export default function WishlistPage({ wishlistItems, onAddToCart, onToggleWishlist, onNavigate, onNavigateToProduct }) {
  if (wishlistItems.length === 0) {
    return (
      <div className="container mx-auto px-6 py-20 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="w-40 h-40 bg-red-50 rounded-full flex items-center justify-center mb-6">
          <Heart size={64} className="text-red-400 fill-red-100" />
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 mb-8 font-medium">Save your favorite items here to buy them later.</p>
        <button 
          onClick={() => onNavigate('home')}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-full shadow-lg shadow-emerald-600/30 transition-all transform hover:-translate-y-1"
        >
          Explore Products
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12 min-h-[70vh]">
      <button 
        onClick={() => onNavigate('home')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-medium mb-8 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Home
      </button>

      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">My Wishlist</h1>
          <p className="text-gray-500 font-medium">{wishlistItems.length} items saved</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {wishlistItems.map(product => (
          <div onClick={() => onNavigateToProduct && onNavigateToProduct(product)} key={product.id} className="cursor-pointer h-full">
            <ProductCard 
              product={product} 
              onAddToCart={onAddToCart} 
              onToggleWishlist={onToggleWishlist}
              isWishlisted={true}
            />
          </div>
        ))}
      </div>
    </div>
  );
}


