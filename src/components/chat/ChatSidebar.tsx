import React, { useState, useEffect, useMemo } from 'react';
import { Search, Plus, X, Pin, Users, MessageSquare, VolumeX } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { usePresence } from '../../contexts/PresenceContext';
import { userService } from '../../services/userService';
import UserAvatar from '../common/UserAvatar';
import type { UserSummary } from '../../types';
import clsx from 'clsx';

type ConversationTab = 'all' | 'unread' | 'groups';

interface ChatSidebarProps {
  onOpenNewChatModal: () => void;
  isMobileChatOpen: boolean;
  onSelectConversation?: (convId: string) => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onOpenNewChatModal,
  isMobileChatOpen,
  onSelectConversation,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { conversations, activeConversationId, selectConversation, startOrOpenDM } = useChat();
  const { getStatus, subscribeUsers, unsubscribeUsers: _unsubscribeUsers } = usePresence();

  const [activeTab, setActiveTab] = useState<ConversationTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [followingUsers, setFollowingUsers] = useState<UserSummary[]>([]);

  // Load real following friends and subscribe to presence
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    const loadFollowingPresence = async () => {
      try {
        const followingRes = await userService.getFollowing(user.id, { page: 0, size: 20 });
        const list = (followingRes?.content || []).filter((u) => u.id !== user.id);
        if (list.length > 0 && isMounted) {
          setFollowingUsers(list);
          const userIds = list.map((u) => u.id);
          subscribeUsers(userIds);
        }
      } catch (err) {
        console.warn('Could not load following presence:', err);
      }
    };

    void loadFollowingPresence();

