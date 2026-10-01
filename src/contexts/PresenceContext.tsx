import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
  type ReactNode,
} from 'react';
import type {
  UserPresence,
  PresenceStatus,
} from '../types';
import { presenceService } from '../services/presenceService';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';

interface PresenceContextType {
  isConnected: boolean;
  presenceMap: Record<string, UserPresence>;
  getPresence: (userId?: string | null) => UserPresence | undefined;
  isOnline: (userId?: string | null) => boolean;
  getStatus: (userId?: string | null) => PresenceStatus;
  subscribeUsers: (userIds: string[]) => void;
  unsubscribeUsers: (userIds: string[]) => void;
  sendHeartbeat: (status?: PresenceStatus, customStatus?: string) => void;
  formatLastSeen: (epochSeconds?: number | null) => string;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user: currentUser } = useAuth();
  const { language } = useLanguage();

  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [presenceMap, setPresenceMap] = useState<Record<string, UserPresence>>({});

  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatTimerRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reconnectAttemptsRef = useRef<number>(0);

  // Client status & 5-minute idle/away timer
  const currentStatusRef = useRef<PresenceStatus>('online');
  const awayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const IDLE_AWAY_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

  // Ref counts for user subscriptions to manage viewport lifecycle
  const subscriptionCountsRef = useRef<Map<string, number>>(new Map());
  const activeSubscribedSetRef = useRef<Set<string>>(new Set());
  const pendingBatchQueueRef = useRef<Set<string>>(new Set());
  const batchTimerRef = useRef<number | null>(null);

  // Safe WebSocket message sender
  const send = useCallback((type: string, payload: unknown = {}) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      try {
        wsRef.current.send(JSON.stringify({ type, payload }));
      } catch (err) {
        console.error('[Presence] Failed to send WS frame:', err);
      }
    }
  }, []);

  // Send Heartbeat (Online / Away / Custom Status)
  const sendHeartbeat = useCallback(
    (status: PresenceStatus = currentStatusRef.current, customStatus?: string) => {
      send('presence.heartbeat', { status, custom_status: customStatus });
    },
    [send]
  );

  // Flush pending subscriptions to WebSocket
  const flushSubscribeQueue = useCallback(() => {
    if (pendingBatchQueueRef.current.size === 0) return;

    const toSubscribe = Array.from(pendingBatchQueueRef.current);
    pendingBatchQueueRef.current.clear();

    toSubscribe.forEach((id) => activeSubscribedSetRef.current.add(id));

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      send('presence.subscribe', { user_ids: toSubscribe });
    }

    // Also perform an initial REST batch fetch for users not yet in presenceMap
    const missingInState = toSubscribe.filter((id) => !presenceMap[id]);
    if (missingInState.length > 0) {
      presenceService
        .getBatchPresence(missingInState)
        .then((batchData) => {
          if (batchData && Object.keys(batchData).length > 0) {
            setPresenceMap((prev) => {
              const next = { ...prev };
              Object.entries(batchData).forEach(([uid, data]) => {
                next[uid] = {
                  userId: uid,
                  status: (data.status as PresenceStatus) || 'offline',
                  lastSeen: data.lastSeen,
                  customStatus: data.customStatus,
                };
              });
              return next;
            });
          }
        })
        .catch((err) => {
          console.warn('[Presence] Batch REST fetch fallback warning:', err);
        });
    }
  }, [send, presenceMap]);

  // Subscribe users (Viewport subscription)
  const subscribeUsers = useCallback(
    (userIds: string[]) => {
      if (!userIds || userIds.length === 0) return;

      let hasNew = false;
      userIds.forEach((id) => {
        if (!id || id === currentUser?.id) return;

        const currentCount = subscriptionCountsRef.current.get(id) || 0;
        subscriptionCountsRef.current.set(id, currentCount + 1);

        if (currentCount === 0 && !activeSubscribedSetRef.current.has(id)) {
          pendingBatchQueueRef.current.add(id);
          hasNew = true;
        }
      });

      if (hasNew) {
        if (batchTimerRef.current) {
          clearTimeout(batchTimerRef.current);
        }
        batchTimerRef.current = window.setTimeout(() => {
          flushSubscribeQueue();
        }, 50);
      }
    },
    [currentUser?.id, flushSubscribeQueue]
  );

  // Unsubscribe users
  const unsubscribeUsers = useCallback(
    (userIds: string[]) => {
      if (!userIds || userIds.length === 0) return;

      const toUnsubscribe: string[] = [];
      userIds.forEach((id) => {
        if (!id) return;
        const currentCount = subscriptionCountsRef.current.get(id) || 0;
        if (currentCount <= 1) {
          subscriptionCountsRef.current.delete(id);
          activeSubscribedSetRef.current.delete(id);
          pendingBatchQueueRef.current.delete(id);
          toUnsubscribe.push(id);
        } else {
          subscriptionCountsRef.current.set(id, currentCount - 1);
        }
      });

      if (toUnsubscribe.length > 0 && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        send('presence.unsubscribe', { user_ids: toUnsubscribe });
      }
    },
    [send]
  );

  // 1. Establish WebSocket Connection & 5-minute Away Handling
  useEffect(() => {
    if (!isAuthenticated) {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);
      return;
    }

    let isUnmounted = false;

    const connectWebSocket = () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      if (wsRef.current) {
        wsRef.current.close();
      }

      const isDevServer = window.location.port === '5173' || window.location.port === '3000';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const defaultWsUrl = isDevServer
        ? `${protocol}//${window.location.hostname}:8081/ws?token=${token}`
        : `${protocol}//${window.location.host}/ws?token=${token}`;
      const wsUrl = import.meta.env.VITE_WS_URL ? `${import.meta.env.VITE_WS_URL}?token=${token}` : defaultWsUrl;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;

          // Start Heartbeat interval every 25s sending active client status
          if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
          }
          heartbeatTimerRef.current = window.setInterval(() => {
            sendHeartbeat(currentStatusRef.current);
          }, 25000);

          // Immediately re-subscribe all active users tracked across components
          const allActiveIds = Array.from(activeSubscribedSetRef.current);
          if (allActiveIds.length > 0) {
            send('presence.subscribe', { user_ids: allActiveIds });
          }
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const frame = JSON.parse(event.data);

            // Snapshot response
            if (frame.type === 'presence.snapshot' && frame.payload) {
              const incomingPresences = frame.payload.presences || {};
              setPresenceMap((prev) => {
                const next = { ...prev };
                Object.values(incomingPresences).forEach((item: any) => {
                  const uid = item.user_id || item.userId;
                  if (uid) {
                    next[uid] = {
                      userId: uid,
                      status: (item.status as PresenceStatus) || 'offline',
                      lastSeen: item.last_seen ?? item.lastSeen ?? null,
                      customStatus: item.custom_status ?? item.customStatus ?? null,
                      updatedAt: item.updated_at ?? item.updatedAt ?? null,
                    };
                  }
                });
                return next;
              });
            }

            // Presence changed event
            if (frame.type === 'presence.changed' && frame.payload) {
              const { user_id, userId, status, last_seen, lastSeen, custom_status, customStatus } = frame.payload;
              const uid = user_id || userId;
              if (uid) {
                setPresenceMap((prev) => ({
                  ...prev,
                  [uid]: {
                    userId: uid,
                    status: (status as PresenceStatus) || 'offline',
                    lastSeen: last_seen ?? lastSeen ?? null,
                    customStatus: custom_status ?? customStatus ?? null,
                  },
                }));
              }
            }
          } catch (err) {
            console.error('[Presence] Error parsing WS frame:', err);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          setIsConnected(false);
          if (heartbeatTimerRef.current) {
            clearInterval(heartbeatTimerRef.current);
          }

          // Exponential backoff reconnect
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 30000);
          reconnectAttemptsRef.current += 1;

          reconnectTimeoutRef.current = setTimeout(() => {
            if (!isUnmounted && isAuthenticated) {
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
        console.error('[Presence] Connection initiation error:', err);
      }
    };

    connectWebSocket();

    // 5-Minute Inactivity & Tab Leaving Away Management
    const markUserActive = () => {
      if (awayTimeoutRef.current) {
        clearTimeout(awayTimeoutRef.current);
        awayTimeoutRef.current = null;
      }

      if (currentStatusRef.current === 'away') {
        currentStatusRef.current = 'online';
        sendHeartbeat('online');
      }

      // Schedule transition to away after 5 minutes of continuous inactivity
      awayTimeoutRef.current = setTimeout(() => {
        currentStatusRef.current = 'away';
        sendHeartbeat('away');
      }, IDLE_AWAY_TIMEOUT_MS);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // When tab is hidden, wait 5 minutes before transitioning to away
        if (!awayTimeoutRef.current) {
          awayTimeoutRef.current = setTimeout(() => {
            currentStatusRef.current = 'away';
            sendHeartbeat('away');
          }, IDLE_AWAY_TIMEOUT_MS);
        }
      } else {
        // When tab becomes visible again, mark user active immediately
        markUserActive();
      }
    };

    const handleUserActivity = () => {
      if (!document.hidden) {
        markUserActive();
      }
    };

    // Initialize activity schedule
    markUserActive();

    window.addEventListener('mousemove', handleUserActivity, { passive: true });
    window.addEventListener('keydown', handleUserActivity, { passive: true });
    window.addEventListener('touchstart', handleUserActivity, { passive: true });
    window.addEventListener('scroll', handleUserActivity, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isUnmounted = true;
      window.removeEventListener('mousemove', handleUserActivity);
      window.removeEventListener('keydown', handleUserActivity);
      window.removeEventListener('touchstart', handleUserActivity);
      window.removeEventListener('scroll', handleUserActivity);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (awayTimeoutRef.current) clearTimeout(awayTimeoutRef.current);
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [isAuthenticated, send, sendHeartbeat]);

  // Query presence helpers
  const getPresence = useCallback(
    (userId?: string | null): UserPresence | undefined => {
      if (!userId) return undefined;
      return presenceMap[userId];
    },
    [presenceMap]
  );

  const isOnline = useCallback(
    (userId?: string | null): boolean => {
      if (!userId) return false;
      return presenceMap[userId]?.status === 'online';
    },
    [presenceMap]
  );

  const getStatus = useCallback(
    (userId?: string | null): PresenceStatus => {
      if (!userId) return 'offline';
      return presenceMap[userId]?.status || 'offline';
    },
    [presenceMap]
  );

  const formatLastSeenHelper = useCallback(
    (epochSeconds?: number | null) => {
      return presenceService.formatLastSeen(epochSeconds, language);
    },
    [language]
  );

  const value = useMemo(
    () => ({
      isConnected,
      presenceMap,
      getPresence,
      isOnline,
      getStatus,
      subscribeUsers,
      unsubscribeUsers,
      sendHeartbeat,
      formatLastSeen: formatLastSeenHelper,
    }),
    [
      isConnected,
      presenceMap,
      getPresence,
      isOnline,
      getStatus,
      subscribeUsers,
      unsubscribeUsers,
      sendHeartbeat,
      formatLastSeenHelper,
    ]
  );

  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export function usePresence() {
  const context = useContext(PresenceContext);
  if (!context) {
    throw new Error('usePresence must be used within a PresenceProvider');
  }
  return context;
}

