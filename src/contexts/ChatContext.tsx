import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import chatService from '../services/chatService';
import chatSocket from '../services/chatSocket';
import { userService } from '../services/userService';
import { presenceService } from '../services/presenceService';
import { playMessageSound } from '../utils/sound';
import { getMediaUrl } from '../utils/media';
import { generateUUID } from '../utils/uuid';
import type {
  ChatMessage,
  ChatConversationItem,
  ConversationResponse,
  WSConnectionState,
  MediaType,
} from '../types/chat';
import type { UserSummary, User } from '../types';

interface ChatContextType {
  conversations: ChatConversationItem[];
  activeConversationId: string | null;
  activeConversation: ChatConversationItem | null;
  messages: ChatMessage[];
  isLoadingConversations: boolean;
  isLoadingMessages: boolean;
  isLoadingOlder: boolean;
  hasMoreOlderMessages: boolean;
  connectionState: WSConnectionState;
  typingUsers: Set<string>;
  rateLimitCooldown: number; // Cooldown seconds remaining
  unreadTotal: number;

  // Actions
  selectConversation: (id: string) => void;
  startOrOpenDM: (partnerUserId: string, partnerProfile?: Partial<UserSummary>) => Promise<string>;
  createGroup: (title: string, memberIds: string[]) => Promise<string>;
  sendMessage: (
    body: string,
    replyToId?: number | null,
    mediaType?: MediaType,
    mediaUrl?: string,
    attachmentId?: string,
    fileName?: string,
    fileSize?: number,
    audioDuration?: string
  ) => Promise<string | null>;
  uploadAndSendAttachment: (
    file: File | Blob,
    customFileName?: string,
    caption?: string,
    replyToId?: number | null,
    onProgress?: (percent: number) => void
  ) => Promise<string | null>;
  retryMessage: (clientMsgId: string) => Promise<void>;
  editMessage: (messageId: number, newBody: string) => Promise<void>;
  deleteMessage: (messageId: number) => Promise<void>;
  clearHistory: (conversationId?: string) => Promise<void>;
  loadOlderMessages: () => Promise<void>;
  markAsRead: (conversationId?: string) => void;
  sendTyping: () => void;
  addMemberToGroup: (userId: string, role?: 'ADMIN' | 'MEMBER') => Promise<void>;
  removeMemberFromGroup: (userId: string) => Promise<void>;
  leaveGroup: (conversationId?: string) => Promise<void>;
  reconnectWs: () => void;
}

export const inferMediaTypeAndUrl = (body?: string) => {
  if (!body) return { mediaType: 'TEXT' as MediaType, mediaUrl: undefined, cleanBody: '', fileName: undefined };
  const trimmed = body.trim();
  if (!trimmed) return { mediaType: 'TEXT' as MediaType, mediaUrl: undefined, cleanBody: '', fileName: undefined };

  // Check if body starts with a media URL or contains a media URL on the first line with caption after
  const newlineIdx = trimmed.indexOf('\n');
  const firstLine = newlineIdx !== -1 ? trimmed.slice(0, newlineIdx).trim() : trimmed;
  const caption = newlineIdx !== -1 ? trimmed.slice(newlineIdx + 1).trim() : '';

  const isUrlLike =
    firstLine.startsWith('http://') ||
    firstLine.startsWith('https://') ||
    firstLine.startsWith('blob:') ||
    firstLine.startsWith('/social-media/') ||
    firstLine.startsWith('chat/attachments/');

  if (isUrlLike) {
    const resolvedUrl = getMediaUrl(firstLine);
    const cleanUrl = firstLine.split('?')[0].toLowerCase();

    // 1. Inspect query parameters if present (e.g., ?type=IMAGE&name=foo.jpg)
    let explicitType: MediaType | null = null;
    let explicitName: string | null = null;
    if (firstLine.includes('?')) {
      try {
        const queryStr = firstLine.split('?')[1];
        const params = new URLSearchParams(queryStr);
        const tParam = params.get('type')?.toUpperCase();
        if (tParam === 'IMAGE' || tParam === 'VIDEO' || tParam === 'AUDIO' || tParam === 'FILE') {
          explicitType = tParam as MediaType;
        }
        const nParam = params.get('name');
        if (nParam) {
          explicitName = decodeURIComponent(nParam);
        }
      } catch {}
    }

    if (explicitType) {
      return {
        mediaType: explicitType,
        mediaUrl: resolvedUrl,
        cleanBody: caption,
        fileName: explicitName || (explicitType === 'FILE' ? 'attachment' : undefined),
      };
    }

    // 2. Infer by filename extension if explicitName exists or from cleanUrl
    const testString = explicitName ? explicitName.toLowerCase() : cleanUrl;

    if (
      testString.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp|jfif|pjpeg|pjp|avif)$/i) ||
      cleanUrl.includes('/images/')
    ) {
      return { mediaType: 'IMAGE' as MediaType, mediaUrl: resolvedUrl, cleanBody: caption, fileName: explicitName || undefined };
    }
    if (
      testString.match(/\.(mp4|webm|mov|mkv|ogg|avi|wmv|3gp|flv)$/i) ||
      cleanUrl.includes('/videos/')
    ) {
      return { mediaType: 'VIDEO' as MediaType, mediaUrl: resolvedUrl, cleanBody: caption, fileName: explicitName || undefined };
    }
    if (
      testString.match(/\.(mp3|wav|ogg|m4a|aac|weba|flac|wma)$/i) ||
      cleanUrl.includes('/audios/') ||
      cleanUrl.includes('voice_')
    ) {
      return { mediaType: 'AUDIO' as MediaType, mediaUrl: resolvedUrl, cleanBody: caption, fileName: explicitName || undefined };
    }
    if (
      testString.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|zip|rar|tar|gz|txt|csv|json|xml|html|js|ts)$/i) ||
      cleanUrl.includes('chat/attachments/')
    ) {
      const urlSegments = cleanUrl.split('/');
      const rawName = urlSegments[urlSegments.length - 1] || 'attachment';
      const extractedFileName = explicitName || decodeURIComponent(rawName);
      return {
        mediaType: 'FILE' as MediaType,
        mediaUrl: resolvedUrl,
        cleanBody: caption,
        fileName: extractedFileName,
      };
    }
  }

  return { mediaType: 'TEXT' as MediaType, mediaUrl: undefined, cleanBody: body, fileName: undefined };
};

