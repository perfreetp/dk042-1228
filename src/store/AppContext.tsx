import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';
import type { Trouble, Response, UserProfile, GrowthData, Draft, ActionItem } from '@/types';
import { mockTroubles, mockMyTroubles } from '@/data/mockTroubles';
import { mockGrowthData, mockUserProfile } from '@/data/mockGrowth';
import { uid, showToast } from '@/utils';

interface AppState {
  user: UserProfile;
  troubles: Trouble[];
  myTroubles: Trouble[];
  drafts: Draft[];
  growthData: GrowthData;
}

interface AppContextValue extends AppState {
  submitTrouble: (trouble: Omit<Trouble, 'id' | 'userId' | 'responses' | 'createdAt' | 'status'>) => void;
  addResponse: (troubleId: string, response: Omit<Response, 'id' | 'createdAt' | 'usefulSentences'>) => void;
  rateResponse: (troubleId: string, responseId: string, rating: number) => void;
  markUseful: (troubleId: string, responseId: string, sentenceIndex: number) => void;
  markFollowUp: (troubleId: string, responseId: string) => void;
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

const AppContext = createContext<AppContextValue | null>(null);

export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>({
    user: mockUserProfile,
    troubles: mockTroubles,
    myTroubles: mockMyTroubles,
    drafts: [
      {
        id: uid(),
        troubleId: mockTroubles[0].id,
        content: '我之前考研的时候也很焦虑，后来发现一个方法...',
        tone: 'empathetic',
        updatedAt: new Date().toISOString(),
      },
    ],
    growthData: mockGrowthData,
  });

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
        const updateTroubleList = (list: Trouble[]): Trouble[] =>
          list.map((t) =>
            t.id === troubleId
              ? {
                  ...t,
                  responses: [...t.responses, response],
                  status: t.status === 'pending' ? 'replied' : t.status,
                }
              : t
          );

        return {
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
      });
      showToast('回应已发送', 'success');
    },
    []
  );

  const rateResponse = useCallback((troubleId: string, responseId: string, rating: number) => {
    setState((s) => {
      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? {
                ...t,
                responses: t.responses.map((r) =>
                  r.id === responseId
                    ? { ...r, rating }
                    : r
                ),
                status: rating >= 4 ? 'resolved' : t.status,
              }
            : t
        );

      const shouldThanks = rating >= 4;
      return {
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

  const markFollowUp = useCallback((troubleId: string, responseId: string) => {
    setState((s) => {
      const updateFn = (list: Trouble[]): Trouble[] =>
        list.map((t) =>
          t.id === troubleId
            ? {
                ...t,
                isFollowedUp: true,
                responses: t.responses.map((r) =>
                  r.id === responseId ? { ...r, hasFollowUp: true } : r
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
        return {
          ...s,
          drafts: s.drafts.map((d) =>
            d.id === draft.id
              ? { ...d, ...draft, updatedAt: new Date().toISOString() }
              : d
          ),
        };
      }
      const newDraft: Draft = {
        id: uid(),
        troubleId: draft.troubleId,
        content: draft.content || '',
        tone: draft.tone || 'warm',
        updatedAt: new Date().toISOString(),
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
