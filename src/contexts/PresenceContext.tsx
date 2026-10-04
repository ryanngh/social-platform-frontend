import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import type { PresenceStatus, UserPresence } from '../types';
interface PresenceContextType {
  isConnected: boolean; presenceMap: Record<string, UserPresence>;
  getPresence: (id?: string | null) => UserPresence | undefined;
  isOnline: (id?: string | null) => boolean; getStatus: (id?: string | null) => PresenceStatus;
  subscribeUsers: (ids: string[]) => void; unsubscribeUsers: (ids: string[]) => void;
  sendHeartbeat: (status?: PresenceStatus, customStatus?: string) => void;
  formatLastSeen: (timestamp?: number | null) => string;
}
const PresenceContext = createContext<PresenceContextType | undefined>(undefined);
export function PresenceProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuth();
  const [isConnected, setConnected] = useState(false); const [presenceMap, setPresences] = useState<Record<string, UserPresence>>({});
  const socket = useRef<WebSocket | null>(null); const subscriptions = useRef(new Map<string, number>());
  const send = useCallback((type: string, payload: unknown = {}) => { if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify({ type, payload })); }, []);
  const refresh = useCallback(() => { const userIds = [...subscriptions.current.keys()]; if (userIds.length) send('presence.subscribe', { user_ids: userIds }); }, [send]);
  const sendHeartbeat = useCallback(() => send('presence.heartbeat', { status: 'online' }), [send]);
  const subscribeUsers = useCallback((ids: string[]) => {
    const added: string[] = [];
    for (const id of ids) { if (!id || id === user?.id) continue; const count = subscriptions.current.get(id) || 0; subscriptions.current.set(id, count + 1); if (!count) added.push(id); }
    if (added.length) send('presence.subscribe', { user_ids: added });
  }, [send, user?.id]);
  const unsubscribeUsers = useCallback((ids: string[]) => { const removed: string[] = []; for (const id of ids) { const count = subscriptions.current.get(id) || 0; if (count <= 1) { subscriptions.current.delete(id); removed.push(id); } else subscriptions.current.set(id, count - 1); } if (removed.length) send('presence.unsubscribe', { user_ids: removed }); }, [send]);
  useEffect(() => {
    if (!isAuthenticated) { setPresences({}); setConnected(false); return; }
    let disposed = false; let reconnect: ReturnType<typeof setTimeout>; let timer: ReturnType<typeof setInterval>; let attempts = 0;
    const connect = () => {
      const token = localStorage.getItem('accessToken'); if (!token || disposed) return;
      const base = import.meta.env.VITE_WS_URL || `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws`;
      const ws = new WebSocket(`${base}${base.includes('?') ? '&' : '?'}token=${encodeURIComponent(token)}`); socket.current = ws;
      ws.onopen = () => { if (disposed) return; attempts = 0; setConnected(true); sendHeartbeat(); refresh(); timer = setInterval(() => { sendHeartbeat(); send('presence.query', { user_ids: [...subscriptions.current.keys()] }); }, 30000); };
      ws.onmessage = event => {
        if (disposed) return;
        try {
          const frame = JSON.parse(event.data);
          if (frame.type === 'presence.snapshot') {
            const incoming = frame.payload?.presences || {};
            setPresences(prev => { const next = { ...prev }; for (const [id, item] of Object.entries(incoming) as [string, { status?: string }][]) { next[id] = { userId: id, status: item?.status === 'online' ? 'online' : 'offline' }; } return next; });
          } else if (frame.type === 'presence.changed') { const item = frame.payload; const id = item?.user_id || item?.userId; if (id) setPresences(prev => ({ ...prev, [id]: { userId: id, status: item.status === 'online' ? 'online' : 'offline' } })); }
          else if (frame.type === 'relationship.changed' || frame.type === 'account.changed') { refresh(); window.dispatchEvent(new Event('relationships-changed')); }
        } catch { /* Ignore malformed frames. */ }
      };
      ws.onclose = event => { if (disposed) return; if(event.code===4401) {window.dispatchEvent(new Event('auth-revoked'));setConnected(false);setPresences({});clearInterval(timer);return;} setConnected(false); setPresences({}); clearInterval(timer); reconnect = setTimeout(connect, Math.min(1000 * 2 ** attempts++, 30000)); };
      ws.onerror = () => ws.close();
    };
    const focus = () => { if (document.hidden) return; sendHeartbeat(); refresh(); };
    connect(); window.addEventListener('focus', focus); document.addEventListener('visibilitychange', focus); window.addEventListener('relationships-changed', refresh);
    return () => { disposed = true; clearTimeout(reconnect); clearInterval(timer); window.removeEventListener('focus', focus); document.removeEventListener('visibilitychange', focus); window.removeEventListener('relationships-changed', refresh); socket.current?.close(); socket.current = null; };
  }, [isAuthenticated, user?.id, send, sendHeartbeat, refresh]);
  const getPresence = useCallback((id?: string | null) => id ? presenceMap[id] : undefined, [presenceMap]);
  const getStatus = useCallback((id?: string | null): PresenceStatus => isConnected && id && presenceMap[id]?.status === 'online' ? 'online' : 'offline', [isConnected, presenceMap]);
  const isOnline = useCallback((id?: string | null) => getStatus(id) === 'online', [getStatus]);
  const value = useMemo(() => ({ isConnected, presenceMap, getPresence, getStatus, isOnline, subscribeUsers, unsubscribeUsers, sendHeartbeat, formatLastSeen: () => '' }), [isConnected, presenceMap, getPresence, getStatus, isOnline, subscribeUsers, unsubscribeUsers, sendHeartbeat]);
  return <PresenceContext.Provider value={value}>{children}</PresenceContext.Provider>;
}
export function usePresence() { const value = useContext(PresenceContext); if (!value) throw new Error('PresenceProvider is required'); return value; }
export function useUserPresence(id?: string | null, enabled = true) {
  const { getStatus, getPresence, subscribeUsers, unsubscribeUsers } = usePresence();
  useEffect(() => { if (!id || !enabled) return; subscribeUsers([id]); return () => unsubscribeUsers([id]); }, [id, enabled, subscribeUsers, unsubscribeUsers]);
  const status = getStatus(id); return { status, isOnline: status === 'online', lastSeenText: '', lastSeen: getPresence(id)?.lastSeen, customStatus: undefined };
}
