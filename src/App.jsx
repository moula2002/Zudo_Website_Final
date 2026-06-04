import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TopCategories from './components/TopCategories';
import Showcase from './components/Showcase';
import HomeProducts from './components/HomeProducts';
import NewArrivals from './components/NewArrivals';
import HomeNeeds from './components/HomeNeeds';
import PromoBanner from './components/PromoBanner';
import Testimonials from './components/Testimonials';
import Footer from './components/Footer';
import LoginModal from './components/LoginModal';
import CartPage from './components/CartPage';
import WishlistPage from './components/WishlistPage';
import ProductsPage from './components/ProductsPage';
import ProductDetails from './components/ProductDetails';
import ContactPage from './components/ContactPage';
import B2BVerificationScreen from './components/B2BVerificationScreen';
import CheckoutPage from './components/CheckoutPage';
import ProfilePage from './components/ProfilePage';
import OrdersPage from './components/OrdersPage';
import PolicyPage from './components/PolicyPage';
import ResetPasswordPage from './components/ResetPasswordPage';
import FeedsPage from './components/FeedsPage';
import { API_URL, API_BASE_URL } from './config';
import { MapPin } from 'lucide-react';
import LocationGateway from './components/LocationGateway';
import PopupAdModal from './components/PopupAdModal';
import './App.css';

