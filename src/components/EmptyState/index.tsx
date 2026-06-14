import React from 'react';
import { View, Text } from '@tarojs/components';
import styles from './index.module.scss';

interface EmptyStateProps {
  emoji?: string;
  title: string;
  desc?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  emoji = '🌿',
  title,
  desc,
}) => {
  return (
    <View className={styles.emptyState}>
      <Text className={styles.emoji}>{emoji}</Text>
      <Text className={styles.title}>{title}</Text>
      {desc && <Text className={styles.desc}>{desc}</Text>}
    </View>
  );
};

export default EmptyState;
