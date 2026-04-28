import React from 'react';

const categories = [
  { id: 1, name: 'Pulses & Dals', count: '140+ items', image: 'https://static.toiimg.com/photo/82196489.cms' },
  { id: 2, name: 'Premium Rice', count: '25+ items', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=500' },
  { id: 3, name: 'Flours & Sooji', count: '45+ items', image: 'https://restaurantsupplier1.com/wp-content/uploads/2024/08/Sooji.jpg' },
  { id: 4, name: 'Sugar & Jaggery', count: '15+ items', image:'https://storables.com/wp-content/uploads/2023/09/how-to-store-palm-sugar-1695371267.jpg' },
];

export default function TopCategories({ onNavigate }) {
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
          <div key={cat.id} onClick={() => onNavigate && onNavigate('products')} className="group relative h-40 md:h-48 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer">
            {/* Background Image */}
            <img 
              src={cat.image} 
              alt={cat.name} 
              className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out"
            />
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-70 group-hover:opacity-90 transition-opacity duration-300"></div>
            
            {/* Content */}
            <div className="absolute bottom-0 left-0 w-full p-4 md:p-5 text-white transform translate-y-1 group-hover:translate-y-0 transition-transform duration-300">
              <h3 className="font-extrabold text-lg md:text-xl mb-0.5 drop-shadow-md">{cat.name}</h3>
              <p className="text-gray-200 text-xs md:text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-300 delay-100">{cat.count}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}


