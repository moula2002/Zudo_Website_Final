import React, { useState } from 'react';
import { ShieldCheck, Clock, FileText, ArrowRight, CheckCircle2, X, Upload, FileUp, AlertCircle, Camera, CreditCard } from 'lucide-react';
import { API_URL, IMAGE_BASE_URL, cleanImageUrl, UPLOAD_URL } from '../config';

export default function B2BVerificationScreen({ onSkip, onBack, user, onUpdateUser }) {
  const [uploading, setUploading] = useState({ doc: false, store: false, submitting: false });
  const [docUrl, setDocUrl] = useState(user?.gstPdf || '');
  const [storePicUrl, setStorePicUrl] = useState(user?.storePic || '');
  const [taxId, setTaxId] = useState(user?.gstNumber || user?.panNumber || user?.aadhaarNumber || '');
  const [taxType, setTaxType] = useState('gst');
  const [pincode, setPincode] = useState(user?.pincode || '');
  const [error, setError] = useState('');
  const [status, setStatus] = useState(user?.gstPdf ? 'uploaded' : 'pending');

  React.useEffect(() => {
    if (user) {
      if (!docUrl) setDocUrl(user.gstPdf || '');
      if (!storePicUrl) setStorePicUrl(user.storePic || '');
      if (!taxId) setTaxId(user.gstNumber || user.panNumber || user.aadhaarNumber || '');
      if (!pincode) setPincode(user.pincode || '');
      if (status === 'pending' && user.gstPdf) setStatus('uploaded');
    }
  }, [user]);

  const handleFileUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(prev => ({ ...prev, [type]: true }));
    setError('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      console.log(`STEP 1: Uploading ${type} to HOSTINGER storage...`);
      // User specifically requested Hostinger for uploads
      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      const response = await fetch(UPLOAD_URL, {
        method: 'POST',
        headers: {
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: formData
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Upload failed');

      const savedUrl = cleanImageUrl(data.url);
      console.log(`STEP 2: Received HOSTINGER URL:`, savedUrl);

      if (type === 'doc') setDocUrl(savedUrl);
      else setStorePicUrl(savedUrl);

    } catch (err) {
      console.error('Upload error:', err);
      setError('Upload failed: ' + err.message);
    } finally {
      setUploading(prev => ({ ...prev, [type]: false }));
    }
  };

  const handleSubmit = async () => {
    if (!docUrl || !storePicUrl || !taxId || !pincode) {
      setError('Please provide all required business details, pincode and both images.');
      return;
    }

    setUploading(prev => ({ ...prev, submitting: true }));
    setError('');

    try {
      const payload = {
        gstPdf: docUrl,
        storePic: storePicUrl,
        gstNumber: taxType === 'gst' ? taxId : '',
        panNumber: taxType === 'pan' ? taxId : '',
        aadhaarNumber: taxType === 'aadhaar' ? taxId : '',
        pincode,
        isWaitingApproval: true
      };

      console.log('STEP 4: Saving Hostinger URLs to LOCAL MongoDB User record...', payload);

      const selectedCity = localStorage.getItem('selectedCity');
      const savedTenantId = localStorage.getItem('zudo_tenant_id');
      const locationHeader = savedTenantId || selectedCity || '';

      // Save to local as requested ("use local host")
      const response = await fetch(`${API_URL}/auth/b2b-verify-submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'x-location': locationHeader,
          'x-tenant-id': locationHeader
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      console.log('STEP 5: MongoDB Response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Local database save failed.');
      }

      localStorage.setItem('user', JSON.stringify(data));
      if (onUpdateUser) onUpdateUser(data);

      setStatus('uploaded');

      setTimeout(() => {
        onSkip();
      }, 2000);

    } catch (err) {
      console.error('SUBMIT ERROR:', err);
      setError(err.message);
    } finally {
      setUploading(prev => ({ ...prev, submitting: false }));
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden animate-[fadeIn_0.3s_ease-out] relative max-h-[95vh] flex flex-col md:flex-row">
        {/* Left Branding Side - Desktop Only */}
        <div className="hidden md:block w-1/3 relative overflow-hidden bg-gray-900">
          <img src="/zudo_hero.png" className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Zudo Branding" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-8">
            <h2 className="text-white text-2xl font-black mb-2">Zudo Business</h2>
            <p className="text-emerald-400 text-sm font-bold">Direct from source to your storefront.</p>
          </div>
        </div>

        <div className="flex-1 p-8 sm:p-10 overflow-y-auto relative bg-white">
          <button onClick={onBack} className="absolute top-6 right-6 text-gray-400 hover:text-black transition-colors z-10">
            <X size={24} />
          </button>

          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} className="text-emerald-600" />
            </div>
            <h1 className="text-2xl font-black text-gray-900 mb-2 tracking-tight">Business Verification</h1>
            <p className="text-gray-500 text-sm font-medium">Documents are stored on Hostinger server.</p>
          </div>

          {status === 'pending' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Identity Details</label>
                <div className="flex gap-2 mb-2">
                  {['gst', 'pan', 'aadhaar'].map(type => (
                    <button
                      key={type}
                      onClick={() => setTaxType(type)}
                      className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all border ${taxType === type ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <div className="relative group flex-[2]">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-emerald-600" size={18} />
                    <input
                      type="text"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder={`Enter ${taxType.toUpperCase()} Number`}
                      className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm"
                    />
                  </div>
                  <div className="relative group flex-1">
                    <input
                      type="text"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Pincode"
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-sm text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Business License</label>
                  <label className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${docUrl ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                    {uploading.doc ? <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : docUrl ? <CheckCircle2 className="text-emerald-600" /> : <FileUp className="text-gray-400" />}
                    <input type="file" className="hidden" accept=".pdf,image/*" onChange={(e) => handleFileUpload(e, 'doc')} />
                  </label>
                  <input 
                    type="text"
                    placeholder="Or paste license URL..."
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-2 px-3 outline-none font-bold text-[9px] focus:border-emerald-500 transition-all dark:text-white"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Store Picture</label>
                  <label className={`relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-3xl cursor-pointer transition-all ${storePicUrl ? 'bg-emerald-50 border-emerald-200' : 'bg-gray-50 border-gray-100'}`}>
                    {uploading.store ? <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div> : storePicUrl ? <img src={cleanImageUrl(storePicUrl)} className="w-full h-full object-cover rounded-2xl" /> : <Camera className="text-gray-400" />}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'store')} />
                  </label>
                  <input 
                    type="text"
                    placeholder="Or paste store pic URL..."
                    value={storePicUrl}
                    onChange={(e) => setStorePicUrl(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-2xl py-2 px-3 outline-none font-bold text-[9px] focus:border-emerald-500 transition-all dark:text-white"
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black rounded-2xl flex flex-col gap-1">
                  <div className="flex items-center gap-2 uppercase tracking-widest text-[10px] font-black"><AlertCircle size={14} /> Upload Error</div>
                  {error}
                </div>
              )}
 
              <button
                onClick={handleSubmit}
                disabled={uploading.submitting || uploading.doc || uploading.store}
                className="w-full bg-[#107569] hover:bg-[#0d6359] text-white font-black py-4 rounded-2xl shadow-xl shadow-[#107569]/20 transition-all flex items-center justify-center gap-2"
              >
                {uploading.submitting ? 'Finalizing...' : 'Submit Verification'}
                <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <div className="text-center py-10 animate-[scaleIn_0.3s_ease-out]">
              <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-emerald-500/30">
                <CheckCircle2 size={40} />
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Success!</h2>
              <p className="text-gray-500 font-medium mb-8">Verification documents uploaded to Hostinger.</p>
              <button onClick={onSkip} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl">Browse Now</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
