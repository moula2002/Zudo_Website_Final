import React from 'react';
import { MapPin, CheckCircle, Star, ShoppingBag } from 'lucide-react';

export default function Hero({ onNavigate }) {
  return (
    <main className="container mx-auto px-6 pt-8 pb-16 relative flex flex-col lg:flex-row items-center">
        
        {/* Left Column - Text Content */}
        <div className="w-full lg:w-[50%] z-20 relative">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-1.5 rounded-full mb-5 border border-white/20 shadow-sm cursor-default">
            <div className="bg-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] shadow-inner text-black">🌾</div>
            <span className="text-xs font-semibold text-white tracking-wide">Premium Quality Grains & Pulses</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-4 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-50 to-teal-200">
            Get pure Grocery<br />
            <span className="font-semibold text-emerald-100 opacity-90">Nourish your life.</span>
          </h1>
          
          <p className="text-emerald-50 text-base md:text-lg max-w-lg mb-8 leading-relaxed opacity-90">
            Order premium quality <span className="text-white font-bold">Rice, Pulses, BTC, Flours & Sooji</span>, and more directly to your doorstep.
          </p>
          
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate && onNavigate('products')} className="flex items-center gap-2 bg-white hover:bg-gray-200 text-black px-6 py-3 rounded-full font-bold transition-all shadow-lg transform hover:-translate-y-0.5">
              <ShoppingBag size={18} />
              Shop Now
            </button>
            <button onClick={() => onNavigate && onNavigate('products')} className="px-6 py-3 rounded-full font-semibold text-white border border-white/20 hover:bg-white/10 transition-colors backdrop-blur-sm">
              View Categories
            </button>
          </div>
        </div>

        {/* Right Column - Hero Image */}
        <div className="w-full lg:w-[50%] relative mt-16 lg:mt-0 flex justify-center lg:justify-end z-10">
          
          {/* Main Grains Image Container */}
          <div className="relative w-[280px] md:w-[380px] h-[340px] md:h-[480px] z-10">
            <div className="w-full h-full rounded-3xl overflow-hidden border-4 md:border-[6px] border-white/10 shadow-2xl relative bg-[#064e3b]/50 backdrop-blur-sm group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#022c22] via-transparent to-transparent z-10 pointer-events-none opacity-80 group-hover:opacity-60 transition-opacity duration-500"></div>
              <img 
                src="/zudo_hero.png" 
                alt="Premium Zudo Grains" 
                className="w-full h-full object-cover relative z-0 transform group-hover:scale-105 transition-transform duration-700 ease-out" 
              />
            </div>
          </div>
          
          <div className="absolute top-20 -right-2 md:top-28 md:-right-8 bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/20 shadow-xl z-20 w-32 md:w-40 transform rotate-3 hover:rotate-0 transition-transform duration-300">
            <div className="bg-white rounded-xl w-10 h-10 md:w-12 md:h-12 flex items-center justify-center mb-2 mx-auto shadow-inner text-black">
              <span className="text-xl md:text-2xl drop-shadow-sm">🌾</span>
            </div>
            <div className="flex items-center gap-1 justify-center text-white text-xs md:text-sm font-bold drop-shadow-sm">
              <CheckCircle size={14} className="text-white" /> 100% Pure
            </div>
          </div>
          
          <div className="absolute bottom-6 -left-4 md:bottom-12 md:-left-12 bg-white/10 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-white/20 shadow-xl z-20 flex items-center gap-3 md:gap-4 animate-[pulse_5s_infinite]">
            <div className="flex -space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-emerald-800 flex items-center justify-center text-xs md:text-sm bg-emerald-100 shadow-md">👩🏽</div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-emerald-800 flex items-center justify-center text-xs md:text-sm bg-gray-100 shadow-md">👨🏻</div>
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-emerald-800 flex items-center justify-center text-xs md:text-sm bg-teal-100 shadow-md">👩🏼</div>
            </div>
            <div>
              <div className="font-bold text-xs md:text-sm text-white drop-shadow-sm">Happy Customers</div>
              <div className="flex items-center text-[10px] md:text-xs text-white mt-0.5">
                <Star size={12} className="text-white fill-white mr-1 drop-shadow-sm" />
                <span className="font-bold text-white mr-1">4.8</span> (2.4K+)
              </div>
            </div>
          </div>
          
        </div>
      </main>
  );
}
