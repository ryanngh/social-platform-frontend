import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useChat } from '../contexts/ChatContext';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatHeader from '../components/chat/ChatHeader';
import ChatMessageList from '../components/chat/ChatMessageList';
import ChatInputBar from '../components/chat/ChatInputBar';
import ChatInfoDrawer from '../components/chat/ChatInfoDrawer';
import NewConversationModal from '../components/chat/NewConversationModal';
import AddGroupMemberModal from '../components/chat/AddGroupMemberModal';
import ConfirmClearHistoryModal from '../components/chat/ConfirmClearHistoryModal';
import type { ChatMessage } from '../types/chat';
import clsx from 'clsx';

export const MessagesPage: React.FC = () => {
  const { chatId } = useParams<{ chatId?: string }>();
  const navigate = useNavigate();
  const { selectConversation, activeConversationId, conversations } = useChat();

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [replyingMessage, setReplyingMessage] = useState<ChatMessage | null>(null);
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(Boolean(chatId));

  // Sync route param chatId
  useEffect(() => {
    if (chatId) {
      if (chatId !== activeConversationId) {
        selectConversation(chatId);
      }
      setIsMobileChatOpen(true);
    } else {
      setIsMobileChatOpen(false);
      if (!activeConversationId && conversations.length > 0) {
        selectConversation(conversations[0].id);
      }
    }
  }, [chatId, activeConversationId, conversations, selectConversation]);

  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    navigate(`/messages/${id}`);
    setIsMobileChatOpen(true);
  };

  const handleReplyMessage = (message: ChatMessage) => {
    setReplyingMessage(message);
  };

  const handleAddReaction = (_messageId: string, _emoji: string) => {
    // Optional client reaction animation
  };

  return (
    <div className="bg-white dark:bg-[#121212] rounded-none sm:rounded-3xl border-0 sm:border border-gray-100 dark:border-[#262626] shadow-none sm:shadow-2xs overflow-hidden flex h-[calc(100dvh-3.5rem-env(safe-area-inset-top,0px))] sm:h-[calc(100vh-6.5rem)] min-h-0 sm:min-h-[580px] sm:max-h-[820px] transition-colors duration-200">
      {/* 1. Left Conversation List Sidebar */}
      <ChatSidebar
        onOpenNewChatModal={() => setShowNewChatModal(true)}
        isMobileChatOpen={isMobileChatOpen}
        onSelectConversation={handleSelectConversation}
      />

      {/* 2. Main Active Chat Pane */}
      <div
        className={clsx(
          'flex-1 flex flex-col h-full bg-gray-50/50 dark:bg-[#0E0E0E] min-w-0 transition-all',
          !isMobileChatOpen ? 'hidden md:flex' : 'flex'
        )}
      >
        {/* Chat Header */}
        <ChatHeader
          onBackMobile={() => {
            setIsMobileChatOpen(false);
            navigate('/messages');
          }}
          showInfoDrawer={showInfoDrawer}
          onToggleInfoDrawer={() => setShowInfoDrawer(!showInfoDrawer)}
        />

        {/* Message Thread History */}
        <ChatMessageList
          onReplyMessage={handleReplyMessage}
          onAddReaction={handleAddReaction}
        />

        {/* Input Bar */}
        <ChatInputBar
          replyingMessage={replyingMessage}
          onCancelReply={() => setReplyingMessage(null)}
        />
      </div>

      {/* 3. Right Details Drawer */}
      {showInfoDrawer && (
        <ChatInfoDrawer
          onClose={() => setShowInfoDrawer(false)}
          onOpenAddMemberModal={() => setShowAddMemberModal(true)}
          onOpenClearHistoryModal={() => setShowClearHistoryModal(true)}
        />
      )}

      {/* 4. Modals */}
      <NewConversationModal
        isOpen={showNewChatModal}
        onClose={() => setShowNewChatModal(false)}
      />

      <AddGroupMemberModal
        isOpen={showAddMemberModal}
        onClose={() => setShowAddMemberModal(false)}
      />

      <ConfirmClearHistoryModal
        isOpen={showClearHistoryModal}
        onClose={() => setShowClearHistoryModal(false)}
      />
    </div>
  );
};

export default MessagesPage;
