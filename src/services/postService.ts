import api from '../lib/axios';
import type { PostResponse, SliceResponse } from '../types';

export interface PostPaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}

export const postService = {
  async getPostById(postId: string): Promise<PostResponse> {
    const response = await api.get<PostResponse>(`/posts/${postId}`);
    return response.data;
  },

  async createPost(data: import('../types').CreatePostRequest): Promise<PostResponse> {
    const payload = {
      content: data.content,
      visibility: data.visibility || 'PUBLIC',
      media: data.media || [],
      hashtags: data.hashtags || [],
      taggedUserIds: data.taggedUserIds || [],
    };
    const response = await api.post<import('../types').CreatePostResponse>('/posts', payload);
    return {
      ...response.data,
      reactionCount: response.data.reactionCount ?? 0,
      commentCount: response.data.commentCount ?? 0,
    };
  },

  async getUserPosts(userId: string, params?: PostPaginationParams): Promise<SliceResponse<PostResponse>> {
    const response = await api.get<SliceResponse<PostResponse>>(`/users/${userId}/posts`, { params });
    return response.data;
  },

  async getMyPosts(params?: PostPaginationParams): Promise<SliceResponse<PostResponse>> {
    const response = await api.get<SliceResponse<PostResponse>>('/users/me/posts', { params });
    return response.data;
  },

  async getFeed(params?: PostPaginationParams): Promise<SliceResponse<PostResponse>> {
    const response = await api.get<SliceResponse<PostResponse>>('/posts/feed', { params });
    return response.data;
  },

  async updatePost(postId: string, data: Partial<import('../types').CreatePostRequest>): Promise<PostResponse> {
    const response = await api.put<PostResponse>(`/posts/${postId}`, data);
    return response.data;
  },

  async deletePost(postId: string): Promise<void> {
    await api.delete(`/posts/${postId}`);
  },

  async likePost(postId: string): Promise<import('../types').ReactionToggleResponse> {
    const response = await api.post<import('../types').ReactionToggleResponse>(`/posts/${postId}/reactions`);
    return response.data;
  },

  async unlikePost(postId: string): Promise<import('../types').ReactionToggleResponse> {
    const response = await api.delete<import('../types').ReactionToggleResponse>(`/posts/${postId}/reactions`);
    return response.data;
  },

  async getPostLikers(postId: string, params?: { page?: number; size?: number }): Promise<SliceResponse<import('../types').LikerResponse>> {
    const response = await api.get<SliceResponse<import('../types').LikerResponse>>(`/posts/${postId}/reactions`, { params });
    return response.data;
  },
};
