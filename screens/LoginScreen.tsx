
import React, { useState } from 'react';
import { ChevronLeft, User as UserIcon, ShieldCheck, Languages, MapPin, Loader2, ArrowRight, Check } from 'lucide-react';
import { AppLanguage, LANGUAGES } from '../types';

interface LoginScreenProps {
  onLogin: (name: string, phone: string, locationName: string) => void;
  setGlobalLanguage: (lang: AppLanguage) => void;
}

const LeafShieldLogo = ({ size = 48 }: { size?: number }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size * 1.1 }}>
    <svg viewBox="0 0 100 120" className="absolute inset-0">
      <path 
        d="M50 0 L10 15 V50 C10 80 50 100 50 100 C50 100 90 80 90 50 V15 L50 0 Z" 
        fill="#059669" 
        stroke="white" 
        strokeWidth="2"
      />
      <path 
        d="M50 25 C50 25 35 45 35 60 C35 75 50 85 50 85 C50 85 65 75 65 60 C65 45 50 25 50 25 Z" 
        fill="#ffffff" 
      />
      <path d="M50 35 V75 M50 45 L40 55 M50 55 L40 65 M50 45 L60 55 M50 55 L60 65" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, setGlobalLanguage }) => {
  const [step, setStep] = useState<'LANGUAGE' | 'INFO'>('LANGUAGE');
  const [name, setName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [language, setLanguage] = useState<AppLanguage>('hi');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Simplified dictionary for basic UI in Login
  const t = {
    choose: language === 'hi' ? "भाषा चुनें" : "Choose Language",
    sub: language === 'hi' ? "कृपया अपनी पसंदीदा भाषा चुनें" : "Please select your preferred language",
    name: language === 'hi' ? "पूरा नाम" : "Full Name",
    village: language === 'hi' ? "आपका गांव / शहर" : "Your Village / City",
    login: language === 'hi' ? "खेती शुरू करें" : "Start Farming",
    terms: language === 'hi' ? "खाता बनाकर, आप एग्रीसारथी की" : "By creating an account, you agree to AgriSarthi's",
    privacy: language === 'hi' ? "शर्तों और गोपनीयता से सहमत हैं" : "Terms & Privacy",
    back: language === 'hi' ? "पीछे" : "Back",
    trust: language === 'hi' ? "किसानों का विश्वास" : "Farmer's Trust"
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length >= 2 && locationName.trim().length >= 2) {
      setIsSubmitting(true);
      setTimeout(() => {
        onLogin(name, "Verified", locationName);
      }, 800);
    }
  };

  if (step === 'LANGUAGE') {
    return (
      <div className="p-6 h-full flex flex-col bg-emerald-50/80 backdrop-blur-sm animate-in fade-in duration-500">
        <div className="flex-1 flex flex-col justify-center">
          <div className="bg-emerald-600/10 w-20 h-20 rounded-[30px] flex items-center justify-center text-emerald-600 mb-8 mx-auto border border-emerald-600/10 shadow-xl">
            <Languages size={40} />
          </div>
          <h2 className="text-3xl font-black text-center text-emerald-900 mb-2 uppercase tracking-tighter">
            {t.choose}
          </h2>
          <p className="text-emerald-700/60 text-center mb-10 font-bold text-xs tracking-wide">
            {t.sub}
          </p>
          
          <div className="grid grid-cols-2 gap-3 overflow-y-auto max-h-[50vh] pr-1 no-scrollbar">
            {Object.entries(LANGUAGES).map(([code, { name, nativeName }]) => {
               const isSel = language === code;
               return (
                <button
                  key={code}
                  onClick={() => {
                    const selected = code as AppLanguage;
                    setLanguage(selected);
                    setGlobalLanguage(selected);
                    setStep('INFO');
                  }}
                  className={`p-5 rounded-[25px] border-2 transition-all flex flex-col items-center justify-center active:scale-[0.96] relative ${isSel ? 'bg-emerald-600 border-emerald-600 shadow-xl' : 'bg-white border-white shadow-sm'}`}
                >
                  <span className={`font-black text-lg mb-1 ${isSel ? 'text-white' : 'text-emerald-950'}`}>{nativeName}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${isSel ? 'text-emerald-200' : 'text-slate-400'}`}>{name}</span>
                  {isSel && <div className="absolute top-3 right-3 text-white"><Check size={14}/></div>}
                </button>
               );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white relative overflow-hidden animate-in slide-in-from-right duration-500">
      <div className="p-8 h-full flex flex-col">
        <button onClick={() => setStep('LANGUAGE')} className="mb-10 flex items-center text-emerald-900 font-black uppercase tracking-widest text-xs active:scale-90 transition-transform">
          <ChevronLeft size={20} className="mr-1" /> {t.back}
        </button>

        <div className="mb-12 flex flex-col items-center">
          <div className="bg-emerald-600 p-6 rounded-[45px] shadow-2xl border-4 border-white mb-8 relative rotate-3">
             <LeafShieldLogo size={64} />
          </div>
          <div className="flex items-center space-x-3">
            <h1 className="text-5xl font-black text-emerald-900 tracking-tighter uppercase leading-none">AGRI</h1>
            <h1 className="text-5xl font-black text-emerald-600 tracking-tighter uppercase leading-none">SARTHI</h1>
          </div>
          <p className="text-emerald-900/40 font-black text-[11px] uppercase tracking-[0.5em] mt-3">{t.trust}</p>
        </div>

        <div className="flex-1 mt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="relative group">
              <UserIcon className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600/30 group-focus-within:text-emerald-600 transition-colors" size={24} />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t.name}
                className="w-full pl-16 pr-8 py-7 bg-emerald-50/50 border-2 border-emerald-100 rounded-[35px] text-xl font-black text-emerald-900 outline-none focus:border-emerald-600 focus:bg-white placeholder:text-emerald-900/20 transition-all shadow-inner"
                required
                autoFocus
              />
            </div>
            
            <div className="relative group">
              <MapPin className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600/30 group-focus-within:text-emerald-600 transition-colors" size={24} />
              <input
                type="text"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder={t.village}
                className="w-full pl-16 pr-8 py-7 bg-emerald-50/50 border-2 border-emerald-100 rounded-[35px] text-xl font-black text-emerald-900 outline-none focus:border-emerald-600 focus:bg-white placeholder:text-emerald-900/20 transition-all shadow-inner"
                required
              />
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting || !name || !locationName}
              className="w-full bg-emerald-600 text-white py-8 rounded-[40px] font-black text-2xl flex items-center justify-center shadow-[0_20px_40px_-10px_rgba(5,150,105,0.4)] active:scale-[0.97] transition-all uppercase tracking-[0.1em] disabled:opacity-30 mt-10"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={32} /> : (
                <>
                  <span>{t.login}</span>
                  <ArrowRight size={28} className="ml-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center">
            <p className="text-[10px] text-emerald-900/30 font-black uppercase tracking-widest leading-relaxed">
              {t.terms} <br/> <span className="text-emerald-600">{t.privacy}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
