import React, { useEffect } from 'react';
import { Shield, FileText, Truck, RefreshCw, ArrowLeft } from 'lucide-react';

export default function PolicyPage({ type, onNavigate }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [type]);

  const policies = {
    terms: {
      title: 'Terms & Conditions',
      icon: <FileText className="text-emerald-600" size={32} />,
      lastUpdated: 'May 07, 2026',
      content: [
        {
          heading: '1. Introduction',
          text: 'Welcome to Zudo. By accessing our website and using our services, you agree to be bound by the following terms and conditions. Please read them carefully.'
        },
        {
          heading: '2. Use of Service',
          text: 'Our services are intended for personal, non-commercial use unless you are registered as a B2B partner. You agree not to misuse the services or help anyone else do so.'
        },
        {
          heading: '3. User Accounts',
          text: 'To access certain features, you may need to create an account. You are responsible for maintaining the confidentiality of your account credentials.'
        },
        {
          heading: '4. Pricing and Availability',
          text: 'All prices are subject to change without notice. We reserve the right to modify or discontinue services at any time. In the event of a pricing error, we reserve the right to cancel orders.'
        },
        {
          heading: '5. Intellectual Property',
          text: 'All content on Zudo, including text, graphics, logos, and software, is the property of Zudo or its content suppliers and is protected by international copyright laws.'
        }
      ]
    },
    privacy: {
      title: 'Privacy Policy',
      icon: <Shield className="text-emerald-600" size={32} />,
      lastUpdated: 'May 07, 2026',
      content: [
        {
          heading: '1. Information We Collect',
          text: 'We collect information you provide directly to us, such as when you create an account, place an order, or contact customer support. This includes name, email, phone number, and address.'
        },
        {
          heading: '2. How We Use Your Information',
          text: 'We use your information to process orders, provide customer support, send updates, and improve our services. We do not sell your personal data to third parties.'
        },
        {
          heading: '3. Data Security',
          text: 'We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.'
        },
        {
          heading: '4. Cookies',
          text: 'We use cookies to enhance your browsing experience, remember your preferences, and analyze our traffic. You can manage cookie settings in your browser.'
        },
        {
          heading: '5. Your Rights',
          text: 'You have the right to access, update, or delete your personal information at any time through your profile settings or by contacting us.'
        }
      ]
    },
    shipping: {
      title: 'Shipping Policy',
      icon: <Truck className="text-emerald-600" size={32} />,
      lastUpdated: 'May 07, 2026',
      content: [
        {
          heading: '1. Delivery Areas',
          text: 'Currently, Zudo delivers to selected areas in Bengaluru. We are constantly expanding our reach to serve more customers.'
        },
        {
          heading: '2. Delivery Time',
          text: 'Most orders are delivered within 24-48 hours. Specific delivery slots can be selected during checkout. For B2B orders, delivery times may vary based on quantity.'
        },
        {
          heading: '3. Shipping Charges',
          text: 'We offer free delivery on orders above ₹500. For orders below this amount, a flat shipping fee of ₹50 applies.'
        },
        {
          heading: '4. Order Tracking',
          text: 'Once your order is Shipped, you can track its status in the "My Orders" section of your profile.'
        },
        {
          heading: '5. Delivery OTP',
          text: 'To ensure secure delivery, a 4-digit Delivery OTP is required at the time of collection. Please share this only with our authorized delivery partner.'
        }
      ]
    },
    returns: {
      title: 'Returns & Refunds',
      icon: <RefreshCw className="text-emerald-600" size={32} />,
      lastUpdated: 'May 07, 2026',
      content: [
        {
          heading: '1. Return Eligibility',
          text: 'Products can be returned within 3 days of delivery if they are damaged, defective, or different from what was ordered. Fresh produce must be checked at the time of delivery.'
        },
        {
          heading: '2. Return Process',
          text: 'To initiate a return, go to "My Orders" and select the "Return" option for the eligible order. Our team will verify and arrange for a pickup.'
        },
        {
          heading: '3. Refund Policy',
          text: 'Refunds for cancelled orders or successful returns will be processed within 5-7 business days to the original payment method.'
        },
        {
          heading: '4. Non-Returnable Items',
          text: 'Certain items, such as personal care products or items with broken seals, are non-returnable for hygiene reasons.'
        },
        {
          heading: '5. Cancellation',
          text: 'Orders can be cancelled anytime before they are "Shipped". Once an order is shipped, cancellation is not possible.'
        }
      ]
    }
  };

  const policy = policies[type] || policies.terms;

  return (
    <div className="min-h-screen bg-[#fcfdfd] pb-24">
      {/* Header */}
      <div className="bg-[#107569] pt-12 pb-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <button 
            onClick={() => onNavigate('home')}
            className="inline-flex items-center gap-2 text-emerald-100 hover:text-white font-black text-xs uppercase tracking-widest mb-8 transition-all group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Back to Home
          </button>
          <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-white/10 shadow-xl">
            {React.cloneElement(policy.icon, { className: 'text-white', size: 32 })}
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-4">{policy.title}</h1>
          <p className="text-emerald-100/60 font-bold text-sm">Last Updated: {policy.lastUpdated}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-12 relative z-20">
        <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-2xl shadow-emerald-900/5 border border-gray-100">
          <div className="prose prose-emerald max-w-none space-y-10">
            {policy.content.map((section, idx) => (
              <div key={idx} className="space-y-3">
                <h2 className="text-xl font-black text-gray-900 tracking-tight">{section.heading}</h2>
                <p className="text-gray-600 font-medium leading-relaxed text-lg">
                  {section.text}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-16 pt-10 border-t border-gray-100 text-center">
            <p className="text-gray-400 font-bold text-sm mb-6">Have questions about our {policy.title.toLowerCase()}?</p>
            <button 
              onClick={() => onNavigate('contact')}
              className="px-10 py-4 bg-[#107569] text-white font-black rounded-2xl shadow-xl shadow-emerald-900/10 hover:bg-[#0d6359] transition-all transform hover:-translate-y-1"
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
