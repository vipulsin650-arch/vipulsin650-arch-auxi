
import React, { useState } from 'react';
import { 
  ChevronLeft, 
  Play, 
  Video, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  ExternalLink, 
  Search,
  Filter,
  Youtube,
  ShieldCheck,
  Star
} from 'lucide-react';

interface TutorialVideo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category: 'Schemes' | 'Rice' | 'Growing' | 'Organic';
  url: string;
  author: string;
  detailedDesc: string;
}

interface TutorialsScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const TutorialsScreen: React.FC<TutorialsScreenProps> = ({ onBack, language }) => {
  const [activeTab, setActiveTab] = useState<string>('All');

  const translations = {
    en: {
      title: "Agri Academy",
      subtitle: "Expert Video Tutorials",
      search: "Search tutorials...",
      watchNow: "Watch Full Guide",
      tabs: ['All', 'Schemes', 'Rice', 'Growing'],
      verified: "Expert Verified",
      categories: {
        Schemes: "Govt Schemes",
        Rice: "Rice Planting",
        Growing: "Crop Care",
        Organic: "Organic"
      },
      empty: "No videos found for this category."
    },
    hi: {
      title: "कृषि अकादमी",
      subtitle: "विशेषज्ञ वीडियो ट्यूटोरियल",
      search: "ट्यूटोरियल खोजें...",
      watchNow: "पूरी जानकारी देखें",
      tabs: ['सभी', 'योजनाएं', 'चावल', 'फसलें'],
      verified: "विशेषज्ञ सत्यापित",
      categories: {
        Schemes: "सरकारी योजनाएं",
        Rice: "धान की खेती",
        Growing: "फसल की देखभाल",
        Organic: "जैविक खेती"
      },
      empty: "इस श्रेणी के लिए कोई वीडियो नहीं मिला।"
    }
  };

  const t = translations[language];

  const videos: TutorialVideo[] = [
    {
      id: '1',
      title: language === 'hi' ? "PM-Kisan योजना: 2025 का नया आवेदन प्रोसेस" : "PM-Kisan Scheme: 2025 New Application Process",
      thumbnail: "https://images.unsplash.com/photo-1590682847057-63194b052e27?q=80&w=800&auto=format&fit=crop",
      duration: "10:45",
      category: 'Schemes',
      url: "https://www.youtube.com/results?search_query=pm+kisan+new+registration+full+process+2025",
      author: "Agri Dept Govt",
      detailedDesc: language === 'hi' ? "इसमें पंजीकरण से लेकर स्टेटस चेक तक की पूरी जानकारी है।" : "Complete guide from registration to status checking."
    },
    {
      id: '2',
      title: language === 'hi' ? "धान (चावल) की रोपाई: नर्सरी से फसल तक" : "Paddy (Rice) Transplantation: Nursery to Harvest",
      thumbnail: "https://images.unsplash.com/photo-1530507629858-e4977d30e9e0?q=80&w=800&auto=format&fit=crop",
      duration: "15:20",
      category: 'Rice',
      url: "https://www.youtube.com/results?search_query=how+to+plant+rice+step+by+step+india",
      author: "Rice Research Inst.",
      detailedDesc: language === 'hi' ? "चावल लगाने की सबसे उन्नत तकनीक सीखें।" : "Learn the most advanced rice planting techniques."
    },
    {
      id: '3',
      title: language === 'hi' ? "गेहूं में यूरिया और खाद डालने का सही समय" : "Right time for Urea & Fertilizer in Wheat",
      thumbnail: "https://images.unsplash.com/photo-1574943320219-553eb213f72d?q=80&w=800&auto=format&fit=crop",
      duration: "08:15",
      category: 'Growing',
      url: "https://www.youtube.com/results?search_query=wheat+crop+growing+tips+india",
      author: "Krishi Vigyan Kendra",
      detailedDesc: language === 'hi' ? "फसल की पैदावार बढ़ाने के लिए विशेषज्ञ सलाह।" : "Expert advice to boost your crop yield."
    },
    {
      id: '4',
      title: language === 'hi' ? "फसल बीमा योजना: क्लेम कैसे करें?" : "Crop Insurance: How to claim?",
      thumbnail: "https://images.unsplash.com/photo-1464226184884-fa280b87c399?q=80&w=800&auto=format&fit=crop",
      duration: "12:30",
      category: 'Schemes',
      url: "https://www.youtube.com/results?search_query=pm+fasal+bima+yojana+how+to+claim+hindi",
      author: "Insurance Advisor",
      detailedDesc: language === 'hi' ? "नुकसान होने पर बीमा राशि पाने का तरीका।" : "How to receive insurance money after crop damage."
    },
    {
      id: '5',
      title: language === 'hi' ? "बासमती चावल की आधुनिक नर्सरी" : "Modern Basmati Rice Nursery Preparation",
      thumbnail: "https://images.unsplash.com/photo-1500382017468-9049fed747ef?q=80&w=800&auto=format&fit=crop",
      duration: "18:00",
      category: 'Rice',
      url: "https://www.youtube.com/results?search_query=rice+nursery+preparation+modern+method",
      author: "Paddy Expert",
      detailedDesc: language === 'hi' ? "कम पानी में ज्यादा मुनाफे वाली नर्सरी।" : "Nursery methods for high profit with less water."
    },
    {
      id: '6',
      title: language === 'hi' ? "गन्ना बुवाई की 'पिट' विधि" : "Pit Method of Sugarcane Sowing",
      thumbnail: "https://images.unsplash.com/photo-1595113316349-9fa4ee24f884?q=80&w=800&auto=format&fit=crop",
      duration: "14:10",
      category: 'Growing',
      url: "https://www.youtube.com/results?search_query=sugarcane+pit+method+planting",
      author: "Sugar Institute",
      detailedDesc: language === 'hi' ? "गन्ने की बम्पर पैदावार के लिए नई तकनीक।" : "New technology for bumper sugarcane production."
    }
  ];

