import React from 'react';
import { View, Text } from '@tarojs/components';
import classnames from 'classnames';
import styles from './index.module.scss';

interface StatCardProps {
  value: number | string;
  label: string;
  variant?: 'default' | 'accent' | 'success';
  className?: string;
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  variant = 'default',
  className,
  onClick,
}) => {
  return (
    <View
      className={classnames(
        styles.statCard,
        variant !== 'default' && styles[variant],
        className
      )}
      onClick={onClick}
    >
      <Text className={styles.value}>{value}</Text>
      <Text className={styles.label}>{label}</Text>
    </View>
  );
};

export default StatCard;
