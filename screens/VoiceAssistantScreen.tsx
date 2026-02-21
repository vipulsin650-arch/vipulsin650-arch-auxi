import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Mic, MicOff, Volume2, Loader2, Send } from 'lucide-react';
import { AppLanguage, LANGUAGES } from '../types';
import { arduinoService } from '../services/arduinoService';
import { chatWithAI } from '../services/groqService';

interface VoiceAssistantScreenProps {
  onBack: () => void;
  language: AppLanguage;
}

const VoiceAssistantScreen: React.FC<VoiceAssistantScreenProps> = ({ onBack, language }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  const [inputText, setInputText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const synthRef = typeof window !== 'undefined' ? window.speechSynthesis : null;

  const translations = {
    title: language === 'hi' ? "एग्रीसारथी वॉइस AI" : "AgriSarthi Voice AI",
    statusListening: language === 'hi' ? "सुन रहा हूं..." : "Listening...",
    statusProcessing: language === 'hi' ? "सोच रहा हूं..." : "Thinking...",
    instruction: language === 'hi' ? "बोलने के लिए माइक दबाएं या टाइप करें" : "Tap mic to speak or type",
    placeholder: language === 'hi' ? "अपना सवाल लिखें..." : "Type your question...",
  };

  const t = translations;

  const getSensorContext = () => {
    const sensorData = arduinoService.getLastData();
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
          setInputText(transcript);
          handleSendMessage(transcript);
        } else {
          setCurrentText(transcript);
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
      setCurrentText('');
      recognitionRef.current.start();
    } else {
      alert('Speech recognition not supported. Please type.');
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

  const handleSendMessage = async (message?: string) => {
    const textToSend = message || inputText;
    if (!textToSend.trim()) return;

    setIsProcessing(true);
    setCurrentText('');
    setInputText('');
    setTranscription(prev => [textToSend, ...prev].slice(0, 10));

    try {
      const response = await chatWithAI(textToSend, language, getSensorContext());
      setTranscription(prev => [response, ...prev].slice(0, 10));
      speakResponse(response);
    } catch (error) {
      const errorMsg = language === 'hi' ? "माफ करना, कुछ गलत हो गया।" : "Sorry, something went wrong.";
      setTranscription(prev => [errorMsg, ...prev].slice(0, 10));
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="relative min-h-full flex flex-col bg-gradient-to-b from-emerald-900 via-emerald-800 to-emerald-950">
      <div className="relative z-10 flex flex-col h-full p-6 pb-32 overflow-y-auto">
        <header className="flex items-center mb-8 mt-8">
          <button onClick={onBack} className="bg-white/10 backdrop-blur-md p-3 rounded-2xl text-white/90 shadow-xl border border-white/10 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
            <h2 className="text-2xl font-black text-white tracking-tight leading-none uppercase">{t.title}</h2>
            <p className="text-[10px] font-black text-emerald-300 uppercase tracking-widest mt-1">Voice Assistant</p>
          </div>
        </header>

        <div className="flex-1 space-y-4">
          {transcription.map((text, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              <div className={`max-w-[85%] p-5 rounded-[25px] shadow-lg ${i % 2 === 0 ? 'bg-white text-emerald-900 rounded-br-md' : 'bg-emerald-700/80 text-white rounded-bl-md backdrop-blur-sm'}`}>
                <p className="text-sm font-bold leading-relaxed">{text}</p>
              </div>
            </div>
          ))}

          {(isProcessing || currentText) && (
            <div className="flex justify-end">
              <div className="max-w-[85%] p-5 rounded-[25px] shadow-lg bg-white/10 backdrop-blur-sm border border-white/10 rounded-br-md">
                <div className="flex items-center space-x-2">
                  <Loader2 className="animate-spin text-emerald-300" size={18} />
                  <p className="text-sm font-bold text-emerald-200">{isProcessing ? t.statusProcessing : currentText}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="fixed bottom-6 left-4 right-4 z-50">
          <div className="bg-white/10 backdrop-blur-xl rounded-[40px] p-4 shadow-2xl border border-white/10">
            <div className="flex items-center space-x-3">
              <button onClick={isListening ? stopListening : startListening} disabled={isProcessing} className={`w-16 h-16 rounded-full flex items-center justify-center transition-all shadow-lg ${isListening ? 'bg-red-500 animate-pulse' : 'bg-emerald-500 hover:bg-emerald-400'} disabled:opacity-50`}>
                {isListening ? <MicOff size={28} className="text-white" /> : <Mic size={28} className="text-white" />}
              </button>
              
              <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder={t.placeholder} disabled={isProcessing} className="flex-1 bg-white/20 backdrop-blur-sm rounded-[25px] px-5 py-4 text-white placeholder-white/50 font-bold outline-none border border-white/10 focus:bg-white/30 transition-all" />
              
              <button onClick={() => handleSendMessage()} disabled={!inputText.trim() || isProcessing} className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg active:scale-95 transition-transform disabled:opacity-50">
                {isProcessing ? <Loader2 className="animate-spin text-white" size={22} /> : <Send size={22} className="text-white" />}
              </button>
            </div>
            <div className="flex items-center justify-center mt-3">
              <p className="text-[10px] font-black text-emerald-300/70 uppercase tracking-widest">
                {isListening ? t.statusLis
