
import React from 'react';

const LeafShieldLogo = ({ size = 64 }: { size?: number }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size * 1.1 }}>
    <svg viewBox="0 0 100 120" className="absolute inset-0 drop-shadow-lg">
      <path 
        d="M50 0 L10 15 V50 C10 80 50 100 50 100 C50 100 90 80 90 50 V15 L50 0 Z" 
        fill="#059669" 
        stroke="white" 
        strokeWidth="2"
      />
      <path 
        d="M50 25 C50 25 35 45 35 60 C35 75 50 85 50 85 C50 85 65 75 65 60 C65 45 50 25 50 25 Z" 
        fill="#ffffff" 
        opacity="0.9"
      />
      <path d="M50 35 V75 M50 45 L40 55 M50 55 L40 65 M50 45 L60 55 M50 55 L60 65" stroke="#059669" strokeWidth="2" strokeLinecap="round" />
    </svg>
  </div>
);

const SplashScreen: React.FC = () => {
  return (
    <div className="h-full flex flex-col items-center justify-center bg-white relative overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
        <svg viewBox="0 0 100 100" className="w-[120%] h-[120%]">
           <path d="M50 5 L10 20 V50 C10 80 50 100 50 100 C50 100 90 80 90 50 V20 L50 5 Z" fill="none" stroke="#059669" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative z-10 flex flex-col items-center w-full">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-1000">
          <LeafShieldLogo size={80} />
        </div>

        <div className="relative mb-12 animate-in zoom-in fade-in duration-1000 delay-200">
          <img 
            src="https://img.icons8.com/illustrations/external-justicon-flat-justicon/300/external-farmer-farming-and-agriculture-justicon-flat-justicon.png" 
            alt="AgriSarthi Farmer" 
            className="w-64 h-64 object-contain drop-shadow-2xl"
          />
        </div>

        <div className="text-center animate-in slide-in-from-bottom-8 duration-1000 delay-500">
          <div className="flex items-center space-x-3">
            <h1 className="text-5xl font-black text-emerald-900 tracking-tighter uppercase">
              AGRI
            </h1>
            <h1 className="text-5xl font-black text-emerald-600 tracking-tighter uppercase">
              SARTHI
            </h1>
          </div>
          <div className="h-2 w-32 bg-emerald-600 mx-auto mt-4 rounded-full shadow-lg"></div>
        </div>
      </div>
      
      <div className="absolute bottom-12">
        <p className="text-emerald-900/30 text-[10px] font-black uppercase tracking-[0.5em]">Farmer's Smart Companion</p>
      </div>
    </div>
  );
};

export default SplashScreen;
