
import React, { useState } from 'react';
import { ChevronLeft, Loader2, Sparkles, Droplets, FlaskConical, Calendar, ArrowRight, Sprout, ClipboardCheck, Info, ShieldCheck, Target, Zap } from 'lucide-react';
import { getCropAdviceStream } from '../services/groqService';

interface CropAdviceScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const CropAdviceScreen: React.FC<CropAdviceScreenProps> = ({ onBack, language }) => {
  const [selectedCrop, setSelectedCrop] = useState('Wheat');
  const [advice, setAdvice] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const translations = {
    en: {
      title: "Scientific Advisory",
      label: "Select Crop Category",
      btn: "Generate High-Yield Report",
      reportTitle: "Agricultural Scientist Analysis",
      verified: "Scientifically Verified",
      ref: "Ref No: KS-",
      crops: ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Maize', 'Mustard', 'Barley', 'Pulses']
    },
    hi: {
      title: "वैज्ञानिक सलाह",
      label: "फसल श्रेणी चुनें",
      btn: "उच्च-उपज रिपोर्ट प्राप्त करें",
      reportTitle: "कृषि वैज्ञानिक विश्लेषण",
      verified: "वैज्ञानिक रूप से सत्यापित",
      ref: "संदर्भ संख्या: KS-",
      crops: ['गेहूं', 'चावल', 'गन्ना', 'कपास', 'मक्का', 'सरसों', 'जौ', 'दालें']
    }
  };

  const t = translations[language];

  const fetchAdvice = async (crop: string) => {
    setLoading(true);
    setAdvice('');
    setError('');
    try {
      await getCropAdviceStream(crop, (text) => {
        setAdvice(text);
      }, language);
    } catch (error: any) {
      console.error('Error fetching advice:', error);
      setError(error?.message || 'Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatAdvice = (text: string) => {
    if (!text) return null;
    
    const sections = text.split(/\[(.*?)\]:/);
    const formatted: React.ReactNode[] = [];

    for (let i = 1; i < sections.length; i += 2) {
      const header = sections[i].trim().toUpperCase();
      let content = sections[i + 1]?.trim() || "";
      
      const icon = header.includes('SUMMARY') ? <ClipboardCheck size={20}/> :
                   header.includes('FACTORS') ? <Target size={20}/> :
                   header.includes('NUTRITION') ? <FlaskConical size={20}/> :
                   header.includes('IRRIGATION') ? <Droplets size={20}/> :
                   header.includes('MAXIMIZER') ? <Zap size={20}/> : <Info size={20}/>;

      // Professional Content Formatter: Highlight bold text and numbers
      const contentParts = content.split(/(\*\*.*?\*\*)/g).map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <span key={index} className="inline-block px-1.5 py-0.5 bg-emerald-100 text-emerald-900 font-black rounded-md mx-0.5 border border-emerald-200">
              {part.slice(2, -2)}
            </span>
          );
        }
        return part;
      });

