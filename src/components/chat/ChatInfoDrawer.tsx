import { getSharedMedia } from '../../services/chatService';
import chatSocket from '../../services/chatSocket';
import { formatChatMessage } from '../../utils/chatMessage';
import type { ChatMessage } from '../../types/chat';
import { securityError } from '../../services/accountSecurity';
import { Link } from 'react-router-dom';
import { ChatBlockButton } from './ChatBlockNotice';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Phone,
  Video,
  VolumeX,
  Volume2,
  Users,
  UserPlus,
  UserMinus,
  Trash2,
  Shield,
  Image as ImageIcon,
  Film,
  FileText,
  Download,
  Crown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useCall } from '../../contexts/CallContext';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { getMediaUrl } from '../../utils/media';
import UserAvatar from '../common/UserAvatar';
import clsx from 'clsx';

interface ChatInfoDrawerProps {
  onClose: () => void;
  onOpenAddMemberModal: () => void;
  onOpenClearHistoryModal: () => void;
}

export const ChatInfoDrawer: React.FC<ChatInfoDrawerProps> = ({
  onClose,
  onOpenAddMemberModal,
  onOpenClearHistoryModal,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { startCall, enabled: callingEnabled, ready: callingReady, status: callStatus } = useCall();
  const { activeConversation, removeMemberFromGroup, leaveGroup } = useChat();

  const [isMuted, setIsMuted] = useState(false);
  const [activeMediaTab, setActiveMediaTab] = useState<'media' | 'files'>('media');

  const [sharedMedia, setSharedMedia] = useState<ChatMessage[]>([]);
  const [sharedFiles, setSharedFiles] = useState<ChatMessage[]>([]);
  const [mediaCursor, setMediaCursor] = useState(0);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [mediaError, setMediaError] = useState('');
  const mediaRequestRef = useRef(0);
  const loadMedia = useCallback(async (cursor = 0) => {
    if (!activeConversation?.id) return;
    const request = ++mediaRequestRef.current; setLoadingMedia(true); setMediaError('');
    try {
      const result = await getSharedMedia(activeConversation.id, activeMediaTab, cursor);
      if (request !== mediaRequestRef.current) return;
      const items = result.items.map(item => ({ ...formatChatMessage(item, user?.id || ''), mediaType: item.media_type, mediaUrl: item.media_url, fileName: item.file_name, fileSize: item.file_size }));
      const update = (prev: ChatMessage[]) => cursor ? [...prev, ...items.filter(item => !prev.some(old => old.id === item.id))] : items;
      if (activeMediaTab === 'media') setSharedMedia(update); else setSharedFiles(update);
      setMediaCursor(result.next_cursor);
    } catch (e) { if (request === mediaRequestRef.current) setMediaError(securityError(e)); }
    finally { if (request === mediaRequestRef.current) setLoadingMedia(false); }
  }, [activeConversation?.id, activeMediaTab, user?.id]);
  useEffect(() => {
    setSharedMedia([]); setSharedFiles([]); setMediaCursor(0); void loadMedia();
    const refresh = (payload: { conversation_id: string }) => { if (payload.conversation_id === activeConversation?.id) void loadMedia(); };
    const offNew = chatSocket.on('message.new', refresh); const offDeleted = chatSocket.on('message.deleted', refresh); const offHistory=chatSocket.on('history.cleared', refresh);
    return () => { mediaRequestRef.current++; offNew(); offDeleted(); offHistory(); };
  }, [loadMedia, activeConversation?.id]);

  const isGroup = activeConversation?.type === 'GROUP';
  if (!activeConversation) return null;

  const currentUserId = user?.id || 'me';

  // Check current user role in group
  const myMemberInfo = activeConversation.members?.find((m) => m.userId === currentUserId);
  const isOwnerOrAdmin = myMemberInfo?.role === 'OWNER' || myMemberInfo?.role === 'ADMIN' || !isGroup;

  const handleStartCall = (callType: 'audio' | 'video') => {
    const target = {
      id: activeConversation.partner?.id || activeConversation.id,
      name: activeConversation.partner?.displayName || activeConversation.displayName,
      username: activeConversation.partner?.username || activeConversation.displayName.toLowerCase().replace(/\s+/g, '_'),
      avatarUrl: activeConversation.partner?.avatarUrl || activeConversation.avatarUrl || '',
    };
    if (isGroup || activeConversation.canCall === false) return; void startCall(activeConversation.id, callType, target);
  };

  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      toast.success(t('messages.mutedSuccess'));
    } else {
      toast.success(t('messages.unmutedSuccess'));
    }
  };

  const handleKickMember = async (memberUserId: string, memberName: string) => {
    if (window.confirm(t('messages.kickMemberConfirm', { name: memberName }))) {
      try {
        await removeMemberFromGroup(memberUserId);
        toast.success(t('messages.kickMemberSuccess'));
      } catch {
        toast.error(t('messages.kickMemberFailed'));
      }
    }
  };

  const handleLeaveGroup = async () => {
    if (window.confirm(t('messages.leaveGroupConfirm'))) {
      try {
        await leaveGroup();
        toast.success(t('messages.leaveGroupSuccess'));
        onClose();
      } catch {
        // Handled in chat context
      }
    }
  };

  return (
    <div className="w-[300px] lg:w-[320px] flex-shrink-0 border-l border-gray-100 dark:border-[#262626] bg-white dark:bg-[#121212] flex flex-col h-full overflow-y-auto custom-scrollbar animate-slideInRight transition-colors p-4">
      {/* 1. Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
        <h3 className="font-bold text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5]">
          {t('messages.conversationDetails')}
        </h3>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer transition"
          aria-label="Close drawer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Partner / Group Avatar & Actions */}
      <div className="flex flex-col items-center text-center mb-6">
        {isGroup ? (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center font-bold text-xl mb-2 shadow-md border-2 border-white dark:border-[#262626]">
            <Users className="w-7 h-7" />
          </div>
        ) : (
          <UserAvatar
            userId={activeConversation.partner?.id}
            src={activeConversation.avatarUrl}
            alt={activeConversation.displayName}
            size="xl"
            className="w-16 h-16 mb-2 border-2 border-white dark:border-[#262626] shadow-md"
          />
        )}

        <h4 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5] truncate max-w-[240px]">
          <Link to={isGroup || activeConversation.partnerDeleted ? "#" : `/${activeConversation.partner?.username || activeConversation.partner?.id}`}>{activeConversation.displayName}</Link>
        </h4>
        <p className="text-xs text-gray-400 dark:text-[#737373] mb-4">
          {isGroup
            ? t('messages.membersCount', { count: activeConversation.members?.length || 4 })
            : activeConversation.partner?.username
            ? `@${activeConversation.partner.username}`
            : ''}
        </p>

        {/* Quick Action Buttons */}
        <div className="flex items-center justify-center gap-2 w-full">
          {!isGroup && callingEnabled && <>
          <button
            disabled={activeConversation.canCall === false || !callingReady || !['idle', 'ended'].includes(callStatus)}
            onClick={() => handleStartCall('audio')}
            className="flex-1 py-2 px-3 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#0084FF] dark:text-[#3797F0] hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
          >
            <Phone className="w-3.5 h-3.5" />
            <span>{t('messages.voiceCall')}</span>
          </button>

          <button
            disabled={activeConversation.canCall === false || !callingReady || !['idle', 'ended'].includes(callStatus)}
            onClick={() => handleStartCall('video')}
            className="flex-1 py-2 px-3 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#0084FF] dark:text-[#3797F0] hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs transition"
          >
            <Video className="w-3.5 h-3.5" />
            <span>{t('messages.videoCallShort')}</span>
          </button>

          </>}
          <button
            onClick={handleToggleMute}
            className={clsx(
              'p-2 rounded-2xl transition cursor-pointer shadow-2xs',
              isMuted
                ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-200'
            )}
            title={isMuted ? t('messages.unmuteConversation') : t('messages.muteConversation')}
            aria-label={isMuted ? t('messages.unmuteConversation') : t('messages.muteConversation')}
          >
            {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* 3. Group Members List (for GROUP) */}
      {isGroup && (
        <div className="space-y-3 mb-6 pb-4 border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider">
              {t('messages.membersCount', { count: activeConversation.members?.length || 4 })}
            </h5>
            {isOwnerOrAdmin && (
              <button
                onClick={onOpenAddMemberModal}
                className="text-xs text-[#0084FF] dark:text-[#3797F0] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{t('messages.addMember')}</span>
              </button>
            )}
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-1">
            {activeConversation.members?.map((member) => (
              <div
                key={member.userId}
                className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <UserAvatar
                    userId={member.userId}
                    src={member.avatarUrl}
                    alt={member.displayName}
                    size="sm"
                    className="w-8 h-8"
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 dark:text-[#F5F5F5] truncate">
                      {member.displayName}
                    </p>
                    <p className="text-[12px] text-gray-400 truncate">@{member.username}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {member.role === 'OWNER' && (
                    <span className="flex items-center gap-0.5 text-[12px] font-bold px-1.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                      <Crown className="w-2.5 h-2.5" />
                      {t('messages.roleOwner')}
                    </span>
                  )}
                  {member.role === 'ADMIN' && (
                    <span className="text-[12px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                      {t('messages.roleAdmin')}
                    </span>
                  )}
                  {isOwnerOrAdmin && member.userId !== currentUserId && member.role !== 'OWNER' && (
                    <button
                      onClick={() => handleKickMember(member.userId, member.displayName)}
                      className="p-1 text-gray-400 hover:text-rose-600 rounded-full cursor-pointer transition"
                      title="Xóa khỏi nhóm"
                    >
                      <UserMinus className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Shared Media Gallery */}
      <div className="space-y-3 mb-6 flex-1">
        <div className="flex items-center justify-between">
          <h5 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5]">
            {t('messages.sharedMedia')}
          </h5>
          <div className="flex items-center gap-1 text-[12px] font-semibold text-gray-500">
            <button
              onClick={() => setActiveMediaTab('media')}
              className={clsx(
                'px-2 py-0.5 rounded-lg cursor-pointer transition',
                activeMediaTab === 'media'
                  ? 'bg-gray-100 dark:bg-[#262626] text-[#0084FF] dark:text-[#3797F0]'
                  : 'hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {t('messages.photosTab')} {sharedMedia.length > 0 && `(${sharedMedia.length})`}
            </button>
            <button
              onClick={() => setActiveMediaTab('files')}
              className={clsx(
                'px-2 py-0.5 rounded-lg cursor-pointer transition',
                activeMediaTab === 'files'
                  ? 'bg-gray-100 dark:bg-[#262626] text-[#0084FF] dark:text-[#3797F0]'
                  : 'hover:text-gray-900 dark:hover:text-white'
              )}
            >
              {t('messages.filesTab')} {sharedFiles.length > 0 && `(${sharedFiles.length})`}
            </button>
          </div>
        </div>

        {activeMediaTab === 'media' ? (
          sharedMedia.length > 0 ? (
            <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto custom-scrollbar">
              {sharedMedia.map((m, idx) => {
                const url = m.mediaUrl ? getMediaUrl(m.mediaUrl) : '';
                if (!url) return null;
                return (
                  <div
                    key={m.id || m.clientMsgId || idx}
                    className="relative aspect-square rounded-xl overflow-hidden bg-gray-100 dark:bg-[#262626] group cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                  >
                    {m.mediaType === 'VIDEO' ? (
                      <div className="w-full h-full flex items-center justify-center bg-black/80 text-white">
                        <Film className="w-6 h-6 text-purple-400" />
                      </div>
                    ) : (
                      <img
                        src={url}
                        alt="shared media"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        loading="lazy"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-400 dark:text-[#737373] text-xs space-y-1">
              <ImageIcon className="w-5 h-5 mx-auto opacity-50" />
              <p>{loadingMedia ? (language === 'vi' ? 'Đang tải…' : 'Loading…') : (language === 'vi' ? 'Chưa có ảnh hoặc video được chia sẻ' : 'No shared photos or videos')}</p>
            </div>
          )
        ) : (
          sharedFiles.length > 0 ? (
            <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar">
              {sharedFiles.map((f, idx) => {
                const url = f.mediaUrl ? getMediaUrl(f.mediaUrl) : '';
                return (
                  <div
                    key={f.id || f.clientMsgId || idx}
                    className="flex items-center justify-between p-2 rounded-xl bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#2C2C2C] text-xs"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                      <span className="truncate font-medium text-gray-800 dark:text-[#E0E0E0]">
                        {f.fileName || 'Tệp đính kèm'}
                      </span>
                    </div>
                    {url && (
                      <a
                        href={url}
                        download={f.fileName || 'file'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-gray-500 hover:text-[#0084FF] dark:hover:text-[#3797F0] rounded-md transition"
                        title={t('messages.downloadFile')}
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-4 text-center text-gray-400 dark:text-[#737373] text-xs space-y-1">
              <FileText className="w-5 h-5 mx-auto opacity-50" />
              <p>{t('messages.noSharedFiles')}</p>
            </div>
          )
        )}
      </div>

      {mediaError && <div role="alert" className="text-red-600 text-[13px]">{mediaError}<button className="security-button" onClick={() => void loadMedia()}>{language === 'vi' ? 'Thử lại' : 'Retry'}</button></div>}
      {mediaCursor > 0 && <button type="button" disabled={loadingMedia} onClick={() => void loadMedia(mediaCursor)} className="security-button">{language === 'vi' ? 'Tải thêm' : 'Load more'}</button>}
      {/* 5. Privacy & Danger Actions */}
      <div className="border-t border-gray-100 dark:border-[#262626] pt-4 space-y-1 text-xs">
        {isGroup ? (
          <button
            onClick={handleLeaveGroup}
            className="w-full text-left py-2 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium transition"
          >
            <UserMinus className="w-4 h-4" />
            <span>{t('messages.leaveGroup')}</span>
          </button>
        ) : (
          <>
            <button
              onClick={() => toast.success(t('messages.reportSuccess'))}
              className="w-full text-left py-2 px-2.5 rounded-xl text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 flex items-center gap-2 cursor-pointer font-medium transition"
            >
              <Shield className="w-4 h-4" />
              <span>{t('messages.reportUser')}</span>
            </button>
            <ChatBlockButton conversation={activeConversation} />
          </>
        )}

        <button
          onClick={onOpenClearHistoryModal}
          className="w-full text-left py-2 px-2.5 rounded-xl text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2 cursor-pointer font-medium transition"
        >
          <Trash2 className="w-4 h-4" />
          <span>{t('messages.clearHistory')}</span>
        </button>
      </div>
    </div>
  );
};

export default ChatInfoDrawer;
