
import React, { useState, useEffect } from 'react';
import { AppScreen, User, Theme, AppLanguage, LANGUAGES } from './types';
import SplashScreen from './screens/SplashScreen';
import HomeScreen from './screens/HomeScreen';
import LoginScreen from './screens/LoginScreen';
import CropAdviceScreen from './screens/CropAdviceScreen';
import DiseaseCheckScreen from './screens/DiseaseCheckScreen';
import MarketPricesScreen from './screens/MarketPricesScreen';
import SchemesScreen from './screens/SchemesScreen';
import ProfileScreen from './screens/ProfileScreen';
import CropPlannerScreen from './screens/CropPlannerScreen';
import VoiceAssistantScreen from './screens/VoiceAssistantScreen';
import MarketplaceScreen from './screens/MarketplaceScreen';
import CropScheduleScreen from './screens/CropScheduleScreen';
import TutorialsScreen from './screens/TutorialsScreen';
import SensorDashboardScreen from './screens/SensorDashboardScreen';
import Navigation from './components/Navigation';
import { X, Check } from 'lucide-react';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(AppScreen.SPLASH);
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('agrisarthi_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [language, setLanguage] = useState<AppLanguage>(() => {
    return (localStorage.getItem('language') as AppLanguage) || 'hi';
  });
  
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'light';
  });

  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const applyTheme = (isDark: boolean) => {
      setIsDarkMode(isDark);
      if (isDark) {
        document.body.classList.add('dark-theme');
      } else {
        document.body.classList.remove('dark-theme');
      }
    };

    const updateTheme = () => {
      if (theme === 'system') applyTheme(mediaQuery.matches);
      else applyTheme(theme === 'dark');
    };

    updateTheme();
    mediaQuery.addEventListener('change', updateTheme);
    return () => mediaQuery.removeEventListener('change', updateTheme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    if (currentScreen === AppScreen.SPLASH) {
      const timer = setTimeout(() => {
        setCurrentScreen(AppScreen.HOME);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [currentScreen]);

  const handleSaveUser = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('agrisarthi_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('agrisarthi_user');
    setCurrentScreen(AppScreen.HOME);
  };

  const renderScreen = () => {
    const props = { 
      language, 
      theme: (isDarkMode ? 'dark' : 'light') as Theme, 
      currentTheme: theme 
    };

    // If no user is logged in and we are not on splash, show Login Screen
    if (!user && currentScreen !== AppScreen.SPLASH) {
      return (
        <div className="page-transition h-full overflow-y-auto no-scrollbar">
          <LoginScreen 
            onLogin={(name, phone, locationName) => handleSaveUser({ name, phone, locationName })} 
            setGlobalLanguage={setLanguage} 
          />
        </div>
      );
    }
    
    return (
      <div key={currentScreen} className="page-transition h-full overflow-y-auto no-scrollbar">
        {(() => {
          switch (currentScreen) {
            case AppScreen.SPLASH: return <SplashScreen />;
            case AppScreen.HOME: return (
              <HomeScreen 
                user={user} 
                onSaveUser={handleSaveUser} 
                onNavigate={setCurrentScreen} 
                onOpenLangModal={() => setShowLangModal(true)}
                {...props} 
              />
            );
            case AppScreen.CROP_ADVICE: return <CropAdviceScreen onBack={() => setCurrentScreen(AppScreen.HOME)} {...props} />;
            case AppScreen.DISEASE_CHECK: return <DiseaseCheckScreen onBack={() => setCurrentScreen(AppScreen.HOME)} {...props} />;
            case AppScreen.MARKET_PRICES: return <MarketPricesScreen user={user} onBack={() => setCurrentScreen(AppScreen.HOME)} {...props} />;
            case AppScreen.SCHEMES: return <SchemesScreen onBack={() => setCurrentScreen(AppScreen.HOME)} {...props} />;
            case AppScreen.CROP_PLANNER: return <CropPlannerScreen onBack={() => setCurrentScreen(AppScreen.HOME)} {...props} />;
            case AppScreen.VOICE_ASSISTANT: return <VoiceAssistantScreen onBack={() => setCurrentScreen(AppScreen.HOME)} language={language} />;
            case AppScreen.MARKETPLACE: return <MarketplaceScreen onBack={() => setCurrentScreen(AppScreen.HOME)} language={language} />;
            case AppScreen.CROP_SCHEDULE: return <CropScheduleScreen onBack={() => setCurrentScreen(AppScreen.HOME)} language={language} />;
            case AppScreen.TUTORIALS: return <TutorialsScreen onBack={() => setCurrentScreen(AppScreen.HOME)} language={language} />;
            case AppScreen.SENSOR_DASHBOARD: return <SensorDashboardScreen onBack={() => setCurrentScreen(AppScreen.HOME)} language={language} />;
            case AppScreen.PROFILE: return (
              <ProfileScreen 
                user={user} 
                onBack={() => setCurrentScreen(AppScreen.HOME)} 
                onLogout={handleLogout} 
                onThemeToggle={setTheme} 
                onLanguageToggle={(l: any) => setLanguage(l)} 
                {...props} 
              />
            );
            default: return (
              <HomeScreen 
                user={user} 
                onSaveUser={handleSaveUser} 
                onNavigate={setCurrentScreen} 
                onOpenLangModal={() => setShowLangModal(true)}
                {...props} 
              />
            );
          }
        })()}
      </div>
    );
  };

  return (
    <div className={`max-w-md mx-auto h-screen flex flex-col ios-bg shadow-2xl overflow-hidden relative ${isDarkMode ? 'dark-theme' : ''}`}>
      <div className="flex-1 overflow-y-auto overflow-x-hidden relative">
        {renderScreen()}
      </div>
      
      {currentScreen !== AppScreen.SPLASH && user && (
        <div className="absolute bottom-6 left-4 right-4 z-[50] animate-[slideUp_0.8s_cubic-bezier(0.34,1.56,0.64,1)]">
          <Navigation 
            currentScreen={currentScreen} 
            onNavigate={setCurrentScreen} 
            language={language}
            theme={(isDarkMode ? 'dark' : 'light') as Theme}
          />
        </div>
      )}

      {/* Language Modal */}
      {showLangModal && (
        <div className="absolute inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200">
           <div className="bg-white w-full max-w-sm mx-4 mb-4 sm:mb-0 rounded-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom-10 duration-300">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-black text-emerald-950 uppercase tracking-tight">Select Language</h3>
                 <button onClick={() => setShowLangModal(false)} className="p-2 bg-gray-100 rounded-full text-gray-500">
                   <X size={20} />
                 </button>
              </div>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto no-scrollbar pb-4">
                 {Object.entries(LANGUAGES).map(([code, { name, nativeName }]) => (
                   <button
                     key={code}
                     onClick={() => {
                       setLanguage(code as AppLanguage);
                       setShowLangModal(false);
                     }}
                     className={`p-4 rounded-2xl border-2 flex flex-col items-start transition-all ${
                       language === code 
                         ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' 
                         : 'bg-gray-50 border-gray-100 text-gray-600 hover:bg-emerald-50'
                     }`}
                   >
                     <span className="text-lg font-bold">{nativeName}</span>
                     <span className={`text-[10px] font-black uppercase tracking-widest mt-1 ${language === code ? 'text-emerald-200' : 'text-gray-400'}`}>{name}</span>
                     {language === code && (
                       <div className="absolute top-3 right-3 bg-white/20 p-1 rounded-full">
                         <Check size={12} />
                       </div>
                     )}
                   </button>
                 ))}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;
