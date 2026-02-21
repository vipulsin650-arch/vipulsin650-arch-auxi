
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  TrendingUp, 
  MapPin, 
  Search, 
  ArrowRight, 
  Loader2, 
  Sparkles, 
  RefreshCw, 
  BarChart3, 
  BarChart, 
  LayoutDashboard, 
  ShieldCheck, 
  PieChart,
  Navigation,
  Globe,
  MapIcon
} from 'lucide-react';
import { getMarketInsightsStream, getCityFromCoords } from '../services/geminiService';
import { User } from '../types';

interface MarketPricesScreenProps {
  user: User | null;
  onBack: () => void;
  language: 'en' | 'hi';
}

const MarketPricesScreen: React.FC<MarketPricesScreenProps> = ({ user, onBack, language }) => {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [location, setLocation] = useState('');
  const [insights, setInsights] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const translations = {
    en: {
      title: "Market Intelligence",
      label: "Selected Crop",
      locLabel: "Enter Mandi / Location",
      locPlaceholder: "e.g. Azadpur Mandi, Delhi",
      btn: "Access Price Terminal",
      detecting: "Locating...",
      detectBtn: "Auto-Detect",
      reportTitle: "Live Mandi Terminal",
      status: "Verified Real-time Data",
      ref: "Terminal ID: MD-"
    },
    hi: {
      title: "बाजार खुफिया जानकारी",
      label: "चयनित फसल",
      locLabel: "मंडी / स्थान दर्ज करें",
      locPlaceholder: "उदा. आजादपुर मंडी, दिल्ली",
      btn: "मंडी भाव टर्मिनल",
      detecting: "खोज रहा है...",
      detectBtn: "स्वयं खोजें",
      reportTitle: "लाइव मंडी टर्मिनल",
      status: "सत्यापित रीयल-टाइम डेटा",
      ref: "टर्मिनल आईडी: MD-"
    }
  };

  const t = translations[language];

  // Attempt to auto-detect on first load, but don't force it
  useEffect(() => {
    if (!location) detectLocation();
  }, []);

  const detectLocation = async () => {
    setIsLocating(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
            const name = await getCityFromCoords(position.coords.latitude, position.coords.longitude, language);
            setLocation(name);
          } catch (e) { console.error(e); } 
          finally { setIsLocating(false); }
        },
        () => setIsLocating(false),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else { setIsLocating(false); }
  };

  const fetchPrices = async () => {
    if (!selectedCrop || !location) return;
    setLoading(true);
    setInsights('');
    try {
      await getMarketInsightsStream(selectedCrop, (text) => {
        setInsights(text);
        setLoading(false);
      }, location, language);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const formatInsights = (text: string) => {
    if (!text) return null;
    
    const sections = text.split(/\[(.*?)\]:/);
    const formatted: React.ReactNode[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      const header = sections[i].trim().toUpperCase();
      const content = sections[i + 1]?.trim() || "";
      
      const icon = header.includes('RATE') || header.includes('PRICE') ? <TrendingUp size={22}/> :
                   header.includes('ARRIVALS') ? <Navigation size={22}/> :
                   header.includes('MSP') ? <ShieldCheck size={22}/> :
                   header.includes('FORECAST') ? <PieChart size={22}/> : <BarChart size={22}/>;

      const contentParts = content.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={index} className="inline-block px-2.5 py-1 bg-emerald-100 text-emerald-950 font-black rounded-lg mx-0.5 border border-emerald-200 text-[16px]">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });

      formatted.push(
        <div key={header} className="mb-10 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-3 bg-emerald-950 text-emerald-400 rounded-2xl shadow-xl border border-emerald-400/20">
              {icon}
            </div>
            <h4 className="text-[13px] font-black text-emerald-950 uppercase tracking-[0.2em]">{header}</h4>
          </div>
          <div className="text-[15px] font-bold text-emerald-900/90 leading-relaxed glass-card p-6 rounded-[35px] border-l-8 border-emerald-600 shadow-md ml-2 backdrop-blur-sm">
            {contentParts}
          </div>
        </div>
      );
    }

    return formatted.length > 0 ? formatted : <p className="text-[15px] font-bold whitespace-pre-line leading-relaxed">{text}</p>;
  };

  const terminalId = Math.floor(2000 + Math.random() * 7000);

  return (
    <div className="min-h-full pb-44 animate-in fade-in duration-500 bg-slate-50 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 right-0 h-96 overflow-hidden -z-10">
         <img src="https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=1200&auto=format&fit=crop" className="w-full h-full object-cover opacity-80" alt="Mandi Header" />
         <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-slate-50/50 to-slate-50"></div>
      </div>

      <header className="p-6 flex items-center mb-10 mt-8 relative z-10">
        <button onClick={onBack} className="bg-white/80 backdrop-blur-md p-3 rounded-2xl text-emerald-950 shadow-xl border border-white/40 active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="ml-4 drop-shadow-lg">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight leading-none drop-shadow-md">{t.title}</h2>
          <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mt-1 drop-shadow-sm">Economics Data Feed v4.0</p>
        </div>
      </header>

      <div className="px-6 space-y-8 relative z-10 mt-12">
        <div className="glass-card p-8 rounded-[50px] shadow-2xl border border-white/50 space-y-8">
          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-3 px-1">{t.label}</label>
              <div className="relative">
                <select 
                  value={selectedCrop}
                  onChange={(e) => { setSelectedCrop(e.target.value); setInsights(''); }}
                  className="w-full py-5 px-6 bg-white/40 rounded-[25px] border border-white/60 outline-none text-[15px] font-black appearance-none text-emerald-950 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                >
                  {['Wheat', 'Rice', 'Cotton', 'Onion', 'Soybean', 'Mustard', 'Maize', 'Potato', 'Tomato', 'Garlic'].map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-20"><TrendingUp size={18}/></div>
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-black text-emerald-900/30 uppercase tracking-[0.2em] mb-3 px-1">{t.locLabel}</label>
              <div className="flex space-x-3">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder={t.locPlaceholder}
                    className="w-full py-5 px-12 bg-white/40 rounded-[25px] border border-white/60 outline-none text-[13px] font-bold text-emerald-950 focus:ring-4 focus:ring-emerald-500/10 transition-all"
                  />
                  <MapPin size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" />
                </div>
                <button 
                  onClick={detectLocation}
                  disabled={isLocating}
                  className={`px-4 bg-emerald-50 text-emerald-600 rounded-[25px] border border-emerald-100 flex items-center justify-center transition-all active:scale-90 ${isLocating ? 'animate-pulse' : ''}`}
                >
                  {isLocating ? <Loader2 size={18} className="animate-spin" /> : <Globe size={18} />}
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={fetchPrices}
            disabled={loading || !selectedCrop || !location}
            className="w-full bg-emerald-950 text-white py-6 rounded-[30px] font-black text-sm flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all uppercase tracking-[0.25em] disabled:opacity-30"
          >
            {loading ? <Loader2 className="animate-spin" /> : <BarChart3 size={20} className="text-emerald-400" />}
            <span>{t.btn}</span>
          </button>
        </div>

        {(insights || loading) && (
          <div className="glass-card p-10 rounded-[55px] shadow-2xl relative overflow-hidden border border-white/50 min-h-[450px]">
            <div className="absolute top-0 left-0 right-0 h-3 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-950"></div>
            
            <div className="flex flex-col mb-10 border-b border-slate-100/10 pb-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-4">
                  <div className="bg-emerald-950 p-4 rounded-3xl shadow-2xl border border-emerald-400/20">
                    <LayoutDashboard size={28} className="text-emerald-400"/>
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">{t.reportTitle}</h3>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-2">{selectedCrop} • {location}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-700 bg-emerald-50/50 backdrop-blur-sm px-4 py-2 rounded-full uppercase border border-emerald-200">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span>{t.status}</span>
                  </div>
                  <p className="text-[8px] font-bold text-gray-300 mt-3 uppercase tracking-widest">{t.ref}{terminalId}</p>
                </div>
              </div>
            </div>

            {insights ? (
              <div className="relative z-10 animate-in fade-in duration-700">
                {formatInsights(insights)}
              </div>
            ) : (
              <div className="py-28 flex flex-col items-center justify-center text-center">
                 <div className="w-20 h-20 border-8 border-slate-50 border-t-emerald-600 rounded-full animate-spin mb-8"></div>
                 <p className="text-[12px] font-black text-emerald-950 uppercase animate-pulse tracking-[0.4em]">Establishing Mandi Handshake...</p>
                 <p className="text-[9px] font-bold text-gray-400 uppercase mt-4">Syncing Global Commodity Nodes</p>
              </div>
            )}
            
            {/* Professional Watermark */}
            <div className="absolute bottom-10 right-10 opacity-[0.02] pointer-events-none select-none">
                <MapIcon size={250} className="text-emerald-950" />
            </div>
          </div>
        )}

        {!insights && !loading && (
          <div className="py-24 flex flex-col items-center justify-center text-center px-12 opacity-30">
             <div className="bg-white/50 backdrop-blur-md p-12 rounded-full mb-10 shadow-inner border border-white">
                <BarChart3 size={80} className="text-emerald-950" />
             </div>
             <p className="text-[12px] font-black uppercase tracking-[0.3em] text-emerald-950 leading-relaxed">Enter Target Mandi to<br/>Execute Market Analysis</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MarketPricesScreen;