  const filteredVideos = activeTab === 'All' || activeTab === 'सभी' 
    ? videos 
    : videos.filter(v => {
        if (language === 'hi') {
          if (activeTab === 'योजनाएं') return v.category === 'Schemes';
          if (activeTab === 'चावल') return v.category === 'Rice';
          if (activeTab === 'फसलें') return v.category === 'Growing';
        } else {
          return v.category === activeTab;
        }
        return true;
      });

  return (
    <div className="min-h-full flex flex-col bg-slate-50 relative pb-32">
      <header className="p-6 pt-12 flex items-center justify-between sticky top-0 z-20 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center">
          <button onClick={onBack} className="bg-white p-2.5 rounded-2xl text-emerald-950 shadow-sm border border-slate-200 active:scale-90 transition-transform">
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
            <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">{t.title}</h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">{t.subtitle}</p>
          </div>
        </div>
        <div className="bg-red-50 text-red-600 p-2.5 rounded-2xl">
          <Youtube size={20} />
        </div>
      </header>

      <div className="p-6">
        {/* Search & Filters */}
        <div className="flex overflow-x-auto no-scrollbar space-x-3 mb-8 pb-2">
          {t.tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-8 py-4 rounded-[22px] font-black text-[11px] uppercase tracking-widest transition-all shrink-0 border-2 ${activeTab === tab ? 'bg-emerald-950 text-white border-emerald-950 shadow-xl' : 'bg-white text-slate-400 border-slate-100'}`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Video List */}
        <div className="space-y-10">
          {filteredVideos.length > 0 ? filteredVideos.map((video, idx) => (
            <div 
              key={video.id}
              onClick={() => window.open(video.url, '_blank')}
              className="group cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              <div className="relative aspect-video w-full rounded-[45px] overflow-hidden shadow-2xl mb-5 group-active:scale-[0.98] transition-all">
                <img src={video.thumbnail} alt={video.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent group-hover:from-black/40 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/40 shadow-2xl group-hover:scale-110 transition-transform">
                      <Play size={32} fill="white" className="text-white ml-1" />
                   </div>
                </div>
                <div className="absolute bottom-6 right-6 bg-black/80 px-4 py-2 rounded-2xl text-[12px] font-black text-white border border-white/10 flex items-center">
                  <Clock size={14} className="mr-2" />
                  {video.duration}
                </div>
                <div className="absolute top-6 left-6">
                  <div className="flex items-center space-x-2 bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl border border-emerald-400">
                     <ShieldCheck size={14} />
                     <span>{t.verified}</span>
                  </div>
                </div>
              </div>

              <div className="px-4">
                <div className="flex items-center space-x-3 mb-3">
                   <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-100 px-3 py-1 rounded-lg">
                     {(t.categories as any)[video.category]}
                   </span>
                   <div className="w-1.5 h-1.5 bg-slate-200 rounded-full"></div>
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{video.author}</span>
                </div>
                <h3 className="text-2xl font-black text-emerald-950 leading-tight uppercase tracking-tight group-hover:text-emerald-600 transition-colors mb-2">
                  {video.title}
                </h3>
                <p className="text-[13px] font-bold text-slate-500 leading-relaxed line-clamp-2 italic">{video.detailedDesc}</p>
                
                <div className="mt-4 flex items-center text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] group-hover:translate-x-2 transition-transform">
                  {t.watchNow} <ExternalLink size={14} className="ml-2" />
                </div>
              </div>
            </div>
          )) : (
            <div className="py-20 flex flex-col items-center justify-center text-center opacity-30">
               <Video size={64} className="mb-4" />
               <p className="text-sm font-black uppercase tracking-widest">{t.empty}</p>
            </div>
          )}
        </div>
      </div>

      {/* Featured Badge */}
      <div className="p-8 mt-10">
         <div className="bg-emerald-950 rounded-[45px] p-10 text-white relative overflow-hidden shadow-2xl border border-emerald-400/20">
            <div className="absolute -right-10 -bottom-10 opacity-10">
               <Star size={160} />
            </div>
            <div className="relative z-10">
               <div className="flex items-center space-x-3 mb-4 text-emerald-400">
                  <BookOpen size={24} />
                  <span className="text-[12px] font-black uppercase tracking-[0.3em]">Learning Center</span>
               </div>
               <h4 className="text-3xl font-black uppercase tracking-tight mb-4 leading-tight">Expert knowledge in your pocket.</h4>
               <p className="text-emerald-100/40 text-sm font-bold uppercase tracking-widest leading-relaxed">We curate the best agricultural knowledge from verified government and scientific sources to help you grow better.</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default TutorialsScreen;
