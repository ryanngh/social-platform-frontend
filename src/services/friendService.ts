import api from '../lib/axios';
import type { FriendRequest, PaginatedResponse, PaginationParams, User } from '../types';

export const friendService = {
  async sendFriendRequest(receiverId: string): Promise<FriendRequest> {
    const response = await api.post<FriendRequest>('/friend-requests', { receiverId });
    return response.data;
  },

  async cancelFriendRequest(requestId: string): Promise<void> {
    await api.delete(`/friend-requests/${requestId}`);
  },

  async acceptFriendRequest(requestId: string): Promise<FriendRequest> {
    const response = await api.post<FriendRequest>(`/friend-requests/${requestId}/accept`);
    return response.data;
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    await api.post(`/friend-requests/${requestId}/decline`);
  },

  async getReceivedRequests(params?: PaginationParams): Promise<PaginatedResponse<FriendRequest>> {
    const response = await api.get<PaginatedResponse<FriendRequest>>('/friend-requests/received', { params });
    return response.data;
  },

  async getSentRequests(params?: PaginationParams): Promise<PaginatedResponse<FriendRequest>> {
    const response = await api.get<PaginatedResponse<FriendRequest>>('/friend-requests/sent', { params });
    return response.data;
  },

  async getMyFriends(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/friend-requests/friends', { params });
    return response.data;
  },

  async getUserFriends(userId: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>(`/friend-requests/friends/${userId}`, { params });
    return response.data;
  },

  async getMutualFriends(targetUserId: string, params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>(`/friend-requests/friends/${targetUserId}/mutual`, { params });
    return response.data;
  },

  async unfriend(targetUserId: string): Promise<void> {
    await api.delete(`/friend-requests/friends/${targetUserId}`);
  },

  async blockUser(targetUserId: string): Promise<void> {
    await api.post(`/friend-requests/blocks/${targetUserId}`);
  },

  async unblockUser(targetUserId: string): Promise<void> {
    await api.delete(`/friend-requests/blocks/${targetUserId}`);
  },

  async getBlockedUsers(params?: PaginationParams): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/friend-requests/blocks', { params });
    return response.data;
  },
};
