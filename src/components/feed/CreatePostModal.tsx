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
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const displayName = user?.firstName
    ? `${user.firstName} ${user.lastName || ''}`.trim()
    : user?.username || 'Người dùng';
  const firstName = user?.firstName || user?.username || 'bạn';

  const handlePublish = React.useCallback(() => {
    if (!content.trim()) {
      toast.error('Vui lòng nhập nội dung bài viết');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onSubmitPost) {
        onSubmitPost(content);
      }
      toast.success('Đã đăng bài viết thành công!');
      setContent('');
      onClose();
    }, 600);
  }, [content, onSubmitPost, onClose]);

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
          <h3 className="text-base font-bold text-gray-900 text-center flex-1">Tạo bài viết</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            title="Đóng"
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
              <button className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs font-semibold text-gray-700 transition w-fit">
                <Globe className="w-3.5 h-3.5 text-gray-500" />
                <span>Công khai</span>
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
              placeholder={`Bạn đang nghĩ gì thế, ${firstName}?`}
              rows={4}
            ></textarea>
          </div>

          {/* Add to Post Toolbar Box */}
          <div className="border border-gray-200/80 rounded-2xl p-3 flex items-center justify-between shadow-sm bg-white">
            <span className="text-xs font-semibold text-gray-700 pl-1">
              Thêm vào bài viết của bạn
            </span>
            <div className="flex items-center gap-1">
              {/* Photo/Video */}
              <button 
                type="button" 
                className="p-2 hover:bg-emerald-50 rounded-xl transition text-emerald-500" 
                title="Ảnh/Video"
                onClick={() => toast('Tính năng đính kèm ảnh sẽ sớm ra mắt!', { icon: '📷' })}
              >
                <ImagePlay className="w-5 h-5" />
              </button>
              {/* Poll */}
              <button 
                type="button" 
                className="p-2 hover:bg-blue-50 rounded-xl transition text-blue-600" 
                title="Cuộc thăm dò ý kiến"
                onClick={() => toast('Tính năng thăm dò ý kiến sẽ sớm ra mắt!', { icon: '📊' })}
              >
                <BarChart2 className="w-5 h-5" />
              </button>
              {/* Feeling/Activity */}
              <button 
                type="button" 
                className="p-2 hover:bg-amber-50 rounded-xl transition text-amber-500" 
                title="Cảm xúc/Hoạt động"
                onClick={() => toast('Tính năng cảm xúc sẽ sớm ra mắt!', { icon: '😊' })}
              >
                <Smile className="w-5 h-5" />
              </button>
              {/* Location Pin */}
              <button 
                type="button" 
                className="p-2 hover:bg-rose-50 rounded-xl transition text-rose-500" 
                title="Check-in vị trí"
                onClick={() => toast('Tính năng vị trí sẽ sớm ra mắt!', { icon: '📍' })}
              >
                <MapPin className="w-5 h-5" />
              </button>
              {/* Tag Friends */}
              <button 
                type="button" 
                className="p-2 hover:bg-purple-50 rounded-xl transition text-purple-600" 
                title="Gắn thẻ người khác"
                onClick={() => toast('Tính năng gắn thẻ bạn bè sẽ sớm ra mắt!', { icon: '🏷️' })}
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
              className="w-full bg-[#004AC6] hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm py-2.5 rounded-2xl shadow transition flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Đang đăng...</span>
                </>
              ) : (
                <span>Đăng bài viết</span>
              )}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-gray-400">
              <span>Mẹo: Nhấn</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">
                Ctrl
              </kbd>
              <span>+</span>
              <kbd className="px-1.5 py-0.5 bg-gray-100 border border-gray-200 rounded text-[10px] font-semibold text-gray-600">
                Enter
              </kbd>
              <span>để đăng nhanh</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePostModal;
