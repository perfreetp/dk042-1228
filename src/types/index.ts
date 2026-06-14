export type MoodType = 'happy' | 'calm' | 'anxious' | 'sad';

export type TroubleTheme =
  | '学业'
  | '工作'
  | '情感'
  | '家庭'
  | '人际'
  | '健康'
  | '金钱'
  | '其他';

export type MatchType = 'peer' | 'opposite' | 'random';

export type ReplyLength = 'short' | 'medium' | 'long';

export type TroubleStatus = 'pending' | 'matched' | 'replied' | 'resolved' | 'expired';

export interface UserProfile {
  id: string;
  nickname: string;
  avatar: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  bio: string;
  helpCount: number;
  thankedCount: number;
  isPaused: boolean;
  blockedUsers: string[];
}

export interface Trouble {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  userAge: number;
  theme: TroubleTheme;
  content: string;
  mood: MoodType;
  needSolution: boolean;
  allowVoice: boolean;
  expectedLength: ReplyLength;
  deadline: string;
  createdAt: string;
  status: TroubleStatus;
  responses: Response[];
  actionItems?: ActionItem[];
  isFollowedUp?: boolean;
}

export interface Response {
  id: string;
  troubleId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  tone: ToneType;
  isVoice: boolean;
  voiceUrl?: string;
  voiceDuration?: number;
  createdAt: string;
  rating?: number;
  usefulSentences: number[];
  hasFollowUp?: boolean;
  isDraft?: boolean;
}

export type ToneType = 'warm' | 'rational' | 'encouraging' | 'empathetic';

export interface ActionItem {
  id: string;
  content: string;
  done: boolean;
  createdAt: string;
}

export interface GrowthData {
  helpCount: number;
  thankedCount: number;
  resolveCount: number;
  moodTrend: { date: string; mood: number }[];
  weeklyHelp: { day: string; count: number }[];
}

export interface Draft {
  id: string;
  troubleId?: string;
  content: string;
  tone: ToneType;
  updatedAt: string;
  mode?: 'segment' | 'full';
  segments?: string[];
}

export interface FollowUpRecord {
  id: string;
  troubleId: string;
  troubleTheme: TroubleTheme;
  troubleContent: string;
  responseId: string;
  responderName: string;
  direction: 'sent' | 'received';
  content: string;
  mood: string;
  createdAt: string;
}

export interface MatchOption {
  type: MatchType;
  title: string;
  desc: string;
  icon: string;
}

export interface RuleItem {
  title: string;
  content: string;
}
