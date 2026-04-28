import React, { useState } from 'react';
import { ShoppingCart, ChevronDown, Menu, Heart, Search, X, Wheat, Leaf, ShoppingBag, Package, Coffee } from 'lucide-react';
import { allProducts } from '../data';

export default function Navbar({ cartCount = 0, wishlistCount = 0, onLoginClick, onNavigate, onSearch, onNavigateToProduct, currentPage = 'home' }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');

  const suggestions = localSearchQuery.trim() === '' ? [] : allProducts.filter(p => p.name.toLowerCase().includes(localSearchQuery.toLowerCase())).slice(0, 5);

  const handleSuggestionClick = (product) => {
    setIsSearchOpen(false);
    setLocalSearchQuery('');
    if (onNavigateToProduct) onNavigateToProduct(product);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (localSearchQuery.trim()) {
      setIsSearchOpen(false);
      if (onSearch) onSearch(localSearchQuery);
      setLocalSearchQuery('');
    }
  };

  return (
    <div className="bg-white/60 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 h-[72px] flex flex-col justify-center">
      <nav className="container mx-auto px-6 flex items-center justify-between relative h-full">
        {/* Left: Logo */}
        <div className="flex items-center cursor-pointer flex-shrink-0" onClick={() => onNavigate('home')}>
          <img src="/logo.png" alt="Grocery Logo" className="h-12 md:h-14 w-auto object-contain drop-shadow-sm" />
        </div>
        
        {/* Center: Links OR Desktop Search */}
        <div className="hidden lg:flex items-center justify-center flex-1 mx-8 h-full">
          {!isSearchOpen ? (
            <div className="flex items-center gap-8 text-sm font-bold text-gray-800 animate-[fadeIn_0.2s_ease-out]">
              <button onClick={() => onNavigate('home')} className={`pb-1 transition-colors ${currentPage === 'home' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'hover:text-emerald-600 border-b-2 border-transparent'}`}>Home</button>
              <button onClick={() => onNavigate('products')} className={`pb-1 transition-colors ${currentPage === 'products' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'hover:text-emerald-600 border-b-2 border-transparent'}`}>Products</button>
              
              <div className="relative group cursor-pointer flex items-center">
                <button className="flex items-center gap-1 hover:text-emerald-600 transition-colors pb-1 border-b-2 border-transparent">
                  Categories <ChevronDown size={14} className="mt-0.5 text-gray-500 group-hover:text-emerald-600 transition-colors" />
                </button>
                <div className="absolute top-full -left-4 pt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                  <div className="bg-white text-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-100 transform origin-top-left group-hover:translate-y-0 translate-y-2 transition-all duration-300">
                    <a href="#" className="flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 hover:text-emerald-700 font-medium border-b border-gray-50 transition-colors group/item">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-200 transition-colors">
                        <Wheat size={14} className="text-emerald-600" />
                      </div>
                      Rice
                    </a>
                    <a href="#" className="flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 hover:text-emerald-700 font-medium border-b border-gray-50 transition-colors group/item">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-200 transition-colors">
                        <Leaf size={14} className="text-emerald-600" />
                      </div>
                      Pulses
                    </a>
                    <a href="#" className="flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 hover:text-emerald-700 font-medium border-b border-gray-50 transition-colors group/item">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-200 transition-colors">
                        <ShoppingBag size={14} className="text-emerald-600" />
                      </div>
                      BTC
                    </a>
                    <a href="#" className="flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 hover:text-emerald-700 font-medium border-b border-gray-50 transition-colors group/item">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-200 transition-colors">
                        <Package size={14} className="text-emerald-600" />
                      </div>
                      Flours & Sooji
                    </a>
                    <a href="#" className="flex items-center gap-3 px-5 py-3 hover:bg-emerald-50 hover:text-emerald-700 font-medium transition-colors group/item">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center group-hover/item:bg-emerald-200 transition-colors">
                        <Coffee size={14} className="text-emerald-600" />
                      </div>
                      Sugar & Jaggery
                    </a>
                  </div>
                </div>
              </div>
              
              <button onClick={() => onNavigate('contact')} className={`pb-1 transition-colors ${currentPage === 'contact' ? 'border-b-2 border-emerald-600 text-emerald-700' : 'hover:text-emerald-600 border-b-2 border-transparent'}`}>Contact Us</button>
            </div>
          ) : (
            <div className="w-full max-w-2xl relative animate-[fadeIn_0.2s_ease-out] flex items-center h-full">
              {/* Invisible backdrop to close search when clicking outside */}
              <div className="fixed inset-0 z-40" onClick={() => setIsSearchOpen(false)}></div>
              
              <div className="w-full relative z-50">
                <form onSubmit={handleSearchSubmit} className="relative w-full">
                  <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    type="text" 
                    autoFocus
                    placeholder="Search for premium groceries..." 
                    value={localSearchQuery}
                    onChange={(e) => setLocalSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-14 pr-14 outline-none text-sm font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all shadow-inner"
                  />
                  <button type="button" onClick={() => { setIsSearchOpen(false); setLocalSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-gray-100 flex items-center justify-center">
                    <X size={16} />
                  </button>
                </form>
                
                {/* Desktop Suggestions Dropdown */}
                {localSearchQuery.trim() !== '' && (
                  <div className="absolute top-[calc(100%+10px)] left-0 right-0 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="max-h-[400px] overflow-y-auto">
                      {suggestions.length > 0 ? (
                        <div className="py-2">
                          <div className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Product Suggestions</div>
                          {suggestions.map(prod => (
                            <div key={prod.id} onClick={() => handleSuggestionClick(prod)} className="flex items-center gap-4 px-5 py-3 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group">
                              <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover border border-gray-100 shadow-sm group-hover:border-emerald-200 transition-colors" />
                              <div className="flex-1">
                                <div className="text-sm font-bold text-gray-800 group-hover:text-emerald-700 transition-colors">{prod.name}</div>
                                <div className="text-xs text-emerald-600 font-extrabold mt-0.5">{prod.price} <span className="text-gray-400 line-through text-[10px] ml-1 font-medium">{prod.oldPrice}</span></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center flex flex-col items-center">
                          <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <Search size={20} className="text-gray-300" />
                          </div>
                          <p className="text-gray-500 text-sm font-medium">No products found for "{localSearchQuery}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right: Icons */}
        <div className="flex items-center gap-3 md:gap-5 flex-shrink-0">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-all border border-emerald-100 ${isSearchOpen ? 'lg:opacity-0 lg:pointer-events-none' : ''}`}>
            <Search size={18} className="text-emerald-700" />
          </button>

          <button onClick={() => onNavigate('wishlist')} className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-all relative group border border-emerald-100">
            <Heart size={18} className="group-hover:scale-110 transition-transform text-emerald-700" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-md">{wishlistCount}</span>
            )}
          </button>
          
          <button onClick={() => onNavigate('cart')} className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-all relative group border border-emerald-100">
            <ShoppingCart size={18} className="group-hover:scale-110 transition-transform text-emerald-700" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-600 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-md">{cartCount}</span>
            )}
          </button>
          
          <button onClick={onLoginClick} className="hidden sm:block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-sm font-extrabold transition-all duration-300 shadow-lg shadow-emerald-600/30 transform hover:-translate-y-0.5">
            Sign Up
          </button>
          
          <button className="lg:hidden h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-100 transition-all border border-emerald-100" onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <Menu size={20} className="text-emerald-700" />
          </button>
        </div>
      </nav>

      {/* Mobile Search Dropdown (Below Nav) */}
      {isSearchOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white p-4 border-b border-gray-100 shadow-md z-40 animate-[slideDown_0.2s_ease-out]">
          {/* Invisible backdrop */}
          <div className="fixed inset-0 top-[72px] z-30" onClick={() => setIsSearchOpen(false)}></div>
          
          <div className="relative z-40">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                autoFocus
                placeholder="Search products..." 
                value={localSearchQuery}
                onChange={(e) => setLocalSearchQuery(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-full py-3 pl-12 pr-12 outline-none text-sm font-bold text-gray-800 placeholder-gray-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
              <button type="button" onClick={() => { setIsSearchOpen(false); setLocalSearchQuery(''); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors bg-white rounded-full p-1.5 shadow-sm border border-gray-100">
                <X size={14} />
              </button>
            </form>
            
            {/* Mobile Suggestions List */}
            {localSearchQuery.trim() !== '' && (
              <div className="mt-3 max-h-[300px] overflow-y-auto bg-white rounded-xl shadow-inner border border-gray-50">
                {suggestions.length > 0 ? (
                  <div className="py-2">
                    {suggestions.map(prod => (
                      <div key={prod.id} onClick={() => handleSuggestionClick(prod)} className="flex items-center gap-3 px-4 py-2 hover:bg-emerald-50 cursor-pointer transition-colors border-b border-gray-50 last:border-0 group">
                        <img src={prod.image} alt={prod.name} className="w-10 h-10 rounded-lg object-cover border border-gray-100 shadow-sm" />
                        <div className="flex-1">
                          <div className="text-sm font-bold text-gray-800 group-hover:text-emerald-700">{prod.name}</div>
                          <div className="text-xs text-emerald-600 font-extrabold">{prod.price}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-6 text-center text-gray-500 text-sm font-medium">
                    No products found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 w-full bg-white z-40 border-t border-gray-100 shadow-xl p-6 flex flex-col gap-4 text-gray-800">
          <button onClick={() => { onNavigate('home'); setIsMenuOpen(false); }} className={`text-left font-bold pb-2 border-b border-gray-100 ${currentPage === 'home' ? 'text-emerald-600' : 'hover:text-emerald-600'}`}>Home</button>
          <button onClick={() => { onNavigate('products'); setIsMenuOpen(false); }} className={`text-left font-bold pb-2 border-b border-gray-100 ${currentPage === 'products' ? 'text-emerald-600' : 'hover:text-emerald-600'}`}>Products</button>
          <div className="pb-2 border-b border-gray-100">
            <span className="font-bold block mb-2 text-gray-800">Categories</span>
            <div className="pl-4 flex flex-col gap-3 font-medium">
               <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                 <Wheat size={14} className="text-emerald-600" /> Rice
               </a>
               <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                 <Leaf size={14} className="text-emerald-600" /> Pulses
               </a>
               <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                 <ShoppingBag size={14} className="text-emerald-600" /> BTC
               </a>
               <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                 <Package size={14} className="text-emerald-600" /> Flours & Sooji
               </a>
               <a href="#" className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors">
                 <Coffee size={14} className="text-emerald-600" /> Sugar & Jaggery
               </a>
            </div>
          </div>
          <button onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} className={`text-left font-bold pb-2 transition-colors ${currentPage === 'contact' ? 'text-emerald-600' : 'hover:text-emerald-600'}`}>Contact Us</button>
        </div>
      )}
    </div>
  );
}
