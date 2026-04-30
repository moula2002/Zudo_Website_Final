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
  const [user, setUser] = useState(null);
  const [allProducts, setAllProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize auth state
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      
      // Set initial B2B status based on saved user
      if (parsedUser.role === 'business') {
        if (parsedUser.isVerified) {
          setB2bStatus('approved');
          setIsB2B(true);
        } else {
          setB2bStatus('pending');
          setIsB2B(false);
        }
      }
    }

    // Fetch initial data
        const fetchInitialData = async () => {
          try {
            setLoading(true);
            const apiBase = 'https://zudo.onrender.com/api';
            console.log('Fetching data from:', apiBase);
            
            const [prodRes, catRes, subRes] = await Promise.all([
              fetch(`${apiBase}/products`),
              fetch(`${apiBase}/categories`),
              fetch(`${apiBase}/subcategories`)
            ]);

            if (!prodRes.ok) console.warn('Products fetch failed:', prodRes.status);
            if (!catRes.ok) console.warn('Categories fetch failed:', catRes.status);
            if (!subRes.ok) console.warn('Subcategories fetch failed:', subRes.status);

            // Fetch latest user profile if token exists
            const token = localStorage.getItem('token');
            if (token) {
              try {
                const profileRes = await fetch(`${apiBase}/auth/profile`, {
                  headers: { 'Authorization': `Bearer ${token}` }
                });
                if (profileRes.ok) {
                  const latestUser = await profileRes.json();
                  setUser(latestUser);
                  localStorage.setItem('user', JSON.stringify(latestUser));
                }
              } catch (err) {
                console.error('Failed to sync profile:', err);
              }
            }

            const prodData = prodRes.ok ? await prodRes.json() : [];
            const catData = catRes.ok ? await catRes.json() : [];
            const subData = subRes.ok ? await subRes.json() : [];

            // Map MongoDB _id to id for frontend compatibility and resolve category names
            const mappedProducts = prodData.map(p => {
              const cat = catData.find(c => c._id === (p.category || p.categoryId));
              const sub = subData.find(s => s._id === (p.subcategory || p.subCategoryId));
              
              return {
                ...p,
                id: p._id,
                image: p.imageUrl || p.image,
                category: cat ? cat.name : (p.category?.name || p.category),
                subcategory: sub ? sub.name : (p.subcategory?.name || p.subcategory)
              };
            });

            const mappedSubs = subData.map(s => {
              const catId = s.category?._id || s.category || s.categoryId;
              return {
                ...s,
                image: s.imageUrl || s.image,
                category: catId
              };
            });

            setAllProducts(mappedProducts);
            setCategories(catData);
            setSubcategories(mappedSubs);
          } catch (err) {
            console.error('Failed to fetch initial data:', err);
          } finally {
            setLoading(false);
          }
        };

    fetchInitialData();
  }, []);

  const [selectedSubcategory, setSelectedSubcategory] = useState('All');

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const addToCart = (product) => {
    const initialQty = isB2B ? 4 : 1;
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
    const minQty = isB2B ? 4 : 1;
    setCartItems(prev => {
      const updated = prev.map(item => {
        if (item.id === id) {
          let newQty = item.quantity + delta;
          // In B2B mode, if quantity drops below the minimum (4), we set it to 0 to remove it
          if (isB2B && newQty < 4 && delta < 0) {
            newQty = 0;
          }
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
      
      const removed = prev.find(item => item.id === id && item.quantity === minQty && delta === -1);
      if (removed) showToast(`${removed.name} removed from cart.`);
      
      return updated;
    });
  };

  const removeFromCart = (id) => setCartItems(prev => prev.filter(item => item.id !== id));

  const toggleWishlist = (product) => {
    setWishlistItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) return prev.filter(item => item.id !== product.id);
      return [...prev, product];
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    setSelectedCategory('All'); 
    setSelectedSubcategory('All');
    if (query.trim() !== '') {
      setCurrentPage('products');
    }
  };

  const handleCategoryClick = (category, subcategory = 'All') => {
    setSelectedCategory(category);
    setSelectedSubcategory(subcategory);
    setSearchQuery(''); 
    setCurrentPage('products');
  };

  const navigateToProduct = (product) => {
    setSelectedProduct(product);
    setCurrentPage('productDetails');
  };

  const [isB2B, setIsB2B] = useState(false);
  const [b2bStatus, setB2bStatus] = useState('none'); // 'none', 'pending', 'approved'

  useEffect(() => {
    const handleB2BLogin = () => {
      const savedUser = JSON.parse(localStorage.getItem('user'));
      if (savedUser?.role === 'business' && !savedUser.isVerified) {
        setB2bStatus('pending');
        setIsB2B(false);
        localStorage.removeItem('isB2B');
      } else {
        setB2bStatus('approved');
        setIsB2B(true);
        localStorage.setItem('isB2B', 'true');
      }
    };
    window.addEventListener('b2b-login', handleB2BLogin);
    return () => window.removeEventListener('b2b-login', handleB2BLogin);
  }, []);

  useEffect(() => {
    if (user?.role === 'business') {
      if (user.isVerified) {
        setB2bStatus('approved');
        setIsB2B(true);
        localStorage.setItem('isB2B', 'true');
      } else {
        setB2bStatus('pending');
        setIsB2B(false);
        localStorage.removeItem('isB2B');
      }
    } else {
      setB2bStatus('none');
      setIsB2B(false);
    }
  }, [user]);

  const handleB2BApproval = () => {
    // This is a local bypass for testing or if we had a socket/polling
    setB2bStatus('approved');
    setIsB2B(true);
    localStorage.setItem('isB2B', 'true');
  };

  const getDisplayPrice = (product) => {
    if (!isB2B) return { price: product.price, oldPrice: product.oldPrice };
    
    let basePrice;
    let unit = 'unit';

    if (typeof product.price === 'number') {
      basePrice = product.price;
    } else {
      const priceStr = String(product.price);
      const match = priceStr.match(/₹?(\d+)/);
      basePrice = match ? parseInt(match[1]) : 0;
      unit = priceStr.split('/')[1] || 'kg';
    }

    if (!basePrice) return { price: product.price, oldPrice: product.oldPrice };
    
    const b2bPriceValue = Math.floor(basePrice * 0.75); // 25% bulk discount
    
    return { 
      price: typeof product.price === 'number' ? `₹${b2bPriceValue}` : `₹${b2bPriceValue}/${unit}`, 
      oldPrice: typeof product.oldPrice === 'number' ? `₹${product.oldPrice}` : product.oldPrice, 
      isB2B: true
    };
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans overflow-x-hidden relative flex flex-col">
      <Navbar 
        cartCount={cartItems.length} 
        wishlistCount={wishlistItems.length}
        onLoginClick={() => setIsLoginOpen(true)} 
        onNavigate={setCurrentPage}
        onSearch={handleSearch}
        onCategoryClick={handleCategoryClick}
        onNavigateToProduct={navigateToProduct}
        currentPage={currentPage}
        isB2B={isB2B}
        user={user}
        categories={categories}
        subcategories={subcategories}
        allProducts={allProducts}
        onLogout={() => { 
          setIsB2B(false); 
          setUser(null);
          setB2bStatus('none'); 
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          localStorage.removeItem('isB2B');
          showToast('Logged out successfully.'); 
        }}
      />
      
      {b2bStatus === 'pending' && (
        <B2BVerificationScreen 
          onSkip={handleB2BApproval} 
          onBack={() => setB2bStatus('none')} 
          onUpdateUser={setUser}
        />
      )}
      
      <div className="flex-grow flex flex-col pt-[72px]">
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
            
            <TopCategories onNavigate={setCurrentPage} onCategoryClick={handleCategoryClick} categories={categories} loading={loading} />
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
            loading={loading}
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
          />
        )}

        {currentPage === 'cart' && (
          <CartPage 
            cartItems={cartItems} 
            onUpdateQuantity={updateCartQuantity} 
            onRemove={removeFromCart} 
            onNavigate={setCurrentPage} 
          />
        )}

        {currentPage === 'wishlist' && (
          <WishlistPage 
            wishlistItems={wishlistItems} 
            cartItems={cartItems}
            onAddToCart={addToCart} 
            onUpdateQuantity={updateCartQuantity}
            onToggleWishlist={toggleWishlist} 
            onNavigate={setCurrentPage} 
            onNavigateToProduct={navigateToProduct}
            isB2B={isB2B}
            getDisplayPrice={getDisplayPrice}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage 
            cartItems={cartItems} 
            user={user} 
            onNavigate={setCurrentPage} 
            onOrderSuccess={() => {
              setCartItems([]);
              showToast('Your order has been placed!');
            }} 
          />
        )}

        {currentPage === 'profile' && (
          <ProfilePage 
            user={user} 
            onUpdateUser={setUser} 
            onNavigate={setCurrentPage} 
          />
        )}

        {currentPage === 'orders' && (
          <OrdersPage 
            onNavigate={setCurrentPage} 
          />
        )}

        {currentPage === 'contact' && (
          <ContactPage />
        )}
      </div>

      <Footer onNavigate={setCurrentPage} />

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;


