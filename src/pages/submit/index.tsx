import React, { useState } from 'react';
import { View, Text, Textarea, Picker, Button } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import type { TroubleTheme, MoodType, ReplyLength } from '@/types';
import { showToast, showModal } from '@/utils';

const themes: TroubleTheme[] = [
  '学业', '工作', '情感', '家庭', '人际', '健康', '金钱', '其他'
];

const moods: { type: MoodType; emoji: string; label: string }[] = [
  { type: 'anxious', emoji: '😟', label: '焦虑' },
  { type: 'sad', emoji: '😢', label: '低落' },
  { type: 'calm', emoji: '😌', label: '平静' },
  { type: 'happy', emoji: '😊', label: '还好' },
];

const lengths: { type: ReplyLength; title: string; desc: string }[] = [
  { type: 'short', title: '简短', desc: '100字内' },
  { type: 'medium', title: '适中', desc: '100-300字' },
  { type: 'long', title: '详细', desc: '300字+' },
];

const deadlines = [
  { label: '12小时后', hours: 12 },
  { label: '1天后', hours: 24 },
  { label: '2天后', hours: 48 },
  { label: '3天后', hours: 72 },
  { label: '1周后', hours: 168 },
];

const SubmitPage: React.FC = () => {
  const { user, submitTrouble } = useApp();

  const [theme, setTheme] = useState<TroubleTheme | null>(null);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [content, setContent] = useState('');
  const [needSolution, setNeedSolution] = useState(true);
  const [allowVoice, setAllowVoice] = useState(false);
  const [expectedLength, setExpectedLength] = useState<ReplyLength>('medium');
  const [deadlineIdx, setDeadlineIdx] = useState(2);

  const canSubmit = theme && mood && content.trim().length >= 10;

  const handleSubmit = () => {
    if (!theme || !mood) {
      showToast('请选择主题和情绪');
      return;
    }
    if (content.trim().length < 10) {
      showToast('烦恼描述至少10个字哦');
      return;
    }

    showModal(
      '确认发送',
      '发送后将进入匹配池，确定要把这个烦恼分享出去吗？'
    ).then((confirm) => {
      if (!confirm) return;

      const deadline = new Date(
        Date.now() + deadlines[deadlineIdx].hours * 3600000
      ).toISOString();

      submitTrouble({
        userName: user.nickname,
        userAvatar: user.avatar,
        userAge: user.age,
        theme,
        content: content.trim(),
        mood,
        needSolution,
        allowVoice,
        expectedLength,
        deadline,
      });

      setTimeout(() => {
        Taro.navigateBack();
      }, 800);
    });
  };

  return (
    <View className={styles.submitPage}>
      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📌 选择主题</Text>
        <View className={styles.themeList}>
          {themes.map((t) => (
            <View
              key={t}
              className={classnames(
                styles.themeItem,
                theme === t && styles.active
              )}
              onClick={() => setTheme(t)}
            >
              {t}
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>💭 现在的心情</Text>
        <View className={styles.moodList}>
          {moods.map((m) => (
            <View
              key={m.type}
              className={classnames(
                styles.moodItem,
                mood === m.type && styles.active
              )}
              onClick={() => setMood(m.type)}
            >
              <Text className={styles.emoji}>{m.emoji}</Text>
              <Text className={styles.label}>{m.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>✍️ 说说你的烦恼</Text>
        <Textarea
          className={styles.contentInput}
          placeholder="写下你的烦恼，越具体越容易获得帮助哦..."
          value={content}
          onInput={(e) => setContent(e.detail.value)}
          maxlength={1000}
          autoHeight
          placeholderStyle="color: #9CA3AF"
        />
        <View className={styles.charCount}>{content.length}/1000</View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>⚙️ 回复偏好</Text>
        <View className={styles.optionRow}>
          <View className={styles.optionLabel}>
            <Text className={styles.title}>需要具体解决方案</Text>
            <Text className={styles.desc}>开启后回应者会更倾向于提供可操作建议</Text>
          </View>
          <View
            className={classnames(styles.switch, needSolution && styles.on)}
            onClick={() => setNeedSolution(!needSolution)}
          />
        </View>
        <View className={styles.optionRow}>
          <View className={styles.optionLabel}>
            <Text className={styles.title}>允许语音回应</Text>
            <Text className={styles.desc}>开启后他人可以用语音的方式回复你</Text>
          </View>
          <View
            className={classnames(styles.switch, allowVoice && styles.on)}
            onClick={() => setAllowVoice(!allowVoice)}
          />
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>📏 期望回复长度</Text>
        <View className={styles.lengthOptions}>
          {lengths.map((l) => (
            <View
              key={l.type}
              className={classnames(
                styles.lengthItem,
                expectedLength === l.type && styles.active
              )}
              onClick={() => setExpectedLength(l.type)}
            >
              <Text className={styles.title}>{l.title}</Text>
              <Text className={styles.desc}>{l.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>⏰ 截止时间</Text>
        <Picker
          mode="selector"
          range={deadlines.map((d) => d.label)}
          value={deadlineIdx}
          onChange={(e) => setDeadlineIdx(Number(e.detail.value))}
        >
          <View className={styles.deadlinePicker}>
            <Text className={styles.label}>匹配截止于</Text>
            <Text className={styles.value}>
              {deadlines[deadlineIdx].label} ▾
            </Text>
          </View>
        </Picker>
      </View>

      <View style={{ height: 160 }} />

      <View className={styles.bottomBar}>
        <Button
          className={styles.submitBtn}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          发送到匹配池
        </Button>
      </View>
    </View>
  );
};

export default SubmitPage;
