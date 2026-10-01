import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { exploreService } from '../services/exploreService';
import type { ExploreFeedData } from '../types';

export function useExploreFeed(
  mediaType: 'ALL' | 'IMAGE' | 'VIDEO' = 'ALL',
  hashtag?: string,
  pageSize = 20
) {
  const cleanHashtag = hashtag?.trim().replace(/^#/, '') || undefined;
  const queryClient = useQueryClient();

  const query = useInfiniteQuery<ExploreFeedData>({
    queryKey: ['explore', 'feed', mediaType, cleanHashtag, pageSize],
    queryFn: ({ pageParam }) =>
      exploreService.getExploreFeed({
        mediaType,
        hashtag: cleanHashtag,
        page: (pageParam as number) || 0,
        size: pageSize,
      }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.hasMore ? (lastPage.page ?? 0) + 1 : undefined),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const invalidateExplore = () => {
    queryClient.invalidateQueries({ queryKey: ['explore'] });
  };

  return {
    ...query,
    invalidateExplore,
  };
}
