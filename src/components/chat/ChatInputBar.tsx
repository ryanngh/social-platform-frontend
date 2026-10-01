import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ThumbsUp,
  Image as ImageIcon,
  Smile,
  Mic,
  X,
  AlertTriangle,
  StopCircle,
  Paperclip,
  FileText,
  Film,
  Music,
  Loader2,
  Send,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChat } from '../../contexts/ChatContext';
import { EmojiPickerPopover } from '../common/EmojiPickerPopover';
import { GifPickerPopover } from '../common/GifPickerPopover';
import type { ChatMessage } from '../../types/chat';
import clsx from 'clsx';

interface ChatInputBarProps {
  replyingMessage: ChatMessage | null;
  onCancelReply: () => void;
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

export const ChatInputBar: React.FC<ChatInputBarProps> = ({
  replyingMessage,
  onCancelReply,
}) => {
  const { t } = useLanguage();
  const {
    sendMessage,
    uploadAndSendAttachment,
    sendTyping,
    rateLimitCooldown,
    activeConversation,
    activeConversationId,
  } = useChat();

  const [messageText, setMessageText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  // Staged attachment state
  const [stagedAttachment, setStagedAttachment] = useState<StagedAttachment | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const isSendingRef = useRef(false);

  const isRateLimited = rateLimitCooldown > 0;

  // Cleanup staged preview URL on unmount or change
  useEffect(() => {
    return () => {
      if (stagedAttachment?.previewUrl) {
        URL.revokeObjectURL(stagedAttachment.previewUrl);
      }
    };
  }, [stagedAttachment]);

  // Handle stage file helper
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

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    sendTyping();
  };

  const handleSend = async (customText?: string) => {
    if (isRateLimited || isUploading || isSendingRef.current) return;
    isSendingRef.current = true;

    try {
      const replyId = replyingMessage?.id || (replyingMessage?.seq as number | undefined) || null;

      // 1. If we have a staged attachment, upload and send it
      if (stagedAttachment) {
        setIsUploading(true);
        setUploadPercent(0);
        try {
          const caption = (customText !== undefined ? customText : messageText).trim();
          await uploadAndSendAttachment(
            stagedAttachment.file,
            stagedAttachment.name,
            caption,
            replyId,
            (percent) => setUploadPercent(percent)
          );
          handleCancelStaged();
          setMessageText('');
          onCancelReply();
        } catch (err) {
          console.error('Failed to upload and send attachment:', err);
        } finally {
          setIsUploading(false);
          setUploadPercent(0);
        }
        return;
      }

      // 2. Normal text message — read from DOM as fallback for iOS Safari stale state
      const text = customText !== undefined
        ? customText
        : (messageText || inputRef.current?.value || '');
      if (!text.trim()) return;

      await sendMessage(text.trim(), replyId, 'TEXT');

      setMessageText('');
      if (inputRef.current) inputRef.current.value = '';
      onCancelReply();
    } finally {
      isSendingRef.current = false;
    }
  };

  const handleSelectEmoji = (emoji: string) => {
    setMessageText((prev) => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleSelectGif = async (gifUrl: string) => {
    setShowGifPicker(false);
    const replyId = replyingMessage?.id || null;
    await sendMessage(t('messages.sentGif'), replyId, 'IMAGE', gifUrl);
    onCancelReply();
    toast.success(t('messages.sentGif'));
  };

  const handleMediaFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stageFile(file);
    e.target.value = '';
  };

  const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stageFile(file);
    e.target.value = '';
  };

  // Clipboard paste support (e.g. screenshot paste)
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file') {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          stageFile(file);
          toast.success(t('messages.sentPhoto'));
          break;
        }
      }
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      stageFile(file);
    }
  };

  // Real Audio Recording using MediaRecorder API
  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Trình duyệt không hỗ trợ ghi âm trực tiếp!');
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStreamRef.current = stream;
      audioChunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')
        ? 'audio/ogg;codecs=opus'
        : 'audio/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.start(200); // 200ms slice
      setIsRecording(true);
      setRecordingSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Audio recording access denied or error:', err);
      toast.error('Không thể truy cập microphone. Vui lòng cấp quyền ghi âm!');
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

        // Clean up tracks
        mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
        mediaStreamRef.current = null;
        audioChunksRef.current = [];

        // Upload and send audio memo
        try {
          const replyId = replyingMessage?.id || null;
          const fileName = `voice_${Date.now()}.webm`;
          await uploadAndSendAttachment(audioBlob, fileName, '', replyId);
          toast.success(t('messages.sentAudio'));
        } catch (err) {
          console.error('Failed to send voice recording:', err);
        }
      };

      recorder.stop();
    }

    setIsRecording(false);
    setRecordingSeconds(0);
  };

  const cancelRecording = () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    const recorder = mediaRecorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.onstop = null;
      recorder.stop();
    }
    mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    mediaStreamRef.current = null;
    audioChunksRef.current = [];
    setIsRecording(false);
    setRecordingSeconds(0);
  };

  if (!activeConversation && !activeConversationId) return null;

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={clsx(
        'bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-[#262626] relative transition-colors shadow-2xs',
        isDraggingOver && 'ring-2 ring-[#0084FF] bg-blue-50/20 dark:bg-blue-950/20'
      )}
    >
      {/* 1. Rate Limit Warning Banner */}
      {isRateLimited && (
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-semibold flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>{t('messages.rateLimitBanner')}</span>
          </div>
          <span className="tabular-nums px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
            {rateLimitCooldown}s
          </span>
        </div>
      )}

      {/* 2. Replying Quote Banner */}
      {replyingMessage && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-[#1A1A1A] border-b border-gray-100 dark:border-[#262626] flex items-center justify-between text-xs animate-slideIn">
          <div className="flex items-center gap-2 min-w-0 border-l-2 border-[#0084FF] dark:border-[#3797F0] pl-2.5">
            <span className="text-gray-500 dark:text-[#A8A8A8] shrink-0">{t('messages.replyingTo')}</span>
            <span className="font-bold text-gray-900 dark:text-[#F5F5F5] shrink-0">
              {replyingMessage.senderName || t('messages.you')}:
            </span>
            <span className="text-gray-600 dark:text-[#D4D4D4] truncate italic">
              {replyingMessage.body || `[${t('messages.attachmentImage')}]`}
            </span>
          </div>

          <button
            type="button"
            onClick={onCancelReply}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer transition"
            title={t('messages.cancelReply')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 3. Attachment Staging Preview Bar */}
      {stagedAttachment && (
        <div className="px-4 py-2.5 bg-gray-50 dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-[#2C2C2C] flex items-center justify-between gap-3 animate-slideIn">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Thumbnail Preview */}
            {stagedAttachment.type === 'IMAGE' && stagedAttachment.previewUrl ? (
              <img
                src={stagedAttachment.previewUrl}
                alt="preview"
                className="w-12 h-12 rounded-xl object-cover border border-gray-200 dark:border-[#383838] shadow-2xs shrink-0"
              />
            ) : stagedAttachment.type === 'VIDEO' ? (
              <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex items-center justify-center shrink-0">
                <Film className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
            ) : stagedAttachment.type === 'AUDIO' ? (
              <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
                <Music className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
            )}

            {/* File Info & Upload Progress */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-gray-900 dark:text-[#F5F5F5] truncate">
                {stagedAttachment.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[11px] text-gray-500 dark:text-[#8E8E8E]">
                  {formatFileSize(stagedAttachment.size)}
                </span>
                {isUploading && (
                  <span className="text-[11px] font-semibold text-[#0084FF] dark:text-[#3797F0] flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>{uploadPercent}%</span>
                  </span>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="w-full h-1.5 bg-gray-200 dark:bg-[#333333] rounded-full overflow-hidden mt-1.5">
                  <div
                    className="h-full bg-gradient-to-r from-[#0084FF] to-[#00C6FF] rounded-full transition-all duration-200"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Cancel Attachment Button */}
          {!isUploading && (
            <button
              type="button"
              onClick={handleCancelStaged}
              className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-[#2C2C2C] rounded-full cursor-pointer transition shrink-0"
              title={t('messages.cancel')}
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* 4. Voice Recording Overlay Bar */}
      {isRecording ? (
        <div className="p-3 flex items-center justify-between bg-rose-50 dark:bg-rose-950/40 animate-pulse">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
            <span className="text-[13px] font-semibold text-rose-600 dark:text-rose-400">
              {t('messages.voiceRecording', {
                time: `${Math.floor(recordingSeconds / 60)}:${String(recordingSeconds % 60).padStart(2, '0')}`,
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="px-3 py-1.5 rounded-full bg-gray-200 dark:bg-[#262626] text-gray-700 dark:text-[#D4D4D4] text-[12px] font-medium cursor-pointer hover:bg-gray-300 dark:hover:bg-[#333] transition"
            >
              {t('messages.cancel')}
            </button>
            <button
              type="button"
              onClick={stopAndSendRecording}
              className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white text-[12px] font-semibold flex items-center gap-1.5 cursor-pointer shadow-xs hover:bg-rose-700 active:scale-95 transition"
            >
              <StopCircle className="w-4 h-4" />
              <span>{t('messages.sendVoice')}</span>
            </button>
          </div>
        </div>
      ) : (
        /* 5. Main Input Bar (Instagram DM style pill) */
        <div className="px-3 sm:px-4 pt-2.5 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))] bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-[#262626]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
            className="flex items-center gap-2 border border-gray-200 dark:border-[#333333] rounded-full px-3.5 py-1.5 bg-[#F0F2F5] dark:bg-[#262626] focus-within:bg-white dark:focus-within:bg-[#1A1A1A] focus-within:border-[#0084FF] dark:focus-within:border-[#0095F6] focus-within:ring-1 focus-within:ring-[#0084FF]/20 dark:focus-within:ring-[#0095F6]/30 transition-all min-h-[44px]"
          >
            {/* Hidden File Inputs */}
            <input
              ref={mediaInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleMediaFileChange}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="*/*"
              className="hidden"
              onChange={handleDocFileChange}
            />

            {/* Emoji Picker Button */}
            <div className="relative shrink-0 flex items-center">
              <button
                type="button"
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker);
                  setShowGifPicker(false);
                }}
                disabled={isRateLimited || isUploading}
                className="p-1 text-gray-700 dark:text-[#E0E0E0] hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer disabled:opacity-40"
                title={t('messages.chooseEmoji')}
                aria-label={t('messages.chooseEmoji')}
              >
                <Smile className="w-5 h-5 stroke-[1.8]" />
              </button>

              {showEmojiPicker && (
                <div className="absolute bottom-10 left-0 z-50">
                  <EmojiPickerPopover
                    isOpen={showEmojiPicker}
                    onClose={() => setShowEmojiPicker(false)}
                    onSelectEmoji={handleSelectEmoji}
                    className="shadow-2xl border border-gray-200 dark:border-[#363636]"
                  />
                </div>
              )}
            </div>

            {/* Main Text Input */}
            <input
              ref={inputRef}
              type="text"
              value={messageText}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend();
                }
              }}
              onPaste={handlePaste}
              disabled={isRateLimited || isUploading}
              placeholder={
                isRateLimited
                  ? t('messages.cooldownWaiting', { seconds: rateLimitCooldown })
                  : stagedAttachment
                  ? 'Thêm chú thích cho tệp đính kèm...'
                  : t('messages.typeMessagePlaceholder')
              }
              className="flex-1 bg-transparent text-[14px] sm:text-[14.5px] text-gray-900 dark:text-[#F5F5F5] placeholder-[#8E8E8E] dark:placeholder-[#737373] outline-none font-normal leading-normal disabled:opacity-50 min-w-0"
            />

            {/* Right-Side Controls: Actions or Blue Send button */}
            {messageText.trim() || stagedAttachment ? (
              <button
                type="button"
                onTouchEnd={(e) => { e.preventDefault(); void handleSend(); }}
                onClick={() => void handleSend()}
                disabled={isRateLimited || isUploading}
                className="text-[14px] font-semibold text-[#0095F6] hover:text-[#00376B] dark:hover:text-[#3897F0] px-3 py-1.5 min-h-[44px] min-w-[44px] transition cursor-pointer shrink-0 disabled:opacity-50 flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 rounded-full select-none"
                title={t('messages.send')}
                aria-label={t('messages.send')}
              >
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#0095F6]" />
                ) : (
                  <>
                    <span>{t('messages.send')}</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            ) : (
              <div className="flex items-center gap-1 shrink-0">
                {/* Voice Memo Button */}
                <button
                  type="button"
                  onClick={startRecording}
                  disabled={isRateLimited}
                  className="p-1 text-gray-700 dark:text-[#E0E0E0] hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer disabled:opacity-40"
                  title={t('messages.recordVoice')}
                  aria-label={t('messages.recordVoice')}
                >
                  <Mic className="w-5 h-5 stroke-[1.8]" />
                </button>

                {/* Photo / Video Attachment Button */}
                <button
                  type="button"
                  onClick={() => mediaInputRef.current?.click()}
                  disabled={isRateLimited}
                  className="p-1 text-gray-700 dark:text-[#E0E0E0] hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer disabled:opacity-40"
                  title={t('messages.attachMedia')}
                  aria-label={t('messages.attachMedia')}
                >
                  <ImageIcon className="w-5 h-5 stroke-[1.8]" />
                </button>

                {/* Generic File / Document Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isRateLimited}
                  className="p-1 text-gray-700 dark:text-[#E0E0E0] hover:text-[#0084FF] dark:hover:text-[#3797F0] transition cursor-pointer disabled:opacity-40"
                  title={t('messages.attachDocument')}
                  aria-label={t('messages.attachDocument')}
                >
                  <Paperclip className="w-5 h-5 stroke-[1.8]" />
                </button>

                {/* GIF Picker Button */}
                <div className="relative flex items-center">
                  <button
                    type="button"
                    onClick={() => {
                      setShowGifPicker(!showGifPicker);
                      setShowEmojiPicker(false);
                    }}
                    disabled={isRateLimited}
                    className={clsx(
                      'p-1 transition cursor-pointer disabled:opacity-40 flex items-center justify-center',
                      showGifPicker
                        ? 'text-[#0084FF] dark:text-[#3797F0]'
                        : 'text-gray-700 dark:text-[#E0E0E0] hover:text-[#0084FF] dark:hover:text-[#3797F0]'
                    )}
                    title={t('messages.attachGif')}
                    aria-label={t('messages.attachGif')}
                  >
                    <span className="font-extrabold text-[10.5px] border border-current px-1 py-[1.5px] rounded-[4px] leading-none select-none tracking-tight">
                      GIF
                    </span>
                  </button>

                  {/* GIF Popover */}
                  {showGifPicker && (
                    <div className="absolute bottom-10 right-0 z-50">
                      <GifPickerPopover
                        isOpen={showGifPicker}
                        onClose={() => setShowGifPicker(false)}
                        onSelectGif={handleSelectGif}
                        className="shadow-2xl border border-gray-200 dark:border-[#363636]"
                      />
                    </div>
                  )}
                </div>

                {/* Quick Like / Thumbs Up Button */}
                <button
                  type="button"
                  onClick={() => handleSend('👍')}
                  disabled={isRateLimited}
                  className="p-1 text-gray-700 dark:text-[#E0E0E0] hover:text-[#0084FF] dark:hover:text-[#3797F0] hover:scale-110 active:scale-95 transition cursor-pointer shrink-0 disabled:opacity-50"
                  title={t('messages.sendLike')}
                  aria-label={t('messages.sendLike')}
                >
                  <ThumbsUp className="w-5 h-5 stroke-[1.8]" />
                </button>
              </div>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default ChatInputBar;
