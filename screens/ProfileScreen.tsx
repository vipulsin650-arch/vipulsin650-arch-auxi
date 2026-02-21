
import React, { useState } from 'react';
import { 
  ChevronLeft, User as UserIcon, 
  LogOut, QrCode, 
  Smartphone, Download, Copy, Check, X, RefreshCw, ShieldCheck,
  Moon, Sun, Settings as SettingsIcon, Monitor, Languages as LanguagesIcon,
  PhoneCall
} from 'lucide-react';
import { User, Theme } from '../types';

interface ProfileScreenProps {
  user: User | null;
  onBack: () => void;
  onLogout: () => void;
  onThemeToggle: (theme: Theme) => void;
  onLanguageToggle: (lang: 'en' | 'hi') => void;
  language: 'en' | 'hi';
  theme: Theme; // This is the resolved theme (light/dark)
  currentTheme: Theme; // This is the actual setting (light/dark/system)
}

const ProfileScreen: React.FC<ProfileScreenProps> = ({ 
  user, onBack, onLogout, onThemeToggle, onLanguageToggle, language, theme, currentTheme 
}) => {
  const [showFullQR, setShowFullQR] = useState(false);
  const [copied, setCopied] = useState(false);
  const [qrLoaded, setQrLoaded] = useState(false);
  
  const translations = {
    en: {
      title: "Settings & Info",
      id: "AgriSarthi Farmer",
      verified: "Official App Link",
      scan: "Scan to Open App",
      scanMsg: "Optimized for all mobiles. Point any camera here to open the app instantly.",
      guide: "How to Install",
      copy: "Copy Link",
      copied: "Link Copied!",
      logout: "Sign Out",
      enlarge: "TAP TO SCAN",
      themeTitle: "App Appearance",
      languageTitle: "App Language",
      light: "Light",
      dark: "Dark",
      system: "System",
      english: "English",
      hindi: "हिन्दी",
      helpLine: "Kisan Call Centre Help Line",
      tollFree: "Toll Free: 1800-180-1551",
      steps: [
        "Open Phone Camera or Google Lens.",
        "Focus on the black & white QR above.",
        "Click the link that pops up.",
        "Tap 'Add to Home Screen' to install."
      ]
    },
    hi: {
      title: "सेटिंग्स और जानकारी",
      id: "एग्रीसारथी किसान",
      verified: "आधिकारिक ऐप लिंक",
      scan: "ऐप खोलने के लिए स्कैन करें",
      scanMsg: "सभी मोबाइल के लिए अनुकूलित। ऐप को तुरंत खोलने के लिए कोई भी कैमरा यहाँ दिखाएं।",
      guide: "कैसे इंस्टॉल करें",
      copy: "लिंक कॉपी करें",
      copied: "लिंक कॉपी हो गया!",
      logout: "साइन आउट करें",
      enlarge: "स्कैन करने के लिए टैप करें",
      themeTitle: "ऐप का रूप",
      languageTitle: "ऐप की भाषा",
      light: "लाइट",
      dark: "डार्क",
      system: "सिस्टम",
      english: "English",
      hindi: "हिन्दी",
      helpLine: "किसान कॉल सेंटर हेल्पलाइन",
      tollFree: "टोल फ्री: 1800-180-1551",
      steps: [
        "फोन कैमरा या गूगल लेंस खोलें।",
        "ऊपर दिए गए काले और सफेद क्यूआर पर फोकस करें।",
        "दिखाई देने वाले लिंक पर क्लिक करें।",
        "इंस्टॉल करने के लिए 'होम स्क्रीन पर जोड़ें' चुनें।"
      ]
    }
  };

  const t = translations[language];
  const appLink = "https://ai.studio/apps/drive/1i_vSXfI2ztcNS0vsE7ff7epFBgfvkuiI?fullscreenApplet=true";
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(appLink)}&ecc=L&margin=4&bgcolor=ffffff&color=000000&format=svg`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(appLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-full flex flex-col relative animate-in fade-in duration-300">
      {/* FULL SCREEN SCAN MODE */}
      {showFullQR && (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center p-8 animate-in zoom-in duration-200">
          <button 
            onClick={() => setShowFullQR(false)} 
            className="absolute top-10 right-6 text-black p-4 bg-gray-100 rounded-full active:scale-90"
          >
            <X size={32} />
          </button>
          
          <div className="bg-white p-3 border-2 border-black rounded-lg shadow-2xl">
             <img 
               src={qrCodeUrl} 
               alt="AgriSarthi Installation QR" 
               className="w-80 h-80 block"
               style={{ imageRendering: 'crisp-edges' }}
             />
          </div>
          
          <div className="text-center mt-12 max-w-xs">
            <h4 className="text-2xl font-black uppercase text-black mb-2">{t.scan}</h4>
            <p className="text-sm text-gray-400 font-bold leading-relaxed">{t.scanMsg}</p>
          </div>
        </div>
      )}

      <header className="p-6 pt-14 flex items-center justify-between sticky top-0 z-10 animate-spring-in">
        <div className="flex items-center">
          <button onClick={onBack} className="glass-effect p-2.5 rounded-2xl text-theme-main active:scale-90 transition-transform shadow-sm">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
             <h2 className="text-xl font-black text-theme-main tracking-tight leading-none uppercase">{t.title}</h2>
             <p className="text-[9px] font-bold text-theme-sub uppercase tracking-widest mt-1">Version 2.8.0</p>
          </div>
        </div>
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black shadow-xl border ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-black text-white border-white/20'}`}>
           {user?.name?.[0] || 'K'}
        </div>
      </header>

      <div className="p-6 space-y-6 pb-40">
        
        {/* APPEARANCE SETTINGS */}
        <div className="glass-effect p-6 rounded-[35px] shadow-sm border border-white/10 animate-spring-in stagger-1">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-500">
              <SettingsIcon size={18} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-sub">{t.themeTitle}</h4>
          </div>

          <div className="flex p-1.5 bg-black/5 dark:bg-white/5 rounded-3xl relative">
            <button 
              onClick={() => onThemeToggle('light')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-3 rounded-2xl transition-all z-10 ${currentTheme === 'light' ? 'bg-white shadow-lg text-emerald-700' : 'text-theme-sub'}`}
            >
              <Sun size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.light}</span>
            </button>
            <button 
              onClick={() => onThemeToggle('system')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-3 rounded-2xl transition-all z-10 ${currentTheme === 'system' ? 'bg-white shadow-lg text-blue-600 dark:bg-white/10 dark:text-blue-400' : 'text-theme-sub'}`}
            >
              <Monitor size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.system}</span>
            </button>
            <button 
              onClick={() => onThemeToggle('dark')}
              className={`flex-1 flex flex-col items-center justify-center space-y-1 py-3 rounded-2xl transition-all z-10 ${currentTheme === 'dark' ? 'bg-black shadow-lg text-emerald-400 dark:bg-white/10' : 'text-theme-sub'}`}
            >
              <Moon size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">{t.dark}</span>
            </button>
          </div>
        </div>

        {/* LANGUAGE SETTINGS */}
        <div className="glass-effect p-6 rounded-[35px] shadow-sm border border-white/10 animate-spring-in stagger-2">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2.5 bg-purple-500/10 rounded-xl text-purple-500">
              <LanguagesIcon size={18} />
            </div>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-theme-sub">{t.languageTitle}</h4>
          </div>

          <div className="flex p-1.5 bg-black/5 dark:bg-white/5 rounded-3xl relative">
            <button 
              onClick={() => onLanguageToggle('en')}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl transition-all z-10 ${language === 'en' ? 'bg-white shadow-lg text-emerald-700 dark:bg-white/10 dark:text-white' : 'text-theme-sub'}`}
            >
              <span className="text-xs font-black uppercase tracking-widest">{t.english}</span>
            </button>
            <button 
              onClick={() => onLanguageToggle('hi')}
              className={`flex-1 flex items-center justify-center space-x-2 py-4 rounded-2xl transition-all z-10 ${language === 'hi' ? 'bg-white shadow-lg text-emerald-700 dark:bg-white/10 dark:text-white' : 'text-theme-sub'}`}
            >
              <span className="text-xs font-black uppercase tracking-widest">{t.hindi}</span>
            </button>
          </div>
        </div>

        {/* KISAN CALL CENTRE HELP LINE - NEW PORTION BLOCK */}
        <a 
          href="tel:18001801551"
          className="glass-effect p-8 rounded-[40px] shadow-xl border-l-8 border-emerald-500 flex items-center space-x-6 animate-spring-in stagger-3 active:scale-[0.98] transition-all bg-emerald-500/5"
        >
          <div className="w-14 h-14 bg-emerald-600 text-white rounded-[20px] flex items-center justify-center shadow-lg shrink-0">
            <PhoneCall size={28} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-theme-main leading-tight uppercase tracking-tight">{t.helpLine}</h3>
            <p className="text-2xl font-black text-emerald-600 mt-1 tracking-tighter">{t.tollFree}</p>
          </div>
        </a>

        {/* User Status Card */}
        <div className="glass-effect p-6 rounded-[35px] shadow-sm flex items-center space-x-4 animate-spring-in stagger-3">
          <div className="w-12 h-12 bg-emerald-600/20 text-emerald-600 rounded-2xl flex items-center justify-center shadow-lg border border-emerald-500/20">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h3 className="text-md font-black text-theme-main leading-tight">{user?.name || 'Farmer Member'}</h3>
            <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-0.5">{t.verified}</p>
          </div>
        </div>

        {/* SCAN CENTER */}
        <div className="glass-effect rounded-[40px] shadow-xl overflow-hidden animate-spring-in stagger-4">
          <div className="bg-black/80 p-5 text-white flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <QrCode size={18} className="text-emerald-400" />
              <span className="font-black text-[10px] uppercase tracking-[0.2em]">{t.scan}</span>
            </div>
            <Smartphone size={14} className="opacity-40" />
          </div>

          <div className="p-10 flex flex-col items-center">
            <div 
              onClick={() => setShowFullQR(true)}
              className="bg-white p-2 border-2 border-gray-100 rounded-2xl cursor-pointer active:scale-[0.97] transition-all mb-8 relative group shadow-inner"
            >
              {!qrLoaded && (
                <div className="w-56 h-56 flex items-center justify-center bg-gray-50 rounded-xl">
                  <RefreshCw className="animate-spin text-black/5" size={40} />
                </div>
              )}
              <img 
                src={qrCodeUrl} 
                alt="Installation QR" 
                className={`w-56 h-56 transition-opacity duration-300 ${qrLoaded ? 'opacity-100' : 'opacity-0'}`}
                onLoad={() => setQrLoaded(true)}
              />
            </div>

            <button 
              onClick={copyToClipboard}
              className={`w-full py-5 rounded-2xl font-black text-xs flex items-center justify-center shadow-lg active:scale-[0.98] transition-all uppercase tracking-widest ${theme === 'dark' ? 'bg-emerald-500 text-black' : 'bg-black text-white'}`}
            >
              {copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2 opacity-30" />}
              {copied ? t.copied : t.copy}
            </button>
          </div>
        </div>

        {/* INSTALLATION STEPS */}
        <div className="glass-effect p-8 rounded-[40px] shadow-sm animate-spring-in stagger-4">
          <div className="flex items-center space-x-3 mb-8">
            <div className={`p-2.5 rounded-xl shadow-lg ${theme === 'dark' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-black text-white'}`}>
               <Download size={18} />
            </div>
            <h4 className="font-black uppercase text-[10px] tracking-widest text-theme-main">{t.guide}</h4>
          </div>
          <div className="space-y-6">
            {t.steps.map((step, n) => (
              <div key={n} className="flex items-start space-x-4">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 text-[10px] shadow-sm ${theme === 'dark' ? 'bg-emerald-400/20 text-emerald-400' : 'bg-black text-white'}`}>{n+1}</div>
                <p className="text-[12px] text-theme-sub font-bold leading-tight pt-1.5">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={onLogout}
          className="w-full p-8 text-red-500/50 hover:text-red-500 rounded-2xl font-black flex items-center justify-center space-x-2 text-[10px] uppercase tracking-widest active:scale-95 transition-all"
        >
          <LogOut size={16} />
          <span>{t.logout}</span>
        </button>
      </div>
    </div>
  );
};

export default ProfileScreen;
