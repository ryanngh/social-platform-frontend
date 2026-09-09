// ============================================================
// Auth Types
// ============================================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
}

export interface LoginRequest {
  identifier: string; // email or phone
  password: string;
}

export interface RegisterRequest {
  phoneNumber: string;
  email: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

// ============================================================
// User Types
// ============================================================

export interface User {
  id: string;
  username: string;
  email?: string;
  phoneNumber?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  pronouns?: string;
  location?: string;
  websiteUrl?: string;
  birthday?: string;
  pronunciation?: string;
  followingCount?: number;
  followersCount?: number;
  interests?: string[];
  groups?: { name: string }[];
  createdAt?: string;
  updatedAt?: string;
}

export interface UserAccount {
  id: string;
  email: string;
  phoneNumber?: string;
  role: string;
  status: string;
}

export interface ProfileUpdateRequest {
  username?: string;
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  bannerUrl?: string;
  bio?: string;
  pronouns?: string;
  location?: string;
  websiteUrl?: string;
  birthday?: string;
  pronunciation?: string;
}

// ============================================================
// Friend Request Types
// ============================================================

export interface FriendRequest {
  id: string;
  senderId: string;
  receiverId: string;
  status: string;
  createdAt: string;
  sender?: User;
  receiver?: User;
}

export interface SendFriendRequest {
  receiverId: string;
}

// ============================================================
// Pagination Types
// ============================================================

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface PaginationParams {
  page?: number;
  size?: number;
  sort?: string;
}
