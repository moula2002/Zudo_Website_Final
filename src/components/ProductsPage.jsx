import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { allProducts } from '../data';
import { Filter } from 'lucide-react';

export default function ProductsPage({ searchQuery, onAddToCart, onToggleWishlist, wishlistItems, onNavigateToProduct }) {
  const [category, setCategory] = useState('All');

  const filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', 'Rice', 'Pulses', 'Flours', 'Essentials', 'Sugar'];

  return (
    <div className="container mx-auto px-6 py-12 min-h-[70vh]">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">
        {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
      </h1>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Filter size={18}/> Filters</h3>
            <div className="space-y-3">
              {categories.map(cat => (
                <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                  <input 
                    type="radio" 
                    name="category" 
                    checked={category === cat}
                    onChange={() => setCategory(cat)}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                  />
                  <span className={`text-sm font-medium transition-colors ${category === cat ? 'text-emerald-600 font-bold' : 'text-gray-600 group-hover:text-emerald-600'}`}>{cat}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="flex-grow">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100 font-medium">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map(product => (
                <div onClick={() => onNavigateToProduct(product)} key={product.id} className="cursor-pointer">
                  <ProductCard 
                    product={product} 
                    onAddToCart={onAddToCart}
                    onToggleWishlist={onToggleWishlist}
                    isWishlisted={wishlistItems.some(item => item.id === product.id)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


