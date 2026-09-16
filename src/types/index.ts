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

// ============================================================
// Post Types
// ============================================================

export interface PostAuthor {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl: string | null;
}

export interface PostMedia {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl: string | null;
  displayOrder: number;
}

export type PostVisibility = 'PUBLIC' | 'FRIENDS' | 'CLOSE_FRIENDS' | 'PRIVATE';

export interface PostResponse {
  id: string;
  author: PostAuthor;
  content: string;
  visibility: PostVisibility;
  media: PostMedia[];
  hashtags: string[];
  taggedUsers: PostAuthor[];
  reactionCount: number;
  commentCount: number;
  isLiked?: boolean;
  liked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PostMediaRequest {
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  thumbnailUrl?: string | null;
}

export interface CreatePostRequest {
  content: string;
  visibility?: PostVisibility;
  media?: PostMediaRequest[];
  hashtags?: string[];
  taggedUserIds?: string[];
}

export interface CreatePostResponse {
  id: string;
  author: PostAuthor;
  content: string;
  visibility: PostVisibility;
  media: PostMedia[];
  hashtags: string[];
  taggedUsers: PostAuthor[];
  createdAt: string;
  updatedAt: string;
  reactionCount?: number;
  commentCount?: number;
  isLiked?: boolean;
  liked?: boolean;
}

// ============================================================
// Reaction Types
// ============================================================

export interface ReactionToggleResponse {
  liked: boolean;
  likeCount: number;
}

export interface LikerResponse {
  user: PostAuthor;
  reactedAt: string;
}

// ============================================================
// Comment Types
// ============================================================

export interface CommentPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canPin: boolean;
}

export interface CommentResponse {
  id: string;
  postId: string;
  parentCommentId: string | null;
  author: PostAuthor;
  content: string;
  media: PostMedia[];
  mentions: PostAuthor[];
  likeCount: number;
  replyCount: number;
  isPinned: boolean;
  isLiked?: boolean;
  liked?: boolean;
  pinnedAt: string | null;
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
  permissions: CommentPermissions;
}

export interface ReplyResponse {
  id: string;
  postId: string;
  parentCommentId: string;
  author: PostAuthor;
  replyToUser: PostAuthor | null;
  content: string;
  media: PostMedia[];
  mentions: PostAuthor[];
  likeCount: number;
  isLiked?: boolean;
  liked?: boolean;
  createdAt: string;
  editedAt: string | null;
  updatedAt: string;
}

export interface CommentMediaRequest {
  mediaType: 'IMAGE' | 'VIDEO' | 'GIF';
  mediaUrl: string;
  width?: number | null;
  height?: number | null;
}

export interface CreateCommentRequest {
  content?: string;
  parentCommentId?: string | null;
  media?: CommentMediaRequest[];
  mentionedUserIds?: string[];
}

export interface UpdateCommentRequest {
  content?: string;
  media?: CommentMediaRequest[];
  mentionedUserIds?: string[];
}

export interface CreateReplyRequest {
  content: string;
  media?: CommentMediaRequest[];
  mentionedUserIds?: string[];
}

export interface SliceResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: { sorted: boolean; unsorted: boolean; empty: boolean };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  size: number;
  number: number;
  numberOfElements: number;
  first: boolean;
  last: boolean;
  empty: boolean;
}
