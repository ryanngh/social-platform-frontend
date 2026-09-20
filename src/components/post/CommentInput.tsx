import React, { useState, useRef, useEffect } from 'react';
import { Smile, ImagePlus, Send, X, Loader2, Play, Upload } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl } from '../../utils/media';
import { mediaService } from '../../services/mediaService';
import type { CommentMediaRequest } from '../../types';
import EmojiPickerPopover from '../common/EmojiPickerPopover';
import GifPickerPopover from '../common/GifPickerPopover';
import toast from 'react-hot-toast';

interface CommentInputProps {
  authorName: string;
  onSubmit: (content: string, media?: CommentMediaRequest[]) => void | Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  replyingTo?: { username: string; onCancel: () => void } | null;
}

interface CommentPreviewItem {
  id: string;
  url: string;
  type: string;
  file: File;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  authorName,
  onSubmit,
  isSubmitting = false,
  placeholder,
  replyingTo,
}) => {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<CommentPreviewItem[]>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);
  const dragCounter = useRef(0);

  // Auto-tag user and focus input when replyingTo changes
  useEffect(() => {
    if (replyingTo?.username) {
      const tag = `@${replyingTo.username} `;
      setContent((prev) => {
        if (!prev.startsWith(tag)) {
          return `${tag}${prev}`;
        }
        return prev;
      });
      setTimeout(() => textInputRef.current?.focus(), 50);
    }
  }, [replyingTo]);

  // Ref previews để dọn dẹp object URLs CHỈ KHI component unmount
  const previewsRef = useRef(previews);
  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {
          // ignore
        }
      });
    };
  }, []);

  const processFiles = (files: File[]) => {
    if (files.length === 0) return;

    // Giới hạn tối đa 5 files cho comment
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length < files.length) {
      toast.error(t('feed.unsupportedFileError'));
    }

    if (validFiles.length === 0) return;

    setPreviews((prev) => {
      if (prev.length + validFiles.length > 5) {
        toast.error(
          language === 'vi'
            ? 'Tối đa 5 ảnh hoặc video cho mỗi bình luận'
            : 'Maximum 5 media items per comment'
        );
      }

      const availableSlots = 5 - prev.length;
      if (availableSlots <= 0) return prev;

      const filesToAdd = validFiles.slice(0, availableSlots);
      const addedPreviews: CommentPreviewItem[] = filesToAdd.map((file) => ({
        id: `c-media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
        type: file.type,
        file,
      }));

      const nextPreviews = [...prev, ...addedPreviews];
      setSelectedFiles(nextPreviews.map((p) => p.file));
      return nextPreviews;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    processFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragging) setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleSelectGif = async (gifUrl: string) => {
    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      const file = new File([blob], `gif-${Date.now()}.gif`, { type: 'image/gif' });
      processFiles([file]);
      setIsGifPickerOpen(false);
    } catch {
      toast.error(language === 'vi' ? 'Không thể tải file GIF' : 'Failed to load GIF');
    }
  };

  const handleRemoveFile = (index: number) => {
    setPreviews((prev) => {
      const removed = prev[index];
      if (removed) {
        try {
          URL.revokeObjectURL(removed.url);
        } catch {
          // ignore
        }
      }
      const nextPreviews = prev.filter((_, i) => i !== index);
      setSelectedFiles(nextPreviews.map((p) => p.file));
      return nextPreviews;
    });
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    const currentFiles = previews.map((p) => p.file);
    if ((!trimmed && currentFiles.length === 0) || isSubmitting || isUploadingMedia) return;

    try {
      let uploadedMedia: CommentMediaRequest[] = [];
      if (currentFiles.length > 0) {
        setIsUploadingMedia(true);
        const mediaResponses = await mediaService.uploadPostMediaBatch(currentFiles, 'COMMENTS');
        uploadedMedia = mediaResponses.map((m) => ({
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        }));
      }

      await onSubmit(trimmed, uploadedMedia);

      previews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.url);
        } catch {
          // ignore
        }
      });
      setContent('');
      setSelectedFiles([]);
      setPreviews([]);
    } catch (err) {
      console.error('Failed to submit comment:', err);
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const busy = isSubmitting || isUploadingMedia;
  const canSend = (!!content.trim() || selectedFiles.length > 0) && !busy;

  return (
    <footer
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`p-4 bg-white border-t border-[#E2E2EC] flex-shrink-0 flex flex-col gap-2 relative transition-[box-shadow,border-color] ${
        isDragging ? 'ring-2 ring-inset ring-[#004AC6]' : ''
      }`}
    >
      {/* Dragging drop overlay - Không làm dịch chuyển layout, không bị glitching */}
      {isDragging && (
        <div className="absolute inset-0 z-30 bg-blue-50/90 border-2 border-dashed border-[#004AC6] flex flex-col items-center justify-center gap-1.5 backdrop-blur-xs pointer-events-none animate-fadeIn select-none">
          <div className="w-9 h-9 rounded-full bg-[#004AC6]/10 flex items-center justify-center text-[#004AC6]">
            <Upload className="w-4 h-4 animate-bounce" />
          </div>
          <span className="text-xs font-semibold text-[#004AC6]">
            {language === 'vi' ? 'Thả tệp ảnh hoặc video vào đây để đính kèm' : 'Drop image or video here to attach'}
          </span>
        </div>
      )}

      {/* Replying banner */}
      {replyingTo && (
        <div className="flex items-center justify-between bg-[#F4F4FB] px-3 py-1.5 rounded-lg text-xs text-[#004AC6] font-medium border border-[#E2E2EC]">
          <span>{t('postDetail.replyTo', { name: replyingTo.username })}</span>
          <button
            type="button"
            onClick={replyingTo.onCancel}
            className="p-1 hover:text-red-500 rounded transition-colors"
            title={t('postDetail.cancelReply')}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Media previews above input */}
      {previews.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 px-1">
          {previews.map((preview, idx) => (
            <div
              key={preview.id}
              className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/10 flex-shrink-0 border border-[#E2E2EC] group"
            >
              {preview.type.startsWith('video/') ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white pointer-events-none">
                  <Play className="w-5 h-5 fill-white" />
                </div>
              ) : (
                <img
                  src={preview.url}
                  alt="preview"
                  className="w-full h-full object-cover pointer-events-none"
                  draggable={false}
                />
              )}
              <button
                type="button"
                draggable={false}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => handleRemoveFile(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors cursor-pointer z-10"
              >
                <X className="w-3 h-3 pointer-events-none" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-3">
        <img
          src={getAvatarUrl(user?.avatarUrl)}
          alt={user?.firstName || ''}
          className="w-9 h-9 rounded-full object-cover ring-2 ring-[#004AC6]/20 flex-shrink-0"
        />
        <div className="flex-1 bg-[#F4F4FB] border border-[#E2E2EC] rounded-xl flex items-center px-3 py-1.5 focus-within:border-[#004AC6] focus-within:ring-2 focus-within:ring-[#004AC6]/20 transition-all">
          <input
            ref={textInputRef}
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent border-none text-sm text-[#1A1C1E] placeholder:text-[#535F70] focus:ring-0 p-1 outline-none"
            placeholder={
              placeholder ||
              (replyingTo
                ? t('postDetail.writeReply')
                : t('postDetail.writeComment', { name: authorName }))
            }
            disabled={busy}
          />
          <div className="flex items-center gap-1 text-[#535F70] relative">
            {/* GIF Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsGifPickerOpen(!isGifPickerOpen);
                  setIsEmojiPickerOpen(false);
                }}
                className={`px-1.5 py-0.5 text-[11px] font-bold rounded-md transition-colors cursor-pointer ${
                  isGifPickerOpen
                    ? 'bg-[#004AC6] text-white'
                    : 'text-purple-600 bg-purple-50 hover:bg-purple-100'
                }`}
                title={language === 'vi' ? 'Chọn ảnh động GIF' : 'Choose animated GIF'}
                disabled={busy}
              >
                GIF
              </button>
              {isGifPickerOpen && (
                <GifPickerPopover
                  isOpen={isGifPickerOpen}
                  onClose={() => setIsGifPickerOpen(false)}
                  onSelectGif={handleSelectGif}
                  className="absolute right-0 bottom-full mb-3 z-50"
                />
              )}
            </div>

            {/* Emoji Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsEmojiPickerOpen(!isEmojiPickerOpen);
                  setIsGifPickerOpen(false);
                }}
                className={`p-1 rounded transition-colors cursor-pointer ${
                  isEmojiPickerOpen
                    ? 'text-amber-600 bg-amber-100'
                    : 'hover:text-[#1A1C1E] hover:bg-[#E2E2EC]'
                }`}
                title={t('postDetail.addEmoji')}
                disabled={busy}
              >
                <Smile className="w-5 h-5" />
              </button>
              {isEmojiPickerOpen && (
                <EmojiPickerPopover
                  isOpen={isEmojiPickerOpen}
                  onClose={() => setIsEmojiPickerOpen(false)}
                  onSelectEmoji={(emoji) => setContent((prev) => prev + emoji)}
                  className="absolute right-0 bottom-full mb-3 z-50"
                />
              )}
            </div>

            {/* Image / Video file attachment */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1 hover:text-[#1A1C1E] rounded hover:bg-[#E2E2EC] transition-colors cursor-pointer"
              title={t('postDetail.attachPhoto')}
              disabled={busy}
            >
              <ImagePlus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
          className="hidden"
        />

        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSend}
          className="h-10 px-4 bg-[#004AC6] hover:bg-[#003A9F] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95 flex-shrink-0 cursor-pointer"
          title={t('postDetail.send')}
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span className="text-sm hidden lg:inline">{t('postDetail.send')}</span>
              <Send className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </footer>
  );
};

export default CommentInput;
