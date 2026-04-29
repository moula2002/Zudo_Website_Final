import React, { useState } from 'react';
import ProductCard from './ProductCard';
import { allProducts } from '../data';
import { Filter } from 'lucide-react';

export default function ProductsPage({ searchQuery, initialCategory = 'All', initialSubcategory = 'All', onAddToCart, onUpdateQuantity, onToggleWishlist, cartItems = [], wishlistItems, onNavigateToProduct, isB2B, getDisplayPrice }) {
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

  const categoriesData = {
    'Rice': [
      { name: 'Basmati', img: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=200' },
      { name: 'Sona Masoori', img: 'https://pipingpotcurry.com/wp-content/uploads/2020/02/Sona-Masoori-White-Rice-Piping-Pot-Curry.jpg' }
    ],
    'Pulses': [
      { name: 'Dals', img: 'https://5.imimg.com/data5/SELLER/Default/2023/1/LJ/XB/NO/182527119/yellow-toor-dal-1000x1000.JPG' },
      { name: 'Beans', img: 'https://static.vecteezy.com/system/resources/previews/005/930/322/large_2x/collage-various-beans-mix-peas-agriculture-of-natural-healthy-food-for-cooking-ingredients-set-of-different-whole-grains-beans-and-legumes-seeds-lentils-and-nuts-colorful-snack-texture-background-free-photo.JPG' }
    ],
    'Flours': [
      { name: 'Wheat', img: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?auto=format&fit=crop&q=80&w=200' },
      { name: 'Other Flours', img: 'https://static.toiimg.com/photo/70364232.cms' }
    ],
    'Sugar': [
      { name: 'Jaggery', img: 'https://5.imimg.com/data5/SELLER/Default/2023/8/339365834/ST/ST/IF/48557502/organic-brown-sugar-jaggery-500x500.jpg' },
      { name: 'White Sugar', img: 'https://tiimg.tistatic.com/fp/1/008/606/white-refined-sugar-559.jpg' }
    ]
  };

  const categories = ['All', ...Object.keys(categoriesData)];

  return (
    <div className="container mx-auto px-6 py-12 min-h-[70vh]">
      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">
          {searchQuery ? `Search Results for "${searchQuery}"` : 'All Products'}
        </h1>
        {isB2B && (
          <span className="bg-emerald-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
            B2B Mode Active
          </span>
        )}
      </div>
      
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <div className="w-full md:w-64 flex-shrink-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Filter size={18}/> Filters</h3>
            <div className="space-y-4">
              {categories.map(cat => (
                <div key={cat} className="space-y-2">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="radio" 
                      name="category" 
                      checked={category === cat}
                      onChange={() => { setCategory(cat); setSubcategory('All'); }}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className={`text-sm font-bold transition-colors ${category === cat ? 'text-emerald-600' : 'text-gray-700 group-hover:text-emerald-600'}`}>{cat}</span>
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
                            className="w-3 h-3 text-emerald-500 focus:ring-emerald-400 border-gray-300"
                          />
                          <span className={`text-xs font-bold transition-colors ${subcategory === sub.name ? 'text-emerald-500' : 'text-gray-400 group-hover/sub:text-emerald-500'}`}>{sub.name}</span>
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
        <div className="flex-grow">
          {/* Subcategory Visual Bar */}
          {category !== 'All' && categoriesData[category] && (
            <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
              <div className="flex gap-4 min-w-max">
                <button 
                  onClick={() => setSubcategory('All')}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl transition-all border ${subcategory === 'All' ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/10' : 'bg-white border-gray-100 hover:border-emerald-200'}`}
                >
                  <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 font-black text-xs uppercase italic">All</div>
                  <span className={`text-[11px] font-black uppercase tracking-widest ${subcategory === 'All' ? 'text-emerald-700' : 'text-gray-500'}`}>All {category}</span>
                </button>
                
                {categoriesData[category].map(sub => (
                  <button 
                    key={sub.name}
                    onClick={() => setSubcategory(sub.name)}
                    className={`flex flex-col items-center gap-3 p-3 rounded-2xl transition-all border min-w-[100px] ${subcategory === sub.name ? 'bg-emerald-50 border-emerald-200 shadow-lg shadow-emerald-500/10' : 'bg-white border-gray-100 hover:border-emerald-200'}`}
                  >
                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm">
                      <img src={sub.img} alt={sub.name} className="w-full h-full object-cover" />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest ${subcategory === sub.name ? 'text-emerald-700' : 'text-gray-500'}`}>{sub.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-gray-500 bg-white rounded-2xl border border-gray-100 font-medium">No products found.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filtered.map(product => {
                const cartItem = cartItems.find(item => item.id === product.id);
                const displayData = getDisplayPrice ? getDisplayPrice(product) : { price: product.price, oldPrice: product.oldPrice };
                const productWithPrice = { ...product, ...displayData };

                return (
                  <div onClick={() => onNavigateToProduct(productWithPrice)} key={product.id} className="cursor-pointer">
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
  );
}


