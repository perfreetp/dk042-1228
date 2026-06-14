import React, { createContext, useContext, useState, useCallback, useMemo, useEffect, ReactNode } from 'react';
import Taro from '@tarojs/taro';
import type { Trouble, Response, UserProfile, GrowthData, Draft, ActionItem, FollowUpRecord, InteractionRecord, TroubleTheme } from '@/types';
import { mockTroubles, mockMyTroubles } from '@/data/mockTroubles';
import { mockGrowthData, mockUserProfile } from '@/data/mockGrowth';
import { uid, showToast } from '@/utils';

interface AppState {
  user: UserProfile;
  troubles: Trouble[];
  myTroubles: Trouble[];
  drafts: Draft[];
  growthData: GrowthData;
  followUpRecords: FollowUpRecord[];
  interactionRecords: InteractionRecord[];
}

interface AppContextValue extends AppState {
  submitTrouble: (trouble: Omit<Trouble, 'id' | 'userId' | 'responses' | 'createdAt' | 'status'>) => void;
  addResponse: (troubleId: string, response: Omit<Response, 'id' | 'createdAt' | 'usefulSentences'>) => void;
  rateResponse: (troubleId: string, responseId: string, rating: number) => void;
  markUseful: (troubleId: string, responseId: string, sentenceIndex: number) => void;
  markFollowUp: (troubleId: string, responseId: string, content: string, mood: string) => void;
  toggleActionItem: (troubleId: string, itemId: string) => void;
  addActionItems: (troubleId: string, items: string[]) => void;
  deleteActionItem: (troubleId: string, itemId: string) => void;
  saveDraft: (draft: Partial<Draft> & { id?: string }) => void;
  deleteDraft: (id: string) => void;
  getDraftByTroubleId: (troubleId: string) => Draft | undefined;
  blockUser: (userId: string) => void;
  togglePauseMatch: () => void;
  reportContent: (type: string, id: string, reason: string) => void;
}

const STORAGE_KEY = 'trouble_exchange_state_v2';

const defaultState: AppState = {
  user: mockUserProfile,
  troubles: mockTroubles,
  myTroubles: mockMyTroubles,
  drafts: [],
  growthData: mockGrowthData,
  followUpRecords: [],
  interactionRecords: [],
};

const sortDrafts = (drafts: Draft[]): Draft[] =>
  [...drafts].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

