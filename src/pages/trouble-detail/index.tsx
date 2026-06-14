import React, { useMemo, useState } from 'react';
import { View, Text, Image, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import MoodTag from '@/components/MoodTag';
import ResponseCard from '@/components/ResponseCard';
import EmptyState from '@/components/EmptyState';
import {
  formatTime,
  formatDeadline,
  getLengthLabel,
  getStatusLabel,
  showToast,
  showModal,
} from '@/utils';

const TroubleDetailPage: React.FC = () => {
  const router = useRouter();
  const id = router.params.id;
  const isMine = router.params.mine === '1';

  const {
    troubles,
    myTroubles,
    user,
    rateResponse,
    markUseful,
    toggleActionItem,
    addActionItems,
    blockUser,
    reportContent,
  } = useApp();

  const trouble = useMemo(() => {
    const all = [...myTroubles, ...troubles];
    return all.find((t) => t.id === id);
  }, [id, troubles, myTroubles]);

  const [showAddAction, setShowAddAction] = useState(false);
  const [newActionInput, setNewActionInput] = useState('');

  if (!trouble) {
    return (
      <View className={styles.detailPage}>
        <EmptyState emoji="❓" title="找不到烦恼" desc="可能已经被解决或删除了" />
      </View>
    );
  }

  const isOwner = trouble.userId === 'me';

  const handleRespond = () => {
    Taro.navigateTo({
      url: `/pages/response-editor/index?troubleId=${trouble.id}`,
    });
  };

  const handleRate = (responseId: string, rating: number) => {
    rateResponse(trouble.id, responseId, rating);
  };

  const handleMarkUseful = (responseId: string, idx: number) => {
    markUseful(trouble.id, responseId, idx);
    showToast('已标记，感谢反馈');
  };

  const handleFollowUp = (responseId: string) => {
    Taro.navigateTo({
      url: `/pages/follow-up/index?responseId=${responseId}&troubleId=${trouble.id}`,
    });
  };

  const handleAddAction = () => {
    const items = newActionInput
      .split(/[，,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (items.length === 0) {
      showToast('请输入至少一个行动项');
      return;
    }

    addActionItems(trouble.id, items);
    setShowAddAction(false);
    setNewActionInput('');
  };

  const handleToActionList = () => {
    Taro.navigateTo({
      url: `/pages/action-list/index?troubleId=${trouble.id}`,
    });
  };

  const handleReport = (type: string, targetId: string) => {
    Taro.showActionSheet({
      itemList: ['垃圾广告', '辱骂攻击', '违法违规', '其他'],
      success: (res) => {
        const reasons = ['垃圾广告', '辱骂攻击', '违法违规', '其他'];
        reportContent(type, targetId, reasons[res.tapIndex]);
      },
    });
  };

  const actionProgress = useMemo(() => {
    if (!trouble.actionItems || trouble.actionItems.length === 0) return { done: 0, total: 0 };
    return {
      done: trouble.actionItems.filter((a) => a.done).length,
      total: trouble.actionItems.length,
    };
  }, [trouble.actionItems]);

  return (
    <ScrollView scrollY className={styles.detailPage}>
      <View className={styles.troubleCard}>
        <View className={styles.userRow}>
          <Image
            className={styles.avatar}
            src={trouble.userAvatar}
            mode="aspectFill"
          />
          <View className={styles.info}>
            <View className={styles.nameRow}>
              <Text className={styles.name}>{trouble.userName}</Text>
              <View className={styles.age}>{trouble.userAge}岁</View>
              <MoodTag mood={trouble.mood} />
            </View>
            <Text className={styles.time}>{formatTime(trouble.createdAt)}</Text>
          </View>
          <View className={styles.status}>{getStatusLabel(trouble.status)}</View>
        </View>

        <View className={styles.tags}>
          <View className={classnames(styles.tag, styles.theme)}>{trouble.theme}</View>
          {trouble.needSolution && (
            <View className={classnames(styles.tag, styles.pref)}>💡 需要方案</View>
          )}
          {trouble.allowVoice && (
            <View className={classnames(styles.tag, styles.voice)}>🎵 可语音</View>
          )}
        </View>

        <Text className={styles.content}>{trouble.content}</Text>

        <View className={styles.meta}>
          <View className={styles.item}>📏 {getLengthLabel(trouble.expectedLength)}</View>
          <View className={styles.item}>⏰ {formatDeadline(trouble.deadline)}</View>
          <View className={styles.item}>💬 {trouble.responses.length} 条回复</View>
        </View>
      </View>

      {!isOwner && (
        <View className={styles.actionBar}>
          <Button
            className={classnames(styles.actionBtn, styles.primary)}
            onClick={handleRespond}
          >
            ✍️ 写回应
          </Button>
          <Button
            className={classnames(styles.actionBtn, styles.ghost)}
            onClick={() => handleReport('trouble', trouble.id)}
          >
            🚨 举报
          </Button>
          <Button
            className={classnames(styles.actionBtn, styles.secondary)}
            onClick={() => {
              showModal('确认屏蔽', '屏蔽后将不再看到该用户的内容').then(
                (confirm) => confirm && blockUser(trouble.userId)
              );
            }}
          >
            🚫 屏蔽
          </Button>
        </View>
      )}

      {isOwner && trouble.actionItems && (
        <View className={styles.actionItems}>
          <View className={styles.header}>
            <Text className={styles.title}>✅ 我的行动清单</Text>
            <Text className={styles.progress}>
              {actionProgress.done}/{actionProgress.total}
            </Text>
          </View>
          <View className={styles.itemList}>
            {trouble.actionItems.length === 0 ? (
              <View className={styles.empty}>还没有行动项</View>
            ) : (
              trouble.actionItems.map((item) => (
                <View
                  key={item.id}
                  className={styles.item}
                  onClick={() => toggleActionItem(trouble.id, item.id)}
                >
                  <View
                    className={classnames(styles.checkbox, item.done && styles.done)}
                  >
                    {item.done && <Text style={{ color: '#fff', fontSize: 24 }}>✓</Text>}
                  </View>
                  <Text
                    className={classnames(styles.content, item.done && styles.done)}
                  >
                    {item.content}
                  </Text>
                </View>
              ))
            )}
          </View>
          <Button
            className={styles.addBtn}
            onClick={handleToActionList}
          >
            管理行动清单 →
          </Button>
        </View>
      )}

      <View className={styles.sectionHeader}>
        <Text className={styles.title}>收到的回应</Text>
        <View className={styles.count}>{trouble.responses.length} 条</View>
      </View>

      {trouble.responses.length === 0 ? (
        <EmptyState
          emoji="💭"
          title="暂时没有回应"
          desc={isOwner ? '耐心等待，总会有人看到你的烦恼' : '成为第一个回应的人吧！'}
        />
      ) : (
        trouble.responses.map((r) => (
          <ResponseCard
            key={r.id}
            response={r}
            troubleId={trouble.id}
            showRateAction={isOwner}
            showFollowUp={isOwner}
            onRate={(rating) => handleRate(r.id, rating)}
            onMarkUseful={(idx) => handleMarkUseful(r.id, idx)}
            onFollowUp={() => handleFollowUp(r.id)}
            onBlock={() =>
              showModal('确认屏蔽', '屏蔽后将不再看到该用户的内容').then(
                (confirm) => confirm && blockUser(r.userId)
              )
            }
            onReport={() => handleReport('response', r.id)}
          />
        ))
      )}

      <View style={{ height: 160 }} />

      {!isOwner && (
        <View className={styles.bottomBar}>
          <Button
            className={classnames(styles.btn, styles.ghost)}
            onClick={() => handleReport('trouble', trouble.id)}
          >
            举报
          </Button>
          <Button
            className={classnames(styles.btn, styles.primary)}
            onClick={handleRespond}
          >
            ✍️ 写回应帮助Ta
          </Button>
        </View>
      )}
    </ScrollView>
  );
};

export default TroubleDetailPage;
