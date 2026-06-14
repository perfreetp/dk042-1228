import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import { formatTime, getToneLabel } from '@/utils';

const moodEmojis = ['😢', '😔', '😐', '🙂', '😊'];

const GrowthPage: React.FC = () => {
  const { user, growthData, myTroubles, troubles } = useApp();

  const avgMood = useMemo(() => {
    const sum = growthData.moodTrend.reduce((s, d) => s + d.mood, 0);
    return Math.round((sum / growthData.moodTrend.length) * 10) / 10;
  }, [growthData.moodTrend]);

  const maxWeeklyCount = useMemo(() => {
    return Math.max(...growthData.weeklyHelp.map((d) => d.count), 1);
  }, [growthData.weeklyHelp]);

  const chartPath = useMemo(() => {
    const data = growthData.moodTrend;
    const width = 620;
    const height = 200;
    const padding = 20;
    const stepX = (width - padding * 2) / (data.length - 1);

    const points = data.map((d, i) => {
      const x = padding + i * stepX;
      const y = height - padding - ((d.mood - 1) / 4) * (height - padding * 2);
      return { x, y };
    });

    const path = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
      .join(' ');

    const areaPath = `${path} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

    return { path, areaPath, points };
  }, [growthData.moodTrend]);

  const recentHelped = useMemo(() => {
    const helped: { troubleId: string; userName: string; userAvatar: string; theme: string; content: string; repliedAt: string }[] = [];
    troubles.forEach((t) => {
      t.responses.forEach((r) => {
        if (r.userId === user.id) {
          helped.push({
            troubleId: t.id,
            userName: t.userName,
            userAvatar: t.userAvatar,
            theme: t.theme,
            content: t.content,
            repliedAt: r.createdAt,
          });
        }
      });
    });
    return helped.slice(0, 5);
  }, [troubles, user.id]);

  const highRatedResponses = useMemo(() => {
    const results: { troubleId: string; troubleTheme: string; rating: number; content: string; tone: string; createdAt: string }[] = [];
    troubles.forEach((t) => {
      t.responses.forEach((r) => {
        if (r.userId === user.id && r.rating && r.rating >= 4) {
          results.push({
            troubleId: t.id,
            troubleTheme: t.theme,
            rating: r.rating,
            content: r.content,
            tone: r.tone,
            createdAt: r.createdAt,
          });
        }
      });
    });
    results.sort((a, b) => b.rating - a.rating);
    return results.slice(0, 5);
  }, [troubles, user.id]);

  const goRules = () => {
    Taro.navigateTo({ url: '/pages/rules/index' });
  };

  const goTroubleDetail = (troubleId: string) => {
    Taro.navigateTo({ url: `/pages/trouble-detail/index?troubleId=${troubleId}` });
  };

  return (
    <ScrollView scrollY className={styles.growthPage}>
      <View className={styles.profileCard}>
        <View className={styles.userInfo}>
          <Image
            className={styles.avatar}
            src={user.avatar}
            mode="aspectFill"
          />
          <View className={styles.info}>
            <Text className={styles.nickname}>{user.nickname}</Text>
            <Text className={styles.bio}>{user.bio}</Text>
          </View>
        </View>
        <View className={styles.statsRow}>
          <View className={styles.statItem}>
            <Text className={styles.value}>{growthData.helpCount}</Text>
            <Text className={styles.label}>帮助次数</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{growthData.thankedCount}</Text>
            <Text className={styles.label}>被感谢</Text>
          </View>
          <View className={styles.statItem}>
            <Text className={styles.value}>{growthData.resolveCount}</Text>
            <Text className={styles.label}>已解决</Text>
          </View>
        </View>
      </View>

      <Text className={styles.sectionTitle}>情绪趋势</Text>
      <View className={styles.moodChart}>
        <View className={styles.chartHeader}>
          <Text className={styles.title}>近 7 天情绪变化</Text>
          <View className={styles.moodAvg}>
            <Text className={styles.emoji}>
              {moodEmojis[Math.ceil(avgMood) - 1] || '😐'}
            </Text>
            平均 {avgMood}/5
          </View>
        </View>
        <View className={styles.chartBody}>
          <svg width="100%" height="100%" viewBox="0 0 620 240">
            <defs>
              <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C9EFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#7C9EFF" stopOpacity="0.02" />
              </linearGradient>
            </defs>
            <path
              d={chartPath.areaPath}
              fill="url(#moodGrad)"
            />
            <path
              d={chartPath.path}
              fill="none"
              stroke="#7C9EFF"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {chartPath.points.map((p, i) => (
              <g key={i}>
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  fill="#FFFFFF"
                  stroke="#7C9EFF"
                  strokeWidth="3"
                />
              </g>
            ))}
          </svg>
        </View>
        <View className={styles.dateLabels}>
          {growthData.moodTrend.map((d) => (
            <Text key={d.date}>{d.date}</Text>
          ))}
        </View>
      </View>

      <Text className={styles.sectionTitle}>本周帮助</Text>
      <View className={styles.weeklyChart}>
        <View className={styles.chartHeader}>
          <Text className={styles.title}>每日帮助次数</Text>
          <Text className={styles.sub}>
            本周共帮助 {growthData.weeklyHelp.reduce((s, d) => s + d.count, 0)} 人
          </Text>
        </View>
        <View className={styles.bars}>
          {growthData.weeklyHelp.map((d) => {
            const height = (d.count / maxWeeklyCount) * 160;
            return (
              <View key={d.day} className={styles.barWrap}>
                <Text className={styles.count}>{d.count > 0 ? d.count : ''}</Text>
                <View
                  className={styles.bar}
                  style={{ height: `${height}rpx` }}
                />
              </View>
            );
          })}
        </View>
        <View className={styles.dayLabels}>
          {growthData.weeklyHelp.map((d) => (
            <Text key={d.day} className={styles.day}>{d.day}</Text>
          ))}
        </View>
      </View>

      {recentHelped.length > 0 && (
        <View className={styles.helpedSection}>
          <Text className={styles.sectionTitle}>最近帮助过的人</Text>
          <View className={styles.helpedList}>
            {recentHelped.map((item, idx) => (
              <View
                key={idx}
                className={styles.helpedItem}
                onClick={() => goTroubleDetail(item.troubleId)}
              >
                <Image
                  className={styles.helpedAvatar}
                  src={item.userAvatar}
                  mode="aspectFill"
                />
                <View className={styles.helpedInfo}>
                  <View className={styles.helpedRow}>
                    <Text className={styles.helpedName}>{item.userName}</Text>
                    <Text className={styles.helpedTheme}>📌 {item.theme}</Text>
                  </View>
                  <Text className={styles.helpedContent}>
                    {item.content.slice(0, 50)}...
                  </Text>
                </View>
                <Text className={styles.helpedTime}>{formatTime(item.repliedAt)}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {highRatedResponses.length > 0 && (
        <View className={styles.praisedSection}>
          <Text className={styles.sectionTitle}>⭐ 收到高分感谢的回复</Text>
          <View className={styles.praisedList}>
            {highRatedResponses.map((item, idx) => (
              <View
                key={idx}
                className={styles.praisedItem}
                onClick={() => goTroubleDetail(item.troubleId)}
              >
                <View className={styles.praisedHeader}>
                  <View className={styles.praisedTag}>
                    {getToneLabel(item.tone as any)}
                  </View>
                  <View className={styles.praisedStars}>
                    {Array.from({ length: item.rating }).map((_, si) => (
                      <Text key={si} className={styles.star}>⭐</Text>
                    ))}
                  </View>
                  <Text className={styles.praisedTheme}>📌 {item.troubleTheme}</Text>
                </View>
                <Text className={styles.praisedContent}>
                  {item.content.slice(0, 80)}...
                </Text>
                <View className={styles.praisedFooter}>
                  <Text className={styles.praisedTime}>{formatTime(item.createdAt)}</Text>
                  <Text className={styles.praisedLink}>查看上下文 →</Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      )}

      <View className={styles.historySection}>
        <Text className={styles.sectionTitle}>成就记录</Text>
        <View className={styles.list}>
          <View
            className={styles.listItem}
            onClick={goRules}
          >
            <View className={styles.icon}>💝</View>
            <View className={styles.info}>
              <Text className={styles.title}>帮助了 {growthData.helpCount} 人</Text>
              <Text className={styles.desc}>累计送出 {growthData.helpCount} 份温暖</Text>
            </View>
            <View className={styles.badge}>继续加油</View>
          </View>
          <View className={styles.listItem}>
            <View className={styles.icon}>⭐</View>
            <View className={styles.info}>
              <Text className={styles.title}>获得 {growthData.thankedCount} 次感谢</Text>
              <Text className={styles.desc}>你的回应温暖了很多人</Text>
            </View>
          </View>
          <View className={styles.listItem}>
            <View className={styles.icon}>✅</View>
            <View className={styles.info}>
              <Text className={styles.title}>解决了 {growthData.resolveCount} 个烦恼</Text>
              <Text className={styles.desc}>每个问题都有了好的方向</Text>
            </View>
          </View>
          <View className={styles.listItem}>
            <View className={styles.icon}>🔥</View>
            <View className={styles.info}>
              <Text className={styles.title}>连续帮助 7 天</Text>
              <Text className={styles.desc}>保持这份善意的温度</Text>
            </View>
            <View className={styles.badge}>连胜中</View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default GrowthPage;
