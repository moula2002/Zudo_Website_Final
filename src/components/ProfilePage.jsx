import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Package, X, AlertTriangle, Search, Clock } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';
import { API_URL, IMAGE_BASE_URL, cleanImageUrl, UPLOAD_URL } from '../config';

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

      const response = await fetch(UPLOAD_URL, {
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

      const fullImageUrl = cleanImageUrl(data.url);
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

      const response = await fetch(UPLOAD_URL, {
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

      const fullImageUrl = cleanImageUrl(data.url);
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

  const isBusiness = user?.role === 'b2b' || user?.role === 'business' || user?.role === 'seller' || user?.role === 'admin' || localStorage.getItem('isB2B') === 'true';
  const [activeTab, setActiveTab] = useState(initialTab); // Use initialTab from props
  const [addresses, setAddresses] = useState(user?.savedAddresses || user?.addresses || []);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [salesPerson, setSalesPerson] = useState(null);
  const { lat: currentLat, lng: currentLng, city: currentCity, pincode: currentPincode, refresh: refreshLocation, loading: locationLoading } = useLocation();

  // Commissions management state
  const [commissions, setCommissions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [commissionsLoading, setCommissionsLoading] = useState(false);
  const [commissionsMessage, setCommissionsMessage] = useState({ type: '', text: '' });
  const [commissionForm, setCommissionForm] = useState({
    id: null,
    categoryId: '',
    unit: '',
    commissionType: 'flat',
    commissionValue: ''
  });
  const [showCommissionForm, setShowCommissionForm] = useState(false);

  const fetchCommissionsAndCategories = async () => {
    setCommissionsLoading(true);
    setCommissionsMessage({ type: '', text: '' });
    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const headers = {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'x-location': locationHeader,
        'x-tenant-id': locationHeader
      };

      // Fetch commissions
      const commRes = await fetch(`${API_URL}/commissions`, { headers });
      if (!commRes.ok) throw new Error('Failed to fetch commission rates');
      const commData = await commRes.json();
      setCommissions(commData);

      // Fetch categories
      const catRes = await fetch(`${API_URL}/categories`, { headers });
      if (!catRes.ok) throw new Error('Failed to fetch categories');
      const catData = await catRes.json();
      setCategories(catData);
    } catch (err) {
      console.error('Error loading commissions data:', err);
      setCommissionsMessage({ type: 'error', text: err.message });
    } finally {
      setCommissionsLoading(false);
    }
  };

  useEffect(() => {
    if (isBusiness && activeTab === 'commissions') {
      fetchCommissionsAndCategories();
    }
  }, [activeTab, isBusiness]);

  const handleSaveCommission = async (e) => {
    e.preventDefault();
    if (!commissionForm.categoryId || !commissionForm.commissionType || commissionForm.commissionValue === '') {
      setCommissionsMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setCommissionsLoading(true);
    setCommissionsMessage({ type: '', text: '' });

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'x-location': locationHeader,
        'x-tenant-id': locationHeader
      };

      const url = commissionForm.id 
        ? `${API_URL}/commissions/${commissionForm.id}` 
        : `${API_URL}/commissions`;
      const method = commissionForm.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify({
          categoryId: commissionForm.categoryId,
          unit: commissionForm.unit,
          commissionType: commissionForm.commissionType,
          commissionValue: Number(commissionForm.commissionValue)
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save commission rate');

      setCommissionsMessage({ 
        type: 'success', 
        text: commissionForm.id ? 'Commission rate updated successfully!' : 'New commission rate added successfully!' 
      });

      setCommissionForm({
        id: null,
        categoryId: '',
        unit: '',
        commissionType: 'flat',
        commissionValue: ''
      });
      setShowCommissionForm(false);
      fetchCommissionsAndCategories();
    } catch (err) {
      setCommissionsMessage({ type: 'error', text: err.message });
    } finally {
      setCommissionsLoading(false);
    }
  };

  const handleEditCommission = (comm) => {
    setCommissionForm({
      id: comm._id || comm.id,
      categoryId: comm.categoryId?._id || comm.categoryId || '',
      unit: comm.unit || '',
      commissionType: comm.commissionType || 'flat',
      commissionValue: comm.commissionValue
    });
    setShowCommissionForm(true);
  };

  const handleDeleteCommission = async (id) => {
    if (!window.confirm('Are you sure you want to delete this commission rate?')) return;

    setCommissionsLoading(true);
    setCommissionsMessage({ type: '', text: '' });

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const res = await fetch(`${API_URL}/commissions/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to delete commission rate');

      setCommissionsMessage({ type: 'success', text: 'Commission rate deleted successfully!' });
      fetchCommissionsAndCategories();
    } catch (err) {
      setCommissionsMessage({ type: 'error', text: err.message });
    } finally {
      setCommissionsLoading(false);
    }
  };

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

  const [returnsOrders, setReturnsOrders] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [returnsMessage, setReturnsMessage] = useState({ type: '', text: '' });
  const [returnsActionLoading, setReturnsActionLoading] = useState({});
  const [returnFilter, setReturnFilter] = useState('All');

  const fetchReturnsOrders = async () => {
    setReturnsLoading(true);
    setReturnsMessage({ type: '', text: '' });
    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const res = await fetch(`${API_URL}/orders/admin/all`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch returns');
      
      const filtered = data.filter(order => 
        order.items && order.items.some(item => item.returnStatus && item.returnStatus !== 'None')
      );
      setReturnsOrders(filtered);
    } catch (err) {
      console.error('Error fetching returns:', err);
      setReturnsMessage({ type: 'error', text: err.message });
    } finally {
      setReturnsLoading(false);
    }
  };

  const handleUpdateItemReturnStatus = async (orderId, itemId, newStatus) => {
    const actionKey = `${orderId}-${itemId}`;
    setReturnsActionLoading(prev => ({ ...prev, [actionKey]: true }));
    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const res = await fetch(`${API_URL}/orders/${orderId}/items/${itemId}/return-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update return status');
      
      // Refresh order in list
      setReturnsOrders(prev => prev.map(order => 
        order._id === orderId ? data.order : order
      ));

      setReturnsMessage({ type: 'success', text: `Item return status successfully updated to "${newStatus}"!` });
      setTimeout(() => setReturnsMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      console.error('Error updating item return status:', err);
      setReturnsMessage({ type: 'error', text: err.message });
    } finally {
      setReturnsActionLoading(prev => ({ ...prev, [actionKey]: false }));
    }
  };

  useEffect(() => {
    if ((user?.role === 'admin' || user?.role === 'seller') && activeTab === 'returns') {
      fetchReturnsOrders();
    }
  }, [activeTab, user]);

  const [cutoffTime, setCutoffTime] = useState('');
  const [cutoffLoading, setCutoffLoading] = useState(false);
  const [cutoffMessage, setCutoffMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (isBusiness) {
      const fetchCutoff = async () => {
        setCutoffLoading(true);
        try {
          const selectedCity = localStorage.getItem('selectedCity');
          const savedTenantId = localStorage.getItem('zudo_tenant_id');
          const locationHeader = savedTenantId || selectedCity || '';

          const res = await fetch(`${API_URL}/deliveryslots`, {
            headers: {
              'x-location': locationHeader,
              'x-tenant-id': locationHeader
            }
          });
          if (res.ok) {
            const slots = await res.json();
            // Find cutoff settings document (either isSameDay or globalIsSameDay)
            const cutoffSlot = slots.find(s => (s.isSameDay || s.globalIsSameDay) && s.SameDayCutoff);
            if (cutoffSlot && cutoffSlot.SameDayCutoff) {
              setCutoffTime(cutoffSlot.SameDayCutoff);
            } else {
              setCutoffTime('12:00 PM');
            }
          }
        } catch (err) {
          console.error('Error fetching cutoff time:', err);
        } finally {
          setCutoffLoading(false);
        }
      };
      fetchCutoff();
    }
  }, [user, isBusiness]);

  const handleUpdateCutoff = async (e) => {
    e.preventDefault();
    setCutoffLoading(true);
    setCutoffMessage({ type: '', text: '' });
    
    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const res = await fetch(`${API_URL}/deliveryslots/cutoff`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify({ cutoffTime })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update cutoff');
      
      setCutoffMessage({ type: 'success', text: 'Same-day delivery cutoff updated successfully!' });
    } catch (err) {
      setCutoffMessage({ type: 'error', text: err.message });
    } finally {
      setCutoffLoading(false);
    }
  };

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
          {isBusiness && (
            <>
              <button 
                onClick={() => setActiveTab('delivery_settings')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === 'delivery_settings' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Delivery Settings
              </button>
              <button 
                onClick={() => setActiveTab('commissions')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === 'commissions' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
              >
                Commissions
              </button>
            </>
          )}
          {(user?.role === 'admin' || user?.role === 'seller') && (
            <button 
              onClick={() => setActiveTab('returns')}
              className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl font-bold transition-all whitespace-nowrap text-sm sm:text-base ${activeTab === 'returns' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
            >
              Returns
            </button>
          )}
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
        {activeTab === 'profile' && (
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
        )}

      {activeTab === 'addresses' && (
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

      {activeTab === 'delivery_settings' && isBusiness && (
        <div className="p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Delivery Settings</h3>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure same-day delivery limits</p>
            </div>
            <div className="h-12 w-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
              <Clock size={22} />
            </div>
          </div>

          {cutoffMessage.text && (
            <div className={`mb-6 p-4 rounded-2xl font-black text-[11px] flex items-center gap-3 animate-[scaleIn_0.3s_ease-out] ${cutoffMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${cutoffMessage.type === 'success' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
              {cutoffMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateCutoff} className="max-w-md space-y-6">
            <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest">
                Same-Day Delivery Cutoff Time
              </label>
              <p className="text-xs text-gray-500 font-bold leading-relaxed">
                Same-day delivery slots will be automatically hidden or disabled for customers placing orders past this cutoff time.
              </p>
              
              <div className="relative mt-2">
                <select
                  value={cutoffTime}
                  onChange={(e) => setCutoffTime(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black text-sm text-gray-800 appearance-none cursor-pointer"
                  required
                >
                  <option value="09:00 AM">09:00 AM</option>
                  <option value="10:00 AM">10:00 AM</option>
                  <option value="10:30 AM">10:30 AM</option>
                  <option value="11:00 AM">11:00 AM</option>
                  <option value="12:00 PM">12:00 PM</option>
                  <option value="01:00 PM">01:00 PM (13:00)</option>
                  <option value="02:00 PM">02:00 PM (14:00)</option>
                  <option value="03:00 PM">03:00 PM (15:00)</option>
                  <option value="04:00 PM">04:00 PM (16:00)</option>
                  <option value="05:00 PM">05:00 PM (17:00)</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                  <Clock size={16} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={cutoffLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl shadow-xl shadow-emerald-600/30 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {cutoffLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Save size={18} />
                  Update Cutoff Time
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {activeTab === 'commissions' && isBusiness && (
        <div className="p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight">Category Commissions</h3>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">Configure flat and percentage based payouts</p>
            </div>
            <button
              onClick={() => {
                setCommissionForm({
                  id: null,
                  categoryId: categories[0]?._id || '',
                  unit: '',
                  commissionType: 'flat',
                  commissionValue: ''
                });
                setShowCommissionForm(!showCommissionForm);
              }}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-95 border-0"
            >
              {showCommissionForm ? 'Close Form' : 'Add Commission'}
            </button>
          </div>

          {commissionsMessage.text && (
            <div className={`mb-6 p-4 rounded-2xl font-black text-[11px] flex items-center gap-3 animate-[scaleIn_0.3s_ease-out] ${commissionsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${commissionsMessage.type === 'success' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
              {commissionsMessage.text}
            </div>
          )}

          {showCommissionForm && (
            <form onSubmit={handleSaveCommission} className="bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 space-y-4 mb-8 animate-[slideDown_0.3s_ease-out]">
              <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-2">
                {commissionForm.id ? 'Edit Commission Rate' : 'New Commission Rate'}
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Category</label>
                  <select
                    value={commissionForm.categoryId}
                    onChange={(e) => setCommissionForm({ ...commissionForm, categoryId: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select Category</option>
                    {categories.map(cat => (
                      <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Unit (e.g. Pc, Kg, Ltr)</label>
                  <input
                    type="text"
                    value={commissionForm.unit}
                    onChange={(e) => setCommissionForm({ ...commissionForm, unit: e.target.value })}
                    placeholder="Optional (e.g. Pc)"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">Type</label>
                  <select
                    value={commissionForm.commissionType}
                    onChange={(e) => setCommissionForm({ ...commissionForm, commissionType: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs cursor-pointer"
                    required
                  >
                    <option value="flat">Flat (Fixed amount)</option>
                    <option value="percentage">Percentage (%)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-gray-900 uppercase tracking-[0.1em] ml-1">
                    Value {commissionForm.commissionType === 'flat' ? '(₹)' : '(%)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={commissionForm.commissionValue}
                    onChange={(e) => setCommissionForm({ ...commissionForm, commissionValue: e.target.value })}
                    placeholder={commissionForm.commissionType === 'flat' ? 'e.g. 30' : 'e.g. 10'}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-100 bg-white focus:border-emerald-500 outline-none transition-all font-bold text-gray-800 text-xs"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setShowCommissionForm(false)}
                  className="px-6 py-2.5 border border-gray-100 text-gray-400 rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-gray-100 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={commissionsLoading}
                  className="px-8 py-2.5 bg-emerald-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/10 active:scale-95"
                >
                  {commissionForm.id ? 'Update Rate' : 'Add Rate'}
                </button>
              </div>
            </form>
          )}

          {commissionsLoading && commissions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading commissions settings...</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-gray-100 shadow-sm">
              <table className="w-full border-collapse bg-white text-left text-xs text-gray-500">
                <thead className="bg-gray-50 text-[10px] font-black uppercase tracking-wider text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-4">Category</th>
                    <th scope="col" className="px-6 py-4">Unit Limit</th>
                    <th scope="col" className="px-6 py-4">Commission Type</th>
                    <th scope="col" className="px-6 py-4">Rate Value</th>
                    <th scope="col" className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 border-t border-gray-50 font-medium">
                  {commissions.length > 0 ? (
                    commissions.map((comm) => (
                      <tr key={comm._id || comm.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900 text-xs">
                              {comm.categoryId?.name || comm.categoryId || 'General Category'}
                            </span>
                            <span className="text-[9px] text-gray-400 uppercase tracking-tighter mt-0.5">
                              ID: {comm.categoryId?._id || comm.categoryId}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${comm.unit ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-gray-100 text-gray-400'}`}>
                            {comm.unit || 'Universal (Any)'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${comm.commissionType === 'flat' ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-teal-50 text-teal-700 border border-teal-100'}`}>
                            {comm.commissionType === 'flat' ? 'Flat Fee' : 'Percentage'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-black text-gray-900 text-sm">
                          {comm.commissionType === 'flat' ? `₹${comm.commissionValue}` : `${comm.commissionValue}%`}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => handleEditCommission(comm)}
                              className="text-[9px] font-black text-emerald-600 uppercase tracking-widest hover:underline border-0 bg-transparent cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleDeleteCommission(comm._id || comm.id)}
                              className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline border-0 bg-transparent cursor-pointer"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="text-center py-16 bg-gray-50/50">
                        <div className="h-12 w-12 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3">
                          💸
                        </div>
                        <p className="text-gray-400 font-bold italic">No commission rates defined yet.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === 'returns' && (user?.role === 'admin' || user?.role === 'seller') && (
        <div className="p-6 sm:p-8 animate-[fadeIn_0.3s_ease-out]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h3 className="text-xl font-black text-gray-900 tracking-tight text-left">Returns Management</h3>
              <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1 text-left">Review and process customer product return requests</p>
            </div>
            <div className="h-12 w-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
              <ArrowLeft size={22} className="rotate-180" />
            </div>
          </div>

          {returnsMessage.text && (
            <div className={`mb-6 p-4 rounded-2xl font-black text-[11px] flex items-center gap-3 animate-[scaleIn_0.3s_ease-out] ${returnsMessage.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
              <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${returnsMessage.type === 'success' ? 'bg-emerald-600 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-red-600 shadow-[0_0_10px_rgba(239,68,68,0.5)]'}`}></div>
              {returnsMessage.text}
            </div>
          )}

          {/* Filter Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 mb-6 scrollbar-hide">
            {['All', 'Return Requested', 'Return Approved', 'Picked Up from Customer', 'Returned to Seller', 'Return Rejected'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setReturnFilter(status)}
                className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border whitespace-nowrap ${returnFilter === status ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20' : 'bg-gray-50 border-gray-100 text-gray-500 hover:bg-gray-100'}`}
              >
                {status === 'All' ? 'All Returns' : status}
              </button>
            ))}
          </div>

          {returnsLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-amber-500/20 border-t-amber-500 rounded-full animate-spin mb-4" />
              <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading return requests...</p>
            </div>
          ) : (() => {
            // Filter orders based on returnFilter
            const filteredOrders = returnsOrders.filter(order => {
              if (returnFilter === 'All') return true;
              return order.items.some(item => item.returnStatus === returnFilter);
            });

            if (filteredOrders.length === 0) {
              return (
                <div className="text-center py-20 bg-gray-50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                  <div className="h-16 w-16 bg-white rounded-xl shadow-sm flex items-center justify-center mx-auto mb-3 text-2xl">
                    📦
                  </div>
                  <p className="text-gray-400 font-bold italic">No return requests found matching the filter.</p>
                </div>
              );
            }

            return (
              <div className="space-y-6">
                {filteredOrders.map(order => (
                  <div key={order._id} className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden text-left hover:border-amber-200/50 transition-all duration-300">
                    {/* Header */}
                    <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2.5 py-1 rounded-md border border-amber-100 uppercase tracking-widest">
                          Order ID: #{order._id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight ml-3">
                          Placed: {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-gray-500 uppercase">Customer: </span>
                        <span className="text-xs font-black text-gray-900">{order.userId?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-gray-400 ml-2">({order.userId?.email})</span>
                      </div>
                    </div>

                    {/* Return Items list */}
                    <div className="p-6 space-y-6">
                      {order.items
                        .filter(item => item.returnStatus && item.returnStatus !== 'None' && (returnFilter === 'All' || item.returnStatus === returnFilter))
                        .map((item, idx) => {
                          const actionKey = `${order._id}-${item._id}`;
                          const isLoading = !!returnsActionLoading[actionKey];

                          return (
                            <div key={item._id || idx} className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 pb-6 border-b border-gray-50 last:border-b-0 last:pb-0">
                              {/* Left: Item metadata & details */}
                              <div className="flex gap-4 items-start flex-1 min-w-0">
                                <div className="w-16 h-16 rounded-xl bg-gray-50 overflow-hidden border border-gray-100 flex-shrink-0">
                                  <img src={cleanImageUrl(item.product?.imageUrl || item.product?.image || item.image)} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <h4 className="font-black text-gray-900 text-sm truncate leading-tight mb-1">{item.product?.name || item.name}</h4>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest font-mono mb-2">
                                    Qty: {item.quantity} × ₹{item.price}
                                  </p>
                                  
                                  <div className="bg-amber-50/50 border border-amber-100/50 rounded-xl p-3.5 space-y-2 mt-2">
                                    <p className="text-[10px] font-black text-amber-700 uppercase tracking-wider leading-none">Return Details</p>
                                    <p className="text-xs font-bold text-gray-700 leading-tight mt-1">
                                      <span className="text-amber-800">Reason:</span> {item.returnReason || 'Not provided'}
                                    </p>
                                    {item.returnComment && (
                                      <p className="text-xs font-medium text-gray-600 leading-tight">
                                        <span className="text-amber-800">Comment:</span> {item.returnComment}
                                      </p>
                                    )}
                                    {item.returnImage && (
                                      <div className="pt-2">
                                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-wide mb-1">Evidence Photo:</p>
                                        <a href={cleanImageUrl(item.returnImage)} target="_blank" rel="noopener noreferrer" className="inline-block relative rounded-lg overflow-hidden border border-amber-100 hover:scale-[1.02] transition-transform">
                                          <img src={cleanImageUrl(item.returnImage)} alt="Evidence" className="h-20 w-32 object-cover" />
                                        </a>
                                      </div>
                                    )}
                                    {(item.refundAccountName || item.refundBankName || item.refundAccountNumber || item.refundIfscCode) && (
                                      <div className="pt-2 border-t border-amber-200/40 mt-2 space-y-1">
                                        <p className="text-[9px] font-black text-amber-800 uppercase tracking-wider leading-none">Refund Bank Details</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                                          {item.refundAccountName && (
                                            <p className="font-bold text-gray-700">
                                              <span className="text-amber-800 text-[10px] uppercase font-black tracking-wider mr-1">Holder Name:</span> {item.refundAccountName}
                                            </p>
                                          )}
                                          {item.refundBankName && (
                                            <p className="font-bold text-gray-700">
                                              <span className="text-amber-800 text-[10px] uppercase font-black tracking-wider mr-1">Bank Name:</span> {item.refundBankName}
                                            </p>
                                          )}
                                          {item.refundAccountNumber && (
                                            <p className="font-bold text-gray-700">
                                              <span className="text-amber-800 text-[10px] uppercase font-black tracking-wider mr-1">Account No:</span> {item.refundAccountNumber}
                                            </p>
                                          )}
                                          {item.refundIfscCode && (
                                            <p className="font-bold text-gray-700">
                                              <span className="text-amber-800 text-[10px] uppercase font-black tracking-wider mr-1">IFSC Code:</span> {item.refundIfscCode}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Right: Item Return Status & Actions */}
                              <div className="flex flex-col items-end gap-3 justify-start min-w-[200px] flex-shrink-0">
                                <div>
                                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 text-right">Return Status</p>
                                  <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    item.returnStatus === 'Return Requested' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
                                    item.returnStatus === 'Return Approved' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                                    item.returnStatus === 'Return Rejected' ? 'bg-red-100 text-red-800 border border-red-200' :
                                    item.returnStatus === 'Picked Up from Customer' ? 'bg-indigo-100 text-indigo-800 border border-indigo-200' :
                                    'bg-purple-100 text-purple-800 border border-purple-200'
                                  }`}>
                                    {item.returnStatus}
                                  </span>
                                </div>

                                {/* Actions Buttons */}
                                <div className="w-full flex flex-col gap-2 mt-2">
                                  {item.returnStatus === 'Return Requested' && (
                                    <div className="flex gap-2 w-full">
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemReturnStatus(order._id, item._id, 'Return Approved')}
                                        disabled={isLoading}
                                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-emerald-600/10 flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        {isLoading ? (
                                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : 'Approve'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateItemReturnStatus(order._id, item._id, 'Return Rejected')}
                                        disabled={isLoading}
                                        className="flex-1 py-2 bg-red-50 hover:bg-red-600 text-red-600 hover:text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all border border-red-100 flex items-center justify-center gap-1 cursor-pointer"
                                      >
                                        {isLoading ? (
                                          <div className="w-3.5 h-3.5 border-2 border-red-600/30 border-t-red-600 rounded-full animate-spin" />
                                        ) : 'Reject'}
                                      </button>
                                    </div>
                                  )}

                                  {item.returnStatus === 'Return Approved' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemReturnStatus(order._id, item._id, 'Picked Up from Customer')}
                                      disabled={isLoading}
                                      className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      {isLoading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : 'Mark as Picked Up'}
                                    </button>
                                  )}

                                  {item.returnStatus === 'Picked Up from Customer' && (
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateItemReturnStatus(order._id, item._id, 'Returned to Seller')}
                                      disabled={isLoading}
                                      className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-black text-[9px] uppercase tracking-widest transition-all shadow-md shadow-purple-600/10 flex items-center justify-center gap-1 cursor-pointer"
                                    >
                                      {isLoading ? (
                                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                      ) : 'Mark as Returned to Seller'}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}
      </div>
    </div>
  );
}
