import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Globe, 
  Lock, 
  Users, 
  Play, 
  Plus, 
  Smile, 
  Loader2, 
  ChevronDown,
  ImagePlay
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { postService } from '../../services/postService';
import { mediaService } from '../../services/mediaService';
import { getMediaUrl } from '../../utils/media';
import { extractHashtags } from '../../utils/text';
import type { PostResponse, PostVisibility, PostMediaRequest } from '../../types';
import EmojiPickerPopover from '../common/EmojiPickerPopover';
import GifPickerPopover from '../common/GifPickerPopover';
import toast from 'react-hot-toast';

interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: PostResponse;
  onPostUpdated: (updated: PostResponse) => void;
}

type EditMediaItem = 
  | { id: string; isNew: false; mediaUrl: string; mediaType: 'IMAGE' | 'VIDEO'; thumbnailUrl?: string | null }
  | { id: string; isNew: true; file: File; previewUrl: string; mediaType: 'IMAGE' | 'VIDEO'; name: string };

export const EditPostModal: React.FC<EditPostModalProps> = ({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}) => {
  const { t, language } = useLanguage();
  const [content, setContent] = useState(post.content || '');
  const [visibility, setVisibility] = useState<PostVisibility>(post.visibility || 'PUBLIC');
  const [mediaList, setMediaList] = useState<EditMediaItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isAudienceOpen, setIsAudienceOpen] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const audienceMenuRef = useRef<HTMLDivElement>(null);

  // Initialize media from current post
  useEffect(() => {
    if (isOpen) {
      setContent(post.content || '');
      setVisibility(post.visibility || 'PUBLIC');
      const initial: EditMediaItem[] = (post.media || []).map((m, idx) => ({
        id: `existing-${m.id || m.mediaUrl || idx}`,
        isNew: false,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType === 'VIDEO' ? 'VIDEO' : 'IMAGE',
        thumbnailUrl: m.thumbnailUrl,
      }));
      setMediaList(initial);
    }
  }, [isOpen, post]);

  // Ref lưu mediaList hiện tại để chỉ dọn dẹp URL khi unmount
  const mediaListRef = useRef(mediaList);
  useEffect(() => {
    mediaListRef.current = mediaList;
  }, [mediaList]);

  useEffect(() => {
    return () => {
      mediaListRef.current.forEach((item) => {
        if (item.isNew && item.previewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {
            // ignore
          }
        }
      });
    };
  }, []);

  // Đổi vị trí an toàn trong danh sách media
  const reorderMedia = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setMediaList((prev) => {
      const next = [...prev];
      const [moved] = next.splice(fromIdx, 1);
      next.splice(toIdx, 0, moved);
      return next;
    });
  };

  // Click outside audience menu
  useEffect(() => {
    if (!isAudienceOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (audienceMenuRef.current && !audienceMenuRef.current.contains(e.target as Node)) {
        setIsAudienceOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAudienceOpen]);

  if (!isOpen) return null;

  const handleAddNewFiles = (files: File[]) => {
    const valid = files.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );
    if (valid.length < files.length) {
      toast.error(t('feed.unsupportedFileError'));
    }
    if (mediaList.length + valid.length > 30) {
      toast.error(t('feed.maxFilesExceeded'));
    }
    const canAdd = valid.slice(0, 30 - mediaList.length);
    const newItems: EditMediaItem[] = canAdd.map((file) => ({
      id: `new-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      isNew: true,
      file,
      previewUrl: URL.createObjectURL(file),
      mediaType: file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE',
      name: file.name,
    }));
    setMediaList((prev) => [...prev, ...newItems]);
  };

  const handleRemoveMedia = (index: number) => {
    const item = mediaList[index];
    if (item && item.isNew) {
      try {
        URL.revokeObjectURL(item.previewUrl);
      } catch {
        // ignore
      }
    }
    setMediaList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectGif = async (gifUrl: string) => {
    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      const file = new File([blob], `gif-${Date.now()}.gif`, { type: 'image/gif' });
      handleAddNewFiles([file]);
    } catch {
      toast.error('Không thể tải file GIF');
    }
  };

  const handleSave = async () => {
    if (!content.trim() && mediaList.length === 0) {
      toast.error(t('feed.postEmptyError'));
      return;
    }

    setIsSaving(true);
    try {
      // 1. Upload newly added files
      const newFileItems = mediaList.filter((m): m is Extract<EditMediaItem, { isNew: true }> => m.isNew);
      const uploadedMap = new Map<File, PostMediaRequest>();

      if (newFileItems.length > 0) {
        const filesToUpload = newFileItems.map((item) => item.file);
        const uploadResponses = await mediaService.uploadPostMediaBatch(filesToUpload, 'POSTS');
        uploadResponses.forEach((res, idx) => {
          uploadedMap.set(filesToUpload[idx], res);
        });
      }

      // 2. Assemble ordered final media list
      const finalMedia: PostMediaRequest[] = mediaList.map((item) => {
        if (item.isNew) {
          const uploadRes = uploadedMap.get(item.file);
          const remoteUrl = uploadRes?.mediaUrl || item.file.name;
          return {
            mediaUrl: remoteUrl,
            mediaType: item.mediaType,
            thumbnailUrl: null,
            width: uploadRes?.width ?? null,
            height: uploadRes?.height ?? null,
          };
        } else {
          return {
            mediaUrl: item.mediaUrl,
            mediaType: item.mediaType,
            thumbnailUrl: item.thumbnailUrl || null,
            width: (item as any).width ?? null,
            height: (item as any).height ?? null,
          };
        }
      });

      // 3. Update post
      const hashtags = extractHashtags(content);
      const updated = await postService.updatePost(post.id, {
        content: content.trim(),
        visibility,
        media: finalMedia,
        hashtags,
      });

      onPostUpdated({
        ...post,
        ...updated,
        hashtags: updated.hashtags ?? hashtags,
        media: updated.media || [],
      });

      toast.success(t('postDetail.updatePostSuccess'));
      onClose();
    } catch (err) {
      console.error('Failed to update post:', err);
      toast.error(language === 'vi' ? 'Không thể cập nhật bài viết' : 'Failed to update post');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#262626] w-full max-w-xl max-h-[90vh] flex flex-col relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626]">
          <h3 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
            {t('profile.editPostTitle')}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1A1A] dark:hover:bg-[#363636] text-gray-500 dark:text-[#A8A8A8] flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Audience Selector */}
          <div className="relative inline-block self-start" ref={audienceMenuRef}>
            <button
              type="button"
              onClick={() => setIsAudienceOpen(!isAudienceOpen)}
              className="flex items-center gap-1.5 px-3 py-1 bg-gray-100 hover:bg-gray-200 dark:bg-[#1A1A1A] dark:hover:bg-[#363636] text-gray-700 dark:text-[#D4D4D4] rounded-full text-xs font-semibold transition cursor-pointer"
            >
              {visibility === 'PUBLIC' && <Globe className="w-3.5 h-3.5" />}
              {visibility === 'FRIENDS' && <Users className="w-3.5 h-3.5" />}
              {visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5" />}
              <span>
                {visibility === 'PUBLIC'
                  ? t('postDetail.publicVisibility')
                  : visibility === 'FRIENDS'
                  ? t('postDetail.friendsVisibility')
                  : t('postDetail.privateVisibility')}
              </span>
              <ChevronDown className="w-3 h-3 text-gray-400 dark:text-[#A8A8A8]" />
            </button>

            {isAudienceOpen && (
              <div className="absolute left-0 mt-1 w-44 bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] py-1.5 z-20 animate-fadeIn">
                {(['PUBLIC', 'FRIENDS', 'PRIVATE'] as PostVisibility[]).map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => {
                      setVisibility(v);
                      setIsAudienceOpen(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-xs transition text-left cursor-pointer ${
                      visibility === v
                        ? 'bg-blue-50 dark:bg-[#0095F6]/15 text-[#004AC6] dark:text-[#0095F6] font-semibold'
                        : 'text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-50 dark:hover:bg-[#262626]'
                    }`}
                  >
                    {v === 'PUBLIC' && <Globe className="w-3.5 h-3.5" />}
                    {v === 'FRIENDS' && <Users className="w-3.5 h-3.5" />}
                    {v === 'PRIVATE' && <Lock className="w-3.5 h-3.5" />}
                    <span>
                      {v === 'PUBLIC'
                        ? t('postDetail.publicVisibility')
                        : v === 'FRIENDS'
                        ? t('postDetail.friendsVisibility')
                        : t('postDetail.privateVisibility')}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content Textarea */}
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full text-sm text-gray-800 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] border-none outline-none resize-none p-0 custom-scrollbar leading-relaxed bg-transparent"
            placeholder="Nội dung bài viết..."
          />

          {/* Media Manager & Reordering */}
          {mediaList.length > 0 && (
            <div className="border border-gray-200 dark:border-[#363636] rounded-2xl p-3.5 bg-gray-50/70 dark:bg-[#1A1A1A]">
              <div className="flex items-center justify-between mb-2.5 px-1">
                <span className="text-[11px] font-semibold text-gray-600 dark:text-[#A8A8A8]">
                  {mediaList.length} / 30 ảnh & video
                </span>
                <span className="text-[11px] text-[#004AC6] dark:text-[#0095F6] font-medium">
                  {t('profile.dragToReorder')}
                </span>
              </div>

              <div
                className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1"
                onDragOver={(e) => {
                  if (draggedIdx !== null) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                  }
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                  setDragOverIdx(null);
                }}
                onDrop={(e) => {
                  if (draggedIdx !== null) {
                    e.preventDefault();
                    setDragOverIdx(null);
                    setDraggedIdx(null);
                  }
                }}
              >
                {mediaList.map((item, idx) => (
                  <div
                    key={item.id}
                    draggable
                    onDragStart={(e) => {
                      e.stopPropagation();
                      setDraggedIdx(idx);
                      e.dataTransfer.setData('text/plain', idx.toString());
                      e.dataTransfer.setData('application/x-reorder-edit', 'true');
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (e.dataTransfer.types.includes('application/x-reorder-edit') || draggedIdx !== null) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.dataTransfer.dropEffect = 'move';
                        if (draggedIdx !== null && draggedIdx !== idx && dragOverIdx !== idx) {
                          setDragOverIdx(idx);
                        }
                      }
                    }}
                    onDragLeave={(e) => {
                      e.stopPropagation();
                      if (e.currentTarget.contains(e.relatedTarget as Node)) {
                        return;
                      }
                      if (dragOverIdx === idx) {
                        setDragOverIdx(null);
                      }
                    }}
                    onDrop={(e) => {
                      if (e.dataTransfer.types.includes('application/x-reorder-edit') || draggedIdx !== null) {
                        e.preventDefault();
                        e.stopPropagation();
                        if (draggedIdx !== null && draggedIdx !== idx) {
                          reorderMedia(draggedIdx, idx);
                        }
                        setDraggedIdx(null);
                        setDragOverIdx(null);
                      }
                    }}
                    onDragEnd={() => {
                      setDraggedIdx(null);
                      setDragOverIdx(null);
                    }}
                    className={`relative group aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-black/20 border select-none transition-[border-color,box-shadow,opacity] cursor-grab active:cursor-grabbing ${
                      draggedIdx === idx
                        ? 'opacity-30 border-dashed border-[#004AC6] dark:border-blue-400'
                        : dragOverIdx === idx
                        ? 'border-[#004AC6] dark:border-blue-400 ring-2 ring-[#004AC6] dark:ring-blue-400 shadow-md bg-blue-50/20 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-[#363636] shadow-xs'
                    }`}
                  >
                    {/* Index Badge */}
                    <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center justify-center pointer-events-none z-10">
                      {idx + 1}
                    </div>

                    {item.mediaType === 'VIDEO' ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-2 pointer-events-none">
                        <Play className="w-6 h-6 text-white fill-white/80 mb-1" />
                        <span className="text-[10px] text-gray-300">Video</span>
                      </div>
                    ) : (
                      <img
                        src={item.isNew ? item.previewUrl : getMediaUrl(item.mediaUrl)}
                        alt={`media-${idx}`}
                        className="w-full h-full object-cover pointer-events-none"
                        draggable={false}
                      />
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      draggable={false}
                      onMouseDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveMedia(idx);
                      }}
                      className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-md z-10 cursor-pointer ${
                        draggedIdx !== null ? 'pointer-events-none' : ''
                      }`}
                      title={t('profile.deleteMedia')}
                    >
                      <X className="w-3.5 h-3.5 pointer-events-none" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                {mediaList.length < 30 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-300 dark:border-[#363636] hover:border-[#004AC6] dark:hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-blue-950/30 flex flex-col items-center justify-center gap-1 text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="text-[10px] font-semibold">{t('feed.addPhotos')}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Hidden File Input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files) {
                handleAddNewFiles(Array.from(e.target.files));
                e.target.value = '';
              }
            }}
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
            className="hidden"
          />

          {/* Toolbar */}
          <div className="border border-gray-200/80 dark:border-[#363636] rounded-2xl p-2.5 flex items-center justify-between shadow-xs bg-white dark:bg-[#262626]">
            <span className="text-xs font-semibold text-gray-700 dark:text-[#D4D4D4] pl-1">
              Thêm vào bài viết
            </span>
            <div className="flex items-center gap-1 relative">
              {/* Photo/Video */}
              <button
                type="button"
                className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition text-emerald-500 dark:text-emerald-400 cursor-pointer"
                title={t('feed.photoVideo')}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlay className="w-5 h-5" />
              </button>

              {/* GIF Button */}
              <div className="relative">
                <button
                  type="button"
                  className={`px-2 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                    isGifPickerOpen
                      ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white'
                      : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-300 bg-purple-50/60 dark:bg-purple-900/30'
                  }`}
                  title={t('profile.addGif')}
                  onClick={() => {
                    setIsGifPickerOpen(!isGifPickerOpen);
                    setIsEmojiPickerOpen(false);
                  }}
                >
                  GIF
                </button>
                {isGifPickerOpen && (
                  <GifPickerPopover
                    isOpen={isGifPickerOpen}
                    onClose={() => setIsGifPickerOpen(false)}
                    onSelectGif={handleSelectGif}
                    className="absolute right-0 bottom-full mb-3"
                  />
                )}
              </div>

              {/* Emoji Button */}
              <div className="relative">
                <button
                  type="button"
                  className={`p-2 rounded-xl transition cursor-pointer ${
                    isEmojiPickerOpen
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300'
                      : 'hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-500 dark:text-amber-400'
                  }`}
                  title={t('feed.feelingActivity')}
                  onClick={() => {
                    setIsEmojiPickerOpen(!isEmojiPickerOpen);
                    setIsGifPickerOpen(false);
                  }}
                >
                  <Smile className="w-5 h-5" />
                </button>
                {isEmojiPickerOpen && (
                  <EmojiPickerPopover
                    isOpen={isEmojiPickerOpen}
                    onClose={() => setIsEmojiPickerOpen(false)}
                    onSelectEmoji={(emoji) => setContent((prev) => prev + emoji)}
                    className="absolute right-0 bottom-full mb-3"
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 dark:border-[#262626] bg-gray-50/50 dark:bg-[#121212]/50 rounded-b-3xl">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-5 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-200 dark:hover:bg-[#262626] transition cursor-pointer"
          >
            {t('common.cancel')}
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 rounded-xl text-xs font-semibold bg-[#004AC6] hover:bg-[#003da3] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white transition flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{t('profile.saveChanges')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPostModal;
