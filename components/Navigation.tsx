
import React from 'react';
import { Home, Sprout, TrendingUp, BookOpen, User, Activity } from 'lucide-react';
import { AppScreen, Theme, AppLanguage } from '../types';

interface NavigationProps {
  currentScreen: AppScreen;
  onNavigate: (screen: AppScreen) => void;
  language: AppLanguage;
  theme: Theme;
}

const Navigation: React.FC<NavigationProps> = ({ currentScreen, onNavigate, language, theme }) => {
  // Simple dictionary for nav labels
  const navLabels: Record<AppLanguage, { home: string; advice: string; prices: string; schemes: string; profile: string }> = {
    en: { home: "HOME", advice: "ADVICE", prices: "RATES", schemes: "SCHEMES", profile: "USER" },
    hi: { home: "होम", advice: "सलाह", prices: "भाव", schemes: "योजनाएं", profile: "खाता" },
    pa: { home: "ਘਰ", advice: "ਸਲਾਹ", prices: "ਭਾਅ", schemes: "ਸਕੀਮਾਂ", profile: "ਖਾਤਾ" },
    mr: { home: "होम", advice: "सल्ला", prices: "भाव", schemes: "योजना", profile: "प्रोफाइल" },
    gu: { home: "ઘર", advice: "સલાહ", prices: "ભાવ", schemes: "યોજના", profile: "પ્રોફાઇલ" },
    bn: { home: "বাড়ি", advice: "পরামর্শ", prices: "দাম", schemes: "স্কিম", profile: "প্রোফাইল" },
    ta: { home: "வீடு", advice: "ஆலோசனை", prices: "விலை", schemes: "திட்டம்", profile: "சுயவிவரம்" },
    te: { home: "ఇల్లు", advice: "సలహా", prices: "ధరలు", schemes: "పథకాలు", profile: "ప్రొఫైల్" },
    kn: { home: "ಮನೆ", advice: "ಸಲಹೆ", prices: "ಬೆಲೆಗಳು", schemes: "ಯೋಜನೆ", profile: "ಪ್ರೊಫೈಲ್" },
    ml: { home: "വീട്", advice: "ഉപദേശം", prices: "വിലകൾ", schemes: "പദ്ധതി", profile: "പ്രൊഫൈൽ" }
  };

  const t = navLabels[language] || navLabels['en'];

  const navItems = [
    { icon: Home, label: t.home, screen: AppScreen.HOME },
    { icon: Sprout, label: t.advice, screen: AppScreen.CROP_ADVICE },
    { icon: Activity, label: 'SENSOR', screen: AppScreen.SENSOR_DASHBOARD },
    { icon: TrendingUp, label: t.prices, screen: AppScreen.MARKET_PRICES },
    { icon: BookOpen, label: t.schemes, screen: AppScreen.SCHEMES },
    { icon: User, label: t.profile, screen: AppScreen.PROFILE },
  ];

  const isDark = theme === 'dark';

  return (
    <nav className={`rounded-[40px] flex justify-around items-center p-3 mx-1 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] border transition-all duration-300 ${
      isDark 
        ? 'bg-[#022c22] border-emerald-800' 
        : 'bg-white border-white'
    }`}>
      {navItems.map((item) => {
        const isActive = currentScreen === item.screen;
        return (
          <button
            key={item.label}
            onClick={() => onNavigate(item.screen)}
            className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 min-w-[60px] rounded-3xl tap-squish relative ${
              isActive 
                ? isDark ? 'text-emerald-100 scale-105' : 'text-emerald-900 scale-105' 
                : isDark ? 'text-emerald-700/60 hover:text-emerald-500' : 'text-slate-400 hover:text-emerald-600'
            }`}
          >
            {isActive && (
              <div className={`absolute inset-0 rounded-3xl -z-10 ${
                isDark ? 'bg-emerald-800' : 'bg-emerald-100'
              }`}></div>
            )}
            <item.icon size={26} strokeWidth={isActive ? 2.5 : 2} />
            <span className={`text-[10px] font-black mt-1.5 tracking-tight uppercase ${isActive ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default Navigation;
