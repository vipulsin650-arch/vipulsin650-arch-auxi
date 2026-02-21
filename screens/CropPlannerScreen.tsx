
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Map as MapIcon, 
  Calculator, 
  Sprout, 
  FlaskConical, 
  Bug, 
  IndianRupee, 
  Loader2, 
  ClipboardList, 
  Package,
  ShieldCheck,
} from 'lucide-react';
import { getCropInputsPlanStream } from '../services/groqService';

interface CropPlannerScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const CropPlannerScreen: React.FC<CropPlannerScreenProps> = ({ onBack, language }) => {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [area, setArea] = useState<string>('1');
  const [plan, setPlan] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const translations = {
    en: {
      title: "Input Calculator",
      labelCrop: "Select Crop",
      labelArea: "Land Area (Acres)",
      btn: "Get Requirement",
      reportTitle: "Your Field Blueprint",
      verified: "AI Precise",
      crops: ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Maize', 'Mustard', 'Soybean', 'Onion']
    },
    hi: {
      title: "लागत कैलकुलेटर",
      labelCrop: "फसल चुनें",
      labelArea: "भूमि क्षेत्र (एकड़)",
      btn: "मात्रा जानें",
      reportTitle: "आपके खेत की योजना",
      verified: "AI सटीक",
      crops: ['गेहूं', 'चावल', 'गन्ना', 'कपास', 'मक्का', 'सरसों', 'सोयाबीन', 'प्याज']
    }
  };

  const t = translations[language];

  const fetchPlan = async () => {
    const acreNum = parseFloat(area);
    if (isNaN(acreNum) || acreNum <= 0) return;
    
    setLoading(true);
    setPlan('');
    try {
      await getCropInputsPlanStream(selectedCrop, acreNum, (text) => {
        setPlan(text);
        setLoading(false);
      }, language);
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const formatPlan = (text: string) => {
    if (!text) return null;
    
    const sections = text.split(/\[(.*?)\]:/);
    const formatted: React.ReactNode[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      const header = sections[i].trim().toUpperCase();
      const content = sections[i + 1]?.trim() || "";
      
      const icon = header.includes('SEED') ? <Package size={32}/> :
                   header.includes('FERTILIZER') ? <FlaskConical size={32}/> :
                   header.includes('PESTICIDE') ? <Bug size={32}/> :
                   header.includes('COST') ? <IndianRupee size={32}/> : <ClipboardList size={32}/>;

      const contentParts = content.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={index} className="text-yellow-400 text-3xl font-black block mt-2">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });

      formatted.push(
        <div key={header} className="mb-6 animate-in slide-in-from-bottom-5 duration-500">
          <div className="bg-white/10 backdrop-blur-md rounded-[40px] p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-emerald-500 p-4 rounded-3xl text-white shadow-xl">
                {icon}
              </div>
              <h4 className="text-xl font-black text-white uppercase tracking-tighter">{header}</h4>
            </div>
            <div className="text-2xl font-bold text-emerald-100 leading-tight">
              {contentParts}
            </div>
          </div>
        </div>
      );
    }

    return formatted.length > 0 ? formatted : <p className="text-2xl font-black text-white">{text}</p>;
  };

  return (
    <div className="p-6 pb-44 animate-in fade-in duration-500 bg-emerald-50 min-h-full">
      <header className="flex items-center mb-10 mt-8">
        <button onClick={onBack} className="bg-white p-4 rounded-3xl text-emerald-950 shadow-2xl active:scale-90 transition-transform">
          <ChevronLeft size={28} />
        </button>
        <div className="ml-5">
          <h2 className="text-3xl font-black text-emerald-950 uppercase tracking-tighter leading-none">{t.title}</h2>
          <p className="text-xs font-black text-emerald-600 uppercase tracking-widest mt-1">Smart Farmer Tools</p>
        </div>
      </header>

      <div className="space-y-8">
        <div className="bg-white p-10 rounded-[60px] shadow-2xl border border-emerald-100 space-y-10">
          <div className="grid grid-cols-1 gap-8">
            <div>
              <label className="block text-xs font-black text-emerald-900/40 uppercase tracking-widest mb-4 px-1">{t.labelCrop}</label>
              <select 
                value={selectedCrop}
                onChange={(e) => { setSelectedCrop(e.target.value); setPlan(''); }}
                className="w-full p-6 bg-emerald-50 rounded-[30px] border-2 border-emerald-100 outline-none text-2xl font-black text-emerald-950 focus:border-emerald-500 transition-all"
              >
                {t.crops.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-black text-emerald-900/40 uppercase tracking-widest mb-4 px-1">{t.labelArea}</label>
              <div className="relative">
                <input 
                  type="number"
                  inputMode="decimal"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full p-6 px-14 bg-emerald-50 rounded-[30px] border-2 border-emerald-100 outline-none text-3xl font-black text-emerald-950 focus:border-emerald-500 transition-all"
                />
                <Calculator size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-600" />
                <span className="absolute right-8 top-1/2 -translate-y-1/2 text-sm font-black text-emerald-400 uppercase">Acres</span>
              </div>
            </div>
          </div>

          <button
            onClick={fetchPlan}
            disabled={loading || !area}
            className="w-full bg-emerald-950 text-white py-8 rounded-[35px] font-black text-xl flex items-center justify-center space-x-4 shadow-2xl active:scale-95 transition-all uppercase tracking-widest disabled:opacity-30"
          >
            {loading ? <Loader2 className="animate-spin" size={24} /> : <Calculator size={28} className="text-emerald-400" />}
            <span>{t.btn}</span>
          </button>
        </div>

        {(plan || loading) && (
          <div className="bg-emerald-900 p-10 rounded-[70px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.5)] relative overflow-hidden min-h-[500px]">
            <div className="absolute top-0 left-0 right-0 h-4 bg-emerald-500"></div>
            
            <div className="flex items-center justify-between mb-12 border-b border-white/10 pb-8">
              <div>
                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-2">{t.reportTitle}</h3>
                <p className="text-lg font-bold text-emerald-400 uppercase tracking-widest">{selectedCrop} • {area} Acres</p>
              </div>
              <div className="bg-emerald-500/20 px-4 py-2 rounded-2xl border border-emerald-500/30">
                 <ShieldCheck className="text-emerald-400 mb-1" size={24} />
                 <span className="text-[10px] font-black text-emerald-100 uppercase block">{t.verified}</span>
              </div>
            </div>

            {plan ? (
              <div className="space-y-6">
                {formatPlan(plan)}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center text-center">
                 <div className="w-24 h-24 border-8 border-white/5 border-t-emerald-400 rounded-full animate-spin mb-10"></div>
                 <p className="text-2xl font-black text-emerald-100 uppercase animate-pulse tracking-widest">CALCULATING...</p>
              </div>
            )}
            
            <div className="absolute bottom-[-50px] right-[-50px] opacity-[0.05] pointer-events-none">
                <MapIcon size={350} className="text-white" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropPlannerScreen;
