import React, { useState, useEffect } from 'react';
import { Lock, CheckCircle2, AlertTriangle, ArrowLeft } from 'lucide-react';
import { API_URL } from '../config';

export default function ResetPasswordPage({ onNavigate }) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    // Extract token from URL /reset-password/TOKEN
    const path = window.location.pathname;
    const tokenMatch = path.match(/\/reset-password\/(.+)/);
    if (tokenMatch && tokenMatch[1]) {
      setToken(tokenMatch[1]);
    } else {
      setError('Invalid or missing reset token.');
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');

      setSuccess(true);
      setTimeout(() => {
        window.history.pushState({}, '', '/');
        onNavigate('home');
      }, 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md p-8 md:p-12 shadow-2xl relative overflow-hidden">
        <div className="mb-8 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight mb-1">Reset Password</h2>
          <p className="text-emerald-600 font-black text-[10px] uppercase tracking-[0.2em]">Secure your account</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 text-xs font-bold rounded-2xl flex items-center gap-3">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Password Reset Successful!</h3>
            <p className="text-gray-500 text-sm">Your password has been updated. Redirecting you to login...</p>
            <button 
              onClick={() => {
                window.history.pushState({}, '', '/');
                onNavigate('home');
              }}
              className="px-6 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 transition-all"
            >
              Go to Home
            </button>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="New Password" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" 
                required 
              />
            </div>

            <div className="relative group">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={16} />
              <input 
                type="password" 
                value={confirmPassword} 
                onChange={(e) => setConfirmPassword(e.target.value)} 
                placeholder="Confirm New Password" 
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-100 bg-gray-50/50 focus:bg-white text-xs font-bold" 
                required 
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !token} 
              className={`w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-xl shadow-lg transition-all text-sm mt-4 flex items-center justify-center gap-2 ${loading || !token ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Update Password'
              )}
            </button>

            <button 
              type="button" 
              onClick={() => {
                window.history.pushState({}, '', '/');
                onNavigate('home');
              }} 
              className="w-full flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-emerald-600 transition-colors mt-4"
            >
              <ArrowLeft size={12} /> Back to Home
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
