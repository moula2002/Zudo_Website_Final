import React from 'react';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

const FacebookIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
);

const TwitterIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path></svg>
);

const InstagramIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
);

export default function Footer({ onNavigate }) {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 pt-16 pb-8 mt-12 text-gray-600">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Company Info */}
          <div>
            <div className="mb-6">
              <img src="/logo.png" alt="Zudo Logo" className="h-12 w-auto object-contain drop-shadow-sm" />
            </div>
            <p className="text-sm leading-relaxed mb-6">
              Your trusted partner for premium quality groceries. We deliver the freshest grains, pulses, and daily essentials straight to your doorstep, ensuring health and happiness in every meal.
            </p>
            <div className="flex gap-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-600 transition-colors shadow-sm">
                <FacebookIcon />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-600 transition-colors shadow-sm">
                <TwitterIcon />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-500 hover:text-green-600 hover:border-green-600 transition-colors shadow-sm">
                <InstagramIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-green-600 transition-colors">About Us</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('contact'); }} className="hover:text-green-600 transition-colors">Contact Us</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Our Services</a></li>
              <li><a href="#" onClick={(e) => { e.preventDefault(); onNavigate && onNavigate('products'); }} className="hover:text-green-600 transition-colors">Shop by Category</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Track Your Order</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Terms & Conditions</a></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Categories</h3>
            <ul className="space-y-3">
              <li><a href="#" className="hover:text-green-600 transition-colors">Premium Rice</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Organic Pulses</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Flours & Sooji</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">Sugar & Jaggery</a></li>
              <li><a href="#" className="hover:text-green-600 transition-colors">BTC Essentials</a></li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="text-gray-900 font-bold text-lg mb-6">Newsletter</h3>
            <p className="text-sm mb-4">Subscribe to get updates on our latest offers and fresh arrivals.</p>
            <div className="flex items-center mb-6">
              <input 
                type="email" 
                placeholder="Your email address" 
                className="w-full bg-white border border-gray-300 rounded-l-lg px-4 py-2.5 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 text-sm"
              />
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-r-lg transition-colors border border-green-600">
                <Send size={18} />
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-green-600 shrink-0 mt-0.5" />
                <span>Bharath nagar, 2nd stage, magadi main road, bangaluru,560091
</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone size={18} className="text-green-600 shrink-0" />
                <span>+91 98765 43210</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={18} className="text-green-600 shrink-0" />
                <span>snbtrading.co.2024@gmail.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>&copy; {new Date().getFullYear()} Zudo Groceries. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:text-green-600 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-green-600 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-green-600 transition-colors">Returns</a>
          </div>
        </div>
      </div>
    </footer>
  );
}


