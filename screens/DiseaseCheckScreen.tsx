
import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Camera, Upload, Loader2, AlertTriangle, CheckCircle2, RefreshCcw, ShieldCheck, Microscope, AlertCircle, FileText } from 'lucide-react';
import { detectCropDisease } from '../services/geminiService';
import { DiseaseResult } from '../types';

interface DiseaseCheckScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const DiseaseCheckScreen: React.FC<DiseaseCheckScreenProps> = ({ onBack, language }) => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<DiseaseResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const translations = {
    en: {
      title: "Crop Diagnostic Lab",
      upload: "Capture Image",
      tip: "Focus on the leaf or infected area",
      analyze: "Start AI Diagnosis",
      scanning: "Analyzing cellular structure...",
      diagnosis: "Laboratory Report",
      resLabel: "Diagnosis",
      causeLabel: "Primary Pathogen",
      solLabel: "Prescription / Treatment",
      another: "Scan New Sample",
      notifTitle: "Diagnosis Ready",
      notifBody: "AI has identified: ",
      status: "Verified by AgriSarthi AI"
    },
    hi: {
      title: "फसल निदान लैब",
      upload: "फोटो लें",
      tip: "पत्ते या संक्रमित क्षेत्र पर ध्यान दें",
      analyze: "निदान शुरू करें",
      scanning: "कोशिकीय संरचना का विश्लेषण...",
      diagnosis: "प्रयोगशाला रिपोर्ट",
      resLabel: "निदान",
      causeLabel: "प्राथमिक रोगज़नक़",
      solLabel: "नुस्खा / उपचार",
      another: "नया सैंपल स्कैन करें",
      notifTitle: "निदान तैयार है",
      notifBody: "AI ने पहचान की है: ",
      status: "एग्रीसारथी AI द्वारा सत्यापित"
    }
  };

  const t = translations[language];

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const base64Data = image.split(',')[1];
      const analysis = await detectCropDisease(base64Data, language);
      setResult(analysis);

      if ("Notification" in window && Notification.permission === "granted") {
        new Notification(t.notifTitle, {
          body: `${t.notifBody} ${analysis.diseaseName}`,
          icon: "https://cdn-icons-png.flaticon.com/512/424/424056.png"
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 min-h-full pb-32">
      <header className="flex items-center mb-8 pt-8">
        <button onClick={onBack} className="glass-card p-2.5 rounded-2xl text-theme-main shadow-sm">
          <ChevronLeft size={24} />
        </button>
        <div className="ml-4">
          <h2 className="text-xl font-black text-theme-main uppercase tracking-tight leading-none">{t.title}</h2>
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Computer Vision Model v4.2</p>
        </div>
      </header>

      <div className="space-y-6">
        <div 
          onClick={() => !loading && fileInputRef.current?.click()}
          className="aspect-square w-full rounded-[45px] glass-card border-2 border-dashed border-emerald-500/20 flex flex-col items-center justify-center cursor-pointer overflow-hidden group hover:border-emerald-500/50 transition-all shadow-xl relative"
        >
          {image ? (
            <div className="w-full h-full relative">
              <img src={image} alt="Crop" className="w-full h-full object-cover animate-in zoom-in duration-500" />
              {loading && <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <Microscope size={48} className="text-white animate-bounce mb-4" />
                  <p className="text-white text-[10px] font-black uppercase tracking-[0.2em]">{t.scanning}</p>
                </div>
              </div>}
            </div>
          ) : (
            <div className="relative w-full h-full flex flex-col items-center justify-center">
              <img 
                src="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=800&auto=format&fit=crop" 
                className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:opacity-80 transition-all duration-700"
                alt="Scanning Demo"
              />
              <div className="absolute inset-0 bg-emerald-950/20"></div>
              <div className="relative z-10 flex flex-col items-center p-8 text-center">
                <div className="bg-white/20 p-8 rounded-full text-white mb-6 group-hover:scale-110 transition-transform backdrop-blur-md border border-white/40 shadow-2xl">
                  <Camera size={56} />
                </div>
                <p className="text-white text-xl font-black drop-shadow-md">{t.upload}</p>
                <p className="text-white/80 text-[10px] font-bold uppercase tracking-[0.2em] mt-3 drop-shadow-sm">{t.tip}</p>
              </div>
            </div>
          )}
          <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" capture="environment" className="hidden" />
        </div>

        {image && !result && !loading && (
          <button
            onClick={handleAnalyze}
            className="w-full bg-emerald-600 text-white py-5 rounded-[25px] font-black text-sm shadow-xl flex items-center justify-center space-x-2 active:scale-95 transition-all uppercase tracking-[0.2em]"
          >
            <Microscope size={18} />
            <span>{t.analyze}</span>
          </button>
        )}

        {result && (
          <div className="space-y-5 animate-in slide-in-from-bottom-10 duration-700">
            <div className="glass-card rounded-[40px] shadow-2xl overflow-hidden border border-white/20 bg-white/50">
              <div className="bg-emerald-900/10 p-6 border-b border-emerald-900/10 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 bg-emerald-600 rounded-2xl text-white shadow-lg"><FileText size={20} /></div>
                  <h3 className="text-sm font-black text-theme-main uppercase tracking-tight">{t.diagnosis}</h3>
                </div>
                <div className="text-[9px] font-black text-emerald-700 bg-white/60 px-3 py-1.5 rounded-full uppercase border border-emerald-200">{t.status}</div>
              </div>
              
              <div className="p-8 space-y-8">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertCircle size={14} className="text-red-500" />
                    <label className="text-[10px] font-black text-theme-sub uppercase tracking-[0.25em]">{t.resLabel}</label>
                  </div>
                  <p className="text-2xl font-black text-theme-main leading-tight border-b border-emerald-100 pb-4">{result.diseaseName}</p>
                </div>
                
                <div className="bg-white/30 p-6 rounded-[30px] border border-white/50">
                  <label className="text-[10px] font-black text-theme-sub opacity-50 uppercase tracking-[0.25em] block mb-2">{t.causeLabel}</label>
                  <p className="text-sm font-bold text-theme-main leading-relaxed">{result.cause}</p>
                </div>
                
                <div className="bg-emerald-600 text-white p-7 rounded-[35px] shadow-lg shadow-emerald-900/10">
                  <div className="flex items-center mb-4">
                    <ShieldCheck size={20} className="text-emerald-100 mr-3" />
                    <label className="text-[10px] font-black text-emerald-100 uppercase tracking-[0.25em]">{t.solLabel}</label>
                  </div>
                  <p className="text-[13px] font-bold leading-relaxed">{result.solution}</p>
                </div>
              </div>
            </div>

            <button 
              onClick={() => { setImage(null); setResult(null); }}
              className="w-full py-5 glass-card text-theme-main rounded-[30px] font-black text-xs uppercase tracking-widest flex items-center justify-center space-x-2"
            >
              <RefreshCcw size={16} />
              <span>{t.another}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DiseaseCheckScreen;
