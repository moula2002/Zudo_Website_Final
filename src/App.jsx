import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import TopCategories from './components/TopCategories';
import Showcase from './components/Showcase';
import HomeProducts from './components/HomeProducts';
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
import { API_URL, API_BASE_URL } from './config';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
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
      const validPages = ['products', 'productDetails', 'cart', 'wishlist', 'checkout', 'profile', 'orders', 'contact', 'terms', 'privacy', 'shipping', 'returns', 'resetPassword'];
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
      if (!token) return;

      try {
        // Now using API_URL which is set to localhost
        const profileRes = await fetch(`${API_URL}/auth/profile`, {
          headers: { 'Authorization': `Bearer ${token}` }
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
        // Use local API for everything now
        const [prodRes, catRes, subRes] = await Promise.all([
          fetch(`${API_URL}/products`),
          fetch(`${API_URL}/categories`),
          fetch(`${API_URL}/subcategories`)
        ]).catch((e) => {
          setConnectionError(true);
          return [null, null, null];
        });

        if (!prodRes || !prodRes.ok) {
          setConnectionError(true);
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

  const addToCart = (product) => {
    const initialQty = isB2B ? (product.moq || 4) : 1;
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: initialQty }];
    });
    showToast(`${product.name} added to cart!`);
  };

  const updateCartQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const minQty = (isB2B && item.moq) ? item.moq : 0;
        const newQty = item.quantity + delta;
        
        // If it's a B2B item and we're trying to go below MOQ, remove it
        if (isB2B && item.moq && newQty < item.moq && delta < 0) {
          return { ...item, quantity: 0 };
        }
        
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));
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
    const isUserB2B = user?.role === 'business' || user?.role === 'b2b';
    if (isUserB2B && !user.isVerified) {
       return { price: "Verification Pending", oldPrice: null, isB2B: true };
    }
    return { 
      price: isUserB2B ? `₹${product.b2bPrice || product.price}` : `₹${product.price}`, 
      oldPrice: product.oldPrice,
      isB2B: isUserB2B 
    };
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0a0a] text-gray-900 dark:text-white font-sans overflow-x-hidden relative flex flex-col transition-colors duration-500">
      {connectionError && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-red-600 text-white text-center py-3 font-black text-xs uppercase tracking-widest animate-pulse shadow-lg">
          ⚠️ BACKEND CONNECTION FAILED (Localhost:5000)
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
        allProducts={allProducts}
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
                <HomeProducts onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={handleNavigate} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={allProducts} />
                <PromoBanner onNavigate={handleNavigate} />
                <HomeNeeds onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={handleNavigate} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={allProducts} />
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
                allProducts={allProducts}
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
                allProducts={allProducts}
                isB2B={isB2B}
                getDisplayPrice={getDisplayPrice}
                user={user}
              />
            )}

            {currentPage === 'cart' && <CartPage cartItems={cartItems} onUpdateQuantity={updateCartQuantity} onRemove={removeFromCart} onNavigate={handleNavigate} isB2B={isB2B} />}
            {currentPage === 'wishlist' && <WishlistPage wishlistItems={wishlistItems} cartItems={cartItems} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} onNavigate={handleNavigate} onNavigateToProduct={navigateToProduct} />}
            {currentPage === 'checkout' && <CheckoutPage cartItems={cartItems} user={user} onNavigate={handleNavigate} onOrderSuccess={() => { setCartItems([]); showToast('Order placed!'); handleNavigate('home'); }} />}
            {currentPage === 'profile' && <ProfilePage user={user} onUpdateUser={setUser} onNavigate={handleNavigate} initialTab={profileTab} />}
            {currentPage === 'orders' && <OrdersPage onNavigate={handleNavigate} />}
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

      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3">
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;
