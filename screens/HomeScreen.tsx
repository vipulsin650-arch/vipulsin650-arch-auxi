
import React, { useState, useEffect } from 'react';
import { 
  Sprout, 
  TrendingUp, 
  BookOpen, 
  Camera, 
  MapPin,
  Sun,
  RefreshCw,
  Globe,
  Pencil,
  Calculator,
  Mic,
  Sparkles,
  ShoppingBag,
  CalendarDays,
  Video,
  ChevronRight,
  Languages,
  Activity,
  Thermometer,
  Droplets,
  Power,
  Wifi,
  WifiOff
} from 'lucide-react';
import { AppScreen, User, Theme, AppLanguage, LANGUAGES, SensorData } from '../types';
import { getWeatherByLocationName } from '../services/geminiService';
import { arduinoService } from '../services/arduinoService';

interface HomeScreenProps {
  user: User | null;
  onSaveUser: (user: User) => void;
  onNavigate: (screen: AppScreen) => void;
  onOpenLangModal: () => void;
  language: AppLanguage;
  theme: Theme;
}

const HomeScreen: React.FC<HomeScreenProps> = ({ user, onSaveUser, onNavigate, onOpenLangModal, language, theme }) => {
  const [weather, setWeather] = useState<{ location: string, temp: string, condition: string } | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [currentLocationName, setCurrentLocationName] = useState(user?.locationName || '');
  
  const [isSensorConnected, setIsSensorConnected] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [isConnectingSensor, setIsConnectingSensor] = useState(false);
  
  const t = {
    greeting: language === 'hi' ? "नमस्ते," : "Welcome back,",
    services: language === 'hi' ? "किसान टूलबॉक्स" : "Farmer's Toolbox",
    weatherLabel: language === 'hi' ? "आज का मौसम" : "Weather Today",
    placeholder: language === 'hi' ? "अपने गाँव का नाम" : "Your Village Name",
    voiceBtn: language === 'hi' ? "आवाज सहायक" : "Voice Assistant",
    voiceDesc: language === 'hi' ? "मदद के लिए बोलें" : "Speak to get help",
    tapToOpen: language === 'hi' ? "खोलने के लिए दबाएं" : "Tap to launch"
  };

  const services = [
    { 
      id: AppScreen.CROP_SCHEDULE, 
      icon: CalendarDays, 
      title: language === 'hi' ? "मेरी योजना" : "Farm Schedule", 
      img: "https://images.unsplash.com/photo-1500673922987-e212871fec22?q=80&w=400&auto=format&fit=crop",
      color: "bg-emerald-600" 
    },
    { 
      id: AppScreen.CROP_PLANNER, 
      icon: Calculator, 
      title: language === 'hi' ? "भूमि योजना" : "Land Planner", 
      img: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=400&auto=format&fit=crop",
      color: "bg-indigo-600" 
    },
    { 
      id: AppScreen.CROP_ADVICE, 
      icon: Sprout, 
      title: language === 'hi' ? "फसल सलाह" : "Crop Advice", 
      img: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=400&auto=format&fit=crop",
      color: "bg-green-600" 
    },
    { 
      id: AppScreen.DISEASE_CHECK, 
      icon: Camera, 
      title: language === 'hi' ? "रोग की जांच" : "Disease Check", 
      img: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?q=80&w=400&auto=format&fit=crop",
      color: "bg-blue-600" 
    },
    { 
      id: AppScreen.MARKET_PRICES, 
      icon: TrendingUp, 
      title: language === 'hi' ? "बाजार भाव" : "Market Prices", 
      img: "https://images.unsplash.com/photo-1533900298318-6b8da08a523e?q=80&w=400&auto=format&fit=crop",
      color: "bg-amber-600" 
    },
    { 
      id: AppScreen.SCHEMES, 
      icon: BookOpen, 
      title: language === 'hi' ? "सरकारी योजनाएं" : "Govt Schemes", 
      img: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?q=80&w=400&auto=format&fit=crop",
      color: "bg-slate-800" 
    },
    { 
      id: AppScreen.TUTORIALS, 
      icon: Video, 
      title: language === 'hi' ? "वीडियो ट्यूटोरियल" : "Video Tutorials", 
      img: "https://images.unsplash.com/photo-1592982537447-7440770cbfc9?q=80&w=400&auto=format&fit=crop",
      color: "bg-red-500" 
    },
    { 
      id: AppScreen.MARKETPLACE, 
      icon: ShoppingBag, 
      title: language === 'hi' ? "डिजिटल मार्केटिंग" : "Marketplace", 
      img: "https://images.unsplash.com/photo-1488459711615-de64efb969bb?q=80&w=400&auto=format&fit=crop",
      color: "bg-orange-500" 
    },
  ];

  const fetchWeather = async (locName: string) => {
    if (!locName) return;
    setLoadingWeather(true);
    try {
      const data = await getWeatherByLocationName(locName, language);
      setWeather(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingWeather(false);
    }
  };

  useEffect(() => {
    if (user?.locationName) {
      fetchWeather(user.locationName);
    }
  }, [language, user?.locationName]);

  useEffect(() => {
    const handleSensorUpdate = (data: SensorData) => {
      setSensorData(data);
      setIsSensorConnected(true);
    };

    const unsubscribe = arduinoService.subscribe(handleSensorUpdate);
    
    if (arduinoService.getConnectionStatus()) {
      setIsSensorConnected(true);
      setSensorData(arduinoService.getLastData());
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleSensorConnect = async () => {
    setIsConnectingSensor(true);
    const success = await arduinoService.connect();
    setIsSensorConnected(success);
    if (success) {
      const data = arduinoService.getLastData();
      if (data) setSensorData(data);
    }
    setIsConnectingSensor(false);
  };

  const handleUpdateLocation = () => {
    if (currentLocationName.trim()) {
      setIsEditingLocation(false);
      fetchWeather(currentLocationName);
      if (user) onSaveUser({ ...user, locationName: currentLocationName });
    }
  };

  return (
    <div className="flex flex-col min-h-full pb-32 overflow-x-hidden relative">
      
      {/* HEADER SECTION */}
      <div className="p-6 pt-12 pb-4">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 glass-card rounded-2xl flex items-center justify-center text-emerald-700 shadow-lg">
              <Sprout size={28} />
            </div>
            <div>
              <h1 className="text-emerald-900/40 text-[10px] font-black uppercase tracking-[0.3em] leading-none mb-1.5">{t.greeting}</h1>
              <p className="text-emerald-950 text-2xl font-black tracking-tight">{user?.name || 'Farmer'}</p>
            </div>
          </div>
          <button 
            onClick={onOpenLangModal}
            className="p-3.5 glass-card text-emerald-900 rounded-2xl active:scale-90 transition-transform flex items-center space-x-2"
          >
            <Languages size={22} />
            <span className="text-xs font-black uppercase hidden sm:block">{LANGUAGES[language].nativeName}</span>
          </button>
        </div>

        {/* WEATHER HERO */}
        <div className="glass-card p-6 rounded-[32px] shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/20 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg">
                {loadingWeather ? <Globe size={24} className="animate-spin" /> : <Sun size={24} />}
              </div>
              <div>
                <p className="text-emerald-900/60 text-[10px] font-black uppercase tracking-[0.2em]">{t.weatherLabel}</p>
                <div className="flex items-center mt-1">
                  <h2 className="text-emerald-950 text-3xl font-black tracking-tighter leading-none">{loadingWeather ? "--°" : weather?.temp || "28°C"}</h2>
                  <span className="ml-2 text-[10px] font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                    {weather?.condition || "Sunny"}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={() => fetchWeather(currentLocationName)} className="p-3 bg-emerald-50 text-emerald-600 rounded-xl active:rotate-180 transition-transform">
              <RefreshCw size={18} />
            </button>
          </div>
          
          <div className="mt-5 p-3.5 bg-emerald-900/5 rounded-2xl flex items-center justify-between cursor-pointer" onClick={() => setIsEditingLocation(true)}>
            <div className="flex items-center">
              <MapPin size={16} className="text-emerald-600 mr-2" />
              <span className="text-[11px] font-black text-emerald-900 uppercase truncate max-w-[150px]">{currentLocationName || "Set Location"}</span>
            </div>
            <Pencil size={12} className="text-emerald-600/40" />
          </div>

          {isEditingLocation && (
            <div className="absolute inset-0 bg-white p-6 z-20 flex flex-col justify-center">
               <input 
                 autoFocus
                 type="text"
                 value={currentLocationName}
                 onChange={(e) => setCurrentLocationName(e.target.value)}
                 className="text-xl font-black text-emerald-950 border-b-2 border-emerald-600 outline-none pb-1 mb-4"
                 placeholder={t.placeholder}
               />
               <button onClick={handleUpdateLocation} className="bg-emerald-600 text-white py-3 rounded-xl font-black text-xs">Update</button>
             </div>
           )}
        </div>

        {/* SENSOR CARD */}
        <div 
          onClick={!isSensorConnected ? handleSensorConnect : undefined}
          className={`glass-card p-6 rounded-[32px] shadow-xl relative overflow-hidden mb-8 ${!isSensorConnected ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}`}
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-400/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className={`p-2.5 rounded-xl ${isSensorConnected ? 'bg-cyan-100' : 'bg-gray-100'}`}>
                {isConnectingSensor ? <RefreshCw size={18} className="text-cyan-600 animate-spin" /> : isSensorConnected ? <Activity size={18} className="text-cyan-600" /> : <WifiOff size={18} className="text-gray-400" />}
              </div>
              <div>
                <span className="text-emerald-900/60 text-[10px] font-black uppercase tracking-[0.2em]">Sensors</span>
                <div className="flex items-center mt-0.5">
                  <div className={`w-2 h-2 rounded-full ${isSensorConnected ? 'bg-cyan-500 animate-pulse' : 'bg-gray-300'}`}></div>
                  <span className={`ml-2 text-[9px] font-black uppercase ${isSensorConnected ? 'text-cyan-600' : 'text-gray-400'}`}>
                    {isConnectingSensor ? (language === 'hi' ? 'कनेक्ट हो रहे हैं...' : 'Connecting...') : isSensorConnected ? (language === 'hi' ? 'कनेक्टेड' : 'Connected') : (language === 'hi' ? 'टैप करके कनेक्ट करें' : 'Tap to Connect')}
                  </span>
                </div>
              </div>
            </div>
            {isSensorConnected && (
              <button 
                onClick={(e) => { e.stopPropagation(); handleSensorConnect(); }}
                className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl active:scale-90 transition-transform"
              >
                <RefreshCw size={16} className={isConnectingSensor ? 'animate-spin' : ''} />
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-emerald-900/5 p-3.5 rounded-2xl">
              <div className="flex items-center space-x-2 mb-1">
                <Droplets size={12} className="text-blue-400" />
                <p className="text-[8px] text-emerald-900/40 font-black uppercase tracking-wider">Soil Moisture</p>
              </div>
              <p className="text-xl font-black text-emerald-950">{sensorData?.soilMoisture ?? '-'}%</p>
            </div>
            <div className="bg-emerald-900/5 p-3.5 rounded-2xl">
              <div className="flex items-center space-x-2 mb-1">
                <Thermometer size={12} className="text-orange-400" />
                <p className="text-[8px] text-emerald-900/40 font-black uppercase tracking-wider">Temperature</p>
              </div>
              <p className="text-xl font-black text-emerald-950">{sensorData?.temperature ?? '-'}°C</p>
            </div>
            <div className="bg-emerald-900/5 p-3.5 rounded-2xl">
              <div className="flex items-center space-x-2 mb-1">
                <Activity size={12} className="text-purple-400" />
                <p className="text-[8px] text-emerald-900/40 font-black uppercase tracking-wider">Humidity</p>
              </div>
              <p className="text-xl font-black text-emerald-950">{sensorData?.humidity ?? '-'}%</p>
            </div>
            <div className="bg-emerald-900/5 p-3.5 rounded-2xl">
              <div className="flex items-center space-x-2 mb-1">
                <Power size={12} className={sensorData?.relayStatus ? 'text-emerald-500' : 'text-gray-400'} />
                <p className="text-[8px] text-emerald-900/40 font-black uppercase tracking-wider">Irrigation</p>
              </div>
              <p className={`text-xl font-black ${sensorData?.relayStatus ? 'text-emerald-600' : 'text-gray-400'}`}>
                {sensorData?.relayStatus ? 'ON' : 'OFF'}
              </p>
            </div>
          </div>
        </div>

        {/* VOICE AI SHORTCUT */}
        <div 
          onClick={() => onNavigate(AppScreen.VOICE_ASSISTANT)}
          className="bg-emerald-900 rounded-[32px] p-6 mb-8 shadow-2xl relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
        >
          <div className="absolute right-[-20px] bottom-[-20px] opacity-10 scale-150 rotate-12 group-hover:scale-110 transition-transform">
             <Mic size={120} />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center space-x-4">
               <div className="bg-emerald-500 p-3.5 rounded-2xl text-white shadow-xl">
                  <Mic size={24} />
               </div>
               <div>
                  <h2 className="text-white text-lg font-black uppercase tracking-tight">{t.voiceBtn}</h2>
                  <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{t.voiceDesc}</p>
               </div>
            </div>
            <div className="bg-white/10 p-2 rounded-full text-white/40">
               <Sparkles size={16} />
            </div>
          </div>
        </div>

        {/* SERVICES GRID */}
        <h2 className="text-[11px] font-black text-emerald-900/30 uppercase tracking-[0.4em] mb-5 ml-2">{t.services}</h2>
        <div className="grid grid-cols-2 gap-4">
          {services.map((f) => (
            <button
              key={f.id}
              onClick={() => onNavigate(f.id)}
              className="glass-card rounded-[32px] overflow-hidden flex flex-col items-start shadow-sm active:scale-[0.97] transition-all group text-left"
            >
              <div className="feature-card-img w-full h-28">
                <img src={f.img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={f.title} />
                <div className="absolute top-3 left-3 z-10">
                   <div className={`${f.color} p-2 rounded-xl text-white shadow-lg`}>
                      <f.icon size={16} />
                   </div>
                </div>
              </div>
              <div className="p-4 w-full">
                <h3 className="font-black text-emerald-950 text-[12px] uppercase tracking-tight mb-1">{f.title}</h3>
                <div className="flex items-center justify-between opacity-30">
                  <span className="text-[8px] font-black uppercase tracking-widest">{t.tapToOpen}</span>
                  <ChevronRight size={10} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default HomeScreen;
