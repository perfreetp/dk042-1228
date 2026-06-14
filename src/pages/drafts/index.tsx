import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from '@tarojs/components';
import Taro from '@tarojs/taro';
import classnames from 'classnames';
import styles from './index.module.scss';
import { useApp } from '@/store/AppContext';
import EmptyState from '@/components/EmptyState';
import { showModal, formatTime, getToneLabel } from '@/utils';

type FilterMode = 'all' | 'segment' | 'full';
type SortOrder = 'newest' | 'oldest';

const PAGE_SIZE = 10;

const DraftsPage: React.FC = () => {
  const { drafts, deleteDraft } = useApp();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  const filteredDrafts = useMemo(() => {
    let list = [...drafts];
    if (filter === 'segment') {
      list = list.filter((d) => d.mode === 'segment');
    } else if (filter === 'full') {
      list = list.filter((d) => d.mode === 'full' || !d.mode);
    }
    return list;
  }, [drafts, filter]);

  const sortedDrafts = useMemo(() => {
    const list = [...filteredDrafts];
    if (sortOrder === 'newest') {
      list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else {
      list.sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    }
    return list;
  }, [filteredDrafts, sortOrder]);

  const totalPages = Math.ceil(sortedDrafts.length / PAGE_SIZE);
  const pagedDrafts = sortedDrafts.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  const handleEdit = (draftId: string) => {
    const draft = drafts.find((d) => d.id === draftId);
    if (draft) {
      Taro.navigateTo({
        url: `/pages/response-editor/index?troubleId=${draft.troubleId}&draftId=${draft.id}`,
      });
    }
  };

  const handleDelete = (draftId: string, e) => {
    e.stopPropagation();
    showModal('确认删除', '确定要删除这份草稿吗？删除后无法恢复。').then((confirm) => {
      if (confirm) {
        deleteDraft(draftId);
        Taro.showToast({ title: '已删除', icon: 'success' });
      }
    });
  };

  const handleLoadMore = () => {
    setPage((p) => Math.min(p + 1, totalPages));
  };

  const handleFilterChange = (newFilter: FilterMode) => {
    setFilter(newFilter);
    setPage(1);
  };

  const handleSortChange = (newSort: SortOrder) => {
    setSortOrder(newSort);
    setPage(1);
  };

  return (
    <ScrollView scrollY className={styles.page}>
      <View className={styles.header}>
        <Text className={styles.title}>📝 草稿箱</Text>
        <Text className={styles.count}>{drafts.length} 份草稿</Text>
      </View>

      {drafts.length > 0 && (
        <>
          <View className={styles.filterBar}>
            <View
              className={classnames(styles.filterItem, filter === 'all' && styles.active)}
              onClick={() => handleFilterChange('all')}
            >
              全部 ({drafts.length})
            </View>
            <View
              className={classnames(styles.filterItem, filter === 'segment' && styles.active)}
              onClick={() => handleFilterChange('segment')}
            >
              📋 分段 ({drafts.filter((d) => d.mode === 'segment').length})
            </View>
            <View
              className={classnames(styles.filterItem, filter === 'full' && styles.active)}
              onClick={() => handleFilterChange('full')}
            >
              ✏️ 自由 ({drafts.filter((d) => d.mode === 'full' || !d.mode).length})
            </View>
          </View>

          <View className={styles.sortBar}>
            <View
              className={classnames(styles.sortItem, sortOrder === 'newest' && styles.active)}
              onClick={() => handleSortChange('newest')}
            >
              最近编辑 ↓
            </View>
            <View
              className={classnames(styles.sortItem, sortOrder === 'oldest' && styles.active)}
              onClick={() => handleSortChange('oldest')}
            >
              最早编辑 ↑
            </View>
          </View>
        </>
      )}

      {sortedDrafts.length === 0 ? (
        <EmptyState
          emoji="📝"
          title={filter === 'all' ? '暂无草稿' : `暂无${filter === 'segment' ? '分段模式' : '自由编辑模式'}草稿`}
          desc="在回应编辑器中保存的内容会出现在这里"
        />
      ) : (
        <View className={styles.list}>
          {pagedDrafts.map((draft) => (
            <View
              key={draft.id}
              className={styles.draftCard}
              onClick={() => handleEdit(draft.id)}
            >
              <View className={styles.cardHeader}>
                <View className={classnames(styles.toneTag, styles[draft.tone])}>
                  {getToneLabel(draft.tone)}
                </View>
                <Text className={styles.time}>{formatTime(draft.updatedAt)}</Text>
                <View
                  className={styles.deleteBtn}
                  onClick={(e) => handleDelete(draft.id, e)}
                >
                  ✕
                </View>
              </View>
              <Text className={styles.content}>
                {draft.content.slice(0, 80) || '空白草稿'}
              </Text>
              {draft.mode === 'segment' && draft.segments && (
                <View className={styles.segmentInfo}>
                  {draft.segments.some((s) => s.trim()) ? (
                    <Text className={styles.segHint}>
                      📋 分段模式 · {draft.segments.filter((s) => s.trim()).length}/4 段已填写
                    </Text>
                  ) : (
                    <Text className={styles.segHint}>📋 分段模式 · 待填写</Text>
                  )}
                </View>
              )}
              {draft.mode === 'full' && (
                <View className={styles.segmentInfo}>
                  <Text className={styles.segHint}>✏️ 自由编辑模式 · {draft.content.length} 字</Text>
                </View>
              )}
              {!draft.mode && (
                <View className={styles.segmentInfo}>
                  <Text className={styles.segHint}>✏️ 自由编辑模式 · {draft.content.length} 字</Text>
                </View>
              )}
              <View className={styles.cardFooter}>
                <Text className={styles.hint}>点击继续编辑 →</Text>
              </View>
            </View>
          ))}

          {hasMore && (
            <View className={styles.loadMore} onClick={handleLoadMore}>
              加载更多（还有 {sortedDrafts.length - pagedDrafts.length} 份草稿）
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
};

export default DraftsPage;
