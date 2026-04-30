import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Package } from 'lucide-react';

export default function ProfilePage({ user, onUpdateUser, onNavigate }) {
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    profileImage: user?.profileImage || ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    // Fetch latest profile data from backend
    const fetchProfile = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/auth/profile', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        const data = await response.json();
        if (response.ok) {
          setFormData(data);
          onUpdateUser(data);
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

    const uploadBase = 'https://lightgreen-trout-176417.hostingersite.com';

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
      const response = await fetch('http://localhost:5001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      onUpdateUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
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
        <button 
          onClick={() => onNavigate('orders')}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl font-bold hover:bg-emerald-100 transition-colors"
        >
          <Package size={18} />
          My Orders
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden">
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
      </div>
    </div>
  );
}
