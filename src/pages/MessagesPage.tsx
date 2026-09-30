import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  Phone,
  Video,
  Info,
  Send,
  Smile,
  Image as ImageIcon,
  Mic,
  Check,
  CheckCheck,
  ThumbsUp,
  ArrowLeft,
  X,
  Play,
  Pause,
  Pin,
  VolumeX,
  Shield,
  Trash2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  INITIAL_CONVERSATIONS,
  INITIAL_ACTIVE_CONTACTS,
  type ChatConversation,
  type ChatMessageItem,
  type ChatContact,
} from '../mocks/messagesData';
import UserAvatar from '../components/common/UserAvatar';
import clsx from 'clsx';

type ConversationTab = 'all' | 'unread' | 'groups';

export const MessagesPage: React.FC = () => {
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<ChatConversation[]>(INITIAL_CONVERSATIONS);
  const [activeChatId, setActiveChatId] = useState<string>(INITIAL_CONVERSATIONS[0].id);
  const [activeTab, setActiveTab] = useState<ConversationTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [messageText, setMessageText] = useState('');
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Active conversation
  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeChatId) || conversations[0];
  }, [conversations, activeChatId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.name.toLowerCase().includes(q);
        const matchLastMsg = c.lastMessage.text.toLowerCase().includes(q);
        if (!matchName && !matchLastMsg) return false;
      }
      if (activeTab === 'unread') return c.unreadCount > 0;
      if (activeTab === 'groups') return c.isGroup;
      return true;
    });
  }, [conversations, searchQuery, activeTab]);

  // Select conversation
  const handleSelectConversation = (convId: string) => {
    setActiveChatId(convId);
    setIsMobileChatOpen(true);

    // Mark as read
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === convId) {
          return {
            ...c,
            unreadCount: 0,
            lastMessage: { ...c.lastMessage, isRead: true },
          };
        }
        return c;
      })
    );
  };

  // Send message
  const handleSendMessage = (contentToSend?: string, mediaType: 'TEXT' | 'IMAGE' | 'AUDIO' = 'TEXT', mediaUrl?: string) => {
    const text = contentToSend !== undefined ? contentToSend : messageText;
    if (!text.trim() && !mediaUrl) return;

    const newMessage: ChatMessageItem = {
      id: `msg-${Date.now()}`,
      conversationId: activeConversation.id,
      senderId: 'me',
      senderName: 'Bạn',
      senderAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      content: text.trim(),
      mediaType,
      mediaUrl,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMine: true,
      status: 'sent',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            lastMessage: {
              text: mediaType === 'IMAGE' ? 'Bạn: [Hình ảnh]' : `Bạn: ${text}`,
              senderId: 'me',
              senderName: 'Bạn',
              timestamp: newMessage.timestamp,
              isRead: true,
            },
            messages: [...c.messages, newMessage],
          };
        }
        return c;
      })
    );

    setMessageText('');
    inputRef.current?.focus();

    // Auto-reply simulation for demo realism
    if (!activeConversation.isGroup) {
      setTimeout(() => {
        const partnerReplies = [
          'Tuyệt vời quá! Mình đã nhận được rồi nhé.',
          'Cảm ơn bạn! Để mình kiểm tra lại và phản hồi ngay nhé 👍',
          'Đồng ý nhé, giao diện mới nhìn hiện đại và mượt mà lắm!',
          'Okie bạn, hẹn chiều nay trao đổi thêm nha! ☕',
        ];
        const randomReply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];

        const replyMsg: ChatMessageItem = {
          id: `reply-${Date.now()}`,
          conversationId: activeConversation.id,
          senderId: activeConversation.partner?.id || 'partner',
          senderName: activeConversation.name,
          senderAvatar: activeConversation.avatarUrl,
          content: randomReply,
          mediaType: 'TEXT',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: false,
          status: 'delivered',
        };

        setConversations((prev) =>
          prev.map((c) => {
            if (c.id === activeConversation.id) {
              return {
                ...c,
                lastMessage: {
                  text: randomReply,
                  senderId: replyMsg.senderId,
                  senderName: replyMsg.senderName,
                  timestamp: replyMsg.timestamp,
                  isRead: true,
                },
                messages: [...c.messages, replyMsg],
              };
            }
            return c;
          })
        );
      }, 1200);
    }
  };

  // Add reaction to message
  const handleAddReaction = (messageId: string, emoji: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            messages: c.messages.map((m) => {
              if (m.id === messageId) {
                const currentReactions = m.reactions || [];
                const existing = currentReactions.find((r) => r.emoji === emoji);
                let updatedReactions;
                if (existing) {
                  if (existing.userReacted) {
                    updatedReactions = currentReactions
                      .map((r) => (r.emoji === emoji ? { ...r, count: r.count - 1, userReacted: false } : r))
                      .filter((r) => r.count > 0);
                  } else {
                    updatedReactions = currentReactions.map((r) =>
                      r.emoji === emoji ? { ...r, count: r.count + 1, userReacted: true } : r
                    );
                  }
                } else {
                  updatedReactions = [...currentReactions, { emoji, count: 1, userReacted: true }];
                }
                return { ...m, reactions: updatedReactions };
              }
              return m;
            }),
          };
        }
        return c;
      })
    );
  };

  // Start chat with contact from modal or story
  const handleStartChatWithContact = (contact: ChatContact) => {
    const existing = conversations.find((c) => c.partner?.id === contact.id);
    if (existing) {
      handleSelectConversation(existing.id);
    } else {
      const newConv: ChatConversation = {
        id: `conv-${Date.now()}`,
        isGroup: false,
        name: contact.name,
        avatarUrl: contact.avatarUrl,
        unreadCount: 0,
        isOnline: contact.isOnline,
        partner: contact,
        lastMessage: {
          text: 'Bắt đầu cuộc trò chuyện mới',
          senderId: 'me',
          senderName: 'Bạn',
          timestamp: 'Vừa xong',
          isRead: true,
        },
        messages: [
          {
            id: `m-init-${Date.now()}`,
            conversationId: `conv-${Date.now()}`,
            senderId: 'system',
            senderName: 'RySocial',
            senderAvatar: '',
            content: `Các bạn đã kết nối trên RySocial. Hãy gửi lời chào đến ${contact.name}! 👋`,
            mediaType: 'TEXT',
            timestamp: 'Vừa xong',
            isMine: false,
          },
        ],
      };
      setConversations([newConv, ...conversations]);
      setActiveChatId(newConv.id);
    }
    setShowNewChatModal(false);
    setIsMobileChatOpen(true);
  };

  return (
    <div className="bg-white dark:bg-[#121212] rounded-3xl border border-gray-100 dark:border-[#262626] shadow-sm overflow-hidden flex h-[calc(100vh-6.5rem)] min-h-[580px] max-h-[820px] transition-colors duration-200">
      {/* 1. Left Conversation List Sidebar */}
      <div
        className={clsx(
          'w-full md:w-[320px] lg:w-[340px] flex-shrink-0 border-r border-gray-100 dark:border-[#262626] flex flex-col h-full bg-white dark:bg-[#121212]',
          isMobileChatOpen ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Header with Title & New Chat button */}
        <div className="p-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
            {t('messages.title')}
          </h1>
          <button
            onClick={() => setShowNewChatModal(true)}
            className="p-2 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] hover:bg-blue-100 dark:hover:bg-blue-900/60 transition cursor-pointer"
            title={t('messages.newMessage')}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Search Conversations */}
        <div className="p-3">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6] transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Active Now Horizontal Story List */}
        <div className="px-3 pb-3 border-b border-gray-100 dark:border-[#262626]">
          <p className="text-[11px] font-bold text-gray-400 dark:text-[#737373] uppercase mb-2 px-1">
            {t('messages.activeNow')}
          </p>
          <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
            {INITIAL_ACTIVE_CONTACTS.map((contact) => (
              <button
                key={contact.id}
                onClick={() => handleStartChatWithContact(contact)}
                className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                title={contact.name}
              >
                <UserAvatar
                  userId={contact.id}
                  src={contact.avatarUrl}
                  alt={contact.name}
                  presenceStatus={contact.isOnline ? 'online' : 'offline'}
                  size="lg"
                  className="w-11 h-11 border-2 border-transparent group-hover:border-[#004AC6] dark:group-hover:border-[#0095F6] transition"
                />
                <span className="text-[10px] text-gray-700 dark:text-[#D4D4D4] font-medium truncate max-w-[50px]">
                  {contact.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Tabs: All, Unread, Groups */}
        <div className="flex items-center gap-1 px-3 py-2 border-b border-gray-100 dark:border-[#262626] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              activeTab === 'all'
                ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'text-gray-500 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
            )}
          >
            {t('messages.tabs.all')}
          </button>
          <button
            onClick={() => setActiveTab('unread')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              activeTab === 'unread'
                ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'text-gray-500 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
            )}
          >
            {t('messages.tabs.unread')}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              activeTab === 'groups'
                ? 'bg-[#EFF6FF] dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                : 'text-gray-500 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
            )}
          >
            {t('messages.tabs.groups')}
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
          {filteredConversations.length === 0 ? (
            <div className="text-center py-8 px-4 text-gray-400 dark:text-[#737373]">
              <p className="text-xs">{t('messages.noConversations')}</p>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isSelected = conv.id === activeConversation.id;
              return (
                <div
                  key={conv.id}
                  onClick={() => handleSelectConversation(conv.id)}
                  className={clsx(
                    'flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition relative',
                    isSelected
                      ? 'bg-[#EFF6FF] dark:bg-blue-950/60'
                      : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                  )}
                >
                  <UserAvatar
                    userId={conv.partner?.id}
                    src={conv.avatarUrl}
                    alt={conv.name}
                    presenceStatus={conv.isOnline ? 'online' : 'offline'}
                    size="lg"
                    className="w-12 h-12"
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1 truncate">
                        <span
                          className={clsx(
                            'text-xs font-bold truncate',
                            isSelected
                              ? 'text-[#004AC6] dark:text-[#0095F6]'
                              : 'text-gray-900 dark:text-[#F5F5F5]'
                          )}
                        >
                          {conv.name}
                        </span>
                        {conv.partner?.isVerified && (
                          <span className="text-[#0095F6] text-[10px]">✓</span>
                        )}
                      </div>
                      <span className="text-[10px] text-gray-400 dark:text-[#737373] shrink-0">
                        {conv.lastMessage.timestamp}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={clsx(
                          'text-[11px] truncate',
                          conv.unreadCount > 0
                            ? 'font-bold text-gray-900 dark:text-[#F5F5F5]'
                            : 'text-gray-500 dark:text-[#A8A8A8]'
                        )}
                      >
                        {conv.lastMessage.text}
                      </p>
                      <div className="flex items-center gap-1 shrink-0">
                        {conv.isPinned && (
                          <Pin className="w-3 h-3 text-gray-400 fill-gray-400 -rotate-45" />
                        )}
                        {conv.unreadCount > 0 && (
                          <span className="w-4 h-4 rounded-full bg-[#004AC6] dark:bg-[#0095F6] text-white text-[9px] font-bold flex items-center justify-center">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 2. Main Active Chat Pane */}
      <div
        className={clsx(
          'flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-[#0E0E0E]',
          !isMobileChatOpen ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Chat Top Header */}
        <div className="px-4 py-3 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Back Button */}
            <button
              onClick={() => setIsMobileChatOpen(false)}
              className="md:hidden p-1.5 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <UserAvatar
              userId={activeConversation.partner?.id}
              src={activeConversation.avatarUrl}
              alt={activeConversation.name}
              presenceStatus={activeConversation.isOnline ? 'online' : 'offline'}
              size="md"
            />

            <div>
              <div className="flex items-center gap-1">
                <h2 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5]">
                  {activeConversation.name}
                </h2>
                {activeConversation.partner?.isVerified && (
                  <span className="text-[#0095F6] text-xs">✓</span>
                )}
              </div>
              <p className="text-[11px] text-gray-400 dark:text-[#737373]">
                {activeConversation.isGroup
                  ? `${activeConversation.membersCount || 12} thành viên`
                  : activeConversation.isOnline
                  ? t('messages.online')
                  : activeConversation.partner?.lastActive || 'Ngoại tuyến'}
              </p>
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => toast.success(t('messages.callingToast', { name: activeConversation.name }))}
              className="p-2 text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:text-[#004AC6] rounded-2xl transition cursor-pointer"
              title={t('messages.audioCall')}
            >
              <Phone className="w-4 h-4" />
            </button>
            <button
              onClick={() => toast.success(`Đang mở camera và gọi video tới ${activeConversation.name}...`)}
              className="p-2 text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] hover:text-[#004AC6] rounded-2xl transition cursor-pointer"
              title={t('messages.videoCall')}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowInfoDrawer(!showInfoDrawer)}
              className={clsx(
                'p-2 rounded-2xl transition cursor-pointer',
                showInfoDrawer
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]'
                  : 'text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
              )}
              title={t('messages.conversationDetails')}
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Message Thread History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          <div className="text-center">
            <span className="text-[11px] font-medium bg-gray-200/80 dark:bg-[#1E1E1E] text-gray-600 dark:text-[#A8A8A8] px-3 py-1 rounded-full">
              Hôm nay
            </span>
          </div>

          {activeConversation.messages.map((msg) => {
            const isMine = msg.isMine;
            return (
              <div
                key={msg.id}
                className={clsx(
                  'flex items-end gap-2 group relative',
                  isMine ? 'justify-end' : 'justify-start'
                )}
              >
                {!isMine && (
                  <img
                    src={msg.senderAvatar || activeConversation.avatarUrl}
                    alt={msg.senderName}
                    className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                  />
                )}

                <div
                  className={clsx(
                    'max-w-[80%] sm:max-w-[70%] rounded-3xl p-3 shadow-xs relative text-xs leading-relaxed',
                    isMine
                      ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-br-xs'
                      : 'bg-white dark:bg-[#1E1E1E] text-gray-900 dark:text-[#F5F5F5] border border-gray-100 dark:border-[#2A2A2A] rounded-bl-xs'
                  )}
                >
                  {/* Sender Name if Group & not mine */}
                  {activeConversation.isGroup && !isMine && (
                    <p className="text-[10px] font-bold text-blue-500 mb-1">
                      {msg.senderName}
                    </p>
                  )}

                  {/* Content: Text */}
                  {msg.mediaType === 'TEXT' && <p>{msg.content}</p>}

                  {/* Content: Image */}
                  {msg.mediaType === 'IMAGE' && msg.mediaUrl && (
                    <div className="space-y-1.5">
                      <img
                        src={msg.mediaUrl}
                        alt="attachment"
                        className="rounded-2xl max-h-56 w-full object-cover cursor-pointer hover:opacity-95 transition"
                        onClick={() => window.open(msg.mediaUrl, '_blank')}
                      />
                      {msg.content && <p className="pt-1">{msg.content}</p>}
                    </div>
                  )}

                  {/* Content: Voice Audio Note */}
                  {msg.mediaType === 'AUDIO' && (
                    <div className="flex items-center gap-2.5 py-1 min-w-[180px]">
                      <button
                        onClick={() =>
                          setPlayingAudioId(playingAudioId === msg.id ? null : msg.id)
                        }
                        className={clsx(
                          'w-8 h-8 rounded-full flex items-center justify-center transition cursor-pointer',
                          isMine
                            ? 'bg-white/20 hover:bg-white/30 text-white'
                            : 'bg-[#004AC6] text-white'
                        )}
                      >
                        {playingAudioId === msg.id ? (
                          <Pause className="w-3.5 h-3.5 fill-current" />
                        ) : (
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className="h-2 bg-white/30 dark:bg-[#363636] rounded-full overflow-hidden">
                          <div
                            className={clsx(
                              'h-full bg-white dark:bg-[#0095F6] rounded-full transition-all duration-300',
                              playingAudioId === msg.id ? 'w-3/4 animate-pulse' : 'w-1/3'
                            )}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] opacity-80 mt-1">
                          <span>{msg.audioDuration || '0:24'}</span>
                          <span>{playingAudioId === msg.id ? 'Đang phát...' : 'Ghi âm'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamp & Status Icon */}
                  <div
                    className={clsx(
                      'flex items-center justify-end gap-1 text-[9px] mt-1 select-none',
                      isMine ? 'text-white/80' : 'text-gray-400 dark:text-[#737373]'
                    )}
                  >
                    <span>{msg.timestamp}</span>
                    {isMine && (
                      <span>
                        {msg.status === 'read' ? (
                          <CheckCheck className="w-3 h-3 text-cyan-300" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                      </span>
                    )}
                  </div>

                  {/* Message Reactions Pills */}
                  {msg.reactions && msg.reactions.length > 0 && (
                    <div className="absolute -bottom-2.5 right-2 flex items-center gap-1 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#363636] rounded-full px-1.5 py-0.5 shadow-xs text-[10px]">
                      {msg.reactions.map((r, i) => (
                        <span key={i} className="flex items-center gap-0.5">
                          <span>{r.emoji}</span>
                          <span className="font-bold text-gray-700 dark:text-[#D4D4D4]">
                            {r.count}
                          </span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Hover Quick Reaction Toolbar */}
                <div
                  className={clsx(
                    'opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#363636] rounded-full px-2 py-1 shadow-sm shrink-0',
                    isMine ? 'order-first' : 'order-last'
                  )}
                >
                  {['❤️', '👍', '🔥', '😂'].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => handleAddReaction(msg.id, emoji)}
                      className="hover:scale-125 transition text-xs p-0.5 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-[#262626]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            {/* Image Attachment Button */}
            <button
              type="button"
              onClick={() => {
                const sampleImages = [
                  'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80',
                  'https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=800&auto=format&fit=crop&q=80',
                ];
                const randomImg = sampleImages[Math.floor(Math.random() * sampleImages.length)];
                handleSendMessage('Gửi bạn tấm ảnh này nhé!', 'IMAGE', randomImg);
                toast.success('Đã gửi tệp ảnh đính kèm');
              }}
              className="p-2 text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full transition cursor-pointer"
              title="Đính kèm ảnh"
            >
              <ImageIcon className="w-5 h-5" />
            </button>

            {/* Voice Memo Button */}
            <button
              type="button"
              onClick={() => {
                handleSendMessage('Tin nhắn ghi âm nhanh', 'AUDIO');
                toast.success('Đã gửi tin nhắn thoại ghi âm');
              }}
              className="p-2 text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] hover:bg-gray-100 dark:hover:bg-[#1A1A1A] rounded-full transition cursor-pointer"
              title="Ghi âm tin nhắn thoại"
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={t('messages.typeMessagePlaceholder')}
                className="w-full pl-4 pr-10 py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-full text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6] transition"
              />
              <button
                type="button"
                onClick={() => setMessageText((prev) => prev + ' 😊 ')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition"
              >
                <Smile className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Like ThumbsUp or Send Button */}
            {messageText.trim() ? (
              <button
                type="submit"
                className="p-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-full hover:opacity-90 transition cursor-pointer shadow-sm shadow-blue-500/20"
                title={t('messages.send')}
              >
                <Send className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSendMessage('👍')}
                className="p-2.5 text-[#004AC6] dark:text-[#0095F6] hover:bg-blue-50 dark:hover:bg-blue-950/60 rounded-full transition cursor-pointer"
                title="Gửi biểu tượng thích"
              >
                <ThumbsUp className="w-5 h-5 fill-current" />
              </button>
            )}
          </form>
        </div>
      </div>

      {/* 3. Right Details Drawer (Toggleable) */}
      {showInfoDrawer && (
        <div className="w-[280px] flex-shrink-0 border-l border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] flex flex-col p-4 overflow-y-auto custom-scrollbar animate-slideInRight">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
            <h3 className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5]">
              {t('messages.conversationDetails')}
            </h3>
            <button
              onClick={() => setShowInfoDrawer(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Partner Avatar & Profile Summary */}
          <div className="flex flex-col items-center text-center mb-6">
            <UserAvatar
              userId={activeConversation.partner?.id}
              src={activeConversation.avatarUrl}
              alt={activeConversation.name}
              presenceStatus={activeConversation.isOnline ? 'online' : 'offline'}
              size="xl"
              className="w-16 h-16 mb-2 border-2 border-white dark:border-[#262626] shadow-sm"
            />
            <h4 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5]">
              {activeConversation.name}
            </h4>
            <p className="text-xs text-gray-400 dark:text-[#737373] mb-3">
              {activeConversation.partner ? `@${activeConversation.partner.username}` : 'Nhóm thảo luận'}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => toast.success('Đã tắt thông báo cho cuộc trò chuyện này')}
                className="p-2 rounded-xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                <VolumeX className="w-3.5 h-3.5" />
                <span>{t('messages.muteNotifications')}</span>
              </button>
            </div>
          </div>

          {/* Shared Media Gallery Preview */}
          <div className="space-y-3 mb-6">
            <h5 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5]">
              {t('messages.sharedMedia')}
            </h5>
            <div className="grid grid-cols-3 gap-1.5">
              <img
                src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80"
                alt="media 1"
                className="w-full h-16 object-cover rounded-xl cursor-pointer hover:opacity-90"
              />
              <img
                src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=200&auto=format&fit=crop&q=80"
                alt="media 2"
                className="w-full h-16 object-cover rounded-xl cursor-pointer hover:opacity-90"
              />
              <img
                src="https://images.unsplash.com/photo-1593062096033-9a26b09da705?w=200&auto=format&fit=crop&q=80"
                alt="media 3"
                className="w-full h-16 object-cover rounded-xl cursor-pointer hover:opacity-90"
              />
            </div>
          </div>

          {/* Privacy & Danger Actions */}
          <div className="border-t border-gray-100 dark:border-[#262626] pt-4 space-y-2 text-xs">
            <button
              onClick={() => toast.error('Đã báo cáo cuộc trò chuyện')}
              className="w-full text-left py-2 px-2.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 cursor-pointer font-medium"
            >
              <Shield className="w-4 h-4" />
              <span>{t('messages.reportUser')}</span>
            </button>
            <button
              onClick={() => {
                setConversations((prev) => prev.filter((c) => c.id !== activeConversation.id));
                toast.success('Đã xóa cuộc trò chuyện');
                setShowInfoDrawer(false);
              }}
              className="w-full text-left py-2 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium"
            >
              <Trash2 className="w-4 h-4" />
              <span>Xóa lịch sử cuộc trò chuyện</span>
            </button>
          </div>
        </div>
      )}

      {/* 4. New Chat Modal */}
      {showNewChatModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowNewChatModal(false)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-md w-full p-5 border border-gray-100 dark:border-[#262626] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-[#F5F5F5]">
                {t('messages.newMessageModalTitle')}
              </h3>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-gray-500 dark:text-[#A8A8A8] mb-3">
              {t('messages.selectRecipient')}
            </p>

            <div className="space-y-1.5 max-h-72 overflow-y-auto custom-scrollbar">
              {INITIAL_ACTIVE_CONTACTS.map((contact) => (
                <div
                  key={contact.id}
                  onClick={() => handleStartChatWithContact(contact)}
                  className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-gray-100 dark:hover:bg-[#1E1E1E] cursor-pointer transition"
                >
                  <img
                    src={contact.avatarUrl}
                    alt={contact.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate">
                      {contact.name}
                    </p>
                    <p className="text-[11px] text-gray-400 truncate">@{contact.username}</p>
                  </div>
                  {contact.isOnline && (
                    <span className="text-[10px] text-emerald-500 font-semibold">Trực tuyến</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;
