import React, { useState } from 'react';
import { X, UserCircle, ShoppingBag, ArrowLeft, Mail, Lock, Phone, Building2, FileText, CheckCircle2, AlertTriangle } from 'lucide-react';
import { auth, googleProvider } from '../../firebase';
import { signInWithPopup } from 'firebase/auth';
import { API_URL, API_BASE_URL } from '../config';

export default function LoginModal({ onClose, setUser, initialB2B = null }) {
  const [selection, setSelection] = useState(initialB2B === 'b2c' || initialB2B === 'b2b' ? initialB2B : null);
  const [isLogin, setIsLogin] = useState(true);
  const [isB2B, setIsB2B] = useState(initialB2B === 'b2b');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    companyName: '',
    phone: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showBackendWarning, setShowBackendWarning] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const [documentFile, setDocumentFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === 'application/pdf' || file.type.startsWith('image/'))) {
      setDocumentFile(file);
    } else {
      setError('Please select a valid PDF or Image');
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    setShowBackendWarning(false);
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const fbUser = result.user;

      try {
        const response = await fetch(`${API_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: fbUser.displayName,
            email: fbUser.email,
            profilePicture: fbUser.photoURL,
            role: isB2B ? 'b2b' : 'b2c'
          })
        });

        const data = await response.json();

        if (response.ok) {
          // SAFE ROLE CHECK: Support both wrapped {user: {role}} and flat {role}
          const returnedUser = data.user || data;
          const returnedRole = returnedUser?.role;
          const expectedRole = isB2B ? 'b2b' : 'b2c';

          if (returnedRole && returnedRole !== expectedRole) {
             throw new Error(`This account is registered as ${returnedRole.toUpperCase()}. Please register as ${expectedRole.toUpperCase()} to continue.`);
          }

          saveAndFinalize(data);
          return;
        }

        if (response.status === 401) {
          throw new Error(data.message || 'Login rejected by server');
        }

        if (response.status === 404) {
          const fallbackPassword = `fb_${fbUser.uid}_google`;
          const regResponse = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: fbUser.displayName,
              email: fbUser.email,
              password: fallbackPassword,
              role: isB2B ? 'b2b' : 'b2c',
              profilePicture: fbUser.photoURL
            })
          });

          if (regResponse.ok) {
            const regData = await regResponse.json();
            saveAndFinalize(regData);
            return;
          }
        }
        throw new Error('Database sync failed');
      } catch (syncErr) {
        if (syncErr.message.includes('registered as')) {
           throw syncErr;
        }
        console.error('Final sync attempt failed:', syncErr);
        setShowBackendWarning(true);
        handleLocalFallback(fbUser);
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const saveAndFinalize = (data) => {
    // Ensure we save the user object correctly regardless of structure
    const userData = data.user || { ...data, token: undefined };
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(userData));
    if (setUser) setUser(userData);
    finalizeLogin(userData);
  };

  const handleLocalFallback = (fbUser) => {
    const userData = {
      _id: fbUser.uid,
      name: fbUser.displayName,
      email: fbUser.email,
      profileImage: fbUser.photoURL,
      role: isB2B ? 'b2b' : 'b2c',
      isVerified: false,
      isLocalOnly: true 
    };
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', 'local_' + fbUser.uid);
    if (setUser) setUser(userData);
    finalizeLogin(userData);
  };

  const finalizeLogin = (user) => {
    if (isB2B) {
      localStorage.setItem('isB2B', 'true');
    }
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!isLogin && isB2B && !documentFile) {
      setError('Business verification document is required');
      setLoading(false);
      return;
    }

    const endpoint = isLogin ? '/auth/user-login' : '/auth/register';
    
    try {
      let finalDocUrl = '';
      
      if (!isLogin && isB2B && documentFile) {
        const uploadData = new FormData();
        uploadData.append('file', documentFile);
        
        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          body: uploadData
        });
        
        if (!uploadRes.ok) throw new Error('Document upload failed');
        const uploadResult = await uploadRes.json();
        finalDocUrl = `${API_BASE_URL}${uploadResult.url}`;
      }

      const payload = isLogin 
        ? { email: formData.email, password: formData.password, role: isB2B ? 'b2b' : 'b2c' }
        : { 
            name: formData.name, 
            email: formData.email, 
            password: formData.password,
            phone: formData.phone,
            role: isB2B ? 'b2b' : 'b2c',
            businessName: isB2B ? formData.companyName : '',
            gstPdf: isB2B ? finalDocUrl : ''
          };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Something went wrong');
      }

      // SAFE ROLE CHECK: Support both wrapped {user: {role}} and flat {role}
      const returnedUser = data.user || data;
      const returnedRole = returnedUser?.role;
      const expectedRole = isB2B ? 'b2b' : 'b2c';

      if (returnedRole && returnedRole !== expectedRole) {
         throw new Error(`This account is registered as ${returnedRole.toUpperCase()}. Please register as ${expectedRole.toUpperCase()} to continue.`);
      }

      saveAndFinalize(data);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-3xl flex overflow-hidden shadow-2xl relative animate-[fadeIn_0.3s_ease-out]">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-all z-[110] bg-gray-50 p-1.5 rounded-full">
          <X size={18} />
        </button>

        {!selection ? (
          <div className="w-full flex flex-col md:flex-row min-h-[400px]">
             <div className="flex-1 group relative overflow-hidden flex flex-col items-center justify-center p-8 transition-all duration-700 hover:bg-emerald-50/50 border-r border-gray-100">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-600/20 group-hover:scale-110 transition-all duration-500">
                    <UserCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Personal</h3>
                  <p className="text-gray-500 font-bold text-xs max-w-[200px]">Shop our fresh grocery collection.</p>
                  <button onClick={() => { setSelection('b2c'); setIsB2B(false); }} className="mt-6 px-6 py-3 bg-white border-2 border-emerald-600 text-emerald-700 font-black text-xs rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-lg shadow-emerald-600/5">Continue as Customer</button>
                </div>
             </div>

             <div className="flex-1 group relative overflow-hidden flex flex-col items-center justify-center p-8 transition-all duration-700 hover:bg-gray-50">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-900 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-gray-900/20 group-hover:scale-110 transition-all duration-500 group-hover:bg-emerald-500 group-hover:shadow-emerald-500/20">
                    <Building2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Business</h3>
                  <p className="text-gray-500 font-bold text-xs max-w-[200px]">Bulk pricing and wholesale distributions.</p>
                  <button onClick={() => { setSelection('b2b'); setIsB2B(true); }} className="mt-6 px-6 py-3 bg-gray-900 text-white font-black text-xs rounded-xl hover:bg-emerald-600 transition-all duration-300">Partner Portal</button>
                </div>
             </div>
          </div>
        ) : (
          <>
            <div className="w-2/5 hidden md:block relative bg-gray-100 overflow-hidden">
              <img src={isB2B ? "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800" : "https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&q=80&w=800"} alt="Groceries" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
                <h3 className="text-white text-2xl font-black mb-2">{isB2B ? 'Zudo B2B Solutions.' : 'Premium Groceries.'}</h3>
                <p className="text-white/70 font-bold text-xs">{isB2B ? 'Wholesale rates for your business.' : 'Quality you can trust.'}</p>
              </div>
            </div>

            <div className="w-full md:w-3/5 p-8 relative bg-white flex flex-col justify-center max-h-[90vh] overflow-y-auto">
              <div className="mb-6">
                <button onClick={() => { setSelection(null); setIsB2B(false); }} className="flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest mb-4 hover:translate-x-[-2px] transition-transform"><ArrowLeft size={12} strokeWidth={3} />Change Account Type</button>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight">{isLogin ? 'Welcome Back' : 'Get Started'}</h2>
                  {isB2B && <span className="bg-gray-900 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase">B2B</span>}
                </div>
              </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black rounded-xl">{error}</div>}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <div className="space-y-4">
                    <div className="relative group">
                      <UserCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
                      <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" required />
                    </div>
                    {isB2B && (
                      <div className="relative group">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
                        <input type="text" name="companyName" value={formData.companyName} onChange={handleChange} placeholder="Company Name" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" required />
                      </div>
                    )}
                    <div className="relative group">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
                      <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" required />
                    </div>
                    {isB2B && (
                      <div className="relative group p-3 border border-dashed border-gray-200 rounded-xl cursor-pointer">
                        <input type="file" accept=".pdf,image/*" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" required />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider text-center">{documentFile ? documentFile.name : 'Upload Documents'}</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
                  <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" required />
                </div>
                
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
                  <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" required />
                </div>

                <button type="submit" disabled={loading} className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg transition-all text-xs mt-2 flex items-center justify-center gap-2 ${loading ? 'opacity-70' : ''}`}>
                  {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <>{isLogin ? 'Sign In' : 'Create Account'}</>}
                </button>

                <div className="relative flex items-center gap-3 py-2">
                  <div className="flex-grow h-px bg-gray-100"></div>
                  <span className="text-[8px] font-black text-gray-300 uppercase tracking-widest">OR</span>
                  <div className="flex-grow h-px bg-gray-100"></div>
                </div>
                <button type="button" onClick={handleGoogleLogin} disabled={loading} className="w-full bg-white border border-gray-100 text-gray-700 font-black py-2.5 rounded-xl shadow-sm hover:bg-gray-50 transition-all text-[10px] flex items-center justify-center gap-2">
                  <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-4 h-4" />
                  Google
                </button>
              </form>

              <div className="mt-6 text-center">
                <p className="text-gray-400 font-bold text-[10px]">{isLogin ? "New here? " : "Joined already? "}<button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 font-black uppercase tracking-widest ml-1 hover:underline">{isLogin ? 'Sign Up' : 'Sign In'}</button></p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
