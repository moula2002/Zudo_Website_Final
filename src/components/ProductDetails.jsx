import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, ArrowLeft, Star, Plus, Minus, Share2, Package, Truck, ShieldCheck, Clock, X, CheckCircle2, Upload, Camera, Image as ImageIcon, Trash2, ThumbsUp, Edit3 } from 'lucide-react';
import { API_URL, API_BASE_URL, IMAGE_BASE_URL, cleanImageUrl, UPLOAD_URL } from '../config';
import ProductCard from './ProductCard';
import { calculateItemPricing } from '../utils/pricing';

export default function ProductDetails({ product, onAddToCart, onToggleWishlist, isWishlisted, onNavigate, onNavigateToProduct, wishlistItems, cartItems, onUpdateQuantity, allProducts, isB2B, user }) {
  const productId = product?._id || product?.id;
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ totalReviews: 0, averageRating: 0, distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } });
  const [newReview, setNewReview] = useState({ rating: 5, title: '', comment: '', media: [] });
  const [isEditing, setIsEditing] = useState(false);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Get active variant lists based on portal mode (B2B vs B2C)
  const variantsList = isB2B ? (product?.b2b || []) : (product?.b2c || []);

  // Track selected packet size variant locally in details screen
  const [selectedVariant, setSelectedVariant] = useState(() => {
    if (variantsList && variantsList.length > 0) {
      return variantsList[0];
    }
    return null;
  });

  // Derived state values based on active selector
  const activeSize = selectedVariant ? selectedVariant.packetSize : (product?.packetSize || product?.unit || '1 unit');
  const rawPrice = selectedVariant ? selectedVariant.price : product?.price;
  const rawMrp = selectedVariant ? selectedVariant.mrp : (product?.oldPrice || product?.price);
  const activeStock = selectedVariant ? (selectedVariant.stock !== undefined ? selectedVariant.stock : product?.stock) : product?.stock;
  const activeGst = selectedVariant ? (selectedVariant.gstPercent || product?.gstPercent || 0) : (product?.gstPercent || 0);
  const activeMoq = isB2B ? (product?.moq || 1) : 1;
  
  // Authoritative final pricing from backend (inclusive of commission and applicable GST)
  const activePrice = rawPrice;
  const activeMrp = rawMrp;

  // Uniquely identify the selected item size variant in the shopping cart
  const cartItemKey = `${product?.id}_${activeSize}`;
  const cartItem = cartItems?.find(item => item.cartKey === cartItemKey);
  const currentQuantity = cartItem ? cartItem.quantity : 0;

  const [selectedQty, setSelectedQty] = useState(isB2B ? (product?.moq || 1) : 1);
  const displayQty = currentQuantity > 0 ? currentQuantity : (selectedQty || (isB2B ? (product?.moq || 1) : 1));

  const activeVariantUnitSize = selectedVariant 
    ? (Number(selectedVariant.unitSize || selectedVariant.sizeValue) > 0 ? Number(selectedVariant.unitSize || selectedVariant.sizeValue) : 1)
    : (Number(product?.unitSize) > 0 ? Number(product?.unitSize) : 1);

  const currentItemPayload = {
    ...product,
    variantId: selectedVariant?._id || selectedVariant?.id,
    priceBasis: selectedVariant?.priceBasis || product?.priceBasis || 'per_unit',
    sellerPrice: selectedVariant?.sellerPrice !== undefined ? selectedVariant.sellerPrice : product?.sellerPrice,
    sellerB2bPrice: selectedVariant?.sellerB2bPrice !== undefined ? selectedVariant.sellerB2bPrice : product?.sellerB2bPrice,
    commissionType: selectedVariant?.commissionType || product?.commissionType || 'flat',
    commissionValue: selectedVariant?.commissionValue !== undefined ? selectedVariant.commissionValue : product?.commissionValue,
    commissionAmount: selectedVariant?.commissionAmount !== undefined ? selectedVariant.commissionAmount : product?.commissionAmount,
    unitSize: activeVariantUnitSize,
    unit: product?.unit || 'unit',
    measurementBasis: selectedVariant?.measurementBasis || selectedVariant?.measurementUnit || product?.measurementBasis || product?.measurementUnit || 'KG',
    measurementUnit: selectedVariant?.measurementUnit || selectedVariant?.measurementBasis || product?.measurementUnit || 'KG',
    packagingType: selectedVariant?.packagingType || product?.packagingType || product?.unit || 'BAG',
    sellerPricePerBaseUnit: selectedVariant?.sellerPricePerBaseUnit || product?.sellerPricePerBaseUnit,
    sellerPricePerProductUnit: selectedVariant?.sellerPricePerProductUnit || selectedVariant?.sellerPrice,
    adminCommissionPerBaseUnit: selectedVariant?.adminCommissionPerBaseUnit || product?.adminCommissionPerBaseUnit,
    commissionPerProductUnit: selectedVariant?.commissionPerProductUnit || selectedVariant?.commissionAmount,
    price: rawPrice,
    priceTiers: selectedVariant?.priceTiers || product?.priceTiers,
    gstPercent: activeGst
  };

  const pricingBreakdown = calculateItemPricing({
    item: currentItemPayload,
    quantity: displayQty,
    isB2B
  });

  // Sync state if product changes
  useEffect(() => {
    if (variantsList && variantsList.length > 0) {
      setSelectedVariant(variantsList[0]);
    } else {
      setSelectedVariant(null);
    }
  }, [product?.id, isB2B]);

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
  useEffect(() => {
    if (productId) {
      fetchReviews();
      window.scrollTo(0, 0);
    }
  }, [productId]);

  const fetchReviews = async () => {
    if (!productId) return;
    try {
      const res = await fetch(`${API_URL}/reviews/product/${productId}?detailed=true`);
      if (res.ok) {
        const data = await res.json();
        if (data.reviews && data.stats) {
          setReviews(data.reviews);
          setReviewStats(data.stats);
        } else {
          const list = Array.isArray(data) ? data : [];
          setReviews(list);
          const total = list.length;
          const avg = total > 0 ? (list.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '0.0';
          const dist = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
          list.forEach(r => {
            const s = Math.min(5, Math.max(1, Math.round(r.rating)));
            dist[s] = (dist[s] || 0) + 1;
          });
          setReviewStats({ totalReviews: total, averageRating: Number(avg), distribution: dist });
        }
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
      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) throw new Error('Upload failed');
      const data = await response.json();
      const imageUrl = cleanImageUrl(data.url);
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

  const handleStartEdit = (userExistingReview) => {
    setNewReview({
      rating: userExistingReview.rating || 5,
      title: userExistingReview.title || '',
      comment: userExistingReview.comment || '',
      media: userExistingReview.media || []
    });
    setIsEditing(true);
  };

  const handleVoteHelpful = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ text: 'Please sign in to vote', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 2500);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setReviews(prev => prev.map(r => r._id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r));
      }
    } catch (err) {
      console.error('Helpful vote failed:', err);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      setMessage({ text: 'Please login to post a review', type: 'error' });
      return;
    }

    if (!newReview.comment || newReview.comment.trim().length < 3) {
      setMessage({ text: 'Please provide at least a short review comment (3+ characters)', type: 'error' });
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
          productId,
          rating: newReview.rating,
          title: newReview.title,
          comment: newReview.comment,
          media: newReview.media
        })
      });
      if (res.ok) {
        const resData = await res.json();
        setMessage({ text: resData.message || (isEditing ? 'Review updated successfully!' : 'Review posted successfully!'), type: 'success' });
        setNewReview({ rating: 5, title: '', comment: '', media: [] });
        setIsEditing(false);
        fetchReviews();
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to post review');
      }
    } catch (err) {
      setMessage({ text: err.message, type: 'error' });
    } finally {
      setReviewLoading(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3500);
    }
  };

  if (!product) return null;

  const relatedProducts = allProducts?.filter(p => p.category === product.category && (p._id || p.id) !== productId).slice(0, 4) || [];
  const averageRating = reviewStats.totalReviews > 0 ? Number(reviewStats.averageRating).toFixed(1) : (product.rating ? Number(product.rating).toFixed(1) : '5.0');
  const userExistingReview = user ? reviews.find(r => (r.userId?._id === user._id || r.userId === user._id || r.userId?._id === user.id)) : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 flex-grow mt-6 bg-white dark:bg-[#121212] rounded-2xl shadow-sm mb-10 border border-gray-100 dark:border-white/5 transition-colors">
      <button onClick={() => onNavigate('products')} className="flex items-center gap-2 text-gray-400 hover:text-emerald-600 mb-6 font-bold uppercase tracking-widest text-[8px] transition-all group">
        <ArrowLeft size={12} /> Back to Products
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        <div className="space-y-4">
          <div className="aspect-square bg-gray-50 dark:bg-white/5 rounded-2xl overflow-hidden group relative border border-gray-100 dark:border-white/10 transition-colors">
            <img
              src={cleanImageUrl(product.image || product.imageUrl)}
              alt={product.name}
              className="w-full h-full object-contain p-6 transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <span className="px-3 py-1 bg-white/90 dark:bg-emerald-600 backdrop-blur-md text-emerald-700 dark:text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm border border-emerald-100/30">{product.category}</span>
              {activeMrp && !isPending && Number(activeMrp) > Number(activePrice) && (
                <span className="px-3 py-1 bg-red-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg shadow-red-500/20 w-fit">Sale</span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-square bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 hover:border-emerald-200 transition-all overflow-hidden p-2 opacity-60 hover:opacity-100 cursor-pointer">
                <img
                  src={cleanImageUrl(product.image || product.imageUrl)}
                  className="w-full h-full object-contain"
                />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col pt-2">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 dark:bg-amber-500/10 rounded-lg text-amber-600 border border-amber-100 dark:border-amber-500/20">
                <Star size={12} className="fill-amber-500 text-amber-500" />
                <span className="text-[11px] font-black">{averageRating}</span>
              </div>
              <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{reviews.length} Reviews</span>
            </div>

            <h1 className="text-3xl font-black text-gray-900 dark:text-white mb-4 tracking-tight leading-tight">{product.name}</h1>

            {/* Packet Size Option Pill Selectors */}
            {variantsList && variantsList.length > 0 && (
              <div className="mb-6">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Select Packet Size</span>
                <div className="flex flex-wrap gap-2">
                  {variantsList.map((v, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedVariant(v)}
                      className={`text-xs font-black uppercase px-4 py-2.5 rounded-2xl border transition-all duration-300 ${activeSize === v.packetSize
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20 scale-105'
                          : 'bg-white dark:bg-white/5 border-gray-100 dark:border-white/10 text-gray-500 hover:border-emerald-200 hover:text-emerald-600'
                        }`}
                    >
                      {v.packetSize}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Price Tiers Display */}
            {product.priceTiers && product.priceTiers.length > 0 && isB2B && (
              <div className="mb-6 p-4 bg-emerald-50/50 dark:bg-emerald-500/5 rounded-2xl border border-emerald-100 dark:border-emerald-500/10">
                <div className="flex items-center gap-2 mb-3">
                  <Package size={14} className="text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-[0.2em]">Bulk Pricing Available</span>
                </div>
                <div className="flex flex-col gap-2">
                  {product.priceTiers.sort((a, b) => a.minQty - b.minQty).map((tier, idx) => (
                    <div key={idx} className="bg-white dark:bg-white/5 p-3 rounded-xl border border-emerald-100 dark:border-white/10 flex items-center justify-between">
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{tier.minQty}+ {activeSize}</p>
                      <p className="text-sm font-black text-emerald-600 dark:text-emerald-400">₹{isB2B ? Number((tier.price * (1 + activeGst / 100)).toFixed(2)) : tier.price}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-4 mb-6">
              <div className="flex flex-col">
                <span className={`text-3xl font-black ${isPending ? 'text-amber-500' : 'text-emerald-600'} tracking-tight`}>
                  {isPending ? 'Verification Pending' : `₹${activePrice}`}
                </span>
                {activeMrp && !isPending && Number(activeMrp) > Number(activePrice) && (
                  <span className="text-xs text-gray-400 font-bold flex items-center gap-2 mt-1">
                    <span className="line-through">₹{activeMrp}</span>
                    <span className="text-red-500 text-[9px] uppercase tracking-tighter">
                      -{Math.round((1 - activePrice / activeMrp) * 100)}% Off
                    </span>
                  </span>
                )}
              </div>
              <div className={`px-3 py-1 rounded-xl border transition-colors ${(activeStock !== undefined && Number(activeStock) > 0)
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-red-50 dark:bg-red-500/10 border-red-50 dark:border-red-500/20 text-red-700 dark:text-red-400'
                }`}>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-85">Stock Status</p>
                <p className="text-[11px] font-black">
                  {(activeStock !== undefined && Number(activeStock) > 0) ? `${activeStock} pcs available` : 'Out of Stock'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mb-6">
              <div className="px-4 py-2 bg-gray-900 dark:bg-white/5 text-white rounded-xl flex items-center gap-2 shadow-lg shadow-gray-900/10">
                <ShieldCheck size={14} className="text-emerald-400" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase tracking-widest text-gray-400 leading-none mb-1">Verified Seller</span>
                  <span className="text-xs font-bold leading-none">
                    {product.sellerName && product.sellerName !== 'Zudo Official' ? product.sellerName : (product.sellerId?.businessName || product.sellerId?.name || 'Zudo Official')}
                  </span>
                </div>
              </div>
              {isB2B && (
                <div className="px-4 py-2 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-100 dark:border-amber-500/20 flex items-center gap-2">
                  <Package size={14} />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">B2B Verified</span>
                    <span className="text-xs font-bold leading-none">Wholesale Pricing</span>
                  </div>
                </div>
              )}
              {isB2B && activeGst > 0 && (
                <div className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20 flex items-center gap-2">
                  <span className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">Tax Inclusive</span>
                  <span className="text-xs font-bold leading-none">{activeGst}% GST</span>
                </div>
              )}
            </div>

            {/* Measurement-Based Commission & Price Breakdown */}
            {!isPending && (
              <div className="mb-6 p-4 bg-emerald-50/60 dark:bg-emerald-500/10 rounded-2xl border border-emerald-100 dark:border-emerald-500/20">
                <div className="flex items-center justify-between mb-3 border-b border-emerald-100/60 pb-2">
                  <div className="flex items-center gap-2">
                    <Package size={14} className="text-emerald-600" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-400">
                      Pricing & Commission Breakdown
                    </span>
                  </div>
                  <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    Package: <strong className="text-emerald-700 dark:text-emerald-400">1 {pricingBreakdown.packagingType || 'BAG'} = {pricingBreakdown.unitSize} {pricingBreakdown.measurementBasis || 'KG'}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div className="bg-white/80 dark:bg-black/20 p-2.5 rounded-xl border border-emerald-100/40">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Commission Per Package</p>
                    <p className="font-black text-gray-800 dark:text-gray-200 text-sm mt-0.5">
                      ₹{pricingBreakdown.unitCommission}
                      <span className="text-[10px] font-normal text-gray-500 ml-1">
                        (₹{pricingBreakdown.commissionRate} × {pricingBreakdown.unitSize} {pricingBreakdown.measurementBasis || 'KG'})
                      </span>
                    </p>
                  </div>
                  <div className="bg-white/80 dark:bg-black/20 p-2.5 rounded-xl border border-emerald-100/40">
                    <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Total Commission ({pricingBreakdown.totalProductWeight} {pricingBreakdown.measurementBasis || 'KG'})</p>
                    <p className="font-black text-emerald-600 text-sm mt-0.5">
                      ₹{pricingBreakdown.totalCommission}
                      <span className="text-[9px] font-normal text-gray-400 ml-1">
                        ({pricingBreakdown.totalProductWeight} {pricingBreakdown.measurementBasis || 'KG'} × ₹{pricingBreakdown.commissionRate})
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-emerald-100/60 text-xs">
                  <span className="text-gray-600 font-bold">
                    Seller: ₹{pricingBreakdown.totalSellerPrice}
                    {pricingBreakdown.totalProductWeight > 0 && ` (${pricingBreakdown.totalProductWeight} ${pricingBreakdown.measurementBasis || 'KG'})`}
                    {activeGst > 0 && ` + GST (₹${pricingBreakdown.totalGst})`}
                  </span>
                  <div className="text-right">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Final Total</span>
                    <span className="text-base font-black text-emerald-600">₹{pricingBreakdown.finalCustomerPrice}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="p-5 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 mb-8">
              <p className="text-gray-500 dark:text-gray-400 font-medium text-sm leading-relaxed">{product.description || 'Our premium collection is sourced directly from certified organic farms, ensuring peak freshness and nutrient density for your family.'}</p>
            </div>
          </div>

          {!isPending ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-white dark:bg-white/5 rounded-xl p-1 border border-gray-200 dark:border-white/10 transition-colors">
                  <button 
                    onClick={() => {
                      if (currentQuantity > 0) {
                        onUpdateQuantity(cartItemKey, -1);
                      } else {
                        const minQty = isB2B ? (product?.moq || 1) : 1;
                        setSelectedQty(prev => Math.max(minQty, prev - 1));
                      }
                    }} 
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-all"
                  >
                    <Minus size={16} />
                  </button>
                  <span className="w-10 text-center font-black text-base dark:text-white">{displayQty}</span>
                  <button
                    onClick={() => {
                      if (currentQuantity > 0) {
                        onUpdateQuantity(cartItemKey, 1);
                      } else {
                        const maxStock = activeStock !== undefined ? Number(activeStock) : Infinity;
                        setSelectedQty(prev => Math.min(maxStock, prev + 1));
                      }
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/10 text-gray-900 dark:text-white transition-all"
                  >
                    <Plus size={16} />
                  </button>
                </div>
                <button
                  onClick={() => {
                    if (currentQuantity > 0) {
                      onNavigate('cart');
                    } else {
                      onAddToCart(product, selectedVariant, displayQty);
                    }
                  }}
                  className="flex-grow h-12 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                >
                  <ShoppingCart size={18} /> {currentQuantity > 0 ? 'View in Cart' : 'Add to Cart'}
                </button>
              </div>
              <div className="flex gap-3">
                <button onClick={() => onToggleWishlist(product)} className={`flex-1 h-12 rounded-xl border flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[9px] transition-all ${isWishlisted ? 'bg-red-50 dark:bg-red-500/10 border-red-200 dark:border-red-500/30 text-red-600' : 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:border-emerald-200 hover:text-emerald-600'}`}>
                  <Heart size={16} className={isWishlisted ? 'fill-red-600' : ''} /> {isWishlisted ? 'Saved' : 'Wishlist'}
                </button>
                <button onClick={handleShare} className="h-12 w-12 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-center hover:border-emerald-200 transition-all text-gray-400">
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
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="h-6 w-1 bg-emerald-600 rounded-full"></div>
              <h2 className="text-sm font-black uppercase tracking-[0.2em] text-gray-900">Customer Ratings & Reviews</h2>
              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-black">{reviews.length}</span>
            </div>
          </div>

          {/* Rating Breakdown & Stats Banner */}
          <div className="bg-gray-50/70 p-6 md:p-8 rounded-3xl border border-gray-100 mb-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex flex-col items-center justify-center md:border-r border-gray-200/80 md:pr-10 min-w-[160px]">
              <span className="text-5xl font-black text-gray-900 leading-none">{averageRating}</span>
              <div className="flex items-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <Star 
                    key={star} 
                    size={16} 
                    className={star <= Math.round(Number(averageRating)) ? "fill-amber-400 text-amber-400" : "text-gray-200"} 
                    strokeWidth={0} 
                  />
                ))}
              </div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Based on {reviews.length} {reviews.length === 1 ? 'Review' : 'Reviews'}
              </span>
            </div>

            {/* Distribution Bars */}
            <div className="flex-1 w-full space-y-2">
              {[5, 4, 3, 2, 1].map(stars => {
                const count = reviewStats.distribution?.[stars] || 0;
                const percent = reviews.length > 0 ? Math.round((count / reviews.length) * 100) : 0;
                return (
                  <div key={stars} className="flex items-center gap-3 text-xs">
                    <span className="w-8 font-black text-gray-600 flex items-center gap-1 text-[11px]">
                      {stars} <Star size={10} className="fill-amber-400 text-amber-400" strokeWidth={0} />
                    </span>
                    <div className="flex-1 h-2 bg-gray-200/70 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      ></div>
                    </div>
                    <span className="w-10 text-right text-[10px] font-bold text-gray-400">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Left Column: Post or Edit Review */}
            <div className="lg:col-span-2">
              {!user ? (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 text-center">
                  <h3 className="text-lg font-black text-gray-900 mb-2">Bought this item?</h3>
                  <p className="text-xs text-gray-400 font-medium mb-6">Sign in to share your thoughts and rate this product for other shoppers.</p>
                  <button onClick={() => onNavigate('profile')} className="w-full px-6 py-3.5 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20">
                    Sign In to Review
                  </button>
                </div>
              ) : userExistingReview && !isEditing ? (
                <div className="bg-emerald-50/60 p-6 rounded-3xl border border-emerald-100 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-700 font-bold">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-emerald-950 uppercase tracking-wider">Your Review</h4>
                        <span className="text-[9px] text-emerald-600 font-medium">Submitted</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleStartEdit(userExistingReview)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-200 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      <Edit3 size={11} /> Edit Review
                    </button>
                  </div>
                  <div className="flex items-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} size={12} className={i <= userExistingReview.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} strokeWidth={0} />
                    ))}
                  </div>
                  {userExistingReview.title && (
                    <p className="font-black text-xs text-gray-900 mb-1">{userExistingReview.title}</p>
                  )}
                  <p className="text-xs text-gray-600 font-medium leading-relaxed italic">
                    "{userExistingReview.comment}"
                  </p>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/20 sticky top-24">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-base font-black text-gray-900 tracking-tight leading-none mb-1">
                        {isEditing ? 'Update Your Review' : 'Write a Review'}
                      </h3>
                      <p className="text-gray-400 text-[9px] font-bold uppercase tracking-widest">Share your experience</p>
                    </div>
                    {isEditing && (
                      <button
                        onClick={() => { setIsEditing(false); setNewReview({ rating: 5, title: '', comment: '', media: [] }); }}
                        className="text-[10px] text-gray-400 hover:text-gray-600 font-bold underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  <form onSubmit={handleReviewSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Rating</label>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <button 
                            key={i} 
                            type="button" 
                            onClick={() => setNewReview({ ...newReview, rating: i })} 
                            className="hover:scale-110 transition-transform p-1"
                          >
                            <Star size={24} className={i <= newReview.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} strokeWidth={0} />
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Headline (Optional)</label>
                      <input
                        type="text"
                        value={newReview.title}
                        onChange={(e) => setNewReview({ ...newReview, title: e.target.value })}
                        placeholder="e.g. Great quality, fresh and authentic!"
                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-emerald-500 outline-none text-xs font-bold transition-all placeholder-gray-300"
                        maxLength={100}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Review Comment *</label>
                      <textarea
                        value={newReview.comment}
                        onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                        placeholder="What did you like or dislike? How was the packaging and quality?"
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 focus:bg-white focus:border-emerald-500 outline-none min-h-[110px] text-xs font-medium transition-all placeholder-gray-300 leading-relaxed"
                        required
                        minLength={3}
                        maxLength={1000}
                      ></textarea>
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Add Photos (Max 3)</label>
                      <div className="flex flex-wrap gap-2">
                        {newReview.media.map((item, idx) => (
                          <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border border-emerald-100 group">
                            <img src={cleanImageUrl(item.url)} alt="Review attachment" className="w-full h-full object-cover" />
                            <button 
                              onClick={() => removeMedia(idx)} 
                              type="button" 
                              className="absolute inset-0 bg-red-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                        {newReview.media.length < 3 && (
                          <label className={`w-14 h-14 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${uploadingImage ? 'bg-gray-100 border-gray-200' : 'bg-white border-gray-200 hover:border-emerald-500'}`}>
                            {uploadingImage ? (
                              <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              <Camera size={18} className="text-gray-400" />
                            )}
                            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
                          </label>
                        )}
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      disabled={reviewLoading || uploadingImage} 
                      className="w-full py-3.5 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    >
                      {reviewLoading ? 'Submitting...' : isEditing ? 'Update Review' : 'Submit Review'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Right Column: Customer Reviews List */}
            <div className="lg:col-span-3 space-y-6">
              {reviews.length === 0 ? (
                <div className="p-12 bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-center">
                  <Star size={32} className="mx-auto mb-3 text-gray-300" />
                  <h4 className="font-black text-gray-700 text-sm mb-1">No reviews yet</h4>
                  <p className="text-gray-400 font-bold uppercase tracking-widest text-[9px]">Be the first to share your thoughts on this product!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => {
                    const reviewerName = review.userId?.name || review.userName || 'Verified Customer';
                    const initial = reviewerName.charAt(0).toUpperCase() || 'U';

                    return (
                      <div key={review._id || index} className="p-6 bg-white rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
                        <div className="flex items-start justify-between mb-3 gap-2">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center font-black text-sm border border-emerald-100 flex-shrink-0">
                              {initial}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-black text-gray-900 text-xs leading-none">{reviewerName}</h4>
                                {review.isVerifiedPurchase && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <CheckCircle2 size={10} className="text-emerald-600" /> Verified Buyer
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                {new Date(review.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            {[1, 2, 3, 4, 5].map(i => (
                              <Star key={i} size={12} className={i <= review.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"} strokeWidth={0} />
                            ))}
                          </div>
                        </div>

                        {review.title && (
                          <h5 className="font-black text-xs text-gray-900 mb-1">{review.title}</h5>
                        )}

                        <p className="text-gray-600 font-medium text-xs leading-relaxed mb-3">{review.comment}</p>

                        {review.media && review.media.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {review.media.map((item, idx) => (
                              <div key={idx} className="w-16 h-16 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                <img src={cleanImageUrl(item.url)} alt="Review attachment" className="w-full h-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Official Admin / Store Reply */}
                        {review.adminReply?.comment && (
                          <div className="mt-3 pl-3.5 border-l-2 border-emerald-500 bg-emerald-50/40 p-3 rounded-r-2xl">
                            <div className="flex items-center gap-1.5 text-emerald-800 text-[10px] font-black uppercase tracking-widest mb-1">
                              <span>{review.adminReply.repliedBy || 'Zudo Official Team'}</span>
                              <span className="text-[8px] text-gray-400 font-normal">
                                • {new Date(review.adminReply.repliedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-gray-700 text-xs font-medium leading-relaxed">
                              {review.adminReply.comment}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50 text-[10px]">
                          <span className="text-gray-400 font-medium">Was this review helpful?</span>
                          <button
                            type="button"
                            onClick={() => handleVoteHelpful(review._id)}
                            className="flex items-center gap-1.5 text-gray-500 hover:text-emerald-600 font-bold uppercase tracking-wider text-[9px] transition-colors py-1 px-2 rounded-lg hover:bg-emerald-50"
                          >
                            <ThumbsUp size={12} />
                            Helpful {review.helpfulCount > 0 ? `(${review.helpfulCount})` : ''}
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
                  cartItems={cartItems}
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