const SUPPORTED_MAPPING = {
  'bangalore': 'zudo-bengaluru',
  'bengaluru': 'zudo-bengaluru',
  'mysore': 'zudo-mysore',
  'kozhikode': 'zudo-kozhikode',
  'coimbatore': 'zudo-coimbatore'
};

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('zudo_cart_items');
    if (savedCart) {
      try {
        return JSON.parse(savedCart);
      } catch (e) {
        console.error('Failed to parse saved cart items');
      }
    }
    return [];
  });
  const [wishlistItems, setWishlistItems] = useState(() => {
    const savedWishlist = localStorage.getItem('zudo_wishlist_items');
    if (savedWishlist) {
      try {
        return JSON.parse(savedWishlist);
      } catch (e) {
        console.error('Failed to parse saved wishlist items');
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('zudo_cart_items', JSON.stringify(cartItems));
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem('zudo_wishlist_items', JSON.stringify(wishlistItems));
  }, [wishlistItems]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All');
  const [profileTab, setProfileTab] = useState('profile');
  const [user, setUser] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isB2B, setIsB2B] = useState(false);
  const [b2bStatus, setB2bStatus] = useState('none');
  const [connectionError, setConnectionError] = useState(false);
  const [locationNotAvailable, setLocationNotAvailable] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme === 'dark';
  });

  // Load user from storage immediately
  const loadUserFromStorage = () => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        return parsedUser;
      } catch (e) {
        console.error('Failed to parse saved user');
      }
    }
    return null;
  };

  useEffect(() => {
    loadUserFromStorage();
    const handleLoginEvent = () => loadUserFromStorage();
    window.addEventListener('user-login-success', handleLoginEvent);

    // Handle Route Detection on Refresh
    const path = window.location.pathname;
    if (path === '/') {
      setCurrentPage('home');
    } else if (path.startsWith('/reset-password/')) {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        window.history.pushState({}, '', '/');
        setCurrentPage('home');
      } else {
        setCurrentPage('resetPassword');
      }
    } else {
      // Map kebab-case URL to camelCase page state
      const page = path.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      const validPages = ['products', 'productDetails', 'cart', 'wishlist', 'checkout', 'profile', 'orders', 'contact', 'terms', 'privacy', 'shipping', 'returns', 'resetPassword', 'feeds'];
      if (validPages.includes(page)) {
        setCurrentPage(page);
      }
    }

    const handlePopState = (event) => {
      if (event.state && event.state.page) {
        setCurrentPage(event.state.page);
        if (event.state.tab) setProfileTab(event.state.tab);
      } else {
        const path = window.location.pathname;
        const page = path === '/' ? 'home' : path.slice(1).replace(/-([a-z])/g, (g) => g[1].toUpperCase());
        setCurrentPage(page || 'home');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('user-login-success', handleLoginEvent);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  useEffect(() => {
    const syncProfile = async () => {
      const token = localStorage.getItem('token');
      const selectedCity = localStorage.getItem('selectedCity');
      if (!token || !selectedCity) return;

      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        // Now using API_URL which is set to production
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
          headers: { 
            'Authorization': `Bearer ${token}`,
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        }).catch(() => null);

        if (profileRes && profileRes.ok) {
          const latestUser = await profileRes.json();
          // Ensure profileImage is set for frontend consistency
          const mappedUser = {
            ...latestUser,
            profileImage: latestUser.profilePicture || latestUser.profileImage
          };
          setUser(mappedUser);
          localStorage.setItem('user', JSON.stringify(mappedUser));
        } else if (profileRes && profileRes.status === 401) {
          handleLogout();
        }
      } catch (err) {
        console.error('App: Profile sync error:', err);
      }
    };

    const fetchInitialData = async () => {
      try {
        setLoading(true);
        
        // Match Navbar's location logic
        const savedUser = JSON.parse(localStorage.getItem('user') || 'null');
        const primaryAddress = savedUser?.savedAddresses?.find(addr => addr.isDefault);
        const liveLocation = JSON.parse(localStorage.getItem('userLocation') || 'null');
        const liveCity = liveLocation?.city || '';
        const selectedCity = localStorage.getItem('selectedCity') || '';
        
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || (primaryAddress ? (primaryAddress.city || primaryAddress.address?.split(',')[0]) : (liveCity || 'Bengaluru'));
                               
        console.log(`[DEBUG] Fetching data for tenant/city: ${locationHeader}`);
        
        // Prepare headers as per documentation
        const headers = { 
          'x-location': locationHeader,
          'x-tenant-id': locationHeader 
        };
        
        // Use local API for everything now
        const [prodRes, catRes, subRes] = await Promise.all([
          fetch(`${API_URL}/products`, { headers }),
          fetch(`${API_URL}/categories`, { headers }),
          fetch(`${API_URL}/subcategories`, { headers })
        ]).catch((e) => {
          console.error('[DEBUG] Fetch failed:', e);
          setConnectionError(true);
          return [null, null, null];
        });

        if (prodRes && prodRes.status === 404) {
          const data = await prodRes.json();
          if (data.message && data.message.includes('not available')) {
            setLocationNotAvailable(true);
            setLoading(false);
            return;
          }
        }
        setLocationNotAvailable(false);

        if (!prodRes || !prodRes.ok) {
          // If it's a 404 or 500, it's NOT a connection error (the server responded)
          if (prodRes && prodRes.status >= 400) {
            console.error(`[DEBUG] Backend responded with status ${prodRes.status}`);
            setConnectionError(false); 
          } else {
            setConnectionError(true);
          }
        } else {
          setConnectionError(false);
        }

        const prodData = prodRes && prodRes.ok ? await prodRes.json() : [];
        const catData = catRes && catRes.ok ? await catRes.json() : [];
        const subData = subRes && subRes.ok ? await subRes.json() : [];

        const mappedCats = catData.map(c => ({
          ...c,
          id: c._id || c.id,
          name: c.name || c.categoryKey || 'Unknown',
          image: c.image || c.imageUrl
        }));

        const mappedSubs = subData.map(s => ({
          ...s,
          id: s._id || s.id,
          name: s.name || s.subcategoryKey || 'Unknown',
          image: s.image || s.imageUrl,
          category: s.categoryId?._id || s.categoryId || s.category?._id || s.category
        }));

        const mappedProducts = prodData.map(p => {
          const pCatId = p.categoryId?._id || p.categoryId || p.category?._id || p.category;
          const pSubId = p.subCategoryId?._id || p.subCategoryId || p.subcategory?._id || p.subcategory;
          
          const foundCat = mappedCats.find(c => c.id === pCatId);
          const foundSub = mappedSubs.find(s => s.id === pSubId);
          
          return {
            ...p,
            id: p._id || p.id,
            image: p.imageUrl || p.image,
            sellerName: p.sellerName || p.sellerId?.businessName || p.sellerId?.name || 'Zudo Official',
            category: foundCat ? foundCat.name : (p.categoryId?.name || p.category?.name || 'All'),
            subcategory: foundSub ? foundSub.name : (p.subCategoryId?.name || p.subcategory?.name || 'All')
          };
        });

        setAllProducts(mappedProducts);
        setCategories(mappedCats);
        setSubcategories(mappedSubs);
      } catch (err) {
        console.error('Failed to fetch initial data:', err);
      } finally {
        setLoading(false);
      }
    };

    syncProfile();
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleNavigate = (page, tab = 'profile') => {
    // 1. Force Login for Checkout
    if (page === 'checkout' && !user) {
      setIsLoginOpen(true);
      showToast('Please login to proceed to checkout.');
      return;
    }

    // 2. Intercept cart/checkout for B2B users who haven't uploaded docs
    const isBusiness = user?.role === 'business' || user?.role === 'b2b' || user?.role === 'seller';
    const hasDocs = user?.gstPdf || user?.storePic;
    
    if ((page === 'cart' || page === 'checkout') && isBusiness && !user?.isVerified && !hasDocs) {
      setB2bStatus('pending');
      showToast('Please complete verification to access cart.');
      return;
    }

    setCurrentPage(page);
    if (page === 'profile') setProfileTab(tab);

    // Update URL without refreshing
    const path = page === 'home' ? '/' : `/${page.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
    if (window.location.pathname !== path) {
      window.history.pushState({ page, tab }, '', path);
    }
  };

  useEffect(() => {
    const isBusiness = user?.role === 'business' || user?.role === 'b2b' || user?.role === 'seller';
    setIsB2B(isBusiness);

    if (isBusiness) {
      const hasDocs = user.gstPdf || user.storePic;
      if (user.isVerified) {
        setB2bStatus('approved');
      } else if (!hasDocs) {
        setB2bStatus('pending');
      } else {
        setB2bStatus('none');
      }
    } else {
      setB2bStatus('none');
    }
  }, [user]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isB2B');
    showToast('Logged out successfully.'); 
    setCurrentPage('home');
  };

  const addToCart = (product, selectedVariant = null) => {
    let varInfo = {};
    const variantsList = isB2B ? product.b2b : product.b2c;
    
    if (selectedVariant) {
      varInfo = {
        selectedPacketSize: selectedVariant.packetSize,
        price: selectedVariant.price,
        mrp: selectedVariant.mrp || selectedVariant.price,
        stock: selectedVariant.stock !== undefined ? selectedVariant.stock : product.stock,
        gstPercent: selectedVariant.gstPercent || product.gstPercent || 0
      };
    } else if (variantsList && variantsList.length > 0) {
      const defaultVar = variantsList[0];
      varInfo = {
        selectedPacketSize: defaultVar.packetSize,
        price: defaultVar.price,
        mrp: defaultVar.mrp || defaultVar.price,
        stock: defaultVar.stock !== undefined ? defaultVar.stock : product.stock,
        gstPercent: defaultVar.gstPercent || product.gstPercent || 0
      };
    } else {
      varInfo = {
        selectedPacketSize: product.unit || '1 unit',
        price: isB2B ? (product.b2bPrice || product.price) : product.price,
        mrp: product.oldPrice || (isB2B ? (product.b2bPrice || product.price) : product.price),
        stock: product.stock,
        gstPercent: product.gstPercent || 0
      };
    }

    const maxStock = varInfo.stock !== undefined ? Number(varInfo.stock) : Infinity;
    if (maxStock <= 0) {
      showToast(`Sorry, ${product.name} (${varInfo.selectedPacketSize}) is currently out of stock.`);
      return;
    }

    const cartKey = `${product.id}_${varInfo.selectedPacketSize}`;

    setCartItems(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev;
      }
      return [...prev, { 
        ...product, 
        cartKey, 
        selectedPacketSize: varInfo.selectedPacketSize,
        price: varInfo.price,
        oldPrice: varInfo.mrp,
        stock: varInfo.stock,
        gstPercent: varInfo.gstPercent,
        quantity: isB2B ? (product.moq || 1) : 1 
      }];
    });
    
    showToast(`${product.name} (${varInfo.selectedPacketSize}) added to cart!`);
  };

  const updateCartQuantity = (cartKey, delta) => {
    setCartItems(prev => prev.map(item => {
      // Support matching by cartKey or original id for fallback
      if (item.cartKey === cartKey || item.id === cartKey) {
        const newQty = item.quantity + delta;
        const maxStock = item.stock !== undefined ? Number(item.stock) : Infinity;
        if (newQty > maxStock) {
          showToast(`Sorry, only ${maxStock} items available in stock.`);
          return item; 
        }
        const minQty = isB2B ? (item.moq || 1) : 1;
        if (newQty < minQty && delta < 0) {
          showToast(`Minimum order quantity for wholesale is ${minQty}.`);
          return item;
        }
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (cartKey) => setCartItems(prev => prev.filter(item => item.cartKey !== cartKey && item.id !== cartKey));
  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  const showToast = (message) => { setToastMessage(message); setTimeout(() => setToastMessage(''), 3000); };
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (query.trim() !== '') {
      setSelectedCategory('All');
      setSelectedSubcategory('All');
      setCurrentPage('products');
    }
  };
  const handleCategoryClick = (category, subcategory = 'All') => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSearchQuery('');
    setCurrentPage('products');
  };
  const navigateToProduct = (product) => { setSelectedProduct(product); setCurrentPage('productDetails'); };

  const getDisplayPrice = (product) => {
    const variantsList = isB2B ? product.b2b : product.b2c;
    
    if (variantsList && variantsList.length > 0) {
      const defaultVar = variantsList[0];
      return { 
        price: `₹${defaultVar.price}`, 
        oldPrice: defaultVar.mrp,
        isB2B: isB2B,
        packetSize: defaultVar.packetSize,
        stock: defaultVar.stock,
        gstPercent: defaultVar.gstPercent || product.gstPercent || 0
      };
    }
    
    const basePrice = isB2B ? (product.b2bPrice || product.price) : product.price;
    return { 
      price: `₹${basePrice}`, 
      oldPrice: product.oldPrice,
      isB2B: isB2B,
      packetSize: product.unit || '1 unit',
      stock: product.stock,
      gstPercent: product.gstPercent || 0
    };
  };

  const filteredProducts = allProducts.filter(p => {
    if (isB2B) {
      return (p.b2b && p.b2b.length > 0) || p.b2bPrice > 0;
    } else {
      return (p.b2c && p.b2c.length > 0) || p.price > 0;
    }
  });

  // Strict Location Gateway check - Persists once verified
  const isLocationSet = localStorage.getItem('selectedCity') && localStorage.getItem('zudo_tenant_id');

  if (!isLocationSet) {
    return (
      <LocationGateway 
        onSelect={(city, dbName) => {
          localStorage.setItem('selectedCity', city);
          if (dbName) localStorage.setItem('zudo_tenant_id', dbName);
          window.location.reload();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans overflow-x-hidden relative flex flex-col transition-colors duration-500">
      {connectionError && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center py-3 font-black text-xs uppercase tracking-widest animate-pulse shadow-lg">
          ⚠️ BACKEND CONNECTION FAILED (Server Offline)
        </div>
      )}
      <Navbar 
        cartCount={cartItems.length} 
        wishlistCount={wishlistItems.length}
        onLoginClick={() => setIsLoginOpen(true)} 
        onNavigate={handleNavigate}
        onSearch={handleSearch}
        onCategoryClick={handleCategoryClick}
        onNavigateToProduct={navigateToProduct}
        currentPage={currentPage}
        isB2B={isB2B}
        user={user}
        categories={categories}
        subcategories={subcategories}
        allProducts={filteredProducts}
        onLogout={handleLogout}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
      
      {b2bStatus === 'pending' && (
        <B2BVerificationScreen 
          onSkip={() => setB2bStatus('none')} 
          onBack={() => setB2bStatus('none')} 
          onUpdateUser={setUser}
          user={user}
        />
      )}
      
      <div className="flex-grow flex flex-col pt-[72px]">
        {loading ? (
          <div className="flex-grow flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <>
            {currentPage === 'home' && (
              <>
                <div className="relative bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#064e3b] text-white overflow-hidden">
                  <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px] mix-blend-screen"></div>
                    <div className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[120px] mix-blend-screen"></div>
                    <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-teal-400/20 blur-[100px] mix-blend-screen"></div>
                  </div>
                  <div className="relative z-10">
                    <Hero onNavigate={handleNavigate} />
                  </div>
                </div>
                <TopCategories onNavigate={handleNavigate} onCategoryClick={handleCategoryClick} categories={categories} />
                <Showcase />
                <NewArrivals onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={handleNavigate} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={filteredProducts} />
                <HomeProducts onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={handleNavigate} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={filteredProducts} />
                <PromoBanner onNavigate={handleNavigate} />
                <HomeNeeds onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={handleNavigate} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={filteredProducts} />
                <Testimonials />
              </>
            )}

            {currentPage === 'products' && (
              <ProductsPage 
                searchQuery={searchQuery}
                initialCategory={selectedCategory}
                initialSubcategory={selectedSubcategory}
                onAddToCart={addToCart}
                onUpdateQuantity={updateCartQuantity}
                onToggleWishlist={toggleWishlist}
                cartItems={cartItems}
                wishlistItems={wishlistItems}
                onNavigateToProduct={navigateToProduct}
                isB2B={isB2B}
                getDisplayPrice={getDisplayPrice}
                allProducts={filteredProducts}
                categories={categories}
                subcategories={subcategories}
              />
            )}

            {currentPage === 'productDetails' && (
              <ProductDetails 
                product={selectedProduct}
                onAddToCart={addToCart}
                onToggleWishlist={toggleWishlist}
                isWishlisted={wishlistItems.some(item => item.id === selectedProduct?.id)}
                onNavigate={handleNavigate}
                onNavigateToProduct={navigateToProduct}
                wishlistItems={wishlistItems}
                cartItems={cartItems}
                onUpdateQuantity={updateCartQuantity}
                allProducts={filteredProducts}
                isB2B={isB2B}
                getDisplayPrice={getDisplayPrice}
                user={user}
              />
            )}

            {currentPage === 'cart' && <CartPage cartItems={cartItems} onUpdateQuantity={updateCartQuantity} onRemove={removeFromCart} onNavigate={handleNavigate} isB2B={isB2B} />}
            {currentPage === 'wishlist' && <WishlistPage wishlistItems={wishlistItems} cartItems={cartItems} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} onNavigate={handleNavigate} onNavigateToProduct={navigateToProduct} />}
            {currentPage === 'checkout' && <CheckoutPage cartItems={cartItems} user={user} onNavigate={handleNavigate} onOrderSuccess={() => { setCartItems([]); showToast('Order placed!'); handleNavigate('home'); }} />}
            {currentPage === 'profile' && <ProfilePage user={user} onUpdateUser={setUser} onNavigate={handleNavigate} initialTab={profileTab} />}
            {currentPage === 'orders' && <OrdersPage onNavigate={handleNavigate} user={user} />}
            {currentPage === 'feeds' && (
              <FeedsPage 
                allProducts={filteredProducts}
                onAddToCart={addToCart}
                onUpdateQuantity={updateCartQuantity}
                onToggleWishlist={toggleWishlist}
                cartItems={cartItems}
                wishlistItems={wishlistItems}
                onNavigateToProduct={navigateToProduct}
                getDisplayPrice={getDisplayPrice}
                onNavigate={handleNavigate}
              />
            )}
            {currentPage === 'contact' && <ContactPage />}
            
            {/* Policy Pages */}
            {currentPage === 'terms' && <PolicyPage type="terms" onNavigate={handleNavigate} />}
            {currentPage === 'privacy' && <PolicyPage type="privacy" onNavigate={handleNavigate} />}
            {currentPage === 'shipping' && <PolicyPage type="shipping" onNavigate={handleNavigate} />}
            {currentPage === 'returns' && <PolicyPage type="returns" onNavigate={handleNavigate} />}
            {currentPage === 'resetPassword' && <ResetPasswordPage onNavigate={handleNavigate} />}
          </>
        )}
      </div>

      <Footer onNavigate={handleNavigate} />
      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} setUser={setUser} />}
      <PopupAdModal />

      {locationNotAvailable && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-md"></div>
          <div className="bg-white dark:bg-[#121212] w-full max-w-md rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden border border-gray-100 dark:border-white/5 animate-[scaleIn_0.4s_ease-out] p-10 text-center">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-full flex items-center justify-center text-red-600 mx-auto mb-8 relative">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/20 rounded-full animate-ping opacity-20"></div>
              <MapPin size={48} className="relative z-10" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">We're Not There Yet!</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-10 font-bold leading-relaxed">
              Sorry, Zudo services are currently not available in <span className="text-red-600">"{localStorage.getItem('selectedCity')}"</span>. 
              We're expanding rapidly to bring premium groceries to your doorstep!
            </p>
            <div className="space-y-4">
              <button 
                onClick={() => {
                  localStorage.removeItem('selectedCity');
                  window.location.reload();
                }}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-5 rounded-2xl shadow-xl shadow-emerald-600/20 transition-all transform hover:-translate-y-1 active:scale-95 text-xs uppercase tracking-widest"
              >
                Change Location
              </button>
            </div>
          </div>
        </div>
      )}

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3">
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;
