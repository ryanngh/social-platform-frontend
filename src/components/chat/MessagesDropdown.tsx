import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search,
  CheckCheck,
  Plus,
  Maximize2,
  X,
  MessageSquare,
  Users,
  ArrowRight,
  Loader2,
  VolumeX,
  Pin,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChat } from '../../contexts/ChatContext';
import { useDockedChat } from '../../contexts/DockedChatContext';
import UserAvatar from '../common/UserAvatar';
import NewConversationModal from './NewConversationModal';
import type { ChatConversationItem } from '../../types/chat';
import clsx from 'clsx';

interface MessagesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'all' | 'unread' | 'groups';

export const MessagesDropdown: React.FC<MessagesDropdownProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    conversations,
    isLoadingConversations,
    unreadTotal,
    markAsRead,
    selectConversation,
  } = useChat();
  const { openMiniChat } = useDockedChat();

  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !showNewChatModal
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, showNewChatModal]);

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

  if (!isOpen) return null;

  const handleConversationClick = (conv: ChatConversationItem) => {
    onClose();
    if (window.innerWidth < 768 || location.pathname.startsWith('/messages')) {
      selectConversation(conv.id);
      navigate(`/messages/${conv.id}`);
    } else {
      // Open floating mini chat box at bottom right
      openMiniChat(conv.id);
    }
  };

  const handleMarkAllAsRead = () => {
    conversations.forEach((c) => {
      if (c.unreadSeqDistance > 0) {
        markAsRead(c.id, c.lastSeq);
      }
    });
  };

  const handleViewAll = () => {
    onClose();
    navigate('/messages');
  };

  return (
    <>
      <div
        ref={popupRef}
        className="absolute right-0 top-12 sm:top-14 w-[380px] sm:w-[410px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#181818] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#2E2E2E] z-50 overflow-hidden flex flex-col max-h-[620px] animate-fadeIn"
      >
        {/* 1. Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-gray-900 dark:text-[#F5F5F5] tracking-tight">
              {t('messages.title')}
            </h2>
            {unreadTotal > 0 && (
              <span className="bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] font-bold px-2.5 py-0.5 rounded-full text-xs animate-pulse">
                {unreadTotal > 99 ? '99+' : unreadTotal} {t('messages.tabs.unread').toLowerCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {/* Mark all read */}
            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                title="Đánh dấu tất cả đã đọc"
                className="p-1.5 text-gray-500 hover:text-[#004AC6] dark:text-[#A0A0A0] dark:hover:text-[#0095F6] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
              </button>
            )}

            {/* Open full page */}
            <button
              type="button"
              onClick={handleViewAll}
              title="Mở toàn màn hình"
              className="p-1.5 text-gray-500 hover:text-[#004AC6] dark:text-[#A0A0A0] dark:hover:text-[#0095F6] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

            {/* New message button */}
            <button
              type="button"
              onClick={() => setShowNewChatModal(true)}
              title={t('messages.newMessage')}
              className="p-1.5 text-gray-700 hover:text-[#004AC6] dark:text-[#F5F5F5] dark:hover:text-[#0095F6] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* 2. Search Input Box */}
        <div className="px-4 py-2.5 bg-gray-50/60 dark:bg-[#1C1C1C] border-b border-gray-100 dark:border-[#262626]">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.searchPlaceholder')}
              className="w-full pl-9 pr-7 py-1.5 bg-white dark:bg-[#262626] border border-gray-200/80 dark:border-[#333333] rounded-xl text-xs text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:border-[#004AC6] dark:focus:border-[#0095F6] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* 3. Filter Tabs */}
        <div className="px-4 py-2 bg-gray-50/40 dark:bg-[#1A1A1A] flex items-center justify-between border-b border-gray-100 dark:border-[#262626] text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={clsx(
                'px-3 py-1 rounded-full transition cursor-pointer',
                activeTab === 'all'
                  ? 'bg-white dark:bg-[#2D2D2D] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {t('messages.tabs.all')}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={clsx(
                'px-3 py-1 rounded-full transition flex items-center gap-1 cursor-pointer',
                activeTab === 'unread'
                  ? 'bg-white dark:bg-[#2D2D2D] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <span>{t('messages.tabs.unread')}</span>
              {unreadTotal > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#004AC6] dark:bg-[#0095F6]" />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('groups')}
              className={clsx(
                'px-3 py-1 rounded-full transition flex items-center gap-1 cursor-pointer',
                activeTab === 'groups'
                  ? 'bg-white dark:bg-[#2D2D2D] text-[#004AC6] dark:text-[#0095F6] shadow-xs font-bold'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-white'
              )}
            >
              <Users className="w-3.5 h-3.5" />
              <span>{t('messages.tabs.groups')}</span>
            </button>
          </div>
        </div>

        {/* 4. Conversation List */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-[#242424] custom-scrollbar max-h-[380px]">
          {isLoadingConversations ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-[#004AC6]" />
              <span className="text-xs">{t('common.loading')}</span>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="py-12 px-6 text-center text-gray-400 dark:text-[#737373]">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#242424] flex items-center justify-center mx-auto mb-3">
                <MessageSquare className="w-6 h-6 text-gray-300 dark:text-[#525252]" />
              </div>
              <p className="text-xs font-semibold text-gray-600 dark:text-[#A0A0A0]">
                {conversations.length === 0
                  ? t('messages.noConversations')
                  : t('messages.noFilteredConversations')}
              </p>
              <p className="text-[12px] text-gray-400 dark:text-[#666666] mt-1 max-w-xs mx-auto">
                {conversations.length === 0
                  ? t('messages.noConversationsEmptyDesc')
                  : t('messages.noFilteredConversationsDesc')}
              </p>
              <button
                type="button"
                onClick={() => setShowNewChatModal(true)}
                className="mt-3 px-3.5 py-1.5 bg-[#004AC6] dark:bg-[#0095F6] text-white text-xs font-semibold rounded-full hover:opacity-90 transition cursor-pointer inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('messages.newMessage')}</span>
              </button>
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const hasUnread = conv.unreadSeqDistance > 0;


              return (
                <div
                  key={conv.id}
                  onClick={() => handleConversationClick(conv)}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-3 cursor-pointer transition relative group',
                    hasUnread
                      ? 'bg-blue-50/40 dark:bg-blue-950/20 hover:bg-blue-50/70 dark:hover:bg-blue-950/40'
                      : 'hover:bg-gray-50 dark:hover:bg-[#202020]'
                  )}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    {conv.type === 'GROUP' ? (
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border border-white dark:border-[#262626]">
                        <Users className="w-5 h-5" />
                      </div>
                    ) : (
                      <UserAvatar
                        userId={conv.partner?.id}
                        src={conv.avatarUrl}
                        alt={conv.displayName}
                        size="md"
                        className="w-11 h-11 shadow-xs"
                      />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span
                        className={clsx(
                          'text-xs truncate max-w-[190px]',
                          hasUnread
                            ? 'text-gray-950 dark:text-white font-bold'
                            : 'text-gray-900 dark:text-[#F5F5F5] font-semibold'
                        )}
                      >
                        {conv.displayName}
                      </span>

                      <span
                        className={clsx(
                          'text-[12px] shrink-0',
                          hasUnread
                            ? 'text-[#004AC6] dark:text-[#0095F6] font-bold'
                            : 'text-gray-400 dark:text-[#737373]'
                        )}
                      >
                        {conv.lastMessagePreview?.timestamp || ''}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-1">
                      <p
                        className={clsx(
                          'text-[12px] truncate leading-tight',
                          hasUnread
                            ? 'font-bold text-gray-900 dark:text-[#F5F5F5]'
                            : 'text-gray-500 dark:text-[#A0A0A0] font-normal'
                        )}
                      >
                        {conv.lastMessagePreview?.text || t('messages.startChatPrompt')}
                      </p>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {conv.isMuted && <VolumeX className="w-3 h-3 text-gray-400" />}
                        {conv.isPinned && <Pin className="w-3 h-3 text-gray-400 fill-gray-400 -rotate-45" />}
                        {hasUnread && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#004AC6] dark:bg-[#0095F6] shadow-xs" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* 5. Footer */}
        <div className="p-3 bg-gray-50/80 dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-[#262626] text-center">
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer"
          >
            <span>{t('messages.seeAllInMessenger', { defaultValue: 'Xem tất cả trong Tin nhắn' })}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* New Conversation Modal */}
      <NewConversationModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
      />
    </>
  );
};

export default MessagesDropdown;
