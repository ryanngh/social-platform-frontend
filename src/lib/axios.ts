import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Shared Promise mutex ngăn chặn việc gửi nhiều request /auth/refresh cùng lúc khi có nhiều API 401 đồng thời
let refreshPromise: Promise<string> | null = null;

/**
 * Hàm gọi request đổi refresh token lấy access token mới
 */
export const refreshAccessToken = async (): Promise<string> => {
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const refreshUrl = API_BASE_URL ? `${API_BASE_URL}/auth/refresh` : '/auth/refresh';
    const response = await axios.post(refreshUrl, {
      refreshToken,
    });

    const { accessToken, refreshToken: newRefreshToken } = response.data;
    if (!accessToken) {
      throw new Error('Invalid refresh response');
    }

    localStorage.setItem('accessToken', accessToken);
    if (newRefreshToken) {
      localStorage.setItem('refreshToken', newRefreshToken);
    }

    return accessToken;
  })()
    .catch((err) => {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (
        typeof window !== 'undefined' &&
        window.location.pathname !== '/signin' &&
        window.location.pathname !== '/signup'
      ) {
        window.location.href = '/signin';
      }
      throw err;
    })
    .finally(() => {
      refreshPromise = null;
    });

  return refreshPromise;
};

// Request interceptor: attach auth token & handle multipart form data
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Delete Content-Type for FormData so Axios and browser automatically set multipart/form-data with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Refresh expired sessions; authorization failures stay visible to callers.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/register') ||
      originalRequest?.url?.includes('/auth/refresh') ||
      originalRequest?.url?.includes('/auth/otp-challenges') ||
      originalRequest?.url?.includes('/auth/reset-password') ||
      originalRequest?.url?.includes('/auth/restore-account');

    // A forbidden profile tab or OTP action must never trigger token refresh.
    const isAuthError =
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !isAuthEndpoint;

    if (isAuthError) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/signin' &&
          window.location.pathname !== '/signup'
        ) {
          window.location.href = '/signin';
        }
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      try {
        const newAccessToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
