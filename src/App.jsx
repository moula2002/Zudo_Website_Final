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
      setB2bStatus('pending');
    };
    window.addEventListener('b2b-login', handleB2BLogin);
    return () => window.removeEventListener('b2b-login', handleB2BLogin);
  }, []);

  const handleB2BApproval = () => {
    setB2bStatus('approved');
    setIsB2B(true);
    showToast('B2B Account Approved! Welcome to Zudo Business.');
  };

  const getDisplayPrice = (product) => {
    if (!isB2B) return { price: product.price, oldPrice: product.oldPrice };
    
    // Parse numeric value from "₹140/kg"
    const match = product.price.match(/₹(\d+)/);
    if (!match) return { price: product.price, oldPrice: product.oldPrice };
    
    const basePrice = parseInt(match[1]);
    const b2bPriceValue = Math.floor(basePrice * 0.75); // 25% bulk discount
    const unit = product.price.split('/')[1] || 'kg';
    
    return { 
      price: `₹${b2bPriceValue}/${unit}`, 
      oldPrice: product.price, // Show original price as old price for B2B
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
        onLogout={() => { setIsB2B(false); setB2bStatus('none'); showToast('Logged out successfully.'); }}
      />
      
      {b2bStatus === 'pending' && (
        <B2BVerificationScreen 
          onSkip={handleB2BApproval} 
          onBack={() => setB2bStatus('none')} 
        />
      )}
      
      <div className="flex-grow flex flex-col pt-[72px]">
        {currentPage === 'home' && (
          <>
            <div className="relative bg-gradient-to-br from-[#064e3b] via-[#0f766e] to-[#064e3b] text-white overflow-hidden">
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[600px] h-[600px] rounded-full bg-emerald-400/20 blur-[120px] mix-blend-screen"></div>
                <div className="absolute bottom-[10%] -right-[10%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[120px] mix-blend-screen"></div>
                <div className="absolute top-[40%] left-[30%] w-[400px] h-[400px] rounded-full bg-teal-400/20 blur-[100px] mix-blend-screen"></div>
              </div>
              
              <div className="relative z-10">
                <Hero onNavigate={setCurrentPage} />
              </div>
            </div>
            
            <TopCategories onNavigate={setCurrentPage} onCategoryClick={handleCategoryClick} />
            <Showcase />
            <HomeProducts onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={setCurrentPage} isB2B={isB2B} getDisplayPrice={getDisplayPrice} />
            <PromoBanner onNavigate={setCurrentPage} />
            <HomeNeeds onAddToCart={addToCart} onUpdateQuantity={updateCartQuantity} onToggleWishlist={toggleWishlist} cartItems={cartItems} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={setCurrentPage} isB2B={isB2B} getDisplayPrice={getDisplayPrice} />
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

        {currentPage === 'contact' && (
          <ContactPage />
        )}
      </div>

      <Footer onNavigate={setCurrentPage} />

      {isLoginOpen && <LoginModal onClose={() => setIsLoginOpen(false)} />}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl z-[100] flex items-center gap-3 animate-[slideIn_0.3s_ease-out]">
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
          <p className="font-medium text-sm">{toastMessage}</p>
        </div>
      )}
    </div>
  );
}

export default App;


