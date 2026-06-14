import React, { useState, useMemo, useEffect, useRef } from 'react';
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
  const draftIdFromUrl = router.params.draftId;

  const {
    troubles,
    myTroubles,
    user,
    drafts,
    saveDraft,
    deleteDraft,
    addResponse,
    getDraftByTroubleId,
  } = useApp();

  const trouble = useMemo<Trouble | undefined>(() => {
    const all = [...troubles, ...myTroubles];
    return all.find((t) => t.id === troubleId);
  }, [troubleId, troubles, myTroubles]);

  const existingDraft = useMemo(() => {
    if (draftIdFromUrl) {
      return drafts.find((d) => d.id === draftIdFromUrl);
    }
    return getDraftByTroubleId(troubleId || '');
  }, [draftIdFromUrl, troubleId, drafts, getDraftByTroubleId]);

  const [tone, setTone] = useState<ToneType>('warm');
  const [mode, setMode] = useState<'segment' | 'full'>('segment');
  const [segments, setSegments] = useState<string[]>(['', '', '', '']);
  const [fullText, setFullText] = useState('');
  const [showCheck, setShowCheck] = useState(false);
  const [isVoice, setIsVoice] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceUrl, setVoiceUrl] = useState<string | null>(null);
  const recordingTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const playTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    if (!existingDraft) return;

    setTone(existingDraft.tone);

    if (existingDraft.mode === 'segment' && existingDraft.segments) {
      setSegments(existingDraft.segments);
      setMode('segment');
    } else if (existingDraft.mode === 'full' || !existingDraft.mode) {
      if (existingDraft.content.includes('【表达理解】') && existingDraft.mode !== 'full') {
        const extracted: string[] = [];
        segmentTemplates.forEach((tpl) => {
          const regex = new RegExp(`【${tpl.label}】[\\s\\S]*?\\n([\\s\\S]*?)(?=\\n\\n【|$)`);
          const match = existingDraft.content.match(regex);
          extracted.push(match ? match[1].trim() : '');
        });
        if (extracted.some((s) => s.length > 0)) {
          setSegments(extracted);
          setMode('segment');
        } else {
          setFullText(existingDraft.content);
          setMode('full');
        }
      } else {
        setFullText(existingDraft.content);
        setMode('full');
      }
    }

    setShowCheck(false);
    initialized.current = true;
  }, [existingDraft]);

  const combinedText = useMemo(() => {
    if (mode === 'segment') {
      return segments
        .map((s, i) => {
          const tpl = segmentTemplates[i];
          if (!s.trim()) return '';
          return `【${tpl.label}】\n${s.trim()}`;
        })
        .filter((s) => s)
        .join('\n\n');
    }
    return fullText.trim();
  }, [mode, segments, fullText]);

  const finalText = combinedText;

  const segmentWordCount = useMemo(
    () => segments.reduce((sum, s) => sum + s.length, 0),
    [segments]
  );

  const pureWordCount = mode === 'segment' ? segmentWordCount : fullText.trim().length;
  const displayWordCount = pureWordCount;

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
          if (isVoice) return 'pass';
          const wc = pureWordCount;
          if (trouble.expectedLength === 'short')
            return wc > 0 && wc <= 120 ? 'pass' : wc > 120 ? 'warn' : 'none';
          if (trouble.expectedLength === 'long')
            return wc >= 280 ? 'pass' : wc > 0 ? 'warn' : 'none';
          return wc >= 100 ? 'pass' : wc > 0 ? 'warn' : 'none';
        },
      },
      {
        title: '包含理解/共情',
        desc: '先表达理解，更容易让对方接受',
        check: () => {
          if (isVoice) return 'pass';
          const keywords = ['理解', '明白', '懂', '感受', '经历', '同感', '我也'];
          const has = keywords.some((k) => finalText.includes(k));
          return has ? 'pass' : pureWordCount > 50 ? 'warn' : 'none';
        },
      },
      {
        title: '避免评判性语言',
        desc: '不要用"你应该""你错了"等词语',
        check: () => {
          if (isVoice) return 'none';
          const badWords = ['你应该', '你错', '你不对', '必须', '活该', '你怎么'];
          const has = badWords.some((w) => finalText.includes(w));
          return has ? 'warn' : pureWordCount > 0 ? 'pass' : 'none';
        },
      },
      {
        title: trouble?.needSolution ? '包含具体建议' : '真诚表达即可',
        desc: trouble?.needSolution ? '对方希望获得可操作的建议' : '不用硬给建议，真诚就好',
        check: () => {
          if (isVoice) return 'pass';
          if (!trouble?.needSolution) return pureWordCount > 0 ? 'pass' : 'none';
          const keywords = ['建议', '试试', '可以', '方法', '先', '然后', '不如'];
          const has = keywords.some((k) => finalText.includes(k));
          return has ? 'pass' : pureWordCount > 50 ? 'warn' : 'none';
        },
      },
    ];
  }, [trouble, pureWordCount, finalText, isVoice]);

  const allPass = useMemo(
    () => checkList.every((c) => c.check() !== 'warn'),
    [checkList]
  );

  const canSubmit = (isVoice && voiceDuration >= 2) || (!isVoice && pureWordCount >= 20);

  const handleSaveDraft = () => {
    if (!finalText && !isVoice) {
      showToast('内容不能为空');
      return;
    }
    const draftId = existingDraft?.id;
    saveDraft({
      id: draftId,
      troubleId,
      content: finalText,
      tone,
      mode,
      segments: mode === 'segment' ? segments : undefined,
    });
  };

  const handleSelfCheck = () => {
    setShowCheck(true);
    const passCount = checkList.filter((c) => c.check() === 'pass').length;
    const warnCount = checkList.filter((c) => c.check() === 'warn').length;
    Taro.showModal({
      title: '🔍 自检结果',
      content: `通过 ${passCount}/${checkList.length} 项${
        warnCount > 0 ? `，有 ${warnCount} 项建议优化` : ''
      }

${warnCount > 0 ? '建议优化后再发送，效果会更好哦～' : '全部通过，可以发送啦！'}`,
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
      showToast(isVoice ? '语音至少需要2秒' : '回应内容至少20个字哦');
      return;
    }
    if (!trouble) return;

    showModal(
      '确认发送',
      `你的${isVoice ? '语音' : '文字'}回应将发送给「${trouble.userName}」，确认发送吗？`
    ).then((confirm) => {
      if (!confirm) return;

      addResponse(trouble.id, {
        troubleId: trouble.id,
        userId: user.id,
        userName: user.nickname,
        userAvatar: user.avatar,
        content: finalText || '[语音消息]',
        tone,
        isVoice,
        voiceUrl: isVoice ? (voiceUrl || 'mock_voice.mp3') : undefined,
        voiceDuration: isVoice ? voiceDuration : undefined,
      });

      if (existingDraft?.id) {
        deleteDraft(existingDraft.id);
      }

      setTimeout(() => {
        Taro.navigateBack();
      }, 800);
    });
  };

  const handleStartRecord = () => {
    setIsRecording(true);
    setIsVoice(true);
    setVoiceDuration(0);
    recordingTimer.current = setInterval(() => {
      setVoiceDuration((d) => d + 1);
    }, 1000);

    audioChunksRef.current = [];

    if (!navigator.mediaDevices) {
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true })
      .then((stream) => {
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          stream.getTracks().forEach((track) => track.stop());
          const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          setVoiceUrl(url);
        };

        mediaRecorder.start();
      })
      .catch(() => {
        // Fallback: mock behavior continues with UI timer
      });
  };

  const handleStopRecord = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      const stream = mediaRecorderRef.current.stream;
      mediaRecorderRef.current.stop();
      stream?.getTracks().forEach((track) => track.stop());
      mediaRecorderRef.current = null;
    }

    setIsRecording(false);
    if (recordingTimer.current) {
      clearInterval(recordingTimer.current);
      recordingTimer.current = null;
    }
  };

  const handleDeleteVoice = () => {
    if (voiceUrl) {
      URL.revokeObjectURL(voiceUrl);
    }
    setVoiceUrl(null);
    setIsVoice(false);
    setVoiceDuration(0);
    setIsPlaying(false);
    if (playTimer.current) {
      clearTimeout(playTimer.current);
      playTimer.current = null;
    }
  };

  const handlePlayVoice = () => {
    if (isPlaying) return;
    if (voiceUrl) {
      const audio = new Audio(voiceUrl);
      audio.onended = () => {
        setIsPlaying(false);
      };
      setIsPlaying(true);
      audio.play().catch(() => {
        setIsPlaying(false);
      });
      return;
    }
    setIsPlaying(true);
    playTimer.current = setTimeout(() => {
      setIsPlaying(false);
      playTimer.current = null;
    }, voiceDuration * 1000);
  };

  const handleReRecord = () => {
    handleDeleteVoice();
    handleStartRecord();
  };

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!trouble) {
    return (
      <View className={styles.editorPage}>
        <Text>加载中...</Text>
      </View>
    );
  }

  const allowVoice = trouble.allowVoice;

  return (
    <ScrollView scrollY className={styles.editorPage}>
      <View className={styles.troublePreview}>
        <View className={styles.header}>
          <Image
            className={styles.avatar}
            src={trouble.userAvatar}
            mode="aspectFill"
          />
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text className={styles.name}>{trouble.userName}</Text>
            <Text className={styles.time}>{trouble.userAge}岁 · {trouble.theme}</Text>
          </View>
          {allowVoice && (
            <View className={styles.voiceTag}>🎵 可语音</View>
          )}
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

      {allowVoice && (
        <View className={styles.section}>
          <Text className={styles.sectionTitle}>🎤 语音回应</Text>
          <View className={styles.voiceSection}>
            {!isVoice ? (
              <View
                className={classnames(styles.voiceBtn, styles.voiceStart)}
                onClick={handleStartRecord}
              >
                <Text className={styles.voiceIcon}>🎙️</Text>
                <Text className={styles.voiceText}>点击开始录音</Text>
                <Text className={styles.voiceHint}>用声音传递温度，最长60秒</Text>
              </View>
            ) : (
              <View className={styles.voicePlayer}>
                <View className={styles.waveform}>
                  {[...Array(20)].map((_, i) => (
                    <View
                      key={i}
                      className={classnames(
                        styles.waveBar,
                        isRecording && styles.animating
                      )}
                      style={{
                        height: isRecording
                          ? `${20 + Math.random() * 60}rpx`
                          : `${20 + (i % 5) * 12}rpx`,
                        animationDelay: `${i * 0.1}s`,
                      }}
                    />
                  ))}
                </View>
                <View className={styles.voiceInfo}>
                  <Text className={styles.duration}>
                    {isRecording ? '录音中... ' : ''}
                    {formatDuration(voiceDuration)}
                  </Text>
                  {!isRecording && (
                    <View className={styles.voiceActions}>
                      <View className={styles.playBtn} onClick={handlePlayVoice}>{isPlaying ? '⏸️ 播放中' : '▶️ 播放'}</View>
                      <View className={styles.reRecordBtn} onClick={handleReRecord}>
                        重录
                      </View>
                      <View className={styles.deleteBtn} onClick={handleDeleteVoice}>
                        删除
                      </View>
                    </View>
                  )}
                </View>
                {isRecording && (
                  <View
                    className={styles.stopBtn}
                    onClick={handleStopRecord}
                  >
                    ⏹️ 停止
                  </View>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      <View className={styles.section}>
        <Text className={styles.sectionTitle}>
          ✍️ 编辑回应
          <Text className={styles.hint}>
            已输入 <Text style={{ color: '#7C9EFF', fontWeight: 600 }}>
              {displayWordCount}
            </Text> 字
          </Text>
        </Text>

        {allowVoice && (
          <View className={styles.modeSwitch}>
            <View
              className={classnames(styles.modeItem, !isVoice && mode === 'segment' && styles.active)}
              onClick={() => { setMode('segment'); setIsVoice(false); }}
            >
              📋 分段引导
            </View>
            <View
              className={classnames(styles.modeItem, !isVoice && mode === 'full' && styles.active)}
              onClick={() => { setMode('full'); setIsVoice(false); }}
            >
              ✏️ 自由编辑
            </View>
            {allowVoice && (
              <View
                className={classnames(styles.modeItem, isVoice && styles.active)}
                onClick={() => setIsVoice(true)}
              >
                🎤 语音
              </View>
            )}
          </View>
        )}

        {!allowVoice && (
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
        )}

        {!isVoice && (
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
                        <Text style={{ color: '#9CA3AF', fontWeight: 400, fontSize: 22 }}>
                          （可留空 · {segments[i].length}字）
                        </Text>
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
                <View className={styles.charCount}>
                  正文 {segmentWordCount} 字
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
                <View className={styles.charCount}>{displayWordCount}/2000</View>
              </View>
            )}
          </View>
        )}
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
          {existingDraft ? '更新草稿' : '存草稿'}
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
          {isVoice ? '发送语音' : '发送回应'}
        </Button>
      </View>
    </ScrollView>
  );
};

export default ResponseEditorPage;