const loadState = (): AppState => {
  try {
    const raw = Taro.getStorageSync(STORAGE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        user: saved.user || defaultState.user,
        troubles: saved.troubles || defaultState.troubles,
        myTroubles: saved.myTroubles || defaultState.myTroubles,
        drafts: sortDrafts(saved.drafts || defaultState.drafts),
        growthData: saved.growthData || defaultState.growthData,
        followUpRecords: saved.followUpRecords || defaultState.followUpRecords,
        interactionRecords: saved.interactionRecords || defaultState.interactionRecords,
      };
    }
  } catch (_e) {
    // ignore
  }
  return defaultState;
};

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(loadState);

  useEffect(() => {
    try {
      Taro.setStorageSync(STORAGE_KEY, JSON.stringify(state));
    } catch (_e) {
      // ignore
    }
  }, [state]);

  const pushInteraction = (record: Omit<InteractionRecord, 'id' | 'createdAt'>) => {
    setState((s) => ({
      ...s,
      interactionRecords: [
        {
          ...record,
          id: uid(),
          createdAt: new Date().toISOString(),
        },
        ...s.interactionRecords,
      ],
    }));
  };

  const submitTrouble = useCallback(
    (data: Omit<Trouble, 'id' | 'userId' | 'responses' | 'createdAt' | 'status'>) => {
      const newTrouble: Trouble = {
        ...data,
        id: uid(),
        userId: 'me',
        responses: [],
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      setState((s) => ({
        ...s,
        myTroubles: [newTrouble, ...s.myTroubles],
      }));
      showToast('烦恼已发送', 'success');
    },
    []
  );

  const addResponse = useCallback(
    (troubleId: string, data: Omit<Response, 'id' | 'createdAt' | 'usefulSentences'>) => {
      const response: Response = {
        ...data,
        id: uid(),
        createdAt: new Date().toISOString(),
        usefulSentences: [],
      };

      setState((s) => {
        let targetTrouble: Trouble | undefined;
        const updateTroubleList = (list: Trouble[]): Trouble[] =>
          list.map((t) => {
            if (t.id === troubleId) {
              const updated = {
                ...t,
                responses: [...t.responses, response],
                status: t.status === 'pending' ? 'replied' : t.status,
              };
              targetTrouble = updated;
              return updated;
            }
            return t;
          });

        const updatedState = {
          ...s,
          troubles: updateTroubleList(s.troubles),
          myTroubles: updateTroubleList(s.myTroubles),
          growthData: {
            ...s.growthData,
            helpCount: s.growthData.helpCount + 1,
          },
          user: {
            ...s.user,
            helpCount: s.user.helpCount + 1,
          },
        };

        if (targetTrouble) {
          const interaction: Omit<InteractionRecord, 'id' | 'createdAt'> = {
            type: 'help',
            troubleId: targetTrouble.id,
            troubleTheme: targetTrouble.theme,
            troubleContent: targetTrouble.content,
            responseId: response.id,
            targetUserName: targetTrouble.userName,
            targetUserAvatar: targetTrouble.userAvatar,
            description: `帮助了 ${targetTrouble.userName}`,
          };
          return {
            ...updatedState,
            interactionRecords: [
              {
                ...interaction,
                id: uid(),
                createdAt: new Date().toISOString(),
              },
              ...s.interactionRecords,
            ],
          };
        }
        return updatedState;
      });
      showToast('回应已发送', 'success');
    },
    []
  );

  const rateResponse = useCallback((troubleId: string, responseId: string, rating: number) => {
    setState((s) => {
      let targetTrouble: Trouble | undefined;
      let targetResponse: Response | undefined;

      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) => {
          if (t.id !== troubleId) return t;
          const updated = {
            ...t,
            responses: t.responses.map((r) => {
              if (r.id === responseId) {
                targetResponse = { ...r, rating };
                return targetResponse;
              }
              return r;
            }),
            status: rating >= 4 ? 'resolved' : t.status,
          };
          targetTrouble = updated;
          return updated;
        });

      const shouldThanks = rating >= 4;
      const newState = {
        ...s,
        troubles: updateFn(s.troubles),
        myTroubles: updateFn(s.myTroubles),
        growthData: shouldThanks
          ? {
              ...s.growthData,
              thankedCount: s.growthData.thankedCount + 1,
              resolveCount: s.growthData.resolveCount + 1,
            }
          : s.growthData,
        user: shouldThanks
          ? {
              ...s.user,
              thankedCount: s.user.thankedCount + 1,
            }
          : s.user,
      };

      if (targetTrouble && targetResponse && targetResponse.userId !== 'me') {
        const interaction: Omit<InteractionRecord, 'id' | 'createdAt'> = {
          type: 'highRate',
          troubleId: targetTrouble.id,
          troubleTheme: targetTrouble.theme as TroubleTheme,
          troubleContent: targetTrouble.content,
          responseId: targetResponse.id,
          targetUserName: targetResponse.userName,
          targetUserAvatar: targetResponse.userAvatar,
          description: `收到了 ${rating} 星好评！来自 ${targetTrouble.userName} 的感谢`,
          rating,
        };
        return {
          ...newState,
          interactionRecords: [
            {
              ...interaction,
              id: uid(),
              createdAt: new Date().toISOString(),
            },
            ...s.interactionRecords,
          ],
        };
      }
      return newState;
    });
    showToast('感谢你的评价', 'success');
  }, []);

  const markUseful = useCallback((troubleId: string, responseId: string, sentenceIndex: number) => {
    setState((s) => {
      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? {
                ...t,
                responses: t.responses.map((r) => {
                  if (r.id !== responseId) return r;
                  const exists = r.usefulSentences.includes(sentenceIndex);
                  return {
                    ...r,
                    usefulSentences: exists
                      ? r.usefulSentences.filter((i) => i !== sentenceIndex)
                      : [...r.usefulSentences, sentenceIndex],
                  };
                }),
              }
            : t
        );
      return {
        ...s,
        troubles: updateFn(s.troubles),
        myTroubles: updateFn(s.myTroubles),
      };
    });
  }, []);

  const markFollowUp = useCallback((troubleId: string, responseId: string, content: string, mood: string) => {
    setState((s) => {
      const allTroubles = [...s.troubles, ...s.myTroubles];
      const trouble = allTroubles.find((t) => t.id === troubleId);
      const response = trouble?.responses.find((r) => r.id === responseId);

      const baseRecord: Omit<FollowUpRecord, 'id' | 'createdAt' | 'direction'> = {
        troubleId,
        troubleTheme: (trouble?.theme as TroubleTheme) || '其他',
        troubleContent: trouble?.content || '',
        responseId,
        responderName: response?.userName || '',
        responderAvatar: response?.userAvatar,
        responseContent: response?.content || '',
        content,
        mood,
      };

      const sentRecord: FollowUpRecord = {
        ...baseRecord,
        id: uid(),
        direction: 'sent',
        createdAt: new Date().toISOString(),
      };

      const receivedRecord: FollowUpRecord = {
        ...baseRecord,
        id: uid(),
        direction: 'received',
        createdAt: new Date().toISOString(),
      };

      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? {
                ...t,
                isFollowedUp: true,
                responses: t.responses.map((r) => ({ ...r, hasFollowUp: true })),
              }
            : t
        );

      const newTroubles = updateFn(s.troubles);
      const newMyTroubles = updateFn(s.myTroubles);

      let interactionList = s.interactionRecords;
      if (trouble && response && response.userId !== 'me') {
        const interaction: Omit<InteractionRecord, 'id' | 'createdAt'> = {
          type: 'followUp',
          troubleId: trouble.id,
          troubleTheme: trouble.theme as TroubleTheme,
          troubleContent: trouble.content,
          responseId: response.id,
          targetUserName: response.userName,
          targetUserAvatar: response.userAvatar,
          description: `回访了 ${response.userName}：${content.slice(0, 20)}${content.length > 20 ? '...' : ''}`,
        };
        interactionList = [
          {
            ...interaction,
            id: uid(),
            createdAt: new Date().toISOString(),
          },
          ...interactionList,
        ];
      }

      return {
        ...s,
        troubles: newTroubles,
        myTroubles: newMyTroubles,
        followUpRecords: [sentRecord, receivedRecord, ...s.followUpRecords],
        interactionRecords: interactionList,
      };
    });
    showToast('回访已发送，感谢你的反馈 💌', 'success');
  }, []);

  const toggleActionItem = useCallback((troubleId: string, itemId: string) => {
    setState((s) => {
      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? {
                ...t,
                actionItems: t.actionItems?.map((a) =>
                  a.id === itemId ? { ...a, done: !a.done } : a
                ),
              }
            : t
        );
      return {
        ...s,
        troubles: updateFn(s.troubles),
        myTroubles: updateFn(s.myTroubles),
      };
    });
  }, []);

  const addActionItems = useCallback((troubleId: string, items: string[]) => {
    const newItems: ActionItem[] = items.map((content) => ({
      id: uid(),
      content,
      done: false,
      createdAt: new Date().toISOString(),
    }));
    setState((s) => {
      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? { ...t, actionItems: [...(t.actionItems || []), ...newItems] }
            : t
        );
      return {
        ...s,
        troubles: updateFn(s.troubles),
        myTroubles: updateFn(s.myTroubles),
      };
    });
    showToast('已添加到行动清单', 'success');
  }, []);

  const deleteActionItem = useCallback((troubleId: string, itemId: string) => {
    setState((s) => {
      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? {
                ...t,
                actionItems: t.actionItems?.filter((a) => a.id !== itemId),
              }
            : t
        );
      return {
        ...s,
        troubles: updateFn(s.troubles),
        myTroubles: updateFn(s.myTroubles),
      };
    });
  }, []);

  const saveDraft = useCallback((draft: Partial<Draft> & { id?: string }) => {
    setState((s) => {
      if (draft.id) {
        const others = s.drafts.filter((d) => d.id !== draft.id);
        const updated = s.drafts.map((d) =>
          d.id === draft.id
            ? { ...d, ...draft, updatedAt: new Date().toISOString() }
            : d
        );
        const target = updated.find((d) => d.id === draft.id);
        return {
          ...s,
          drafts: sortDrafts(target ? [target, ...others] : updated),
        };
      }
      const newDraft: Draft = {
        id: uid(),
        troubleId: draft.troubleId,
        content: draft.content || '',
        tone: draft.tone || 'warm',
        updatedAt: new Date().toISOString(),
        mode: draft.mode,
        segments: draft.segments,
      };
      return { ...s, drafts: [newDraft, ...s.drafts] };
    });
    showToast('草稿已保存', 'success');
  }, []);

  const deleteDraft = useCallback((id: string) => {
    setState((s) => ({ ...s, drafts: s.drafts.filter((d) => d.id !== id) }));
  }, []);

  const getDraftByTroubleId = useCallback(
    (troubleId: string) => {
      return state.drafts.find((d) => d.troubleId === troubleId);
    },
    [state.drafts]
  );

  const blockUser = useCallback((userId: string) => {
    setState((s) => ({
      ...s,
      user: { ...s.user, blockedUsers: [...s.user.blockedUsers, userId] },
    }));
    showToast('已屏蔽该用户', 'success');
  }, []);

  const togglePauseMatch = useCallback(() => {
    setState((s) => ({
      ...s,
      user: { ...s.user, isPaused: !s.user.isPaused },
    }));
  }, []);

  const reportContent = useCallback((_type: string, _id: string, _reason: string) => {
    showToast('举报已提交，我们会尽快处理', 'success');
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      ...state,
      submitTrouble,
      addResponse,
      rateResponse,
      markUseful,
      markFollowUp,
      toggleActionItem,
      addActionItems,
      deleteActionItem,
      saveDraft,
      deleteDraft,
      getDraftByTroubleId,
      blockUser,
      togglePauseMatch,
      reportContent,
    }),
    [
      state,
      submitTrouble,
      addResponse,
      rateResponse,
      markUseful,
      markFollowUp,
      toggleActionItem,
      addActionItems,
      deleteActionItem,
      saveDraft,
      deleteDraft,
      getDraftByTroubleId,
      blockUser,
      togglePauseMatch,
      reportContent,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
