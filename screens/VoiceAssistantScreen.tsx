import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { AppLanguage } from '../types';
import { arduinoService } from '../services/arduinoService';
import { esp32Service } from '../services/esp32Service';
import { chatWithAI } from '../services/geminiService';

interface VoiceAssistantScreenProps {
  onBack: () => void;
  language: AppLanguage;
}

const VoiceAssistantScreen: React.FC<VoiceAssistantScreenProps> = ({ onBack, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusText, setStatusText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const translations = {
    title: language === 'hi' ? "एग्रीसारथी वॉइस AI" : "AgriSarthi Voice AI",
    statusListening: language === 'hi' ? "सुन रहा हूं... बोलो" : "Listening... Speak now",
    statusProcessing: language === 'hi' ? "सोच रहा हूं..." : "Thinking...",
    tapToSpeak: language === 'hi' ? "बोलने के लिए माइक दबाएं" : "Tap mic to speak",
    notSupported: language === 'hi' ? "आपके ब्राउज़र में वॉइस सपोर्ट नहीं है" : "Voice not supported in your browser",
  };

  const t = translations;

  const getSensorContext = () => {
    const usbData = arduinoService.getLastData();
    const wifiData = esp32Service.getLastData();
    
    const sensorData = usbData || wifiData;
    
    if (usbData && esp32Service.getConnectionStatus()) {
      return `Current farm readings from both sensors - Temperature: ${sensorData.temperature}°C, Humidity: ${sensorData.humidity}%, Soil Moisture: ${sensorData.soilMoisture}%, Irrigation: ${sensorData.relayStatus ? 'ON' : 'OFF'}. `;
    }
    
    return sensorData 
      ? `Current farm readings - Temperature: ${sensorData.temperature}°C, Humidity: ${sensorData.humidity}%, Soil Moisture: ${sensorData.soilMoisture}%. `
      : '';
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = language === 'hi' ? 'hi-IN' : 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        
        if (event.results[0].isFinal) {
          handleVoiceInput(transcript);
        } else {
          setStatusText(transcript);
        }
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }

    return () => { if (recognitionRef.current) recognitionRef.current.abort(); };
  }, [language]);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setStatusText('');
      setIsSpeaking(false);
      synthRef?.cancel();
      recognitionRef.current.start();
    } else {
      alert(t.notSupported);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setIsListening(false);
  };

  const speakResponse = (text: string) => {
    if (!synthRef) return;
    synthRef.cancel();
    setIsSpeaking(true);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'hi' ? 'hi-IN' : 'en-US';
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    synthRef.speak(utterance);
  };

  const handleVoiceInput = async (message: string) => {
    if (!message.trim()) return;

    setStatusText(message);
    setIsProcessing(true);

    try {
      const response = await chatWithAI(message, language, getSensorContext());
      speakResponse(response);
    } catch (error) {
      const errorMsg = language === 'hi' ? "माफ करना, कुछ गलत हो गया।" : "Sorry, something went wrong.";
      speakResponse(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950 overflow-hidden">
      <div className="flex-1 flex flex-col p-6 overflow-hidden">
        <header className="flex items-center mb-8 pt-8">
          <button onClick={onBack} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-white/90 shadow-xl border border-white/10 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{t.title}</h2>
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mt-1">Voice Assistant</p>
          </div>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-center space-y-8">
            <div className={`w-40 h-40 rounded-full flex items-center justify-center transition-all shadow-2xl ${isListening ? 'bg-red-500 animate-pulse scale-110' : isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-emerald-500'}`}>
              {isProcessing ? (
                <Loader2 size={64} className="text-white animate-spin" />
              ) : isSpeaking ? (
                <Volume2 size={64} className="text-white" />
              ) : isListening ? (
                <MicOff size={64} className="text-white" />
              ) : (
                <Mic size={64} className="text-white" />
              )}
            </div>

            <div className="space-y-2">
              <p className="text-2xl font-black text-white">
                {isListening ? t.statusListening : isProcessing ? t.statusProcessing : t.tapToSpeak}
              </p>
              
              {(statusText || isProcessing) && (
                <p className="text-lg font-bold text-emerald-200 max-w-md mx-auto">
                  {statusText}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="fixed bottom-12 left-0 right-0 flex justify-center z-50">
          <button 
            onClick={isListening ? stopListening : startListening} 
            disabled={isProcessing}
            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all shadow-2xl border-4 border-white/20 ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-400'} disabled:opacity-50`}
          >
            {isListening ? <MicOff size={40} className="text-white" /> : <Mic size={40} className="text-white" />}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistantScreen;
