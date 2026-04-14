import React from 'react';
import { 
  TrendingUp, 
  Award, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  Plus,
  Target,
  Zap,
  Brain,
  MessageSquare,
  BarChart3,
  Calendar,
  ArrowUpRight,
  Download,
  Video
} from 'lucide-react';
import { motion } from 'motion/react';
import { ReflectionData, UserStats } from '../types';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';

interface DashboardProps {
  stats: UserStats;
  reflections: ReflectionData[];
  onCreateReflection: () => void;
  onStartVideoReflection: () => void;
  userName: string;
}

export default function Dashboard({ stats, reflections, onCreateReflection, onStartVideoReflection, userName }: DashboardProps) {
  const { t } = useTranslation();

  const chartData = stats.growthData.depth.map((depth, i) => ({
    name: `W${i + 1}`,
    depth,
    engagement: stats.growthData.engagement[i],
    management: stats.growthData.management[i],
    clarity: stats.growthData.clarity[i],
  }));

  const downloadReport = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.text('ReflectED - Teaching Practice Report', 20, 20);
    doc.setFontSize(14);
    doc.text(`Teacher: ${userName}`, 20, 35);
    doc.text(`Total Reflections: ${stats.totalReflections}`, 20, 45);
    doc.text(`Average Quality Score: ${stats.averageScore}%`, 20, 55);
    doc.text(`Current Level: ${stats.level}`, 20, 65);
    
    doc.text('Recent Feedback:', 20, 85);
    reflections.slice(0, 3).forEach((r, i) => {
      doc.setFontSize(12);
      doc.text(`${i + 1}. ${r.title} (Week ${r.week}) - Score: ${r.qualityScore}%`, 25, 95 + (i * 10));
    });

    doc.save(`ReflectED_Report_${userName}.pdf`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Header Section */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl font-bold text-slate-900 dark:text-white"
          >
            {t('welcome', { name: userName })}
          </motion.h1>
          <div className="flex items-center gap-4">
            <p className="text-slate-500 dark:text-slate-400 text-lg">
              {t('week_status', { week: stats.currentWeek })}
            </p>
            <button 
              onClick={downloadReport}
              className="flex items-center gap-2 text-brand-600 font-bold text-sm hover:underline"
            >
              <Download className="w-4 h-4" /> Download Report
            </button>
          </div>
        </div>
        
        <div className="flex gap-4">
          {/* Buttons removed for a more organized look as per user request */}
        </div>
      </header>

      {/* Gamification & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard 
          icon={<Zap className="w-6 h-6 text-amber-500" />}
          label={t('xp')}
          value={stats.xp.toString()}
          subValue={`${t('level')} ${stats.level}`}
          color="amber"
          progress={(stats.xp % 500) / 5}
        />
        <StatCard 
          icon={<TrendingUp className="w-6 h-6 text-emerald-500" />}
          label={t('average_quality')}
          value={`${stats.averageScore}%`}
          subValue="+5% from last week"
          color="emerald"
        />
        <StatCard 
          icon={<CheckCircle2 className="w-6 h-6 text-brand-500" />}
          label={t('completed')}
          value={stats.totalReflections.toString()}
          subValue="Reflections"
          color="brand"
        />
        <StatCard 
          icon={<Award className="w-6 h-6 text-purple-500" />}
          label={t('badges_earned')}
          value={stats.badges.length.toString()}
          subValue="Achievements"
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Analytics Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="space-y-1">
              <h3 className="text-xl font-bold dark:text-white">{t('growth_analytics')}</h3>
              <p className="text-sm text-slate-400">Tracking your ELT skill development</p>
            </div>
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <div className="w-3 h-3 rounded-full bg-brand-500"></div>
                Depth
              </div>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                Engagement
              </div>
            </div>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorDepth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Area type="monotone" dataKey="depth" stroke="#0ea5e9" strokeWidth={3} fillOpacity={1} fill="url(#colorDepth)" />
                <Area type="monotone" dataKey="engagement" stroke="#10b981" strokeWidth={3} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-xl font-bold dark:text-white">{t('badges')}</h3>
          <div className="space-y-4">
            {stats.badges.map((badge, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 group hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-all cursor-default">
                <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Award className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{badge}</p>
                  <p className="text-xs text-slate-400">Unlocked Week {i + 1}</p>
                </div>
              </div>
            ))}
            {stats.badges.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <Award className="w-12 h-12 text-slate-200 mx-auto" />
                <p className="text-sm text-slate-400">Complete reflections to earn badges!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Reflections List */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{t('recent_reflections')}</h3>
          <button className="text-brand-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reflections.slice(0, 4).map((reflection) => (
            <motion.div 
              key={reflection.id}
              whileHover={{ y: -4 }}
              className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-1 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 text-[10px] font-bold rounded-md uppercase tracking-wider">
                      Week {reflection.week}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">{reflection.date}</span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                    {reflection.title}
                  </h4>
                </div>
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-brand-600 font-bold text-sm">
                  {reflection.qualityScore}%
                </div>
              </div>
              
              <div className="flex items-center gap-4 pt-4 border-t border-slate-50 dark:border-slate-800">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-amber-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px]">🧠</div>
                  <div className="w-6 h-6 rounded-full bg-emerald-100 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px]">💬</div>
                </div>
                <p className="text-xs text-slate-500 truncate flex-1">
                  {reflection.aiFeedback?.summary || "No feedback yet"}
                </p>
                <ArrowUpRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500 transition-colors" />
              </div>
            </motion.div>
          ))}
          
          {reflections.length === 0 && (
            <div className="col-span-full py-20 bg-white dark:bg-slate-900 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center space-y-4">
              <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300">
                <Calendar className="w-8 h-8" />
              </div>
              <div className="text-center">
                <p className="text-slate-900 dark:text-white font-bold text-lg">No reflections yet</p>
                <p className="text-slate-400 text-sm">Start your first reflection from the sidebar to see your progress!</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subValue, color, progress }: { icon: React.ReactNode, label: string, value: string, subValue: string, color: string, progress?: number }) {
  const colors: Record<string, string> = {
    brand: 'bg-brand-50 dark:bg-brand-900/20',
    amber: 'bg-amber-50 dark:bg-amber-900/20',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20',
    purple: 'bg-purple-50 dark:bg-purple-900/20',
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]}`}>
          {icon}
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
      {progress !== undefined ? (
        <div className="space-y-2">
          <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-amber-500 rounded-full"
            />
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Next Level: {Math.round(500 - (progress * 5))} XP</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 font-medium">{subValue}</p>
      )}
    </div>
  );
}
