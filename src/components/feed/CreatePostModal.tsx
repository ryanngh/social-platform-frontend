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
  Check
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { mediaService } from '../../services/mediaService';
import type { PostMediaRequest, PostVisibility } from '../../types';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost?: (content: string, media?: PostMediaRequest[], visibility?: PostVisibility) => void | Promise<void>;
}

interface FilePreview {
  url: string;
  type: string;
  name: string;
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
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || t('topNav.userFallback');
  const firstName = user?.firstName || user?.username || t('topNav.userFallback');

  // Dọn dẹp object URLs khi component unmount hoặc khi previews thay đổi
  useEffect(() => {
    return () => {
      previews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  // Xử lý nạp danh sách files (dùng chung cho cả FilePicker lẫn Drag & Drop)
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

    if (selectedFiles.length + validFiles.length > 30) {
      toast.error(t('feed.maxFilesExceeded'));
    }

    // Giới hạn tối đa 30 files như backend quy định
    const newFiles = [...selectedFiles, ...validFiles].slice(0, 30);
    setSelectedFiles(newFiles);

    const newPreviews = newFiles.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }));
    setPreviews(newPreviews);
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
    URL.revokeObjectURL(previews[index].url);
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    setPreviews(newPreviews);
  };

  // Drag and drop event handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
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
    const hasMedia = selectedFiles.length > 0;

    if (!hasText && !hasMedia) {
      toast.error(t('feed.postEmptyError'));
      return;
    }

    setIsSubmitting(true);
    try {
      let uploadedMedia: PostMediaRequest[] = [];
      if (hasMedia) {
        setUploadStatus(t('feed.uploadingMedia'));
        uploadedMedia = await mediaService.uploadPostMediaBatch(selectedFiles);
      }

      setUploadStatus(t('feed.publishing'));
      if (onSubmitPost) {
        await onSubmitPost(content, uploadedMedia, visibility);
      }

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
  }, [content, selectedFiles, visibility, onSubmitPost, onClose, t]);

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
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col transition-all relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag & Drop Visual Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-40 bg-white/95 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-[#004AC6] rounded-3xl m-2 animate-in fade-in zoom-in-95 duration-150 pointer-events-none shadow-xl">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#004AC6] mb-3 animate-bounce shadow-sm">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-[#004AC6] mb-1">
              {t('feed.dropFilesHere')}
            </h4>
            <p className="text-xs text-[#535F70] max-w-xs">
              {t('feed.dropFilesDesc')}
            </p>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div className="w-8"></div>
          <h3 className="text-base font-bold text-gray-900 text-center flex-1">{t('feed.createPost')}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition cursor-pointer"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content - Scrollable if content + media is long */}
        <div className="p-6 flex flex-col gap-4 overflow-y-auto custom-scrollbar flex-1">
          {/* Author Row */}
          <div className="flex items-center gap-3">
            <img
              alt={displayName}
              className="w-11 h-11 rounded-full object-cover border border-gray-200 shadow-sm"
              src={getAvatarUrl(user?.avatarUrl)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-bold text-gray-900 leading-tight">
                {displayName}
              </span>
              {/* Audience selector dropdown */}
              <div className="relative" ref={audienceMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsAudienceDropdownOpen(!isAudienceDropdownOpen)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition w-fit cursor-pointer border ${
                    visibility === 'CLOSE_FRIENDS'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  <span className="w-3.5 h-3.5 flex items-center justify-center">
                    {visibility === 'PUBLIC' && <Globe className="w-3.5 h-3.5 text-blue-600" />}
                    {visibility === 'FRIENDS' && <Users className="w-3.5 h-3.5 text-indigo-600" />}
                    {visibility === 'CLOSE_FRIENDS' && <Sparkles className="w-3.5 h-3.5 text-emerald-500" />}
                    {visibility === 'PRIVATE' && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                  </span>
                  <span>
                    {visibility === 'PUBLIC' && t('feed.public')}
                    {visibility === 'FRIENDS' && t('feed.friends')}
                    {visibility === 'CLOSE_FRIENDS' && t('feed.closeFriends')}
                    {visibility === 'PRIVATE' && t('feed.private')}
                  </span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>

                {isAudienceDropdownOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-2 border-b border-gray-100 mb-1">
                      <p className="text-xs font-bold text-gray-900">{t('feed.whoCanSeePost')}</p>
                      <p className="text-[11px] text-gray-500">{t('feed.audienceDescription')}</p>
                    </div>

                    <div className="space-y-1">
                      {[
                        {
                          val: 'PUBLIC' as PostVisibility,
                          lbl: t('feed.public'),
                          desc: t('feed.publicDesc'),
                          icon: <Globe className="w-4 h-4 text-blue-600" />,
                        },
                        {
                          val: 'FRIENDS' as PostVisibility,
                          lbl: t('feed.friends'),
                          desc: t('feed.friendsDesc'),
                          icon: <Users className="w-4 h-4 text-indigo-600" />,
                        },
                        {
                          val: 'CLOSE_FRIENDS' as PostVisibility,
                          lbl: t('feed.closeFriends'),
                          desc: t('feed.closeFriendsDesc'),
                          icon: <Sparkles className="w-4 h-4 text-emerald-500" />,
                        },
                        {
                          val: 'PRIVATE' as PostVisibility,
                          lbl: t('feed.private'),
                          desc: t('feed.privateDesc'),
                          icon: <Lock className="w-4 h-4 text-slate-600" />,
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
                                ? 'bg-blue-50/70 text-gray-900'
                                : 'hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              {item.icon}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold leading-tight text-gray-900">
                                  {item.lbl}
                                </span>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-[#004AC6]" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 leading-snug mt-0.5">
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
              className="w-full text-base placeholder-gray-400 text-gray-800 border-none focus:ring-0 resize-none p-0 custom-scrollbar leading-relaxed outline-none min-h-[90px]"
              placeholder={t('feed.composerPlaceholder', { name: firstName })}
              rows={3}
            ></textarea>
          </div>

          {/* Media Previews Gallery */}
          {previews.length > 0 && (
            <div className="border border-gray-200 rounded-2xl p-3 bg-gray-50/70">
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-56 overflow-y-auto custom-scrollbar p-1">
                {previews.map((preview, idx) => (
                  <div key={idx} className="relative group aspect-square rounded-xl overflow-hidden bg-black/5 border border-gray-200 shadow-xs">
                    {preview.type.startsWith('video/') ? (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-800 text-white p-2">
                        <Play className="w-7 h-7 text-white fill-white/80 mb-1" />
                        <span className="text-[10px] text-gray-300 truncate w-full text-center">{preview.name}</span>
                      </div>
                    ) : (
                      <img
                        src={preview.url}
                        alt={preview.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md"
                      title={t('common.delete')}
                    >
                      <X className="w-3.5 h-3.5" />
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
          <div className="border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between shadow-sm bg-white">
            <span className="text-xs font-semibold text-gray-700 pl-1">
              {t('feed.addToPost')}
            </span>
            <div className="flex items-center gap-1">
              {/* Photo/Video */}
              <button 
                type="button" 
                className="p-2 hover:bg-emerald-50 rounded-xl transition text-emerald-500 cursor-pointer" 
                title={t('feed.photoVideo')}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlay className="w-5 h-5" />
              </button>
              {/* Poll */}
              <button 
                type="button" 
                className="p-2 hover:bg-blue-50 rounded-xl transition text-blue-600 cursor-pointer" 
                title={t('feed.poll')}
                onClick={() => toast(t('feed.pollToast'), { icon: '📊' })}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              {/* Feeling/Activity */}
              <button 
                type="button" 
                className="p-2 hover:bg-amber-50 rounded-xl transition text-amber-500 cursor-pointer" 
                title={t('feed.feelingActivity')}
                onClick={() => toast(t('feed.feelingToast'), { icon: '😊' })}
              >
                <Smile className="w-5 h-5" />
              </button>
              {/* Location Pin */}
              <button 
                type="button" 
                className="p-2 hover:bg-rose-50 rounded-xl transition text-rose-500 cursor-pointer" 
                title={t('feed.locationPin')}
                onClick={() => toast(t('feed.locationToast'), { icon: '📍' })}
              >
                <MapPin className="w-5 h-5" />
              </button>
              {/* Tag Friends */}
              <button 
                type="button" 
                className="p-2 hover:bg-purple-50 rounded-xl transition text-purple-600 cursor-pointer" 
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
              className="w-full bg-[#004AC6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-2xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
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
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <span>{t('feed.tipLabel')}</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">
                Enter
              </kbd>
              <span>{t('feed.tipCtrlEnter')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
