export type GibbsStage = 'Description' | 'Feelings' | 'Evaluation' | 'Analysis' | 'Conclusion' | 'Action Plan';

export type LessonType = 'PPP' | 'TBLT' | 'ESA' | 'Other';
export type SkillFocus = 'Reading' | 'Writing' | 'Listening' | 'Speaking' | 'Grammar' | 'Vocabulary' | 'Pronunciation';

export interface ReflectionData {
  id: string;
  userId: string;
  week: number;
  date: string;
  title: string;
  status: 'draft' | 'completed';
  qualityScore?: number;
  aiFeedback?: {
    summary: string;
    depthScore: number; // Bloom's Taxonomy based
    evaluationDetails?: {
      strengths: string[];
      weaknesses: string[];
      wordAnalysis: string;
    };
    effectiveness: string;
    management: string;
    engagement: string;
    instructions: string;
    strategies: string[];
    goals: string[];
    furtherEnhancement?: string;
  };
  lessonMetadata: {
    type: LessonType;
    focus: SkillFocus[];
  };
  responses: {
    description: {
      objective: string;
      activity: string;
      outcome: string;
      timeline?: { time: string; event: string }[];
    };
    feelings: {
      emoji: string;
      confidence: string;
      uncertainty: string;
    };
    evaluation: {
      workedWell: string[];
      workedWellNote: string;
      didntWork: string[];
      didntWorkNote: string;
    };
    analysis: {
      studentReaction: string;
      aiInsights?: string;
    };
    conclusion: {
      learned: string;
      nextTime: string;
    };
    actionPlan: {
      focusAreas: string[];
      deadline: string;
      strategies: string;
    };
  };
  videoData?: {
    url: string;
    timestamps: { time: number; note: string; aiInsight?: string }[];
  };
  peerFeedback?: {
    author: string;
    comment: string;
    date: string;
  }[];
}

export interface UserStats {
  totalReflections: number;
  currentWeek: number;
  averageScore: number;
  badges: string[];
  xp: number;
  level: number;
  streak: number;
  growthData: {
    engagement: number[];
    management: number[];
    clarity: number[];
    depth: number[];
  };
}

export interface AppSettings {
  darkMode: boolean;
}

export interface UserProfile {
  displayName: string;
  collegeId: string;
  email: string;
}

export interface Collaboration {
  id: string;
  senderId: string;
  senderEmail: string;
  senderName: string;
  recipientEmail: string;
  content: string;
  type: 'peer' | 'supervisor';
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
}

export interface Comment {
  id: string;
  collaborationId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: string;
}
