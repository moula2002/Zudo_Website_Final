import React from 'react';
import { Star, Quote } from 'lucide-react';

export default function Testimonials() {
  const reviews = [
    {
      id: 1,
      name: "Anjali Sharma",
      role: "Home Chef",
      image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=150",
      text: "The quality of pulses and grains is absolutely unmatched. It feels like getting produce straight from the farm. Zudo has completely changed how I shop for my daily groceries!",
      rating: 5
    },
    {
      id: 2,
      name: "Vikram Singh",
      role: "Restaurant Owner",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=150",
      text: "I order all my bulk spices and premium basmati rice from here. The delivery is always on time, and the packaging ensures everything stays incredibly fresh and aromatic.",
      rating: 5
    },
    {
      id: 3,
      name: "Priya Desai",
      role: "Fitness Enthusiast",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=150",
      text: "Finding genuine organic jaggery and unpolished dals was difficult until I found this store. Highly recommend to anyone who truly values their health and diet.",
      rating: 4
    }
  ];

  return (
    <section className="bg-emerald-50/50 py-24 relative overflow-hidden mt-10">
      {/* Decorative glowing blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-emerald-200 rounded-full mix-blend-multiply filter blur-[100px] opacity-40 -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-300 rounded-full mix-blend-multiply filter blur-[100px] opacity-30 translate-x-1/2 translate-y-1/2"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="text-emerald-600 font-extrabold tracking-widest text-xs md:text-sm mb-3 uppercase">Customer Stories</div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-gray-900 mb-6">Loved by Thousands</h2>
          <p className="text-gray-500 text-lg font-medium">See what our community has to say about their experience with our premium groceries.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map(review => (
            <div key={review.id} className="bg-white rounded-3xl p-8 md:p-10 shadow-sm border border-gray-100 relative hover:-translate-y-2 transition-transform duration-500 group flex flex-col h-full">
              <Quote size={40} className="absolute top-8 right-8 text-emerald-50 opacity-50 group-hover:text-emerald-100 transition-colors" />
              
              <div className="flex text-yellow-400 mb-6">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} size={18} className={i < review.rating ? "fill-yellow-400" : "fill-gray-200 text-gray-200"} />
                ))}
              </div>
              
              <p className="text-gray-600 italic mb-10 leading-relaxed relative z-10 text-sm md:text-base flex-grow">
                "{review.text}"
              </p>
              
              <div className="flex items-center gap-4 mt-auto">
                <img src={review.image} alt={review.name} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-50" />
                <div>
                  <h4 className="font-extrabold text-gray-900 text-sm md:text-base">{review.name}</h4>
                  <p className="text-emerald-600 text-xs font-bold uppercase tracking-wider mt-1">{review.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


