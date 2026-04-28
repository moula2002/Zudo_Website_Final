import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function LoginModal({ onClose }) {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-3xl flex overflow-hidden shadow-2xl relative animate-[fadeIn_0.3s_ease-out]">
        
        {/* Left Side - Image */}
        <div className="w-1/2 hidden md:block relative bg-gray-100">
          <img src="/grains_splash.png" alt="Groceries" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 flex items-end p-6">
            <h3 className="text-white text-2xl font-bold leading-tight">
              Zudo Premium Groceries.<br/>
              <span className="text-emerald-400">Quality you can trust.</span>
            </h3>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full md:w-1/2 p-6 md:p-8 relative bg-white">
          <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors">
            <X size={20} />
          </button>

          <div className="mb-6">
            <h2 className="text-2xl font-extrabold text-black mb-1">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-gray-500 text-sm">
              {isLogin ? 'Please enter your details to sign in.' : 'Join us to get the best quality groceries delivered to you.'}
            </p>
          </div>

          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onClose(); }}>
            {!isLogin && (
              <div className="animate-[fadeIn_0.3s_ease-out]">
                <label className="block text-sm font-bold text-gray-700 mb-1">Full Name</label>
                <input 
                  type="text" 
                  placeholder="Enter your full name" 
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition-all text-sm" 
                  required 
                />
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
              {isLogin ? 'Sign In' : 'Sign Up'}
            </button>
          </form>

          <p className="text-center mt-6 text-sm text-gray-600">
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button onClick={() => setIsLogin(!isLogin)} className="font-bold text-emerald-600 hover:underline">
              {isLogin ? 'Sign up for free' : 'Sign in here'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}


