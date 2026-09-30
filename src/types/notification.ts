export type NotificationType =
  | 'POST_REACTED'
  | 'POST_COMMENTED'
  | 'COMMENT_REPLIED'
  | 'COMMENT_REACTED'
  | 'FRIEND_REQUEST'
  | 'USER_FOLLOWED'
  | 'USER_MENTIONED';

export type TargetType = 'POST' | 'COMMENT' | 'USER';

export interface ActorSummary {
  id: string;
  displayName: string;
  avatarUrl: string | null;
}

export interface NotificationTarget {
  type: TargetType | string;
  id: string;
  url: string;
  thumbnailUrl: string | null;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  actorCount: number;
  latestActors: ActorSummary[];
  previewText: string;
  target: NotificationTarget;
  isRead: boolean;
  updatedAt: string; // ISO timestamp
}

export interface NotificationPageResponse {
  items: NotificationItem[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface UnreadCountResponse {
  unreadCount: number;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  reactionEnabled: boolean;
  commentEnabled: boolean;
  friendEnabled: boolean;
  readAllWatermarkAt?: string;
}

export interface UpdateNotificationSettingsRequest {
  pushEnabled?: boolean;
  reactionEnabled?: boolean;
  commentEnabled?: boolean;
  friendEnabled?: boolean;
}

export interface WebSocketFrame<T = unknown> {
  type: string;
  payload: T;
}

export interface RealtimeNotificationPayload {
  notification_id: string;
  recipient_id: string;
  notif_type: NotificationType;
  is_new: boolean;
  actor_count: number;
  latest_actors: ActorSummary[];
  target: NotificationTarget;
  preview_text: string;
  unread_count: number;
  push_allowed: boolean;
}
