import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useDockedChat } from '../../contexts/DockedChatContext';
import DockedChatWindow from './DockedChatWindow';

export const DockedChatContainer: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const { dockedChatIds, minimizedChatIds, closeMiniChat, toggleMinimizeMiniChat } =
    useDockedChat();

  if (!isAuthenticated || dockedChatIds.length === 0) return null;

  return (
    <div
      className="hidden md:flex fixed bottom-0 right-3 sm:right-6 z-40 items-end gap-3 pointer-events-none select-none max-w-[calc(100vw-1.5rem)] overflow-visible"
      data-purpose="docked-chat-container"
    >
      {dockedChatIds.map((convId) => {
        const isMinimized = minimizedChatIds.has(convId);

        return (
          <div key={convId} className="pointer-events-auto animate-slideUp">
            <DockedChatWindow
              conversationId={convId}
              isMinimized={isMinimized}
              onClose={() => closeMiniChat(convId)}
              onToggleMinimize={() => toggleMinimizeMiniChat(convId)}
            />
          </div>
        );
      })}
    </div>
  );
};

export default DockedChatContainer;
