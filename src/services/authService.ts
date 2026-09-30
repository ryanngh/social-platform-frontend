import api from '../lib/axios';
import type { AuthTokens, LoginRequest, RegisterRequest, ApiResponse, UserAccountResponse } from '../types';

export const authService = {
  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/login', data);
    return response.data;
  },

  async register(data: RegisterRequest): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/register', data);
    return response.data;
  },

  async verifyEmail(code: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/verify-email', { code });
    return response.data;
  },

  async resendEmailOtp(): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/resend-email-otp');
    return response.data;
  },

  async changeEmail(email: string): Promise<ApiResponse<void>> {
    const response = await api.post<ApiResponse<void>>('/auth/change-email', { email });
    return response.data;
  },

  async getAccountInfo(): Promise<UserAccountResponse> {
    const response = await api.get<UserAccountResponse>('/users/account');
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    const response = await api.post<AuthTokens>('/auth/refresh', { refreshToken });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', { refreshToken });
  },

  async logoutAll(): Promise<void> {
    await api.post('/auth/logout-all');
  },
};

