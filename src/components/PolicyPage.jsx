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
      lastUpdated: 'June 01, 2026',
      content: [
        {
          heading: '',
          text: 'Welcome to Zudo. Your privacy is important to us. This Privacy Policy explains how we collect, use, and protect your information when you use our website and mobile application.'
        },
        {
          heading: '1. Information We Collect',
          text: (
            <div className="space-y-4">
              <div>
                <strong className="text-gray-900 block mb-1">a. Personal Information</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Name</li>
                  <li>Email address</li>
                  <li>Phone number</li>
                  <li>Shipping and billing address</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-900 block mb-1">b. Account Information</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Login credentials (if you create an account)</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-900 block mb-1">c. Transaction Information</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Order details</li>
                  <li>Payment information (processed securely via third-party payment providers)</li>
                </ul>
              </div>
              <div>
                <strong className="text-gray-900 block mb-1">d. Device & Usage Information</strong>
                <ul className="list-disc pl-5 space-y-1">
                  <li>Device type</li>
                  <li>IP address</li>
                  <li>Browser type</li>
                  <li>App usage data</li>
                </ul>
              </div>
            </div>
          )
        },
        {
          heading: '2. How We Use Your Information',
          text: (
            <ul className="list-disc pl-5 space-y-1">
              <li>Process and deliver your orders</li>
              <li>Provide customer support</li>
              <li>Improve our app and services</li>
              <li>Send order updates and notifications</li>
              <li>Prevent fraud and enhance security</li>
            </ul>
          )
        },
        {
          heading: '3. Sharing Your Information',
          text: (
            <div className="space-y-3">
              <p>We do not sell your personal data. We may share your information with:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Payment gateways (to process payments securely)</li>
                <li>Delivery partners (to ship your orders)</li>
                <li>Service providers (hosting, analytics, etc.)</li>
              </ul>
              <p>These partners are required to keep your information secure.</p>
            </div>
          )
        },
        {
          heading: '4. Cookies and Tracking Technologies',
          text: (
            <div className="space-y-3">
              <ul className="list-disc pl-5 space-y-1">
                <li>Enhance user experience</li>
                <li>Analyze app and website traffic</li>
                <li>Remember your preferences</li>
              </ul>
              <p>You can disable cookies through your browser settings.</p>
            </div>
          )
        },
        {
          heading: '5. Data Security',
          text: 'We take appropriate security measures to protect your data from unauthorized access, alteration, or disclosure.'
        },
        {
          heading: '6. Your Rights',
          text: (
            <ul className="list-disc pl-5 space-y-1">
              <li>Access your personal data</li>
              <li>Update or correct your information</li>
              <li>Request deletion of your account</li>
            </ul>
          )
        },
        {
          heading: '7. Children’s Privacy',
          text: 'Zudo does not knowingly collect data from children under 13 years of age. If we become aware of such data, we will delete it.'
        },
        {
          heading: '8. Third-Party Links',
          text: 'Our app or website may contain links to third-party websites. We are not responsible for their privacy practices.'
        },
        {
          heading: '9. Changes to This Policy',
          text: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated effective date.'
        },
        {
          heading: '10. Contact Us',
          text: (
            <div className="space-y-3">
              <p>If you have any questions about this Privacy Policy:</p>
              <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-1.5 text-sm font-semibold">
                <p><span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mr-2">Email:</span> <a href="mailto:snbtrading.co.2024@gmail.com" className="text-emerald-600 hover:underline">snbtrading.co.2024@gmail.com</a></p>
                <p><span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mr-2">Phone:</span> <a href="tel:+919876543210" className="text-emerald-600 hover:underline">+91 98765 43210</a></p>
                <p className="flex items-start"><span className="text-gray-400 font-bold uppercase tracking-wider text-[10px] mr-2 mt-0.5">Address:</span> <span className="text-gray-600 text-left">Bharath nagar, 2nd stage, magadi main road, bangaluru, 560091</span></p>
              </div>
            </div>
          )
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
                {section.heading && <h2 className="text-xl font-black text-gray-900 tracking-tight">{section.heading}</h2>}
                <div className="text-gray-600 font-medium leading-relaxed text-lg">
                  {section.text}
                </div>
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
