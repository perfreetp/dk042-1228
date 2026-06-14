import React, { useState } from 'react';
import { View, Text, Image } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import type { Response } from '@/types';
import { formatTime, getToneLabel } from '@/utils';

interface ResponseCardProps {
  response: Response;
  troubleId: string;
  onRate?: (rating: number) => void;
  onMarkUseful?: (sentenceIndex: number) => void;
  showRateAction?: boolean;
  showFollowUp?: boolean;
  onFollowUp?: () => void;
  onBlock?: () => void;
  onReport?: () => void;
}

const ResponseCard: React.FC<ResponseCardProps> = ({
  response,
  troubleId,
  onRate,
  onMarkUseful,
  showRateAction = true,
  showFollowUp,
  onFollowUp,
  onBlock,
  onReport,
}) => {
  const [hoveredRating, setHoveredRating] = useState(0);
  const [currentRating, setCurrentRating] = useState(response.rating || 0);
  const [isPlaying, setIsPlaying] = useState(false);

  const sentences = response.content.split(/[。！？!?\n]+/).filter((s) => s.trim());

  const handlePlayVoice = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), (response.voiceDuration || 5) * 1000);
  };

  const handleRate = (rating: number) => {
    if (!onRate) return;
    setCurrentRating(rating);
    onRate(rating);
  };

  const handleLongPress = () => {
    Taro.showActionSheet({
      itemList: [
        '举报内容',
        ...(onBlock ? ['屏蔽该用户'] : []),
      ],
      success: (res) => {
        if (res.tapIndex === 0) onReport?.();
        if (res.tapIndex === 1) onBlock?.();
      },
    });
  };

  return (
    <View className={styles.responseCard} onLongPress={handleLongPress}>
      <View className={styles.header}>
        <Image
          className={styles.avatar}
          src={response.userAvatar}
          mode="aspectFill"
        />
        <View className={styles.info}>
          <View className={styles.nameRow}>
            <Text className={styles.name}>{response.userName}</Text>
            <View className={styles.toneTag}>{getToneLabel(response.tone)}</View>
          </View>
          <Text className={styles.time}>{formatTime(response.createdAt)}</Text>
        </View>
        {response.isVoice && (
          <View className={styles.voiceBadge}>🎵 语音</View>
        )}
      </View>

      {response.isVoice ? (
        <View className={styles.voicePlayer}>
          <View className={styles.voiceWaveform}>
            {[...Array(24)].map((_, i) => (
              <View
                key={i}
                className={classnames(styles.voiceBar, isPlaying && styles.playing)}
                style={{
                  height: `${16 + (i % 7) * 10}rpx`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </View>
          <View className={styles.voiceControls}>
            <View className={styles.playBtn} onClick={handlePlayVoice}>
              {isPlaying ? '⏸️' : '▶️'}
            </View>
            <Text className={styles.duration}>
              {Math.floor((response.voiceDuration || 0) / 60).toString().padStart(2, '0')}:
              {((response.voiceDuration || 0) % 60).toString().padStart(2, '0')}
            </Text>
            <Text className={styles.voiceLabel}>语音消息</Text>
          </View>
        </View>
      ) : (
        <View className={styles.content}>
          {sentences.map((sentence, idx) => (
            <Text
              key={idx}
              className={classnames(
                styles.sentence,
                response.usefulSentences.includes(idx) && styles.useful
              )}
              onClick={() => onMarkUseful?.(idx)}
            >
              {sentence.trim()}。
            </Text>
          ))}
        </View>
      )}
      {response.isVoice && response.content && response.content !== '[语音消息]' && (
        <View className={styles.content}>
          {sentences.map((sentence, idx) => (
            <Text
              key={idx}
              className={classnames(
                styles.sentence,
                response.usefulSentences.includes(idx) && styles.useful
              )}
              onClick={() => onMarkUseful?.(idx)}
            >
              {sentence.trim()}。
            </Text>
          ))}
        </View>
      )}

      <View className={styles.actions}>
        <View className={styles.left}>
          {showRateAction && (
            <View
              className={styles.rating}
              onMouseLeave={() => setHoveredRating(0)}
            >
              {[1, 2, 3, 4, 5].map((star) => (
                <Text
                  key={star}
                  className={classnames(
                    styles.star,
                    (hoveredRating || currentRating) >= star && styles.active
                  )}
                  onClick={() => handleRate(star)}
                  onTouchStart={() => setHoveredRating(star)}
                >
                  ⭐
                </Text>
              ))}
            </View>
          )}
        </View>

        <View style={{ display: 'flex', gap: '16rpx' }}>
          {onMarkUseful && (
            <View
              className={classnames(
                styles.actionBtn,
                response.usefulSentences.length > 0 && styles.active
              )}
            >
              💡 {response.usefulSentences.length > 0 ? '已标记' : '标记有用'}
            </View>
          )}
          {showFollowUp && !response.hasFollowUp && (
            <View className={styles.actionBtn} onClick={onFollowUp}>
              🔄 回访
            </View>
          )}
        </View>
      </View>

      <Text style={{ display: 'none' }}>{troubleId}</Text>
    </View>
  );
};

export default ResponseCard;
