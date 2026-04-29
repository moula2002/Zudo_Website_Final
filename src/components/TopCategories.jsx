import React from 'react';

const categories = [
  { id: 1, name: 'Pulses & Dals', categoryKey: 'Pulses', count: '140+ items', image: 'https://static.toiimg.com/photo/82196489.cms' },
  { id: 2, name: 'Premium Rice', categoryKey: 'Rice', count: '25+ items', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500' },
  { id: 3, name: 'Flours & Sooji', categoryKey: 'Flours', count: '45+ items', image: 'https://restaurantsupplier1.com/wp-content/uploads/2024/08/Sooji.jpg' },
  { id: 4, name: 'Sugar & Jaggery', categoryKey: 'Sugar', count: '15+ items', image:'https://storables.com/wp-content/uploads/2023/09/how-to-store-palm-sugar-1695371267.jpg' },
];

export default function TopCategories({ onNavigate, onCategoryClick }) {
  return (
    <section className="container mx-auto px-6 py-12 md:py-16">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-1.5">Shop by Category</h2>
          <p className="text-gray-500 font-medium text-sm md:text-base">Explore our wide range of premium products</p>
        </div>
        <a href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('products'); }} className="font-bold text-gray-900 border-b-2 border-black pb-0.5 text-sm md:text-base hover:text-gray-600 hover:border-gray-600 transition-colors">
          Browse All Categories &rarr;
        </a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
        {categories.map((cat) => (
          <div key={cat.id} onClick={() => onCategoryClick ? onCategoryClick(cat.categoryKey) : (onNavigate && onNavigate('products'))} className="group relative h-48 md:h-56 rounded-[2.5rem] overflow-hidden shadow-sm hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500 cursor-pointer transform hover:-translate-y-3">
            {/* Background Image */}
            <img 
              src={cat.image} 
              alt={cat.name} 
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-[1.5s] ease-out"
            />
            {/* Glossy Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500"></div>
            
            {/* Glass effect on hover */}
            <div className="absolute inset-0 bg-emerald-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-6 md:p-8 text-white z-10">
              <div className="overflow-hidden">
                <h3 className="font-black text-xl md:text-2xl mb-1 drop-shadow-2xl transform translate-y-0 group-hover:-translate-y-1 transition-transform duration-500">
                  {cat.name}
                </h3>
              </div>
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="h-[2px] w-0 bg-emerald-400 group-hover:w-8 transition-all duration-500"></div>
                <p className="text-emerald-400 text-xs md:text-sm font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-500 delay-100">
                  {cat.count}
                </p>
              </div>
            </div>

            {/* Decorative element */}
            <div className="absolute top-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-500">
               <span className="text-white text-xl">→</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


