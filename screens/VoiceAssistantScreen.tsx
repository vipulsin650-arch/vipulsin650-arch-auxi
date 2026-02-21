
import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Mic, MicOff, Volume2, Sparkles, MessageSquare, Loader2 } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { AppLanguage, LANGUAGES } from '../types';
import { arduinoService } from '../services/arduinoService';

interface VoiceAssistantScreenProps {
  onBack: () => void;
  language: AppLanguage;
}

/**
 * Manual Encoding/Decoding as per Google GenAI SDK rules
 */
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

const VoiceAssistantScreen: React.FC<VoiceAssistantScreenProps> = ({ onBack, language }) => {
  const [isActive, setIsActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const [currentText, setCurrentText] = useState('');
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // Get sensor data for AI context
  const sensorData = arduinoService.getLastData();
  const sensorContext = sensorData 
    ? `IMPORTANT: Current farm sensor readings - Temperature: ${sensorData.temperature}°C, Humidity: ${sensorData.humidity}%, Soil Moisture: ${sensorData.soilMoisture}%, Irrigation: ${sensorData.relayStatus ? 'ON' : 'OFF'}. Use this data to provide personalized advice. `
    : '';

  // Dynamic system prompt based on selected language
  const langName = LANGUAGES[language].name;
  const systemPrompt = `You are AgriSarthi AI, a highly knowledgeable agricultural expert. You help Indian farmers with crop advice, weather, pest control, and government schemes. Keep responses helpful, direct, and empathetic. Speak in ${langName} clearly. Always use Google Search to provide the latest, up-to-date information. ${sensorContext}`;

  const translations = {
    title: language === 'hi' ? "एग्रीसारथी वॉइस AI" : "AgriSarthi Voice AI",
    statusIdle: language === 'hi' ? "सुनने के लिए तैयार" : "Ready to Listen",
    statusActive: language === 'hi' ? "AI सुन रहा है..." : "AI is Listening...",
    statusConnecting: language === 'hi' ? "AI से जुड़ रहे हैं..." : "Connecting to Expert AI...",
    instruction: language === 'hi' ? "अपनी खेती की समस्याओं के बारे में बात करने के लिए माइक दबाएं।" : "Tap the mic to start talking about your farm issues.",
    stop: language === 'hi' ? "सत्र समाप्त करें" : "Stop Session",
    start: language === 'hi' ? "बात शुरू करें" : "Start Talking"
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
      audioContextRef.current = null;
    }
    sourcesRef.current.forEach(s => s.stop());
    sourcesRef.current.clear();
    setIsActive(false);
    setIsConnecting(false);
  };

  const startSession = async () => {
    setIsConnecting(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          // Enable Google Search for the Live API
          tools: [{ googleSearch: {} }],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } },
          },
          systemInstruction: systemPrompt,
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) int16[i] = inputData[i] * 32768;
              
              sessionPromise.then((session) => {
                session.sendRealtimeInput({
                  media: {
                    data: encode(new Uint8Array(int16.buffer)),
                    mimeType: 'audio/pcm;rate=16000'
                  }
                });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.outputTranscription) {
              setCurrentText(prev => prev + message.serverContent!.outputTranscription!.text);
            }
            if (message.serverContent?.turnComplete) {
              setCurrentText(text => {
                if (text) setTranscription(prev => [text, ...prev].slice(0, 10));
                return '';
              });
            }

            const audioBase64 = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioBase64 && audioContextRef.current) {
              const outCtx = audioContextRef.current.output;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
              const audioBuffer = await decodeAudioData(decode(audioBase64), outCtx, 24000, 1);
              const source = outCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outCtx.destination);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
              source.onended = () => sourcesRef.current.delete(source);
            }

            if (message.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => {
            console.error('Voice Assistant Error:', e);
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error('Failed to start session:', err);
      setIsConnecting(false);
    }
  };

  useEffect(() => {
    return () => stopSession();
  }, []);

  return (
    <div className="min-h-full flex flex-col bg-emerald-950 text-white p-6 relative overflow-hidden">
      {/* BACKGROUND DECORATION */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-400 rounded-full blur-[120px] transition-all duration-1000 ${isActive ? 'scale-110 opacity-30' : 'scale-90 opacity-10'}`}></div>
      </div>

      <header className="relative z-10 flex items-center mb-12">
        <button onClick={onBack} className="p-3 bg-white/10 rounded-2xl text-white active:scale-90 transition-transform">
          <ChevronLeft size={24} />
        </button>
        <div className="ml-4">
          <h2 className="text-xl font-black uppercase tracking-tight leading-none">{translations.title}</h2>
          <div className="flex items-center space-x-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`}></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400/60">
              {isConnecting ? translations.statusConnecting : isActive ? translations.statusActive : translations.statusIdle}
            </p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex flex-col items-center justify-center relative z-10">
        {/* CENTRAL PULSING MIC BUTTON */}
        <div className="relative mb-20">
          {isActive && (
            <>
              <div className="absolute inset-0 bg-emerald-400 rounded-full animate-ping opacity-20"></div>
              <div className="absolute -inset-8 bg-emerald-400/10 rounded-full animate-pulse blur-xl"></div>
            </>
          )}
          <button 
            onClick={isActive ? stopSession : startSession}
            disabled={isConnecting}
            className={`w-48 h-48 rounded-[70px] flex items-center justify-center transition-all duration-500 shadow-2xl relative z-10 border-4 ${isActive ? 'bg-emerald-500 border-emerald-300 scale-105 shadow-emerald-500/50' : 'bg-white/5 border-white/10 active:scale-95'}`}
          >
            {isConnecting ? (
              <Loader2 size={80} className="animate-spin text-emerald-400" />
            ) : isActive ? (
              <Volume2 size={80} className="animate-bounce" />
            ) : (
              <Mic size={80} />
            )}
          </button>
        </div>

        <div className="text-center mb-12 max-w-xs">
          <p className="text-emerald-100/40 text-[12px] font-black uppercase tracking-[0.2em] leading-relaxed">
            {isActive ? transcription[0] || translations.statusActive : translations.instruction}
          </p>
        </div>

        {/* TRANSCRIPTION SCROLL */}
        <div className="w-full h-48 overflow-y-auto no-scrollbar space-y-4 px-4 mask-fade-top">
          {currentText && (
            <div className="bg-emerald-400/10 p-4 rounded-2xl border border-emerald-400/20 text-emerald-100 italic animate-in slide-in-from-bottom-2">
              {currentText}
            </div>
          )}
          {transcription.map((text, idx) => (
            <div key={idx} className="p-4 rounded-2xl bg-white/5 border border-white/5 text-emerald-100/60 text-sm font-bold">
              {text}
            </div>
          ))}
        </div>
      </div>

      <div className="relative z-10 p-8">
        <button 
          onClick={isActive ? stopSession : startSession}
          disabled={isConnecting}
          className={`w-full py-6 rounded-[30px] font-black text-sm uppercase tracking-[0.2em] transition-all flex items-center justify-center space-x-3 shadow-xl ${isActive ? 'bg-white text-emerald-950' : 'bg-emerald-500 text-white'}`}
        >
          {isActive ? <MicOff size={18} /> : <Sparkles size={18} />}
          <span>{isActive ? translations.stop : translations.start}</span>
        </button>
      </div>
      
      <style>{`
        .mask-fade-top {
          mask-image: linear-gradient(to bottom, transparent, black 20%);
          -webkit-mask-image: linear-gradient(to bottom, transparent, black 20%);
        }
      `}</style>
    </div>
  );
};

export default VoiceAssistantScreen;
