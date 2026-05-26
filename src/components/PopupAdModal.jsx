import React, { useState, useEffect } from 'react';
import { X, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react';
import { API_URL, IMAGE_BASE_URL, cleanImageUrl } from '../config';

const PopupAdModal = () => {
  const [ads, setAds] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const fetchAds = async () => {
      try {
        const savedCity = localStorage.getItem('selectedCity');
        const savedTenantId = localStorage.getItem('zudo_tenant_id');
        const locationHeader = savedTenantId || savedCity || '';

        const response = await fetch(`${API_URL}/ads/popup`, {
          headers: {
            'x-location': locationHeader,
            'x-tenant-id': locationHeader
          }
        });
        const data = await response.json();
        
        if (data && data.length > 0) {
          setAds(data);
          setTimeout(() => {
            setIsVisible(true);
          }, 1500);
        }
      } catch (error) {
        console.error('Failed to fetch popup ads:', error);
      }
    };

    fetchAds();
  }, []);

  // Auto-cycle through ads
  useEffect(() => {
    if (isVisible && ads.length > 1 && !closing) {
      const timer = setInterval(() => {
        setCurrentIndex(prev => (prev + 1) % ads.length);
      }, 5000); // Change ad every 5 seconds
      return () => clearInterval(timer);
    }
  }, [isVisible, ads.length, closing]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setIsVisible(false);
    }, 500);
  };

  const nextAd = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev + 1) % ads.length);
  };

  const prevAd = (e) => {
    e.stopPropagation();
    setCurrentIndex(prev => (prev - 1 + ads.length) % ads.length);
  };

  if (!isVisible || ads.length === 0) return null;

  const currentAd = ads[currentIndex];

  return (
    <div className={`fixed inset-0 z-[10000] flex items-center justify-center p-4 transition-all duration-500 ${closing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-500" 
        onClick={handleClose}
      />
      
      {/* Modal Content */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#121212] rounded-[32px] overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.5)] border border-white/10 group">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 border border-white/10"
        >
          <X size={20} />
        </button>

        {/* Navigation Arrows (Only if multiple ads) */}
        {ads.length > 1 && (
          <>
            <button onClick={prevAd} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/20 hover:bg-emerald-600 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg">
              <ChevronLeft size={20} />
            </button>
            <button onClick={nextAd} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/20 hover:bg-emerald-600 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg">
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Ad Image & Content */}
        <div className="relative aspect-[4/5] md:aspect-square overflow-hidden">
          {ads.map((ad, index) => (
            <div 
              key={ad._id}
              className={`absolute inset-0 transition-all duration-700 ease-in-out ${index === currentIndex ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-full'}`}
            >
              <img 
                src={cleanImageUrl(ad.imageUrl)} 
                alt={ad.title}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Gradient */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-8 text-white">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">
                  Special Offer {ads.length > 1 && `(${index + 1}/${ads.length})`}
                </span>
                <h3 className="text-2xl md:text-3xl font-black tracking-tight mb-2 leading-tight">
                  {ad.title}
                </h3>
                
                {ad.link && (
                  <a 
                    href={ad.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-600/20 w-fit mt-4 group/btn"
                  >
                    Explore Now
                    <ExternalLink size={14} className="group-hover/btn:translate-x-1 group-hover/btn:-translate-y-1 transition-transform" />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Progress Dots (Only if multiple ads) */}
        {ads.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {ads.map((_, i) => (
              <div 
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 bg-emerald-500' : 'w-2 bg-white/30'}`}
              />
            ))}
          </div>
        )}

        {/* Timer Progress Bar */}
        <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 overflow-hidden">
          <div 
            key={currentIndex}
            className="h-full bg-emerald-500 animate-[progress_5s_linear]" 
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default PopupAdModal;
