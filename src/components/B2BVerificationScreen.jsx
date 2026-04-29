import React from 'react';
import { ShieldCheck, Clock, FileText, ArrowRight, CheckCircle2, X } from 'lucide-react';

export default function B2BVerificationScreen({ onSkip, onBack }) {
  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] relative">
        <button onClick={onBack} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors">
          <X size={24} />
        </button>

        <div className="p-8 sm:p-10">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
              <div className="absolute inset-0 rounded-2xl border-2 border-emerald-500 border-t-transparent animate-spin"></div>
              <Clock size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Verification in Progress</h1>
            <p className="text-gray-500 text-sm font-medium px-4">
              We're reviewing your business documents. This typically takes 24-48 hours.
            </p>
          </div>

          {/* Status Steps */}
          <div className="space-y-3 mb-8">
            <div className="bg-emerald-50 border border-emerald-100/50 rounded-xl p-4 flex items-center gap-4 transition-all">
              <div className="w-10 h-10 bg-emerald-500 rounded-lg flex items-center justify-center text-white shrink-0">
                <FileText size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 text-sm leading-none mb-1">Documents Received</h3>
                <p className="text-emerald-700 text-[10px] font-black uppercase tracking-wider">Completed</p>
              </div>
              <CheckCircle2 size={20} className="text-emerald-500" />
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4 relative overflow-hidden group">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500 animate-pulse"></div>
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-emerald-600 border border-gray-100 shrink-0 shadow-sm">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 text-sm leading-none mb-1">Admin Verification</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">In Review Queue</p>
              </div>
              <div className="flex gap-1">
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-1 h-1 rounded-full bg-emerald-500 animate-bounce"></div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={onSkip}
              className="w-full bg-[#107569] hover:bg-[#0d6359] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#107569]/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group text-sm"
            >
              Skip for Testing
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onBack}
              className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors text-xs"
            >
              Cancel and Return to Store
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
