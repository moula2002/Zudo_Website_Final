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
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

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

      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      try {
        const response = await fetch(`${API_URL}/auth/google-login`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          },
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
            headers: { 
              'Content-Type': 'application/json',
              'x-location': locationHeader,
              'x-tenant-id': locationHeader
            },
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
    let userData = data.user || { ...data, token: undefined };
    
    // Ensure profileImage is set for frontend consistency
    userData = {
      ...userData,
      profileImage: userData.profilePicture || userData.profileImage
    };

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

    const endpoint = isLogin ? '/auth/user-login' : '/auth/register';
    
    try {


      const payload = isLogin 
        ? { email: formData.email, password: formData.password, role: isB2B ? 'b2b' : 'b2c' }
        : { 
            name: formData.name, 
            email: formData.email, 
            password: formData.password,
            phone: formData.phone,
            role: isB2B ? 'b2b' : 'b2c',
            businessName: isB2B ? formData.companyName : '',
            gstPdf: ''
          };

      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
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

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setError('');
    setForgotSuccess('');

    try {
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify({ email: forgotEmail, role: isB2B ? 'b2b' : 'b2c' })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send reset email');

      setForgotSuccess('Reset link sent! Please check your email.');
      // If in test mode (no email config), we might show the token but better to just show success
      if (data.resetUrl) {
        console.log('Test Reset URL:', data.resetUrl);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-white dark:bg-[#121212] rounded-3xl w-full max-w-md flex overflow-hidden shadow-2xl relative animate-[fadeIn_0.3s_ease-out] border border-white/5">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black dark:hover:text-white transition-all z-[110] bg-gray-50 dark:bg-white/10 p-1.5 rounded-full">
          <X size={18} />
        </button>

        {!selection ? (
          <div className="w-full flex flex-col md:flex-row min-h-[400px]">
             <div className="flex-1 group relative overflow-hidden flex flex-col items-center justify-center p-8 transition-all duration-700 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/10 border-r border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-black">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-emerald-600/20 group-hover:scale-110 transition-all duration-500">
                    <UserCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Personal</h3>
                  <p className="text-gray-600 dark:text-gray-400 font-bold text-xs max-w-[200px]">Shop our fresh grocery collection.</p>
                  <button onClick={() => { setSelection('b2c'); setIsB2B(false); }} className="mt-6 px-6 py-3 bg-transparent border-2 border-emerald-600 text-emerald-400 font-black text-xs rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-300 shadow-lg shadow-emerald-600/5">Continue as Customer</button>
                </div>
             </div>

             <div className="flex-1 group relative overflow-hidden flex flex-col items-center justify-center p-8 transition-all duration-700 hover:bg-gray-50 dark:hover:bg-white/5 bg-white dark:bg-[#121212]">
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-20 h-20 bg-gray-900 dark:bg-emerald-600 rounded-2xl flex items-center justify-center text-white mb-6 shadow-xl shadow-gray-900/20 dark:shadow-emerald-600/20 group-hover:scale-110 transition-all duration-500">
                    <Building2 size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">Business</h3>
                  <p className="text-gray-500 dark:text-gray-400 font-bold text-xs max-w-[200px]">Bulk pricing and wholesale distributions.</p>
                  <button onClick={() => { setSelection('b2b'); setIsB2B(true); }} className="mt-6 px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-xs rounded-xl hover:bg-emerald-600 hover:text-white transition-all duration-300">Partner Portal</button>
                </div>
             </div>
          </div>
        ) : (
          <div className="w-full p-8 md:p-12 relative bg-white dark:bg-[#121212] flex flex-col justify-center max-h-[90vh] overflow-y-auto">
            <div className="mb-8 text-center">
              <button onClick={() => { setSelection(null); setIsB2B(false); }} className="mx-auto flex items-center gap-2 text-emerald-600 font-black text-[9px] uppercase tracking-widest mb-6 hover:translate-x-[-2px] transition-transform w-fit"><ArrowLeft size={12} strokeWidth={3} />Change Account Type</button>
              
              <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
                {isB2B ? <Building2 size={32} /> : <ShoppingBag size={32} />}
              </div>
              
              <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Welcome to Zudo</h2>
              <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">buy more enjoy more</p>
              {isB2B && <span className="inline-block mt-3 bg-gray-900 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">B2B Portal</span>}
            </div>

              {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black rounded-xl">{error}</div>}

              {!isForgotMode ? (
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

                {isLogin && (
                  <div className="flex justify-end">
                    <button 
                      type="button" 
                      onClick={() => { setIsForgotMode(true); setError(''); setForgotSuccess(''); }} 
                      className="text-[10px] font-black text-emerald-600 uppercase tracking-widest hover:underline"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}

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
            ) : (
              <form className="space-y-4" onSubmit={handleForgotSubmit}>
                <div className="relative group">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
                  <input 
                    type="email" 
                    value={forgotEmail} 
                    onChange={(e) => setForgotEmail(e.target.value)} 
                    placeholder="Enter your email" 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" 
                    required 
                  />
                </div>

                {forgotSuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-[10px] font-black rounded-xl flex items-center gap-2">
                    <CheckCircle2 size={14} />
                    {forgotSuccess}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={forgotLoading} 
                  className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 rounded-xl shadow-lg transition-all text-xs mt-2 flex items-center justify-center gap-2 ${forgotLoading ? 'opacity-70' : ''}`}
                >
                  {forgotLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Send Reset Link'}
                </button>

                <button 
                  type="button" 
                  onClick={() => setIsForgotMode(false)} 
                  className="w-full text-center text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors"
                >
                  Back to Login
                </button>
              </form>
            )}

            {!isForgotMode && (
              <div className="mt-6 text-center">
                <p className="text-gray-400 font-bold text-[10px]">{isLogin ? "New here? " : "Joined already? "}<button onClick={() => setIsLogin(!isLogin)} className="text-emerald-600 font-black uppercase tracking-widest ml-1 hover:underline">{isLogin ? 'Sign Up' : 'Sign In'}</button></p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
