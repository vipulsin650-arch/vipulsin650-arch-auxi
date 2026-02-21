
import React, { useState, useEffect, useCallback } from 'react';
import { ChevronLeft, Activity, Thermometer, Droplets, Power, Sparkles, Loader2, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { AppLanguage, SensorData } from '../types';
import { arduinoService } from '../services/arduinoService';
import { getSensorAdvice } from '../services/sensorAdviceService';

interface SensorDashboardScreenProps {
  onBack: () => void;
  language: AppLanguage;
}

const SensorDashboardScreen: React.FC<SensorDashboardScreenProps> = ({ onBack, language }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [sensorData, setSensorData] = useState<SensorData | null>(null);
  const [aiAdvice, setAiAdvice] = useState<string>('');
  const [isLoadingAdvice, setIsLoadingAdvice] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const handleSensorUpdate = useCallback((data: SensorData) => {
    setSensorData(data);
  }, []);

  useEffect(() => {
    const unsubscribe = arduinoService.subscribe(handleSensorUpdate);
    setIsConnected(arduinoService.getConnectionStatus());
    setSensorData(arduinoService.getLastData());

    return () => {
      unsubscribe();
    };
  }, [handleSensorUpdate]);

  const handleConnect = async () => {
    setIsConnecting(true);
    const success = await arduinoService.connect();
    setIsConnected(success);
    setIsConnecting(false);
    
    if (success) {
      const data = arduinoService.getLastData();
      if (data) setSensorData(data);
    }
  };

  const handleDisconnect = async () => {
    await arduinoService.disconnect();
    setIsConnected(false);
    setSensorData(null);
    setAiAdvice('');
  };

  const handleRelayToggle = async () => {
    if (!sensorData) return;
    setIsToggling(true);
    
    const newState = sensorData.relayStatus ? 'OFF' : 'ON';
    await arduinoService.sendRelayCommand(newState);
    
    setTimeout(() => {
      const data = arduinoService.getLastData();
      if (data) setSensorData(data);
      setIsToggling(false);
    }, 1000);
  };

  const handleGetAdvice = async () => {
    if (!sensorData) return;
    setIsLoadingAdvice(true);
    
    try {
      const advice = await getSensorAdvice(sensorData, language);
      setAiAdvice(advice);
    } catch (error) {
      console.error('Error getting advice:', error);
      setAiAdvice(language === 'hi' ? 'सलाह लेने में त्रुटि।' : 'Error getting advice.');
    } finally {
      setIsLoadingAdvice(false);
    }
  };

  const t = {
    title: language === 'hi' ? 'सेंसर डैशबोर्ड' : 'Sensor Dashboard',
    connect: language === 'hi' ? 'सेंसर कनेक्ट करें' : 'Connect Sensors',
    disconnect: language === 'hi' ? 'डिस्कनेक्ट करें' : 'Disconnect',
    connecting: language === 'hi' ? 'कनेक्ट हो रहे हैं...' : 'Connecting...',
    notConnected: language === 'hi' ? 'सेंसर से कनेक्ट नहीं है' : 'Not Connected',
    connected: language === 'hi' ? 'कनेक्टेड' : 'Connected',
    soilMoisture: language === 'hi' ? 'मिट्टी की नमी' : 'Soil Moisture',
    temperature: language === 'hi' ? 'तापमान' : 'Temperature',
    humidity: language === 'hi' ? 'नमी' : 'Humidity',
    irrigation: language === 'hi' ? 'सिंचाई' : 'Irrigation',
    getAdvice: language === 'hi' ? 'AI सलाह लें' : 'Get AI Advice',
    relayOn: language === 'hi' ? 'चालू' : 'ON',
    relayOff: language === 'hi' ? 'बंद' : 'OFF',
    tapToConnect: language === 'hi' ? 'सेंसर से कनेक्ट करने के लिए टैप करें' : 'Tap to connect to sensors'
  };

  return (
    <div className="min-h-full flex flex-col bg-emerald-950 text-white p-6 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400 rounded-full blur-[120px]"></div>
      </div>

      <header className="relative z-10 flex items-center mb-8">
        <button onClick={onBack} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="ml-4">
          <h2 className="text-xl font-black uppercase tracking-tight leading-none">{t.title}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">
              {isConnecting ? t.connecting : isConnected ? t.connected : t.notConnected}
            </p>
          </div>
        </div>
      </header>

      {!isConnected ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-8">
            <Activity size={48} className="text-emerald-400/40" />
          </div>
          <p className="text-emerald-100/40 text-sm font-bold text-center mb-8 max-w-xs">{t.tapToConnect}</p>
          <button 
            onClick={handleConnect}
            disabled={isConnecting}
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center space-x-3 shadow-xl active:scale-95 transition-transform"
          >
            {isConnecting ? <Loader2 size={18} className="animate-spin" /> : <Wifi size={18} />}
            <span>{isConnecting ? t.connecting : t.connect}</span>
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
            <div className="glass-card p-5 rounded-[32px] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <Droplets size={20} className="text-blue-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>
              <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-wider">{t.soilMoisture}</p>
              <p className="text-3xl font-black mt-1">{sensorData?.soilMoisture ?? '--'}<span className="text-lg">%</span></p>
            </div>

            <div className="glass-card p-5 rounded-[32px] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <Thermometer size={20} className="text-orange-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>
              <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-wider">{t.temperature}</p>
              <p className="text-3xl font-black mt-1">{sensorData?.temperature ?? '--'}<span className="text-lg">°C</span></p>
            </div>

            <div className="glass-card p-5 rounded-[32px] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <Activity size={20} className="text-purple-400" />
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
              </div>
              <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-wider">{t.humidity}</p>
              <p className="text-3xl font-black mt-1">{sensorData?.humidity ?? '--'}<span className="text-lg">%</span></p>
            </div>

            <div className="glass-card p-5 rounded-[32px] shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <Power size={20} className={sensorData?.relayStatus ? 'text-emerald-400' : 'text-gray-400'} />
                <div className={`w-2 h-2 rounded-full ${sensorData?.relayStatus ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
              </div>
              <p className="text-emerald-100/60 text-[10px] font-black uppercase tracking-wider">{t.irrigation}</p>
              <p className={`text-2xl font-black mt-1 ${sensorData?.relayStatus ? 'text-emerald-400' : 'text-gray-400'}`}>
                {sensorData?.relayStatus ? t.relayOn : t.relayOff}
              </p>
            </div>
          </div>

          <button 
            onClick={handleRelayToggle}
            disabled={isToggling}
            className={`w-full py-4 rounded-[24px] font-black text-xs uppercase tracking-[0.15em] mb-4 flex items-center justify-center space-x-2 shadow-lg transition-all ${
              sensorData?.relayStatus 
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30' 
                : 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30'
            }`}
          >
            {isToggling ? <Loader2 size={16} className="animate-spin" /> : <Power size={16} />}
            <span>{sensorData?.relayStatus ? (language === 'hi' ? 'सिंचाई बंद करें' : 'Turn Off Irrigation') : (language === 'hi' ? 'सिंचाई चालू करें' : 'Turn On Irrigation')}</span>
          </button>

          <button 
            onClick={handleGetAdvice}
            disabled={isLoadingAdvice}
            className="w-full py-5 rounded-[30px] font-black text-sm uppercase tracking-[0.2em] flex items-center justify-center space-x-3 shadow-xl bg-emerald-600 text-white active:scale-[0.98] transition-all mb-4"
          >
            {isLoadingAdvice ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            <span>{isLoadingAdvice ? (language === 'hi' ? 'सलाह ले रहे हैं...' : 'Getting Advice...') : t.getAdvice}</span>
          </button>

          {aiAdvice && (
            <div className="glass-card p-5 rounded-[32px] shadow-lg flex-1 overflow-y-auto">
              <div className="flex items-center space-x-2 mb-3">
                <Sparkles size={16} className="text-emerald-400" />
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-wider">{language === 'hi' ? 'AI सलाह' : 'AI Advice'}</p>
              </div>
              <p className="text-emerald-100 text-sm font-bold leading-relaxed whitespace-pre-line">{aiAdvice}</p>
            </div>
          )}

          <button 
            onClick={handleDisconnect}
            className="mt-4 py-3 text-emerald-400/60 text-xs font-black uppercase tracking-widest flex items-center justify-center space-x-2"
          >
            <WifiOff size={14} />
            <span>{t.disconnect}</span>
          </button>
        </>
      )}
    </div>
  );
};

export default SensorDashboardScreen;
