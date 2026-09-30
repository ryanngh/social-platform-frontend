import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { CheckCheck } from 'lucide-react';
import type {
  NotificationItem,
  NotificationSettings,
  UpdateNotificationSettingsRequest,
  RealtimeNotificationPayload,
  WebSocketFrame,
  NotificationType,
  ActorSummary,
  NotificationTarget,
} from '../types';
import { notificationService } from '../services/notificationService';
import { useAuth } from './AuthContext';
import { playNotificationSound } from '../utils/sound';
import {
  NotificationToastContainer,
  type FloatingToast,
} from '../components/notifications/NotificationToastContainer';

interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  nextCursor: string | null;
  settings: NotificationSettings | null;
  isSettingsOpen: boolean;
  setIsSettingsOpen: (open: boolean) => void;
  fetchInitialNotifications: () => Promise<void>;
  loadMore: () => Promise<void>;
  markAsRead: (id: string, targetUrl?: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshUnreadCount: () => Promise<void>;
  fetchSettings: () => Promise<void>;
  updateSettings: (newSettings: UpdateNotificationSettingsRequest) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [floatingToasts, setFloatingToasts] = useState<FloatingToast[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // 1. Fetch unread count
  const refreshUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getUnreadCount();
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error('Failed to fetch unread notification count:', err);
    }
  }, [isAuthenticated]);

  // 2. Fetch initial notification list
  const fetchInitialNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await notificationService.getFeed(null, 20);
      setNotifications(data.items || []);
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to fetch notifications feed:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // 3. Load more notifications with cursor
  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await notificationService.getFeed(nextCursor, 20);
      setNotifications((prev) => {
        const existingIds = new Set(prev.map((it) => it.id));
        const newItems = (data.items || []).filter((it) => !existingIds.has(it.id));
        return [...prev, ...newItems];
      });
      setNextCursor(data.nextCursor);
      setHasMore(data.hasMore);
    } catch (err) {
      console.error('Failed to load more notifications:', err);
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasMore, nextCursor, isLoadingMore]);

  // 4. Mark single notification as read
  const markAsRead = useCallback(
    async (id: string, targetUrl?: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Remove from active floating toasts if present
      setFloatingToasts((prev) => prev.filter((t) => t.item.id !== id));

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      if (isUuid) {
        try {
          await notificationService.markAsRead(id);
        } catch (err) {
          console.error('Failed to mark notification as read:', err);
        }
      }

      if (targetUrl) {
        navigate(targetUrl);
      }
    },
    [navigate]
  );

  // 5. Mark all as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
    setUnreadCount(0);
    setFloatingToasts([]);

    try {
      await notificationService.markAllAsRead();
      toast.success('Đã đánh dấu tất cả là đã đọc', {
        icon: <CheckCheck className="w-4 h-4 text-emerald-500" />,
        duration: 2500,
      });
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
      void refreshUnreadCount();
    }
  }, [refreshUnreadCount]);

  // 6. Settings
  const fetchSettings = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await notificationService.getSettings();
      setSettings(data);
    } catch (err) {
      console.error('Failed to fetch notification settings:', err);
    }
  }, [isAuthenticated]);

  const updateSettings = useCallback(
    async (newSettings: UpdateNotificationSettingsRequest) => {
      try {
        const updated = await notificationService.updateSettings(newSettings);
        setSettings(updated);
        toast.success('Đã lưu cài đặt thông báo!');
      } catch (err) {
        console.error('Failed to update notification settings:', err);
        toast.error('Không thể cập nhật cài đặt, vui lòng thử lại');
      }
    },
    []
  );

  // Toast handlers
  const dismissToast = useCallback((toastId: string) => {
    setFloatingToasts((prev) => prev.filter((t) => t.id !== toastId));
  }, []);

  const selectToast = useCallback(
    (item: NotificationItem) => {
      void markAsRead(item.id, item.target?.url);
    },
    [markAsRead]
  );

  // 7. WebSocket Setup
  useEffect(() => {
    if (!isAuthenticated) {
      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }
      return;
    }

    // Initial API loads
    void refreshUnreadCount();
    void fetchInitialNotifications();
    void fetchSettings();

    let isMounted = true;

    const connectWebSocket = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      if (socketRef.current) {
        socketRef.current.close();
      }

      const host = window.location.hostname || 'localhost';
      const defaultWsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${host}:8081/ws?token=${token}`;
      const wsUrl = import.meta.env.VITE_WS_URL ? `${import.meta.env.VITE_WS_URL}?token=${token}` : defaultWsUrl;

      try {
        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const frame: WebSocketFrame<RealtimeNotificationPayload> = JSON.parse(event.data);
            if (frame.type === 'notification.new' && frame.payload) {
              const raw = (frame.payload || {}) as unknown as Record<string, unknown>;

              // Robust normalization for both snake_case & camelCase
              const notifId =
                (raw.notification_id as string) ||
                (raw.notificationId as string) ||
                (raw.id as string) ||
                `notif-${Date.now()}`;

              const notifType = (
                (raw.notif_type as string) ||
                (raw.notifType as string) ||
                (raw.type as string) ||
                'POST_REACTED'
              ) as NotificationType;

              const actorCount =
                typeof raw.actor_count === 'number'
                  ? raw.actor_count
                  : typeof raw.actorCount === 'number'
                  ? raw.actorCount
                  : 1;

              const rawActors =
                (raw.latest_actors as unknown[]) ||
                (raw.latestActors as unknown[]) ||
                [];

              const latestActors: ActorSummary[] = Array.isArray(rawActors)
                ? rawActors.map((a) => {
                    const actorObj = a as Record<string, unknown>;
                    return {
                      id: (actorObj.id as string) || '',
                      displayName:
                        (actorObj.displayName as string) ||
                        (actorObj.display_name as string) ||
                        (actorObj.name as string) ||
                        (actorObj.username as string) ||
                        'Người dùng',
                      avatarUrl:
                        (actorObj.avatarUrl as string) ||
                        (actorObj.avatar_url as string) ||
                        null,
                    };
                  })
                : [];

              const rawTarget = (raw.target || {}) as Record<string, unknown>;
              const target: NotificationTarget = {
                type: (rawTarget.type as string) || 'POST',
                id: (rawTarget.id as string) || '',
                url: (rawTarget.url as string) || `/posts/${rawTarget.id || ''}`,
                thumbnailUrl:
                  (rawTarget.thumbnailUrl as string) ||
                  (rawTarget.thumbnail_url as string) ||
                  null,
              };

              const previewText =
                (raw.preview_text as string) ||
                (raw.previewText as string) ||
                (raw.message as string) ||
                (raw.content as string) ||
                (latestActors[0]?.displayName
                  ? `${latestActors[0].displayName} đã tương tác với bạn.`
                  : 'Bạn có thông báo mới.');

              const unreadCountVal =
                typeof raw.unread_count === 'number'
                  ? (raw.unread_count as number)
                  : typeof raw.unreadCount === 'number'
                  ? (raw.unreadCount as number)
                  : undefined;

              const pushAllowed =
                raw.push_allowed !== undefined
                  ? Boolean(raw.push_allowed)
                  : raw.pushAllowed !== undefined
                  ? Boolean(raw.pushAllowed)
                  : true;

              // 1. Update unread badge counter
              if (typeof unreadCountVal === 'number') {
                setUnreadCount(unreadCountVal);
              } else {
                setUnreadCount((prev) => prev + 1);
              }

              // 2. Construct clean NotificationItem
              const newItem: NotificationItem = {
                id: notifId,
                type: notifType,
                actorCount,
                latestActors,
                previewText,
                target,
                isRead: false,
                updatedAt: new Date().toISOString(),
              };

              // 3. Prepend / replace in list
              setNotifications((prev) => [
                newItem,
                ...prev.filter((it) => it.id !== newItem.id),
              ]);

              // 4. Play audio chime sound
              playNotificationSound();

              // 5. Spawn Facebook-style bottom-right floating toast
              if (pushAllowed) {
                const toastId = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
                const newToast: FloatingToast = {
                  id: toastId,
                  item: newItem,
                  createdAt: Date.now(),
                };

                setFloatingToasts((prev) => [newToast, ...prev.slice(0, 2)]);

                // Auto-dismiss after 6.5 seconds
                setTimeout(() => {
                  if (isMounted) {
                    setFloatingToasts((prev) => prev.filter((t) => t.id !== toastId));
                  }
                }, 6500);
              }
            }
          } catch (e) {
            console.error('Error parsing notification WebSocket message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            if (isMounted && isAuthenticated) {
              connectWebSocket();
            }
          }, delay);
        };

        ws.onerror = () => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.close();
          }
        };
      } catch (err) {
        console.error('Error initiating notification WebSocket:', err);
      }
    };

    connectWebSocket();

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [isAuthenticated, refreshUnreadCount, fetchInitialNotifications, fetchSettings]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        isLoading,
        isLoadingMore,
        hasMore,
        nextCursor,
        settings,
        isSettingsOpen,
        setIsSettingsOpen,
        fetchInitialNotifications,
        loadMore,
        markAsRead,
        markAllAsRead,
        refreshUnreadCount,
        fetchSettings,
        updateSettings,
      }}
    >
      {children}

      {/* Realtime Bottom-Right Facebook-style Notification Toasts */}
      <NotificationToastContainer
        toasts={floatingToasts}
        onDismiss={dismissToast}
        onSelect={selectToast}
      />
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
