import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Button } from '@tarojs/components';
import Taro, { useDidShow } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import TroubleCard from '@/components/TroubleCard';
import EmptyState from '@/components/EmptyState';
import type { MatchType, Trouble } from '@/types';
import { showToast, showModal } from '@/utils';

interface MatchOption {
  type: MatchType;
  icon: string;
  title: string;
  desc: string;
}

const matchOptions: MatchOption[] = [
  { type: 'peer', icon: '👥', title: '同龄人', desc: '±3岁内' },
  { type: 'opposite', icon: '💡', title: '相似经历', desc: '同主题' },
  { type: 'random', icon: '🎲', title: '随机匹配', desc: '随缘抽取' },
];

const MatchPage: React.FC = () => {
  const { troubles, user, togglePauseMatch } = useApp();
  const [selectedType, setSelectedType] = useState<MatchType>('peer');
  const [isDrawing, setIsDrawing] = useState(false);
  const [matchedTroubles, setMatchedTroubles] = useState<Trouble[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);

  useDidShow(() => {
    console.log('[Match] onShow, isPaused:', user.isPaused);
    if (!hasDrawn && !user.isPaused) {
      performMatch(false);
    }
  });

  const availableTroubles = useMemo(() => {
    const filtered = troubles.filter(
      (t) =>
        t.userId !== 'me' &&
        (t.status === 'pending' || t.status === 'matched') &&
        !user.blockedUsers.includes(t.userId)
    );

    switch (selectedType) {
      case 'peer':
        return filtered.filter((t) => Math.abs(t.userAge - user.age) <= 3);
      case 'opposite':
        return filtered;
      case 'random':
      default:
        return filtered;
    }
  }, [troubles, selectedType, user.age, user.blockedUsers]);

  const performMatch = (showAnim = true) => {
    if (user.isPaused) {
      showModal('匹配已暂停', '是否恢复匹配功能？', true).then((confirm) => {
        if (confirm) togglePauseMatch();
      });
      return;
    }

    if (showAnim) {
      setIsDrawing(true);
    }

    setTimeout(() => {
      const shuffled = [...availableTroubles].sort(() => Math.random() - 0.5);
      const count = Math.min(5, shuffled.length);
      setMatchedTroubles(shuffled.slice(0, count));
      setHasDrawn(true);
      setIsDrawing(false);
      if (showAnim) {
        showToast(`抽取到 ${count} 张卡片 ✨`);
      }
    }, showAnim ? 1200 : 0);
  };

  const handleOptionChange = (type: MatchType) => {
    setSelectedType(type);
    setHasDrawn(false);
    setTimeout(() => performMatch(true), 100);
  };

  const handleRespond = (troubleId: string) => {
    Taro.navigateTo({
      url: `/pages/response-editor/index?troubleId=${troubleId}`,
    });
  };

  if (user.isPaused) {
    return (
      <View className={styles.matchPage}>
        <View className={styles.pausedOverlay}>
          <Text className={styles.emoji}>🌙</Text>
          <Text className={styles.title}>匹配已暂停</Text>
          <Text className={styles.desc}>
            你已暂时关闭匹配功能，好好休息一下吧。
            {'\n'}准备好了随时可以重新开启～
          </Text>
          <Button
            className="btnPrimary"
            onClick={() => togglePauseMatch()}
          >
            恢复匹配
          </Button>
        </View>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.matchPage}>
      <View className={styles.matchOptions}>
        {matchOptions.map((opt) => (
          <View
            key={opt.type}
            className={classnames(
              styles.optionCard,
              selectedType === opt.type && styles.active
            )}
            onClick={() => handleOptionChange(opt.type)}
          >
            <View className={styles.icon}>{opt.icon}</View>
            <Text className={styles.title}>{opt.title}</Text>
            <Text className={styles.desc}>{opt.desc}</Text>
          </View>
        ))}
      </View>

      <View className={styles.drawSection}>
        <View
          className={classnames(styles.drawBtn, isDrawing && styles.drawing)}
          onClick={() => performMatch(true)}
        >
          <Text className={styles.emoji}>{isDrawing ? '🎴' : '✨'}</Text>
          <Text className={styles.label}>
            {isDrawing ? '抽取中...' : '抽取卡片'}
          </Text>
        </View>
        <Text className={styles.hint}>
          池中共有 {availableTroubles.length} 个烦恼等待帮助
        </Text>
      </View>

      <View className={styles.results}>
        <View className={styles.resultsHeader}>
          <Text className={styles.title}>
            匹配结果
            <Text className={styles.count}>({matchedTroubles.length})</Text>
          </Text>
          <View
            className={styles.refresh}
            onClick={() => performMatch(true)}
          >
            🔄 换一批
          </View>
        </View>

        {matchedTroubles.length === 0 ? (
          <EmptyState
            emoji="🌊"
            title="暂无匹配结果"
            desc="换一种匹配方式，或者稍后再来看看吧"
          />
        ) : (
          matchedTroubles.map((trouble) => (
            <View key={trouble.id}>
              <TroubleCard
                trouble={trouble}
                showStatus={false}
                onClick={() => handleRespond(trouble.id)}
              />
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
};

export default MatchPage;
