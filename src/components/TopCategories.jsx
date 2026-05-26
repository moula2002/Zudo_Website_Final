import React from 'react';
import { IMAGE_BASE_URL, cleanImageUrl } from '../config';

const defaultImages = {
  'Pulses': 'https://static.toiimg.com/photo/82196489.cms',
  'Rice': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500',
  'Flours': 'https://restaurantsupplier1.com/wp-content/uploads/2024/08/Sooji.jpg',
  'Sugar': 'https://storables.com/wp-content/uploads/2023/09/how-to-store-palm-sugar-1695371267.jpg',
  'Oil': 'https://images.unsplash.com/photo-1474979266404-7eaacbadcbaf?auto=format&fit=crop&q=80&w=500'
};

export default function TopCategories({ onNavigate, onCategoryClick, categories = [], loading }) {
  const displayCategories = categories;

  if (categories.length === 0 && !loading) {
    return (
      <section className="container mx-auto px-6 py-8 text-center">
        <h2 className="text-xl font-black text-gray-900 mb-2 tracking-tighter">Collections</h2>
        <p className="text-gray-400 font-bold uppercase tracking-widest text-[8px]">No categories found in backend</p>
      </section>
    );
  }

  if (loading && categories.length === 0) {
    return (
      <section className="container mx-auto px-6 py-12 text-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-6 w-32 bg-gray-100 rounded-full mb-8"></div>
          <div className="flex gap-8 justify-center w-full overflow-hidden">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="flex flex-col items-center">
                <div className="w-16 h-16 md:w-24 md:h-24 bg-gray-50 rounded-full mb-3"></div>
                <div className="h-3 w-12 bg-gray-50 rounded-full"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-6 py-10 md:py-12 bg-white">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">Shop by Category</h2>
          <div className="h-1 w-12 bg-emerald-500 rounded-full mt-1"></div>
        </div>
        <button 
          onClick={() => onNavigate && onNavigate('products')}
          className="text-xs font-black text-emerald-600 uppercase tracking-widest hover:text-emerald-700 transition-colors"
        >
          View All &rarr;
        </button>
      </div>
      
      <div className="flex gap-6 md:gap-10 overflow-x-auto pb-4 scrollbar-hide">
        {displayCategories.map((cat) => (
          <div 
            key={cat._id || cat.id} 
            onClick={() => onCategoryClick ? onCategoryClick(cat.name || cat.categoryKey) : (onNavigate && onNavigate('products'))} 
            className="group flex flex-col items-center cursor-pointer flex-shrink-0"
          >
            <div className="relative w-16 h-16 md:w-28 md:h-28 mb-3 transition-all duration-500 transform group-hover:-translate-y-1">
              {/* Outer Border */}
              <div className="absolute inset-[-4px] border border-gray-100 rounded-full group-hover:border-emerald-500 group-hover:border-dashed transition-all duration-500"></div>
              
              {/* Main Circular Image */}
              <div className="absolute inset-0 bg-white rounded-full border-2 border-white shadow-md overflow-hidden group-hover:shadow-xl group-hover:shadow-emerald-500/10 transition-all duration-500">
                <img 
                  src={cleanImageUrl(cat.image || cat.imageUrl) || defaultImages[cat.name] || 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=500'} 
                  alt={cat.name} 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-all duration-700 ease-out"
                />
              </div>
            </div>
            
            <span className="font-bold text-gray-900 text-[10px] md:text-xs group-hover:text-emerald-600 transition-colors text-center whitespace-nowrap">
              {cat.name}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
