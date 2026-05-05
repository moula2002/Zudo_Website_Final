import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Package } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { API_URL, API_BASE_URL } from '../config';

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
        const response = await fetch(`${API_URL}/auth/profile`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
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

    const uploadBase = API_BASE_URL;

    try {
      const response = await fetch(`${uploadBase}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formDataUpload
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const fullImageUrl = `${uploadBase}${data.url}`;
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
      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
  const [newAddress, setNewAddress] = useState('');
  const { lat: currentLat, lng: currentLng, city: currentCity, pincode: currentPincode } = useLocation();

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

      const response = await fetch(`${API_URL}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
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
    if (newAddress.trim()) {
      const updated = [...addresses, { 
        _id: Date.now().toString(), 
        address: newAddress.trim(), 
        isDefault: addresses.length === 0,
        lat: currentLat,
        lng: currentLng,
        city: currentCity,
        pincode: currentPincode
      }];
      setAddresses(updated);
      setNewAddress('');
      syncAddressesWithServer(updated);
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
    <div className="max-w-4xl mx-auto px-6 py-12">
      <div className="flex items-center justify-between mb-10">
        <button 
          onClick={() => onNavigate('home')}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 font-bold transition-colors group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </button>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'profile' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Profile Info
          </button>
          <button 
            onClick={() => setActiveTab('addresses')}
            className={`px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'addresses' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
          >
            Addresses
          </button>
          <button 
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
          >
            <Package size={18} />
            My Orders
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
        {activeTab === 'profile' ? (
          <>
            <div className="h-32 bg-gradient-to-r from-emerald-500 to-teal-600"></div>
            <div className="px-8 pb-10">
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

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
        <div className="p-10 animate-[fadeIn_0.3s_ease-out]">
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
            <div className="relative">
              <textarea 
                value={newAddress}
                onChange={(e) => setNewAddress(e.target.value)}
                rows="3"
                placeholder="Paste or type a new address here..." 
                className="w-full px-6 py-4 rounded-2xl border border-gray-100 bg-gray-50 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold text-gray-800 resize-none"
              />
              <button 
                onClick={handleAddAddress}
                className="absolute bottom-4 right-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
              >
                Add Address
              </button>
            </div>

            <div className="grid grid-cols-1 gap-4 mt-10">
              {addresses.length > 0 ? (
                addresses.map((addr, index) => (
                  <div key={addr._id || addr.id || index} className={`p-6 rounded-3xl border transition-all ${addr.isDefault ? 'bg-emerald-50 border-emerald-100 shadow-sm' : 'bg-white border-gray-100 hover:border-emerald-100'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex gap-4">
                        <div className={`mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${addr.isDefault ? 'border-emerald-600 bg-emerald-600' : 'border-gray-200'}`}>
                          {addr.isDefault && <div className="h-2 w-2 bg-white rounded-full" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">{addr.address || addr.text}</p>
                          {addr.lat && addr.lng && (
                            <p className="text-[10px] text-emerald-600 font-bold mt-1">GPS: {addr.lat.toFixed(4)}, {addr.lng.toFixed(4)}</p>
                          )}
                          {addr.isDefault && <span className="inline-block mt-3 px-3 py-1 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full">Primary Address</span>}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
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
