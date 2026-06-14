import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, Image, Textarea, Button, ScrollView } from '@tarojs/components';
import Taro, { useRouter } from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import type { ToneType, Trouble } from '@/types';
import { showToast, showModal } from '@/utils';

const tones: { type: ToneType; emoji: string; name: string; desc: string }[] = [
  { type: 'warm', emoji: '☕', name: '温暖治愈', desc: '温柔细腻，抚慰人心' },
  { type: 'rational', emoji: '📊', name: '理性分析', desc: '客观分析，给出建议' },
  { type: 'encouraging', emoji: '🔥', name: '鼓励打气', desc: '积极向上，充满力量' },
  { type: 'empathetic', emoji: '🤗', name: '共情倾听', desc: '设身处地，深度共鸣' },
];

const segmentTemplates = [
  { label: '表达理解', emoji: '💝', placeholder: '我特别能理解你的感受，因为...' },
  { label: '分享经历', emoji: '💬', placeholder: '我以前也遇到过类似的情况...' },
  { label: '给出建议', emoji: '💡', placeholder: '或许你可以试试这样做...' },
  { label: '鼓励支持', emoji: '💪', placeholder: '相信你一定可以...' },
];

const ResponseEditorPage: React.FC = () => {
  const router = useRouter();
  const troubleId = router.params.troubleId;
  const draftId = router.params.draftId;

  const { troubles, myTroubles, user, drafts, saveDraft, deleteDraft, addResponse } = useApp();

  const trouble = useMemo<Trouble | undefined>(() => {
    const all = [...troubles, ...myTroubles];
    return all.find((t) => t.id === troubleId);
  }, [troubleId, troubles, myTroubles]);

  const draft = useMemo(() => drafts.find((d) => d.id === draftId), [draftId, drafts]);

  const [tone, setTone] = useState<ToneType>(draft?.tone || 'warm');
  const [mode, setMode] = useState<'segment' | 'full'>('segment');
  const [segments, setSegments] = useState<string[]>(['', '', '', '']);
  const [fullText, setFullText] = useState('');
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    if (draft?.content) {
      setFullText(draft.content);
      const seg = draft.content.split(/\n\n+/);
      if (seg.length >= 2) {
        setMode('segment');
        setSegments(seg.slice(0, 4).concat(Array(Math.max(0, 4 - seg.length)).fill('')));
      } else {
        setMode('full');
      }
    }
  }, [draft]);

  const combinedText = useMemo(() => {
    if (mode === 'segment') {
      return segments
        .map((s, i) => {
          const tpl = segmentTemplates[i];
          if (!s.trim()) return '';
          return tpl ? `【${tpl.label}】\n${s.trim()}` : s.trim();
        })
        .filter((s) => s)
        .join('\n\n');
    }
    return fullText.trim();
  }, [mode, segments, fullText]);

  const finalContent = combinedText;
  const wordCount = finalText.length;

  const checkList = useMemo(() => {
    return [
      {
        title: '字数是否达标',
        desc: trouble?.expectedLength === 'short'
          ? '对方希望简短回应（100字内）'
          : trouble?.expectedLength === 'long'
          ? '对方希望详细回应（300字以上）'
          : '适中长度（100-300字）',
        check: () => {
          if (!trouble) return 'none';
          if (trouble.expectedLength === 'short')
            return wordCount > 0 && wordCount <= 120 ? 'pass' : wordCount > 120 ? 'warn' : 'none';
          if (trouble.expectedLength === 'long')
            return wordCount >= 280 ? 'pass' : wordCount > 0 ? 'warn' : 'none';
          return wordCount >= 100 ? 'pass' : wordCount > 0 ? 'warn' : 'none';
        },
      },
      {
        title: '包含理解/共情',
        desc: '先表达理解，更容易让对方接受',
        check: () => {
          const keywords = ['理解', '明白', '懂', '感受', '经历', '同感'];
          const has = keywords.some((k) => finalText.includes(k));
          return has ? 'pass' : wordCount > 50 ? 'warn' : 'none';
        },
      },
      {
        title: '避免评判性语言',
        desc: '不要用"你应该""你错了"等词语',
        check: () => {
          const badWords = ['你应该', '你错', '你不对', '必须', '活该'];
          const has = badWords.some((w) => finalText.includes(w));
          return has ? 'warn' : wordCount > 0 ? 'pass' : 'none';
        },
      },
      {
        title: trouble?.needSolution ? '包含具体建议' : '真诚表达即可',
        desc: trouble?.needSolution ? '对方希望获得可操作的建议' : '不用硬给建议，真诚就好',
        check: () => {
          if (!trouble?.needSolution) return wordCount > 0 ? 'pass' : 'none';
          const keywords = ['建议', '试试', '可以', '方法', '先', '然后'];
          const has = keywords.some((k) => finalText.includes(k));
          return has ? 'pass' : wordCount > 50 ? 'warn' : 'none';
        },
      },
    ];
  }, [trouble, wordCount, finalText]);

  const allPass = useMemo(
    () => checkList.every((c) => c.check() !== 'warn'),
    [checkList]
  );

  const canSubmit = wordCount >= 20;

  const handleSaveDraft = () => {
    if (!finalText) {
      showToast('内容不能为空');
      return;
    }
    saveDraft({
      id: draftId,
      troubleId,
      content: finalText,
      tone,
    });
  };

  const handleSelfCheck = () => {
    setShowCheck(true);
    const passCount = checkList.filter((c) => c.check() === 'pass').length;
    const warnCount = checkList.filter((c) => c.check() === 'warn').length;
    Taro.showModal({
      title: '自检结果',
      content: `通过 ${passCount}/${checkList.length} 项${
        warnCount > 0 ? `，有 ${warnCount} 项建议优化` : ''
      }`,
      confirmText: warnCount > 0 ? '继续修改' : '确认发送',
      cancelText: '关闭',
      success: (res) => {
        if (res.confirm && warnCount === 0) {
          handleSubmit();
        }
      },
    });
  };

  const handleSubmit = () => {
    if (!canSubmit) {
      showToast('回应内容至少20个字哦');
      return;
    }
    if (!trouble) return;

    showModal(
      '确认发送',
      `你的回应将发送给「${trouble.userName}」，确认发送吗？`
    ).then((confirm) => {
      if (!confirm) return;

      addResponse(trouble.id, {
        troubleId: trouble.id,
        userId: user.id,
        userName: user.nickname,
        userAvatar: user.avatar,
        content: finalText,
        tone,
        isVoice: false,
      });

      if (draftId) deleteDraft(draftId);

      setTimeout(() => {
        Taro.navigateBack();
      }, 600);
    });
  };

  if (!trouble) {
    return (
      <View className={styles.editorPage}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <ScrollView scrollY className={styles.editorPage}>
      <View className={styles.troublePreview}>
        <View className={styles.header}>
          <Image
            className={styles.avatar}
            src={trouble.userAvatar}
            mode="aspectFill"
          />
          <Text className={styles.name}>{trouble.userName}</Text>
          <View className={styles.theme}>{trouble.theme}</View>
        </View>
        <Text className={styles.content}>{trouble.content}</Text>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          🎭 选择语气风格
          <Text className={styles.hint}>不同语气适合不同场景</Text>
        </Text>
        <View className={styles.toneList}>
          {tones.map((t) => (
            <View
              key={t.type}
              className={classnames(styles.toneItem, tone === t.type && styles.active)}
              onClick={() => setTone(t.type)}
            >
              <View className={styles.header}>
                <Text className={styles.emoji}>{t.emoji}</Text>
                <Text className={styles.name}>{t.name}</Text>
              </View>
              <Text className={styles.desc}>{t.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>✍️ 编辑回应</Text>

        <View className={styles.modeSwitch}>
          <View
            className={classnames(styles.modeItem, mode === 'segment' && styles.active)}
            onClick={() => setMode('segment')}
          >
            📋 分段引导
          </View>
          <View
            className={classnames(styles.modeItem, mode === 'full' && styles.active)}
            onClick={() => setMode('full')}
          >
            ✏️ 自由编辑
          </View>
        </View>

        <View className={styles.editorArea}>
          {mode === 'segment' ? (
            <>
              <View className={styles.tipsBox}>
                {segmentTemplates.map((tpl, i) => (
                  <View key={i} className={styles.tipItem}>
                    <View className={styles.num}>{i + 1}</View>
                    <Text className={styles.text}>
                      <Text style={{ fontWeight: 600 }}>{tpl.label}：</Text>
                      {tpl.placeholder}
                    </Text>
                  </View>
                ))}
              </View>
              <View className={styles.segments}>
                {segmentTemplates.map((tpl, i) => (
                  <View key={i} className={styles.segment}>
                    <View className={styles.segLabel}>
                      <Text className={styles.emoji}>{tpl.emoji}</Text>
                      {tpl.label}
                      <Text style={{ color: '#9CA3AF', fontWeight: 400 }}>（可留空）</Text>
                    </View>
                    <Textarea
                      className={styles.segInput}
                      placeholder={tpl.placeholder}
                      value={segments[i]}
                      onInput={(e) => {
                        const next = [...segments];
                        next[i] = e.detail.value;
                        setSegments(next);
                      }}
                      maxlength={500}
                      autoHeight
                      placeholderStyle="color: #C9CDD4"
                    />
                  </View>
                ))}
              </View>
            </>
          ) : (
            <View className={styles.fullEditor}>
              <Text className={styles.label}>自由表达你的想法：</Text>
              <Textarea
                className={styles.textarea}
                placeholder="真诚地写下你的回应..."
                value={fullText}
                onInput={(e) => setFullText(e.detail.value)}
                maxlength={2000}
                autoHeight
                placeholderStyle="color: #C9CDD4"
              />
              <View className={styles.charCount}>{wordCount}/2000</View>
            </View>
          )}
        </View>
      </View>

      {showCheck && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>
            🔍 发送前自检
            <Text className={styles.hint}>{allPass ? '全部通过 ✅' : '建议优化'}</Text>
          </Text>
          <View className={styles.checkList}>
            {checkList.map((item, i) => {
              const status = item.check();
              return (
                <View key={i} className={styles.checkItem}>
                  <View
                    className={classnames(
                      styles.checkbox,
                      status === 'pass' && styles.pass,
                      status === 'warn' && styles.warn
                    )}
                  >
                    {status === 'pass' && (
                      <Text style={{ color: '#fff', fontSize: 22 }}>✓</Text>
                    )}
                    {status === 'warn' && (
                      <Text style={{ color: '#fff', fontSize: 22 }}>!</Text>
                    )}
                  </View>
                  <View className={styles.content}>
                    <Text className={styles.title}>{item.title}</Text>
                    <Text className={styles.desc}>{item.desc}</Text>
                  </View>
                  <Text
                    className={classnames(
                      styles.status,
                      status === 'pass' && styles.pass,
                      status === 'warn' && styles.warn,
                      status === 'none' && styles.none
                    )}
                  >
                    {status === 'pass' ? '通过' : status === 'warn' ? '需优化' : '待填写'}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      <View style={{ height: 200 }} />

      <View className={styles.bottomBar}>
        <Button className={classnames(styles.btn, styles.ghost)} onClick={handleSaveDraft}>
          存草稿
        </Button>
        <Button
          className={classnames(styles.btn, styles.secondary)}
          onClick={handleSelfCheck}
        >
          🔍 自检
        </Button>
        <Button
          className={classnames(styles.btn, styles.primary)}
          disabled={!canSubmit}
          onClick={handleSubmit}
        >
          发送回应
        </Button>
      </View>
    </ScrollView>
  );
};

export default ResponseEditorPage;
