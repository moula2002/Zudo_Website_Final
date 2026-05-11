import React, { useState, useEffect } from 'react';
import { Package, Calendar, Clock, ChevronRight, ShoppingBag, ArrowLeft, CheckCircle2, Truck, AlertCircle, MapPin, Receipt, ExternalLink, ChevronDown, ChevronUp, User, Phone, Camera, Upload, X } from 'lucide-react';
import { API_URL, API_BASE_URL, IMAGE_BASE_URL } from '../config';

export default function OrdersPage({ onNavigate }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);



    const apiBase = API_BASE_URL;
    const uploadBase = API_BASE_URL;

  const [returnModal, setReturnModal] = useState({ open: false, order: null });
  const [returnForm, setReturnForm] = useState({ selectedReason: '', comment: '', image: null, preview: null });
  const [submittingReturn, setSubmittingReturn] = useState(false);

  const RETURN_REASONS = [
    "Damaged product",
    "Wrong item delivered",
    "Quality not as expected",
    "Expired product",
    "Item missing",
    "Other"
  ];

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const response = await fetch(`${apiBase}/api/orders/myorders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setOrders(data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  const updateOrderStatus = async (orderId, newStatus, returnData = null) => {
    try {
      const body = { status: newStatus };
      if (returnData) {
        body.returnReason = returnData.reason;
        body.returnComment = returnData.comment;
        body.returnImage = returnData.image;
      }

      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        // Refresh orders after update
        const updatedOrders = orders.map(order => 
          order._id === orderId ? { ...order, orderStatus: newStatus, ...returnData } : order
        );
        setOrders(updatedOrders);
        return true;
      }
    } catch (err) {
      console.error('Failed to update order status:', err);
      return false;
    }
  };

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!returnForm.selectedReason) return alert('Please select a reason for return');
    if (!returnForm.image) return alert('Please upload an evidence photo');
    
    setSubmittingReturn(true);
    let imageUrl = '';

    try {
      // 1. Upload Image if exists
      if (returnForm.image) {
        const formData = new FormData();
        formData.append('file', returnForm.image);
        const uploadRes = await fetch(`${API_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) imageUrl = `${IMAGE_BASE_URL}${uploadData.url}`;
      }

      // 2. Update Order Status to Returned with separate reason, comment and image
      const success = await updateOrderStatus(returnModal.order._id, 'Returned', {
        reason: returnForm.selectedReason,
        comment: returnForm.comment,
        image: imageUrl
      });

      if (success) {
        setReturnModal({ open: false, order: null });
        setReturnForm({ selectedReason: '', comment: '', image: null, preview: null });
      }
    } catch (err) {
      console.error('Return failed:', err);
    } finally {
      setSubmittingReturn(false);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setReturnForm({
        ...returnForm,
        image: file,
        preview: URL.createObjectURL(file)
      });
    }
  };

  const toggleOrderExpansion = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };



  const canReturn = (order) => {
    if (order.orderStatus !== 'Delivered') return false;
    const deliveredDate = new Date(order.updatedAt || order.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - deliveredDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Delivered': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
      case 'Returned': return 'bg-purple-500 text-white shadow-lg shadow-purple-500/20';
      case 'Shipped': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/20';
      case 'Processing': return 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
      case 'Pending': return 'bg-gray-500 text-white shadow-lg shadow-gray-500/20';
      case 'Cancelled': return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
      default: return 'bg-gray-400 text-white shadow-lg shadow-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Delivered': return <CheckCircle2 size={14} />;
      case 'Returned': return <ArrowLeft size={14} />;
      case 'Shipped': return <Truck size={14} />;
      case 'Processing': return <Clock size={14} />;
      case 'Cancelled': return <X size={14} />;
      default: return <Package size={14} />;
    }
  };

  const formatImageUrl = (url) => {
    if (!url) return 'https://via.placeholder.com/150';
    if (url.startsWith('http')) return url;
    return `${IMAGE_BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center gap-4 bg-white">
        <div className="w-16 h-16 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-gray-400 font-black text-xs uppercase tracking-[0.2em] animate-pulse">Loading History</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfd] pb-24">
      {/* Header Banner */}
      <div className="bg-[#107569] pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-5xl mx-auto relative z-10">
          <button 
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2 text-emerald-100 hover:text-white font-black text-xs uppercase tracking-widest mb-6 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mb-1">Order History</h1>
              <p className="text-emerald-100/60 font-bold text-sm">Track your recent grocery collections</p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10">
              <div className="text-right">
                <p className="text-[9px] font-black text-emerald-200 uppercase tracking-widest">Total Orders</p>
                <p className="text-xl font-black text-white leading-none mt-1">{orders.length}</p>
              </div>
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white shadow-lg">
                <Receipt size={16} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-20">
        {orders.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-20 text-center shadow-2xl shadow-emerald-900/5 border border-gray-100 animate-[fadeIn_0.5s_ease-out]">
            <div className="w-32 h-32 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-8">
              <ShoppingBag size={56} className="text-emerald-200" />
            </div>
            <h2 className="text-3xl font-black text-gray-900 mb-3 tracking-tight">Your bag is empty</h2>
            <p className="text-gray-500 font-bold mb-10 max-w-sm mx-auto leading-relaxed">Looks like you haven't placed any orders yet. Let's find some amazing fresh produce for you!</p>
            <button 
              onClick={() => onNavigate('products')}
              className="px-10 py-4 bg-[#107569] text-white font-black rounded-2xl shadow-xl shadow-emerald-900/20 hover:bg-[#0d6359] transition-all transform hover:-translate-y-1 hover:scale-105 active:scale-95"
            >
              Explore Products
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order, orderIdx) => (
              <div 
                key={order._id} 
                className="bg-white rounded-[2rem] overflow-hidden shadow-xl shadow-emerald-900/5 border border-gray-100 hover:border-emerald-500/30 transition-all duration-300 group"
                style={{ animationDelay: `${orderIdx * 0.1}s` }}
              >
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 justify-between">
                    <div className="flex gap-6">
                      <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex-shrink-0 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform duration-500">
                        <Package className="text-emerald-600" size={32} />
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center flex-wrap gap-3">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                            ID: #{order._id.slice(-6).toUpperCase()}
                          </span>
                          <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase transition-all ${getStatusStyle(order.orderStatus)}`}>
                            {getStatusIcon(order.orderStatus)}
                            {order.orderStatus}
                          </div>
                          {order.deliveryOtp && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                            <div className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black tracking-widest uppercase shadow-lg shadow-emerald-600/20">
                              <Truck size={12} />
                              Delivery OTP: <span className="font-mono text-xs tracking-[0.2em] ml-1">{order.deliveryOtp}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500 font-bold text-sm">
                          <div className="flex items-center gap-2 text-gray-900">
                            <Calendar size={16} className="text-emerald-600" />
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="flex items-center gap-2 text-gray-900">
                            <Receipt size={16} className="text-emerald-600" />
                            <span className="text-lg font-black tracking-tighter">₹{order.totalAmount}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0">
                      <div className="flex -space-x-4">
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="w-12 h-12 rounded-2xl border-4 border-white bg-white overflow-hidden shadow-md transform hover:-translate-y-2 hover:z-10 transition-all cursor-pointer">
                            <img src={formatImageUrl(item.product?.imageUrl || item.product?.image || item.image || item.imageUrl)} alt="Item" className="w-full h-full object-cover" />
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <div className="w-12 h-12 rounded-2xl border-4 border-white bg-[#107569] flex items-center justify-center text-xs font-black text-white shadow-md">
                            +{order.items.length - 3}
                          </div>
                        )}
                      </div>
                      <button 
                        onClick={() => toggleOrderExpansion(order._id)}
                        className="flex items-center gap-2 px-6 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                      >

                        {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                        {expandedOrder === order._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>

                    </div>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {expandedOrder === order._id && (
                  <div className="border-t border-emerald-50 bg-emerald-50/20 animate-[slideDown_0.3s_ease-out]">
                    <div className="p-6 md:p-8 space-y-6">
                      <div className={`grid grid-cols-1 ${order.cashPersonId ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-8`}>
                        {/* Delivery Info */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={14} className="text-emerald-500" />
                            Delivery Address
                          </h3>
                          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
                            <p className="font-black text-gray-900 mb-1">{order.shippingAddress.name}</p>
                            <p className="text-gray-500 text-sm font-bold leading-relaxed">
                              {order.shippingAddress.address}<br />
                              {order.shippingAddress.city}, {order.shippingAddress.pincode}
                            </p>
                            <p className="text-emerald-600 text-sm font-black mt-3 flex items-center gap-2">
                              <ExternalLink size={14} />
                              {order.shippingAddress.phone}
                            </p>
                          </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Receipt size={14} className="text-emerald-500" />
                            Payment Details
                          </h3>
                          <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm space-y-3">
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-bold">Payment Method</span>
                              <span className="font-black text-gray-900">{order.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-bold">Status</span>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${order.paymentStatus === 'Completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {order.paymentStatus}
                              </span>
                            </div>
                            <div className="h-px bg-gray-100 my-2"></div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-900 font-black">Total Paid</span>
                              <span className="text-xl font-black text-emerald-600">₹{order.totalAmount}</span>
                            </div>
                            
                            {/* Order Actions */}
                            <div className="pt-4 border-t border-gray-50 flex flex-col gap-2">
                              {order.orderStatus === 'Pending' && (
                                <button 
                                  onClick={() => updateOrderStatus(order._id, 'Cancelled')}
                                  className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all"
                                >
                                  Cancel Order
                                </button>
                              )}
                              
                              {order.orderStatus === 'Delivered' && canReturn(order) && (
                                <button 
                                  onClick={() => setReturnModal({ open: true, order })}
                                  className="w-full py-3 bg-amber-50 text-amber-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-amber-600 hover:text-white transition-all"
                                >
                                  Return Order (3 Days Left)
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Cash Collector Info */}
                        {order.cashPersonId && typeof order.cashPersonId === 'object' && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <User size={14} className="text-emerald-500" />
                              Cash Collector Details
                            </h3>
                            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black">
                                  {order.cashPersonId.name?.charAt(0) || 'C'}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 mb-0.5">{order.cashPersonId.name}</p>
                                  <p className="text-emerald-600 text-sm font-black flex items-center gap-2">
                                    <Phone size={12} />
                                    {order.cashPersonId.phone}
                                  </p>
                                  {order.cashPersonId.email && (
                                    <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
                                      {order.cashPersonId.email}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>



                      {/* Item List */}
                      <div className="space-y-4">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Order Items</h3>
                        <div className="bg-white rounded-3xl border border-emerald-100 shadow-sm overflow-hidden">
                          {order.items.map((item, idx) => (
                            <div key={idx} className={`p-4 flex items-center justify-between gap-4 ${idx !== order.items.length - 1 ? 'border-bottom border-gray-50' : ''}`}>
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-gray-50 overflow-hidden border border-gray-100">
                                  <img src={formatImageUrl(item.product?.imageUrl || item.product?.image || item.image || item.imageUrl)} alt={item.product?.name || item.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 text-sm leading-none mb-1">{item.product?.name || 'Unknown Product'}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.quantity} × ₹{item.price}</p>
                                </div>
                              </div>
                              <div className="text-sm font-black text-gray-900">₹{item.quantity * item.price}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Return Request Modal */}
      {returnModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !submittingReturn && setReturnModal({ open: false, order: null })}></div>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative z-10 overflow-hidden animate-[scaleIn_0.2s_ease-out]">
            <div className="bg-white p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Return Request</h2>
                <p className="text-gray-500 text-xs font-medium mt-0.5">Order #{returnModal.order?._id.slice(-6).toUpperCase()}</p>
              </div>
              <button 
                onClick={() => setReturnModal({ open: false, order: null })}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400"
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleReturnSubmit} className="p-6 space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-0.5">Reason for Return</label>
                <div className="grid grid-cols-2 gap-2">
                  {RETURN_REASONS.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setReturnForm({ ...returnForm, selectedReason: reason })}
                      className={`px-3 py-2 rounded-xl text-[10px] font-bold border transition-all ${returnForm.selectedReason === reason ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-0.5">Additional Details (Optional)</label>
                <textarea 
                  rows="2"
                  value={returnForm.comment}
                  onChange={(e) => setReturnForm({ ...returnForm, comment: e.target.value })}
                  placeholder="Any extra info to help us understand..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:border-amber-500 outline-none transition-all text-sm text-gray-800 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-gray-700 ml-0.5">Evidence Photo <span className="text-red-500">*Required</span></label>
                <div className="relative">
                  {returnForm.preview ? (
                    <div className="relative rounded-xl overflow-hidden border border-gray-200 group">
                      <img src={returnForm.preview} alt="Preview" className="w-full h-32 object-cover" />
                      <button 
                        type="button"
                        onClick={() => setReturnForm({ ...returnForm, image: null, preview: null })}
                        className="absolute top-2 right-2 bg-black/60 text-white p-1.5 rounded-lg hover:bg-red-500 transition-colors"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-4 p-4 border border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-amber-50 hover:border-amber-200 transition-all cursor-pointer group">
                      <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center text-gray-400 group-hover:text-amber-500 transition-colors">
                        <Camera size={20} />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-700">Add a photo</p>
                        <p className="text-[10px] text-gray-400">Helps us process your request faster</p>
                      </div>
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  disabled={submittingReturn}
                  onClick={() => setReturnModal({ open: false, order: null })}
                  className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all text-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={submittingReturn || !returnForm.selectedReason || !returnForm.image}
                  className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale text-sm"
                >
                  {submittingReturn ? (
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload size={16} />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
