import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import EmptyState from '@/components/EmptyState';
import { formatTime } from '@/utils';

type TabType = 'sent' | 'received';

const FollowUpRecordsPage: React.FC = () => {
  const router = useRouter();
  const { followUpRecords } = useApp();
  const [tab, setTab] = useState<TabType>('sent');

  const recordId = useMemo(
    () => router.params.recordId || undefined,
    [router.params.recordId]
  );

  const filtered = useMemo(() => {
    let list = followUpRecords.filter((r) => r.direction === tab);
    if (recordId) {
      list = list.filter((r) => r.id === recordId);
    }
    return list;
  }, [followUpRecords, tab, recordId]);

  const handleGoDetail = (id: string) => {
    Taro.navigateTo({ url: `/pages/follow-up-detail/index?recordId=${id}` });
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>🔄 回访记录</Text>
        <Text className={styles.count}>{followUpRecords.length} 条记录</Text>
      </View>

      <View className={styles.tabs}>
        <View
          className={classnames(styles.tab, tab === 'sent' && styles.active)}
          onClick={() => setTab('sent')}
        >
          发出的回访 ({followUpRecords.filter((r) => r.direction === 'sent').length})
        </View>
        <View
          className={classnames(styles.tab, tab === 'received' && styles.active)}
          onClick={() => setTab('received')}
        >
          收到的回访 ({followUpRecords.filter((r) => r.direction === 'received').length})
        </View>
      </View>

      {filtered.length === 0 ? (
        <EmptyState
          emoji="🔄"
          title={tab === 'sent' ? '暂无发出的回访' : '暂无收到的回访'}
          desc="回访记录会在这里显示"
        />
      ) : (
        <View className={styles.list}>
          {filtered.map((record) => (
            <View
              key={record.id}
              className={styles.recordCard}
              onClick={() => handleGoDetail(record.id)}
            >
              <View className={styles.cardHeader}>
                <View className={classnames(styles.dirTag, styles[record.direction])}>
                  {record.direction === 'sent' ? '📤 发出' : '📥 收到'}
                </View>
                <Text className={styles.time}>{formatTime(record.createdAt)}</Text>
              </View>

              <View className={styles.troubleInfo}>
                <Text className={styles.theme}>📌 {record.troubleTheme}</Text>
                <Text className={styles.troubleContent}>
                  {record.troubleContent.slice(0, 60)}...
                </Text>
              </View>

              <View className={styles.responseInfo}>
                <Text className={styles.responder}>
                  回复者：{record.responderName}
                </Text>
              </View>

              <View className={styles.responsePreview}>
                <Text className={styles.previewLabel}>对方回复：</Text>
                <Text className={styles.previewContent}>
                  {record.responseContent}
                </Text>
              </View>

              <View className={styles.followUpContent}>
                <Text className={styles.label}>回访内容：</Text>
                <Text className={styles.content}>{record.content}</Text>
                <Text className={styles.mood}>心情：{record.mood}</Text>
              </View>

              <View className={styles.cardFooter}>
                <Text className={styles.link}>查看详情 →</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
};

export default FollowUpRecordsPage;
