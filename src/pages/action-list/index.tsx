import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, Input, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import EmptyState from '@/components/EmptyState';
import { showToast, showModal, formatTime } from '@/utils';
import type { Trouble } from '@/types';

const ActionListPage: React.FC = () => {
  const router = useRouter();
  const troubleId = router.params.troubleId;

  const { myTroubles, toggleActionItem, addActionItems, troubles } = useApp();

  const trouble = useMemo<Trouble | undefined>(() => {
    const all = [...myTroubles, ...troubles];
    return all.find((t) => t.id === troubleId);
  }, [troubleId, myTroubles, troubles]);

  const [newAction, setNewAction] = useState('');

  if (!trouble) {
    return (
      <View className={styles.page}>
        <EmptyState emoji="❓" title="找不到烦恼" desc="可能已经被解决或删除了" />
      </View>
    );
  }

  const items = trouble.actionItems || [];
  const doneCount = items.filter((i) => i.done).length;
  const totalCount = items.length;
  const percent = totalCount === 0 ? 0 : Math.round((doneCount / totalCount) * 100);
  const allDone = totalCount > 0 && doneCount === totalCount;

  const handleAdd = () => {
    const text = newAction.trim();
    if (!text) {
      showToast('请输入行动内容');
      return;
    }

    const items = text
      .split(/[，,\n]/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    if (items.length === 0) {
      showToast('请输入有效内容');
      return;
    }

    addActionItems(trouble.id, items);
    setNewAction('');
    showToast(`已添加 ${items.length} 个行动项`);
  };

  const handleToggle = (itemId: string) => {
    toggleActionItem(trouble.id, itemId);
  };

  const handleDelete = (itemId: string, e) => {
    e.stopPropagation();
    showModal('删除行动项', '确定要删除这个行动项吗？').then((confirm) => {
      if (confirm) {
        showToast('删除成功');
      }
    });
  };

  const presetActions = [
    '把大目标拆成3个小步骤',
    '今天先完成第一步',
    '写下3个可以求助的人',
    '设定一个截止时间',
    '奖励自己完成后做喜欢的事',
  ];

  const handleQuickAdd = (text: string) => {
    addActionItems(trouble.id, [text]);
    showToast('已添加行动项');
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.troubleCard}>
        <View className={styles.theme}>📌 {trouble.theme}</View>
        <Text className={styles.content}>{trouble.content}</Text>
      </View>

      {allDone && (
        <View className={styles.celebration}>
          <Text className={styles.emoji}>🎉</Text>
          <Text className={styles.title}>全部完成啦！</Text>
          <Text className={styles.desc}>
            你真棒！每一步小小的行动，都在让你变得更好。
          </Text>
        </View>
      )}

      <View className={styles.progressSection}>
        <View className={styles.header}>
          <Text className={styles.title}>完成进度</Text>
          <Text className={styles.percent}>{percent}%</Text>
        </View>
        <View className={styles.bar}>
          <View
            className={styles.fill}
            style={{ width: `${percent}%` }}
          />
        </View>
        <View className={styles.stats}>
          <View className={styles.item}>
            已完成：<Text className={styles.num}>{doneCount}</Text> 项
          </View>
          <View className={styles.item}>
            剩余：<Text className={styles.num}>{totalCount - doneCount}</Text> 项
          </View>
          <View className={styles.item}>
            共：<Text className={styles.num}>{totalCount}</Text> 项
          </View>
        </View>
      </View>

      <View className={styles.listSection}>
        <View className={styles.sectionHeader}>
          <Text className={styles.title}>📝 行动清单</Text>
          <Text className={styles.count}>{totalCount} 项</Text>
        </View>

        {totalCount === 0 ? (
          <View className={styles.emptyState}>
            <Text className={styles.emoji}>💪</Text>
            <Text className={styles.title}>还没有行动项</Text>
            <Text className={styles.desc}>
              把你的烦恼拆解成一个个可执行的小任务吧。
              {'\n'}
              每完成一步，就离解决更近一步。
            </Text>
          </View>
        ) : (
          items.map((item) => (
            <View key={item.id} className={styles.actionItem}>
              <View
                className={classnames(styles.checkbox, item.done && styles.done)}
                onClick={() => handleToggle(item.id)}
              >
                {item.done && <Text className={styles.check}>✓</Text>}
              </View>
              <View
                className={styles.contentWrap}
                onClick={() => handleToggle(item.id)}
              >
                <Text
                  className={classnames(styles.content, item.done && styles.done)}
                >
                  {item.content}
                </Text>
                <Text className={styles.time}>创建于 {formatTime(item.createdAt)}</Text>
              </View>
              <View
                className={styles.deleteBtn}
                onClick={(e) => handleDelete(item.id, e)}
              >
                🗑️
              </View>
            </View>
          ))
        )}

        {totalCount === 0 && (
          <View style={{ marginTop: 32 }}>
            <View className={styles.sectionHeader}>
              <Text className={styles.title}>💡 快速添加建议</Text>
            </View>
            <View style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 8 }}>
              {presetActions.map((action, idx) => (
                <View
                  key={idx}
                  style={{
                    padding: '16rpx 28rpx',
                    background: 'rgba(245, 158, 11, 0.1)',
                    borderRadius: 32,
                    fontSize: 26,
                    color: '#F59E0B',
                  }}
                  onClick={() => handleQuickAdd(action)}
                >
                  + {action}
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      <View style={{ height: 200 }} />

      <View className={styles.addSection}>
        <View className={styles.inputRow}>
          <Input
            className={styles.input}
            placeholder="输入一个可以立刻做的小行动..."
            value={newAction}
            onInput={(e) => setNewAction(e.detail.value)}
            confirmType="send"
            onConfirm={handleAdd}
          />
          <View className={styles.addBtn} onClick={handleAdd}>
            +
          </View>
        </View>
        <Text className={styles.tip}>用逗号或换行分隔，可一次添加多个行动项</Text>
      </View>
    </ScrollView>
  );
};

export default ActionListPage;
