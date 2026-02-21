
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Search, 
  ShoppingBag, 
  ExternalLink, 
  Loader2, 
  Package, 
  FlaskConical, 
  Bug, 
  Sprout, 
  IndianRupee, 
  Filter,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';
import { searchMarketplaceProducts, MarketplaceProduct } from '../services/groqService';

interface MarketplaceScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const MarketplaceScreen: React.FC<MarketplaceScreenProps> = ({ onBack, language }) => {
  const [query, setQuery] = useState('');
  const [products, setProducts] = useState<MarketplaceProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const translations = {
    en: {
      title: "Digital Marketing",
      subtitle: "Authorized Agri-Store",
      searchPlaceholder: "Search Seeds, Urea, DAP...",
      buyNow: "Order Now",
      results: "Top Matches",
      empty: "Search to see live prices",
      loading: "Fetching live store data...",
      categories: [
        { id: 'Seeds', label: 'Seeds', icon: Sprout },
        { id: 'Fertilizer', label: 'Fertilizer', icon: FlaskConical },
        { id: 'Pesticide', label: 'Pesticide', icon: Bug },
        { id: 'Tools', label: 'Tools', icon: Package }
      ],
      authorized: "Official Sources Only"
    },
    hi: {
      title: "डिजिटल मार्केटिंग",
      subtitle: "अधिकृत कृषि स्टोर",
      searchPlaceholder: "बीज, यूरिया, डीएपी खोजें...",
      buyNow: "अभी ऑर्डर करें",
      results: "शीर्ष मिलान",
      empty: "लाइव भाव देखने के लिए खोजें",
      loading: "स्टोर डेटा खोज रहे हैं...",
      categories: [
        { id: 'Seeds', label: 'बीज', icon: Sprout },
        { id: 'Fertilizer', label: 'उर्वरक', icon: FlaskConical },
        { id: 'Pesticide', label: 'कीटनाशक', icon: Bug },
        { id: 'Tools', label: 'उपकरण', icon: Package }
      ],
      authorized: "केवल आधिकारिक स्रोत"
    }
  };

  const t = translations[language];

  const handleSearch = async (searchTerm?: string) => {
    const term = searchTerm || query;
    if (!term) return;
    setLoading(true);
    setProducts([]);
    try {
      const data = await searchMarketplaceProducts(term, language);
      setProducts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (catId: string) => {
    setActiveCategory(catId);
    setQuery(catId);
    handleSearch(catId);
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 relative pb-24">
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
        <div className="bg-emerald-100 text-emerald-700 p-2.5 rounded-2xl">
          <ShoppingBag size={20} />
        </div>
      </header>

      <div className="p-6 space-y-8">
        {/* Search Bar */}
        <div className="relative group">
          <input 
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder={t.searchPlaceholder}
            className="w-full pl-14 pr-20 py-6 bg-white border-2 border-slate-100 rounded-[30px] text-lg font-bold text-emerald-950 outline-none focus:border-emerald-500 shadow-sm transition-all"
          />
          <Search size={24} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
          <button 
            onClick={() => handleSearch()}
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-emerald-600 text-white p-3.5 rounded-[22px] shadow-lg active:scale-90 transition-transform"
          >
            <ArrowRight size={20} />
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-4 gap-3">
          {t.categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`flex flex-col items-center justify-center p-4 rounded-[25px] border-2 transition-all active:scale-95 ${activeCategory === cat.id ? 'bg-emerald-600 border-emerald-400 text-white shadow-xl shadow-emerald-500/30' : 'bg-white border-slate-100 text-slate-400'}`}
            >
              <cat.icon size={24} className="mb-2" />
              <span className="text-[9px] font-black uppercase tracking-widest">{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em]">{t.results}</h3>
            <div className="flex items-center space-x-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
               <CheckCircle2 size={12} />
               <span>{t.authorized}</span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 border-4 border-slate-100 border-t-emerald-600 rounded-full animate-spin mb-6"></div>
              <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest animate-pulse">{t.loading}</p>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {products.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white p-6 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-md transition-shadow flex flex-col animate-in slide-in-from-bottom-4 duration-500"
                  style={{ animationDelay: `${i * 100}ms` }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1 mr-4">
                      <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] bg-emerald-50 px-2 py-0.5 rounded-md mb-2 inline-block">{item.platform}</span>
                      <h4 className="text-lg font-black text-emerald-950 leading-tight">{item.name}</h4>
                    </div>
                    <div className="text-right">
                       <p className="text-2xl font-black text-emerald-600 tracking-tighter">{item.price}</p>
                       <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">Live Price</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center text-[10px] font-black text-slate-400 uppercase">
                       <TrendingDown size={14} className="mr-1.5 text-emerald-400" />
                       Competitive Rate
                    </div>
                    <button 
                      onClick={() => window.open(item.link, '_blank')}
                      className="bg-emerald-950 text-white px-6 py-3.5 rounded-[20px] font-black text-[11px] uppercase tracking-widest flex items-center shadow-lg active:scale-95 transition-all"
                    >
                      {t.buyNow}
                      <ExternalLink size={14} className="ml-2 opacity-50" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-32 flex flex-col items-center justify-center text-center opacity-20">
               <ShoppingBag size={80} className="mb-6" />
               <p className="text-sm font-black uppercase tracking-widest">{t.empty}</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Background Decor */}
      <div className="fixed bottom-0 right-0 opacity-[0.03] pointer-events-none -z-10">
         <Package size={400} />
      </div>
    </div>
  );
};

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14m-7-7 7 7-7 7"/>
  </svg>
);

export default MarketplaceScreen;