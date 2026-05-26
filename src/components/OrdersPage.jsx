import React, { useState, useEffect } from 'react';
import { Package, Calendar, Clock, ChevronRight, ShoppingBag, ArrowLeft, CheckCircle2, Truck, AlertCircle, MapPin, Receipt, ExternalLink, ChevronDown, ChevronUp, User, Phone, Camera, Upload, X, Search, Filter, Navigation as NavIcon } from 'lucide-react';
import { API_URL, API_BASE_URL, IMAGE_BASE_URL, cleanImageUrl } from '../config';
import { generateInvoice } from '../utils/invoiceGenerator';

export default function OrdersPage({ onNavigate, user }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);



    const apiBase = API_BASE_URL;

  const [returnModal, setReturnModal] = useState({ open: false, order: null });
  const [returnForm, setReturnForm] = useState({ selectedReason: '', comment: '', image: null, preview: null });
  const [submittingReturn, setSubmittingReturn] = useState(false);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('All');
  const [trackingModal, setTrackingModal] = useState({ open: false, order: null });
  const [activeTrackingOrder, setActiveTrackingOrder] = useState(null);

  const getDistance = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in km
  };

  const getUpdatedTimeStr = (updatedAt) => {
    if (!updatedAt) return '';
    const diffMs = new Date() - new Date(updatedAt);
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'just now';
    if (diffMins === 1) return '1 min ago';
    if (diffMins < 60) return `${diffMins} mins ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  useEffect(() => {
    if (!trackingModal.open || !trackingModal.order?._id) {
      setActiveTrackingOrder(null);
      return;
    }

    setActiveTrackingOrder(trackingModal.order);

    const fetchLatestTracking = async () => {
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const response = await fetch(`${apiBase}/api/orders/${trackingModal.order._id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        const data = await response.json();
        if (response.ok) {
          setActiveTrackingOrder(data);
        }
      } catch (err) {
        console.error('Failed to fetch tracking details:', err);
      }
    };

    fetchLatestTracking();
    const interval = setInterval(fetchLatestTracking, 5000);
    return () => clearInterval(interval);
  }, [trackingModal.open, trackingModal.order?._id]);

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
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const response = await fetch(`${apiBase}/api/orders/myorders`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
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

      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${API_URL}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
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
        const uploadRes = await fetch(`${IMAGE_BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) imageUrl = cleanImageUrl(`${IMAGE_BASE_URL}${uploadData.url}`);
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
    const s = status?.toLowerCase();
    switch (s) {
      case 'delivered': return 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20';
      case 'returned': return 'bg-purple-500 text-white shadow-lg shadow-purple-500/20';
      case 'shipped': return 'bg-blue-500 text-white shadow-lg shadow-blue-500/20';
      case 'out for delivery': return 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20';
      case 'processing': return 'bg-amber-500 text-white shadow-lg shadow-amber-500/20';
      case 'pending': return 'bg-gray-500 text-white shadow-lg shadow-gray-500/20';
      case 'cancelled': return 'bg-red-500 text-white shadow-lg shadow-red-500/20';
      default: return 'bg-gray-400 text-white shadow-lg shadow-gray-400/20';
    }
  };

  const getStatusIcon = (status) => {
    const s = status?.toLowerCase();
    switch (s) {
      case 'delivered': return <CheckCircle2 size={14} />;
      case 'returned': return <ArrowLeft size={14} />;
      case 'shipped': return <Truck size={14} />;
      case 'out for delivery': return <Truck size={14} className="animate-pulse" />;
      case 'processing': return <Clock size={14} />;
      case 'cancelled': return <X size={14} />;
      default: return <Package size={14} />;
    }
  };

  const formatImageUrl = (url) => {
    return cleanImageUrl(url) || 'https://via.placeholder.com/150';
  };

  const filteredOrders = orders.filter(order => {
    // 1. Status Filter
    if (filterStatus !== 'All' && order.orderStatus !== filterStatus) return false;

    // 2. Search Filter (ID or Product Name)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const matchesId = order._id.toLowerCase().includes(searchLower);
      const matchesProduct = order.items.some(item => 
        (item.name || item.product?.name || '').toLowerCase().includes(searchLower)
      );
      if (!matchesId && !matchesProduct) return false;
    }

    // 3. Date Filter
    if (dateFilter !== 'All') {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      if (dateFilter === 'Last 7 Days') {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        if (orderDate < sevenDaysAgo) return false;
      } else if (dateFilter === 'Last 30 Days') {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        if (orderDate < thirtyDaysAgo) return false;
      }
    }

    return true;
  });

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
        {/* Filter Bar */}
        <div className="bg-white rounded-3xl p-4 shadow-xl shadow-emerald-900/5 border border-gray-100 mb-8 flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search Order ID or Product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:bg-white focus:border-emerald-500 transition-all outline-none text-sm font-bold"
            />
          </div>
          
          <div className="flex gap-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
            <div className="relative min-w-[140px]">
              <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
              <select 
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-700 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Processing">Processing</option>
                <option value="Shipped">Shipped</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="relative min-w-[140px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={14} />
              <select 
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-emerald-50 border border-emerald-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-emerald-700 outline-none appearance-none cursor-pointer"
              >
                <option value="All">All Time</option>
                <option value="Last 7 Days">Last 7 Days</option>
                <option value="Last 30 Days">Last 30 Days</option>
              </select>
            </div>
          </div>
        </div>

        {filteredOrders.length === 0 ? (
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
            {filteredOrders.map((order, orderIdx) => (
              <div 
                key={order._id} 
                className="bg-white rounded-[2.5rem] overflow-hidden shadow-2xl shadow-emerald-900/5 border border-gray-100 hover:border-emerald-500/20 transition-all duration-500 group relative"
                style={{ animationDelay: `${orderIdx * 0.1}s` }}
              >
                {/* Visual Accent */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusStyle(order.orderStatus).split(' ')[0]}`}></div>
                
                <div className="p-5 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Product & Basic Info */}
                    <div className="flex items-start gap-5">
                      <div className="relative group/img flex-shrink-0">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 flex items-center justify-center">
                          {order.items && order.items.length > 0 ? (
                            <img 
                              src={formatImageUrl(order.items[0].image || order.items[0].product?.image)} 
                              alt={order.items[0].name} 
                              className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110"
                            />
                          ) : (
                            <Package className="text-emerald-600" size={32} />
                          )}
                        </div>
                        {order.items.length > 1 && (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white rounded-full border border-gray-100 shadow-lg flex items-center justify-center text-[10px] font-black text-gray-900">
                            +{order.items.length - 1}
                          </div>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100 uppercase tracking-widest">
                            ID: #{order._id.slice(-6).toUpperCase()}
                          </span>
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase transition-all shadow-sm ${getStatusStyle(order.orderStatus)}`}>
                            {getStatusIcon(order.orderStatus)}
                            {order.orderStatus}
                          </div>
                          {order.deliveryOtp && order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                            <div className="flex items-center gap-2 bg-gray-900 text-white px-2.5 py-1 rounded-md text-[9px] font-black tracking-widest uppercase shadow-lg shadow-gray-900/10">
                              <Truck size={10} className="text-emerald-400" />
                              OTP: <span className="font-mono text-xs text-emerald-400 tracking-wider ml-0.5">{order.deliveryOtp}</span>
                            </div>
                          )}
                        </div>
                        <h3 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                          {order.items[0]?.name || order.items[0]?.product?.name || 'Order Details'}
                          {order.items.length > 1 && <span className="text-gray-400 font-bold ml-2 text-sm">& {order.items.length - 1} more</span>}
                        </h3>
                        <div className="flex items-center gap-4 text-gray-500 font-bold text-xs uppercase tracking-tight">
                          <span className="flex items-center gap-1.5"><Calendar size={12} className="text-emerald-500" /> {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                          <span className="flex items-center gap-1.5"><ShoppingBag size={12} className="text-emerald-500" /> {order.items.length} Items</span>
                        </div>
                      </div>
                    </div>

                    {/* Middle/Right: Price & Status */}
                    <div className="flex items-center lg:items-end justify-between lg:flex-col gap-2 pt-4 lg:pt-0 border-t lg:border-t-0 border-gray-50">
                      <div className="text-left lg:text-right">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                        <p className="text-2xl font-black text-gray-900 tracking-tighter leading-none">₹{order.totalAmount}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={(e) => { e.stopPropagation(); generateInvoice(order); }}
                          className="p-2.5 bg-gray-50 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 rounded-xl transition-all border border-gray-100"
                          title="Download Invoice"
                        >
                          <Receipt size={16} />
                        </button>
                        {order.orderStatus?.toLowerCase() === 'out for delivery' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setTrackingModal({ open: true, order }); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95 animate-pulse"
                          >
                            <NavIcon size={14} />
                            Track Live
                          </button>
                        )}
                        <button 
                          onClick={() => toggleOrderExpansion(order._id)}
                          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${expandedOrder === order._id ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
                        >
                          {expandedOrder === order._id ? 'Hide Details' : 'View Details'}
                          {expandedOrder === order._id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                      </div>
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
                              <span className="text-gray-500 font-bold">Payment Status</span>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                order.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 
                                order.paymentStatus === 'Failed' ? 'bg-red-100 text-red-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {order.paymentStatus || 'Pending'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-gray-500 font-bold">Order Status</span>
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                                order.orderStatus === 'Delivered' ? 'bg-emerald-100 text-emerald-700' : 
                                order.orderStatus === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                order.orderStatus === 'Shipped' ? 'bg-blue-100 text-blue-700' :
                                order.orderStatus === 'Returned' ? 'bg-purple-100 text-purple-700' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {order.orderStatus}
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

                        {/* Delivery Partner Info */}
                        {(order.driverId || order.cashPersonId) && (
                          <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                              <User size={14} className="text-emerald-500" />
                              Delivery Partner Details
                            </h3>
                            <div className="bg-white p-5 rounded-3xl border border-emerald-100 shadow-sm">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-700 font-black">
                                  {(order.driverId?.name || order.cashPersonId?.name)?.charAt(0) || 'D'}
                                </div>
                                <div>
                                  <p className="font-black text-gray-900 mb-0.5">{order.driverId?.name || order.cashPersonId?.name}</p>
                                  <p className="text-emerald-600 text-sm font-black flex items-center gap-2">
                                    <Phone size={12} />
                                    {order.driverId?.phone || order.cashPersonId?.phone}
                                  </p>
                                  {(order.driverId?.email || order.cashPersonId?.email) && (
                                    <p className="text-gray-400 text-[10px] font-bold mt-1 uppercase tracking-widest">
                                      {order.driverId?.email || order.cashPersonId?.email}
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
                                  <p className="font-black text-gray-900 text-sm leading-none mb-1">{item.product?.name || item.name || 'Unknown Product'}</p>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono">
                                    {item.quantity} × ₹{item.price}
                                    {item.normalPrice !== undefined && (
                                      <span className="text-amber-600 ml-2 font-bold normal-case">
                                        (Normal: ₹{item.normalPrice})
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[10px] font-bold text-emerald-600 mt-1 uppercase tracking-tight">
                                    Sold by: {item.sellerName || item.product?.sellerName || item.productId?.sellerName || item.productId?.sellerId?.businessName || item.productId?.sellerId?.name || 'Zudo Official'}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-sm font-black text-gray-900">₹{item.quantity * item.price}</div>
                                {item.normalPrice !== undefined && (
                                  <div className="text-[10px] font-bold text-amber-600 mt-0.5">
                                    Normal: ₹{item.quantity * item.normalPrice}
                                  </div>
                                )}
                              </div>
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
      {/* Live Tracking Modal */}
      {trackingModal.open && trackingModal.order && (() => {
        const currentTrackingOrder = activeTrackingOrder || trackingModal.order;
        const driverLat = currentTrackingOrder.driverId?.currentLocation?.lat;
        const driverLng = currentTrackingOrder.driverId?.currentLocation?.lng;
        const destLat = currentTrackingOrder.shippingAddress?.lat;
        const destLng = currentTrackingOrder.shippingAddress?.lng;

        let distanceStr = '1.2 KM';
        let timeStr = '8-12 MINS';

        if (driverLat && driverLng && destLat && destLng) {
          const d = getDistance(driverLat, driverLng, destLat, destLng);
          distanceStr = `${d.toFixed(1)} KM`;
          const mins = Math.max(2, Math.round((d / 30) * 60));
          timeStr = mins <= 3 ? '2-3 MINS' : `${mins - 2}-${mins + 2} MINS`;
        }

        const mapUrl = (driverLat && driverLng && destLat && destLng)
          ? `https://maps.google.com/maps?saddr=${driverLat},${driverLng}&daddr=${destLat},${destLng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
          : (destLat && destLng)
            ? `https://maps.google.com/maps?q=${destLat},${destLng}&t=&z=15&ie=UTF8&iwloc=&output=embed`
            : '';

        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-0 md:p-6 animate-[fadeIn_0.2s_ease-out]">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setTrackingModal({ open: false, order: null })}></div>
            
            <div className="bg-white w-full max-w-5xl h-full md:h-[85vh] md:rounded-[3rem] shadow-2xl relative z-10 overflow-hidden flex flex-col md:flex-row animate-[scaleIn_0.3s_ease-out]">
              {/* Left Sidebar - Order & Agent Details */}
              <div className="w-full md:w-[360px] lg:w-[400px] bg-white border-b md:border-b-0 md:border-r border-gray-100 flex flex-col h-[50vh] md:h-full z-20">
                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 flex-shrink-0">
                      <Truck size={20} className="animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-base font-black text-gray-900 tracking-tight">Live Tracking</h2>
                      <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                        Order #{currentTrackingOrder._id.slice(-6).toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setTrackingModal({ open: false, order: null })}
                    className="md:hidden p-2 bg-gray-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-hide">
                  {/* Agent Card */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner flex-shrink-0">
                        {(currentTrackingOrder.driverId?.name || currentTrackingOrder.cashPersonId?.name)?.charAt(0) || 'D'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Partner</p>
                        <p className="font-black text-sm text-gray-900 truncate">{currentTrackingOrder.driverId?.name || currentTrackingOrder.cashPersonId?.name || 'Zudo Partner'}</p>
                        <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate">
                          {currentTrackingOrder.driverId?.vehicleDetails || currentTrackingOrder.driverId?.type || 'Standard Delivery Vehicle'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Distance & Time Metrics */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-indigo-50/50 border border-indigo-100/50 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mb-1">Est. Arrival</p>
                      <p className="text-base font-black text-gray-900 leading-none">{timeStr}</p>
                    </div>
                    <div className="bg-emerald-50/50 border border-emerald-100/50 p-4 rounded-2xl">
                      <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">Distance</p>
                      <p className="text-base font-black text-gray-900 leading-none">{distanceStr}</p>
                    </div>
                  </div>

                  {/* Address Summary */}
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Delivery Destination</p>
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-[11px] leading-relaxed">
                      <p className="font-black text-gray-900 mb-0.5">{currentTrackingOrder.shippingAddress?.name}</p>
                      <p className="text-gray-500 font-bold">{currentTrackingOrder.shippingAddress?.address}</p>
                    </div>
                  </div>

                  {/* Status Indicator */}
                  <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-2.5 rounded-xl border border-indigo-100 flex-wrap">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                    </span>
                    <span className="uppercase tracking-widest">Live location active</span>
                    {currentTrackingOrder.driverId?.currentLocation?.updatedAt && (
                      <span className="text-gray-400 lowercase font-bold ml-auto">
                        updated {getUpdatedTimeStr(currentTrackingOrder.driverId.currentLocation.updatedAt)}
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions Sidebar Footer */}
                <div className="p-4 border-t border-gray-100 bg-slate-50/50 space-y-2">
                  <div className="flex gap-2">
                    <button 
                      onClick={() => window.open(`tel:${currentTrackingOrder.driverId?.phone || currentTrackingOrder.cashPersonId?.phone || '0000000000'}`, '_self')}
                      className="flex-1 py-3 bg-white text-gray-900 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-sm border border-gray-200 flex items-center justify-center gap-2 hover:bg-gray-100 transition-all"
                    >
                      <Phone size={12} className="text-indigo-600" />
                      Call Agent
                    </button>
                    <button 
                      onClick={() => {
                        const dest = (destLat && destLng) ? `${destLat},${destLng}` : '';
                        const orig = (driverLat && driverLng) ? `${driverLat},${driverLng}` : '';
                        const url = orig 
                          ? `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}`
                          : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
                        window.open(url, '_blank');
                      }}
                      className="flex-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center justify-center gap-2"
                    >
                      <MapPin size={12} />
                      Directions
                    </button>
                  </div>
                  <button 
                    onClick={() => setTrackingModal({ open: false, order: null })}
                    className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md hover:bg-indigo-700 transition-all"
                  >
                    Close Tracker
                  </button>
                </div>
              </div>

              {/* Right Side - Fullscreen Map */}
              <div className="flex-1 relative bg-slate-100 h-[50vh] md:h-full">
                {mapUrl ? (
                  <iframe 
                    width="100%" 
                    height="100%" 
                    frameBorder="0" 
                    scrolling="no" 
                    marginHeight="0" 
                    marginWidth="0" 
                    src={mapUrl}
                    className="absolute inset-0 grayscale-[0.2] contrast-[1.1]"
                  ></iframe>
                ) : (
                  <div className="absolute inset-0 bg-[url('https://www.google.com/maps/vt/pb=!1m4!1m3!1i14!2i11721!3i7526!2m3!1e0!2sm!3i615286060!3m8!2sen!3spr!4v170955!5m2!1sen!3spr!8m2!1d18.2208!2d-66.5901!4m1!1i14!10b1!12b1!13b1!16b1!17m1!1e1!20m1!1e1!21m1!1e1!22m1!1e1!30m1!1e1!31m1!1e1!34m1!1e1!39b1!44m1!1e1!50m1!1e1!67m1!1e1!73m1!1e1!114m1!1e1!115m1!1e1!130m1!1e1')] bg-cover opacity-60"></div>
                )}
                
                <div className="absolute inset-0 pointer-events-none bg-indigo-900/5 backdrop-grayscale-[0.1]"></div>

                {/* Destination Pin Overlay (Visual Only) */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <div className="w-12 h-12 bg-emerald-500/20 rounded-full animate-ping"></div>
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-emerald-600 rounded-full border-4 border-white shadow-2xl"></div>
                </div>

                {/* Floating Close Button for Desktop Map */}
                <button 
                  onClick={() => setTrackingModal({ open: false, order: null })}
                  className="hidden md:flex absolute top-6 right-6 p-3 bg-white text-gray-500 hover:text-red-500 rounded-2xl shadow-xl border border-gray-100 hover:scale-105 transition-all z-30"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
