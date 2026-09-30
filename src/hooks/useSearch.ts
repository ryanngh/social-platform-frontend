import { useState, useEffect } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchService } from '../services/searchService';
import type {
  TypeaheadSearchResponse,
  UniversalSearchResponse,
  UserSearchResult,
  PostResponse,
  SliceResponse,
} from '../types';

/**
 * Hook cho ô tìm kiếm gợi ý tức thì (Debounce 300ms)
 */
export function useTypeaheadSearch(keyword: string, enabled = true) {
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  return useQuery<TypeaheadSearchResponse>({
    queryKey: ['search', 'typeahead', debouncedKeyword],
    queryFn: () => searchService.getTypeahead(debouncedKeyword),
    staleTime: 1000 * 30, // 30s
    enabled: enabled,
  });
}

/**
 * Hook cho trang tìm kiếm tổng hợp Universal Search (Tab "Tất cả")
 */
export function useUniversalSearch(query: string, userLimit = 5, postLimit = 10) {
  const trimmed = query.trim();

  return useQuery<UniversalSearchResponse>({
    queryKey: ['search', 'universal', trimmed, userLimit, postLimit],
    queryFn: () => searchService.getUniversalSearch(trimmed, userLimit, postLimit),
    enabled: Boolean(trimmed.length > 0),
    staleTime: 1000 * 60, // 1 phút
  });
}

/**
 * Hook cho tìm kiếm chuyên sâu Người dùng (Tab "Mọi người" - Infinite Scroll)
 */
export function useInfiniteUserSearch(query: string, size = 10) {
  const trimmed = query.trim();

  return useInfiniteQuery<SliceResponse<UserSearchResult>>({
    queryKey: ['search', 'users', trimmed, size],
    queryFn: ({ pageParam }) =>
      searchService.searchUsersPaged(trimmed, (pageParam as number) || 0, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.hasNext ? (lastPage?.number ?? 0) + 1 : undefined),
    enabled: Boolean(trimmed.length > 0),
    staleTime: 1000 * 60,
  });
}

/**
 * Hook cho tìm kiếm chuyên sâu Bài viết (Tab "Bài viết" - Infinite Scroll)
 */
export function useInfinitePostSearch(query: string, size = 10) {
  const trimmed = query.trim();

  return useInfiniteQuery<SliceResponse<PostResponse>>({
    queryKey: ['search', 'posts', trimmed, size],
    queryFn: ({ pageParam }) =>
      searchService.searchPostsPaged(trimmed, (pageParam as number) || 0, size),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.hasNext ? (lastPage?.number ?? 0) + 1 : undefined),
    enabled: Boolean(trimmed.length > 0),
    staleTime: 1000 * 60,
  });
}

/**
 * Hook Quản lý Lịch sử tìm kiếm (Lấy danh sách, xóa từng mục, xóa tất cả)
 */
export function useSearchHistory(enabled = true) {
  const queryClient = useQueryClient();

  const historyQuery = useQuery({
    queryKey: ['search', 'history'],
    queryFn: () => searchService.getHistory(10),
    enabled,
    staleTime: 1000 * 30,
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => searchService.deleteHistoryItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['search', 'typeahead'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: () => searchService.clearAllHistory(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['search', 'history'] });
      queryClient.invalidateQueries({ queryKey: ['search', 'typeahead'] });
    },
  });

  return {
    history: historyQuery.data || [],
    isLoading: historyQuery.isLoading,
    isFetching: historyQuery.isFetching,
    refetch: historyQuery.refetch,
    deleteItem: deleteItemMutation.mutate,
    isDeleting: deleteItemMutation.isPending,
    clearAll: clearAllMutation.mutate,
    isClearing: clearAllMutation.isPending,
  };
}
