import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Phone,
  Video,
  X,
  Minus,
  Maximize2,
  Smile,
  ImageIcon,
  Paperclip,
  Mic,
  ThumbsUp,
  Loader2,
  StopCircle,
  Users,
  ChevronDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCall } from '../../contexts/CallContext';
import { useChat, inferMediaTypeAndUrl } from '../../contexts/ChatContext';
import { useUserPresence } from '../../contexts/PresenceContext';
import chatService from '../../services/chatService';
import chatSocket from '../../services/chatSocket';
import { playMessageSound } from '../../utils/sound';
import { generateUUID } from '../../utils/uuid';
import UserAvatar from '../common/UserAvatar';
import ChatMessageItem from './ChatMessageItem';
import { EmojiPickerPopover } from '../common/EmojiPickerPopover';
import { GifPickerPopover } from '../common/GifPickerPopover';
import type { ChatMessage, ChatConversationItem } from '../../types/chat';
import clsx from 'clsx';

interface DockedChatWindowProps {
  conversationId: string;
  isMinimized: boolean;
  onClose: () => void;
  onToggleMinimize: () => void;
}

interface StagedAttachment {
  file: File | Blob;
  name: string;
  size: number;
  type: 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE';
  previewUrl?: string;
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

export const DockedChatWindow: React.FC<DockedChatWindowProps> = ({
  conversationId,
  isMinimized,
  onClose,
  onToggleMinimize,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { startCall } = useCall();
  const { conversations, rateLimitCooldown } = useChat();
  const navigate = useNavigate();

  const currentUserId = user?.id || 'me';

  // Find conversation from ChatContext
  const conversation = useMemo<ChatConversationItem | null>(() => {
    return conversations.find((c) => c.id === conversationId) || null;
  }, [conversations, conversationId]);

  const isGroup = conversation?.type === 'GROUP';
  const partnerId = !isGroup ? conversation?.partner?.id : undefined;

  // Real-time reactive presence tracking for DM partner
  const { isOnline: isPartnerOnline, status: partnerStatus } = useUserPresence(
    partnerId,
    Boolean(partnerId)
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingOlder, setIsLoadingOlder] = useState(false);
  const [hasMoreOlderMessages, setHasMoreOlderMessages] = useState(true);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [replyingMessage, setReplyingMessage] = useState<ChatMessage | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Staged attachment
  const [stagedAttachment, setStagedAttachment] = useState<StagedAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  // Audio recording
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const localLastSeqRef = useRef<number>(0);
  const oldestSeqRef = useRef<number>(0);
  const typingTimerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const lastTypingSentTimeRef = useRef<number>(0);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const isRateLimited = rateLimitCooldown > 0;

  // Format single raw message to ChatMessage
  const formatMsg = useCallback(
    (m: any): ChatMessage => {
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
    },
    [currentUserId]
  );

  // Load initial messages for this conversation
  const loadMessages = useCallback(async () => {
    setIsLoadingMessages(true);
    setHasMoreOlderMessages(true);
    try {
      const rawMessages = await chatService.getMessages(conversationId, { limit: 40 });
      if (rawMessages && rawMessages.length > 0) {
        const formatted = rawMessages.map(formatMsg);
        setMessages(formatted);
        const maxSeq = Math.max(...formatted.map((m) => m.seq || 0));
        const minSeq = Math.min(...formatted.map((m) => m.seq || 0));
        localLastSeqRef.current = maxSeq;
        oldestSeqRef.current = minSeq;

        // Auto mark read if not minimized
        if (!isMinimized && maxSeq > 0) {
          chatSocket.sendRead(conversationId, maxSeq);
          void chatService.markRead(conversationId, maxSeq).catch(() => {});
        }
      } else {
        setMessages([]);
        localLastSeqRef.current = 0;
        oldestSeqRef.current = 0;
      }
    } catch (err) {
      console.warn(`[DockedChatWindow] Failed to load messages for ${conversationId}:`, err);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [conversationId, formatMsg, isMinimized]);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  // Load older messages (pagination)
  const handleLoadOlder = useCallback(async () => {
    if (isLoadingOlder || !hasMoreOlderMessages || oldestSeqRef.current <= 1) return;
    setIsLoadingOlder(true);
    try {
      const olderRaw = await chatService.getMessages(conversationId, {
        before_seq: oldestSeqRef.current,
        limit: 20,
      });
      if (!olderRaw || olderRaw.length === 0) {
        setHasMoreOlderMessages(false);
      } else {
        const olderFormatted = olderRaw.map(formatMsg);
        setMessages((prev) => [...olderFormatted, ...prev]);
        const newMin = Math.min(...olderFormatted.map((m) => m.seq || oldestSeqRef.current));
        oldestSeqRef.current = newMin;
        if (newMin <= 1 || olderRaw.length < 20) {
          setHasMoreOlderMessages(false);
        }
      }
    } catch {
      setHasMoreOlderMessages(false);
    } finally {
      setIsLoadingOlder(false);
    }
  }, [conversationId, formatMsg, hasMoreOlderMessages, isLoadingOlder]);

  // Handle scroll events
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop } = containerRef.current;
    if (scrollTop < 40 && !isLoadingOlder && hasMoreOlderMessages) {
      void handleLoadOlder();
    }
  };

  // Scroll to bottom when messages change and window is open
  useEffect(() => {
    if (!isMinimized && !isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, isMinimized, isLoadingMessages]);

  // Auto mark read and reset unread count when un-minimizing
  useEffect(() => {
    if (!isMinimized) {
      setUnreadCount(0);
      const curSeq = localLastSeqRef.current;
      if (curSeq > 0) {
        chatSocket.sendRead(conversationId, curSeq);
        void chatService.markRead(conversationId, curSeq).catch(() => {});
      }
    }
  }, [isMinimized, conversationId]);

  // Listen to WebSocket events for this specific conversation
  useEffect(() => {
    // 1. message.ack
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

    // 2. message.new
    const unsubNew = chatSocket.on('message.new', (payload) => {
      if (payload.conversation_id !== conversationId) return;

      if (payload.sender_id !== currentUserId) {
        playMessageSound();
      }

      const newMsg = formatMsg(payload);

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

      if (isMinimized) {
        setUnreadCount((prev) => prev + 1);
      } else {
        chatSocket.sendRead(conversationId, payload.seq);
        void chatService.markRead(conversationId, payload.seq).catch(() => {});
      }
    });

    // 3. message.updated
    const unsubUpdated = chatSocket.on('message.updated', (payload) => {
      if (payload.conversation_id !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, body: payload.body, editedAt: payload.edited_at } : m))
      );
    });

    // 4. message.deleted
    const unsubDeleted = chatSocket.on('message.deleted', (payload) => {
      if (payload.conversation_id !== conversationId) return;
      setMessages((prev) =>
        prev.map((m) => (m.id === payload.id ? { ...m, isDeleted: true, body: '' } : m))
      );
    });

    // 5. typing
    const unsubTyping = chatSocket.on('typing', (payload) => {
      if (payload.conversation_id === conversationId && payload.user_id !== currentUserId) {
        setTypingUsers((prev) => new Set(prev).add(payload.user_id));

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

    return () => {
      unsubAck();
      unsubNew();
      unsubUpdated();
      unsubDeleted();
      unsubTyping();
    };
  }, [conversationId, currentUserId, formatMsg, isMinimized]);

  // Send typing indicator
  const handleTyping = () => {
    const now = Date.now();
    if (now - lastTypingSentTimeRef.current > 2800) {
      lastTypingSentTimeRef.current = now;
      chatSocket.sendTyping(conversationId);
    }
  };

  // Stage file helper
  const stageFile = useCallback((file: File) => {
    const mime = file.type || '';
    let fileType: StagedAttachment['type'] = 'FILE';
    let previewUrl: string | undefined = undefined;

    if (mime.startsWith('image/')) {
      fileType = 'IMAGE';
      previewUrl = URL.createObjectURL(file);
    } else if (mime.startsWith('video/')) {
      fileType = 'VIDEO';
      previewUrl = URL.createObjectURL(file);
    } else if (mime.startsWith('audio/')) {
      fileType = 'AUDIO';
    }

    setStagedAttachment({
      file,
      name: file.name,
      size: file.size,
      type: fileType,
      previewUrl,
    });
  }, []);

  const handleCancelStaged = () => {
    if (stagedAttachment?.previewUrl) {
      URL.revokeObjectURL(stagedAttachment.previewUrl);
    }
    setStagedAttachment(null);
    setUploadPercent(0);
    setIsUploading(false);
  };

  // Send message
  const handleSendMessage = async (customText?: string) => {
    if (isRateLimited || isUploading) return;

    const replyId = replyingMessage?.id || (replyingMessage?.seq as number | undefined) || null;

    // 1. Staged attachment upload & send
    if (stagedAttachment) {
      setIsUploading(true);
      setUploadPercent(0);
      try {
        const caption = (customText !== undefined ? customText : messageText).trim();
        const uploadRes = await chatService.uploadChatAttachment(
          conversationId,
          stagedAttachment.file,
          stagedAttachment.name,
          (percent) => setUploadPercent(percent)
        );

        const clientMsgId = generateUUID();
        const optimisticMessage: ChatMessage = {
          conversationId,
          senderId: currentUserId,
          senderName: 'Bạn',
          clientMsgId,
          body: caption,
          replyToId: replyId,
          createdAt: new Date().toISOString(),
          isDeleted: false,
          status: 'SENDING',
          isMine: true,
          mediaType: uploadRes.mediaType,
          mediaUrl: uploadRes.mediaUrl,
          attachmentId: uploadRes.id,
          fileName: uploadRes.fileName,
          fileSize: uploadRes.fileSize,
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        handleCancelStaged();
        setMessageText('');
        setReplyingMessage(null);

        const bodyToSend = caption || uploadRes.mediaUrl || '';
        const sentWs = chatSocket.sendMessage(conversationId, clientMsgId, bodyToSend, replyId);
        if (!sentWs) {
          const res = await chatService.sendMessage(conversationId, {
            client_msg_id: clientMsgId,
            body: bodyToSend,
            reply_to_id: replyId,
          });
          setMessages((prev) =>
            prev.map((m) =>
              m.clientMsgId === clientMsgId
                ? { ...m, id: res.id, seq: res.seq, createdAt: res.created_at, status: 'SENT' }
                : m
            )
          );
        }
      } catch (err) {
        console.error('Failed to upload attachment in mini chat:', err);
        toast.error('Không thể tải tệp lên, vui lòng thử lại!');
      } finally {
        setIsUploading(false);
        setUploadPercent(0);
      }
      return;
    }

    // 2. Normal text message
    const text = (customText !== undefined ? customText : messageText).trim();
    if (!text) return;

    const clientMsgId = generateUUID();
    const optimisticMessage: ChatMessage = {
      conversationId,
      senderId: currentUserId,
      senderName: 'Bạn',
      clientMsgId,
      body: text,
      replyToId: replyId,
      createdAt: new Date().toISOString(),
      isDeleted: false,
      status: 'SENDING',
      isMine: true,
      mediaType: 'TEXT',
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setMessageText('');
    setReplyingMessage(null);
    inputRef.current?.focus();

    const sentWs = chatSocket.sendMessage(conversationId, clientMsgId, text, replyId);
    if (!sentWs) {
      try {
        const res = await chatService.sendMessage(conversationId, {
          client_msg_id: clientMsgId,
          body: text,
          reply_to_id: replyId,
        });
        setMessages((prev) =>
          prev.map((m) =>
            m.clientMsgId === clientMsgId
              ? { ...m, id: res.id, seq: res.seq, createdAt: res.created_at, status: 'SENT' }
              : m
          )
        );
        localLastSeqRef.current = Math.max(localLastSeqRef.current, res.seq);
      } catch {
        setMessages((prev) =>
          prev.map((m) => (m.clientMsgId === clientMsgId ? { ...m, status: 'FAILED' } : m))
        );
      }
    }
  };

  // Call triggers
  const handleStartCall = (callType: 'audio' | 'video') => {
    if (!conversation) return;
    const target = {
      id: conversation.partner?.id || conversation.id,
      name: conversation.partner?.displayName || conversation.displayName,
      username:
        conversation.partner?.username || conversation.displayName.toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: conversation.partner?.avatarUrl || conversation.avatarUrl || '',
    };
    startCall(target, callType);
  };

  // Audio recording
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Trình duyệt không hỗ trợ ghi âm trực tiếp!');
        return;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.start(200);
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch {
      toast.error('Không thể truy cập microphone!');
    }
  };

  const stopAndSendRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
        mediaStreamRef.current = null;
        audioChunksRef.current = [];

        try {
          const fileName = `voice_${Date.now()}.webm`;
          const uploadRes = await chatService.uploadChatAttachment(conversationId, audioBlob, fileName);
          const clientMsgId = generateUUID();
          chatSocket.sendMessage(conversationId, clientMsgId, uploadRes.mediaUrl || '', null);
          toast.success(t('messages.sentAudio'));
        } catch {
          toast.error('Không thể gửi ghi âm');
        }
      };
      recorder.stop();
    }
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    mediaStreamRef.current?.getTracks().forEach((t) => t.stop());
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const displayName = conversation?.displayName || `Cuộc trò chuyện #${conversationId.slice(0, 5)}`;

  // =========================================================
  // 1. MINIMIZED VIEW (COMPACT HEADER BAR)
  // =========================================================
  if (isMinimized) {
    return (
      <div
        onClick={onToggleMinimize}
        className="w-[220px] sm:w-[260px] h-12 bg-white dark:bg-[#1E1E1E] rounded-t-2xl shadow-xl border border-b-0 border-gray-200 dark:border-[#333333] flex items-center justify-between px-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-[#262626] transition-all group pointer-events-auto select-none"
        title="Nhấn để mở rộng khung chat"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            {isGroup ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white dark:border-[#262626]">
                <Users className="w-3.5 h-3.5" />
              </div>
            ) : (
              <UserAvatar
                userId={conversation?.partner?.id}
                src={conversation?.avatarUrl}
                alt={displayName}
                presenceStatus={isPartnerOnline ? 'online' : partnerStatus}
                size="sm"
                className="w-8 h-8 shadow-xs"
              />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-xs">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate leading-tight">
              {displayName}
            </p>
            {isPartnerOnline && !isGroup && (
              <p className="text-[10px] text-emerald-500 font-medium leading-tight">
                {t('messages.activeNow')}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleMinimize();
            }}
            className="p-1 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full cursor-pointer transition"
            title="Mở rộng"
          >
            <ChevronDown className="w-4 h-4 rotate-180" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-1 text-gray-400 hover:text-rose-500 rounded-full cursor-pointer transition"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================
  // 2. EXPANDED FULL MINI CHAT WINDOW
  // =========================================================
  return (
    <div className="w-[328px] sm:w-[338px] h-[455px] bg-white dark:bg-[#181818] rounded-t-2xl shadow-2xl border border-b-0 border-gray-200 dark:border-[#333333] flex flex-col overflow-hidden transition-all duration-200 pointer-events-auto select-none">
      {/* Top Header */}
      <div className="h-13 px-3 bg-white dark:bg-[#1E1E1E] border-b border-gray-100 dark:border-[#2C2C2C] flex items-center justify-between shrink-0 shadow-2xs">
        {/* Left Partner Info */}
        <div
          onClick={() => {
            if (conversation?.partner?.username) {
              navigate(`/${conversation.partner.username}`);
            }
          }}
          className="flex items-center gap-2.5 min-w-0 cursor-pointer hover:opacity-90 transition group"
        >
          <div className="relative shrink-0">
            {isGroup ? (
              <div className="w-8.5 h-8.5 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white dark:border-[#262626]">
                <Users className="w-4 h-4" />
              </div>
            ) : (
              <UserAvatar
                userId={conversation?.partner?.id}
                src={conversation?.avatarUrl}
                alt={displayName}
                presenceStatus={isPartnerOnline ? 'online' : partnerStatus}
                size="sm"
                className="w-8.5 h-8.5 shadow-xs"
              />
            )}
          </div>

          <div className="min-w-0">
            <h3 className="text-[13.5px] font-bold text-gray-900 dark:text-[#F5F5F5] truncate max-w-[130px] leading-tight group-hover:text-[#0084FF] dark:group-hover:text-[#3797F0] transition-colors">
              {displayName}
            </h3>
            <p className="text-[10.5px] leading-tight text-gray-400 dark:text-[#8E8E8E] truncate">
              {typingUsers.size > 0 ? (
                <span className="text-[#0084FF] dark:text-[#3797F0] font-medium animate-pulse">
                  {t('messages.typing')}
                </span>
              ) : isGroup ? (
                <span>{conversation?.members?.length || 3} thành viên</span>
              ) : isPartnerOnline ? (
                <span className="text-emerald-500 font-medium">{t('messages.activeNow')}</span>
              ) : (
                <span>{conversation?.lastActiveText || t('messages.offline')}</span>
              )}
            </p>
          </div>
        </div>

        {/* Right Header Action Icons */}
        <div className="flex items-center gap-0.5 text-gray-500 dark:text-[#A8A8A8]">
          {/* Audio Call */}
          <button
            type="button"
            onClick={() => handleStartCall('audio')}
            className="p-1.5 hover:text-[#0084FF] dark:hover:text-[#3797F0] hover:bg-gray-100 dark:hover:bg-[#2B2B2B] rounded-full transition cursor-pointer"
            title={t('messages.audioCall')}
          >
            <Phone className="w-4 h-4 stroke-[1.8]" />
          </button>

          {/* Video Call */}
          <button
            type="button"
            onClick={() => handleStartCall('video')}
            className="p-1.5 hover:text-[#0084FF] dark:hover:text-[#3797F0] hover:bg-gray-100 dark:hover:bg-[#2B2B2B] rounded-full transition cursor-pointer"
            title={t('messages.videoCall')}
          >
            <Video className="w-4 h-4 stroke-[1.8]" />
          </button>

          {/* Open in full page */}
          <button
            type="button"
            onClick={() => navigate(`/messages/${conversationId}`)}
            className="p-1.5 hover:text-[#0084FF] dark:hover:text-[#3797F0] hover:bg-gray-100 dark:hover:bg-[#2B2B2B] rounded-full transition cursor-pointer"
            title="Mở trong trang tin nhắn"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Minimize */}
          <button
            type="button"
            onClick={onToggleMinimize}
            className="p-1.5 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#2B2B2B] rounded-full transition cursor-pointer"
            title="Thu nhỏ"
          >
            <Minus className="w-4 h-4" />
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-full transition cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar bg-gray-50/40 dark:bg-[#121212]"
      >
        {isLoadingOlder && (
          <div className="flex justify-center py-1">
            <Loader2 className="w-4 h-4 animate-spin text-[#0084FF]" />
          </div>
        )}

        {isLoadingMessages ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-gray-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#0084FF]" />
            <span className="text-xs">{t('messages.loadingMessages')}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-400">
            <div className="w-10 h-10 rounded-full bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-xl mb-2">
              👋
            </div>
            <p className="text-xs font-semibold text-gray-700 dark:text-[#D4D4D4]">
              {t('messages.firstMessagePrompt')}
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const quoted = msg.replyToId
              ? messages.find((m) => m.id === msg.replyToId || m.seq === msg.replyToId)
              : null;

            const activeConvItem: ChatConversationItem = conversation || {
              id: conversationId,
              type: 'DM',
              createdBy: 'user',
              createdAt: new Date().toISOString(),
              lastSeq: 0,
              unreadSeqDistance: 0,
              lastReadSeq: 0,
              clearedBeforeSeq: 0,
              displayName,
            };

            return (
              <ChatMessageItem
                key={msg.clientMsgId || msg.id}
                message={msg}
                conversation={activeConvItem}
                onReply={(m) => setReplyingMessage(m)}
                onEdit={async (id, text) => {
                  try {
                    await chatService.editMessage(id, text);
                    setMessages((prev) =>
                      prev.map((m) => (m.id === id ? { ...m, body: text } : m))
                    );
                  } catch {
                    toast.error('Không thể sửa tin nhắn');
                  }
                }}
                onDelete={async (id) => {
                  try {
                    await chatService.deleteMessage(id);
                    setMessages((prev) =>
                      prev.map((m) => (m.id === id ? { ...m, isDeleted: true, body: '' } : m))
                    );
                  } catch {
                    toast.error('Không thể thu hồi tin nhắn');
                  }
                }}
                onRetry={async (clientMsgId) => {
                  const m = messages.find((item) => item.clientMsgId === clientMsgId);
                  if (!m) return;
                  chatSocket.sendMessage(conversationId, clientMsgId, m.body, m.replyToId);
                }}
                onAddReaction={() => {}}
                quotedMessage={quoted}
              />
            );
          })
        )}

        {/* Typing indicator */}
        {typingUsers.size > 0 && (
          <div className="flex items-end gap-1.5 animate-fadeIn mb-1">
            <div className="w-5 h-5 rounded-full bg-gray-200 dark:bg-[#262626] flex items-center justify-center shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0084FF] animate-ping" />
            </div>
            <div className="bg-gray-200 dark:bg-[#2A2A2A] rounded-2xl rounded-bl-xs px-3 py-1.5 flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1 h-1 rounded-full bg-gray-500 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1 h-1 rounded-full bg-gray-500 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Replying Banner */}
      {replyingMessage && (
        <div className="px-3 py-1.5 bg-gray-100 dark:bg-[#202020] border-t border-gray-200 dark:border-[#2C2C2C] flex items-center justify-between text-[11px] animate-slideIn">
          <div className="flex items-center gap-1.5 min-w-0 border-l-2 border-[#0084FF] pl-2">
            <span className="text-gray-400 shrink-0">{t('messages.replyingTo')}</span>
            <span className="font-bold text-gray-800 dark:text-[#E0E0E0] truncate">
              {replyingMessage.senderName || 'Bạn'}: {replyingMessage.body}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setReplyingMessage(null)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Staged Attachment Preview */}
      {stagedAttachment && (
        <div className="px-3 py-2 bg-gray-100 dark:bg-[#202020] border-t border-gray-200 dark:border-[#2C2C2C] flex items-center justify-between gap-2 animate-slideIn">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {stagedAttachment.type === 'IMAGE' && stagedAttachment.previewUrl ? (
              <img
                src={stagedAttachment.previewUrl}
                alt="preview"
                className="w-9 h-9 rounded-lg object-cover border border-gray-200 dark:border-[#383838] shrink-0"
              />
            ) : (
              <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950/60 flex items-center justify-center shrink-0">
                <Paperclip className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-gray-800 dark:text-[#E0E0E0] truncate">
                {stagedAttachment.name}
              </p>
              <div className="flex items-center gap-2">
                <p className="text-[10px] text-gray-400">{formatFileSize(stagedAttachment.size)}</p>
                {isUploading && (
                  <span className="text-[10px] text-[#0084FF] font-semibold flex items-center gap-1">
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                    <span>{uploadPercent}%</span>
                  </span>
                )}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={handleCancelStaged}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Recording Overlay */}
      {isRecording ? (
        <div className="p-2.5 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/40 animate-pulse">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              {Math.floor(recordingSeconds / 60)}:{String(recordingSeconds % 60).padStart(2, '0')}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-2.5 py-1 rounded-full bg-gray-200 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#D4D4D4] text-[11px] font-medium cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-xs"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>Gửi</span>
            </button>
          </div>
        </div>
      ) : (
        /* Compact Input Bar */
        <div className="p-2.5 bg-white dark:bg-[#1E1E1E] border-t border-gray-100 dark:border-[#2C2C2C] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSendMessage();
            }}
            className="flex items-center gap-1.5 bg-gray-100 dark:bg-[#262626] rounded-full px-3 py-1 border border-transparent focus-within:bg-white dark:focus-within:bg-[#151515] focus-within:border-[#0084FF] dark:focus-within:border-[#0095F6] transition-all"
          >
            {/* Hidden Inputs */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) stageFile(file);
                e.target.value = '';
              }}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) stageFile(file);
                e.target.value = '';
              }}
            />

            {/* Emoji Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              disabled={isRateLimited || isUploading}
              className={clsx(
                'p-1 transition cursor-pointer shrink-0',
                showEmojiPicker
                  ? 'text-[#0084FF] dark:text-[#3797F0]'
                  : 'text-gray-500 hover:text-[#0084FF] dark:text-[#A8A8A8] dark:hover:text-[#3797F0]'
              )}
              title={t('messages.chooseEmoji')}
            >
              <Smile className="w-4 h-4" />
            </button>

            {/* Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={(e) => {
                setMessageText(e.target.value);
                handleTyping();
              }}
              disabled={isRateLimited || isUploading}
              placeholder={
                isRateLimited
                  ? `Chờ ${rateLimitCooldown}s...`
                  : stagedAttachment
                  ? 'Thêm chú thích...'
                  : t('messages.typeMessagePlaceholder')
              }
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSendMessage();
                }
              }}
              className="flex-1 bg-transparent text-[13px] text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none leading-normal min-w-0"
            />

            {/* Right Buttons: Send or Actions */}
            {messageText.trim() || stagedAttachment ? (
              <button
                type="submit"
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => {
                  e.preventDefault();
                  void handleSendMessage();
                }}
                disabled={isRateLimited || isUploading}
                className="text-xs font-bold text-[#0084FF] dark:text-[#3797F0] hover:text-[#0066CC] px-2 py-1 min-h-[32px] transition cursor-pointer shrink-0 disabled:opacity-50 select-none flex items-center gap-1"
                title={t('messages.send')}
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#0084FF]" />
                ) : (
                  <span>{t('messages.send')}</span>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-0.5 shrink-0 text-gray-500 dark:text-[#A8A8A8]">
                {/* Voice */}
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isRateLimited}
                  className="p-1 hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer"
                  title={t('messages.recordVoice')}
                >
                  <Mic className="w-4 h-4" />
                </button>

                {/* Photo */}
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={isRateLimited}
                  className="p-1 hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer"
                  title={t('messages.attachPhoto')}
                >
                  <ImageIcon className="w-4 h-4" />
                </button>

                {/* File */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRateLimited}
                  className="p-1 hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer"
                  title={t('messages.attachDocument')}
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* GIF Button */}
                <button
                  type="button"
                  onClick={() => {
                    setShowGifPicker(!showGifPicker);
                    setShowEmojiPicker(false);
                  }}
                  disabled={isRateLimited}
                  className={clsx(
                    'p-1 transition cursor-pointer flex items-center justify-center shrink-0',
                    showGifPicker
                      ? 'text-[#0084FF] dark:text-[#3797F0]'
                      : 'hover:text-[#0084FF] dark:hover:text-[#3797F0]'
                  )}
                  title={t('messages.attachGif')}
                >
                  <span className="font-extrabold text-[9.5px] border border-current px-1 py-[1.5px] rounded-[4px] leading-none select-none tracking-tight">
                    GIF
                  </span>
                </button>

                {/* Like / Thumbs Up Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage('👍')}
                  disabled={isRateLimited}
                  className="p-1 text-gray-500 dark:text-[#A8A8A8] hover:text-[#0084FF] dark:hover:text-[#3797F0] hover:scale-110 active:scale-95 transition cursor-pointer"
                  title={t('messages.sendLike')}
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Popovers Overlay Panel placed directly on top of the mini chatbox above the input bar */}
      {showEmojiPicker && (
        <div className="absolute inset-x-0 top-0 bottom-[53px] z-50 bg-white dark:bg-[#1E1E1E] rounded-t-2xl shadow-2xl flex flex-col p-3 animate-fadeIn border-b border-gray-100 dark:border-[#2C2C2C] select-none">
          <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-[#333333] mb-1 shrink-0">
            <span className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
              <span>😀</span> Biểu tượng cảm xúc
            </span>
            <button
              type="button"
              onClick={() => setShowEmojiPicker(false)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer transition hover:bg-gray-100 dark:hover:bg-[#333333]"
              title="Đóng"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <EmojiPickerPopover
            isOpen={showEmojiPicker}
            onClose={() => setShowEmojiPicker(false)}
            onSelectEmoji={(emoji) => {
              setMessageText((prev) => prev + emoji);
              setShowEmojiPicker(false);
              inputRef.current?.focus();
            }}
            embedded={true}
            className="w-full flex-1 min-h-0"
          />
        </div>
      )}

      {showGifPicker && (
        <div className="absolute inset-x-0 top-0 bottom-[53px] z-50 bg-white dark:bg-[#1E1E1E] rounded-t-2xl shadow-2xl flex flex-col p-3 animate-fadeIn border-b border-gray-100 dark:border-[#2C2C2C] select-none">
          <GifPickerPopover
            isOpen={showGifPicker}
            onClose={() => setShowGifPicker(false)}
            onSelectGif={async (url) => {
              setShowGifPicker(false);
              const clientMsgId = generateUUID();
              chatSocket.sendMessage(conversationId, clientMsgId, url, null);
              toast.success(t('messages.sentGif'));
            }}
            embedded={true}
            className="w-full flex-1 min-h-0"
          />
        </div>
      )}
    </div>
  );
};

export default DockedChatWindow;
