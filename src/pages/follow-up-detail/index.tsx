import React, { useMemo } from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import EmptyState from '@/components/EmptyState';
import ResponseCard from '@/components/ResponseCard';
import { showModal, formatTime } from '@/utils';

const FollowUpDetailPage: React.FC = () => {
  const router = useRouter();
  const recordId = router.params.recordId;

  const { followUpRecords, troubles, myTroubles, blockUser, reportContent } = useApp();

  const record = useMemo(
    () => followUpRecords.find((r) => r.id === recordId),
    [followUpRecords, recordId]
  );

  const trouble = useMemo(() => {
    if (!record) return undefined;
    return [...troubles, ...myTroubles].find((t) => t.id === record.troubleId);
  }, [record, troubles, myTroubles]);

  const response = useMemo(() => {
    if (!trouble || !record) return undefined;
    return trouble.responses.find((r) => r.id === record.responseId);
  }, [trouble, record]);

  const handleGoTrouble = () => {
    if (!trouble) return;
    Taro.redirectTo({
      url: `/pages/trouble-detail/index?troubleId=${trouble.id}&responseId=${record?.responseId}`,
    });
  };

  const handleReport = () => {
    Taro.showActionSheet({
      itemList: ['垃圾广告', '辱骂攻击', '违法违规', '其他'],
      success: (res) => {
        const reasons = ['垃圾广告', '辱骂攻击', '违法违规', '其他'];
        reportContent('followUp', recordId || '', reasons[res.tapIndex]);
      },
    });
  };

  if (!record) {
    return (
      <ScrollView scrollY className={styles.page}>
        <EmptyState
          emoji="❓"
          title="找不到回访记录"
          desc="可能已经被删除了"
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <View className={styles.dirRow}>
          <View className={classnames(styles.dirTag, styles[record.direction])}>
            {record.direction === 'sent' ? '📤 我发出的回访' : '📥 我收到的回访'}
          </View>
          <Text className={styles.time}>{formatTime(record.createdAt)}</Text>
        </View>
      </View>

      <View className={styles.timeline}>
        <View className={styles.connector} />

        <View className={styles.step}>
          <View className={styles.stepDot}>❓</View>
          <View className={styles.stepBody}>
            <View className={styles.stepTitle}>Step 1 · 烦恼发布</View>
            <View className={styles.card}>
              <View className={styles.cardHeader}>
                <Text className={styles.theme}>📌 {record.troubleTheme}</Text>
              </View>
              <Text className={styles.troubleContent}>{record.troubleContent}</Text>
            </View>
          </View>
        </View>

        <View className={styles.step}>
          <View className={styles.stepDot}>💬</View>
          <View className={styles.stepBody}>
            <View className={styles.stepTitle}>Step 2 · 收到的回复</View>
            <View className={styles.card}>
              <View className={styles.respHeader}>
                <Image
                  className={styles.avatar}
                  src={record.responderAvatar || trouble?.userAvatar || 'https://placehold.co/80x80/7C9EFF/FFFFFF?text=?'}
                  mode="aspectFill"
                />
                <Text className={styles.responderName}>{record.responderName}</Text>
              </View>
              {response ? (
                <View className={styles.responseWrap}>
                  <ResponseCard
                    response={response}
                    troubleId={record.troubleId}
                    showRateAction={false}
                    showFollowUp={false}
                    showMoreActions={false}
                    onBlock={() =>
                      showModal('确认屏蔽', '屏蔽后将不再看到该用户的内容').then(
                        (confirm) => confirm && blockUser(response.userId)
                      )
                    }
                    onReport={handleReport}
                    onRate={() => {}}
                    onMarkUseful={() => {}}
                    onFollowUp={() => {}}
                  />
                </View>
              ) : (
                <Text className={styles.responseContent}>{record.responseContent}</Text>
              )}
            </View>
          </View>
        </View>

        <View className={styles.step}>
          <View className={styles.stepDot}>💝</View>
          <View className={styles.stepBody}>
            <View className={styles.stepTitle}>
              Step 3 · {record.direction === 'sent' ? '我的回访' : '回访内容'}
            </View>
            <View className={classnames(styles.card, styles.followUpCard)}>
              <View className={styles.moodRow}>
                <Text className={styles.moodLabel}>当时心情：</Text>
                <Text className={styles.mood}>{record.mood}</Text>
              </View>
              <Text className={styles.followUpContent}>{record.content}</Text>
            </View>
          </View>
        </View>
      </View>

      <View className={styles.bottomBar}>
        <View
          className={styles.secondaryBtn}
          onClick={() => Taro.navigateBack()}
        >
          ← 返回列表
        </View>
        <View
          className={styles.primaryBtn}
          onClick={handleGoTrouble}
        >
          查看原烦恼 →
        </View>
      </View>
    </ScrollView>
  );
};

export default FollowUpDetailPage;
