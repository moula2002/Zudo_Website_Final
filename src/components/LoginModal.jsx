import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function LoginModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isB2B, setIsB2B] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isB2B) {
      window.dispatchEvent(new CustomEvent('b2b-login'));
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl flex overflow-hidden shadow-2xl relative animate-[fadeIn_0.3s_ease-out]">
        
        {/* Left Side - Image */}
        <div className="w-1/2 hidden md:block relative bg-gray-100">
          <img 
            src={isB2B ? "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=800" : "/grains_splash.png"} 
            alt="Groceries" 
            className="absolute inset-0 w-full h-full object-cover transition-all duration-700" 
          />
          <div className="absolute inset-0 bg-black/40 flex items-end p-6">
            <h3 className="text-white text-2xl font-bold leading-tight">
              {isB2B ? 'Zudo B2B Solutions.' : 'Zudo Premium Groceries.'}<br/>
              <span className="text-emerald-400">{isB2B ? 'Wholesale prices for your business.' : 'Quality you can trust.'}</span>
            </h3>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-8 relative bg-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>

          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl font-extrabold text-black">
                {isLogin ? (isB2B ? 'Business Login' : 'Welcome Back') : (isB2B ? 'Business Registration' : 'Create Account')}
              </h2>
              {isB2B && <span className="bg-emerald-600 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">B2B</span>}
            </div>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Please enter your details to sign in.' : (isB2B ? 'Register your business to unlock bulk pricing.' : 'Join us to get the best quality groceries delivered to you.')}
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="animate-[fadeIn_0.3s_ease-out] space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1">{isB2B ? 'Company Name' : 'Full Name'}</label>
                  <input 
                    type="text" 
                    placeholder={isB2B ? "Enter company name" : "Enter your full name"} 
                    className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-sm" 
                    required 
                  />
                </div>

                {isB2B && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Business Documents (PDF only)</label>
                    <div className="relative group">
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-xs file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-black file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
                        required 
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Email Address</label>
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-sm" 
                required 
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-sm" 
                required 
              />
            </div>
            
            {isLogin && (
              <div className="flex items-center justify-between animate-[fadeIn_0.3s_ease-out]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="rounded border-gray-300 w-3.5 h-3.5 accent-emerald-600" />
                  <span className="text-sm text-gray-600 font-medium">Remember me</span>
                </label>
                <a href="#" className="text-sm font-bold text-emerald-600 hover:underline">Forgot Password?</a>
              </div>
            )}

            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-emerald-600/30 transform hover:-translate-y-0.5 transition-all text-sm mt-2">
              {isLogin ? (isB2B ? 'Business Sign In' : 'Sign In') : (isB2B ? 'Register Business' : 'Sign Up')}
            </button>

            {isLogin && !isB2B && (
              <>
                <div className="relative flex items-center gap-4 py-2">
                  <div className="flex-grow h-px bg-gray-100"></div>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">or</span>
                  <div className="flex-grow h-px bg-gray-100"></div>
                </div>

                <button 
                  type="button"
                  onClick={() => setIsB2B(true)}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-lg shadow-lg shadow-gray-900/20 transform hover:-translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <div className="w-5 h-5 rounded bg-emerald-500 flex items-center justify-center text-[10px] font-black">B2B</div>
                  Business Portal
                </button>
              </>
            )}

            {isB2B && (
              <button 
                type="button"
                onClick={() => { setIsB2B(false); setIsLogin(true); }}
                className="w-full text-center text-xs font-bold text-gray-400 hover:text-emerald-600 transition-colors mt-4"
              >
                &larr; Back to Regular Login
              </button>
            )}
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-emerald-600 hover:underline">
              {isLogin ? (isB2B ? 'Register Business' : 'Create one here') : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
