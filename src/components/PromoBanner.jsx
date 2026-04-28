import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function PromoBanner({ onNavigate }) {
  return (
    <section className="container mx-auto px-6 py-8 mb-8">
      {/* Outer container with the full background image */}
      <div className="relative rounded-2xl overflow-hidden shadow-md min-h-[300px] flex items-center group border border-gray-100">
        
        {/* Full Width Background Image */}
        <div className="absolute inset-0">
          <img 
            src="https://images.cnbctv18.com/wp-content/uploads/2023/12/rice-4-1019x573.jpg" 
            alt="Premium Rice and Flours" 
            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Subtle gradient overlay to make the image darker on the left so the card stands out even more */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900/70 via-gray-900/30 to-transparent pointer-events-none"></div>
        </div>

        {/* Floating Glass Card */}
        <div className="relative z-10 w-full max-w-[420px] mx-6 md:mx-12 bg-white/95 backdrop-blur-xl p-6 md:p-8 rounded-xl shadow-xl border border-white my-6">
          <span className="inline-block bg-emerald-50 text-emerald-600 text-[10px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3 border border-emerald-100 shadow-sm">
            100% Pure & Unpolished
          </span>
          
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-3 leading-tight tracking-tight">
            Premium Rice <br/><span className="text-emerald-600">& Flours</span>
          </h2>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-5 font-medium">
            Experience the finest quality Basmati rice, raw rice, and freshly ground flours. Sourced directly from trusted local farmers for your daily cooking needs.
          </p>
          
          <ul className="space-y-2.5 mb-6 text-gray-700 font-bold text-xs">
             <li className="flex items-center gap-2.5">
               <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[9px]">✓</span> 
               Unpolished & Healthy Rice
             </li>
             <li className="flex items-center gap-2.5">
               <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[9px]">✓</span> 
               Freshly Ground Flours
             </li>
             <li className="flex items-center gap-2.5">
               <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 text-[9px]">✓</span> 
               Rich in Essential Nutrients
             </li>
          </ul>

          <button onClick={() => onNavigate && onNavigate('products')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5 flex items-center gap-2 text-sm w-max group/btn">
            Explore Collection 
            <ArrowRight size={16} className="transform group-hover/btn:translate-x-1 transition-transform" />
          </button>
        </div>

      </div>
    </section>
  );
}
