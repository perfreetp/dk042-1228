import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { MoodType } from '@/types';
import { getMoodLabel } from '@/utils';

interface MoodTagProps {
  mood: MoodType;
  className?: string;
}

const MoodTag: React.FC<MoodTagProps> = ({ mood, className }) => {
  const moodEmoji: Record<MoodType, string> = {
    happy: '😊',
    calm: '😌',
    anxious: '😟',
    sad: '😢',
  };

  return (
    <View className={classnames(styles.moodTag, styles[mood], className)}>
      <Text>{moodEmoji[mood]} {getMoodLabel(mood)}</Text>
    </View>
  );
};

export default MoodTag;
