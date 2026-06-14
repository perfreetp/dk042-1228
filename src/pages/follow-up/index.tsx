import React, { useMemo, useState } from 'react';
import { View, Text, Image, ScrollView, Textarea, Button } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import EmptyState from '@/components/EmptyState';
import { showToast, getToneLabel, formatTime } from '@/utils';
import type { MoodType, Response, Trouble } from '@/types';

const moodOptions: { value: MoodType; emoji: string; label: string }[] = [
  { value: 'happy', emoji: '😊', label: '好多了' },
  { value: 'calm', emoji: '😌', label: '平静了' },
  { value: 'anxious', emoji: '😔', label: '还是焦虑' },
  { value: 'sad', emoji: '😢', label: '仍然低落' },
];

const quickPhrases = [
  '谢谢你的建议，我试了真的有用！',
  '按照你说的做了，感觉好多了',
  '我还在努力中，感谢你的陪伴',
  '虽然还没解决，但你的话给了我力量',
  '我迈出了第一步，想告诉你',
  '最近有了一些进展',
];

const FollowUpPage: React.FC = () => {
  const router = useRouter();
  const responseId = router.params.responseId;
  const troubleId = router.params.troubleId;

  const { troubles, myTroubles, markFollowUp } = useApp();

  const { trouble, response } = useMemo(() => {
    const allTroubles: Trouble[] = [...myTroubles, ...troubles];
    const t = allTroubles.find((x) => x.id === troubleId);
    const r = t?.responses.find((x) => x.id === responseId);
    return { trouble: t, response: r };
  }, [troubleId, responseId, troubles, myTroubles]);

  const [selectedMood, setSelectedMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState('');
  const maxLength = 500;

  if (!trouble || !response) {
    return (
      <View className={styles.page}>
        <EmptyState emoji="❓" title="找不到内容" desc="可能已经被解决或删除了" />
      </View>
    );
  }

  const isFollowedUp = trouble.isFollowedUp || response.hasFollowUp;

  const handlePhraseClick = (phrase: string) => {
    const newContent = content ? `${content}\n${phrase}` : phrase;
    if (newContent.length <= maxLength) {
      setContent(newContent);
    }
  };

  const handleSend = () => {
    if (isFollowedUp) {
      showToast('你已经回访过啦');
      return;
    }

    if (!selectedMood) {
      showToast('请选择现在的心情');
      return;
    }

    if (!content.trim()) {
      showToast('请说点什么吧');
      return;
    }

    markFollowUp(troubleId, responseId, content.trim(), selectedMood || 'calm');
    setTimeout(() => {
      Taro.navigateBack();
    }, 1200);
  };

  const handleCancel = () => {
    Taro.navigateBack();
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.headerBanner}>
        <Text className={styles.emoji}>💌</Text>
        <Text className={styles.title}>来做一次回访吧</Text>
        <Text className={styles.desc}>
          Ta当时用心回应了你的烦恼，
          {'\n'}
          现在告诉Ta你的近况吧——
          {'\n'}
          你的反馈，对Ta来说是最好的鼓励。
        </Text>
      </View>

      <View className={styles.originalCard}>
        <View className={styles.header}>
          <Image
            className={styles.avatar}
            src={response.userAvatar}
            mode="aspectFill"
          />
          <View className={styles.info}>
            <Text className={styles.name}>{response.userName}</Text>
            <Text className={styles.time}>{formatTime(response.createdAt)} 回应了你</Text>
          </View>
          <View className={styles.tone}>{getToneLabel(response.tone)}</View>
        </View>
        <Text className={styles.label}>当时Ta这样说：</Text>
        <Text className={styles.content}>{response.content}</Text>
      </View>

      <View className={styles.moodSection}>
        <Text className={styles.title}>1. 你现在的心情怎么样？</Text>
        <View className={styles.moodGrid}>
          {moodOptions.map((opt) => (
            <View
              key={opt.value}
              className={classnames(
                styles.moodItem,
                selectedMood === opt.value && styles.selected
              )}
              onClick={() => setSelectedMood(opt.value)}
            >
              <Text className={styles.emoji}>{opt.emoji}</Text>
              <Text
                className={classnames(
                  styles.label,
                  selectedMood === opt.value && styles.selected
                )}
              >
                {opt.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.inputSection}>
        <Text className={styles.title}>2. 告诉Ta你的近况</Text>
        <Textarea
          className={styles.textarea}
          placeholder="说说你现在的情况吧，有没有试着按照建议去做？或者想对Ta说的话..."
          value={content}
          onInput={(e) => setContent(e.detail.value.slice(0, maxLength))}
          maxlength={maxLength}
          autoHeight
        />
        <View className={styles.counter}>
          <Text className={styles.num}>{content.length}</Text>
          <Text> / {maxLength}</Text>
        </View>

        <View className={styles.tipList}>
          <Text className={styles.tipTitle}>💡 可以这样说：</Text>
          <Text className={styles.tip}>• 你采取了哪些行动？效果怎么样？</Text>
          <Text className={styles.tip}>• 你现在的想法有什么变化？</Text>
          <Text className={styles.tip}>• 有什么新的困难或进展？</Text>
          <Text className={styles.tip}>• 想对Ta说的感谢的话</Text>
        </View>
      </View>

      <View className={styles.quickPhrases}>
        <Text className={styles.title}>✨ 快捷短语（点击添加）</Text>
        <View className={styles.phraseList}>
          {quickPhrases.map((phrase, idx) => (
            <View
              key={idx}
              className={styles.phrase}
              onClick={() => handlePhraseClick(phrase)}
            >
              {phrase}
            </View>
          ))}
        </View>
      </View>

      <View style={{ height: 40 }} />

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, styles.cancel)} onClick={handleCancel}>
          取消
        </Button>
        <Button
          className={classnames(styles.btn, styles.send)}
          onClick={handleSend}
          disabled={isFollowedUp}
        >
          {isFollowedUp ? '已回访过' : '💌 发送回访'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default FollowUpPage;