/**
 * Custom hook to subscribe and watch presence of a single user
 */
export function useUserPresence(userId?: string | null, enabled: boolean = true) {
  const { getPresence, isOnline, getStatus, subscribeUsers, unsubscribeUsers, formatLastSeen } =
    usePresence();

  useEffect(() => {
    if (!userId || !enabled) return;

    subscribeUsers([userId]);

    return () => {
      unsubscribeUsers([userId]);
    };
  }, [userId, enabled, subscribeUsers, unsubscribeUsers]);

  const presence = userId ? getPresence(userId) : undefined;
  const userIsOnline = userId ? isOnline(userId) : false;
  const status = userId ? getStatus(userId) : 'offline';
  const lastSeenText = presence?.lastSeen ? formatLastSeen(presence.lastSeen) : undefined;

  return {
    presence,
    isOnline: userIsOnline,
    status,
    lastSeenText,
  };
}

/**
 * Custom hook to subscribe and watch presence of a list of users
 */
export function useBatchPresence(userIds: string[], enabled: boolean = true) {
  const { presenceMap, getPresence, isOnline, getStatus, subscribeUsers, unsubscribeUsers } =
    usePresence();

  useEffect(() => {
    if (!enabled || !userIds || userIds.length === 0) return;

    subscribeUsers(userIds);

    return () => {
      unsubscribeUsers(userIds);
    };
  }, [userIds, enabled, subscribeUsers, unsubscribeUsers]);

  return {
    presenceMap,
    getPresence,
    isOnline,
    getStatus,
  };
}
