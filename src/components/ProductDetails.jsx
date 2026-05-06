import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, ArrowLeft, Star, Plus, Minus, Share2, Package, Truck, ShieldCheck, Clock, X, CheckCircle2, Upload, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { API_URL, API_BASE_URL, IMAGE_BASE_URL } from '../config';
import ProductCard from './ProductCard';

export default function ProductDetails({ product, onAddToCart, onToggleWishlist, isWishlisted, onNavigate, onNavigateToProduct, wishlistItems, cartItems, onUpdateQuantity, allProducts, isB2B, user }) {
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: '', media: [] });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${product.name} on Zudo`,
          text: product.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setMessage({ text: 'Link copied to clipboard!', type: 'success' });
      }
    } catch (err) {
      console.error('Share failed:', err);
    }
  };

  const isPending = product?.price === 'Verification Pending';
  const HOSTINGER_BASE = 'https://lightgreen-trout-176417.hostingersite.com';

  useEffect(() => {
    if (product?.id) {
      fetchReviews();
      window.scrollTo(0, 0);
    }
  }, [product?.id]);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/reviews/product/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        setReviews(data);
      }
    } catch (err) {
      console.error('Failed to fetch reviews:', err);
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch(`${HOSTINGER_BASE}/api/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      const imageUrl = `${HOSTINGER_BASE}${data.url}`;
      setNewReview(prev => ({
        ...prev,
        media: [...prev.media, { url: imageUrl, type: 'image' }]
      }));
    } catch (err) {
      setMessage({ text: 'Image upload failed', type: 'error' });
    } finally {
      setUploadingImage(false);
    }
  };

  const removeMedia = (index) => {
    setNewReview(prev => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index)
    }));
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ text: 'Please login to post a review', type: 'error' });
      return;
    }
    setReviewLoading(true);
    try {
      const res = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          productId: product.id,
          rating: newReview.rating,
          comment: newReview.comment,
          media: newReview.media
        })
      });
      if (res.ok) {
        setMessage({ text: 'Review posted successfully!', type: 'success' });
        setNewReview({ rating: 5, comment: '', media: [] });
        fetchReviews();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to post review');
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setReviewLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  if (!product) return null;

  const relatedProducts = allProducts?.filter(p => p.category === product.category && p.id !== product.id).slice(0, 4) || [];
  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : '4.8';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex-grow mt-6 bg-white rounded-2xl shadow-sm mb-10 border border-gray-100">
      <button onClick={() => onNavigate('products')} className="flex items-center gap-2 text-gray-400 hover:text-emerald-600 mb-6 font-bold uppercase tracking-widest text-[8px] transition-all group">
        <ArrowLeft size={12} /> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden group relative border border-gray-100">
            <img 
              src={(product.image || product.imageUrl)?.startsWith('http') ? (product.image || product.imageUrl) : `${IMAGE_BASE_URL}${product.image || product.imageUrl}`} 
              alt={product.name} 
              className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105" 
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-emerald-700 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-100/30">{product.category}</span>
              {product.oldPrice && !isPending && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 w-fit">Sale</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 rounded-xl border border-gray-100 hover:border-emerald-200 transition-all overflow-hidden p-2 opacity-60 hover:opacity-100 cursor-pointer">
                <img 
                  src={(product.image || product.imageUrl)?.startsWith('http') ? (product.image || product.imageUrl) : `${IMAGE_BASE_URL}${product.image || product.imageUrl}`} 
                  className="w-full h-full object-contain" 
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col pt-2">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 rounded-lg text-amber-600 border border-amber-100">
                <Star size={12} className="fill-amber-500 text-amber-500" />
                <span className="text-[11px] font-black">{averageRating}</span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{reviews.length} Reviews</span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 mb-4 tracking-tight leading-tight">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col">
                <span className={`text-3xl font-black ${isPending ? 'text-amber-500' : 'text-emerald-600'} tracking-tight`}>
                  {isPending ? 'Verification Pending' : product.price.toString().startsWith('₹') ? product.price : `₹${product.price}`}
                </span>
                {product.oldPrice && !isPending && (
                  <span className="text-xs text-gray-400 font-bold flex items-center gap-2">
                    <span className="line-through">₹{product.oldPrice}</span>
                       <span className="text-red-500 text-[9px] uppercase tracking-tighter">-{Math.round((1 - product.price/product.oldPrice) * 100)}% Off</span>
                  </span>
                )}
              </div>
              <div className="h-8 w-px bg-gray-100"></div>
              <div className="px-3 py-1 bg-emerald-50 rounded-xl border border-emerald-50">
                <p className="text-[8px] font-black text-emerald-700 uppercase tracking-widest">Stock Status</p>
                <p className="text-[11px] font-bold text-gray-800">In Stock</p>
              </div>
            </div>

            {isB2B && (
              <div className="flex flex-wrap gap-3 mb-6">
                <div className="px-4 py-2 bg-gray-900 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-gray-900/10">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Verified Seller</span>
                    <span className="text-xs font-bold leading-none">
                      {product.sellerName && product.sellerName !== 'Zudo Official' ? product.sellerName : (product.sellerId?.businessName || product.sellerId?.name || 'Zudo Official')}
                    </span>
                    <span className="text-[9px] text-gray-500 mt-1">ID: {product.sellerId?._id || product.sellerId || 'N/A'}</span>
                  </div>
                </div>
                <div className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100 flex items-center gap-2">
                  <Package size={14} />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">Min. Order Qty</span>
                    <span className="text-xs font-bold leading-none">{product.moq || 1} {product.unit || 'Units'}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100 mb-8">
              <p className="text-gray-500 font-medium text-sm leading-relaxed">{product.description || 'Our premium collection is sourced directly from certified organic farms, ensuring peak freshness and nutrient density for your family.'}</p>
            </div>
          </div>

          {!isPending ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white rounded-xl p-1 border border-gray-200">
                  <button onClick={() => onUpdateQuantity(product.id, -1)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all"><Minus size={16} /></button>
                  <span className="w-10 text-center font-black text-base">{cartItems.find(i => i.id === product.id)?.quantity || 1}</span>
                  <button onClick={() => onAddToCart(product)} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-all"><Plus size={16} /></button>
                </div>
                <button onClick={() => onAddToCart(product)} className="flex-grow h-12 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]">
                  <ShoppingCart size={18} /> Add to Cart
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => onToggleWishlist(product)} className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] transition-all ${isWishlisted ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-gray-200 hover:border-emerald-200 hover:text-emerald-600'}`}>
                  <Heart size={16} className={isWishlisted ? 'fill-red-600' : ''} /> {isWishlisted ? 'Saved' : 'Wishlist'}
                </button>
                <button onClick={handleShare} className="h-12 w-12 rounded-xl bg-white border border-gray-200 flex items-center justify-center hover:border-emerald-200 transition-all text-gray-400">
                  <Share2 size={16} />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Clock size={18} />
                <h3 className="font-black uppercase tracking-widest text-[11px]">Verification Pending</h3>
              </div>
              <p className="text-amber-800/70 text-[11px] font-medium leading-relaxed">Exclusive B2B features will be unlocked once your business documents are verified.</p>
            </div>
          )}

          <div className="mt-8 grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 text-center shadow-sm">
              <Package className="text-emerald-600 mb-1.5" size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Pure</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 text-center shadow-sm">
              <Truck className="text-blue-600 mb-1.5" size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Fast</span>
            </div>
            <div className="flex flex-col items-center p-4 bg-white rounded-2xl border border-gray-100 text-center shadow-sm">
              <ShieldCheck className="text-amber-600 mb-1.5" size={18} />
              <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Safe</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-10 space-y-12">
        {/* Product Story Section */}
        <section>
          <div className="flex items-center gap-2 mb-6">
            <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Product Story</h2>
          </div>
          
          <div className="max-w-3xl space-y-6">
            <div className="p-6 bg-emerald-50/20 rounded-2xl border border-emerald-50">
              <p className="text-gray-600 font-medium text-sm leading-relaxed italic">
                "Experience the pure essence of nature with our {product.name}. Our commitment to quality ensures that every item is picked at the peak of perfection."
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 group">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 mb-3 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <Package size={16} />
                </div>
                <h4 className="font-black uppercase tracking-widest text-[9px] mb-1 text-emerald-700">Storage Tips</h4>
                <p className="text-gray-500 font-medium text-[10px] leading-relaxed">Keep in a cool, dry place away from direct sunlight.</p>
              </div>
              <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 transition-all hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 group">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center text-emerald-600 mb-3 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                  <ShieldCheck size={16} />
                </div>
                <h4 className="font-black uppercase tracking-widest text-[9px] mb-1 text-emerald-700">Health Benefits</h4>
                <p className="text-gray-500 font-medium text-[10px] leading-relaxed">Rich in essential minerals and vitamins. 100% natural.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="pt-12 border-t border-gray-100">
          <div className="flex items-center gap-2 mb-8">
            <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
            <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-900">Customer Reviews</h2>
            <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[9px] font-black">{reviews.length}</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
          <div className="lg:col-span-2">
            {!user ? (
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 text-center">
                <h3 className="text-lg font-black text-gray-900 mb-4">Want to review?</h3>
                <button onClick={() => onNavigate('profile')} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">Sign In to Continue</button>
              </div>
            ) : reviews.some(r => r.userId?._id === user._id || r.userId === user._id) ? (
              <div className="bg-emerald-50 p-8 rounded-3xl border border-emerald-100 shadow-sm text-center">
                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mx-auto mb-4">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="text-lg font-black text-emerald-900 mb-2">Thank you!</h3>
                <p className="text-emerald-700 text-[10px] font-bold uppercase tracking-widest">You have already reviewed this product.</p>
              </div>
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-gray-200/20 sticky top-24">
                <h3 className="text-lg font-black text-gray-900 mb-1 tracking-tight">Post Review</h3>
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest mb-6">We value your feedback</p>
                
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div className="flex gap-1.5">
                    {[1,2,3,4,5].map(i => (
                      <button key={i} type="button" onClick={() => setNewReview({...newReview, rating: i})} className="hover:scale-110 transition-transform">
                        <Star size={24} className={i <= newReview.rating ? "fill-amber-400 text-amber-400" : "text-gray-100"} strokeWidth={0} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={newReview.comment}
                    onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                    placeholder="Tell us what you liked..."
                    className="w-full px-5 py-4 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white focus:border-emerald-500 outline-none min-h-[120px] text-xs font-bold transition-all placeholder-gray-300 shadow-inner"
                    required
                  ></textarea>

                  <div className="flex flex-wrap gap-2">
                    {newReview.media.map((item, idx) => (
                      <div key={idx} className="relative w-14 h-14 rounded-lg overflow-hidden border border-emerald-100 group">
                        <img src={item.url} alt="Review" className="w-full h-full object-cover" />
                        <button onClick={() => removeMedia(idx)} type="button" className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /></button>
                      </div>
                    ))}
                    {newReview.media.length < 3 && (
                      <label className={`w-14 h-14 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${uploadingImage ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 hover:border-emerald-400'}`}>
                        {uploadingImage ? <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : <Camera size={18} className="text-gray-300" />}
                        <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                      </label>
                    )}
                  </div>

                  <button type="submit" disabled={reviewLoading || uploadingImage} className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50">
                    Submit Review
                  </button>
                </form>
              </div>
            )}
          </div>

            <div className="lg:col-span-3 space-y-6">
              {reviews.length === 0 ? (
                <div className="p-10 bg-gray-50 rounded-2xl border border-dashed border-gray-100 text-center">
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">No reviews yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <div key={index} className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 font-black text-base">
                            {review.userName?.charAt(0) || 'U'}
                          </div>
                          <div>
                            <h4 className="font-black text-gray-900 text-xs leading-none mb-1">{review.userName || 'Anonymous'}</h4>
                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date(review.createdAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={12} className={i < review.rating ? "fill-amber-400 text-amber-400" : "text-gray-100"} strokeWidth={0} />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-500 font-medium text-xs leading-relaxed mb-4">{review.comment}</p>
                      {review.media && review.media.length > 0 && (
                        <div className="flex gap-2">
                          {review.media.map((item, idx) => (
                            <div key={idx} className="w-20 h-20 rounded-xl overflow-hidden border border-gray-50 shadow-sm">
                              <img src={item.url} className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {relatedProducts.length > 0 && (
        <div className="pt-12 border-t border-gray-50">
          <h2 className="text-2xl font-black text-gray-900 mb-8 tracking-tight">You May Also Like</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {relatedProducts.map(p => (
              <div key={p.id} onClick={() => onNavigateToProduct(p)} className="cursor-pointer">
                <ProductCard
                  product={p}
                  onAddToCart={onAddToCart}
                  onUpdateQuantity={onUpdateQuantity}
                  onToggleWishlist={onToggleWishlist}
                  isWishlisted={wishlistItems.some(item => item.id === p.id)}
                  quantity={cartItems.find(item => item.id === p.id)?.quantity || 0}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {message.text && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[250] animate-[slideUp_0.3s_ease-out]">
          <div className={`${message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'} text-white px-8 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-white/10`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <X size={18} />}
            <p className="font-black text-xs uppercase tracking-widest">{message.text}</p>
          </div>
        </div>
      )}
    </div>
  );
}
