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
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [cartItems, setCartItems] = useState([]);
  const [wishlistItems, setWishlistItems] = useState([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Scroll to top when page changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 3000);
  };

  const addToCart = (product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    showToast(`${product.name} added to cart!`);
  };

  const updateCartQuantity = (id, delta) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : item;
      }
      return item;
    }));
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
    if (query.trim() !== '') {
      setCurrentPage('products');
    }
  };

  const navigateToProduct = (product) => {
    setSelectedProduct(product);
    setCurrentPage('productDetails');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] text-gray-900 font-sans overflow-x-hidden relative flex flex-col">
      <Navbar 
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)} 
        wishlistCount={wishlistItems.length}
        onLoginClick={() => setIsLoginOpen(true)} 
        onNavigate={setCurrentPage}
        onSearch={handleSearch}
        onNavigateToProduct={navigateToProduct}
        currentPage={currentPage}
      />
      
      <div className="flex-grow flex flex-col">
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
            
            <TopCategories onNavigate={setCurrentPage} />
            <Showcase />
            <HomeProducts onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={setCurrentPage} />
            <PromoBanner onNavigate={setCurrentPage} />
            <HomeNeeds onAddToCart={addToCart} onToggleWishlist={toggleWishlist} wishlistItems={wishlistItems} onNavigateToProduct={navigateToProduct} onNavigate={setCurrentPage} />
            <Testimonials />
          </>
        )}

        {currentPage === 'products' && (
          <ProductsPage 
            searchQuery={searchQuery}
            onAddToCart={addToCart}
            onToggleWishlist={toggleWishlist}
            wishlistItems={wishlistItems}
            onNavigateToProduct={navigateToProduct}
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
            onAddToCart={addToCart} 
            onToggleWishlist={toggleWishlist} 
            onNavigate={setCurrentPage} 
            onNavigateToProduct={navigateToProduct}
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


