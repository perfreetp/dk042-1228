import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  tag: string;
  tagColor: string;
}

const matchOptions: MatchOption[] = [
  {
    type: 'peer',
    icon: '👥',
    title: '同龄人',
    desc: '±3岁内，相似处境',
    tag: '同频',
    tagColor: '#7C9EFF',
  },
  {
    type: 'opposite',
    icon: '🧭',
    title: '过来人',
    desc: '大5岁以上，有经验',
    tag: '解惑',
    tagColor: '#F59E0B',
  },
  {
    type: 'random',
    icon: '🎲',
    title: '随机匹配',
    desc: '全池随缘，遇见惊喜',
    tag: '随缘',
    tagColor: '#10B981',
  },
];

const MatchPage: React.FC = () => {
  const { troubles, user, togglePauseMatch } = useApp();
  const [selectedType, setSelectedType] = useState<MatchType>('peer');
  const [isDrawing, setIsDrawing] = useState(false);
  const [matchedTroubles, setMatchedTroubles] = useState<Trouble[]>([]);
  const [hasDrawn, setHasDrawn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const drawnIds = useRef<Set<string>>(new Set());

  useDidShow(() => {
    console.log('[Match] onShow, isPaused:', user.isPaused);
    if (!hasDrawn && !user.isPaused) {
      performMatch(false);
    }
  });

  const allAvailable = useMemo(() => {
    return troubles.filter(
      (t) =>
        t.userId !== 'me' &&
        (t.status === 'pending' || t.status === 'matched') &&
        !user.blockedUsers.includes(t.userId)
    );
  }, [troubles, user.age, user.blockedUsers]);

  const availableTroubles = useMemo(() => {
    let filtered = allAvailable;

    switch (selectedType) {
      case 'peer':
        filtered = allAvailable.filter(
          (t) => Math.abs(t.userAge - user.age) <= 3
        );
        break;
      case 'opposite':
        filtered = allAvailable.filter(
          (t) =>
            t.userAge > user.age + 5 &&
            t.responses.length > 0
        );
        if (filtered.length < 3) {
          filtered = allAvailable.filter(
            (t) => t.userAge > user.age + 3
          );
        }
        break;
      case 'random':
      default:
        filtered = allAvailable;
        break;
    }

    return filtered;
  }, [allAvailable, selectedType, user.age]);

  const performMatch = (showAnim = true) => {
    if (user.isPaused) {
      showModal('匹配已暂停', '是否恢复匹配功能？', true).then((confirm) => {
        if (confirm) togglePauseMatch();
      });
      return;
    }

    if (availableTroubles.length === 0) {
      setMatchedTroubles([]);
      setHasDrawn(true);
      showToast('暂无符合条件的烦恼');
      return;
    }

    if (showAnim) {
      setIsDrawing(true);
    }

    setTimeout(() => {
      let pool = [...availableTroubles];

      if (selectedType === 'random') {
        pool = pool.sort(() => Math.random() - 0.5);
      } else if (selectedType === 'peer') {
        pool.sort((a, b) => {
          const aDiff = Math.abs(a.userAge - user.age);
          const bDiff = Math.abs(b.userAge - user.age);
          return aDiff - bDiff;
        });
        pool = pool.sort(() => Math.random() - 0.5).sort((a, b) => {
          const aDiff = Math.abs(a.userAge - user.age);
          const bDiff = Math.abs(b.userAge - user.age);
          return aDiff - bDiff;
        });
      } else if (selectedType === 'opposite') {
        pool.sort((a, b) => b.userAge - a.userAge);
        pool = pool.sort(() => Math.random() - 0.3).sort((a, b) => b.userAge - a.userAge);
      }

      const count = Math.min(5, pool.length);
      const results = pool.slice(0, count);

      setMatchedTroubles(results);
      setHasDrawn(true);
      setIsDrawing(false);
      setRefreshKey((k) => k + 1);

      results.forEach((t) => drawnIds.current.add(t.id));

      if (showAnim) {
        const typeLabels = { peer: '同龄', opposite: '过来人', random: '随机' };
        showToast(`抽到 ${count} 张${typeLabels[selectedType]}卡片 ✨`);
      }
    }, showAnim ? 1200 : 0);
  };

  const handleOptionChange = (type: MatchType) => {
    setSelectedType(type);
    setHasDrawn(false);
    drawnIds.current.clear();
    setTimeout(() => performMatch(true), 100);
  };

  const handleRespond = (troubleId: string) => {
    Taro.navigateTo({
      url: `/pages/response-editor/index?troubleId=${troubleId}`,
    });
  };

  const typeStats = useMemo(() => {
    const peer = allAvailable.filter((t) => Math.abs(t.userAge - user.age) <= 3).length;
    const opposite = allAvailable.filter((t) => t.userAge > user.age + 5).length;
    const random = allAvailable.length;
    return { peer, opposite, random };
  }, [allAvailable, user.age]);

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
            <View
              className={styles.tag}
              style={{ background: `${opt.tagColor}15`, color: opt.tagColor }}
            >
              {opt.tag}
            </View>
            <View className={styles.icon}>{opt.icon}</View>
            <Text className={styles.title}>{opt.title}</Text>
            <Text className={styles.desc}>{opt.desc}</Text>
            <Text className={styles.count}>
              池中 {typeStats[opt.type]} 个
            </Text>
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
            {isDrawing ? '抽取中...' : '抽一批卡片'}
          </Text>
        </View>
        <Text className={styles.hint}>
          {selectedType === 'peer' && '匹配与你年龄相近的人，更容易感同身受'}
          {selectedType === 'opposite' && '找有更多经历的过来人，听听他们的建议'}
          {selectedType === 'random' && '完全随机抽取，说不定会遇到意想不到的温暖'}
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

        {!hasDrawn ? (
          <EmptyState
            emoji="🎴"
            title="点击上方按钮抽取"
            desc="选一种匹配方式，抽几张卡片看看吧"
          />
        ) : matchedTroubles.length === 0 ? (
          <EmptyState
            emoji="🌊"
            title="暂无匹配结果"
            desc="换一种匹配方式，或者稍后再来看看吧"
          />
        ) : (
          matchedTroubles.map((trouble) => (
            <View key={`${trouble.id}-${refreshKey}`}>
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
