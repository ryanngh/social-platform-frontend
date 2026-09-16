import React, { useState, useRef, useEffect } from 'react';
import { Smile, ImagePlus, Send, X, Loader2, Play } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl } from '../../utils/media';
import { mediaService } from '../../services/mediaService';
import type { CommentMediaRequest } from '../../types';
import toast from 'react-hot-toast';

interface CommentInputProps {
  authorName: string;
  onSubmit: (content: string, media?: CommentMediaRequest[]) => void | Promise<void>;
  isSubmitting?: boolean;
  placeholder?: string;
  replyingTo?: { username: string; onCancel: () => void } | null;
}

export const CommentInput: React.FC<CommentInputProps> = ({
  authorName,
  onSubmit,
  isSubmitting = false,
  placeholder,
  replyingTo,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<Array<{ url: string; type: string }>>([]);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLInputElement>(null);

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

  // Dọn dẹp object URLs khi previews thay đổi hoặc unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Giới hạn tối đa 5 files cho comment
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length < files.length) {
      toast.error(t('feed.unsupportedFileError'));
    }

    if (selectedFiles.length + validFiles.length > 5) {
      toast.error('Tối đa 5 ảnh hoặc video cho mỗi bình luận');
    }

    const newFiles = [...selectedFiles, ...validFiles].slice(0, 5);
    setSelectedFiles(newFiles);

    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
    }));
    setPreviews(newPreviews);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if ((!trimmed && selectedFiles.length === 0) || isSubmitting || isUploadingMedia) return;

    try {
      let uploadedMedia: CommentMediaRequest[] = [];
      if (selectedFiles.length > 0) {
        setIsUploadingMedia(true);
        const mediaResponses = await mediaService.uploadPostMediaBatch(selectedFiles, 'COMMENTS');
        uploadedMedia = mediaResponses.map((m) => ({
          mediaUrl: m.mediaUrl,
          mediaType: m.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        }));
      }

      await onSubmit(trimmed, uploadedMedia);
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
    <footer className="p-4 bg-white border-t border-[#E2E2EC] flex-shrink-0 flex flex-col gap-2">
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
              key={idx}
              className="relative w-14 h-14 rounded-xl overflow-hidden bg-black/10 flex-shrink-0 border border-[#E2E2EC] group"
            >
              {preview.type.startsWith('video/') ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 text-white">
                  <Play className="w-5 h-5 fill-white" />
                </div>
              ) : (
                <img src={preview.url} alt="preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => handleRemoveFile(idx)}
                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-black transition-colors"
              >
                <X className="w-3 h-3" />
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
          <div className="flex items-center gap-1 text-[#535F70]">
            <button
              type="button"
              className="p-1 hover:text-[#1A1C1E] rounded hover:bg-[#E2E2EC] transition-colors"
              title={t('postDetail.addEmoji')}
            >
              <Smile className="w-5 h-5" />
            </button>
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
