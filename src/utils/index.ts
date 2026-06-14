import Taro from '@tarojs/taro';
import type { MoodType, ToneType, ReplyLength, MatchType } from '@/types';

export const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return `${date.getMonth() + 1}/${date.getDate()}`;
};

export const formatDeadline = (deadline: string): string => {
  const date = new Date(deadline);
  const now = new Date();
  const diff = date.getTime() - now.getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (diff <= 0) return '已截止';
  if (hours < 24) return `${hours}小时后截止`;
  return `${days}天后截止`;
};

export const getMoodLabel = (mood: MoodType): string => {
  const map: Record<MoodType, string> = {
    happy: '开心',
    calm: '平静',
    anxious: '焦虑',
    sad: '低落',
  };
  return map[mood];
};

export const getToneLabel = (tone: ToneType): string => {
  const map: Record<ToneType, string> = {
    warm: '温暖治愈',
    rational: '理性分析',
    encouraging: '鼓励打气',
    empathetic: '共情倾听',
  };
  return map[tone];
};

export const getLengthLabel = (length: ReplyLength): string => {
  const map: Record<ReplyLength, string> = {
    short: '简短（100字内）',
    medium: '适中（100-300字）',
    long: '详细（300字以上）',
  };
  return map[length];
};

export const getMatchLabel = (type: MatchType): string => {
  const map: Record<MatchType, string> = {
    peer: '同龄人',
    opposite: '有相似经历',
    random: '随机匹配',
  };
  return map[type];
};

export const getStatusLabel = (status: string): string => {
  const map: Record<string, string> = {
    pending: '等待匹配',
    matched: '已匹配',
    replied: '已收到回复',
    resolved: '已解决',
    expired: '已截止',
  };
  return map[status] || status;
};

export const showToast = (
  title: string,
  icon: 'success' | 'loading' | 'error' | 'none' = 'none'
) => {
  Taro.showToast({
    title,
    icon,
    duration: 2000,
  });
};

export const showModal = (
  title: string,
  content: string,
  showCancel = true
): Promise<boolean> => {
  return new Promise((resolve) => {
    Taro.showModal({
      title,
      content,
      showCancel,
      success: (res) => {
        resolve(res.confirm);
      },
    });
  });
};

export const uid = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};