const formatChatMessage = (m: any, currentUserId: string): ChatMessage => {
  const mediaInfo = inferMediaTypeAndUrl(m.body);
  return {
    id: m.id,
    conversationId: m.conversation_id,
    seq: m.seq,
    senderId: m.sender_id,
    clientMsgId: m.client_msg_id || `srv-${m.id || m.seq}`,
    body: mediaInfo.cleanBody,
    replyToId: m.reply_to_id,
    createdAt: m.created_at,
    editedAt: m.edited_at,
    isDeleted: m.is_deleted,
    status: 'SENT',
    isMine: m.sender_id === currentUserId,
    mediaType: mediaInfo.mediaType,
    mediaUrl: mediaInfo.mediaUrl,
    fileName: mediaInfo.fileName,
  };
};

const getMyUserId = (userObj?: Partial<UserSummary> | User | null): string => {
  if (userObj?.id) return userObj.id;
  try {
    const token = localStorage.getItem('accessToken');
    if (token) {
      const parts = token.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload?.sub) return payload.sub;
      }
    }
  } catch {}
  return '';
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();

  const [conversations, setConversations] = useState<ChatConversationItem[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
  const [connectionState, setConnectionState] = useState<WSConnectionState>('DISCONNECTED');
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);

  const localLastSeqRef = useRef<number>(0);
  const oldestSeqRef = useRef<number>(0);
  const typingTimerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTypingSentTimeRef = useRef<number>(0);
  const userProfileCacheRef = useRef<Map<string, Partial<UserSummary>>>(new Map());

  const currentUserId = getMyUserId(user) || 'me';

  // Total unread distance
  const unreadTotal = useMemo(() => {
    return conversations.reduce((sum, c) => sum + (c.unreadSeqDistance > 0 ? c.unreadSeqDistance : 0), 0);
  }, [conversations]);

  // Active conversation object
  const activeConversation = useMemo(() => {
    if (!activeConversationId) return null;
    return conversations.find((c) => c.id === activeConversationId) || null;
  }, [conversations, activeConversationId]);

  // Sync connection state with socket manager
  useEffect(() => {
    const unsub = chatSocket.onStateChange((state) => {
      setConnectionState(state);
    });
    return unsub;
  }, []);

  // Connect socket on authentication
  useEffect(() => {
    if (isAuthenticated) {
      chatSocket.connect();
    } else {
      chatSocket.disconnect();
      setConversations([]);
      setMessages([]);
      setActiveConversationId(null);
    }
  }, [isAuthenticated]);

  // Rate limit cooldown countdown timer
  useEffect(() => {
    if (rateLimitCooldown <= 0) return;
    const timer = setInterval(() => {
      setRateLimitCooldown((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitCooldown]);

  // Helper to resolve partner user ID from DM key
  const getPartnerIdFromDM = useCallback(
    (dmKey?: string | null, createdBy?: string) => {
      const myId = getMyUserId(user);
      if (dmKey && dmKey.includes(':')) {
        const parts = dmKey.split(':').map((p) => p.trim());
        if (parts.length === 2) {
          if (myId) {
            if (parts[0].toLowerCase() === myId.toLowerCase()) {
              return parts[1];
            }
            if (parts[1].toLowerCase() === myId.toLowerCase()) {
              return parts[0];
            }
          }
          if (createdBy) {
            return parts[0].toLowerCase() === createdBy.toLowerCase() ? parts[1] : parts[0];
          }
          return parts[1];
        }
      }
      return createdBy || 'partner';
    },
    [user]
  );

  // Helper to fetch user summary with caching
  const fetchUserProfile = useCallback(async (userId: string): Promise<Partial<UserSummary> | null> => {
    if (!userId || userId === 'me') return null;
    if (userProfileCacheRef.current.has(userId)) {
      return userProfileCacheRef.current.get(userId)!;
    }
    try {
      const u = await userService.getUserByIdentifier(userId);
      const summary: Partial<UserSummary> = {
        id: u.id,
        username: u.username,
        firstName: u.firstName,
        lastName: u.lastName,
        avatarUrl: u.avatarUrl,
      };
      userProfileCacheRef.current.set(userId, summary);
      return summary;
    } catch {
      return null;
    }
  }, []);

  // Transform raw REST conversation to ChatConversationItem
  const transformConversation = useCallback(
    async (raw: ConversationResponse): Promise<ChatConversationItem> => {
      const isGroup = raw.type === 'GROUP';
      let displayName = raw.title || 'Nhóm trò chuyện';
      let avatarUrl: string | undefined = undefined;
      let partner: ChatConversationItem['partner'] = undefined;
      let isOnline = false;
      let lastActiveText: string | undefined = undefined;

      if (!isGroup) {
        const partnerId = getPartnerIdFromDM(raw.dm_key, raw.created_by);
        const profile = await fetchUserProfile(partnerId);

        if (profile) {
          const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || 'Người dùng';
          displayName = fullName;
          avatarUrl = profile.avatarUrl || undefined;
          
          try {
            const presence = await presenceService.getPresence(partnerId);
            isOnline = presence.status === 'online';
            lastActiveText = presenceService.formatLastSeen(presence.lastSeen);
          } catch {
            isOnline = false;
          }

          partner = {
            id: profile.id || partnerId,
            username: profile.username || 'user',
            displayName: fullName,
            avatarUrl: profile.avatarUrl || undefined,
            isOnline,
            lastActive: lastActiveText,
          };
        } else {
          displayName = `Người dùng #${partnerId.slice(0, 6)}`;
        }
      }

      return {
        id: raw.id,
        type: raw.type,
        dmKey: raw.dm_key,
        title: raw.title,
        createdBy: raw.created_by,
        createdAt: raw.created_at,
        lastSeq: raw.last_seq,
        lastMessageAt: raw.last_message_at,
        unreadSeqDistance: raw.unread_seq_distance || 0,
        lastReadSeq: raw.last_read_seq || 0,
        clearedBeforeSeq: raw.cleared_before_seq || 0,
        displayName,
        avatarUrl,
        isOnline,
        lastActiveText,
        partner,
        lastMessagePreview: raw.last_message_at
          ? {
              text: raw.last_seq > 0 ? `Tin nhắn mới` : 'Chưa có tin nhắn',
              senderId: raw.created_by,
              senderName: raw.created_by === currentUserId ? 'Bạn' : displayName,
              timestamp: new Date(raw.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead: (raw.unread_seq_distance || 0) === 0,
            }
          : undefined,
      };
    },
    [currentUserId, fetchUserProfile, getPartnerIdFromDM]
  );

  // Load conversation list from REST API
  const transformConversationRef = useRef(transformConversation);
  useEffect(() => {
    transformConversationRef.current = transformConversation;
  }, [transformConversation]);

  const fetchConversations = useCallback(async () => {
    setIsLoadingConversations(true);
    try {
      const rawList = await chatService.getConversations({ limit: 50 });
      if (rawList && rawList.length > 0) {
        const enriched = await Promise.all(rawList.map((r) => transformConversationRef.current(r)));
        setConversations(enriched);
      } else {
        setConversations([]);
      }
    } catch (err) {
      console.warn('[ChatContext] Failed to load conversations from backend:', err);
      setConversations([]);
    } finally {
      setIsLoadingConversations(false);
    }
  }, []); // stable — uses ref internally

  useEffect(() => {
    if (isAuthenticated) {
      void fetchConversations();
    }
  }, [isAuthenticated, fetchConversations]);

  // Load messages when active conversation changes
  const fetchMessagesForActiveConversation = useCallback(
    async (convId: string) => {
      setIsLoadingMessages(true);
      setHasMoreOlderMessages(true);
      try {
        const rawMessages = await chatService.getMessages(convId, { limit: 50 });
        if (rawMessages && rawMessages.length > 0) {
          const formatted: ChatMessage[] = rawMessages.map((m) => formatChatMessage(m, currentUserId));

          setMessages(formatted);
          const maxSeq = Math.max(...formatted.map((m) => m.seq || 0));
          const minSeq = Math.min(...formatted.map((m) => m.seq || 0));
          localLastSeqRef.current = maxSeq;
          oldestSeqRef.current = minSeq;

          // Automatically mark read up to maxSeq
          if (maxSeq > 0) {
            chatSocket.sendRead(convId, maxSeq);
            void chatService.markRead(convId, maxSeq).catch(() => {});
          }
        } else {
          setMessages([]);
          localLastSeqRef.current = 0;
          oldestSeqRef.current = 0;
        }
      } catch (err) {
        console.warn('[ChatContext] Failed to load messages:', err);
        setMessages([]);
        localLastSeqRef.current = 0;
        oldestSeqRef.current = 0;
      } finally {
        setIsLoadingMessages(false);
      }
    },
    [currentUserId]
  );

  // Stable ref to check if conversation exists without adding it to dep array
  const conversationsRef = useRef(conversations);
  useEffect(() => {
    conversationsRef.current = conversations;
  }, [conversations]);

  useEffect(() => {
    if (activeConversationId) {
      void fetchMessagesForActiveConversation(activeConversationId);

      // If active conversation is not in local conversations list, fetch it (fire-and-forget)
      if (!conversationsRef.current.some((c) => c.id === activeConversationId)) {
        chatService
          .getConversation(activeConversationId)
          .then(async (details) => {
            if (details) {
              const enriched = await transformConversation(details);
              setConversations((prev) =>
                prev.some((c) => c.id === enriched.id) ? prev : [enriched, ...prev]
              );
            }
          })
          .catch((err) => {
            console.warn('[ChatContext] Failed to fetch missing conversation details:', err);
          });
      }
    } else {
      setMessages([]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConversationId, fetchMessagesForActiveConversation]);

  // Load older messages (Pagination / Infinite Scroll Up)
  const loadOlderMessages = useCallback(async () => {
    if (!activeConversationId || isLoadingOlder || !hasMoreOlderMessages) return;
    const oldestSeq = oldestSeqRef.current;
    if (oldestSeq <= 1) {
      setHasMoreOlderMessages(false);
      return;
    }

    setIsLoadingOlder(true);
    try {
      const olderRaw = await chatService.getMessages(activeConversationId, {
        before_seq: oldestSeq,
        limit: 30,
      });

      if (!olderRaw || olderRaw.length === 0) {
        setHasMoreOlderMessages(false);
      } else {
        const olderFormatted: ChatMessage[] = olderRaw.map((m) => formatChatMessage(m, currentUserId));

        setMessages((prev) => [...olderFormatted, ...prev]);
        const newMinSeq = Math.min(...olderFormatted.map((m) => m.seq || oldestSeq));
        oldestSeqRef.current = newMinSeq;
        if (newMinSeq <= 1 || olderRaw.length < 30) {
          setHasMoreOlderMessages(false);
        }
      }
    } catch (err) {
      console.warn('[ChatContext] Failed to load older messages:', err);
      setHasMoreOlderMessages(false);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [activeConversationId, currentUserId, hasMoreOlderMessages, isLoadingOlder]);

  // Select conversation handler
  const selectConversation = useCallback(
    (id: string) => {
      if (id === activeConversationId) return;
      setActiveConversationId(id);

      // Locally mark unread as 0
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === id) {
            return {
              ...c,
              unreadSeqDistance: 0,
              lastMessagePreview: c.lastMessagePreview
                ? { ...c.lastMessagePreview, isRead: true }
                : undefined,
            };
          }
          return c;
        })
      );
    },
    [activeConversationId]
  );

  // Mark read explicitly
  const markAsRead = useCallback(
    (convId?: string) => {
      const targetId = convId || activeConversationId;
      if (!targetId) return;

      const currentSeq = localLastSeqRef.current;
      if (currentSeq > 0) {
        chatSocket.sendRead(targetId, currentSeq);
        void chatService.markRead(targetId, currentSeq).catch(() => {});
      }

      setConversations((prev) =>
        prev.map((c) => (c.id === targetId ? { ...c, unreadSeqDistance: 0 } : c))
      );
    },
    [activeConversationId]
  );

  // Send message action
  const sendMessage = useCallback(
    async (
      body: string,
      replyToId?: number | null,
      mediaType: MediaType = 'TEXT',
      mediaUrl?: string,
      attachmentId?: string,
      fileName?: string,
      fileSize?: number,
      audioDuration?: string
    ): Promise<string | null> => {
      if (!activeConversationId) return null;
      const trimmed = body.trim();
      if (!trimmed && !mediaUrl) return null;

      // Rate limit check
      if (rateLimitCooldown > 0) {
        toast.error(`Bạn đang gửi tin nhắn quá nhanh, vui lòng chờ ${rateLimitCooldown}s!`);
        return null;
      }

      const clientMsgId = generateUUID();
      const optimisticMessage: ChatMessage = {
        conversationId: activeConversationId,
        senderId: currentUserId,
        senderName: 'Bạn',
        clientMsgId,
        body: trimmed,
        replyToId: replyToId ?? null,
        replyToMessage: replyToId
          ? (() => {
              const quoted = messages.find((m) => m.id === replyToId || m.seq === replyToId);
              return quoted
                ? { id: quoted.id || 0, senderName: quoted.senderName || 'Người dùng', body: quoted.body }
                : null;
            })()
          : null,
        createdAt: new Date().toISOString(),
        isDeleted: false,
        status: 'SENDING',
        isMine: true,
        mediaType,
        mediaUrl,
        attachmentId,
        fileName,
        fileSize,
        audioDuration,
      };

      // 1. Append optimistic message immediately
      setMessages((prev) => [...prev, optimisticMessage]);

      // 2. Update conversation preview
      const previewText =
        mediaType === 'IMAGE'
          ? (trimmed ? `Bạn: 📷 [Hình ảnh] ${trimmed}` : 'Bạn: 📷 [Hình ảnh]')
          : mediaType === 'VIDEO'
          ? (trimmed ? `Bạn: 🎥 [Video] ${trimmed}` : 'Bạn: 🎥 [Video]')
          : mediaType === 'AUDIO'
          ? 'Bạn: 🎤 [Tin nhắn thoại]'
          : mediaType === 'FILE'
          ? (trimmed ? `Bạn: 📎 ${fileName || 'Tệp đính kèm'}: ${trimmed}` : `Bạn: 📎 ${fileName || 'Tệp đính kèm'}`)
          : `Bạn: ${trimmed}`;

      setConversations((prev) =>
        prev.map((c) => {
          if (c.id === activeConversationId) {
            return {
              ...c,
              lastMessagePreview: {
                text: previewText,
                senderId: currentUserId,
                senderName: 'Bạn',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead: true,
              },
            };
          }
          return c;
        })
      );

      // 3. Construct message body to send: if media exists, send mediaUrl with caption
      const effectiveBodyToSend = mediaUrl
        ? (trimmed ? `${mediaUrl}\n${trimmed}` : mediaUrl)
        : trimmed;

      // Send via WebSocket if connected
      const sentViaWs = chatSocket.sendMessage(activeConversationId, clientMsgId, effectiveBodyToSend, replyToId);

      if (!sentViaWs) {
        // Fallback to REST API
        try {
          const res = await chatService.sendMessage(activeConversationId, {
            client_msg_id: clientMsgId,
            body: effectiveBodyToSend,
            reply_to_id: replyToId,
          });

          // Update message with REST ack
          setMessages((prev) =>
            prev.map((m) => {
              if (m.clientMsgId === clientMsgId) {
                return {
                  ...m,
                  id: res.id,
                  seq: res.seq,
                  createdAt: res.created_at,
                  status: 'SENT',
                };
              }
              return m;
            })
          );
          localLastSeqRef.current = Math.max(localLastSeqRef.current, res.seq);
        } catch (err: any) {
          console.warn('[ChatContext] REST fallback send failed:', err);
          const isRateLimit = err?.response?.status === 429;
          if (isRateLimit) {
            setRateLimitCooldown(5);
            toast.error('Bạn đang gửi tin nhắn quá nhanh, vui lòng thử lại sau vài giây!');
          }

          setMessages((prev) =>
            prev.map((m) => (m.clientMsgId === clientMsgId ? { ...m, status: 'FAILED' } : m))
          );
        }
      }

      return clientMsgId;
    },
    [activeConversationId, currentUserId, messages, rateLimitCooldown]
  );

  // Upload attachment and send as chat message
  const uploadAndSendAttachment = useCallback(
    async (
      file: File | Blob,
      customFileName?: string,
      caption?: string,
      replyToId?: number | null,
      onProgress?: (percent: number) => void
    ): Promise<string | null> => {
      if (!activeConversationId) return null;

      try {
        const result = await chatService.uploadChatAttachment(
          activeConversationId,
          file,
          customFileName,
          onProgress
        );

        return await sendMessage(
          caption || '',
          replyToId,
          result.mediaType,
          result.mediaUrl,
          result.id,
          result.fileName,
          result.fileSize
        );
      } catch (err: any) {
        console.error('[ChatContext] Upload attachment error:', err);
        toast.error('Không thể tải tệp lên, vui lòng thử lại!');
        throw err;
      }
    },
    [activeConversationId, sendMessage]
  );

  // Retry failed message
  const retryMessage = useCallback(
    async (clientMsgId: string) => {
      const msg = messages.find((m) => m.clientMsgId === clientMsgId);
      if (!msg || !activeConversationId) return;

      setMessages((prev) =>
        prev.map((m) => (m.clientMsgId === clientMsgId ? { ...m, status: 'SENDING' } : m))
      );

      const bodyToSend = msg.mediaUrl
        ? (msg.body ? `${msg.mediaUrl}\n${msg.body}` : msg.mediaUrl)
        : msg.body;

      const sentViaWs = chatSocket.sendMessage(activeConversationId, clientMsgId, bodyToSend, msg.replyToId);
      if (!sentViaWs) {
        try {
          const res = await chatService.sendMessage(activeConversationId, {
            client_msg_id: clientMsgId,
            body: bodyToSend,
            reply_to_id: msg.replyToId,
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMsgId === clientMsgId
                ? { ...m, id: res.id, seq: res.seq, createdAt: res.created_at, status: 'SENT' }
                : m
            )
          );
        } catch {
          setMessages((prev) =>
            prev.map((m) => (m.clientMsgId === clientMsgId ? { ...m, status: 'FAILED' } : m))
          );
        }
      }
    },
    [activeConversationId, messages]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: number, newBody: string) => {
      const trimmed = newBody.trim();
      if (!trimmed) return;

      try {
        await chatService.editMessage(messageId, trimmed);
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, body: trimmed, editedAt: new Date().toISOString() } : m))
        );
        toast.success('Đã sửa tin nhắn thành công');
      } catch (err: any) {
        console.error('Failed to edit message:', err);
        toast.error('Không thể sửa tin nhắn này!');
      }
    },
    []
  );

  // Delete / Soft unsend message
  const deleteMessage = useCallback(async (messageId: number) => {
    try {
      await chatService.deleteMessage(messageId);
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, isDeleted: true, body: '' } : m))
      );
      toast.success('Đã thu hồi tin nhắn');
    } catch (err: any) {
      console.error('Failed to delete message:', err);
      toast.error('Không thể thu hồi tin nhắn!');
    }
  }, []);

  // Clear conversation history
  const clearHistory = useCallback(
    async (convId?: string) => {
      const targetId = convId || activeConversationId;
      if (!targetId) return;

      try {
        await chatService.clearHistory(targetId);
        if (targetId === activeConversationId) {
          setMessages([]);
        }
        toast.success('Đã xóa lịch sử cuộc trò chuyện');
      } catch (err) {
        console.error('Failed to clear history:', err);
        if (targetId === activeConversationId) {
          setMessages([]);
        }
        toast.success('Đã xóa lịch sử cuộc trò chuyện');
      }
    },
    [activeConversationId]
  );

  // Start or open DM with a real user
  const startOrOpenDM = useCallback(
    async (partnerUserId: string, partnerProfile?: Partial<UserSummary>): Promise<string> => {
      const myId = getMyUserId(user);
      if (!partnerUserId || (myId && partnerUserId.toLowerCase() === myId.toLowerCase())) {
        toast.error('Không thể tạo cuộc trò chuyện với chính mình!');
        return '';
      }

      // 1. Check if conversation already exists in state
      const existing = conversations.find((c) => {
        if (c.type !== 'DM') return false;
        if (c.partner?.id?.toLowerCase() === partnerUserId.toLowerCase()) return true;
        if (c.dmKey && c.dmKey.toLowerCase().includes(partnerUserId.toLowerCase())) return true;
        return false;
      });
      if (existing) {
        selectConversation(existing.id);
        return existing.id;
      }

      // 2. Call backend POST /api/v1/conversations
      try {
        const created = await chatService.createConversation({
          type: 'DM',
          member_ids: [partnerUserId],
        });

        const transformed = await transformConversation(created);
        if (partnerProfile) {
          const fullName = [partnerProfile.firstName, partnerProfile.lastName].filter(Boolean).join(' ') || partnerProfile.username;
          if (fullName) transformed.displayName = fullName;
          if (partnerProfile.avatarUrl) transformed.avatarUrl = partnerProfile.avatarUrl;
          transformed.partner = {
            id: partnerUserId,
            username: partnerProfile.username || 'user',
            displayName: fullName || 'Người dùng',
            avatarUrl: partnerProfile.avatarUrl || undefined,
            isOnline: true,
          };
        }

        setConversations((prev) => [transformed, ...prev.filter((c) => c.id !== transformed.id)]);
        selectConversation(transformed.id);
        return transformed.id;
      } catch (err: any) {
        console.error('[ChatContext] Create DM failed on backend:', err);
        const errorMsg = err?.response?.data?.error || 'Không thể tạo cuộc trò chuyện với người dùng này!';
        toast.error(errorMsg);
        throw err;
      }
    },
    [conversations, selectConversation, transformConversation]
  );

  // Create group chat
  const createGroup = useCallback(
    async (title: string, memberIds: string[]): Promise<string> => {
      const trimmedTitle = title.trim() || 'Nhóm mới';
      try {
        const created = await chatService.createConversation({
          type: 'GROUP',
          title: trimmedTitle,
          member_ids: memberIds,
        });

        const transformed = await transformConversation(created);
        setConversations((prev) => [transformed, ...prev]);
        selectConversation(transformed.id);
        toast.success(`Đã tạo nhóm "${trimmedTitle}" thành công!`);
        return transformed.id;
      } catch (err: any) {
        console.error('Failed to create group on backend:', err);
        const errorMsg = err?.response?.data?.error || 'Không thể tạo nhóm trò chuyện!';
        toast.error(errorMsg);
        throw err;
      }
    },
    [selectConversation, transformConversation]
  );

  // Add member to group
  const addMemberToGroup = useCallback(
    async (userId: string, role: 'ADMIN' | 'MEMBER' = 'MEMBER') => {
      if (!activeConversationId) return;
      try {
        await chatService.addMember(activeConversationId, { user_id: userId, role });
        toast.success('Đã thêm thành viên vào nhóm');
        // Refresh conversation details
        const details = await chatService.getConversation(activeConversationId);
        if (details.members) {
          setConversations((prev) =>
            prev.map((c) => {
              if (c.id === activeConversationId) {
                return {
                  ...c,
                  members: details.members?.map((m) => ({
                    userId: m.user_id,
                    username: m.user?.username || 'user',
                    displayName: [m.user?.firstName, m.user?.lastName].filter(Boolean).join(' ') || m.user?.username || 'Thành viên',
                    avatarUrl: m.user?.avatarUrl || undefined,
                    role: m.role,
                  })),
                };
              }
              return c;
            })
          );
        }
      } catch (err: any) {
        console.error('Failed to add member:', err);
        toast.error(err?.response?.data?.error || 'Không thể thêm thành viên này!');
      }
    },
    [activeConversationId]
  );

  // Remove member from group
  const removeMemberFromGroup = useCallback(
    async (userId: string) => {
      if (!activeConversationId) return;
      try {
        await chatService.removeMember(activeConversationId, userId);
        toast.success('Đã xóa thành viên khỏi nhóm');
        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversationId && c.members) {
              return {
                ...c,
                members: c.members.filter((m) => m.userId !== userId),
              };
            }
            return c;
          })
        );
      } catch (err: any) {
        console.error('Failed to remove member:', err);
        toast.error('Không thể xóa thành viên này!');
      }
    },
    [activeConversationId]
  );

  // Leave group
  const leaveGroup = useCallback(
    async (convId?: string) => {
      const targetId = convId || activeConversationId;
      if (!targetId) return;
      try {
        await chatService.removeMember(targetId, currentUserId);
        setConversations((prev) => prev.filter((c) => c.id !== targetId));
        if (activeConversationId === targetId) {
          setActiveConversationId(conversations[0]?.id || null);
        }
        toast.success('Đã rời khỏi nhóm trò chuyện');
      } catch (err) {
        console.error('Failed to leave group:', err);
        setConversations((prev) => prev.filter((c) => c.id !== targetId));
        toast.success('Đã rời khỏi nhóm trò chuyện');
      }
    },
    [activeConversationId, conversations, currentUserId]
  );

  // Send typing event debounced
  const sendTyping = useCallback(() => {
    if (!activeConversationId) return;
    const now = Date.now();
    if (now - lastTypingSentTimeRef.current > 2800) {
      lastTypingSentTimeRef.current = now;
      chatSocket.sendTyping(activeConversationId);
    }
  }, [activeConversationId]);

  const reconnectWs = useCallback(() => {
    chatSocket.disconnect();
    chatSocket.connect();
  }, []);

  // =========================================================
  // WEBSOCKET SERVER EVENT HANDLERS
  // =========================================================
  useEffect(() => {
    // 1. message.ack (Sent ACK)
    const unsubAck = chatSocket.on('message.ack', (payload) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.clientMsgId === payload.client_msg_id) {
            return {
              ...m,
              id: payload.id,
              seq: payload.seq,
              createdAt: payload.created_at,
              status: 'SENT',
            };
          }
          return m;
        })
      );
      localLastSeqRef.current = Math.max(localLastSeqRef.current, payload.seq);
    });

    // 2. message.new (New incoming message)
    const unsubNew = chatSocket.on('message.new', (payload) => {
      if (payload.sender_id !== currentUserId) {
        playMessageSound();
      }

      const isForActive = payload.conversation_id === activeConversationId;

      if (isForActive) {
        // Gap detection
        const expectedSeq = localLastSeqRef.current + 1;
        if (payload.seq > expectedSeq && localLastSeqRef.current > 0) {
          console.warn(`[ChatContext] Gap detected! Expected seq ${expectedSeq}, got ${payload.seq}. Syncing...`);
          chatSocket.sendSync(payload.conversation_id, localLastSeqRef.current);
        }

        const newMsg = formatChatMessage(payload, currentUserId);

        setMessages((prev) => {
          const clientMsgId = (payload as any).client_msg_id;
          const existingIndex = prev.findIndex(
            (m) =>
              (clientMsgId && m.clientMsgId === clientMsgId) ||
              (m.id && m.id === payload.id) ||
              (m.seq && m.seq === payload.seq)
          );

          if (existingIndex !== -1) {
            const updated = [...prev];
            const existing = updated[existingIndex];
            updated[existingIndex] = {
              ...newMsg,
              mediaType: existing.mediaType !== 'TEXT' ? existing.mediaType : newMsg.mediaType,
              mediaUrl: existing.mediaUrl || newMsg.mediaUrl,
              fileName: existing.fileName || newMsg.fileName,
              fileSize: existing.fileSize || newMsg.fileSize,
              status: 'SENT',
            };
            return updated;
          }

          return [...prev, newMsg];
        });

        localLastSeqRef.current = Math.max(localLastSeqRef.current, payload.seq);

        // Auto mark read if active
        chatSocket.sendRead(payload.conversation_id, payload.seq);
      }

      // Update conversation list preview & unread distance
      const mediaInfo = inferMediaTypeAndUrl(payload.body);
      const previewText =
        mediaInfo.mediaType === 'IMAGE'
          ? (mediaInfo.cleanBody ? `📷 [Hình ảnh] ${mediaInfo.cleanBody}` : '📷 [Hình ảnh]')
          : mediaInfo.mediaType === 'VIDEO'
          ? (mediaInfo.cleanBody ? `🎥 [Video] ${mediaInfo.cleanBody}` : '🎥 [Video]')
          : mediaInfo.mediaType === 'AUDIO'
          ? '🎤 [Tin nhắn thoại]'
          : mediaInfo.mediaType === 'FILE'
          ? (mediaInfo.cleanBody ? `📎 ${mediaInfo.fileName || 'Tệp đính kèm'}: ${mediaInfo.cleanBody}` : `📎 ${mediaInfo.fileName || 'Tệp đính kèm'}`)
          : payload.body;

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === payload.conversation_id);
        if (existing) {
          const isRead = isForActive;
          const updated: ChatConversationItem = {
            ...existing,
            lastSeq: payload.seq,
            lastMessageAt: payload.created_at,
            unreadSeqDistance: isRead ? 0 : existing.unreadSeqDistance + 1,
            lastMessagePreview: {
              text: previewText,
              senderId: payload.sender_id,
              senderName: payload.sender_id === currentUserId ? 'Bạn' : existing.displayName,
              timestamp: new Date(payload.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isRead,
            },
          };
          return [updated, ...prev.filter((c) => c.id !== payload.conversation_id)];
        } else {
          // If conversation not present in state, fetch details and prepend
          void (async () => {
            try {
              const rawConv = await chatService.getConversation(payload.conversation_id);
              const enriched = await transformConversationRef.current(rawConv);
              const isRead = isForActive;
              enriched.lastSeq = payload.seq;
              enriched.lastMessageAt = payload.created_at;
              enriched.unreadSeqDistance = isRead ? 0 : 1;
              enriched.lastMessagePreview = {
                text: previewText,
                senderId: payload.sender_id,
                senderName: payload.sender_id === currentUserId ? 'Bạn' : enriched.displayName,
                timestamp: new Date(payload.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                isRead,
              };
              setConversations((currentPrev) => [
                enriched,
                ...currentPrev.filter((c) => c.id !== enriched.id),
              ]);
            } catch (err) {
              console.warn('[ChatContext] Failed to load new conversation on message.new:', err);
              void fetchConversations();
            }
          })();
          return prev;
        }
      });
    });

    // 3. message.sync_res (Gap Recovery Response)
    const unsubSyncRes = chatSocket.on('message.sync_res', (payload) => {
      if (payload.conversation_id === activeConversationId && payload.messages) {
        const newBatch: ChatMessage[] = payload.messages.map((m) => formatChatMessage(m, currentUserId));

        setMessages((prev) => {
          const map = new Map<string, ChatMessage>();
          prev.forEach((m) => map.set(`${m.seq || m.clientMsgId}`, m));
          newBatch.forEach((m) => map.set(`${m.seq || m.clientMsgId}`, m));
          return Array.from(map.values()).sort((a, b) => (a.seq || 0) - (b.seq || 0));
        });

        const maxSeq = Math.max(...payload.messages.map((m) => m.seq || 0), localLastSeqRef.current);
        localLastSeqRef.current = maxSeq;
      }
    });

    // 4. read.updated (Read Receipts)
    const unsubReadUpdated = chatSocket.on('read.updated', (payload) => {
      if (payload.conversation_id === activeConversationId) {
        setConversations((prev) =>
          prev.map((c) => (c.id === payload.conversation_id ? { ...c, lastReadSeq: payload.last_read_seq } : c))
        );
      }
    });

    // 5. message.updated (Edited message)
    const unsubUpdated = chatSocket.on('message.updated', (payload) => {
      setMessages((prev) =>
        prev.map((m) => {
          if (m.id === payload.id) {
            const mediaInfo = inferMediaTypeAndUrl(payload.body);
            return {
              ...m,
              body: mediaInfo.cleanBody,
              mediaType: mediaInfo.mediaType,
              mediaUrl: mediaInfo.mediaUrl,
              fileName: mediaInfo.fileName,
              editedAt: payload.edited_at,
            };
          }
          return m;
        })
      );
    });

    // 6. message.deleted (Soft-deleted message)
    const unsubDeleted = chatSocket.on('message.deleted', (payload) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, isDeleted: true, body: '' } : m))
      );
    });

    // 7. typing (Typing Indicator)
    const unsubTyping = chatSocket.on('typing', (payload) => {
      if (payload.conversation_id === activeConversationId && payload.user_id !== currentUserId) {
        setTypingUsers((prev) => new Set(prev).add(payload.user_id));

        // Reset timer
        const oldTimer = typingTimerMapRef.current.get(payload.user_id);
        if (oldTimer) clearTimeout(oldTimer);

        const newTimer = setTimeout(() => {
          setTypingUsers((prev) => {
            const copy = new Set(prev);
            copy.delete(payload.user_id);
            return copy;
          });
          typingTimerMapRef.current.delete(payload.user_id);
        }, 3500);

        typingTimerMapRef.current.set(payload.user_id, newTimer);
      }
    });

    // 8. error (Server Errors)
    const unsubError = chatSocket.on('error', (payload) => {
      console.warn('[ChatContext] WS Error received:', payload);
      if (payload.code === 'RATE_LIMITED') {
        setRateLimitCooldown(5);
        toast.error('Bạn đang gửi tin nhắn quá nhanh, vui lòng thử lại sau 5 giây!');
        if (payload.client_msg_id) {
          setMessages((prev) =>
            prev.map((m) => (m.clientMsgId === payload.client_msg_id ? { ...m, status: 'FAILED' } : m))
          );
        }
      } else {
        toast.error(payload.message || 'Lỗi gửi tin nhắn');
      }
    });

    const unsubConvNew = chatSocket.on('conversation.new', () => {
      void fetchConversations();
    });

    return () => {
      unsubAck();
      unsubNew();
      unsubSyncRes();
      unsubReadUpdated();
      unsubUpdated();
      unsubDeleted();
      unsubTyping();
      unsubError();
      unsubConvNew();
    };
  }, [activeConversationId, currentUserId]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversationId,
        activeConversation,
        messages,
        isLoadingConversations,
        isLoadingMessages,
        isLoadingOlder,
        hasMoreOlderMessages,
        connectionState,
        typingUsers,
        rateLimitCooldown,
        unreadTotal,

        selectConversation,
        startOrOpenDM,
        createGroup,
        sendMessage,
        uploadAndSendAttachment,
        retryMessage,
        editMessage,
        deleteMessage,
        clearHistory,
        loadOlderMessages,
        markAsRead,
        sendTyping,
        addMemberToGroup,
        removeMemberFromGroup,
        leaveGroup,
        reconnectWs,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

// Custom Hook
export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export default ChatContext;
