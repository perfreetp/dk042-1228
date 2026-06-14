import React from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Trouble } from '@/types';
import MoodTag from '@/components/MoodTag';
import { formatTime, formatDeadline, getStatusLabel, getLengthLabel } from '@/utils';

interface TroubleCardProps {
  trouble: Trouble;
  showStatus?: boolean;
  onClick?: () => void;
}

const TroubleCard: React.FC<TroubleCardProps> = ({
  trouble,
  showStatus = true,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      Taro.navigateTo({
        url: `/pages/trouble-detail/index?id=${trouble.id}`,
      });
    }
  };

  return (
    <View className={styles.troubleCard} onClick={handleClick}>
      <View className={styles.header}>
        <Image
          className={styles.avatar}
          src={trouble.userAvatar}
          mode="aspectFill"
        />
        <View className={styles.userInfo}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{trouble.userName}</Text>
            <Text className={styles.age}>{trouble.userAge}岁</Text>
          </View>
          <Text className={styles.time}>{formatTime(trouble.createdAt)}</Text>
        </View>
        {showStatus && (
          <View
            className={classnames(styles.statusBadge, styles[trouble.status])}
          >
            {getStatusLabel(trouble.status)}
          </View>
        )}
      </View>

      <View className={styles.content}>
        <View className={styles.tags}>
          <View className={styles.themeTag}>{trouble.theme}</View>
          <MoodTag mood={trouble.mood} />
          {trouble.needSolution && (
            <View
              className={styles.themeTag}
              style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10B981' }}
            >
              求方案
            </View>
          )}
        </View>
        <Text className={styles.text}>{trouble.content}</Text>
      </View>

      <View className={styles.footer}>
        <View className={styles.meta}>
          <View className={styles.item}>📏 {getLengthLabel(trouble.expectedLength)}</View>
          <View className={styles.item}>⏰ {formatDeadline(trouble.deadline)}</View>
        </View>
        {trouble.responses.length > 0 && (
          <Text className={styles.replyCount}>
            💬 {trouble.responses.length} 条回复
          </Text>
        )}
      </View>
    </View>
  );
};

export default TroubleCard;
