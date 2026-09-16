import api from '../lib/axios';
import type { CommentResponse, ReplyResponse, SliceResponse, CreateCommentRequest } from '../types';

export interface CommentPaginationParams {
  page?: number;
  size?: number;
  sortBy?: 'POPULAR' | 'NEWEST' | 'OLDEST';
}

export const commentService = {
  async getComments(postId: string, params?: CommentPaginationParams): Promise<SliceResponse<CommentResponse>> {
    const response = await api.get<SliceResponse<CommentResponse>>(`/posts/${postId}/comments`, { params });
    return response.data;
  },

  async createComment(postId: string, data: CreateCommentRequest): Promise<CommentResponse> {
    const response = await api.post<CommentResponse>(`/posts/${postId}/comments`, data);
    return response.data;
  },

  async getCommentById(commentId: string): Promise<CommentResponse> {
    const response = await api.get<CommentResponse>(`/comments/${commentId}`);
    return response.data;
  },

  async editComment(commentId: string, data: import('../types').UpdateCommentRequest): Promise<CommentResponse> {
    const response = await api.put<CommentResponse>(`/comments/${commentId}`, data);
    return response.data;
  },

  async deleteComment(commentId: string): Promise<void> {
    await api.delete(`/comments/${commentId}`);
  },

  async getReplies(commentId: string, params?: CommentPaginationParams): Promise<SliceResponse<ReplyResponse>> {
    const response = await api.get<SliceResponse<ReplyResponse>>(`/comments/${commentId}/replies`, { params });
    return response.data;
  },

  async createReply(commentId: string, data: import('../types').CreateReplyRequest): Promise<ReplyResponse> {
    const response = await api.post<ReplyResponse>(`/comments/${commentId}/replies`, data);
    return response.data;
  },

  async pinComment(commentId: string): Promise<CommentResponse> {
    const response = await api.put<CommentResponse>(`/comments/${commentId}/pin`);
    return response.data;
  },

  async unpinComment(commentId: string): Promise<CommentResponse> {
    const response = await api.put<CommentResponse>(`/comments/${commentId}/unpin`);
    return response.data;
  },

  async likeComment(commentId: string): Promise<import('../types').ReactionToggleResponse> {
    const response = await api.post<import('../types').ReactionToggleResponse>(`/comments/${commentId}/reactions`);
    return response.data;
  },

  async unlikeComment(commentId: string): Promise<import('../types').ReactionToggleResponse> {
    const response = await api.delete<import('../types').ReactionToggleResponse>(`/comments/${commentId}/reactions`);
    return response.data;
  },

  async getCommentLikers(commentId: string, params?: { page?: number; size?: number }): Promise<SliceResponse<import('../types').LikerResponse>> {
    const response = await api.get<SliceResponse<import('../types').LikerResponse>>(`/comments/${commentId}/reactions`, { params });
    return response.data;
  },
};
