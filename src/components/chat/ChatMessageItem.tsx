import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  CheckCheck,
  Loader2,
  AlertCircle,
  CornerUpLeft,
  Pencil,
  Trash2,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Ban,
  Check as CheckIcon,
  Download,
  FileText,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  File as GenericFileIcon,
  Maximize2,
  X,
  Volume2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import UserAvatar from '../common/UserAvatar';
import FormattedText from '../common/FormattedText';
import LinkPreviewCard from '../common/LinkPreviewCard';
import { extractFirstUrl } from '../../utils/linkPreview';
import { getMediaUrl } from '../../utils/media';
import type { ChatMessage, ChatConversationItem } from '../../types/chat';
import clsx from 'clsx';

interface ChatMessageItemProps {
  message: ChatMessage;
  conversation: ChatConversationItem;
  onReply: (message: ChatMessage) => void;
  onEdit: (messageId: number, newBody: string) => Promise<void>;
  onDelete: (messageId: number) => Promise<void>;
  onRetry: (clientMsgId: string) => Promise<void>;
  onAddReaction?: (messageId: string, emoji: string) => void;
  quotedMessage?: ChatMessage | null;
}

const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return '';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatAudioDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const getFileIcon = (fileName?: string) => {
  if (!fileName) return <GenericFileIcon className="w-5 h-5 text-blue-500" />;
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return <FileArchive className="w-5 h-5 text-amber-500" />;
  }
  if (['xls', 'xlsx', 'csv'].includes(ext || '')) {
    return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
  }
  if (['js', 'ts', 'jsx', 'tsx', 'html', 'css', 'json', 'py', 'go', 'java', 'cpp'].includes(ext || '')) {
    return <FileCode className="w-5 h-5 text-purple-500" />;
  }
  if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext || '')) {
    return <FileText className="w-5 h-5 text-rose-500" />;
  }
  return <GenericFileIcon className="w-5 h-5 text-blue-500" />;
};

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  message,
  conversation,
  onReply,
  onEdit,
  onDelete,
  onRetry,
  onAddReaction,
  quotedMessage,
}) => {
  const { t } = useLanguage();
  const isMine = message.isMine;
  const isDeleted = message.isDeleted;
  const isGroup = conversation.type === 'GROUP';

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.body);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Audio Playback state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioTotalDuration, setAudioTotalDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Image Lightbox state
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // Read indicator
  const isReadByPartner =
    isMine &&
    message.seq !== undefined &&
    conversation.lastReadSeq !== undefined &&
    message.seq <= conversation.lastReadSeq;

  // Resolve media URL
  const mediaUrl = message.mediaUrl ? getMediaUrl(message.mediaUrl) : undefined;

  // Sync audio element events
  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isPlayingAudio) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlayingAudio(true);
      }).catch((err) => {
        console.warn('Audio play error:', err);
      });
    }
  };

  const handleAudioTimeUpdate = () => {
    if (!audioRef.current) return;
    const current = audioRef.current.currentTime;
    const dur = audioRef.current.duration || audioTotalDuration || 1;
    setAudioCurrentTime(current);
    setAudioProgress((current / dur) * 100);
  };

  const handleAudioLoadedMetadata = () => {
    if (!audioRef.current) return;
    setAudioTotalDuration(audioRef.current.duration || 0);
  };

  const handleAudioEnded = () => {
    setIsPlayingAudio(false);
    setAudioProgress(0);
    setAudioCurrentTime(0);
  };

  const handleAudioScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !audioTotalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickPos = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
    const newProgress = clickPos / rect.width;
    audioRef.current.currentTime = newProgress * audioTotalDuration;
    setAudioProgress(newProgress * 100);
  };

  // Prevent background scroll when lightbox is open & listen for Escape key
  useEffect(() => {
    if (!isLightboxOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isLightboxOpen]);

  const handleDownloadFile = async (e: React.MouseEvent, url: string, filename: string) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      toast.loading('Đang tải tệp xuống...', { id: 'download-file' });
      const response = await fetch(url);
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'downloaded_file';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Tải tệp thành công!', { id: 'download-file' });
    } catch {
      window.open(url, '_blank');
      toast.dismiss('download-file');
    }
  };

  const handleCopy = async () => {
    const textToCopy = message.body || mediaUrl || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      toast.success(t('messages.copied'));
    } catch {
      toast.error(t('messages.copyFailed'));
    }
  };

  const handleSaveEdit = async () => {
    if (!message.id) return;
    const trimmed = editText.trim();
    if (!trimmed || trimmed === message.body) {
      setIsEditing(false);
      return;
    }

    setIsSavingEdit(true);
    try {
      await onEdit(message.id, trimmed);
      setIsEditing(false);
      toast.success(t('messages.editSuccess'));
    } catch {
      toast.error(t('messages.editFailed'));
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!message.id) return;
    try {
      await onDelete(message.id);
      toast.success(t('messages.unsendSuccess'));
    } catch {
      toast.error(t('messages.unsendFailed'));
    }
  };

  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : '';

  const replyData = quotedMessage || message.replyToMessage;
  const replySenderName = replyData?.senderName
    ? replyData.senderName === 'Bạn' || replyData.senderName === 'You'
      ? t('messages.you')
      : replyData.senderName
    : t('messages.you');
  const replyBody = replyData?.body || '...';

  return (
    <>
      <div
        className={clsx(
          'flex items-end gap-2 group relative mb-2 transition-all select-text',
          isMine ? 'justify-end' : 'justify-start'
        )}
      >
        {/* 1. Incoming Partner / Sender Avatar (Instagram left avatar) */}
        {!isMine && (
          <div className="shrink-0 mb-0.5">
            <UserAvatar
              userId={message.senderId || conversation.partner?.id}
              src={message.senderAvatar || conversation.avatarUrl}
              alt={message.senderName || conversation.displayName}
              size="xs"
              showPresence={false}
              className="w-7 h-7 rounded-full shadow-2xs"
            />
          </div>
        )}

        {/* 2. Message Bubble Container */}
        <div
          className={clsx(
            'max-w-[85%] sm:max-w-[70%] rounded-[18px] px-3.5 py-2 relative text-[13.5px] sm:text-[14px] leading-[1.45] tracking-[-0.01em] transition-all break-words select-text min-w-0',
            isMine
              ? 'bg-[#0084FF] dark:bg-[#0095F6] text-white rounded-br-[4px] shadow-xs'
              : 'bg-[#F0F2F5] dark:bg-[#262626] text-gray-950 dark:text-[#F5F5F5] rounded-bl-[4px] shadow-2xs'
          )}
        >
          {/* Group Sender Name */}
          {isGroup && !isMine && (
            <p className="text-[11.5px] font-semibold text-[#0084FF] dark:text-[#3797F0] mb-0.5">
              {message.senderName || 'Thành viên'}
            </p>
          )}

          {/* Replying Quote Snippet (Instagram reply card) */}
          {replyData && (
            <div
              className={clsx(
                'mb-1.5 p-2 rounded-xl text-[12px] border-l-[3px] overflow-hidden backdrop-blur-xs',
                isMine
                  ? 'bg-black/20 text-white/95 border-white/80'
                  : 'bg-black/5 dark:bg-white/10 text-gray-800 dark:text-[#D4D4D4] border-[#0084FF] dark:border-[#3797F0]'
              )}
            >
              <div className="flex items-center gap-1 font-semibold text-[10.5px] mb-0.5">
                <CornerUpLeft className="w-2.5 h-2.5 shrink-0" />
                <span className="truncate max-w-[180px]">{replySenderName}</span>
              </div>
              <p className="truncate line-clamp-1 italic text-[11.5px] opacity-85">
                {replyBody}
              </p>
            </div>
          )}

          {/* Soft-Deleted / Unsent Message View */}
          {isDeleted ? (
            <div className="flex items-center gap-1.5 py-0.5 text-[13px] opacity-65 italic select-none">
              <Ban className="w-3.5 h-3.5 shrink-0" />
              <span>{t('messages.messageDeleted')}</span>
            </div>
          ) : isEditing ? (
            /* Inline Edit Form */
            <div className="space-y-1.5 py-1 min-w-[180px] sm:min-w-[210px]">
              <input
                type="text"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className={clsx(
                  'w-full px-3 py-1.5 rounded-xl outline-none text-[13.5px] border transition',
                  isMine
                    ? 'bg-white/20 text-white placeholder-white/60 border-white/40 focus:border-white'
                    : 'bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white border-gray-300 dark:border-[#404040]'
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') void handleSaveEdit();
                  if (e.key === 'Escape') setIsEditing(false);
                }}
              />
              <div className="flex items-center justify-end gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-2.5 py-1 bg-black/20 hover:bg-black/30 rounded-lg cursor-pointer transition text-white"
                >
                  {t('messages.cancel')}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSavingEdit}
                  className="px-2.5 py-1 bg-white text-[#0084FF] font-semibold rounded-lg cursor-pointer flex items-center gap-1 shadow-xs transition hover:bg-white/95"
                >
                  {isSavingEdit ? (
                    <Loader2 className="w-2.5 h-2.5 animate-spin" />
                  ) : (
                    <CheckIcon className="w-2.5 h-2.5 stroke-[3]" />
                  )}
                  <span>{t('messages.save')}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Normal Rich Message Body */
            <div className="space-y-1.5 min-w-0">
              {/* 1. Image Attachment */}
              {message.mediaType === 'IMAGE' && mediaUrl && (
                <div className="relative pt-0.5 overflow-hidden rounded-xl group/media max-w-full">
                  <img
                    src={mediaUrl}
                    alt={message.fileName || 'attachment'}
                    className="rounded-xl max-h-60 sm:max-h-80 w-auto max-w-full object-cover cursor-pointer hover:opacity-95 transition shadow-2xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    loading="lazy"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer shadow-md"
                    title="Phóng to ảnh"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 2. Video Attachment */}
              {message.mediaType === 'VIDEO' && mediaUrl && (
                <div className="relative pt-0.5 overflow-hidden rounded-xl group/media max-w-full">
                  <video
                    src={mediaUrl}
                    controls
                    playsInline
                    preload="metadata"
                    className="rounded-xl max-h-60 sm:max-h-80 w-full bg-black/90 object-contain shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsLightboxOpen(true);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-black/50 text-white opacity-0 group-hover/media:opacity-100 transition-opacity hover:bg-black/70 cursor-pointer shadow-md z-10"
                    title="Phóng to video"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* 3. Audio / Voice Memo Attachment */}
              {message.mediaType === 'AUDIO' && (
                <div className="flex items-center gap-2.5 py-1 min-w-0 w-full max-w-[240px]">
                  {mediaUrl && (
                    <audio
                      ref={audioRef}
                      src={mediaUrl}
                      onTimeUpdate={handleAudioTimeUpdate}
                      onLoadedMetadata={handleAudioLoadedMetadata}
                      onEnded={handleAudioEnded}
                      className="hidden"
                      preload="metadata"
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleToggleAudio}
                    className={clsx(
                      'w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shrink-0 shadow-xs active:scale-95',
                      isMine
                        ? 'bg-white/25 hover:bg-white/35 text-white'
                        : 'bg-[#0084FF] dark:bg-[#3797F0] text-white hover:opacity-90'
                    )}
                  >
                    {isPlayingAudio ? (
                      <Pause className="w-4 h-4 fill-current" />
                    ) : (
                      <Play className="w-4 h-4 fill-current ml-0.5" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Audio Scrub Bar */}
                    <div
                      onClick={handleAudioScrub}
                      className="h-2 bg-black/15 dark:bg-white/20 rounded-full overflow-hidden cursor-pointer relative"
                    >
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-100',
                          isMine ? 'bg-white' : 'bg-[#0084FF] dark:bg-[#3797F0]'
                        )}
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] opacity-80">
                      <span>
                        {formatAudioDuration(audioCurrentTime)} /{' '}
                        {formatAudioDuration(audioTotalDuration) || message.audioDuration || '0:15'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Volume2 className="w-3 h-3" />
                        <span>{t('messages.voiceMemo')}</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 4. Document / Generic File Attachment */}
              {message.mediaType === 'FILE' && (
                <div
                  className={clsx(
                    'flex items-center gap-2.5 p-2.5 rounded-xl border transition max-w-full min-w-0 overflow-hidden',
                    isMine
                      ? 'bg-white/15 border-white/25 text-white'
                      : 'bg-white dark:bg-[#1E1E1E] border-gray-200 dark:border-[#383838] text-gray-900 dark:text-[#F5F5F5]'
                  )}
                >
                  <div className="p-2 rounded-lg bg-black/5 dark:bg-white/10 shrink-0">
                    {getFileIcon(message.fileName)}
                  </div>

                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-[12.5px] font-semibold truncate leading-tight" title={message.fileName}>
                      {message.fileName || 'Tệp đính kèm'}
                    </p>
                    {message.fileSize && message.fileSize > 0 && (
                      <p className="text-[10.5px] opacity-75 mt-0.5">
                        {formatFileSize(message.fileSize)}
                      </p>
                    )}
                  </div>

                  {mediaUrl && (
                    <button
                      type="button"
                      onClick={(e) => handleDownloadFile(e, mediaUrl, message.fileName || 'file')}
                      className={clsx(
                        'p-2 rounded-full transition cursor-pointer shrink-0 shadow-2xs hover:scale-105 active:scale-95',
                        isMine
                          ? 'bg-white/20 hover:bg-white/30 text-white'
                          : 'bg-gray-100 dark:bg-[#2C2C2C] hover:bg-gray-200 dark:hover:bg-[#383838] text-gray-700 dark:text-[#D4D4D4]'
                      )}
                      title={t('messages.downloadFile')}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}

              {/* 5. Text Message Body (or caption) */}
              {message.body && (
                <div className="space-y-1.5">
                  <p className="whitespace-pre-wrap leading-[1.45] select-text font-normal">
                    <FormattedText
                      text={message.body}
                      urlClassName={
                        isMine
                          ? 'text-white underline font-semibold cursor-pointer break-all inline-flex items-center'
                          : 'text-[#0084FF] dark:text-[#38BDF8] underline font-medium cursor-pointer break-all inline-flex items-center'
                      }
                      mentionClassName={
                        isMine
                          ? 'text-white underline font-semibold cursor-pointer inline-flex items-center'
                          : 'text-[#0084FF] dark:text-[#38BDF8] underline font-semibold cursor-pointer inline-flex items-center'
                      }
                      hashtagClassName={
                        isMine
                          ? 'text-white underline font-semibold cursor-pointer inline-flex items-center'
                          : 'text-[#0084FF] dark:text-[#38BDF8] underline font-semibold cursor-pointer inline-flex items-center'
                      }
                    />
                  </p>
                  {(() => {
                    const chatUrl = extractFirstUrl(message.body);
                    if (chatUrl && !message.mediaType) {
                      return <LinkPreviewCard url={chatUrl} className="mt-1.5 mb-0.5" />;
                    }
                    return null;
                  })()}
                </div>
              )}
            </div>
          )}

          {/* 3. Timestamp, Edited label, and Delivery/Read Status check */}
          <div
            className={clsx(
              'flex items-center justify-end gap-1 text-[10px] mt-0.5 select-none font-normal tracking-tight',
              isMine ? 'text-white/70' : 'text-[#8E8E8E] dark:text-[#A8A8A8]'
            )}
          >
            {message.editedAt && !isDeleted && (
              <span className="italic opacity-80">({t('messages.edited')})</span>
            )}
            <span>{formattedTime}</span>

            {/* Read/Delivery status for my message */}
            {isMine && (
              <span className="flex items-center ml-0.5">
                {message.status === 'SENDING' ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin opacity-80" />
                ) : message.status === 'FAILED' ? (
                  <button
                    onClick={() => onRetry(message.clientMsgId)}
                    className="flex items-center gap-0.5 text-rose-300 hover:text-white cursor-pointer"
                    title={t('messages.sendFailed')}
                  >
                    <AlertCircle className="w-3 h-3 text-rose-300" />
                    <RotateCcw className="w-2.5 h-2.5" />
                  </button>
                ) : isReadByPartner ? (
                  <span title={t('messages.seen')} className="flex items-center text-cyan-200">
                    <CheckCheck className="w-3 h-3 stroke-[2.5]" />
                  </span>
                ) : (
                  <span title={t('messages.sent')} className="flex items-center opacity-85">
                    <Check className="w-3 h-3 stroke-[2.5]" />
                  </span>
                )}
              </span>
            )}
          </div>

          {/* 4. Message Reaction Pills attached to bubble edge */}
          {message.reactions && message.reactions.length > 0 && (
            <div
              className={clsx(
                'absolute -bottom-2.5 flex items-center gap-1 bg-white dark:bg-[#262626] border border-gray-200 dark:border-[#383838] rounded-full px-2 py-0.5 shadow-sm text-[11px] select-none z-10',
                isMine ? 'right-2' : 'left-2'
              )}
            >
              {message.reactions.map((r, i) => (
                <span key={i} className="flex items-center gap-1">
                  <span>{r.emoji}</span>
                  <span className="font-bold text-gray-700 dark:text-[#D4D4D4] text-[10px]">
                    {r.count}
                  </span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* 5. Floating Hover Toolbar */}
        {!isDeleted && (
          <div
            className={clsx(
              'opacity-0 group-hover:opacity-100 transition-all duration-150 flex items-center gap-0.5 backdrop-blur-md bg-white/95 dark:bg-[#1E1E1E]/95 border border-gray-200/80 dark:border-white/10 rounded-full px-1.5 py-0.5 shadow-md z-30 pointer-events-none group-hover:pointer-events-auto select-none absolute -top-7',
              isMine ? 'right-2' : 'left-9'
            )}
          >
            {/* Quick Reaction Emojis */}
            {['❤️', '👍', '🔥', '😂', '😮', '😢'].map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => onAddReaction?.(message.clientMsgId || String(message.id), emoji)}
                className="hover:scale-125 active:scale-95 transition-transform text-xs sm:text-sm p-1 cursor-pointer"
                title={`${t('messages.reactEmoji')} ${emoji}`}
              >
                {emoji}
              </button>
            ))}

            <div className="w-px h-3 bg-gray-200 dark:bg-[#363636] mx-0.5" />

            {/* Reply Action */}
            <button
              type="button"
              onClick={() => onReply(message)}
              className="p-1 text-gray-500 dark:text-gray-400 hover:text-[#0084FF] dark:hover:text-[#3797F0] rounded-full cursor-pointer transition hover:bg-gray-100 dark:hover:bg-white/10"
              title={t('messages.reply')}
            >
              <CornerUpLeft className="w-3.5 h-3.5" />
            </button>

            {/* Copy Action */}
            {(message.body || mediaUrl) && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-[#0084FF] dark:hover:text-[#3797F0] rounded-full cursor-pointer transition hover:bg-gray-100 dark:hover:bg-white/10"
                title={t('messages.copy')}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Edit Action */}
            {isMine && message.id && message.mediaType === 'TEXT' && (
              <button
                type="button"
                onClick={() => {
                  setEditText(message.body);
                  setIsEditing(true);
                }}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-amber-500 rounded-full cursor-pointer transition hover:bg-gray-100 dark:hover:bg-white/10"
                title={t('messages.edit')}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Unsend / Soft Delete Action */}
            {(isMine || conversation.type === 'GROUP') && message.id && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-1 text-gray-500 dark:text-gray-400 hover:text-rose-500 rounded-full cursor-pointer transition hover:bg-gray-100 dark:hover:bg-white/10"
                title={t('messages.unsend')}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* 6. Fullscreen Media (Image / Video) Lightbox Modal via Portal */}
      {isLightboxOpen && mediaUrl && createPortal(
        <div
          className="fixed inset-0 z-[999999] bg-black/92 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn select-none"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Floating Toolbar */}
          <div
            className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-3 z-10"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={(e) =>
                handleDownloadFile(
                  e,
                  mediaUrl,
                  message.fileName || (message.mediaType === 'VIDEO' ? 'video.mp4' : 'image.png')
                )
              }
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full transition cursor-pointer backdrop-blur-md shadow-lg"
              title={message.mediaType === 'VIDEO' ? 'Tải video về máy' : 'Tải ảnh về máy'}
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={() => setIsLightboxOpen(false)}
              className="p-2.5 bg-white/15 hover:bg-white/25 text-white rounded-full transition cursor-pointer backdrop-blur-md shadow-lg"
              title="Đóng (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Centered Media Container */}
          <div
            className="relative max-w-5xl max-h-[90vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {message.mediaType === 'VIDEO' ? (
              <video
                src={mediaUrl}
                controls
                autoPlay
                playsInline
                className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl transition-transform"
              />
            ) : (
              <img
                src={mediaUrl}
                alt={message.fileName || 'fullscreen preview'}
                className="max-h-[88vh] max-w-full rounded-xl object-contain shadow-2xl transition-transform"
              />
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ChatMessageItem;

