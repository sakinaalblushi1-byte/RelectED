import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PenLine, 
  BookOpen, 
  Award, 
  ChevronRight, 
  Plus,
  CheckCircle2,
  Clock,
  TrendingUp,
  BrainCircuit,
  LogOut,
  LogIn,
  Loader2,
  User as UserIcon,
  IdCard,
  AlertCircle,
  Moon,
  Sun,
  Languages,
  Sparkles,
  Video,
  Users,
  Mail
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReflectionData, UserStats, AppSettings, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import ReflectionWizard from './components/ReflectionWizard';
import VideoReflection from './components/VideoReflection';
import Collaboration from './components/Collaboration';
import AIAssistant from './components/AIAssistant';
import { useTranslation } from 'react-i18next';
import './i18n';

// Local Storage Keys
import { sendToFormspree } from './lib/formspree';

const STORAGE_KEYS = {
  USER: 'reflected_user',
  REFLECTIONS: 'reflected_reflections',
  SETTINGS: 'reflected_settings'
};

import { auth, db } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  setDoc,
  doc 
} from 'firebase/firestore';

export default function App() {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'reflect' | 'video' | 'collaboration'>('dashboard');
  const [reflections, setReflections] = useState<ReflectionData[]>([]);
  const [stats, setStats] = useState<UserStats>({
    totalReflections: 0,
    currentWeek: 1,
    averageScore: 0,
    badges: [],
    xp: 0,
    level: 1,
    streak: 0,
    growthData: {
      engagement: [],
      management: [],
      clarity: [],
      depth: []
    }
  });
  const [userData, setUserData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [loginForm, setLoginForm] = useState({ name: '', collegeId: '', email: '' });
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false
  });

  // Load initial data from localStorage and sync Firebase Auth
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const profile: UserProfile = {
          displayName: firebaseUser.displayName || 'User',
          collegeId: 'Firebase',
          email: firebaseUser.email || ''
        };
        setUserData(profile);
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));

        // Sync reflections from Firestore
        const q = query(
          collection(db, 'reflections'),
          where('userId', '==', firebaseUser.uid),
          orderBy('date', 'desc')
        );

        unsubscribeFirestore = onSnapshot(q, (snapshot) => {
          const firestoreReflections = snapshot.docs.map(doc => ({
            ...doc.data(),
            id: doc.id
          })) as ReflectionData[];
          
          if (firestoreReflections.length > 0) {
            setReflections(firestoreReflections);
            updateStats(firestoreReflections);
            localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(firestoreReflections));
          }
        });
      } else {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (savedUser) {
          setUserData(JSON.parse(savedUser));
        }
      }
      setLoading(false);
    });

    const savedReflections = localStorage.getItem(STORAGE_KEYS.REFLECTIONS);
    const savedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);

    if (savedReflections) {
      const parsedReflections = JSON.parse(savedReflections);
      setReflections(parsedReflections);
      updateStats(parsedReflections);
    }

    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      if (parsed.darkMode) document.documentElement.classList.add('dark');
    }

    return () => {
      unsubscribeAuth();
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const updateStats = (currentReflections: ReflectionData[]) => {
    if (currentReflections.length > 0) {
      const totalScore = currentReflections.reduce((acc, curr) => acc + (curr.qualityScore || 0), 0);
      const xp = currentReflections.length * 100;
      const level = Math.floor(xp / 500) + 1;
      
      setStats({
        totalReflections: currentReflections.length,
        currentWeek: currentReflections.length + 1,
        averageScore: Math.round(totalScore / currentReflections.length),
        badges: currentReflections.length >= 5 ? ['Consistent Reflector', 'Deep Thinker'] : ['Early Bird'],
        xp,
        level,
        streak: 3, // Mock streak
        growthData: {
          engagement: currentReflections.map(r => Math.random() * 40 + 60),
          management: currentReflections.map(r => Math.random() * 40 + 60),
          clarity: currentReflections.map(r => Math.random() * 40 + 60),
          depth: currentReflections.map(r => r.qualityScore || 0)
        }
      });
    } else {
      setStats({
        totalReflections: 0,
        currentWeek: 1,
        averageScore: 0,
        badges: [],
        xp: 0,
        level: 1,
        streak: 0,
        growthData: {
          engagement: [],
          management: [],
          clarity: [],
          depth: []
        }
      });
    }
  };

  const toggleDarkMode = () => {
    const newMode = !settings.darkMode;
    setSettings(prev => ({ ...prev, darkMode: newMode }));
    if (newMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify({ ...settings, darkMode: newMode }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginForm.name || !loginForm.collegeId || !loginForm.email) return;
    
    setIsLoggingIn(true);
    
    // Send login data to Formspree
    sendToFormspree({
      formType: 'Login',
      name: loginForm.name,
      email: loginForm.email,
      collegeId: loginForm.collegeId,
      timestamp: new Date().toISOString()
    });
    
    // Simulate a small delay for better UX
    setTimeout(() => {
      const profile: UserProfile = {
        displayName: loginForm.name,
        collegeId: loginForm.collegeId,
        email: loginForm.email
      };

      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      setUserData(profile);
      setIsLoggingIn(false);
    }, 500);
  };

  const handleLogout = async () => {
    if (confirm("Are you sure you want to log out? Your data will stay on this device.")) {
      try {
        await auth.signOut();
        setUserData(null);
        localStorage.removeItem(STORAGE_KEYS.USER);
      } catch (error) {
        console.error("Logout failed", error);
      }
    }
  };

  const handleResetSession = () => {
    if (confirm("This will delete ALL your reflections and profile from this device. This cannot be undone. Continue?")) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.REFLECTIONS);
      window.location.reload();
    }
  };

  const handleCreateReflection = () => {
    setActiveTab('reflect');
  };

  const handleSaveReflection = async (newReflection: ReflectionData) => {
    const reflectionWithUser = {
      ...newReflection,
      userId: auth.currentUser?.uid || 'anonymous'
    };

    // Save to Firestore if logged in
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, 'reflections', reflectionWithUser.id), reflectionWithUser);
      } catch (error) {
        console.error("Error saving reflection to Firestore:", error);
      }
    }

    const updatedReflections = [reflectionWithUser, ...reflections.filter(r => r.id !== reflectionWithUser.id)];
    setReflections(updatedReflections);
    localStorage.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(updatedReflections));
    updateStats(updatedReflections);
    setActiveTab('dashboard');
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 space-y-8 border border-slate-100 dark:border-slate-800">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-brand-50 dark:bg-brand-900/20 rounded-2xl flex items-center justify-center text-brand-600 dark:text-brand-400">
                <BrainCircuit className="w-12 h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">ReflectED</h1>
              <p className="text-slate-500 dark:text-slate-400">The smart reflection platform for ELT trainee teachers.</p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
              <div className="relative">
                <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter your name"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all"
                  value={loginForm.name}
                  onChange={(e) => setLoginForm({...loginForm, name: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="email" 
                  required
                  placeholder="Enter your email"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all"
                  value={loginForm.email}
                  onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">College ID</label>
              <div className="relative">
                <IdCard className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  required
                  placeholder="Enter your ID"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all"
                  value={loginForm.collegeId}
                  onChange={(e) => setLoginForm({...loginForm, collegeId: e.target.value})}
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-slate-900 dark:bg-brand-600 text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-brand-700 transition-all shadow-lg disabled:opacity-70"
            >
              {isLoggingIn ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
              Enter ReflectED
            </button>
          </form>
          
          <div className="flex justify-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-brand-500 transition-colors">
              {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-slate-900 border-r dark:border-slate-800 flex flex-col">
        <div className="p-6">
          <div className="flex items-center gap-2 text-brand-600 dark:text-brand-400 font-bold text-2xl">
            <BrainCircuit className="w-8 h-8" />
            <span>ReflectED</span>
          </div>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-semibold">ELT Trainee Portal</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {t('dashboard')}
          </button>
          <button 
            onClick={() => setActiveTab('reflect')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'reflect' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <PenLine className="w-5 h-5" />
            {t('new_reflection')}
          </button>
          <button 
            onClick={() => setActiveTab('video')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'video' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Video className="w-5 h-5" />
            {t('video_reflection') || 'Video Reflection'}
          </button>
          <button 
            onClick={() => setActiveTab('collaboration')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'collaboration' ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 font-semibold' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
          >
            <Users className="w-5 h-5" />
            {t('collaboration')}
          </button>
        </nav>

        <div className="p-4 border-t dark:border-slate-800 space-y-4">
          <div className="flex justify-around">
            <button onClick={toggleDarkMode} className="p-2 text-slate-400 hover:text-brand-500 transition-colors">
              {settings.darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
            <div className="w-10 h-10 rounded-full bg-brand-500 flex items-center justify-center text-white font-bold">
              {userData.displayName?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-semibold truncate dark:text-white">{userData.displayName}</p>
              <p className="text-xs text-slate-400 truncate">ID: {userData.collegeId}</p>
            </div>
            <button 
              onClick={handleLogout}
              className="text-slate-400 hover:text-slate-600"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' ? (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-8 max-w-6xl mx-auto"
            >
              <Dashboard 
                stats={stats} 
                reflections={reflections} 
                onCreateReflection={handleCreateReflection} 
                onStartVideoReflection={() => setActiveTab('video')}
                userName={userData.displayName?.split(' ')[0] || 'Teacher'}
              />
            </motion.div>
          ) : activeTab === 'reflect' ? (
            <motion.div 
              key="reflect"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 max-w-4xl mx-auto"
            >
              <ReflectionWizard 
                onSave={handleSaveReflection} 
                onCancel={() => setActiveTab('dashboard')} 
                week={stats.currentWeek}
              />
            </motion.div>
          ) : activeTab === 'video' ? (
            <motion.div 
              key="video"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 max-w-6xl mx-auto"
            >
              <VideoReflection onCancel={() => setActiveTab('dashboard')} />
            </motion.div>
          ) : (
            <motion.div 
              key="collaboration"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="p-8 max-w-6xl mx-auto"
            >
              <Collaboration onCancel={() => setActiveTab('dashboard')} userData={userData} />
            </motion.div>
          )}
        </AnimatePresence>

        <AIAssistant />
      </main>
    </div>
  );
}