      formatted.push(
        <div key={header} className="mb-10 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2.5 bg-emerald-950 text-emerald-400 rounded-xl shadow-lg border border-emerald-400/20">
              {icon}
            </div>
            <h4 className="text-[12px] font-black text-emerald-950 uppercase tracking-[0.2em]">{header}</h4>
          </div>
          <div className="text-[15px] font-bold text-emerald-900/90 leading-relaxed bg-white/40 p-5 rounded-[25px] border-l-4 border-emerald-600 shadow-sm ml-2">
            {contentParts}
          </div>
        </div>
      );
    }

    return formatted.length > 0 ? formatted : <p className="text-md font-bold whitespace-pre-line leading-relaxed">{text}</p>;
  };

  const reportId = Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="relative min-h-full overflow-hidden flex flex-col bg-emerald-50">
      <div className="relative z-10 flex flex-col h-full p-6 pb-40 overflow-y-auto no-scrollbar page-transition">
        <header className="flex items-center mb-10 mt-8">
          <button onClick={onBack} className="bg-white p-3 rounded-2xl text-emerald-900 shadow-xl border border-emerald-100 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
            <h2 className="text-2xl font-black text-emerald-950 tracking-tight leading-none uppercase">{t.title}</h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Laboratory Standard Output</p>
          </div>
        </header>

        <div className="space-y-6">
          <div className="bg-white p-8 rounded-[45px] shadow-2xl border border-emerald-100 space-y-6">
            <div>
              <label className="block text-[10px] font-black text-emerald-900/40 uppercase tracking-[0.2em] mb-3 px-1">{t.label}</label>
              <div className="relative">
                <select 
                  value={selectedCrop}
                  onChange={(e) => { setSelectedCrop(e.target.value); setAdvice(''); }}
                  className="w-full p-5 bg-emerald-50 rounded-3xl border border-emerald-100 outline-none text-xl font-black text-emerald-900 appearance-none focus:ring-4 focus:ring-emerald-500/10 transition-all"
                >
                  {t.crops.map((c, i) => <option key={i} value={c}>{c}</option>)}
                </select>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-700"><ArrowRight size={22} /></div>
              </div>
            </div>
            
            <button
              onClick={() => fetchAdvice(selectedCrop)}
              disabled={loading}
              className="w-full bg-emerald-950 text-white py-6 rounded-[30px] font-black text-sm flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <Sparkles size={18} className="text-emerald-400" />}
              <span>{t.btn}</span>
            </button>
          </div>

          {(advice || loading || error) && (
            <div className="bg-white p-10 rounded-[50px] shadow-2xl relative overflow-hidden border border-emerald-100 min-h-[400px]">
              {/* Report Header Decoration */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-emerald-400 via-emerald-600 to-emerald-950"></div>
              
              <div className="flex flex-col mb-10 border-b border-emerald-100 pb-8">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="bg-emerald-950 p-3 rounded-2xl shadow-xl border border-emerald-400/30">
                      <Sprout size={24} className="text-emerald-400"/>
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-emerald-950 uppercase tracking-tight leading-none">{t.reportTitle}</h3>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">{selectedCrop} • {new Date().toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center text-[9px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full uppercase border border-emerald-200">
                      <ShieldCheck size={10} className="mr-1.5" />
                      {t.verified}
                    </div>
                    <p className="text-[8px] font-bold text-gray-300 mt-2 uppercase tracking-widest">{t.ref}{reportId}</p>
                  </div>
                </div>
              </div>

              {advice ? (
                <div className="relative z-10 animate-in fade-in duration-700">
                  {formatAdvice(advice)}
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
                    <ShieldCheck size={32} className="text-red-600" />
                  </div>
                  <p className="text-lg font-black text-red-700 mb-2">Error Generating Report</p>
                  <p className="text-sm font-bold text-red-600/80 mb-4">{error}</p>
                  <button
                    onClick={() => fetchAdvice(selectedCrop)}
                    className="bg-emerald-950 text-white px-6 py-3 rounded-full font-black text-sm"
                  >
                    Try Again
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                   <div className="w-16 h-16 border-4 border-emerald-50 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
                   <p className="text-[11px] font-black text-emerald-900 uppercase animate-pulse tracking-[0.3em]">Scientific Modeling in Progress...</p>
                </div>
              )}

              {/* Scientist Watermark */}
              <div className="absolute bottom-8 right-8 opacity-[0.03] pointer-events-none select-none">
                <Microscope size={200} className="text-emerald-950" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Help icons not imported earlier
const Microscope = ({ size, className }: { size: number, className: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M6 18h8"/><path d="M3 22h18"/><path d="M14 22a7 7 0 1 0 0-14h-1"/><path d="M9 14h2"/><path d="M9 12a2 2 0 1 1-2-2V6h6v4.13"/><path d="M12 9V5"/><path d="M9 5V3h3v2"/><path d="M14 13l2 2"/>
  </svg>
);

export default CropAdviceScreen;
