import React, { useState } from 'react';
import { 
  Video, 
  Plus, 
  Clock, 
  Trash2, 
  Sparkles, 
  ChevronLeft,
  Play,
  Pause,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface VideoReflectionProps {
  onCancel: () => void;
}

export default function VideoReflection({ onCancel }: VideoReflectionProps) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [timestamps, setTimestamps] = useState<{ time: number; note: string; aiInsight?: string }[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoUrl(URL.createObjectURL(file));
    }
  };

  const addTimestamp = () => {
    setTimestamps([...timestamps, { time: 0, note: '' }]);
  };

  const getAIInsight = async (index: number) => {
    setIsAnalyzing(true);
    // Mock AI insight
    setTimeout(() => {
      const next = [...timestamps];
      next[index].aiInsight = "The student engagement here is high. Your use of open-ended questions encouraged more STT (Student Talking Time).";
      setTimestamps(next);
      setIsAnalyzing(false);
    }, 1500);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={onCancel}
            className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Video Reflection</h2>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Analyze your teaching moments</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Video Area */}
        <div className="flex-1 bg-black flex items-center justify-center relative group">
          {videoUrl ? (
            <video src={videoUrl} controls className="max-h-full max-w-full" />
          ) : (
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                <Video className="w-10 h-10 text-slate-600" />
              </div>
              <label className="cursor-pointer bg-brand-600 text-white px-8 py-4 rounded-2xl font-bold hover:bg-brand-700 transition-all inline-block">
                <Upload className="w-5 h-5 inline mr-2" />
                Upload Teaching Video
                <input type="file" accept="video/*" className="hidden" onChange={handleUpload} />
              </label>
              <p className="text-slate-500 text-sm">MP4, MOV or WebM (Max 500MB)</p>
            </div>
          )}
        </div>

        {/* Timestamps Area */}
        <div className="w-full lg:w-[400px] border-l border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 overflow-y-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold dark:text-white">Timestamped Notes</h3>
            <button 
              onClick={addTimestamp}
              disabled={!videoUrl}
              className="p-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {timestamps.map((ts, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Clock className="w-3 h-3" />
                    <input 
                      type="text" 
                      placeholder="0:00" 
                      className="w-16 bg-transparent outline-none"
                      value={ts.time}
                      onChange={(e) => {
                        const next = [...timestamps];
                        next[i].time = parseInt(e.target.value) || 0;
                        setTimestamps(next);
                      }}
                    />
                  </div>
                  <button 
                    onClick={() => setTimestamps(timestamps.filter((_, idx) => idx !== i))}
                    className="text-slate-300 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <textarea 
                  placeholder="What happened at this moment?"
                  className="w-full text-sm bg-transparent outline-none dark:text-white min-h-[60px]"
                  value={ts.note}
                  onChange={(e) => {
                    const next = [...timestamps];
                    next[i].note = e.target.value;
                    setTimestamps(next);
                  }}
                />
                
                {ts.aiInsight ? (
                  <div className="p-3 bg-brand-50 dark:bg-brand-900/20 rounded-xl border border-brand-100 dark:border-brand-800">
                    <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 text-[10px] font-bold uppercase mb-1">
                      <Sparkles className="w-3 h-3" /> AI Insight
                    </div>
                    <p className="text-xs text-brand-800 dark:text-brand-300 italic leading-relaxed">
                      {ts.aiInsight}
                    </p>
                  </div>
                ) : (
                  <button 
                    onClick={() => getAIInsight(i)}
                    disabled={!ts.note}
                    className="w-full py-2 bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-brand-50 hover:text-brand-600 transition-all"
                  >
                    Get AI Insight
                  </button>
                )}
              </motion.div>
            ))}
            
            {timestamps.length === 0 && (
              <div className="text-center py-12 space-y-2">
                <Video className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="text-sm text-slate-400">Add timestamps to specific moments in your teaching video.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
