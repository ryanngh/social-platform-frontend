import api from '../lib/axios';
import type { User, ProfileUpdateRequest, UserAccount } from '../types';

export const userService = {
  async getMyProfile(): Promise<User> {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  async getMyProfileAlias(): Promise<User> {
    const response = await api.get<User>('/users/me/profile');
    return response.data;
  },

  async getUserByIdentifier(identifier: string): Promise<User> {
    const response = await api.get<User>(`/users/${identifier}`);
    return response.data;
  },

  async updateProfile(data: ProfileUpdateRequest): Promise<User> {
    const response = await api.put<User>('/users/me/profile', data);
    return response.data;
  },

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<User>('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async uploadBanner(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<User>('/users/me/banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  async getAccountDetails(): Promise<UserAccount> {
    const response = await api.get<UserAccount>('/users/me/account');
    return response.data;
  },

  async deactivateAccount(): Promise<void> {
    await api.post('/users/me/deactivate');
  },

  async deleteAccount(): Promise<void> {
    await api.delete('/users/me');
  },
};
