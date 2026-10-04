import { Link } from 'react-router-dom';
import React from 'react';
import { Phone, Video, Info, ArrowLeft, WifiOff, RefreshCw, Users } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCall } from '../../contexts/CallContext';
import { useChat } from '../../contexts/ChatContext';
import UserAvatar from '../common/UserAvatar';
import clsx from 'clsx';

interface ChatHeaderProps {
  onBackMobile: () => void;
  showInfoDrawer: boolean;
  onToggleInfoDrawer: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  onBackMobile,
  showInfoDrawer,
  onToggleInfoDrawer,
}) => {
  const { t } = useLanguage();
  const { startCall, enabled: callingEnabled, ready: callingReady, status: callStatus } = useCall();
  const { activeConversation, connectionState, reconnectWs, typingUsers } = useChat();

  const isGroup = activeConversation?.type === 'GROUP';
  if (!activeConversation) {
    return (
      <div className="h-16 px-4 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-[#262626] flex items-center justify-between" />
    );
  }

  const hasTyping = typingUsers.size > 0;

  const handleStartCall = (callType: 'audio' | 'video') => {
    const target = {
      id: activeConversation.partner?.id || activeConversation.id,
      name: activeConversation.partner?.displayName || activeConversation.displayName,
      username: activeConversation.partner?.username || activeConversation.displayName.toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: activeConversation.partner?.avatarUrl || activeConversation.avatarUrl || '',
    };
    if (isGroup || activeConversation.canCall === false) return; void startCall(activeConversation.id, callType, target);
  };

  return (
    <div className="h-[60px] px-4 bg-white dark:bg-[#121212] border-b border-gray-100 dark:border-[#262626] flex items-center justify-between transition-colors shadow-2xs">
      {/* 1. Left Partner/Group Info */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onBackMobile}
          className="md:hidden p-1.5 -ml-1 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full cursor-pointer transition"
          aria-label="Back to conversations list"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <Link to={isGroup || activeConversation.partnerDeleted ? "#" : `/${activeConversation.partner?.username || activeConversation.partner?.id}`} onClick={e => { if (isGroup || activeConversation.partnerDeleted) e.preventDefault(); }} className="flex gap-3 items-center min-w-0">
        {isGroup ? (
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs border-2 border-white dark:border-[#262626] shrink-0">
            <Users className="w-4 h-4" />
          </div>
        ) : (
          <UserAvatar
            userId={activeConversation.partner?.id}
            src={activeConversation.avatarUrl}
            alt={activeConversation.displayName}
            size="md"
            className="w-9 h-9 sm:w-10 sm:h-10 shadow-xs"
          />
        )}

        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-semibold text-[15px] text-gray-900 dark:text-[#F5F5F5] truncate max-w-[180px] sm:max-w-[280px] leading-tight">
              {activeConversation.displayName}
            </h2>
            {isGroup && (
              <span className="text-[12px] font-semibold px-1.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6]">
                {t('messages.group')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[12px] leading-tight mt-0.5">
            {hasTyping ? (
              <span className="text-[#0084FF] dark:text-[#3797F0] font-medium animate-pulse">
                {t('messages.typing')}
              </span>
            ) : isGroup ? (
              <span className="text-gray-400 dark:text-[#737373]">
                {t('messages.membersCount', { count: activeConversation.members?.length || 4 })}
              </span>
            ) : (
              <span />
            )}

            {/* Offline / Reconnecting Warning Pill */}
            {connectionState !== 'CONNECTED' && (
              <button
                onClick={reconnectWs}
                className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[12px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 hover:bg-amber-100 transition cursor-pointer"
                title="Bấm để kết nối lại"
              >
                {connectionState === 'CONNECTING' ? (
                  <>
                    <RefreshCw className="w-2.5 h-2.5 animate-spin" />
                    <span>{t('messages.reconnecting')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-2.5 h-2.5" />
                    <span>{t('messages.offlineReconnect')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        </Link>
      </div>

      {/* 2. Action Buttons */}
      <div className="flex items-center gap-1">
        {!isGroup && callingEnabled && <>
        {/* Audio Call */}
        <button
          disabled={activeConversation.canCall === false || !callingReady || !['idle', 'ended'].includes(callStatus)}
            onClick={() => handleStartCall('audio')}
          className="p-2 text-gray-700 dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
          title={t('messages.audioCall')}
          aria-label={t('messages.audioCall')}
        >
          <Phone className="w-5 h-5 stroke-[1.8]" />
        </button>

        {/* Video Call */}
        <button
          disabled={activeConversation.canCall === false || !callingReady || !['idle', 'ended'].includes(callStatus)}
            onClick={() => handleStartCall('video')}
          className="p-2 text-gray-700 dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
          title={t('messages.videoCall')}
          aria-label={t('messages.videoCall')}
        >
          <Video className="w-5 h-5 stroke-[1.8]" />
        </button>

        </>}

        {/* Info Drawer Toggle */}
        <button
          onClick={onToggleInfoDrawer}
          className={clsx(
            'p-2 rounded-full transition cursor-pointer',
            showInfoDrawer
              ? 'bg-blue-50 dark:bg-blue-950/60 text-[#0084FF] dark:text-[#3797F0]'
              : 'text-gray-700 dark:text-[#E0E0E0] hover:bg-gray-100 dark:hover:bg-[#262626]'
          )}
          title={t('messages.conversationDetails')}
          aria-label={t('messages.conversationDetails')}
        >
          <Info className="w-5 h-5 stroke-[1.8]" />
        </button>
      </div>
    </div>
  );
};

export default ChatHeader;
