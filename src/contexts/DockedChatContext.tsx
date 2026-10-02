import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useChat } from './ChatContext';
import chatSocket from '../services/chatSocket';
import type { UserSummary } from '../types';

interface DockedChatContextType {
  dockedChatIds: string[];
  minimizedChatIds: Set<string>;
  openMiniChat: (conversationId: string) => void;
  openMiniChatWithUser: (userId: string, partnerProfile?: Partial<UserSummary>) => Promise<string>;
  closeMiniChat: (conversationId: string) => void;
  minimizeMiniChat: (conversationId: string) => void;
  expandMiniChat: (conversationId: string) => void;
  toggleMinimizeMiniChat: (conversationId: string) => void;
  closeAllMiniChats: () => void;
  isChatDocked: (conversationId: string) => boolean;
}

const STORAGE_KEY_PREFIX = 'rysocial_docked_chats';
const MAX_DOCKED_CHATS = 3;

const DockedChatContext = createContext<DockedChatContextType | undefined>(undefined);

export const DockedChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const { startOrOpenDM } = useChat();

  const userStorageKey = user?.id ? `${STORAGE_KEY_PREFIX}_${user.id}` : STORAGE_KEY_PREFIX;

  const [dockedChatIds, setDockedChatIds] = useState<string[]>(() => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return [];
      const saved = sessionStorage.getItem(userStorageKey) || sessionStorage.getItem(STORAGE_KEY_PREFIX);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, MAX_DOCKED_CHATS);
      }
    } catch {}
    return [];
  });

  const [minimizedChatIds, setMinimizedChatIds] = useState<Set<string>>(new Set());

  // Clear docked chats when user is unauthenticated / logged out
  useEffect(() => {
    if (!isAuthenticated) {
      setDockedChatIds([]);
      setMinimizedChatIds(new Set());
      try {
        sessionStorage.removeItem(userStorageKey);
        sessionStorage.removeItem(STORAGE_KEY_PREFIX);
      } catch {}
    }
  }, [isAuthenticated, userStorageKey]);

  // Save docked chat ids to sessionStorage when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;
    try {
      sessionStorage.setItem(userStorageKey, JSON.stringify(dockedChatIds));
    } catch {}
  }, [dockedChatIds, isAuthenticated, userStorageKey]);

  const openMiniChat = useCallback((conversationId: string) => {
    if (!conversationId) return;

    setDockedChatIds((prev) => {
      // If already open, bring it to the end and un-minimize it
      if (prev.includes(conversationId)) {
        setMinimizedChatIds((minPrev) => {
          const next = new Set(minPrev);
          next.delete(conversationId);
          return next;
        });
        return [...prev.filter((id) => id !== conversationId), conversationId];
      }

      // If already at MAX_DOCKED_CHATS, drop the oldest one
      const updated = prev.length >= MAX_DOCKED_CHATS ? [...prev.slice(1), conversationId] : [...prev, conversationId];
      return updated;
    });

    // Make sure it is not minimized
    setMinimizedChatIds((prev) => {
      if (prev.has(conversationId)) {
        const next = new Set(prev);
        next.delete(conversationId);
        return next;
      }
      return prev;
    });
  }, []);

  // Automatically open or show docked chat window when an incoming message arrives
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = chatSocket.on('message.new', (payload) => {
      const myId = user?.id;
      if (myId && payload.sender_id !== myId) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/messages')) {
          openMiniChat(payload.conversation_id);
        }
      }
    });
    return unsub;
  }, [isAuthenticated, user?.id, openMiniChat]);

  const openMiniChatWithUser = useCallback(
    async (userId: string, partnerProfile?: Partial<UserSummary>): Promise<string> => {
      try {
        const convId = await startOrOpenDM(userId, partnerProfile);
        if (convId) {
          openMiniChat(convId);
        }
        return convId;
      } catch (err) {
        console.error('Failed to open mini chat with user:', err);
        return '';
      }
    },
    [startOrOpenDM, openMiniChat]
  );

  const closeMiniChat = useCallback((conversationId: string) => {
    setDockedChatIds((prev) => prev.filter((id) => id !== conversationId));
    setMinimizedChatIds((prev) => {
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  const minimizeMiniChat = useCallback((conversationId: string) => {
    setMinimizedChatIds((prev) => new Set(prev).add(conversationId));
  }, []);

  const expandMiniChat = useCallback((conversationId: string) => {
    setMinimizedChatIds((prev) => {
      const next = new Set(prev);
      next.delete(conversationId);
      return next;
    });
  }, []);

  const toggleMinimizeMiniChat = useCallback((conversationId: string) => {
    setMinimizedChatIds((prev) => {
      const next = new Set(prev);
      if (next.has(conversationId)) {
        next.delete(conversationId);
      } else {
        next.add(conversationId);
      }
      return next;
    });
  }, []);

  const closeAllMiniChats = useCallback(() => {
    setDockedChatIds([]);
    setMinimizedChatIds(new Set());
  }, []);

  const isChatDocked = useCallback(
    (conversationId: string) => dockedChatIds.includes(conversationId),
    [dockedChatIds]
  );

  return (
    <DockedChatContext.Provider
      value={{
        dockedChatIds,
        minimizedChatIds,
        openMiniChat,
        openMiniChatWithUser,
        closeMiniChat,
        minimizeMiniChat,
        expandMiniChat,
        toggleMinimizeMiniChat,
        closeAllMiniChats,
        isChatDocked,
      }}
    >
      {children}
    </DockedChatContext.Provider>
  );
};

export const useDockedChat = (): DockedChatContextType => {
  const context = useContext(DockedChatContext);
  if (!context) {
    throw new Error('useDockedChat must be used within a DockedChatProvider');
  }
  return context;
};

export default DockedChatContext;
