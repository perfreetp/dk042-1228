import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useDidShow, usePullDownRefresh } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import TroubleCard from '@/components/TroubleCard';
import EmptyState from '@/components/EmptyState';
import type { TroubleStatus } from '@/types';

type TabType = 'all' | TroubleStatus;

const InboxPage: React.FC = () => {
  const { myTroubles, troubles, user } = useApp();
  const [activeTab, setActiveTab] = useState<TabType>('all');

  useDidShow(() => {
    console.log('[Inbox] onShow, myTroubles:', myTroubles.length);
  });

  usePullDownRefresh(() => {
    setTimeout(() => {
      Taro.stopPullDownRefresh();
    }, 1000);
  });

  const tabs: { key: TabType; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待匹配' },
    { key: 'matched', label: '匹配中' },
    { key: 'replied', label: '有回复' },
    { key: 'resolved', label: '已解决' },
  ];

  const filteredTroubles = useMemo(() => {
    if (activeTab === 'all') return myTroubles;
    return myTroubles.filter((t) => t.status === activeTab);
  }, [myTroubles, activeTab]);

  const unreadCount = useMemo(
    () =>
      myTroubles.reduce(
        (sum, t) =>
          t.status === 'replied' || t.status === 'matched' ? sum + 1 : sum,
        0
      ),
    [myTroubles]
  );

  const handleSubmit = () => {
    Taro.navigateTo({ url: '/pages/submit/index' });
  };

  const handleGoMatch = () => {
    Taro.switchTab({ url: '/pages/match/index' });
  };

  const handleGoGrowth = () => {
    Taro.switchTab({ url: '/pages/growth/index' });
  };

  return (
    <ScrollView scrollY className={styles.inboxPage}>
      <View className={styles.header}>
        <Text className={styles.greeting}>你好，{user.nickname} 👋</Text>
        <Text className={styles.subGreeting}>
          有 {unreadCount} 条烦恼等待你的关注，祝你今天一切顺利～
        </Text>
        <View className={styles.quickActions}>
          <View className={styles.quickBtn} onClick={handleSubmit}>
            <View className={styles.emoji}>📝</View>
            <Text className={styles.label}>写下烦恼</Text>
          </View>
          <View className={styles.quickBtn} onClick={handleGoMatch}>
            <View className={styles.emoji}>💝</View>
            <Text className={styles.label}>帮助他人</Text>
          </View>
          <View className={styles.quickBtn} onClick={handleGoGrowth}>
            <View className={styles.emoji}>📈</View>
            <Text className={styles.label}>我的成长</Text>
          </View>
        </View>
      </View>

      <ScrollView
        scrollX
        className={styles.filterTabs}
        style={{ whiteSpace: 'nowrap' }}
      >
        {tabs.map((tab) => (
          <View
            key={tab.key}
            className={classnames(
              styles.tab,
              activeTab === tab.key && styles.active
            )}
            style={{ display: 'inline-block' }}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </View>
        ))}
      </ScrollView>

      <View className={styles.content}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>我发起的烦恼</Text>
          <View className={styles.count}>{filteredTroubles.length} 条</View>
        </View>

        {filteredTroubles.length === 0 ? (
          <EmptyState
            emoji="🌱"
            title="还没有烦恼记录"
            desc="点击右下角按钮，写下你的第一个烦恼吧"
          />
        ) : (
          filteredTroubles.map((trouble) => (
            <TroubleCard key={trouble.id} trouble={trouble} />
          ))
        )}

        {troubles.filter((t) => t.responses.length > 0).length > 0 && (
          <>
            <View className={styles.sectionHeader} style={{ marginTop: 48 }}>
              <Text className={styles.title}>我帮助过的人</Text>
              <View className={styles.count}>
                {troubles.filter((t) => t.responses.length > 0).length} 条
              </View>
            </View>
            {troubles
              .filter((t) => t.responses.length > 0)
              .slice(0, 3)
              .map((trouble) => (
                <TroubleCard key={trouble.id} trouble={trouble} />
              ))}
          </>
        )}
      </View>

      <View className={styles.fab} onClick={handleSubmit}>
        +
      </View>
    </ScrollView>
  );
};

export default InboxPage;
