import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestedUserService } from '../services/suggestedUserService';
import { userService } from '../services/userService';
import type { SuggestedUser } from '../types';

/**
 * Hook lấy danh sách gợi ý tài khoản đáng theo dõi (Who to Follow / Suggested For You)
 */
export function useSuggestedUsers(limit = 10) {
  const queryClient = useQueryClient();

  const query = useQuery<SuggestedUser[]>({
    queryKey: ['suggestedUsers', limit],
    queryFn: () => suggestedUserService.getSuggestedUsers(limit),
    staleTime: 5 * 60 * 1000, // 5 phút
    refetchOnWindowFocus: false,
  });

  // Mutation bỏ qua gợi ý (Dismiss)
  const dismissMutation = useMutation({
    mutationFn: (targetUserId: string) => suggestedUserService.dismissSuggestedUser(targetUserId),
    onMutate: async (targetUserId: string) => {
      await queryClient.cancelQueries({ queryKey: ['suggestedUsers'] });

      // Optimistic update: xóa khỏi danh sách gợi ý ngay tức thì
      queryClient.setQueriesData<SuggestedUser[]>(
        { queryKey: ['suggestedUsers'] },
        (old) => (old ? old.filter((user) => user.id !== targetUserId) : [])
      );
    },
    onError: () => {
      // Revert if needed
      queryClient.invalidateQueries({ queryKey: ['suggestedUsers'] });
    },
  });

  // Mutation theo dõi người dùng được gợi ý
  const followMutation = useMutation({
    mutationFn: ({ userId, isFollowing }: { userId: string; isFollowing: boolean }) =>
      isFollowing ? userService.unfollowUser(userId) : userService.followUser(userId),
    onSuccess: () => {
      // Invalidate queries liên quan nếu cần
      queryClient.invalidateQueries({ queryKey: ['feed'] });
    },
  });

  return {
    ...query,
    dismissUser: dismissMutation.mutate,
    isDismissing: dismissMutation.isPending,
    toggleFollow: followMutation.mutateAsync,
  };
}
