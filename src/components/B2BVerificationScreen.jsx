import React, { useState } from 'react';
import { ShieldCheck, Clock, FileText, ArrowRight, CheckCircle2, X, Upload, FileUp, AlertCircle } from 'lucide-react';

export default function B2BVerificationScreen({ onSkip, onBack, user, onUpdateUser }) {
  const [uploading, setUploading] = useState(false);
  const [docUrl, setDocUrl] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('pending'); // pending, uploaded, verified

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please upload a PDF or Image (JPG/PNG)');
      return;
    }

    setUploading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('file', file);

    const uploadBase = 'https://lightgreen-trout-176417.hostingersite.com';
    const apiBase = 'https://zudo.onrender.com';

    try {
      const response = await fetch(`${uploadBase}/api/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const fullUrl = `${uploadBase}${data.url}`;
      setDocUrl(fullUrl);
      setStatus('uploaded');
      
      // Update user verification document in LOCAL backend
      const updateRes = await fetch(`${apiBase}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ businessDocument: fullUrl })
      });

      if (updateRes.ok) {
        const updatedUser = await updateRes.json();
        if (onUpdateUser) onUpdateUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

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
              <ShieldCheck size={28} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">B2B Verification</h1>
            <p className="text-gray-500 text-sm font-medium px-4">
              Upload your Business License or GST document to unlock wholesale pricing.
            </p>
          </div>

          {/* Upload Section */}
          <div className="mb-8">
            {status === 'pending' ? (
              <label className={`relative flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${uploading ? 'bg-gray-50 border-gray-200' : 'bg-emerald-50/30 border-emerald-200 hover:bg-emerald-50 hover:border-emerald-400'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  {uploading ? (
                    <div className="flex flex-col items-center">
                      <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-3"></div>
                      <p className="text-xs font-black text-emerald-700 uppercase tracking-widest">Uploading Document...</p>
                    </div>
                  ) : (
                    <>
                      <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-600 mb-3">
                        <Upload size={24} />
                      </div>
                      <p className="text-sm font-black text-gray-900 mb-1">Click to upload document</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">PDF, JPG or PNG (Max 5MB)</p>
                    </>
                  )}
                </div>
                <input type="file" className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} disabled={uploading} />
              </label>
            ) : (
              <div className="bg-emerald-500 rounded-3xl p-6 text-white text-center animate-[scaleIn_0.3s_ease-out]">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle2 size={28} />
                </div>
                <h3 className="font-black text-lg mb-1">Document Uploaded!</h3>
                <p className="text-emerald-50 text-xs font-bold">Our team will verify your business details within 24 hours.</p>
                <div className="mt-4 flex items-center justify-center gap-2 bg-black/10 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  <FileUp size={14} />
                  View Uploaded File
                </div>
              </div>
            )}
            
            {error && (
              <div className="mt-4 flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-shake">
                <AlertCircle size={16} />
                <p className="text-xs font-bold">{error}</p>
              </div>
            )}
          </div>

          {/* Status Steps */}
          <div className="space-y-3 mb-8 opacity-60">
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${status !== 'pending' ? 'bg-emerald-500 text-white' : 'bg-white text-gray-400 border border-gray-100'}`}>
                <FileText size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 text-sm leading-none mb-1">Document Upload</h3>
                <p className={`text-[10px] font-black uppercase tracking-wider ${status !== 'pending' ? 'text-emerald-600' : 'text-gray-400'}`}>
                  {status !== 'pending' ? 'Completed' : 'Awaiting Action'}
                </p>
              </div>
              {status !== 'pending' && <CheckCircle2 size={20} className="text-emerald-500" />}
            </div>

            <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-gray-300 border border-gray-100 shrink-0">
                <ShieldCheck size={20} />
              </div>
              <div className="flex-grow">
                <h3 className="font-bold text-gray-900 text-sm leading-none mb-1">Admin Verification</h3>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">Pending Review</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button 
              onClick={onSkip}
              className="w-full bg-[#107569] hover:bg-[#0d6359] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#107569]/20 transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 group text-sm"
            >
              Continue to Store
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button 
              onClick={onBack}
              className="w-full py-2 text-gray-400 font-bold hover:text-gray-600 transition-colors text-xs"
            >
              Cancel and Return
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
