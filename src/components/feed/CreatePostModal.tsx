import React, { useState, useEffect } from 'react';
import { 
  X, 
  Globe, 
  ChevronDown, 
  ImagePlay, 
  BarChart2, 
  Smile, 
  MapPin, 
  Tag, 
  Loader2 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import toast from 'react-hot-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitPost?: (content: string) => void;
}

const CreatePostModal: React.FC<CreatePostModalProps> = ({
  isOpen,
  onClose,
  onSubmitPost,
}) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || t('topNav.userFallback');
  const firstName = user?.firstName || user?.username || t('topNav.userFallback');

  const handlePublish = React.useCallback(() => {
    if (!content.trim()) {
      toast.error(t('feed.postEmptyError'));
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitPost) {
        onSubmitPost(content);
      }
      toast.success(t('feed.postSuccess'));
      setContent('');
      onClose();
    }, 600);
  }, [content, onSubmitPost, onClose, t]);

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

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-xl overflow-hidden flex flex-col transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
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

        {/* Body Content */}
        <div className="p-6 flex flex-col gap-4">
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
              {/* Audience selector button */}
              <button className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-semibold text-gray-700 transition w-fit cursor-pointer">
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                <span>{t('feed.public')}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Textarea Input */}
          <div className="pt-1">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              autoFocus
              className="w-full text-base placeholder-gray-400 text-gray-800 border-none focus:ring-0 resize-none p-0 custom-scrollbar leading-relaxed outline-none min-h-[110px]"
              placeholder={t('feed.composerPlaceholder', { name: firstName })}
              rows={4}
            ></textarea>
          </div>

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
                onClick={() => toast(t('feed.photoVideoToast'), { icon: '📷' })}
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
          <div className="flex flex-col gap-2 pt-1">
            <button
              onClick={handlePublish}
              disabled={isSubmitting || !content.trim()}
              className="w-full bg-[#004AC6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-2xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{t('feed.publishing')}</span>
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
