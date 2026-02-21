
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, 
  Droplets, 
  FlaskConical, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Plus,
  Loader2,
  Trash2,
  Bug,
  Sprout,
  Sparkles,
  ArrowRight,
  MoreVertical
} from 'lucide-react';
import { getDetailedCropSchedule } from '../services/groqService';
import { ActiveCrop } from '../types';

interface CropScheduleScreenProps {
  onBack: () => void;
  language: 'en' | 'hi';
}

const CropScheduleScreen: React.FC<CropScheduleScreenProps> = ({ onBack, language }) => {
  // State for List of Crops
  const [crops, setCrops] = useState<ActiveCrop[]>(() => {
    const saved = localStorage.getItem('active_crop_schedules_v2');
    if (saved) return JSON.parse(saved);
    // Migration for old single crop data
    const old = localStorage.getItem('active_crop_schedule');
    if (old) {
      const oldCrop = JSON.parse(old);
      return [{ ...oldCrop, id: Date.now().toString() }];
    }
    return [];
  });

  // UI States
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [viewingCropId, setViewingCropId] = useState<string | null>(null);
  
  // Form States
  const [newCropName, setNewCropName] = useState('Wheat');
  const [sowingDate, setSowingDate] = useState(new Date().toISOString().split('T')[0]);

  const translations = {
    en: {
      title: "Farm Schedule",
      subtitle: "Multi-Crop Manager",
      addBtn: "Add New Crop",
      selectCrop: "Select Crop Type",
      selectDate: "Sowing Date",
      generate: "Generate Schedule",
      myCrops: "My Active Crops",
      daysSince: "Day",
      today: "Tasks for Today",
      upcoming: "Upcoming",
      completed: "Completed",
      delete: "Delete Crop",
      crops: ['Wheat', 'Rice', 'Sugarcane', 'Cotton', 'Maize', 'Mustard', 'Soybean', 'Onion', 'Potato', 'Tomato'],
      empty: "No crops added yet.",
      emptySub: "Add a crop to get a personalized scientific schedule.",
      progress: "Progress"
    },
    hi: {
      title: "फसल योजना",
      subtitle: "एकाधिक फसल प्रबंधक",
      addBtn: "नई फसल जोड़ें",
      selectCrop: "फसल चुनें",
      selectDate: "बुवाई की तारीख",
      generate: "योजना बनाएं",
      myCrops: "मेरी सक्रिय फसलें",
      daysSince: "दिन",
      today: "आज के कार्य",
      upcoming: "आने वाले कार्य",
      completed: "पूरे हुए",
      delete: "फसल हटाएं",
      crops: ['गेहूं', 'चावल', 'गन्ना', 'कपास', 'मक्का', 'सरसों', 'सोयाबीन', 'प्याज', 'आलू', 'टमाटर'],
      empty: "अभी तक कोई फसल नहीं जोड़ी गई।",
      emptySub: "वैज्ञानिक योजना पाने के लिए फसल जोड़ें।",
      progress: "प्रगति"
    }
  };

  const t = translations[language];

  // Save whenever crops change
  useEffect(() => {
    localStorage.setItem('active_crop_schedules_v2', JSON.stringify(crops));
  }, [crops]);

  const handleCreateSchedule = async () => {
    setLoading(true);
    try {
      const tasks = await getDetailedCropSchedule(newCropName, language);
      const newSchedule: ActiveCrop = {
        id: Date.now().toString(),
        cropName: newCropName,
        sowingDate: sowingDate,
        tasks: tasks
      };
      setCrops(prev => [newSchedule, ...prev]);
      setIsAdding(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCrop = (id: string) => {
    if (window.confirm(language === 'hi' ? "क्या आप सुनिश्चित हैं?" : "Are you sure you want to delete this?")) {
      setCrops(prev => prev.filter(c => c.id !== id));
      if (viewingCropId === id) setViewingCropId(null);
    }
  };

  const toggleTask = (cropId: string, taskId: string) => {
    setCrops(prev => prev.map(crop => {
      if (crop.id !== cropId) return crop;
      return {
        ...crop,
        tasks: crop.tasks.map(task => 
          task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
        )
      };
    }));
  };

  const getDaysPassed = (dateStr: string) => {
    const start = new Date(dateStr);
    const today = new Date();
    const diff = today.getTime() - start.getTime();
    return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  };

  const getTaskDate = (sowingDate: string, offset: number) => {
    const date = new Date(sowingDate);
    date.setDate(date.getDate() + offset);
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-US', { day: 'numeric', month: 'short' });
  };

  // --- RENDER HELPERS ---

  const renderAddForm = () => (
    <div className="bg-white p-8 rounded-[45px] shadow-2xl border border-emerald-100 space-y-8 animate-in zoom-in duration-300 mx-6 mt-6">
       <div>
          <label className="block text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mb-4 px-1">{t.selectCrop}</label>
          <select 
            value={newCropName}
            onChange={(e) => setNewCropName(e.target.value)}
            className="w-full p-5 bg-emerald-50 rounded-[25px] border-2 border-emerald-100 outline-none text-xl font-black text-emerald-950"
          >
            {t.crops.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
       </div>
       <div>
          <label className="block text-[10px] font-black text-emerald-900/40 uppercase tracking-widest mb-4 px-1">{t.selectDate}</label>
          <input 
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            className="w-full p-5 bg-emerald-50 rounded-[25px] border-2 border-emerald-100 outline-none text-xl font-black text-emerald-950"
          />
       </div>
       <button 
         onClick={handleCreateSchedule}
         disabled={loading}
         className="w-full bg-emerald-950 text-white py-6 rounded-[30px] font-black text-sm uppercase tracking-widest flex items-center justify-center space-x-3 shadow-2xl active:scale-95 transition-all"
       >
         {loading ? <Loader2 className="animate-spin" /> : <Calendar size={18} className="text-emerald-400" />}
         <span>{t.generate}</span>
       </button>
       <button onClick={() => setIsAdding(false)} className="w-full text-[10px] font-black uppercase text-slate-300 tracking-widest">Cancel</button>
    </div>
  );

  const renderCropDashboard = () => (
    <div className="p-6 space-y-6">
      {crops.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-center opacity-40">
           <Sprout size={80} className="mb-6 text-emerald-800" />
           <p className="text-lg font-black text-emerald-950 uppercase tracking-tight mb-2">{t.empty}</p>
           <p className="text-xs font-bold text-emerald-700 px-10 leading-relaxed">{t.emptySub}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5">
          {crops.map((crop) => {
            const days = getDaysPassed(crop.sowingDate);
            const progress = Math.min(100, Math.max(5, (days / 120) * 100)); // Approx 120 days crop cycle
            
            return (
              <div 
                key={crop.id}
                onClick={() => setViewingCropId(crop.id)}
                className="bg-white p-6 rounded-[35px] shadow-sm border border-emerald-50 active:scale-[0.98] transition-all relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-700">
                  <Sprout size={100} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-emerald-950 uppercase tracking-tight">{crop.cropName}</h3>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mt-1">Sown: {new Date(crop.sowingDate).toLocaleDateString()}</p>
                    </div>
                    <div className="bg-emerald-50 p-2 rounded-full">
                      <ArrowRight size={20} className="text-emerald-600 -rotate-45" />
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[20px] p-4 border border-slate-100">
                    <div className="flex justify-between items-end mb-2">
                       <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t.progress}</span>
                       <span className="text-xl font-black text-emerald-600">{days} <span className="text-[10px] text-slate-300 uppercase">Days</span></span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }}></div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderCropDetails = () => {
    const crop = crops.find(c => c.id === viewingCropId);
    if (!crop) return null;

    const daysPassed = getDaysPassed(crop.sowingDate);
    const sortedTasks = [...crop.tasks].sort((a,b) => a.dayOffset - b.dayOffset);

    return (
      <div className="p-6 space-y-6 animate-in slide-in-from-right duration-300">
        {/* Detail Header */}
        <div className="bg-emerald-950 rounded-[45px] p-8 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-8 opacity-10">
              <Sprout size={120} />
           </div>
           <div className="relative z-10">
              <div className="flex justify-between items-start">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-2">{t.myCrops}</p>
                <button 
                  onClick={(e) => { e.stopPropagation(); handleDeleteCrop(crop.id); }}
                  className="bg-white/10 p-2 rounded-full text-red-300 hover:bg-red-500 hover:text-white transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <h3 className="text-4xl font-black uppercase tracking-tighter mb-6">{crop.cropName}</h3>
              <div className="flex items-center justify-between bg-white/5 p-5 rounded-[30px] border border-white/10">
                 <div>
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">{t.daysSince}</p>
                    <p className="text-2xl font-black text-emerald-400">{daysPassed} Days</p>
                 </div>
                 <div className="text-right">
                    <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">Sown On</p>
                    <p className="text-sm font-bold">{new Date(crop.sowingDate).toLocaleDateString()}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Task List */}
        <div className="space-y-4 pb-20">
           {sortedTasks.map((task) => {
             const isUpcoming = task.dayOffset > daysPassed;
             const isToday = task.dayOffset === daysPassed;
             const isPast = task.dayOffset < daysPassed;

             return (
               <div 
                 key={task.id}
                 onClick={() => toggleTask(crop.id, task.id)}
                 className={`flex items-start p-6 rounded-[35px] border-2 transition-all cursor-pointer active:scale-[0.98] ${
                   task.isCompleted ? 'bg-slate-50 border-transparent opacity-60 grayscale' : 
                   isToday ? 'bg-white border-emerald-500 shadow-xl' :
                   'bg-white border-slate-100 shadow-sm'
                 }`}
               >
                 <div className={`p-4 rounded-2xl mr-5 shrink-0 ${
                   task.isCompleted ? 'bg-slate-200 text-slate-400' :
                   task.taskType === 'Irrigation' ? 'bg-blue-50 text-blue-600' :
                   task.taskType === 'Fertilizer' ? 'bg-emerald-50 text-emerald-600' :
                   'bg-amber-50 text-amber-600'
                 }`}>
                   {task.taskType === 'Irrigation' ? <Droplets size={24} /> : 
                    task.taskType === 'Fertilizer' ? <FlaskConical size={24} /> :
                    task.taskType === 'Pesticide' ? <Bug size={24} /> : <CheckCircle2 size={24} />}
                 </div>

                 <div className="flex-1">
                   <div className="flex justify-between items-start mb-1">
                      <h5 className="font-black text-[14px] text-emerald-950 uppercase tracking-tight leading-tight">{task.title}</h5>
                      <span className={`text-[10px] font-black uppercase tracking-widest ml-2 px-2 py-1 rounded-lg ${isToday ? 'bg-emerald-500 text-white' : 'text-slate-300'}`}>
                         {getTaskDate(crop.sowingDate, task.dayOffset)}
                      </span>
                   </div>
                   <p className="text-[11px] text-slate-500 font-bold leading-relaxed">{task.description}</p>
                   <div className="mt-4 flex items-center space-x-2">
                      {task.isCompleted ? (
                        <div className="flex items-center text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                          <CheckCircle2 size={14} className="mr-1.5" /> Done
                        </div>
                      ) : (
                        <div className={`flex items-center text-[9px] font-black uppercase tracking-widest ${isToday ? 'text-emerald-600' : isPast ? 'text-red-400' : 'text-slate-300'}`}>
                          {isToday ? <Sparkles size={14} className="mr-1.5" /> : isPast ? <AlertCircle size={14} className="mr-1.5" /> : <Clock size={14} className="mr-1.5" />}
                          {isToday ? "Due Today" : isPast ? "Overdue" : `Day ${task.dayOffset}`}
                        </div>
                      )}
                   </div>
                 </div>
               </div>
             );
           })}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-full flex flex-col bg-slate-50 relative pb-32">
      {/* Dynamic Header */}
      <header className="p-6 pt-12 flex items-center justify-between sticky top-0 z-20 bg-slate-50/90 backdrop-blur-xl border-b border-slate-200">
        <div className="flex items-center">
          <button 
            onClick={() => viewingCropId ? setViewingCropId(null) : onBack()} 
            className="bg-white p-2.5 rounded-2xl text-emerald-950 shadow-sm border border-slate-200 active:scale-90 transition-transform"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="ml-4">
            <h2 className="text-xl font-black text-emerald-950 uppercase tracking-tight leading-none">
              {viewingCropId ? t.title : t.title}
            </h2>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">
              {viewingCropId ? t.progress : t.subtitle}
            </p>
          </div>
        </div>
        
        {!viewingCropId && !isAdding && (
          <button onClick={() => setIsAdding(true)} className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg active:scale-90 transition-all flex items-center space-x-2">
            <Plus size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Add</span>
          </button>
        )}
      </header>

      {/* Content Switcher */}
      {isAdding ? renderAddForm() : viewingCropId ? renderCropDetails() : renderCropDashboard()}

    </div>
  );
};

export default CropScheduleScreen;
