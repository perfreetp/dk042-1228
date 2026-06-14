import React from 'react';
import { View, Text, Image, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import { showModal, formatTime } from '@/utils';

interface MenuItem {
  icon: string;
  text: string;
  value?: string;
  hasArrow?: boolean;
  onClick?: () => void;
  isSwitch?: boolean;
  switchOn?: boolean;
  onSwitch?: () => void;
  dangerType?: 'block' | 'report';
}

const MinePage: React.FC = () => {
  const {
    user,
    drafts,
    growthData,
    togglePauseMatch,
    deleteDraft,
    blockUser,
  } = useApp();

  const goRules = () => Taro.navigateTo({ url: '/pages/rules/index' });
  const goDrafts = () => {
    Taro.navigateTo({ url: '/pages/drafts/index' });
  };
  const goBlocked = () => {
    Taro.showToast({ title: '屏蔽列表功能开发中', icon: 'none' });
  };
  const handleReport = () => {
    Taro.showActionSheet({
      itemList: ['举报违规内容', '举报用户', '意见反馈'],
      success: (res) => {
        Taro.showToast({ title: '已收到，感谢反馈', icon: 'success' });
      },
    });
  };
  const handleAbout = () => {
    Taro.showModal({
      title: '关于烦恼交换',
      content: '烦恼交换 v1.0.0\n\n一个温暖的互助社区\n把烦恼拆成可互助的小任务\n\n让善意流动起来 💝',
      showCancel: false,
    });
  };
  const handleEditDraft = (id: string) => {
    const draft = drafts.find((d) => d.id === id);
    if (draft) {
      Taro.navigateTo({
        url: `/pages/response-editor/index?troubleId=${draft.troubleId}&draftId=${draft.id}`,
      });
    }
  };
  const handleDeleteDraft = (id: string, title: string) => {
    showModal('确认删除', `确定要删除草稿"${title}"吗？`).then((confirm) => {
      if (confirm) deleteDraft(id);
    });
  };

  const generalMenu: MenuItem[] = [
    {
      icon: '📝',
      text: '草稿箱',
      value: `${drafts.length} 份草稿`,
      hasArrow: true,
      onClick: goDrafts,
    },
    {
      icon: '📖',
      text: '社区规则',
      hasArrow: true,
      onClick: goRules,
    },
    {
      icon: 'ℹ️',
      text: '关于我们',
      hasArrow: true,
      onClick: handleAbout,
    },
  ];

  const privacyMenu: MenuItem[] = [
    {
      icon: user.isPaused ? '🌙' : '☀️',
      text: '暂停匹配',
      isSwitch: true,
      switchOn: user.isPaused,
      onSwitch: () => {
        if (!user.isPaused) {
          showModal(
            '暂停匹配',
            '暂停后你将不会出现在匹配池中，也不会被他人抽到。确定要暂停吗？'
          ).then((confirm) => {
            if (confirm) togglePauseMatch();
          });
        } else {
          togglePauseMatch();
        }
      },
    },
    {
      icon: '🚫',
      text: '屏蔽列表',
      value: `${user.blockedUsers.length} 人`,
      hasArrow: true,
      onClick: goBlocked,
    },
  ];

  const dangerMenu: MenuItem[] = [
    {
      icon: '🚨',
      text: '举报中心',
      onClick: handleReport,
      dangerType: 'report',
    },
    {
      icon: '❌',
      text: '清空匹配记录',
      onClick: () => {
        showModal('确认清空', '这将清空你的匹配历史，此操作不可撤销').then(
          (confirm) => {
            if (confirm) {
              Taro.showToast({ title: '已清空', icon: 'success' });
            }
          }
        );
      },
      dangerType: 'block',
    },
  ];

  return (
    <ScrollView scrollY className={styles.minePage}>
      <View className={styles.header}>
        <View className={styles.profileRow}>
          <Image
            className={styles.avatar}
            src={user.avatar}
            mode="aspectFill"
          />
          <View className={styles.info}>
            <Text className={styles.nickname}>{user.nickname}</Text>
            <View className={styles.meta}>
              <Text>🧑 {user.age}岁</Text>
              <Text>•</Text>
              <Text>{user.gender === 'female' ? '女生' : user.gender === 'male' ? '男生' : '保密'}</Text>
              {user.isPaused && (
                <>
                  <Text>•</Text>
                  <Text>🌙 匹配已暂停</Text>
                </>
              )}
            </View>
          </View>
        </View>
        <View className={styles.statsGrid}>
          <View className={styles.stat}>
            <Text className={styles.value}>{growthData.helpCount}</Text>
            <Text className={styles.label}>帮助</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.value}>{growthData.thankedCount}</Text>
            <Text className={styles.label}>被感谢</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.value}>{growthData.resolveCount}</Text>
            <Text className={styles.label}>解决</Text>
          </View>
          <View className={styles.stat}>
            <Text className={styles.value}>{drafts.length}</Text>
            <Text className={styles.label}>草稿</Text>
          </View>
        </View>
      </View>

      <View className={styles.content}>
        <View className={styles.draftsPreview}>
          <View className={styles.header}>
            <Text className={styles.title}>📝 最近草稿</Text>
            <View className={styles.count} onClick={goDrafts}>
              查看全部 →
            </View>
          </View>
          {drafts.length === 0 ? (
            <View className={styles.emptyDrafts}>暂无草稿</View>
          ) : (
            drafts.slice(0, 3).map((draft) => (
              <View
                key={draft.id}
                className={styles.draftItem}
                onClick={() => handleEditDraft(draft.id)}
                onLongPress={() =>
                  handleDeleteDraft(
                    draft.id,
                    draft.content.slice(0, 20) + '...'
                  )
                }
              >
                <Text className={styles.title}>
                  {draft.content.slice(0, 40) || '空白草稿'}
                </Text>
                <Text className={styles.meta}>
                  {formatTime(draft.updatedAt)} · 已保存草稿
                </Text>
              </View>
            ))
          )}
        </View>

        <View className={styles.settingCard}>
          <View className={styles.sectionLabel}>通用</View>
          {generalMenu.map((item, idx) => (
            <View key={idx} className={styles.menuItem} onClick={item.onClick}>
              <View className={styles.icon}>{item.icon}</View>
              <Text className={styles.text}>{item.text}</Text>
              {item.value && <Text className={styles.value}>{item.value}</Text>}
              {item.hasArrow && <Text className={styles.arrow}>›</Text>}
            </View>
          ))}
        </View>

        <View className={styles.settingCard}>
          <View className={styles.sectionLabel}>隐私设置</View>
          {privacyMenu.map((item, idx) => (
            <View
              key={idx}
              className={styles.menuItem}
              onClick={item.isSwitch ? undefined : item.onClick}
            >
              <View className={styles.icon}>{item.icon}</View>
              <Text className={styles.text}>{item.text}</Text>
              {item.isSwitch ? (
                <View className={styles.switchWrap}>
                  <View
                    className={classnames(
                      styles.switch,
                      item.switchOn && styles.on
                    )}
                    onClick={item.onSwitch}
                  />
                </View>
              ) : (
                <>
                  {item.value && (
                    <Text className={styles.value}>{item.value}</Text>
                  )}
                  {item.hasArrow && <Text className={styles.arrow}>›</Text>}
                </>
              )}
            </View>
          ))}
        </View>

        <View className={styles.dangerZone}>
          {dangerMenu.map((item, idx) => (
            <View
              key={idx}
              className={classnames(
                styles.menuItem,
                item.dangerType && styles[item.dangerType]
              )}
              onClick={item.onClick}
            >
              <View className={styles.icon}>{item.icon}</View>
              <Text className={styles.text}>{item.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};

export default MinePage;
