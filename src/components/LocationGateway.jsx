import React, { useState, useEffect } from 'react';
import { MapPin, X, Package, Search, ChevronRight, ArrowRight, Navigation } from 'lucide-react';
import { useLocation } from '../hooks/useLocation';

const API_BASE = window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api';

export default function LocationGateway({ onSelect }) {
  const [step, setStep] = useState('pincode'); // 'pincode', 'address', 'city', or 'request'
  const [address, setAddress] = useState('');
  const [pendingData, setPendingData] = useState(null);
  const [pincode, setPincode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locations, setLocations] = useState([]);
  const [requestData, setRequestData] = useState({ name: '', email: '', city: '', mobile: '' });
  const [requestSent, setRequestSent] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/tenancy/locations`)
      .then(res => res.json())
      .then(data => setLocations(data))
      .catch(err => console.error('Error fetching locations:', err));
  }, []);

  const { pincode: detPincode, loading: locationLoading, refresh: refreshLocation } = useLocation();
  const [manualTrigger, setManualTrigger] = useState(false);

  const handleLiveLocation = async () => {
    setManualTrigger(true);
    refreshLocation();
  };

  useEffect(() => {
    if (detPincode && manualTrigger && step === 'pincode') {
      const checkLiveLocation = async () => {
        setLoading(true);
        try {
          const res = await fetch(`${API_BASE}/tenancy/find/${detPincode}`);
          const data = await res.json();
          if (res.ok) {
            onSelect(data.city, data.dbName);
          } else {
            setPincode(detPincode);
            setStep('request');
          }
        } catch (err) {
          setError('GPS detected area but validation failed');
        } finally {
          setLoading(false);
          setManualTrigger(false);
        }
      };
      checkLiveLocation();
    }
  }, [detPincode, manualTrigger, onSelect]);

  const handlePincodeSubmit = async (e) => {
    if (e) e.preventDefault();
    if (pincode.length !== 6) {
      setError('Enter a valid 6-digit pincode');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/tenancy/find/${pincode}`);
      const data = await res.json();
      if (res.ok) {
        onSelect(data.city, data.dbName);
      } else {
        setStep('request');
      }
    } catch (err) {
      setError('Error looking up pincode');
    } finally {
      setLoading(false);
    }
  };

  const handleAddressSubmit = (e) => {
    e.preventDefault();
    if (address.length < 10) {
      setError('Please enter a more detailed address');
      return;
    }
    localStorage.setItem('user_address', address);
    onSelect(pendingData.city, pendingData.dbName);
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/tenancy/request-service`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...requestData, pincode })
      });
      if (res.ok) {
        setRequestSent(true);
      }
    } catch (err) {
      setError('Error sending request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col md:flex-row bg-white dark:bg-[#050505] font-sans overflow-hidden">
      
      {/* Left Panel: Hero Image & Branding */}
      <div className="relative w-full md:w-1/2 h-[35vh] md:h-full overflow-hidden group">
        <img 
          src="/images/gateway_hero.png" 
          alt="Delivery Experience" 
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-[15s] group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-emerald-900/95 via-emerald-900/40 to-transparent"></div>
        
        <div className="absolute inset-0 p-8 md:p-14 flex flex-col justify-between text-white">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-2xl rotate-3">
                <span className="text-emerald-700 font-black text-2xl tracking-tighter">Z</span>
              </div>
              <h1 className="text-3xl font-black tracking-tighter">ZUDO</h1>
            </div>
            <h2 className="text-3xl md:text-5xl font-black leading-none tracking-tight max-w-xs">
              Buy More <br /> Enjoy More.
            </h2>
            <p className="text-emerald-200 mt-4 font-bold text-sm max-w-xs opacity-90">
              Your gateway to premium local shopping and express home delivery.
            </p>
          </div>

          <div className="space-y-4 hidden md:block">
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-[20px] border border-white/20 max-w-xs">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <Package size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm">Fresh Daily</h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em]">Direct from farmers</p>
              </div>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-xl p-4 rounded-[20px] border border-white/20 max-w-xs">
              <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm">Hyper-Local</h3>
                <p className="text-[10px] text-white/70 font-bold uppercase tracking-[0.2em]">Sourced for you</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Content */}
      <div className="relative w-full md:w-1/2 h-[65vh] md:h-full flex flex-col bg-white dark:bg-[#121212] overflow-y-auto custom-scrollbar shadow-[-20px_0_40px_rgba(0,0,0,0.1)]">
        {step === 'request' && (
          <img 
            src="/images/request_bg.png" 
            className="absolute inset-0 w-full h-full object-cover opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
            alt="Background Pattern"
          />
        )}

        <div className="p-6 md:p-10 lg:p-14 flex-1 flex flex-col justify-center relative z-10">
          <div className="mb-8 text-center md:text-left">
            <span className="inline-block px-3 py-1 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] rounded-full mb-3">
              Location Verification
            </span>
            <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-3 leading-none">
              {step === 'address' ? 'Final Step' : step === 'request' ? 'Coming Soon' : 'Welcome Home'}
            </h2>
            <p className="text-gray-400 text-xs font-bold leading-relaxed max-w-sm mx-auto md:mx-0">
              {step === 'address' ? 'We found your area! Now tell us exactly where to bring your order.' : step === 'request' ? 'We haven\'t reached your neighborhood yet, but we are expanding fast!' : 'Verify your delivery area to unlock a personalized shopping experience.'}
            </p>
          </div>

          <div className="space-y-6 max-w-md mx-auto md:mx-0 w-full">
            {step === 'pincode' ? (
              <div className="animate-[fadeIn_0.5s_ease-out] space-y-6">
                <form onSubmit={handlePincodeSubmit} className="space-y-4">
                  <div className="relative group">
                    <input 
                      type="text" 
                      maxLength="6"
                      autoFocus
                      placeholder="Enter Pincode"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
                      className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-[24px] py-5 px-8 outline-none font-black text-xl focus:border-emerald-500 transition-all dark:text-white placeholder:text-gray-300"
                    />
                    <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 bg-emerald-600 text-white px-6 rounded-[18px] font-black text-[9px] uppercase tracking-[0.1em] hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50">
                      {loading ? '...' : 'ENTER THE STORE'}
                    </button>
                  </div>
                  {error && <p className="text-[10px] text-red-500 font-bold text-center">{error}</p>}
                </form>

                <div className="relative flex items-center justify-center">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100 dark:border-white/5"></div></div>
                  <span className="relative px-4 bg-white dark:bg-[#121212] text-[9px] font-black text-gray-400 uppercase tracking-[0.4em]">Browse Regions</span>
                </div>

                <div className="space-y-3">
                  <button 
                    onClick={handleLiveLocation}
                    disabled={locationLoading || loading}
                    className="w-full group flex items-center justify-between p-4 rounded-[20px] bg-emerald-50 dark:bg-emerald-500/5 border-2 border-emerald-100 dark:border-emerald-500/10 hover:border-emerald-500 transition-all shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-[#1a1a1a] rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Navigation size={18} className={locationLoading ? 'animate-spin' : ''} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-gray-900 dark:text-white">Detect My Location</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Automatic GPS</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-all" />
                  </button>

                  <button 
                    onClick={() => setStep('city')}
                    className="w-full group flex items-center justify-between p-4 rounded-[20px] bg-gray-50 dark:bg-white/5 border-2 border-transparent hover:border-emerald-500/30 transition-all text-left shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white dark:bg-[#1a1a1a] rounded-xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        <Search size={18} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black text-gray-900 dark:text-white">Choose City Manually</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Select Regions</p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500 transition-all" />
                  </button>
                </div>
              </div>
            ) : step === 'city' ? (
              <div className="animate-[slideIn_0.4s_ease-out] space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  {locations.map(loc => (
                    <button key={loc.dbName} onClick={() => { setStep('pincode'); setPincode(''); setError(`Enter a pincode for ${loc.city}`); }} className="flex items-center justify-between p-4 rounded-[20px] bg-emerald-50 dark:bg-emerald-500/5 border-2 border-emerald-100 dark:border-emerald-500/10 hover:border-emerald-500 transition-all group shadow-sm">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white dark:bg-[#1a1a1a] rounded-lg flex items-center justify-center text-emerald-600 shadow-sm font-black text-xs">
                          {loc.city.charAt(0)}
                        </div>
                        <div>
                          <p className="text-xs font-black text-gray-900 dark:text-white">{loc.city}</p>
                          <p className="text-[9px] font-bold text-emerald-600 uppercase tracking-widest">Active Store</p>
                        </div>
                      </div>
                      <ArrowRight size={16} className="text-emerald-300 group-hover:text-emerald-600 transition-all" />
                    </button>
                  ))}
                </div>
                <button onClick={() => setStep('pincode')} className="w-full py-3 text-[9px] font-black uppercase text-gray-400 hover:text-emerald-600 transition-all text-center">← Back to Pincode</button>
              </div>
            ) : (
              <div className="animate-[fadeIn_0.5s_ease-out] space-y-6">
                {!requestSent ? (
                  <form onSubmit={handleRequestSubmit} className="space-y-4">
                    <div className="p-5 bg-amber-50 dark:bg-amber-500/5 border border-amber-100 dark:border-amber-500/10 rounded-[24px] flex gap-3 items-center">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                        <Package size={20} />
                      </div>
                      <p className="text-[10px] font-bold text-amber-900 dark:text-amber-400 leading-relaxed">
                        We don't deliver to <span className="font-black underline">{pincode}</span> yet. Help us prioritize your area.
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Full Name" required value={requestData.name} onChange={e => setRequestData({...requestData, name: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-[20px] py-4 px-6 outline-none font-bold text-xs focus:border-emerald-500 transition-all dark:text-white" />
                        <input type="tel" placeholder="Mobile No" required value={requestData.mobile} onChange={e => setRequestData({...requestData, mobile: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-[20px] py-4 px-6 outline-none font-bold text-xs focus:border-emerald-500 transition-all dark:text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Your City" required value={requestData.city} onChange={e => setRequestData({...requestData, city: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-[20px] py-4 px-6 outline-none font-bold text-xs focus:border-emerald-500 transition-all dark:text-white" />
                        <input type="email" placeholder="Email Address" required value={requestData.email} onChange={e => setRequestData({...requestData, email: e.target.value})} className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-[20px] py-4 px-6 outline-none font-bold text-xs focus:border-emerald-500 transition-all dark:text-white" />
                      </div>
                      <button type="submit" disabled={loading} className="w-full py-4 bg-emerald-600 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-xl disabled:opacity-50">
                        {loading ? 'Submitting...' : 'Request Zudo Store'}
                      </button>
                    </div>
                    <button 
                      onClick={() => { setStep('pincode'); setPincode(''); setError(''); }} 
                      className="w-full py-3 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-[20px] font-black text-[9px] uppercase tracking-[0.2em] hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    >
                      ← Try another pincode / city
                    </button>
                  </form>
                ) : (
                  <div className="text-center py-6 space-y-5">
                    <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-600/10">
                      <Package size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Request Logged!</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-bold max-w-xs mx-auto">
                      Your interest in <span className="text-emerald-600 font-black">{pincode}</span> has been shared. We'll notify you at <span className="text-emerald-600 font-black">{requestData.email}</span> soon!
                    </p>
                    <button onClick={() => { setRequestSent(false); setStep('pincode'); setPincode(''); }} className="px-8 py-3 bg-gray-900 dark:bg-white dark:text-black text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-[18px] hover:bg-emerald-600 transition-all shadow-xl">
                      Explore Other Regions
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-50 dark:border-white/5 text-center bg-gray-50/50 dark:bg-white/[0.02] mt-auto">
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] leading-relaxed">
            Zudo Local Onboarding Platform <br /> 
            <span className="text-emerald-500 opacity-60">Verified Area-Based Delivery</span>
          </p>
        </div>
      </div>
    </div>
  );
}
