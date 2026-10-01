import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Globe, 
  ChevronDown, 
  ImagePlay, 
  BarChart2, 
  Smile, 
  MapPin, 
  Tag, 
  Loader2,
  Plus,
  Play,
  UploadCloud,
  Users,
  Lock,
  Sparkles,
  Check,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { mediaService } from '../../services/mediaService';
import type { PostMediaRequest, PostVisibility } from '../../types';
import EmojiPickerPopover from '../common/EmojiPickerPopover';
import GifPickerPopover from '../common/GifPickerPopover';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost?: (content: string, media?: PostMediaRequest[], visibility?: PostVisibility) => void | Promise<void>;
}

interface FilePreview {
  id: string;
  url: string;
  type: string;
  name: string;
  file: File;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmitPost,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<PostVisibility>('PUBLIC');
  const [isAudienceDropdownOpen, setIsAudienceDropdownOpen] = useState(false);
  const audienceMenuRef = useRef<HTMLDivElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
  const [isGifPickerOpen, setIsGifPickerOpen] = useState(false);
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || t('topNav.userFallback');
  const firstName = user?.firstName || user?.username || t('topNav.userFallback');

  // Ref lưu previews hiện tại để dọn dẹp CHỈ KHI component unmount (không revoke khi đổi thứ tự)
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

  // Đổi vị trí ảnh/video mượt mà không làm mất URL
  const reorderMedia = (fromIdx: number, toIdx: number) => {
    if (fromIdx === toIdx) return;
    setPreviews((prev) => {
      const nextPreviews = [...prev];
      const [moved] = nextPreviews.splice(fromIdx, 1);
      nextPreviews.splice(toIdx, 0, moved);
      setSelectedFiles(nextPreviews.map((p) => p.file));
      return nextPreviews;
    });
  };

  // Xử lý nạp danh sách files mới (chỉ tạo URL mới cho file mới thêm, giữ nguyên URL cũ)
  const processNewFiles = (files: File[]) => {
    if (files.length === 0) return;

    // Lọc chỉ nhận ảnh hoặc video
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || f.type.startsWith('video/')
    );

    if (validFiles.length < files.length) {
      toast.error(t('feed.unsupportedFileError'));
    }

    if (validFiles.length === 0) return;

