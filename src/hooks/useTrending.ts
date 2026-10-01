import { useQuery } from '@tanstack/react-query';
import { trendingService } from '../services/trendingService';
import type { TrendingHashtag } from '../types';

/**
 * Hook lấy danh sách Top Hashtag thịnh hành trong Rolling 7 Days
 */
export function useTrendingHashtags(limit = 10) {
  return useQuery<TrendingHashtag[]>({
    queryKey: ['trendingHashtags', limit],
    queryFn: () => trendingService.getTrendingHashtags(limit),
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false,
  });
}
