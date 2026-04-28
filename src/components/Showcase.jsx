import React from 'react';
import { Leaf, ShieldCheck, Truck, Sparkles, Star } from 'lucide-react';

export default function Showcase() {
  return (
    <section className="container mx-auto px-6 py-16 bg-white">
      <div className="flex flex-col md:flex-row items-center gap-12 max-w-5xl mx-auto">
        
        {/* Left Column - Image Showcase */}
        <div className="w-full md:w-1/2 flex justify-center relative py-6">
          {/* Decorative Background Blob */}
          <div className="absolute inset-0 bg-emerald-50 rounded-full w-[280px] h-[280px] md:w-[350px] md:h-[350px] m-auto -z-10"></div>
          
          {/* Main Image */}
          <div className="relative w-full max-w-sm z-10">
            <img 
              src="/grains_splash.png" 
              alt="Premium Grains Showcase" 
              className="w-full h-auto object-contain drop-shadow-xl animate-[float_6s_ease-in-out_infinite]"
            />
            
            {/* Floating Badge 1 - Rating */}
            <div className="absolute top-4 -right-2 md:-right-6 bg-white/90 backdrop-blur-sm border border-emerald-100 px-3 py-2 md:p-3 rounded-xl shadow-lg flex items-center gap-2 animate-[float_5s_ease-in-out_infinite_reverse]">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
                <Star size={14} className="text-yellow-500 fill-yellow-500" />
              </div>
              <div>
                <p className="text-gray-900 font-extrabold text-xs">4.9/5 Rating</p>
              </div>
            </div>

            {/* Floating Badge 2 - Quality */}
            <div className="absolute bottom-6 -left-2 md:-left-6 bg-white/90 backdrop-blur-sm border border-emerald-100 px-3 py-2 rounded-xl shadow-lg flex items-center gap-2 animate-[float_7s_ease-in-out_infinite]">
              <Sparkles size={14} className="text-emerald-500" />
              <span className="text-gray-900 font-extrabold text-xs">100% Organic</span>
            </div>
          </div>
        </div>

        {/* Right Column - Text Content */}
        <div className="w-full md:w-1/2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px] tracking-widest uppercase mb-4 border border-emerald-100">
            <ShieldCheck size={12} /> Why Choose Us
          </div>
          
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 leading-[1.15] mb-5 tracking-tight">
            Best quality grocery<br /><span className="text-emerald-600">just for you.</span>
          </h2>
          
          <p className="text-gray-500 text-sm md:text-base mb-8 max-w-md leading-relaxed font-medium">
            We prioritize quality in each of our groceries. Experience farm-fresh produce, premium grains, and unbeatable service delivered right to your door.
          </p>
          
          <div className="space-y-6">
            {/* Feature 1 */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Premium Quality</h3>
                <p className="text-gray-500 text-sm font-medium">Sourced directly from certified farms.</p>
              </div>
            </div>
            
            {/* Feature 2 */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600 shadow-sm">
                <Leaf size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Fresh & Natural</h3>
                <p className="text-gray-500 text-sm font-medium">No artificial preservatives or chemicals.</p>
              </div>
            </div>
            
            {/* Feature 3 */}
            <div className="flex items-start gap-4 group">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition-colors text-emerald-600 shadow-sm">
                <Truck size={20} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 mb-0.5">Express Delivery</h3>
                <p className="text-gray-500 text-sm font-medium">Lightning-fast doorstep delivery.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}