    setPreviews((prev) => {
      if (prev.length + validFiles.length > 30) {
        toast.error(t('feed.maxFilesExceeded'));
      }

      const availableSlots = 30 - prev.length;
      if (availableSlots <= 0) return prev;

      const filesToAdd = validFiles.slice(0, availableSlots);
      const addedPreviews: FilePreview[] = filesToAdd.map((file) => ({
        id: `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        url: URL.createObjectURL(file),
        type: file.type,
        name: file.name,
        file,
      }));

      const nextPreviews = [...prev, ...addedPreviews];
      setSelectedFiles(nextPreviews.map((p) => p.file));
      return nextPreviews;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    processNewFiles(Array.from(e.target.files));

    // Reset input value để có thể chọn lại cùng 1 file nếu muốn
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

  const handleSelectGif = async (gifUrl: string) => {
    try {
      const res = await fetch(gifUrl);
      const blob = await res.blob();
      const file = new File([blob], `gif-${Date.now()}.gif`, { type: 'image/gif' });
      processNewFiles([file]);
    } catch {
      toast.error('Không thể tải file GIF, vui lòng thử lại');
    }
  };

  // Drag and drop event handlers cho toàn bộ modal (thêm file mới)
  const handleDragEnter = (e: React.DragEvent) => {
    if (draggedIdx !== null || e.dataTransfer.types.includes('application/x-reorder-media')) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (draggedIdx !== null || e.dataTransfer.types.includes('application/x-reorder-media')) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      if (!isDragging) setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (draggedIdx !== null || e.dataTransfer.types.includes('application/x-reorder-media')) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    if (draggedIdx !== null || e.dataTransfer.types.includes('application/x-reorder-media')) return;
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current = 0;
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processNewFiles(Array.from(e.dataTransfer.files));
    }
  };

  // Click outside audience dropdown
  useEffect(() => {
    if (!isAudienceDropdownOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (audienceMenuRef.current && !audienceMenuRef.current.contains(e.target as Node)) {
        setIsAudienceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isAudienceDropdownOpen]);

  const handlePublish = React.useCallback(async () => {
    const hasText = !!content.trim();
    const currentFiles = previews.map((p) => p.file);
    const hasMedia = currentFiles.length > 0;

    if (!hasText && !hasMedia) {
      toast.error(t('feed.postEmptyError'));
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedMedia: PostMediaRequest[] = [];
      if (hasMedia) {
        setUploadStatus(t('feed.uploadingMedia'));
        uploadedMedia = await mediaService.uploadPostMediaBatch(currentFiles);
      }

      setUploadStatus(t('feed.publishing'));
      if (onSubmitPost) {
        await onSubmitPost(content, uploadedMedia, visibility);
      }

      // Thu dọn object URLs sau khi publish xong
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
      onClose();
    } catch (error) {
      console.error('Failed to create post', error);
    } finally {
      setIsSubmitting(false);
      setUploadStatus('');
    }
  }, [content, previews, visibility, onSubmitPost, onClose, t]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handlePublish();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePublish, onClose]);

  if (!isOpen) return null;

  const canPublish = !!content.trim() || selectedFiles.length > 0;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div 
        className="bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#262626] w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col transition-all relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#004AC6] dark:border-[#0095F6] rounded-3xl m-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-none shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-[#004AC6] dark:text-[#0095F6] mb-3 animate-bounce shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-[#004AC6] dark:text-[#0095F6] mb-1">
              {t('feed.dropFilesHere')}
            </h4>
            <p className="text-xs text-[#535F70] dark:text-[#A8A8A8] max-w-xs">
              {t('feed.dropFilesDesc')}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-[#262626] flex-shrink-0">
          {isGifPickerOpen ? (
            <button
              type="button"
              onClick={() => setIsGifPickerOpen(false)}
              className="flex items-center gap-1.5 text-xs font-bold text-gray-700 dark:text-[#E5E5E5] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('common.cancel', { defaultValue: 'Quay lại' })}</span>
            </button>
          ) : (
            <div className="w-8"></div>
          )}
          <h3 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5] text-center flex-1">
            {isGifPickerOpen ? 'Chọn ảnh GIF' : t('feed.createPost')}
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 dark:text-[#A8A8A8] hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-[#262626] transition cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        {isGifPickerOpen ? (
          <div className="p-4 sm:p-6 flex flex-col gap-3 overflow-hidden flex-1 min-h-[400px]">
            <GifPickerPopover
              isOpen={isGifPickerOpen}
              onClose={() => setIsGifPickerOpen(false)}
              onSelectGif={(gifUrl) => {
                handleSelectGif(gifUrl);
                setIsGifPickerOpen(false);
              }}
              embedded
              className="w-full flex-1"
            />
          </div>
        ) : (
          <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
            {/* Author Row */}
            <div className="flex items-center gap-3">
              <img
                alt={displayName}
                className="w-11 h-11 rounded-full object-cover border border-gray-200 dark:border-[#363636] shadow-sm"
                src={getAvatarUrl(user?.avatarUrl)}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                }}
              />
              <div className="flex flex-col gap-1">
                <span className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                  {displayName}
                </span>
                {/* Audience selector dropdown */}
                <div className="relative" ref={audienceMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsAudienceDropdownOpen(!isAudienceDropdownOpen)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition w-fit cursor-pointer border ${
                      visibility === 'CLOSE_FRIENDS'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                        : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-700 dark:text-[#E5E5E5] border-gray-200 dark:border-[#363636] hover:bg-gray-200 dark:hover:bg-[#363636]'
                    }`}
                  >
                    <span className="w-3.5 h-3.5 flex items-center justify-center">
                      {visibility === 'PUBLIC' && <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-[#0095F6]" />}
                      {visibility === 'FRIENDS' && <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      {visibility === 'CLOSE_FRIENDS' && <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />}
                      {visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5 text-slate-600 dark:text-[#A8A8A8]" />}
                    </span>
                    <span>
                      {visibility === 'PUBLIC' && t('feed.public')}
                      {visibility === 'FRIENDS' && t('feed.friends')}
                      {visibility === 'CLOSE_FRIENDS' && t('feed.closeFriends')}
                      {visibility === 'PRIVATE' && t('feed.private')}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 dark:text-[#A8A8A8]" />
                  </button>

                  {isAudienceDropdownOpen && (
                    <div className="absolute left-0 top-full mt-2 w-72 bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-gray-100 dark:border-[#262626] mb-1">
                        <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5]">{t('feed.whoCanSeePost')}</p>
                        <p className="text-[11px] text-gray-500 dark:text-[#A8A8A8]">{t('feed.audienceDescription')}</p>
                      </div>

                      <div className="space-y-1">
                        {[
                          {
                            val: 'PUBLIC' as PostVisibility,
                            lbl: t('feed.public'),
                            desc: t('feed.publicDesc'),
                            icon: <Globe className="w-4 h-4 text-blue-600 dark:text-[#0095F6]" />,
                          },
                          {
                            val: 'FRIENDS' as PostVisibility,
                            lbl: t('feed.friends'),
                            desc: t('feed.friendsDesc'),
                            icon: <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
                          },
                          {
                            val: 'CLOSE_FRIENDS' as PostVisibility,
                            lbl: t('feed.closeFriends'),
                            desc: t('feed.closeFriendsDesc'),
                            icon: <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />,
                          },
                          {
                            val: 'PRIVATE' as PostVisibility,
                            lbl: t('feed.private'),
                            desc: t('feed.privateDesc'),
                            icon: <Lock className="w-4 h-4 text-slate-600 dark:text-[#A8A8A8]" />,
                          },
                        ].map((item) => {
                          const isSelected = visibility === item.val;
                          return (
                            <button
                              key={item.val}
                              type="button"
                              onClick={() => {
                                setVisibility(item.val);
                                setIsAudienceDropdownOpen(false);
                              }}
                              className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-50/70 dark:bg-blue-950/60 text-gray-900 dark:text-[#F5F5F5]'
                                  : 'hover:bg-gray-50 dark:hover:bg-[#262626]/80 text-gray-700 dark:text-[#D4D4D4]'
                              }`}
                            >
                              <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1A1A1A] flex items-center justify-center flex-shrink-0 mt-0.5">
                                {item.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <span className="text-xs font-bold leading-tight text-gray-900 dark:text-[#F5F5F5]">
                                    {item.lbl}
                                  </span>
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />
                                  )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-[#A8A8A8] leading-snug mt-0.5">
                                  {item.desc}
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Textarea Input */}
            <div className="pt-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                autoFocus
                className="w-full text-base placeholder-gray-400 dark:placeholder-[#737373] text-gray-800 dark:text-[#F5F5F5] border-none focus:ring-0 resize-none p-0 custom-scrollbar leading-relaxed outline-none min-h-[90px] bg-transparent"
                placeholder={t('feed.composerPlaceholder', { name: firstName })}
                rows={3}
              ></textarea>
            </div>

            {/* Media Previews Gallery */}
            {previews.length > 0 && (
              <div className="border border-gray-200 dark:border-[#262626] rounded-2xl p-3 bg-gray-50/70 dark:bg-[#1A1A1A]/40">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[11px] font-semibold text-gray-500 dark:text-[#A8A8A8]">
                    {previews.length} / 30 ảnh & video
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
                  {previews.map((preview, idx) => (
                    <div
                      key={preview.id}
                      draggable
                      onDragStart={(e) => {
                        e.stopPropagation();
                        setDraggedIdx(idx);
                        e.dataTransfer.setData('text/plain', idx.toString());
                        e.dataTransfer.setData('application/x-reorder-media', 'true');
                        e.dataTransfer.effectAllowed = 'move';
                      }}
                      onDragOver={(e) => {
                        if (e.dataTransfer.types.includes('application/x-reorder-media') || draggedIdx !== null) {
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
                        if (e.dataTransfer.types.includes('application/x-reorder-media') || draggedIdx !== null) {
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
                      className={`relative group aspect-square rounded-xl overflow-hidden bg-black/5 border select-none transition-[border-color,box-shadow,opacity] cursor-grab active:cursor-grabbing ${
                        draggedIdx === idx
                          ? 'opacity-30 border-dashed border-[#004AC6]'
                          : dragOverIdx === idx
                          ? 'border-[#004AC6] ring-2 ring-[#004AC6] shadow-md bg-blue-50/20'
                          : 'border-gray-200 shadow-xs'
                      }`}
                    >
                      {/* Index badge */}
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold flex items-center justify-center pointer-events-none z-10">
                        {idx + 1}
                      </div>

                      {preview.type.startsWith('video/') ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-2 pointer-events-none">
                          <Play className="w-7 h-7 text-white fill-white/80 mb-1" />
                          <span className="text-[10px] text-gray-300 truncate w-full text-center">{preview.name}</span>
                        </div>
                      ) : (
                        <img
                          src={preview.url}
                          alt={preview.name}
                          className="w-full h-full object-cover pointer-events-none"
                          draggable={false}
                        />
                      )}
                      <button
                        type="button"
                        draggable={false}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile(idx);
                        }}
                        className={`absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md z-10 cursor-pointer ${
                          draggedIdx !== null ? 'pointer-events-none' : ''
                        }`}
                        title={t('common.delete')}
                      >
                        <X className="w-3.5 h-3.5 pointer-events-none" />
                      </button>
                    </div>
                  ))}

                  {/* Add more button if under limit */}
                  {previews.length < 30 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-[#004AC6] hover:bg-blue-50/50 flex flex-col items-center justify-center gap-1 text-gray-500 hover:text-[#004AC6] transition cursor-pointer"
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
              onChange={handleFileSelect}
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/quicktime,video/webm"
              className="hidden"
            />

            {/* Add to Post Toolbar Box */}
            <div className="border border-gray-200/80 dark:border-[#262626] rounded-2xl p-3 flex items-center justify-between shadow-sm bg-white dark:bg-[#121212] transition-colors">
              <span className="text-xs font-semibold text-gray-700 dark:text-[#D4D4D4] pl-1">
                {t('feed.addToPost')}
              </span>
              <div className="flex items-center gap-1 relative">
                {/* Photo/Video */}
                <button 
                  type="button" 
                  className="p-2 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition text-emerald-500 cursor-pointer" 
                  title={t('feed.photoVideo')}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImagePlay className="w-5 h-5" />
                </button>

                {/* GIF Button */}
                <div>
                  <button 
                    type="button" 
                    className={`px-2 py-1 rounded-xl text-xs font-black transition cursor-pointer ${
                      isGifPickerOpen 
                        ? 'bg-[#004AC6] text-white' 
                        : 'hover:bg-purple-50 dark:hover:bg-purple-950/40 text-purple-600 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/30'
                    }`}
                    title={t('profile.addGif')}
                    onClick={() => {
                      setIsGifPickerOpen(true);
                      setIsEmojiPickerOpen(false);
                    }}
                  >
                    GIF
                  </button>
                </div>

                {/* Emoji Button */}
                <div className="relative">
                  <button 
                    type="button" 
                    className={`p-2 rounded-xl transition cursor-pointer ${
                      isEmojiPickerOpen 
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' 
                        : 'hover:bg-amber-50 dark:hover:bg-amber-950/40 text-amber-500'
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

                {/* Poll */}
                <button 
                  type="button" 
                  className="p-2 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-xl transition text-blue-600 dark:text-[#0095F6] cursor-pointer" 
                  title={t('feed.poll')}
                  onClick={() => toast(t('feed.pollToast'), { icon: '📊' })}
                >
                  <BarChart2 className="w-5 h-5" />
                </button>

                {/* Location Pin */}
                <button 
                  type="button" 
                  className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition text-rose-500 dark:text-rose-400 cursor-pointer" 
                  title={t('feed.locationPin')}
                  onClick={() => toast(t('feed.locationToast'), { icon: '📍' })}
                >
                  <MapPin className="w-5 h-5" />
                </button>

                {/* Tag Friends */}
                <button 
                  type="button" 
                  className="p-2 hover:bg-purple-50 dark:hover:bg-purple-950/40 rounded-xl transition text-purple-600 dark:text-purple-400 cursor-pointer" 
                  title={t('feed.tagFriends')}
                  onClick={() => toast(t('feed.tagToast'), { icon: '🏷️' })}
                >
                  <Tag className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Publishing CTA & Shortcut Footer */}
            <div className="flex flex-col gap-2 pt-1 flex-shrink-0">
              <button
                onClick={handlePublish}
                disabled={isSubmitting || !canPublish}
                className="w-full bg-[#004AC6] hover:bg-blue-700 dark:bg-[#0095F6] dark:hover:bg-[#1877F2] disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-2xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{uploadStatus || t('feed.publishing')}</span>
                  </>
                ) : (
                  <span>{t('feed.publish')}</span>
                )}
              </button>
              <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400 dark:text-[#A8A8A8]">
                <span>{t('feed.tipLabel')}</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded text-[10px] font-semibold text-gray-600 dark:text-[#D4D4D4]">
                  Ctrl
                </kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#363636] rounded text-[10px] font-semibold text-gray-600 dark:text-[#D4D4D4]">
                  Enter
                </kbd>
                <span>{t('feed.tipCtrlEnter')}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePostModal;
