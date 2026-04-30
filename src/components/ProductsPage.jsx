import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { Filter } from 'lucide-react';

export default function ProductsPage({ searchQuery, initialCategory = 'All', initialSubcategory = 'All', onAddToCart, onUpdateQuantity, onToggleWishlist, cartItems = [], wishlistItems, onNavigateToProduct, isB2B, getDisplayPrice, allProducts = [], categories: backendCategories = [], subcategories = [], loading }) {
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(initialSubcategory);

  React.useEffect(() => {
    setCategory(initialCategory);
    setSubcategory(initialSubcategory);
  }, [initialCategory, initialSubcategory]);

  const filtered = allProducts.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes((searchQuery || '').toLowerCase());
    const matchesCategory = category === 'All' || p.category === category;
    const matchesSubcategory = subcategory === 'All' || p.subcategory === subcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const categoriesData = backendCategories.reduce((acc, cat) => {
    acc[cat.name] = subcategories
      .filter(sub => sub.category === cat._id || sub.category?._id === cat._id)
      .map(sub => ({ name: sub.name, img: sub.image }));
    return acc;
  }, {});

  const categoryNames = ['All', ...backendCategories.map(c => c.name)];

  return (
    <div className="bg-[#fcfdfd] min-h-screen">
      <div className="container mx-auto px-6 py-12">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-emerald">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
        </h1>
        {isB2B && (
          <span className="bg-blue-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
            B2B Mode Active
          </span>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Filter size={18}/> Filters</h3>
            <div className="space-y-4">
              {categoryNames.map(cat => (
                <div key={cat} className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={category === cat}
                      onChange={() => { setCategory(cat); setSubcategory('All'); }}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    />
                    <span className={`text-sm font-bold transition-colors ${category === cat ? 'text-blue-600' : 'text-gray-700 group-hover:text-blue-600'}`}>{cat}</span>
                  </label>
                  
                  {category === cat && categoriesData[cat] && (
                    <div className="pl-7 space-y-2 animate-[slideDown_0.2s_ease-out]">
                      {categoriesData[cat].map(sub => (
                        <label key={sub.name} className="flex items-center gap-2 cursor-pointer group/sub">
                          <input 
                            type="radio" 
                            name="subcategory" 
                            checked={subcategory === sub.name}
                            onChange={() => setSubcategory(sub.name)}
                            className="w-3 h-3 text-blue-500 focus:ring-blue-400 border-gray-300"
                          />
                          <span className={`text-xs font-bold transition-colors ${subcategory === sub.name ? 'text-blue-500' : 'text-gray-400 group-hover/sub:text-blue-500'}`}>{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid Area */}
        <div className="flex-grow min-w-0 w-full">
          {/* Subcategory Visual Bar */}
          {category !== 'All' && categoriesData[category] && (
            <div className="mb-12 relative">
              <div className="flex items-center justify-between mb-4 px-2">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-1 bg-blue-600 rounded-full"></div>
                  <h3 className="font-black text-lg text-emerald tracking-tight">Explore {category}</h3>
                  <span className="bg-gray-100 text-gray-500 text-[10px] font-black px-2 py-0.5 rounded-md uppercase">{categoriesData[category].length} Varieties</span>
                </div>
              </div>
              
              <div className="flex overflow-x-auto gap-2 md:gap-3 pb-2 scrollbar-hide -mx-2 px-2">
                <button 
                  onClick={() => setSubcategory('All')}
                  className={`flex-shrink-0 px-5 py-2.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 border ${subcategory === 'All' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-emerald-200 hover:text-emerald-600'}`}
                >
                  All {category}
                </button>
                
                {categoriesData[category].map(sub => (
                  <button 
                    key={sub.name}
                    onClick={() => setSubcategory(sub.name)}
                    className={`flex-shrink-0 group flex items-center gap-3 px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all duration-300 border ${subcategory === sub.name ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/30 scale-105' : 'bg-white border-gray-100 text-gray-500 hover:border-emerald-200 hover:bg-emerald-50/30'}`}
                  >
                    <div className={`w-6 h-6 rounded-lg overflow-hidden border transition-all ${subcategory === sub.name ? 'border-white/40' : 'border-gray-100 group-hover:border-emerald-200'}`}>
                      <img src={sub.img} alt={sub.name} className="w-full h-full object-cover" />
                    </div>
                    <span>{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100 font-medium">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full">
              {filtered.map(product => {
                const cartItem = cartItems.find(item => item.id === product.id);
                const displayData = getDisplayPrice ? getDisplayPrice(product) : { price: product.price, oldPrice: product.oldPrice };
                const productWithPrice = { ...product, ...displayData };

                return (
                  <div onClick={() => onNavigateToProduct(productWithPrice)} key={product.id} className="cursor-pointer w-full">
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
          )}
        </div>
      </div>
    </div>
  </div>
);
}


