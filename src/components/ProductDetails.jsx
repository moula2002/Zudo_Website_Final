import React, { useState } from 'react';
import { ArrowLeft, Star, Heart, ShoppingCart, Send } from 'lucide-react';
import { allProducts } from '../data';
import ProductCard from './ProductCard';

export default function ProductDetails({ product, onAddToCart, onToggleWishlist, isWishlisted, onNavigate, onNavigateToProduct, wishlistItems = [] }) {
  const [activeTab, setActiveTab] = useState('description');
  
  const initialReviews = [
    { id: 1, author: "Rahul M.", rating: 5, date: "Oct 12, 2023", text: "Absolutely loved the quality! Very fresh and packaging was great." },
    { id: 2, author: "Priya S.", rating: 4, date: "Sep 28, 2023", text: "Good product, matches the description perfectly. Delivery was a bit late though." },
    { id: 3, author: "Amit K.", rating: 5, date: "Aug 05, 2023", text: "This is my third time buying this. Always consistent and premium quality." }
  ];
  
  const [reviews, setReviews] = useState(initialReviews);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);

  if (!product) return null;

  const similarProducts = allProducts.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddReview = (e) => {
    e.preventDefault();
    if (!reviewText.trim()) return;
    
    const newReview = {
      id: Date.now(),
      author: "Guest User",
      rating: reviewRating,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      text: reviewText
    };
    
    setReviews([newReview, ...reviews]);
    setReviewText('');
    setReviewRating(5);
  };

  return (
    <div className="container mx-auto px-6 py-8 min-h-[70vh] max-w-6xl">
      <button 
        onClick={() => onNavigate('products')}
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 text-sm font-bold mb-6 transition-colors w-max"
      >
        <ArrowLeft size={16} /> Back to Products
      </button>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 mb-10">
        <div className="flex flex-col md:flex-row gap-8 lg:gap-12">
          {/* Image */}
          <div className="w-full md:w-[45%] relative flex-shrink-0">
            <div className="rounded-xl overflow-hidden aspect-square bg-gray-50 border border-gray-100 sticky top-32">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
            </div>
            <button 
              onClick={() => onToggleWishlist(product)}
              className={`absolute top-4 right-4 backdrop-blur-sm p-2.5 rounded-full shadow-lg transition-colors z-10 ${isWishlisted ? 'bg-white text-red-500' : 'bg-white/90 text-gray-400 hover:text-red-500'}`}
            >
              <Heart size={20} className={isWishlisted ? "fill-red-500 text-red-500" : ""} />
            </button>
          </div>

          {/* Details */}
          <div className="w-full md:w-[55%] flex flex-col justify-center">
            {product.badge && (
              <span className="inline-block bg-emerald-100 text-emerald-700 text-[10px] font-extrabold px-2.5 py-1 rounded-md uppercase tracking-widest mb-3 w-max">
                {product.badge}
              </span>
            )}
            <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3">{product.name}</h1>
            
            <div className="flex items-center gap-2 mb-5">
              <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={16} className={i < Math.floor(product.rating) ? "fill-yellow-400" : "fill-gray-200 text-gray-200"} />
                ))}
              </div>
              <span className="text-gray-500 text-sm font-medium ml-1">{product.rating} ({reviews.length} reviews)</span>
            </div>

            <div className="flex items-baseline gap-3 mb-5">
              <span className="text-3xl font-extrabold text-emerald-600">{product.price}</span>
              <span className="text-lg text-gray-400 line-through font-medium">{product.oldPrice}</span>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              {product.description || 'High-quality premium grocery item carefully sourced to ensure maximum freshness and nutritional value for you and your family.'}
            </p>

            <div className="flex items-center gap-4">
              <button 
                onClick={() => onAddToCart(product)}
                className="w-full md:w-auto px-8 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-md shadow-emerald-600/20 transition-transform transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-sm"
              >
                <ShoppingCart size={18} /> Add to Cart
              </button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col gap-3">
               <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                 <span className="text-emerald-500 font-bold">✓</span> Guaranteed Freshness
               </div>
               <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                 <span className="text-emerald-500 font-bold">✓</span> Secure Payment
               </div>
               <div className="flex items-center gap-2 text-gray-600 text-sm font-medium">
                 <span className="text-emerald-500 font-bold">✓</span> Fast Delivery
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs section for Description & Reviews */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-12">
        <div className="flex border-b border-gray-100">
          <button 
            onClick={() => setActiveTab('description')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'description' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            Product Information
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex-1 py-4 text-center font-bold text-sm transition-colors ${activeTab === 'reviews' ? 'bg-emerald-50 text-emerald-700 border-b-2 border-emerald-600' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'}`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>
        
        <div className="p-6 md:p-8">
          {activeTab === 'description' && (
            <div className="text-gray-600 text-sm leading-relaxed space-y-4">
              <p>This premium quality <strong>{product.name}</strong> is carefully selected and packaged to maintain its nutritional value and fresh taste. We ensure that our sourcing meets the highest standards of hygiene and quality control.</p>
              <h3 className="font-bold text-gray-900 text-base mt-4 mb-2">Key Benefits:</h3>
              <ul className="list-disc pl-5 space-y-1">
                <li>100% natural and unadulterated</li>
                <li>Rich in essential nutrients</li>
                <li>Sourced directly from trusted farmers</li>
                <li>Hygienically packed in a modern facility</li>
              </ul>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="flex flex-col lg:flex-row gap-10">
              {/* Existing Reviews */}
              <div className="w-full lg:w-3/5 space-y-6">
                {reviews.map(review => (
                  <div key={review.id} className="border-b border-gray-50 pb-6 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-bold text-gray-900 text-sm">{review.author}</div>
                      <div className="text-xs text-gray-400 font-medium">{review.date}</div>
                    </div>
                    <div className="flex text-yellow-400 mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < review.rating ? "fill-yellow-400" : "fill-gray-200 text-gray-200"} />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm italic">"{review.text}"</p>
                  </div>
                ))}
              </div>
              
              {/* Add Review Form */}
              <div className="w-full lg:w-2/5">
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <h3 className="font-bold text-gray-900 mb-4 text-sm">Write a Review</h3>
                  <form onSubmit={handleAddReview}>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className="focus:outline-none transition-transform hover:scale-110"
                          >
                            <Star size={20} className={star <= reviewRating ? "fill-yellow-400 text-yellow-400" : "fill-gray-200 text-gray-200"} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-xs font-bold text-gray-500 mb-2">Your Review</label>
                      <textarea 
                        rows="3" 
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder="Tell us what you think..."
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 bg-white resize-none"
                      ></textarea>
                    </div>
                    <button 
                      type="submit"
                      disabled={!reviewText.trim()}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <Send size={14} /> Submit Review
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-extrabold text-gray-900">Similar Products</h2>
            <button onClick={() => onNavigate('products')} className="text-emerald-600 text-sm font-bold hover:text-emerald-700">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarProducts.map(similar => (
              <div onClick={() => onNavigateToProduct && onNavigateToProduct(similar)} key={similar.id} className="cursor-pointer h-full">
                <ProductCard 
                  product={similar} 
                  onAddToCart={onAddToCart}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistItems.some(item => item.id === similar.id)}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


