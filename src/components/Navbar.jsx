import React, { useState, useEffect } from 'react';
import { ShoppingCart, ChevronDown, Menu, Heart, Search, X, Wheat, Leaf, ShoppingBag, Package, Coffee, LogOut, Settings, UserCircle, Home, LayoutGrid, PhoneCall, MapPin, Clock, Sun, Moon } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { IMAGE_BASE_URL } from '../config';

export default function Navbar({ cartCount = 0, wishlistCount = 0, onLoginClick, onNavigate, onSearch, onCategoryClick, onNavigateToProduct, currentPage = 'home', isB2B = false, onLogout, user, categories = [], subcategories = [], allProducts = [], isDarkMode, toggleTheme }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const [activeMegaCategory, setActiveMegaCategory] = useState('');
  const { city: liveCity, loading: locationLoading, refresh: refreshLocation } = useLocation();
  
  // Find primary address from saved addresses
  const primaryAddress = user?.savedAddresses?.find(addr => addr.isDefault);
  const displayLocation = primaryAddress ? (primaryAddress.city || primaryAddress.address?.split(',')[0]) : (liveCity || 'India');

  // B2B Verification Status
  const isB2BPending = user?.role === 'b2b' && !user.isVerified;

  // Generate dynamic megaData from categories and subcategories
  const megaData = categories.reduce((acc, cat) => {
    const catSubs = subcategories.filter(sub => sub.category === cat.id);
    
    // Map icons based on category name
    let icon = <ShoppingBag size={16} />;
    if (cat.name.toLowerCase().includes('rice')) icon = <Wheat size={16} />;
    else if (cat.name.toLowerCase().includes('pulse') || cat.name.toLowerCase().includes('dal')) icon = <Leaf size={16} />;
    else if (cat.name.toLowerCase().includes('flour') || cat.name.toLowerCase().includes('atta')) icon = <Package size={16} />;
    else if (cat.name.toLowerCase().includes('sugar') || cat.name.toLowerCase().includes('jaggery')) icon = <Coffee size={16} />;

    acc[cat.name] = {
      icon,
      img: (cat.image || cat.imageUrl)?.startsWith('http') ? (cat.image || cat.imageUrl) : (cat.image || cat.imageUrl ? `${IMAGE_BASE_URL}${cat.image || cat.imageUrl}` : 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=200'),
      items: catSubs.map(sub => ({
        name: sub.name,
        sub: sub.name,
        img: sub.image?.startsWith('http') ? sub.image : (sub.image ? `${IMAGE_BASE_URL}${sub.image}` : 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=200')
      }))
    };
    return acc;
  }, {});

  // Set initial active mega category safely
  useEffect(() => {
    if (categories.length > 0 && !megaData[activeMegaCategory]) {
      setActiveMegaCategory(categories[0].name);
    }
  }, [categories]);

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
    <>
      <div className="theme-navbar backdrop-blur-xl fixed top-0 left-0 w-full z-50 border-b border-gray-100 dark:border-white/5 h-[72px] flex flex-col justify-center transition-all duration-500">
        <nav className="container mx-auto px-4 md:px-6 flex items-center justify-between relative h-full">
          {/* Left: Menu & Logo */}
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              className="lg:hidden h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-700 dark:text-emerald-400 active:scale-95 transition-all"
              onClick={() => setIsMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
              <img src="/logo.png" alt="Zudo Logo" className="h-10 md:h-12 w-auto object-contain drop-shadow-sm brightness-0 dark:brightness-0 dark:invert" />
            </div>
            
            {/* Live Location Display */}
            <div className="hidden sm:flex flex-col ml-2 border-l border-gray-100 pl-4">
              <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                <MapPin size={12} strokeWidth={3} />
                Deliver to
              </div>
              <button 
                onClick={refreshLocation}
                className="text-[11px] font-black text-gray-800 dark:text-gray-200 flex items-center gap-1 hover:text-emerald-600 transition-colors max-w-[120px] lg:max-w-[200px]"
              >
                <span className="truncate">{locationLoading ? 'Locating...' : (displayLocation)}</span>
                <ChevronDown size={10} strokeWidth={3} />
              </button>
            </div>
          </div>
          
          {/* Center: Desktop Navigation */}
          <div className="hidden lg:flex items-center justify-center flex-1 mx-8 h-full">
            {!isSearchOpen ? (
              <div className="flex items-center gap-8 text-[13px] font-black uppercase tracking-widest text-gray-800 dark:text-gray-200">
                <button onClick={() => onNavigate('home')} className={`pb-1 transition-all ${currentPage === 'home' ? 'text-emerald-700 dark:text-emerald-400 scale-105' : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'}`}>Home</button>
                <button onClick={() => onNavigate('products')} className={`pb-1 transition-all ${currentPage === 'products' ? 'text-emerald-700 dark:text-emerald-400 scale-105' : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'}`}>Products</button>
                
                <div className="relative group cursor-pointer h-[72px] flex items-center">
                  <button className="flex items-center gap-1 text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-all pb-1 group-hover:opacity-100">
                    Categories <ChevronDown size={14} className="mt-0.5 group-hover:rotate-180 transition-transform" />
                  </button>
                  <div className="absolute top-full -left-10 pt-3 w-[580px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50">
                    <div className="bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] overflow-hidden border border-gray-100 flex h-[340px] backdrop-blur-2xl">
                      <div className="w-52 bg-gray-50/50 p-4 space-y-1 overflow-y-auto border-r border-gray-100">
                        <div className="px-3 mb-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Categories</div>
                        {Object.keys(megaData).map(cat => (
                          <button 
                            key={cat}
                            onMouseEnter={() => setActiveMegaCategory(cat)}
                            onClick={() => onCategoryClick(cat)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 ${activeMegaCategory === cat ? 'bg-white shadow-md text-emerald-700 ring-1 ring-emerald-50' : 'text-gray-500 hover:bg-white/50 hover:text-emerald-600'}`}
                          >
                            <div className={`w-8 h-8 rounded-lg overflow-hidden transition-all flex-shrink-0 ${activeMegaCategory === cat ? 'ring-2 ring-emerald-500 ring-offset-2' : 'grayscale'}`}>
                              <img src={megaData[cat].img} alt={cat} className="w-full h-full object-cover" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-wider">{cat}</span>
                          </button>
                        ))}
                      </div>
                      <div className="flex-grow p-6 bg-white overflow-y-auto">
                         <div className="flex items-center justify-between mb-6">
                           <div>
                             <h3 className="text-lg font-black text-gray-900 tracking-tight leading-none mb-1">{activeMegaCategory}</h3>
                             <div className="h-1 w-6 bg-emerald-500 rounded-full"></div>
                           </div>
                           <button onClick={() => onCategoryClick(activeMegaCategory)} className="px-4 py-2 bg-emerald-600/10 text-emerald-700 text-[9px] font-black uppercase rounded-lg hover:bg-emerald-600 hover:text-white transition-all tracking-widest cursor-pointer">View All</button>
                         </div>
                         <div className="grid grid-cols-2 gap-4">
                           {megaData[activeMegaCategory]?.items?.map(item => (
                             <button 
                               key={item.name}
                               onClick={() => onCategoryClick(activeMegaCategory, item.sub)}
                               className="group/card flex items-center gap-3 p-2 rounded-xl hover:bg-emerald-50/40 transition-all text-left border border-transparent hover:border-emerald-100"
                             >
                               <div className="w-10 h-10 rounded-lg overflow-hidden shadow-sm flex-shrink-0">
                                 <img src={item.img} alt={item.name} className="w-full h-full object-cover transform group-hover/card:scale-110 transition-transform duration-500" />
                               </div>
                               <div className="flex flex-col">
                                 <span className="text-xs font-bold text-gray-800 group-hover/card:text-emerald-700">{item.name}</span>
                                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Fresh Collection</span>
                               </div>
                             </button>
                           ))}
                         </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <button onClick={() => onNavigate('contact')} className={`pb-1 transition-all ${currentPage === 'contact' ? 'text-emerald-700 dark:text-emerald-400 scale-105' : 'text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400'}`}>Contact</button>
              </div>
            ) : (
              <div className="w-full max-w-2xl relative animate-[fadeIn_0.3s_ease-out] flex items-center h-full">
                <div className="fixed inset-0 z-40 cursor-pointer" onClick={() => setIsSearchOpen(false)}></div>
                <div className="w-full relative z-50">
                  <form onSubmit={handleSearchSubmit} className="relative w-full">
                    <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600" />
                    <input 
                      type="text" 
                      autoFocus
                      placeholder="What are you looking for today?" 
                      value={localSearchQuery}
                      onChange={(e) => setLocalSearchQuery(e.target.value)}
                      className="w-full bg-emerald-50/50 border border-emerald-100 rounded-full py-3.5 pl-14 pr-14 outline-none text-sm font-bold text-gray-800 placeholder-emerald-800/30 focus:bg-white focus:ring-4 focus:ring-emerald-500/5 transition-all shadow-inner"
                    />
                    <button type="button" onClick={() => { setIsSearchOpen(false); setLocalSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500 transition-colors p-2">
                      <X size={18} />
                    </button>
                  </form>
                  {localSearchQuery.trim() !== '' && (
                    <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-gray-50 overflow-hidden z-[60]">
                      {suggestions.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                           {suggestions.map(prod => (
                             <button 
                               key={prod.id} 
                               onClick={() => handleSuggestionClick(prod)} 
                               className="w-full flex items-center gap-4 p-4 hover:bg-emerald-50 transition-colors text-left cursor-pointer"
                             >
                               <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-lg object-cover border border-gray-100" />
                               <div className="flex-1">
                                 <div className="text-sm font-black text-gray-900">{prod.name}</div>
                                 <div className="text-xs text-emerald-600 font-black mt-0.5">₹{prod.price}</div>
                               </div>
                             </button>
                           ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center text-gray-400 font-bold italic text-sm">No results found</div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right: Icons & Profile */}
          <div className="flex items-center gap-2 md:gap-4">
            <button 
              onClick={toggleTheme}
              className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all text-emerald-700 dark:text-emerald-400"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
            </button>

            <button 
              onClick={() => setIsSearchOpen(!isSearchOpen)} 
              className={`h-10 w-10 md:h-11 md:w-11 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center hover:bg-emerald-600 dark:hover:bg-emerald-500 hover:text-white transition-all text-emerald-700 dark:text-emerald-400 ${isSearchOpen && !window.matchMedia('(max-width: 1024px)').matches ? 'lg:opacity-0 lg:pointer-events-none' : ''}`}
            >
              <Search size={18} strokeWidth={2.5} />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button onClick={() => onNavigate('wishlist')} className="h-10 w-10 md:h-11 md:w-11 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all text-emerald-700 relative group">
                <Heart size={18} strokeWidth={2.5} />
                {wishlistCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-lg">{wishlistCount}</span>
                )}
              </button>
              
              <button 
                onClick={() => onNavigate('cart')} 
                className={`h-10 w-10 md:h-11 md:w-11 rounded-full bg-emerald-50 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all text-emerald-700 relative group ${isB2BPending ? 'ring-2 ring-amber-500 ring-offset-2' : ''}`}
              >
                {isB2BPending ? <Clock size={18} className="text-amber-600 group-hover:text-white" /> : <ShoppingCart size={18} strokeWidth={2.5} />}
                {cartCount > 0 && !isB2BPending && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-emerald-600 text-white text-[10px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-lg">{cartCount}</span>
                )}
                {isB2BPending && (
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-500 text-white text-[8px] flex items-center justify-center rounded-full font-black border-2 border-white shadow-lg animate-pulse">!</span>
                )}
              </button>
            </div>
            
            {user ? (
              <div className="relative group">
                <button className="flex items-center gap-3 bg-gray-50 hover:bg-white px-1.5 md:px-4 py-1.5 rounded-2xl border border-gray-100 hover:border-emerald-100 transition-all duration-300">
                  <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-emerald-600 overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
                    {user.profileImage || user.profilePicture ? (
                      <img src={user.profileImage || user.profilePicture} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white">
                        <UserCircle size={20} />
                      </div>
                    )}
                  </div>
                  <div className="hidden lg:flex flex-col items-start pr-1">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] leading-none mb-1">My Account</span>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-black text-gray-800">{user.name.split(' ')[0]}</span>
                      <ChevronDown size={10} className="text-gray-400 group-hover:rotate-180 transition-all" />
                    </div>
                  </div>
                </button>
                {/* Account Dropdown Desktop */}
                <div className="absolute top-full right-0 mt-3 w-64 bg-white rounded-3xl shadow-[0_30px_60px_rgba(0,0,0,0.12)] border border-gray-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 overflow-hidden transform origin-top-right group-hover:scale-100 scale-95 p-2">
                  <div className="p-5 bg-emerald-50 rounded-2xl mb-2 border border-emerald-100">
                    <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1 opacity-60">{user.role === 'b2b' ? 'Business Portal' : 'Personal Portal'}</p>
                    <p className="text-sm font-black text-emerald-900 truncate mb-2">{user.name}</p>
                    {user.role === 'b2b' && (
                      <div className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full w-max shadow-sm ${user.isVerified ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white animate-pulse'}`}>
                        {user.isVerified ? '✓ Verified Partner' : '⏳ Verification Pending'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <button onClick={() => onNavigate('profile', 'profile')} className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item">
                      <Settings size={18} className="text-gray-400 group-hover/item:text-emerald-600 transition-colors" />
                      Edit Profile
                    </button>
                    <button onClick={() => onNavigate('profile', 'addresses')} className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item">
                      <MapPin size={18} className="text-gray-400 group-hover/item:text-emerald-600 transition-colors" />
                      My Addresses
                    </button>
                    <button onClick={() => onNavigate('orders')} className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-gray-600 hover:bg-emerald-50 hover:text-emerald-700 rounded-xl transition-all group/item">
                      <Package size={18} className="text-gray-400 group-hover/item:text-emerald-600 transition-colors" />
                      Order History
                    </button>
                    <div className="h-px bg-gray-50 my-1 mx-2"></div>
                    <button onClick={onLogout} className="w-full flex items-center gap-3 px-4 py-3.5 text-xs font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-xl transition-all group/item">
                      <LogOut size={18} className="text-red-400 group-hover/item:text-red-600" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => onLoginClick('select')} 
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl px-4 md:px-8 py-2.5 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95"
              >
                Sign In
              </button>
            )}
          </div>
        </nav>

        {/* Mobile Search Overlay */}
        {isSearchOpen && (
          <div className="lg:hidden absolute top-[72px] left-0 w-full bg-white p-4 border-b border-gray-100 shadow-xl z-[60] animate-[slideDown_0.3s_ease-out]">
            <div className="relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600" />
                <input 
                  type="text" 
                  autoFocus
                  placeholder="Find your fresh items..." 
                  value={localSearchQuery}
                  onChange={(e) => setLocalSearchQuery(e.target.value)}
                  className="w-full bg-emerald-50/30 border border-emerald-100 rounded-2xl py-4 pl-12 pr-12 outline-none text-sm font-bold text-gray-800 shadow-inner"
                />
                <button type="button" onClick={() => { setIsSearchOpen(false); setLocalSearchQuery(''); }} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 p-2">
                  <X size={16} />
                </button>
              </form>
              {localSearchQuery.trim() !== '' && (
                <div className="mt-4 max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-inner border border-gray-50">
                  {suggestions.length > 0 ? (
                    <div className="divide-y divide-gray-50">
                      {suggestions.map(prod => (
                        <button 
                          key={prod.id} 
                          onClick={() => handleSuggestionClick(prod)} 
                          className="w-full flex items-center gap-4 p-4 active:bg-emerald-50 transition-colors cursor-pointer text-left"
                        >
                          <img src={prod.image} alt={prod.name} className="w-14 h-14 rounded-xl object-cover border border-gray-100" />
                          <div className="flex-1">
                            <div className="text-sm font-black text-gray-900">{prod.name}</div>
                            <div className="text-xs text-emerald-600 font-black mt-0.5">₹{prod.price}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-10 text-center text-gray-400 font-bold italic text-sm">No results found</div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Mobile Bottom Nav (App Style) */}
      <div className="lg:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md bg-white dark:bg-[#121212]/90 backdrop-blur-2xl h-16 rounded-[2rem] border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.2)] z-50 flex items-center justify-around px-2 transition-colors">
        <button onClick={() => onNavigate('home')} className={`flex flex-col items-center gap-1 transition-all ${currentPage === 'home' ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}>
          <Home size={22} strokeWidth={currentPage === 'home' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Home</span>
        </button>
        <button onClick={() => onNavigate('products')} className={`flex flex-col items-center gap-1 transition-all ${currentPage === 'products' ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}>
          <LayoutGrid size={22} strokeWidth={currentPage === 'products' ? 3 : 2} />
          <span className="text-[9px] font-black uppercase tracking-tighter">Explore</span>
        </button>
        <button onClick={() => onNavigate('cart')} className={`relative flex flex-col items-center gap-1 transition-all ${currentPage === 'cart' ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}>
          <div className="relative">
            {isB2BPending ? <Clock size={22} className="text-amber-500" /> : <ShoppingCart size={22} strokeWidth={currentPage === 'cart' ? 3 : 2} />}
            {cartCount > 0 && !isB2BPending && <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-emerald-600 text-white text-[8px] flex items-center justify-center rounded-full font-black border border-white">{cartCount}</span>}
            {isB2BPending && <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-amber-500 text-white text-[8px] flex items-center justify-center rounded-full font-black border border-white animate-pulse">!</span>}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">{isB2BPending ? 'Pending' : 'Cart'}</span>
        </button>
        <button onClick={() => onNavigate('wishlist')} className={`relative flex flex-col items-center gap-1 transition-all ${currentPage === 'wishlist' ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}>
          <div className="relative">
            <Heart size={22} strokeWidth={currentPage === 'wishlist' ? 3 : 2} />
            {wishlistCount > 0 && <span className="absolute -top-1.5 -right-1.5 h-4 w-4 bg-red-500 text-white text-[8px] flex items-center justify-center rounded-full font-black border border-white">{wishlistCount}</span>}
          </div>
          <span className="text-[9px] font-black uppercase tracking-tighter">Saved</span>
        </button>
        {user && (
          <button onClick={() => onNavigate('profile')} className={`flex flex-col items-center gap-1 transition-all ${currentPage === 'profile' ? 'text-emerald-600 scale-110' : 'text-gray-400'}`}>
            <div className={`w-6 h-6 rounded-lg overflow-hidden border-2 ${currentPage === 'profile' ? 'border-emerald-600' : 'border-gray-200'}`}>
              <img src={user.profileImage || user.profilePicture || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Me</span>
          </button>
        )}
      </div>

      {/* Mobile Drawer Overlay */}
      {isMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] transition-opacity duration-500 cursor-pointer" onClick={() => setIsMenuOpen(false)}></div>
          <div className="fixed top-0 left-0 h-full w-[80%] max-sm bg-white dark:bg-[#121212] z-[110] shadow-[20px_0_60px_rgba(0,0,0,0.15)] animate-[slideInLeft_0.4s_ease-out] flex flex-col transition-colors">
            <div className="p-8 bg-emerald-600 text-white relative">
              <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                <X size={24} />
              </button>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl border border-white/20 p-2">
                  <img src="/logo.png" alt="Zudo" className="w-full h-full object-contain brightness-0 invert" />
                </div>
                <div>
                  <h2 className="text-2xl font-black tracking-tight leading-none">Zudo</h2>
                  <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest mt-1">Premium Groceries</p>
                </div>
              </div>
              {user ? (
                <div className="flex items-center gap-3 mt-8 p-3 bg-white/10 rounded-2xl border border-white/10">
                  <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-white/20">
                    <img src={user.profileImage || user.profilePicture || 'https://via.placeholder.com/100'} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-xs font-black leading-none">{user.name}</p>
                    <p className="text-[10px] text-white/60 mt-1">{user.email}</p>
                  </div>
                </div>
              ) : (
                <button onClick={() => { setIsMenuOpen(false); onLoginClick('select'); }} className="mt-8 w-full py-4 bg-white text-emerald-700 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-black/10">
                  Sign In / Sign Up
                </button>
              )}
            </div>

            <div className="flex-grow overflow-y-auto p-6 space-y-2">
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Navigation</p>
              <button onClick={() => { onNavigate('home'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${currentPage === 'home' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'}`}>
                <Home size={18} /> Home
              </button>
              <button onClick={() => { onNavigate('products'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${currentPage === 'products' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'}`}>
                <LayoutGrid size={18} /> Explore Shop
              </button>
              <button onClick={() => { onNavigate('contact'); setIsMenuOpen(false); }} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${currentPage === 'contact' ? 'bg-emerald-50 text-emerald-700' : 'text-gray-600'}`}>
                <PhoneCall size={18} /> Contact Us
              </button>
              
              <div className="h-px bg-gray-50 my-6 mx-4"></div>
              <p className="px-4 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Categories</p>
              <div className="grid grid-cols-1 gap-2">
                {categories.map(cat => (
                  <button key={cat._id} onClick={() => { onCategoryClick(cat.name); setIsMenuOpen(false); }} className="flex items-center gap-4 px-5 py-3 text-sm font-bold text-gray-700 hover:text-emerald-600 transition-all text-left">
                    <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                      <img src={(cat.image || cat.imageUrl)?.startsWith('http') ? (cat.image || cat.imageUrl) : (cat.image || cat.imageUrl ? `${IMAGE_BASE_URL}${cat.image || cat.imageUrl}` : 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=100')} alt={cat.name} className="w-full h-full object-cover" />
                    </div>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {user && (
              <div className="p-6 border-t border-gray-50">
                <button onClick={() => { onLogout(); setIsMenuOpen(false); }} className="w-full flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 rounded-2xl font-black text-xs uppercase tracking-widest transition-all hover:bg-red-600 hover:text-white">
                  <LogOut size={18} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
