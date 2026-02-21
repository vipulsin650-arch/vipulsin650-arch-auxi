
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Info, 
  ExternalLink, 
  ShieldCheck, 
  Banknote, 
  MessageSquare, 
  RefreshCw,
  Globe,
  Loader2,
  AlertCircle,
  ArrowUpRight
} from 'lucide-react';
import { getLiveGovernmentSchemes, LiveScheme } from '../services/groqService';

interface SchemesScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const SchemesScreen: React.FC<SchemesScreenProps> = ({ onBack, language }) => {
  const [schemes, setSchemes] = useState<LiveScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const translations = {
    en: {
      title: "LIVE GOVT SCHEMES",
      help: "Need Application Help?",
      helpDesc: "Our advisors help you fill forms for these schemes directly through the portal.",
      contact: "WhatsApp Advisor",
      learn: "Visit Official Portal",
      fetching: "Searching Live Govt Database...",
      error: "Unable to sync live data. Please try again.",
      retry: "Retry Sync",
      liveBadge: "LIVE 2025 UPDATES",
      official: "OFFICIAL GOV PORTAL"
    },
    hi: {
      title: "लाइव सरकारी योजनाएं",
      help: "आवेदन में मदद चाहिए?",
      helpDesc: "हमारे सलाहकार पोर्टल के माध्यम से इन योजनाओं के फॉर्म भरने में आपकी मदद करते हैं।",
      contact: "सलाहकार से बात करें",
      learn: "आधिकारिक पोर्टल देखें",
      fetching: "लाइव सरकारी डेटा खोज रहे हैं...",
      error: "लाइव डेटा सिंक करने में असमर्थ। पुनः प्रयास करें।",
      retry: "पुनः सिंक करें",
      liveBadge: "लाइव 2025 अपडेट",
      official: "आधिकारिक सरकारी पोर्टल"
    }
  };

  const t = translations[language];

  const fetchSchemes = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getLiveGovernmentSchemes(language);
      if (data.length > 0) {
        setSchemes(data);
      } else {
        setError(true);
      }
    } catch (e) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [language]);

  const openPortal = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="p-6 min-h-full pb-32 bg-slate-50">
      <header className="flex items-center justify-between mb-8 sticky top-0 bg-slate-50/80 backdrop-blur-md z-[60] py-4 border-b border-slate-200">
        <div className="flex items-center">
          <button onClick={onBack} className="bg-white p-3 rounded-2xl text-emerald-950 shadow-sm border border-slate-200 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
            <h2 className="text-2xl font-black text-emerald-950 uppercase tracking-tighter leading-none">{t.title}</h2>
            <div className="flex items-center mt-1 space-x-2">
               <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></div>
               <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">{t.liveBadge}</p>
            </div>
          </div>
        </div>
        <button onClick={fetchSchemes} className="p-3 bg-white text-emerald-600 rounded-2xl border border-slate-100"><RefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
      </header>

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center text-center">
           <div className="relative mb-8">
              <div className="absolute inset-0 bg-emerald-500 rounded-full blur-3xl opacity-20 animate-pulse"></div>
              <div className="relative w-20 h-20 border-8 border-emerald-50 border-t-emerald-600 rounded-full animate-spin"></div>
           </div>
           <p className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.4em] animate-pulse">{t.fetching}</p>
        </div>
      ) : error ? (
        <div className="py-20 flex flex-col items-center justify-center text-center px-10">
           <AlertCircle size={64} className="text-red-300 mb-6" />
           <p className="text-sm font-bold text-slate-500 mb-8">{t.error}</p>
           <button 
             onClick={fetchSchemes}
             className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-lg active:scale-95"
           >
             {t.retry}
           </button>
        </div>
      ) : (
        <div className="space-y-6">
          {schemes.map((s, idx) => (
            <div 
              key={idx} 
              style={{ animationDelay: `${idx * 100}ms` }}
              onClick={() => openPortal(s.url)}
              className="animate-in slide-in-from-bottom-5 duration-500 bg-white p-7 rounded-[45px] border border-slate-100 shadow-sm flex flex-col space-y-5 active:scale-[0.98] transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start">
                <div className={`p-4 rounded-2xl shrink-0 shadow-lg ${idx % 2 === 0 ? 'text-blue-600 bg-blue-50' : 'text-emerald-600 bg-emerald-50'}`}>
                  {idx % 3 === 0 ? <Banknote size={28} /> : idx % 3 === 1 ? <ShieldCheck size={28} /> : <Globe size={28} />}
                </div>
                <div className="bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
                  <ArrowUpRight size={14} className="text-emerald-600" />
                </div>
              </div>

              <div className="flex-1">
                <h3 className="text-xl font-black text-emerald-950 leading-tight mb-2 uppercase tracking-tight">{s.title}</h3>
                <p className="text-[13px] text-slate-500 font-bold leading-relaxed mb-6">{s.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em]">{t.official}</span>
                  <div className="flex items-center text-[10px] font-black text-emerald-900 uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                    {t.learn} <ChevronLeft size={14} className="rotate-180 ml-1.5" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* HELP SECTION */}
      <div className="mt-12 mb-20 animate-in fade-in duration-1000 delay-500">
        <div className="bg-emerald-950 rounded-[50px] p-10 text-white shadow-2xl relative overflow-hidden active:scale-[0.99] transition-transform">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-emerald-400/10 rounded-full"></div>
          
          <div className="flex items-center space-x-4 mb-6">
            <div className="bg-emerald-500 p-3 rounded-2xl shadow-xl">
               <MessageSquare size={24} className="text-white" />
            </div>
            <h4 className="font-black text-xl tracking-tight uppercase leading-none">{t.help}</h4>
          </div>
          <p className="text-[14px] text-emerald-100/60 mb-10 font-bold leading-relaxed">{t.helpDesc}</p>
          <button className="w-full py-6 bg-white text-emerald-950 rounded-[28px] font-black shadow-2xl active:scale-95 transition-all text-sm uppercase tracking-[0.2em] flex items-center justify-center space-x-3">
            <Smartphone size={18} />
            <span>{t.contact}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Help icon used in earlier version
const Smartphone = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
  </svg>
);

export default SchemesScreen;
