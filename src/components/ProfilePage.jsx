import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Package, X, AlertTriangle, Search } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { API_URL, IMAGE_BASE_URL, cleanImageUrl } from '../config';

export default function ProfilePage({ user, onUpdateUser, onNavigate, initialTab = 'addresses' }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profileImage: user?.profileImage || user?.profilePicture || '',
    storePic: user?.storePic || ''
  });
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name || '',
        email: user.email || prev.email || '',
        phone: user.phone || prev.phone || '',
        address: user.address || prev.address || '',
        profileImage: user.profilePicture || user.profileImage || prev.profileImage || '',
        storePic: user.storePic || prev.storePic || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    // Fetch latest profile data from backend
    const fetchProfile = async () => {
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        const data = await response.json();
        if (response.ok) {
          const mappedData = {
            ...data,
            profileImage: data.profilePicture || data.profileImage,
            storePic: data.storePic || ''
          };
          setFormData(mappedData);
          onUpdateUser(mappedData);
        }
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      }
    };
    fetchProfile();
  }, []);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${IMAGE_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: formDataUpload
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const fullImageUrl = cleanImageUrl(`${IMAGE_BASE_URL}${data.url}`);
      setFormData(prev => ({ ...prev, profileImage: fullImageUrl }));
      setMessage({ type: 'success', text: 'Image uploaded to cloud! Remember to save changes.' });
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleBannerChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${IMAGE_BASE_URL}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: formDataUpload
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const fullImageUrl = cleanImageUrl(`${IMAGE_BASE_URL}${data.url}`);
      setFormData(prev => ({ ...prev, storePic: fullImageUrl }));
      setMessage({ type: 'success', text: 'Banner uploaded! Save changes to finalize.' });
    } catch (err) {
      setMessage({ type: 'error', text: `Banner upload failed: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          profilePicture: formData.profileImage,
          storePic: formData.storePic
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const mappedData = {
        ...data,
        profileImage: data.profilePicture || data.profileImage,
        storePic: data.storePic || ''
      };
      onUpdateUser(mappedData);
      localStorage.setItem('user', JSON.stringify(mappedData));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState(initialTab); // Use initialTab from props
  const [addresses, setAddresses] = useState(user?.savedAddresses || user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [salesPerson, setSalesPerson] = useState(null);
  const { lat: currentLat, lng: currentLng, city: currentCity, pincode: currentPincode, refresh: refreshLocation, loading: locationLoading } = useLocation();

  useEffect(() => {
    const fetchSalesPerson = async () => {
      const pincode = localStorage.getItem('enteredPincode');
      
      console.log('[DEBUG Sales] User role:', user?.role);
      console.log('[DEBUG Sales] Entered pincode from website entry:', pincode);
      
      if (!pincode || pincode.length !== 6) {
        console.log('[DEBUG Sales] Invalid pincode length or not found:', pincode);
        setSalesPerson(null);
        return;
      }

      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        console.log('[DEBUG Sales] Fetching from API path:', `${API_URL}/sales/pincode/${pincode}`);
        const res = await fetch(`${API_URL}/sales/pincode/${pincode}`, {
          headers: {
            'x-location': locationHeader,
            'x-tenant-id': locationHeader,
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await res.json();
        console.log('[DEBUG Sales] API Response:', data);
        if (res.ok && data.success) {
          setSalesPerson(data.salesperson);
        } else {
          setSalesPerson(null);
        }
      } catch (err) {
        console.error('[DEBUG Sales] Error fetching salesperson:', err);
        setSalesPerson(null);
      }
    };

    const isB2BUser = user?.role === 'b2b' || user?.role === 'business' || user?.role === 'seller';
    console.log('[DEBUG Sales] isB2BUser check:', isB2BUser, 'User:', user);
    if (isB2BUser) {
      fetchSalesPerson();
    } else {
      setSalesPerson(null);
    }
  }, [user]);

  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: currentCity || '',
    pincode: currentPincode || '',
    state: '',
    lat: currentLat || 0,
    lng: currentLng || 0,
    storeName: '',
    isDefault: false
  });
  const [pincodeError, setPincodeError] = useState('');

  const checkPincode = async (code) => {
    if (code.length === 6) {
      try {
        const selectedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || selectedCity || '';

        const res = await fetch(`${API_URL}/tenancy/find/${code}`, {
          headers: {
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        const data = await res.json();
        
        if (!res.ok) {
          setPincodeError('Delivery not available for this location');
        } else {
          if (data.dbName !== savedTenantId) {
            setPincodeError(`This pincode belongs to ${data.city}. Select ${data.city} to shop there.`);
          } else {
            setPincodeError('');
          }
        }
      } catch (err) {
        console.error('Pincode check failed');
      }
    } else {
      setPincodeError('');
    }
  };

  useEffect(() => {
    if (currentLat && currentLng) {
      setAddressForm(prev => ({ 
        ...prev, 
        lat: currentLat, 
        lng: currentLng,
        city: currentCity || prev.city,
        pincode: currentPincode || prev.pincode
      }));
      if (currentPincode) checkPincode(currentPincode);
    }
  }, [currentLat, currentLng, currentCity, currentPincode]);

  const syncAddressesWithServer = async (updatedAddresses) => {
    try {
      // Strip temporary IDs that don't match MongoDB ObjectId format
      const cleanedAddresses = updatedAddresses.map(addr => {
        const { _id, id, ...rest } = addr;
        // If _id looks like a MongoDB ObjectId (24 hex chars), keep it. Otherwise, drop it.
        if (_id && /^[0-9a-fA-F]{24}$/.test(_id)) {
          return { _id, ...rest };
        }
        return rest;
      });

      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify({ savedAddresses: cleanedAddresses })
      });
      if (!response.ok) throw new Error('Failed to sync addresses');
      const data = await response.json();
      
      // Update local states with the real IDs from the server
      const serverAddresses = data.savedAddresses || [];
      setAddresses(serverAddresses);
      
      const updatedUser = { ...user, savedAddresses: serverAddresses };
      onUpdateUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
    } catch (err) {
      console.error('Address sync error:', err);
    }
  };

  const handleAddAddress = () => {
    if (addressForm.address.trim() && addressForm.name.trim()) {
      const updated = [...addresses, { 
        ...addressForm,
        _id: Date.now().toString(), 
        isDefault: addresses.length === 0 || addressForm.isDefault
      }];
      
      // If we set this as default, un-default others
      const finalUpdated = addressForm.isDefault || addresses.length === 0 
        ? updated.map(a => ({ ...a, isDefault: a._id === updated[updated.length-1]._id }))
        : updated;

      setAddresses(finalUpdated);
      setAddressForm({
        name: user?.name || '',
        phone: user?.phone || '',
        storeName: '',
        address: '',
        city: currentCity || '',
        pincode: currentPincode || '',
        state: '',
        lat: currentLat || 0,
        lng: currentLng || 0,
        isDefault: false
      });
      setShowAddressForm(false);
      syncAddressesWithServer(finalUpdated);
    }
  };

  const handleRemoveAddress = (targetId) => {
    const updated = addresses.filter(a => (a._id || a.id) !== targetId);
    setAddresses(updated);
    syncAddressesWithServer(updated);
  };

  const handleSetDefault = (targetId) => {
    const updated = addresses.map(a => ({ ...a, isDefault: (a._id || a.id) === targetId }));
    setAddresses(updated);
    syncAddressesWithServer(updated);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-12 mb-20 sm:mb-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-8 sm:mb-10">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors group px-2"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto scrollbar-hide w-full sm:w-auto px-2 pb-1">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('addresses')}
            className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === 'addresses' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Addresses
          </button>
          <button 
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors whitespace-nowrap text-sm sm:text-base"
          >
            <Package size={18} />
            My Orders
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {activeTab === 'profile' ? (
          <>
            <div className="relative group h-32 sm:h-40 overflow-hidden">
              {formData.storePic ? (
                <img src={cleanImageUrl(formData.storePic)} alt="Store Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700"></div>
              )}
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]"></div>
              
              <div className="absolute top-3 right-3 z-10 flex gap-2">
                {isEditing && (
                  <label className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white rounded-lg font-black text-[10px] shadow-lg cursor-pointer hover:bg-emerald-700 transition-all active:scale-95 border border-white/20">
                    <Camera size={12} />
                    Change Banner
                    <input type="file" className="hidden" accept="image/*" onChange={handleBannerChange} />
                  </label>
                )}
                {!isEditing && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-white text-gray-900 rounded-xl font-black text-xs shadow-lg hover:bg-emerald-50 transition-all active:scale-95"
                  >
                    <Save size={14} className="text-emerald-600" />
                    Edit
                  </button>
                )}
              </div>
            </div>

            <div className="px-4 sm:px-6 pb-6">
              <div className="relative -mt-12 sm:-mt-14 mb-6 flex flex-col items-center">
                <div className="relative group">
                  <div className="w-28 h-28 rounded-[2rem] bg-white p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-[1.7rem] bg-gray-100 overflow-hidden border-2 border-white">
                      {formData.profileImage ? (
                        <img src={cleanImageUrl(formData.profileImage)} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User size={48} />
                        </div>
                      )}
                    </div>
                  </div>
                  {isEditing && (
                    <label className="absolute bottom-1 right-1 w-8 h-8 bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-700 transition-colors border-2 border-white">
                      <Camera size={14} />
                      <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                    </label>
                  )}
                </div>
                
                <div className="text-center mt-3">
                  <h2 className="text-xl font-black text-gray-900 tracking-tight">{formData.name || 'Your Name'}</h2>
                  <div className="flex items-center justify-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-emerald-100">
                      {user?.role === 'b2b' ? 'Partner' : 'Customer'}
                    </span>
                    <p className="text-gray-400 font-bold text-xs">{formData.email}</p>
                  </div>
                </div>
              </div>
              {message.text && (
                <div className={`mb-6 p-4 rounded-2xl font-black text-[11px] flex items-center gap-3 animate-[scaleIn_0.3s_ease-out] ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${message.type === 'success' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
                  {message.text}
                </div>
              )}

              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[fadeIn_0.4s_ease-out]">
                  <div className="bg-gray-50/50 p-5 rounded-[2rem] border border-gray-100 space-y-4">
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <User size={12} className="text-emerald-500" />
                      Details
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Full Name</p>
                        <p className="text-sm font-black text-gray-900">{formData.name || 'Not provided'}</p>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Phone</p>
                        <p className="text-sm font-black text-gray-900">{formData.phone || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-emerald-50/30 p-5 rounded-[2rem] border border-emerald-100 space-y-4">
                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2">
                      <MapPin size={12} />
                      Primary Address
                    </h3>
                    {addresses.find(a => a.isDefault) ? (
                      <div className="space-y-2">
                        <p className="text-xs font-bold text-gray-600 leading-tight line-clamp-2">
                          {addresses.find(a => a.isDefault).address}
                        </p>
                        <p className="text-[10px] font-black text-gray-900 uppercase">
                          {addresses.find(a => a.isDefault).city} - {addresses.find(a => a.isDefault).pincode}
                        </p>
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-gray-400 italic">None set</p>
                    )}
                    <button 
                      onClick={() => setActiveTab('addresses')}
                      className="w-full py-2 bg-white text-emerald-700 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all shadow-sm border border-emerald-100"
                    >
                      Manage
                    </button>
                  </div>
                  {salesPerson && (
                    <div className="md:col-span-2 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-6 rounded-[2rem] border border-emerald-100/50 space-y-4 animate-[slideDown_0.3s_ease-out]">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                            <User size={20} />
                          </div>
                          <div>
                            <h3 className="text-sm font-black text-gray-900 tracking-tight">Assigned Sales Partner</h3>
                            <p className="text-[10px] text-emerald-600 font-black uppercase tracking-wider">Helping Purpose & Support</p>
                          </div>
                        </div>
                        <span className="text-[9px] font-black text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider border border-emerald-200 animate-pulse">
                          Active Rep
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <User size={14} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Representative Name</p>
                            <p className="text-xs font-black text-gray-800">{salesPerson.name}</p>
                          </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Phone size={14} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Contact Phone</p>
                            <a href={`tel:${salesPerson.phone}`} className="text-xs font-black text-emerald-600 hover:underline">{salesPerson.phone}</a>
                          </div>
                        </div>

                        <div className="bg-white/80 backdrop-blur-md p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-3 sm:col-span-2">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                            <Mail size={14} />
                          </div>
                          <div>
                            <p className="text-[8px] font-black text-gray-400 uppercase">Email Address</p>
                            <a href={`mailto:${salesPerson.email}`} className="text-xs font-black text-emerald-600 hover:underline">{salesPerson.email}</a>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-[scaleIn_0.3s_ease-out]">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Full Name</label>
                    <div className="relative">
                      <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="text" 
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-xs text-gray-800"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input 
                        type="tel" 
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="10-digit mobile number" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-xs text-gray-800"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Profile Image URL</label>
                    <input 
                      type="text" 
                      name="profileImage"
                      value={formData.profileImage}
                      onChange={handleChange}
                      placeholder="Paste profile image URL (e.g. /uploads/...)" 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-xs text-gray-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Store Banner URL</label>
                    <input 
                      type="text" 
                      name="storePic"
                      value={formData.storePic}
                      onChange={handleChange}
                      placeholder="Paste store banner URL (e.g. /uploads/...)" 
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 outline-none transition-all font-black text-xs text-gray-800"
                    />
                  </div>

                  <div className="flex gap-3 md:col-span-2 pt-4">
                    <button 
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-100 text-gray-500 font-black py-3 rounded-xl hover:bg-gray-200 transition-all uppercase text-[9px] tracking-widest"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={loading}
                      className="flex-[2] bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg shadow-emerald-600/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <Save size={16} />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
          </div>
        </>
      ) : (
        <div className="p-4 sm:p-6 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-gray-900">Manage Addresses</h3>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-tight">Add and manage delivery locations</p>
            </div>
            <div className="h-10 w-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
              <MapPin size={20} />
            </div>
          </div>

          <div className="space-y-4">
            {!showAddressForm ? (
              <button 
                onClick={() => setShowAddressForm(true)}
                className="w-full py-3 border-2 border-dashed border-emerald-200 rounded-2xl text-emerald-600 font-black text-[11px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-emerald-50 transition-all group"
              >
                <div className="w-6 h-6 bg-emerald-100 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package size={14} />
                </div>
                Add New Address
              </button>
            ) : (
              <div className="bg-gray-50 p-4 sm:p-6 rounded-[2rem] border border-gray-100 space-y-4 animate-[slideDown_0.3s_ease-out]">
                <div className="flex items-center justify-between mb-1">
                  <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">New Delivery Address</h4>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button"
                      onClick={async () => {
                        try {
                          const loc = await refreshLocation();
                          if (loc) {
                            setAddressForm(prev => ({
                              ...prev,
                              address: loc.address || prev.address,
                              city: loc.city || prev.city,
                              pincode: loc.pincode || prev.pincode,
                              lat: loc.lat || prev.lat,
                              lng: loc.lng || prev.lng
                            }));
                            if (loc.pincode) checkPincode(loc.pincode);
                          }
                        } catch (err) {
                          console.error('Auto location failed:', err);
                        }
                      }}
                      className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 text-emerald-700 rounded-md text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all border border-emerald-100"
                    >
                      {locationLoading ? (
                        <div className="w-2 h-2 border-2 border-emerald-700/30 border-t-emerald-700 rounded-full animate-spin" />
                      ) : <Search size={10} />}
                      Auto
                    </button>
                    <button onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Receiver Name</label>
                    <input 
                      type="text"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Phone</label>
                    <input 
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="10-digit mobile"
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs"
                    />
                  </div>
                  {(user?.role === 'b2b' || localStorage.getItem('isB2B') === 'true') && (
                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Store Name</label>
                      <input 
                        type="text"
                        value={addressForm.storeName}
                        onChange={(e) => setAddressForm({ ...addressForm, storeName: e.target.value })}
                        placeholder="Full Shop/Store Name"
                        className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs"
                      />
                    </div>
                  )}
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Complete Address</label>
                    <textarea 
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      rows="2"
                      placeholder="House No, Street, Area..."
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs resize-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">City</label>
                    <input 
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="e.g. Bangalore"
                      className="w-full px-4 py-2 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Pincode</label>
                    <div className="relative group">
                      <input 
                        type="text"
                        value={addressForm.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '').slice(0,6);
                          setAddressForm({ ...addressForm, pincode: val });
                          checkPincode(val);
                        }}
                        placeholder="6-digit"
                        className={`w-full px-4 py-2 rounded-xl border-2 transition-all font-black text-xs outline-none ${
                          pincodeError 
                            ? 'border-red-100 bg-red-50 text-red-900 focus:border-red-500' 
                            : 'border-gray-100 bg-white text-gray-900 focus:border-emerald-500'
                        }`}
                      />
                      {pincodeError && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                          <AlertTriangle size={12} />
                        </div>
                      )}
                    </div>
                    {pincodeError && (
                      <p className="mt-1 text-[8px] font-black text-red-500 uppercase tracking-widest ml-1">{pincodeError}</p>
                    )}
                  </div>

                  <div className="flex items-center pb-2 h-full">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-8 h-4.5 rounded-full transition-colors ${addressForm.isDefault ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                        <div className={`absolute top-0.5 left-0.5 w-3.5 h-3.5 bg-white rounded-full transition-transform ${addressForm.isDefault ? 'translate-x-3.5' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Default</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button 
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 py-2.5 border border-gray-100 text-gray-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddAddress}
                    disabled={!!pincodeError}
                    className="flex-[2] py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 disabled:opacity-50"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mt-10">
              {addresses.length > 0 ? (
                [...addresses].sort((a, b) => (b.isDefault ? 1 : 0) - (a.isDefault ? 1 : 0)).map((addr, index) => (
                  <div key={addr._id || addr.id || index} className={`p-3 sm:p-4 rounded-2xl border transition-all ${addr.isDefault ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-100'}`}>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex gap-2.5">
                        <div className={`mt-0.5 h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'border-emerald-600 bg-emerald-600' : 'border-gray-200'}`}>
                          {addr.isDefault && <div className="h-1.5 w-1.5 bg-white rounded-full" />}
                        </div>
                        <div>
                          <div className="flex flex-col mb-1.5">
                            <p className="text-xs font-black text-gray-900">{addr.name}</p>
                            {addr.storeName && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Package size={10} className="text-emerald-600" />
                                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-tight">{addr.storeName}</p>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">{addr.phone}</span>
                            </div>
                          </div>
                          <p className="text-[11px] font-bold text-gray-500 leading-tight line-clamp-2 mb-1">{addr.address}</p>
                          <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">
                            {addr.city} - {addr.pincode}
                          </p>
                          {addr.isDefault && <span className="inline-block mt-2 px-2 py-0.5 bg-emerald-600 text-white text-[8px] font-black uppercase tracking-widest rounded-full">Primary</span>}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-3 sm:gap-1 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr._id || addr.id)} className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Set Primary</button>
                        )}
                        <button onClick={() => handleRemoveAddress(addr._id || addr.id)} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <div className="h-16 w-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4">
                    <MapPin size={32} className="text-gray-200" />
                  </div>
                  <p className="text-gray-400 font-bold italic">No addresses saved yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
