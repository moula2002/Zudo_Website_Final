import React from 'react';
import ProductCard from './ProductCard';
export default function HomeProducts({ onAddToCart, onUpdateQuantity, onToggleWishlist, cartItems = [], wishlistItems = [], onNavigateToProduct, onNavigate, isB2B, getDisplayPrice, allProducts = [] }) {
  const products = allProducts.slice(0, 4);

  return (
      <section className="container mx-auto px-6 py-16">
        <div className="flex justify-between items-end mb-10">
          <div>
            <div className="text-emerald-600 font-bold tracking-wider text-sm mb-2 uppercase flex items-center gap-2">
              Freshly Sourced
              {isB2B && <span className="bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-full">B2B Unlocked</span>}
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900">Premium Groceries</h2>
            <p className="text-gray-500 mt-2 font-medium">Stock up on essential grains, pulses, and flours for your daily cooking.</p>
          </div>
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('products'); }} className="text-emerald-600 border-b-2 border-emerald-600 pb-1 hover:text-emerald-700 hover:border-emerald-700 font-bold text-sm hidden md:flex items-center gap-1 transition-colors">
            View All Products &rarr;
          </a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map(product => {
            const cartItem = cartItems.find(item => item.id === product.id);
            const displayData = getDisplayPrice ? getDisplayPrice(product) : { price: product.price, oldPrice: product.oldPrice };
            const productWithPrice = { ...product, ...displayData };
            
            return (
              <div onClick={() => onNavigateToProduct && onNavigateToProduct(productWithPrice)} key={product.id} className="cursor-pointer h-full">
                <ProductCard 
                  product={productWithPrice} 
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={onUpdateQuantity}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistItems.some(item => item.id === product.id)}
                  quantity={cartItem ? cartItem.quantity : 0}
                />
              </div>
            );
          })}
        </div>
        
        <div className="mt-8 flex justify-center md:hidden">
          <button onClick={() => onNavigate && onNavigate('products')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors w-full shadow-lg shadow-emerald-600/30">
            View All Products
          </button>
        </div>
      </section>
  );
}


