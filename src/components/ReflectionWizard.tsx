import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  ChevronLeft, 
  BrainCircuit, 
  Save, 
  Sparkles,
  Smile,
  Meh,
  Frown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Plus,
  Trash2,
  Mic,
  Zap,
  Info,
  Calendar,
  Target,
  BarChart3,
  Lightbulb,
  ArrowUpRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ReflectionData, GibbsStage, LessonType, SkillFocus } from '../types';
import { generateAIFeedback, getAIInsightForAnalysis, getAdaptiveQuestions } from '../services/aiService';
import { sendToFormspree } from '../lib/formspree';
import { useTranslation } from 'react-i18next';

interface ReflectionWizardProps {
  onSave: (data: ReflectionData) => void;
  onCancel: () => void;
  week: number;
}

const STAGES: GibbsStage[] = [
  'Description',
  'Feelings',
  'Evaluation',
  'Analysis',
  'Conclusion',
  'Action Plan'
];

const LESSON_TYPES: LessonType[] = ['PPP', 'TBLT', 'ESA', 'Other'];
const SKILL_FOCUS: SkillFocus[] = ['Reading', 'Writing', 'Listening', 'Speaking', 'Grammar', 'Vocabulary', 'Pronunciation'];

export default function ReflectionWizard({ onSave, onCancel, week }: ReflectionWizardProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(-1); // -1 is Setup, 6 is Review
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [adaptiveQuestions, setAdaptiveQuestions] = useState<string[]>([]);
  const [finalFeedback, setFinalFeedback] = useState<ReflectionData['aiFeedback'] | null>(null);
  const [completedData, setCompletedData] = useState<ReflectionData | null>(null);
  
  const [formData, setFormData] = useState<Partial<ReflectionData>>({
    week,
    date: new Date().toISOString().split('T')[0],
    title: '',
    status: 'draft',
    lessonMetadata: {
      type: 'PPP',
      focus: []
    },
    responses: {
      description: { objective: '', activity: '', outcome: '', timeline: [] },
      feelings: { emoji: '😊', confidence: '', uncertainty: '' },
      evaluation: { workedWell: [], workedWellNote: '', didntWork: [], didntWorkNote: '' },
      analysis: { studentReaction: '' },
      conclusion: { learned: '', nextTime: '' },
      actionPlan: { focusAreas: [], deadline: '', strategies: '' }
    }
  });

  useEffect(() => {
    if (currentStep === 0) {
      fetchAdaptiveQuestions();
    }
  }, [currentStep]);

  const fetchAdaptiveQuestions = async () => {
    const questions = await getAdaptiveQuestions(
      formData.lessonMetadata!.type,
      formData.lessonMetadata!.focus,
      week
    );
    setAdaptiveQuestions(questions);
  };

  const handleNext = () => {
    if (currentStep < STAGES.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > -1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const updateResponse = (stage: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      responses: {
        ...prev.responses!,
        [stage]: {
          ...prev.responses![stage as keyof typeof prev.responses],
          [field]: value
        }
      }
    }));
  };

  const handleGetAIInsight = async () => {
    setIsAnalyzing(true);
    const insight = await getAIInsightForAnalysis(
      formData.responses!.description.objective,
      formData.responses!.analysis.studentReaction
    );
    setAiInsight(insight || null);
    setIsAnalyzing(false);
  };

  const handleFinalSubmit = async () => {
    setIsAnalyzing(true);
    const fullData = {
      ...formData,
      id: Math.random().toString(36).substr(2, 9),
      status: 'completed' as const,
      lessonMetadata: {
        ...formData.lessonMetadata!
      }
    } as ReflectionData;

    const aiResult = await generateAIFeedback(fullData);
    
    // Send to Formspree
    sendToFormspree({
      formType: 'Reflection Completed',
      reflectionId: fullData.id,
      title: fullData.title,
      week: fullData.week,
      date: fullData.date,
      lessonType: fullData.lessonMetadata.type,
      focus: fullData.lessonMetadata.focus,
      qualityScore: aiResult.depthScore,
      summary: aiResult.summary
    });
    
    setFinalFeedback(aiResult);
    setCompletedData({
      ...fullData,
      qualityScore: aiResult.depthScore,
      aiFeedback: aiResult
    });
    setCurrentStep(6); // Go to review screen
    setIsAnalyzing(false);
  };

  const handleSaveAndExit = () => {
    if (completedData) {
      onSave(completedData);
    }
  };

  const renderSetup = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-2xl font-bold dark:text-white">Lesson Setup</h3>
        <p className="text-slate-500">Provide some context about your lesson to get personalized reflection questions.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lesson Type</label>
          <div className="grid grid-cols-2 gap-3">
            {LESSON_TYPES.map(type => (
              <button 
                key={type}
                onClick={() => setFormData({...formData, lessonMetadata: {...formData.lessonMetadata!, type}})}
                className={`p-4 rounded-2xl border-2 transition-all text-sm font-bold ${formData.lessonMetadata?.type === type ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'border-slate-100 dark:border-slate-800 text-slate-400 hover:border-slate-200'}`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Skill Focus</label>
          <div className="flex flex-wrap gap-2">
            {SKILL_FOCUS.map(skill => (
              <button 
                key={skill}
                onClick={() => {
                  const current = formData.lessonMetadata?.focus || [];
                  const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
                  setFormData({...formData, lessonMetadata: {...formData.lessonMetadata!, focus: next}});
                }}
                className={`px-4 py-2 rounded-full border-2 text-xs font-bold transition-all ${formData.lessonMetadata?.focus.includes(skill) ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
              >
                {skill}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button 
        onClick={() => setCurrentStep(0)}
        disabled={!formData.lessonMetadata?.type || formData.lessonMetadata?.focus.length === 0}
        className="w-full bg-slate-900 dark:bg-brand-600 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all disabled:opacity-50"
      >
        Continue to Reflection <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );

  const renderReview = () => {
    if (!finalFeedback) return null;

    return (
      <div className="space-y-10 pb-10">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 rounded-3xl mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-3xl font-bold dark:text-white">Reflection Analyzed!</h3>
          <p className="text-slate-500 max-w-lg mx-auto">Your ELT Mentor has completed a deep evaluation of your teaching practice and reflection depth.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-brand-50 dark:bg-brand-900/20 p-6 rounded-3xl border border-brand-100 dark:border-brand-800 text-center space-y-2">
            <p className="text-xs font-bold text-brand-600 uppercase tracking-widest">Depth Score</p>
            <p className="text-4xl font-black text-brand-700 dark:text-brand-400">{finalFeedback.depthScore}%</p>
            <p className="text-[10px] text-brand-500 font-medium">Based on Bloom's Taxonomy</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-3xl border border-emerald-100 dark:border-emerald-800 text-center space-y-2">
            <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Effectiveness</p>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">High Impact</p>
            <p className="text-[10px] text-emerald-500 font-medium">Teaching Strategy Success</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800 text-center space-y-2">
            <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">Engagement</p>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-400">Active Class</p>
            <p className="text-[10px] text-amber-500 font-medium">Student Participation</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-[32px] border border-slate-100 dark:border-slate-700 shadow-sm space-y-4">
            <h4 className="text-xl font-bold flex items-center gap-2 dark:text-white">
              <Sparkles className="w-6 h-6 text-brand-500" />
              Mentor's Deep Evaluation
            </h4>
            <div className="text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {finalFeedback.summary}
            </div>
          </div>

          {finalFeedback.evaluationDetails && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                <h5 className="font-bold text-emerald-600 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Key Strengths
                </h5>
                <ul className="space-y-3">
                  {finalFeedback.evaluationDetails.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-4">
                <h5 className="font-bold text-rose-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" /> Areas for Growth
                </h5>
                <ul className="space-y-3">
                  {finalFeedback.evaluationDetails.weaknesses.map((w, i) => (
                    <li key={i} className="text-sm text-slate-600 dark:text-slate-400 flex gap-3">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 flex-shrink-0" />
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {finalFeedback.furtherEnhancement && (
            <div className="bg-brand-600 p-8 rounded-[32px] text-white space-y-4 shadow-xl shadow-brand-200 dark:shadow-none">
              <h4 className="text-xl font-bold flex items-center gap-2">
                <Zap className="w-6 h-6" />
                Further Enhancement Strategies
              </h4>
              <p className="text-brand-50 leading-relaxed">
                {finalFeedback.furtherEnhancement}
              </p>
            </div>
          )}

          <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-[32px] text-white space-y-6">
            <h4 className="text-xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-brand-400" />
              Your Action Plan
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Specific Goals</p>
                <div className="space-y-3">
                  {finalFeedback.goals.map((g, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <div className="w-6 h-6 rounded-lg bg-brand-500/20 flex items-center justify-center text-brand-400 text-xs font-bold">{i+1}</div>
                      <span className="text-sm text-slate-300">{g}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Recommended Strategies</p>
                <div className="space-y-3">
                  {finalFeedback.strategies.map((s, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                      <Lightbulb className="w-5 h-5 text-amber-400" />
                      <span className="text-sm text-slate-300">{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSaveAndExit}
          className="w-full bg-brand-600 hover:bg-brand-700 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-brand-200 transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          Save Reflection & Return to Dashboard
          <ArrowUpRight className="w-6 h-6" />
        </button>
      </div>
    );
  };

  const renderStep = () => {
    if (currentStep === 6) return renderReview();
    const stage = STAGES[currentStep];
    
    switch (stage) {
      case 'Description':
        return (
          <div className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lesson Title</label>
              <input 
                type="text" 
                placeholder="e.g., Grammar Lesson on Past Simple"
                className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-brand-400 outline-none transition-all"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
              />
            </div>

            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Info className="w-5 h-5 text-brand-500" />
                Scaffolded Questions
              </h4>
              <div className="grid gap-4">
                {adaptiveQuestions.map((q, i) => (
                  <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">{q}</p>
                    <textarea 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-900 dark:text-white focus:border-brand-400 outline-none transition-all min-h-[80px]"
                      placeholder="Type your answer here..."
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Lesson Timeline</label>
              <div className="space-y-3">
                {(formData.responses?.description.timeline || []).map((item, i) => (
                  <div key={i} className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Time" 
                      className="w-24 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none"
                      value={item.time}
                      onChange={(e) => {
                        const next = [...formData.responses!.description.timeline!];
                        next[i].time = e.target.value;
                        updateResponse('description', 'timeline', next);
                      }}
                    />
                    <input 
                      type="text" 
                      placeholder="What happened?" 
                      className="flex-1 p-3 rounded-xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none"
                      value={item.event}
                      onChange={(e) => {
                        const next = [...formData.responses!.description.timeline!];
                        next[i].event = e.target.value;
                        updateResponse('description', 'timeline', next);
                      }}
                    />
                    <button 
                      onClick={() => {
                        const next = formData.responses!.description.timeline!.filter((_, idx) => idx !== i);
                        updateResponse('description', 'timeline', next);
                      }}
                      className="p-3 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => {
                    const next = [...(formData.responses?.description.timeline || []), { time: '', event: '' }];
                    updateResponse('description', 'timeline', next);
                  }}
                  className="flex items-center gap-2 text-brand-600 font-bold text-sm hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add Event
                </button>
              </div>
            </div>
          </div>
        );

      case 'Feelings':
        return (
          <div className="space-y-12 py-8">
            <div className="text-center space-y-6">
              <label className="text-xl font-bold text-slate-900 dark:text-white block">How did you feel during the lesson?</label>
              <div className="flex justify-center gap-4 md:gap-8">
                {['😊', '😐', '😟', '😰', '🤩', '😤'].map(emoji => (
                  <button 
                    key={emoji}
                    onClick={() => updateResponse('feelings', 'emoji', emoji)}
                    className={`text-5xl p-6 rounded-3xl transition-all ${formData.responses?.feelings.emoji === emoji ? 'bg-brand-100 dark:bg-brand-900/40 scale-110 shadow-xl' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sentence Starter</label>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-400 italic mb-4">"I felt most confident when..."</p>
                  <textarea 
                    className="w-full bg-transparent outline-none dark:text-white min-h-[120px]"
                    placeholder="Continue writing..."
                    value={formData.responses?.feelings.confidence}
                    onChange={(e) => updateResponse('feelings', 'confidence', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Sentence Starter</label>
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                  <p className="text-slate-400 italic mb-4">"I felt a bit uncertain when..."</p>
                  <textarea 
                    className="w-full bg-transparent outline-none dark:text-white min-h-[120px]"
                    placeholder="Continue writing..."
                    value={formData.responses?.feelings.uncertainty}
                    onChange={(e) => updateResponse('feelings', 'uncertainty', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'Evaluation':
        const options = ['Timing', 'Instructions', 'Engagement', 'Materials', 'Management', 'Board Work', 'Clarity', 'CCQs/ICQs'];
        return (
          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-lg font-bold text-slate-900 dark:text-white">What worked well?</label>
              <div className="flex flex-wrap gap-3">
                {options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => {
                      const current = formData.responses?.evaluation.workedWell || [];
                      const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
                      updateResponse('evaluation', 'workedWell', next);
                    }}
                    className={`px-6 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${formData.responses?.evaluation.workedWell.includes(opt) ? 'bg-emerald-50 border-emerald-500 text-emerald-700' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <textarea 
                className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none h-28"
                placeholder="Explain why these worked..."
                value={formData.responses?.evaluation.workedWellNote}
                onChange={(e) => updateResponse('evaluation', 'workedWellNote', e.target.value)}
              />
            </div>

            <div className="space-y-6">
              <label className="text-lg font-bold text-slate-900 dark:text-white">What didn't work as planned?</label>
              <div className="flex flex-wrap gap-3">
                {options.map(opt => (
                  <button 
                    key={opt}
                    onClick={() => {
                      const current = formData.responses?.evaluation.didntWork || [];
                      const next = current.includes(opt) ? current.filter(o => o !== opt) : [...current, opt];
                      updateResponse('evaluation', 'didntWork', next);
                    }}
                    className={`px-6 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${formData.responses?.evaluation.didntWork.includes(opt) ? 'bg-rose-50 border-rose-500 text-rose-700' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              <textarea 
                className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none h-28"
                placeholder="What were the challenges?"
                value={formData.responses?.evaluation.didntWorkNote}
                onChange={(e) => updateResponse('evaluation', 'didntWorkNote', e.target.value)}
              />
            </div>
          </div>
        );

      case 'Analysis':
        return (
          <div className="space-y-8">
            <div className="space-y-4">
              <label className="text-lg font-bold text-slate-900 dark:text-white">Deep Dive: Why did students react this way?</label>
              <div className="relative">
                <textarea 
                  className="w-full p-6 rounded-3xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none min-h-[250px] text-lg leading-relaxed"
                  placeholder="Consider their motivation, the level of the task, your instructions, or external factors..."
                  value={formData.responses?.analysis.studentReaction}
                  onChange={(e) => updateResponse('analysis', 'studentReaction', e.target.value)}
                />
                <button className="absolute bottom-6 right-6 p-4 bg-brand-50 dark:bg-brand-900/20 text-brand-600 rounded-full hover:scale-110 transition-all">
                  <Mic className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-8 bg-brand-50 dark:bg-brand-900/20 rounded-3xl border border-brand-100 dark:border-brand-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-brand-700 dark:text-brand-400 font-bold text-lg">
                  <BrainCircuit className="w-6 h-6" />
                  Mentor Insights
                </div>
                <button 
                  onClick={handleGetAIInsight}
                  disabled={isAnalyzing || !formData.responses?.analysis.studentReaction}
                  className="bg-white dark:bg-slate-800 text-brand-600 px-4 py-2 rounded-xl font-bold shadow-sm hover:shadow-md transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isAnalyzing ? <Clock className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Get Mentor View
                </button>
              </div>
              {aiInsight ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-brand-800 dark:text-brand-300 italic text-lg leading-relaxed">
                  "{aiInsight}"
                </motion.div>
              ) : (
                <p className="text-sm text-brand-400">Your mentor is waiting for your analysis to provide feedback.</p>
              )}
            </div>
          </div>
        );

      case 'Conclusion':
        return (
          <div className="space-y-8 py-4">
            <div className="space-y-4">
              <label className="text-lg font-bold text-slate-900 dark:text-white">Key Takeaway</label>
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-xs">"I learned that..."</p>
                <textarea 
                  className="w-full bg-transparent outline-none dark:text-white text-xl font-medium min-h-[150px]"
                  placeholder="What is the most important thing you're taking away from this lesson?"
                  value={formData.responses?.conclusion.learned}
                  onChange={(e) => updateResponse('conclusion', 'learned', e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-lg font-bold text-slate-900 dark:text-white">Alternative Approach</label>
              <div className="p-8 bg-slate-50 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700">
                <p className="text-slate-400 font-bold mb-4 uppercase tracking-widest text-xs">"Next time, I should..."</p>
                <textarea 
                  className="w-full bg-transparent outline-none dark:text-white text-xl font-medium min-h-[150px]"
                  placeholder="What specific change would you make if you taught this lesson again tomorrow?"
                  value={formData.responses?.conclusion.nextTime}
                  onChange={(e) => updateResponse('conclusion', 'nextTime', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      case 'Action Plan':
        const focusAreas = ['Instructions', 'Management', 'Engagement', 'Board Work', 'CCQs/ICQs', 'Error Correction', 'Pacing', 'Materials'];
        return (
          <div className="space-y-10">
            <div className="space-y-6">
              <label className="text-lg font-bold text-slate-900 dark:text-white">Future Focus</label>
              <div className="flex flex-wrap gap-3">
                {focusAreas.map(area => (
                  <button 
                    key={area}
                    onClick={() => {
                      const current = formData.responses?.actionPlan.focusAreas || [];
                      const next = current.includes(area) ? current.filter(a => a !== area) : [...current, area];
                      updateResponse('actionPlan', 'focusAreas', next);
                    }}
                    className={`px-6 py-3 rounded-2xl border-2 text-sm font-bold transition-all ${formData.responses?.actionPlan.focusAreas.includes(area) ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-100 dark:border-slate-800 text-slate-400'}`}
                  >
                    {area}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Target Date
                </label>
                <input 
                  type="date"
                  className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none"
                  value={formData.responses?.actionPlan.deadline}
                  onChange={(e) => updateResponse('actionPlan', 'deadline', e.target.value)}
                />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <Target className="w-4 h-4" /> Specific Strategies
                </label>
                <textarea 
                  className="w-full p-5 rounded-2xl border border-slate-200 dark:border-slate-700 dark:bg-slate-800 dark:text-white outline-none h-32"
                  placeholder="How exactly will you improve? (e.g., 'I will write my instructions on the board before class')"
                  value={formData.responses?.actionPlan.strategies}
                  onChange={(e) => updateResponse('actionPlan', 'strategies', e.target.value)}
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[85vh]">
      {/* Wizard Header */}
      <div className="p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={handleBack}
            className="p-3 hover:bg-white dark:hover:bg-slate-800 rounded-2xl text-slate-400 hover:text-slate-600 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Week {week} Reflection</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-xs font-black text-brand-600 dark:text-brand-400 uppercase tracking-[0.2em]">{currentStep === -1 ? 'Setup' : STAGES[currentStep]}</span>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="text-xs text-slate-400 font-bold">{currentStep === -1 ? 'Getting Ready' : `Step ${currentStep + 1} of 6`}</span>
            </div>
          </div>
        </div>
        
        {currentStep !== -1 && (
          <div className="flex gap-2">
            {STAGES.map((_, i) => (
              <div 
                key={i} 
                className={`h-2 w-10 rounded-full transition-all duration-500 ${i <= currentStep ? 'bg-brand-500 shadow-lg shadow-brand-200' : 'bg-slate-200 dark:bg-slate-800'}`} 
              />
            ))}
          </div>
        )}
      </div>

      {/* Wizard Body */}
      <div className="flex-1 overflow-y-auto p-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {currentStep === -1 ? renderSetup() : renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Wizard Footer */}
      {currentStep !== -1 && currentStep !== 6 && (
        <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex justify-between items-center">
          <button 
            onClick={onCancel}
            className="px-8 py-4 rounded-2xl font-bold text-slate-400 hover:text-red-500 transition-all"
          >
            Cancel
          </button>

          <div className="flex gap-4">
            {currentStep === STAGES.length - 1 ? (
              <button 
                onClick={handleFinalSubmit}
                disabled={isAnalyzing}
                className="bg-brand-600 hover:bg-brand-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 shadow-xl shadow-brand-200 transition-all active:scale-95 disabled:opacity-70"
              >
                {isAnalyzing ? (
                  <>
                    <Clock className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    Complete
                  </>
                )}
              </button>
            ) : (
              <button 
                onClick={handleNext}
                className="bg-slate-900 dark:bg-brand-600 hover:bg-slate-800 dark:hover:bg-brand-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-none"
              >
                Next Step
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      <AnimatePresence>
        {isAnalyzing && currentStep === STAGES.length - 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-12 text-center"
          >
            <div className="w-24 h-24 relative mb-8">
              <div className="absolute inset-0 border-4 border-brand-100 dark:border-brand-900/20 rounded-full" />
              <div className="absolute inset-0 border-4 border-brand-500 rounded-full border-t-transparent animate-spin" />
              <BrainCircuit className="absolute inset-0 m-auto w-10 h-10 text-brand-500" />
            </div>
            <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">ELT Mentor is reviewing...</h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm text-lg leading-relaxed">Analyzing your teaching effectiveness, classroom management, and reflection depth based on Bloom's Taxonomy.</p>
            <div className="mt-10 flex gap-3">
              {[0, 150, 300].map(delay => (
                <div key={delay} className="w-3 h-3 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
