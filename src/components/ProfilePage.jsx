import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Package, X, AlertTriangle } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { API_URL, IMAGE_BASE_URL } from '../config';

export default function ProfilePage({ user, onUpdateUser, onNavigate, initialTab = 'addresses' }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profileImage: user?.profileImage || user?.profilePicture || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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
            profileImage: data.profilePicture || data.profileImage
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

      const fullImageUrl = `${IMAGE_BASE_URL}${data.url}`;
      setFormData(prev => ({ ...prev, profileImage: fullImageUrl }));
      setMessage({ type: 'success', text: 'Image uploaded to cloud! Remember to save changes.' });
    } catch (err) {
      setMessage({ type: 'error', text: `Upload failed: ${err.message}` });
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
          ...formData,
          profilePicture: formData.profileImage
        })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      const mappedData = {
        ...data,
        profileImage: data.profilePicture || data.profileImage
      };
      onUpdateUser(mappedData);
      localStorage.setItem('user', JSON.stringify(mappedData));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const [activeTab, setActiveTab] = useState(initialTab); // Use initialTab from props
  const [addresses, setAddresses] = useState(user?.savedAddresses || user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const { lat: currentLat, lng: currentLng, city: currentCity, pincode: currentPincode } = useLocation();

  const [addressForm, setAddressForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    city: currentCity || '',
    pincode: currentPincode || '',
    state: '',
    lat: currentLat || 0,
    lng: currentLng || 0,
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
            <div className="h-24 sm:h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <div className="px-4 sm:px-8 pb-6 sm:pb-10">
              <div className="relative -mt-16 mb-8 flex flex-col items-center">
                <div className="relative group">
                  <div className="w-32 h-32 rounded-3xl bg-white p-1.5 shadow-xl">
                    <div className="w-full h-full rounded-2xl bg-gray-100 overflow-hidden border border-gray-100">
                      {formData.profileImage ? (
                        <img src={formData.profileImage} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-300">
                          <User size={64} />
                        </div>
                      )}
                    </div>
                  </div>
                  <label className="absolute bottom-2 right-2 w-10 h-10 bg-emerald-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-emerald-700 transition-colors border-4 border-white">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                  </label>
                </div>
                <h2 className="text-2xl font-black text-gray-900 mt-4">{formData.name || 'Your Name'}</h2>
                <p className="text-gray-500 font-bold text-sm">{formData.email}</p>
              </div>

              {message.text && (
                <div className={`mb-8 p-4 rounded-2xl font-bold text-sm flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                  <div className={`w-2 h-2 rounded-full ${message.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                  {message.text}
                </div>
              )}

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Full Name</label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your name" 
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-800"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
              <div className="relative opacity-60">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="email" 
                  value={formData.email}
                  disabled
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-200 cursor-not-allowed font-bold text-gray-600"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
              <div className="relative">
                <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number" 
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-800"
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-2">
              <label className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Default Delivery Address</label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-5 text-gray-400" />
                <textarea 
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Street, locality, landmark, city, state, pincode" 
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-800 resize-none"
                />
              </div>
            </div>

            <div className="md:col-span-2 pt-4">
              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transform hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={20} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
            </form>
          </div>
        </>
      ) : (
        <div className="p-5 sm:p-10 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900">Manage Addresses</h3>
              <p className="text-sm text-gray-500 font-bold">Add and manage your delivery locations</p>
            </div>
            <div className="h-12 w-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
              <MapPin size={24} />
            </div>
          </div>

          <div className="space-y-6">
            {!showAddressForm ? (
              <button 
                onClick={() => setShowAddressForm(true)}
                className="w-full py-4 border-2 border-dashed border-emerald-200 rounded-3xl text-emerald-600 font-black flex items-center justify-center gap-3 hover:bg-emerald-50 hover:border-emerald-300 transition-all group"
              >
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Package size={18} />
                </div>
                Add New Address
              </button>
            ) : (
              <div className="bg-gray-50 p-6 sm:p-8 rounded-[2.5rem] border border-gray-100 space-y-6 animate-[slideDown_0.3s_ease-out]">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest">New Delivery Address</h4>
                  <button onClick={() => setShowAddressForm(false)} className="text-gray-400 hover:text-red-500 transition-colors">
                    <X size={20} />
                  </button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Receiver Name</label>
                    <input 
                      type="text"
                      value={addressForm.name}
                      onChange={(e) => setAddressForm({ ...addressForm, name: e.target.value })}
                      placeholder="e.g. John Doe"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                    <input 
                      type="tel"
                      value={addressForm.phone}
                      onChange={(e) => setAddressForm({ ...addressForm, phone: e.target.value })}
                      placeholder="10-digit mobile number"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Complete Address</label>
                    <textarea 
                      value={addressForm.address}
                      onChange={(e) => setAddressForm({ ...addressForm, address: e.target.value })}
                      rows="3"
                      placeholder="House No, Building, Street, Area..."
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-sm resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">City</label>
                    <input 
                      type="text"
                      value={addressForm.city}
                      onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                      placeholder="e.g. Bangalore"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pincode</label>
                    <div className="relative group">
                      <input 
                        type="text"
                        value={addressForm.pincode}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          setAddressForm({ ...addressForm, pincode: val });
                          checkPincode(val);
                        }}
                        placeholder="6-digit code"
                        className={`w-full px-5 py-3.5 rounded-2xl border-2 transition-all font-black text-sm outline-none ${
                          pincodeError 
                            ? 'border-red-100 bg-red-50 text-red-900 placeholder:text-red-300 focus:border-red-500 focus:ring-4 focus:ring-red-500/10' 
                            : 'border-gray-100 bg-white text-gray-900 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10'
                        }`}
                      />
                      {pincodeError && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-red-500 animate-bounce">
                          <AlertTriangle size={16} />
                        </div>
                      )}
                    </div>
                    {pincodeError && (
                      <div className="mt-2 px-4 py-2 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 animate-[shake_0.4s_ease-in-out]">
                        <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-wider leading-none">{pincodeError}</p>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">State</label>
                    <input 
                      type="text"
                      value={addressForm.state}
                      onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                      placeholder="e.g. Karnataka"
                      className="w-full px-5 py-3 rounded-2xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-sm"
                    />
                  </div>
                  <div className="flex items-end pb-1">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative">
                        <input 
                          type="checkbox"
                          checked={addressForm.isDefault}
                          onChange={(e) => setAddressForm({ ...addressForm, isDefault: e.target.checked })}
                          className="sr-only"
                        />
                        <div className={`w-10 h-6 rounded-full transition-colors ${addressForm.isDefault ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${addressForm.isDefault ? 'translate-x-4' : 'translate-x-0'}`}></div>
                      </div>
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Set as Default</span>
                    </label>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={() => setShowAddressForm(false)}
                    className="flex-1 py-4 border border-gray-200 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleAddAddress}
                    disabled={!!pincodeError}
                    className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/20 disabled:opacity-50 disabled:grayscale"
                  >
                    Save Address
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4 mt-10">
              {addresses.length > 0 ? (
                addresses.map((addr, index) => (
                  <div key={addr._id || addr.id || index} className={`p-4 sm:p-6 rounded-3xl border transition-all ${addr.isDefault ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-100'}`}>
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                      <div className="flex gap-3 sm:gap-4">
                        <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'border-emerald-600 bg-emerald-600' : 'border-gray-200'}`}>
                          {addr.isDefault && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <p className="text-sm font-black text-gray-900">{addr.name}</p>
                            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">{addr.phone}</span>
                          </div>
                          <p className="text-sm font-bold text-gray-500 leading-relaxed">{addr.address}</p>
                          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          {addr.isDefault && <span className="inline-block mt-3 px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Primary Address</span>}
                        </div>
                      </div>
                      <div className="flex flex-row sm:flex-col gap-4 sm:gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-50">
                        {!addr.isDefault && (
                          <button onClick={() => handleSetDefault(addr._id || addr.id)} className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline">Set Primary</button>
                        )}
                        <button onClick={() => handleRemoveAddress(addr._id || addr.id)} className="text-[10px] font-black text-red-500 uppercase tracking-widest hover:underline">Remove</button>
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
