import React from 'react';
import ProductCard from './ProductCard';
import { Sparkles, ArrowRight } from 'lucide-react';

export default function NewArrivals({ onAddToCart, onUpdateQuantity, onToggleWishlist, cartItems = [], wishlistItems = [], onNavigateToProduct, onNavigate, isB2B, getDisplayPrice, allProducts = [] }) {
  
  // Calculate date 5 days ago
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  // Filter products created in the last 5 days
  let newArrivals = allProducts.filter(p => {
    if (!p.createdAt) return false;
    const createdDate = new Date(p.createdAt);
    return createdDate >= fiveDaysAgo;
  }).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

  // If less than 5 products are "new", fill the remaining slots with the most recent older products
  if (newArrivals.length < 5) {
    const existingIds = new Set(newArrivals.map(p => p.id));
    const olderProducts = [...allProducts]
      .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
      .filter(p => !existingIds.has(p.id))
      .slice(0, 5 - newArrivals.length);
    
    newArrivals = [...newArrivals, ...olderProducts];
  } else {
    // Limit to 5 for the homepage display
    newArrivals = newArrivals.slice(0, 5);
  }

  if (newArrivals.length === 0) return null;

  return (
    <section className="container mx-auto px-6 py-16 bg-white dark:bg-[#0a0a0a] transition-colors duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-4">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 bg-emerald-50 dark:bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-100 dark:border-emerald-500/20">
            <Sparkles size={14} className="text-emerald-600 dark:text-emerald-400" />
            <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em]">Just In</span>
          </div>
          <h2 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">New Arrivals</h2>
          <p className="text-gray-500 dark:text-gray-400 font-bold max-w-md">Our freshest picks from the last 5 days, delivered straight to your kitchen.</p>
        </div>
        
        <button 
          onClick={() => onNavigate && onNavigate('products')} 
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-xs uppercase tracking-widest hover:gap-3 transition-all group"
        >
          Explore All New <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
        {newArrivals.map(product => {
          const cartItem = cartItems.find(item => item.id === product.id);
          const displayData = getDisplayPrice ? getDisplayPrice(product) : { price: product.price, oldPrice: product.oldPrice };
          const productWithPrice = { ...product, ...displayData };
          
          return (
            <div 
              key={product.id} 
              onClick={() => onNavigateToProduct && onNavigateToProduct(productWithPrice)}
              className="cursor-pointer group relative"
            >
              <div className="absolute -top-3 -right-3 z-10 bg-emerald-600 text-white text-[9px] font-black px-3 py-1.5 rounded-xl shadow-lg shadow-emerald-600/20 uppercase tracking-widest animate-bounce">
                New
              </div>
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
    </section>
  );
}
