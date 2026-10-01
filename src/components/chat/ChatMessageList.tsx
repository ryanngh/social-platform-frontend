import React, { useRef, useEffect, useState, useLayoutEffect } from 'react';
import { ChevronDown, Loader2, MessageSquare } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChat } from '../../contexts/ChatContext';
import ChatMessageItem from './ChatMessageItem';
import type { ChatMessage } from '../../types/chat';

interface ChatMessageListProps {
  onReplyMessage: (message: ChatMessage) => void;
  onAddReaction: (messageId: string, emoji: string) => void;
}

const formatDateSeparator = (dateStr: string, language: string, t: any): string => {
  if (!dateStr) return t('messages.today');
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return t('messages.today');

  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  if (isToday) return t('messages.today');

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  const isYesterday =
    d.getDate() === yesterday.getDate() &&
    d.getMonth() === yesterday.getMonth() &&
    d.getFullYear() === yesterday.getFullYear();

  if (isYesterday) return t('messages.yesterday');

  const isSameYear = d.getFullYear() === now.getFullYear();
  if (language === 'vi') {
    return isSameYear
      ? `${d.getDate()} tháng ${d.getMonth() + 1}`
      : `${d.getDate()} thg ${d.getMonth() + 1}, ${d.getFullYear()}`;
  } else {
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: isSameYear ? undefined : 'numeric',
    });
  }
};

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  onReplyMessage,
  onAddReaction,
}) => {
  const { t, language } = useLanguage();
  const {
    activeConversation,
    messages,
    isLoadingMessages,
    isLoadingOlder,
    hasMoreOlderMessages,
    loadOlderMessages,
    editMessage,
    deleteMessage,
    retryMessage,
    typingUsers,
  } = useChat();

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showScrollBottomBtn, setShowScrollBottomBtn] = useState(false);
  const [prevScrollHeight, setPrevScrollHeight] = useState<number | null>(null);

  // Scroll to bottom when opening a conversation or sending a new message
  useEffect(() => {
    if (!isLoadingMessages) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeConversation?.id, messages.length, isLoadingMessages]);

  // Preserve scroll position when older messages are loaded at top
  useLayoutEffect(() => {
    if (prevScrollHeight !== null && containerRef.current) {
      const newHeight = containerRef.current.scrollHeight;
      containerRef.current.scrollTop = newHeight - prevScrollHeight;
      setPrevScrollHeight(null);
    }
  }, [prevScrollHeight, messages]);

  // Handle scroll events (Infinite scroll up & Show/Hide scroll bottom button)
  const handleScroll = () => {
    if (!containerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;

    // Trigger load older messages when near top
    if (scrollTop < 80 && !isLoadingOlder && hasMoreOlderMessages) {
      setPrevScrollHeight(scrollHeight);
      void loadOlderMessages();
    }

    // Show scroll to bottom button if scrolled up > 250px
    const isScrolledUp = scrollHeight - scrollTop - clientHeight > 250;
    setShowScrollBottomBtn(isScrolledUp);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 text-gray-400 dark:text-[#737373]">
        <div className="text-center space-y-2">
          <MessageSquare className="w-12 h-12 mx-auto stroke-1 opacity-50" />
          <p className="text-sm font-medium">{t('messages.noChatSelected')}</p>
          <p className="text-xs text-gray-400 dark:text-[#737373]">
            {t('messages.noChatSelectedDesc')}
          </p>
        </div>
      </div>
    );
  }

  if (isLoadingMessages) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6">
        <Loader2 className="w-8 h-8 text-[#0084FF] dark:text-[#3797F0] animate-spin" />
        <p className="text-xs text-gray-400 dark:text-[#737373]">{t('messages.loadingMessages')}</p>
      </div>
    );
  }

  return (
    <div className="flex-1 relative flex flex-col min-h-0 bg-white dark:bg-[#000000]">
      {/* Messages Scroll Container */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1 custom-scrollbar"
      >
        {/* Loading Older Messages Spinner */}
        {isLoadingOlder && (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-5 h-5 text-[#0084FF] dark:text-[#3797F0] animate-spin" />
          </div>
        )}

        {/* Empty Conversation Banner */}
        {messages.length === 0 ? (
          <div className="text-center py-16 px-4 space-y-3 select-none">
            <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-pink-500/10 via-purple-500/10 to-blue-500/10 dark:from-pink-500/20 dark:via-purple-500/20 dark:to-blue-500/20 text-[#0084FF] dark:text-[#3797F0] flex items-center justify-center mx-auto text-3xl shadow-xs">
              👋
            </div>
            <h3 className="font-semibold text-[16px] text-gray-900 dark:text-[#F5F5F5]">
              {activeConversation.type === 'GROUP'
                ? t('messages.welcomeToGroup', { name: activeConversation.displayName })
                : t('messages.startConversationWith', { name: activeConversation.displayName })}
            </h3>
            <p className="text-[13px] text-[#8E8E8E] dark:text-[#737373] max-w-sm mx-auto leading-relaxed">
              {t('messages.firstMessagePrompt')}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isNewDate =
              !prevMsg ||
              new Date(msg.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

            const quoted = msg.replyToId
              ? messages.find((m) => m.id === msg.replyToId || m.seq === msg.replyToId)
              : null;

            return (
              <React.Fragment key={msg.clientMsgId || msg.id || index}>
                {/* Clean Instagram Date Separator */}
                {isNewDate && (
                  <div className="flex justify-center my-4 sm:my-5 select-none">
                    <span className="text-[11px] font-medium text-[#8E8E8E] dark:text-[#8E8E8E] px-3 py-0.5 rounded-full bg-gray-100/70 dark:bg-[#1A1A1A] tracking-tight">
                      {formatDateSeparator(msg.createdAt, language, t)}
                    </span>
                  </div>
                )}

                <ChatMessageItem
                  message={msg}
                  conversation={activeConversation}
                  onReply={onReplyMessage}
                  onEdit={editMessage}
                  onDelete={deleteMessage}
                  onRetry={retryMessage}
                  onAddReaction={onAddReaction}
                  quotedMessage={quoted}
                />
              </React.Fragment>
            );
          })
        )}

        {/* Instagram-style Typing Indicator Bubble */}
        {typingUsers.size > 0 && (
          <div className="flex items-end gap-2 animate-fadeIn mb-1.5 select-none">
            <div className="w-7 h-7 rounded-full bg-gray-200 dark:bg-[#262626] flex items-center justify-center shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#0084FF] dark:bg-[#3797F0] animate-ping" />
            </div>
            <div className="bg-[#EFEFEF] dark:bg-[#262626] rounded-[18px] rounded-bl-[4px] px-3.5 py-2.5 shadow-2xs flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-400 animate-bounce [animation-delay:-0.3s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-400 animate-bounce [animation-delay:-0.15s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-400 animate-bounce" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Floating Scroll to Bottom FAB */}
      {showScrollBottomBtn && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 right-4 z-20 p-2.5 rounded-full bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#363636] shadow-lg text-gray-700 dark:text-[#F5F5F5] hover:bg-gray-50 dark:hover:bg-[#262626] transition-all hover:scale-105 cursor-pointer flex items-center gap-1"
          title={t('messages.scrollBottom')}
          aria-label={t('messages.scrollBottom')}
        >
          <ChevronDown className="w-4 h-4 text-[#0084FF] dark:text-[#3797F0]" />
        </button>
      )}
    </div>
  );
};

export default ChatMessageList;

