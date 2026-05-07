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
    return () => window.removeEventListener('user-login-success', handleLoginEvent);
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
          setUser(latestUser);
          localStorage.setItem('user', JSON.stringify(latestUser));
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

  const handleNavigate = (page, tab = 'profile') => {
    setCurrentPage(page);
    if (page === 'profile') setProfileTab(tab);
  };

  useEffect(() => {
    const isBusiness = user?.role === 'business' || user?.role === 'b2b' || user?.role === 'seller';
    setIsB2B(isBusiness);

    if (isBusiness) {
      const hasDocs = user.gstPdf || user.storePic || user.businessName;
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
      if (item.id === id) return { ...item, quantity: Math.max(0, item.quantity + delta) };
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
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans overflow-x-hidden relative flex flex-col">
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
                    <Hero onNavigate={setCurrentPage} />
                  </div>
                </div>
                <TopCategories onNavigate={setCurrentPage} onCategoryClick={handleCategoryClick} categories={categories} />
                <Showcase />
                <HomeProducts onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={setCurrentPage} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={allProducts} />
                <PromoBanner onNavigate={setCurrentPage} />
                <HomeNeeds onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={setCurrentPage} isB2B={isB2B} getDisplayPrice={getDisplayPrice} allProducts={allProducts} />
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
                onNavigate={setCurrentPage}
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

            {currentPage === 'cart' && <CartPage cartItems={cartItems} onUpdateQuantity={updateCartQuantity} onRemove={removeFromCart} onNavigate={setCurrentPage} isB2B={isB2B} />}
            {currentPage === 'wishlist' && <WishlistPage wishlistItems={wishlistItems} cartItems={cartItems} onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} onNavigate={setCurrentPage} onNavigateToProduct={navigateToProduct} />}
            {currentPage === 'checkout' && <CheckoutPage cartItems={cartItems} user={user} onNavigate={setCurrentPage} onOrderSuccess={() => { setCartItems([]); showToast('Order placed!'); setCurrentPage('home'); }} />}
            {currentPage === 'profile' && <ProfilePage user={user} onUpdateUser={setUser} onNavigate={handleNavigate} initialTab={profileTab} />}
            {currentPage === 'orders' && <OrdersPage onNavigate={setCurrentPage} />}
            {currentPage === 'contact' && <ContactPage />}
            
            {/* Policy Pages */}
            {currentPage === 'terms' && <PolicyPage type="terms" onNavigate={setCurrentPage} />}
            {currentPage === 'privacy' && <PolicyPage type="privacy" onNavigate={setCurrentPage} />}
            {currentPage === 'shipping' && <PolicyPage type="shipping" onNavigate={setCurrentPage} />}
            {currentPage === 'returns' && <PolicyPage type="returns" onNavigate={setCurrentPage} />}
          </>
        )}
      </div>

      <Footer onNavigate={setCurrentPage} />
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