    return () => {
      isMounted = false;
    };
  }, [user?.id, subscribeUsers]);

  // Subscribe all conversation DM partner IDs to real-time presence
  useEffect(() => {
    const partnerIds = conversations
      .filter((c) => c.type === 'DM' && c.partner?.id)
      .map((c) => c.partner!.id);
    if (partnerIds.length > 0) {
      subscribeUsers(partnerIds);
    }
  }, [conversations, subscribeUsers]);

  // Filter conversations
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = c.displayName.toLowerCase().includes(q);
        const matchLastMsg = c.lastMessagePreview?.text.toLowerCase().includes(q);
        if (!matchName && !matchLastMsg) return false;
      }
      if (activeTab === 'unread') return c.unreadSeqDistance > 0;
      if (activeTab === 'groups') return c.type === 'GROUP';
      return true;
    });
  }, [conversations, searchQuery, activeTab]);

  const handleSelectFriendStory = async (friend: UserSummary) => {
    const targetId = friend.id || (friend as any).userId;
    if (targetId) {
      const convId = await startOrOpenDM(targetId, friend);
      if (convId && onSelectConversation) {
        onSelectConversation(convId);
      }
    }
  };

  return (
    <div
      className={clsx(
        'w-full md:w-[320px] lg:w-[360px] flex-shrink-0 border-r border-gray-100 dark:border-[#262626] flex flex-col h-full bg-white dark:bg-[#121212] transition-colors',
        isMobileChatOpen ? 'hidden md:flex' : 'flex'
      )}
    >
      {/* 1. Header with Title & New Chat Action */}
      <div className="h-[60px] px-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-[19px] sm:text-[20px] font-bold text-gray-900 dark:text-[#F5F5F5] tracking-tight">
            {t('messages.title')}
          </h1>
          {conversations.length > 0 && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#262626] text-[#8E8E8E] dark:text-[#A8A8A8]">
              {conversations.length}
            </span>
          )}
        </div>

        <button
          onClick={onOpenNewChatModal}
          className="p-2 rounded-full text-gray-800 dark:text-[#F5F5F5] hover:bg-gray-100 dark:hover:bg-[#262626] transition cursor-pointer"
          title={t('messages.newMessage')}
          aria-label={t('messages.newMessage')}
        >
          <Plus className="w-5 h-5 stroke-[2]" />
        </button>
      </div>

      {/* 2. Search Box */}
      <div className="px-3.5 pt-2.5 pb-2">
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E8E] dark:text-[#737373] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('messages.searchPlaceholder')}
            className="w-full pl-8.5 pr-7 py-1.5 bg-[#EFEFEF] dark:bg-[#262626] border-none rounded-xl text-[13px] text-gray-900 dark:text-[#F5F5F5] placeholder-[#8E8E8E] dark:placeholder-[#737373] outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. Following Friends Quick DM Bar */}
      {followingUsers.length > 0 && (
        <div className="px-3.5 pb-2 border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between mb-1.5 px-0.5">
            <p className="text-[11px] font-semibold text-[#8E8E8E] dark:text-[#737373] uppercase tracking-wider">
              {t('messages.followingContacts', { defaultValue: 'Đang theo dõi' })}
            </p>
          </div>

          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 no-scrollbar">
            {followingUsers.map((fUser) => {
              const status = getStatus(fUser.id);
              const displayName =
                [fUser.firstName, fUser.lastName].filter(Boolean).join(' ') ||
                fUser.username ||
                t('messages.you');

              return (
                <button
                  key={fUser.id}
                  onClick={() => handleSelectFriendStory(fUser)}
                  className="flex flex-col items-center gap-1 shrink-0 cursor-pointer group"
                  title={`${displayName} (${status === 'online' ? (language === 'vi' ? 'Đang hoạt động' : 'Active now') : status === 'away' ? (language === 'vi' ? 'Vắng mặt' : 'Away') : (language === 'vi' ? 'Ngoại tuyến' : 'Offline')})`}
                >
                  <div className="relative p-[1.5px] rounded-full group-hover:bg-gradient-to-tr group-hover:from-[#FD5949] group-hover:via-[#D6249F] group-hover:to-[#285AEB] transition">
                    <UserAvatar
                      userId={fUser.id}
                      src={fUser.avatarUrl}
                      alt={displayName}
                      presenceStatus={status}
                      size="lg"
                      className="w-11 h-11 border-2 border-white dark:border-[#121212] shadow-xs"
                    />
                  </div>
                  <span className="text-[11px] text-gray-700 dark:text-[#D4D4D4] font-normal truncate max-w-[54px]">
                    {displayName.split(' ')[0]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. Tab Filter Pills: All / Unread / Groups */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-gray-100 dark:border-[#262626] text-[12px] font-medium">
        <button
          onClick={() => setActiveTab('all')}
          className={clsx(
            'px-3 py-1 rounded-full transition cursor-pointer',
            activeTab === 'all'
              ? 'bg-[#EFEFEF] dark:bg-[#262626] text-gray-900 dark:text-white font-semibold'
              : 'text-[#8E8E8E] dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
          )}
        >
          {t('messages.tabs.all')}
        </button>

        <button
          onClick={() => setActiveTab('unread')}
          className={clsx(
            'px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1',
            activeTab === 'unread'
              ? 'bg-[#EFEFEF] dark:bg-[#262626] text-gray-900 dark:text-white font-semibold'
              : 'text-[#8E8E8E] dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
          )}
        >
          <span>{t('messages.tabs.unread')}</span>
          {conversations.some((c) => c.unreadSeqDistance > 0) && (
            <span className="w-1.5 h-1.5 rounded-full bg-[#0095F6]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('groups')}
          className={clsx(
            'px-3 py-1 rounded-full transition cursor-pointer flex items-center gap-1',
            activeTab === 'groups'
              ? 'bg-[#EFEFEF] dark:bg-[#262626] text-gray-900 dark:text-white font-semibold'
              : 'text-[#8E8E8E] dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
          )}
        >
          <Users className="w-3.5 h-3.5" />
          <span>{t('messages.tabs.groups')}</span>
        </button>
      </div>

      {/* 5. Conversation List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-0.5">
        {filteredConversations.length === 0 ? (
          <div className="text-center py-12 px-4 text-gray-400 dark:text-[#737373] space-y-2.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#0084FF] dark:text-[#3797F0] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <p className="text-[13px] font-semibold text-gray-700 dark:text-[#D4D4D4]">
              {conversations.length === 0
                ? t('messages.noConversations')
                : t('messages.noFilteredConversations')}
            </p>
            <p className="text-[12px] text-[#8E8E8E] max-w-xs mx-auto">
              {conversations.length === 0
                ? t('messages.noConversationsEmptyDesc')
                : t('messages.noFilteredConversationsDesc')}
            </p>
            <button
              onClick={onOpenNewChatModal}
              className="mt-2 px-4 py-2 rounded-full bg-[#0095F6] text-white text-[13px] font-semibold hover:opacity-95 cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('messages.newMessage')}</span>
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = conv.id === activeConversationId;
            const hasUnread = conv.unreadSeqDistance > 0;
            const partnerPresenceStatus = conv.type === 'DM' && conv.partner?.id ? getStatus(conv.partner.id) : (conv.isOnline ? 'online' : 'offline');

            return (
              <div
                key={conv.id}
                onClick={() => {
                  if (onSelectConversation) {
                    onSelectConversation(conv.id);
                  } else {
                    selectConversation(conv.id);
                  }
                }}
                className={clsx(
                  'flex items-center gap-3 p-2.5 rounded-xl cursor-pointer transition relative group',
                  isSelected
                    ? 'bg-[#EFEFEF] dark:bg-[#1E1E1E]'
                    : 'hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                )}
              >
                {/* Avatar */}
                <div className="relative shrink-0">
                  {conv.type === 'GROUP' ? (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs border-2 border-white dark:border-[#262626]">
                      <Users className="w-5 h-5" />
                    </div>
                  ) : (
                    <UserAvatar
                      userId={conv.partner?.id}
                      src={conv.avatarUrl}
                      alt={conv.displayName}
                      presenceStatus={partnerPresenceStatus}
                      size="lg"
                      className="w-12 h-12 shadow-xs"
                    />
                  )}
                </div>

                {/* Info & Last Message */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span
                      className={clsx(
                        'text-[14px] truncate max-w-[170px]',
                        hasUnread
                          ? 'text-gray-950 dark:text-white font-bold'
                          : 'text-gray-900 dark:text-[#F5F5F5] font-semibold'
                      )}
                    >
                      {conv.displayName}
                    </span>

                    <span
                      className={clsx(
                        'text-[11px] shrink-0 font-normal',
                        hasUnread
                          ? 'text-[#0095F6] font-semibold'
                          : 'text-[#8E8E8E] dark:text-[#737373]'
                      )}
                    >
                      {conv.lastMessagePreview?.timestamp || ''}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={clsx(
                        'text-[13px] truncate leading-tight',
                        hasUnread
                          ? 'font-semibold text-gray-900 dark:text-[#F5F5F5]'
                          : 'text-[#8E8E8E] dark:text-[#A8A8A8] font-normal'
                      )}
                    >
                      {conv.lastMessagePreview?.text || t('messages.startChatPrompt')}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {conv.isMuted && (
                        <VolumeX className="w-3.5 h-3.5 text-[#8E8E8E] dark:text-[#737373]" />
                      )}
                      {conv.isPinned && (
                        <Pin className="w-3 h-3 text-[#8E8E8E] dark:text-[#737373] fill-gray-400 -rotate-45" />
                      )}
                      {hasUnread && (
                        <span className="w-2 h-2 rounded-full bg-[#0095F6]" />
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
  );
};

export default ChatSidebar;
