import React, { useEffect, useRef, useState } from 'react';
import { 
  Bookmark, 
  Link2, 
  ShieldOff, 
  Edit3, 
  Trash2, 
  Globe, 
  Users, 
  Lock, 
  ChevronRight, 
  Check,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';
import type { PostVisibility } from '../../types';

interface PostMoreMenuProps {
  authorUsername: string;
  isAuthor: boolean;
  currentVisibility?: PostVisibility;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onChangeVisibility?: (visibility: PostVisibility) => void;
  onDelete?: () => void;
}

export const PostMoreMenu: React.FC<PostMoreMenuProps> = ({
  authorUsername,
  isAuthor,
  currentVisibility = 'PUBLIC',
  isOpen,
  onClose,
  onEdit,
  onChangeVisibility,
  onDelete,
}) => {
  const { t } = useLanguage();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showVisibilityMenu, setShowVisibilityMenu] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setShowVisibilityMenu(false);
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSave = () => {
    toast(t('postDetail.savedToast'), { icon: '🔖' });
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {});
    toast.success(t('postDetail.copiedToast'));
    onClose();
  };

  const handleBlock = () => {
    toast(t('postDetail.blockConfirm', { username: authorUsername }), { icon: '🚫' });
    onClose();
  };

  const handleEdit = () => {
    onClose();
    onEdit?.();
  };

  const handleDelete = () => {
    if (window.confirm(t('postDetail.deletePostConfirm'))) {
      onClose();
      onDelete?.();
    }
  };

  const handleSelectVisibility = (newVis: PostVisibility) => {
    onChangeVisibility?.(newVis);
    setShowVisibilityMenu(false);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-64 bg-white rounded-2xl shadow-xl border border-[#E2E2EC] z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {showVisibilityMenu ? (
        /* Visibility Submenu */
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 pb-2 border-b border-[#E2E2EC] text-xs font-bold text-[#1A1C1E]">
            <button
              type="button"
              onClick={() => setShowVisibilityMenu(false)}
              className="p-1 hover:bg-[#F4F4FB] rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-[#535F70]" />
            </button>
            <span>{t('postDetail.changeVisibility')}</span>
          </div>

          <button
            onClick={() => handleSelectVisibility('PUBLIC')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
              currentVisibility === 'PUBLIC' ? 'text-[#004AC6] font-semibold bg-blue-50/50' : 'text-[#1A1C1E] hover:bg-[#F4F4FB]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#535F70]" />
              <span>{t('postDetail.publicVisibility')}</span>
            </div>
            {currentVisibility === 'PUBLIC' && <Check className="w-4 h-4 text-[#004AC6]" />}
          </button>

          <button
            onClick={() => handleSelectVisibility('FRIENDS')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
              currentVisibility === 'FRIENDS' ? 'text-[#004AC6] font-semibold bg-blue-50/50' : 'text-[#1A1C1E] hover:bg-[#F4F4FB]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#535F70]" />
              <span>{t('postDetail.friendsVisibility')}</span>
            </div>
            {currentVisibility === 'FRIENDS' && <Check className="w-4 h-4 text-[#004AC6]" />}
          </button>

          <button
            onClick={() => handleSelectVisibility('CLOSE_FRIENDS')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
              currentVisibility === 'CLOSE_FRIENDS' ? 'text-emerald-600 font-semibold bg-emerald-50/50' : 'text-[#1A1C1E] hover:bg-[#F4F4FB]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{t('postDetail.closeFriendsVisibility')}</span>
            </div>
            {currentVisibility === 'CLOSE_FRIENDS' && <Check className="w-4 h-4 text-emerald-600" />}
          </button>

          <button
            onClick={() => handleSelectVisibility('PRIVATE')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors ${
              currentVisibility === 'PRIVATE' ? 'text-[#004AC6] font-semibold bg-blue-50/50' : 'text-[#1A1C1E] hover:bg-[#F4F4FB]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-[#535F70]" />
              <span>{t('postDetail.privateVisibility')}</span>
            </div>
            {currentVisibility === 'PRIVATE' && <Check className="w-4 h-4 text-[#004AC6]" />}
          </button>
        </div>
      ) : (
        /* Main Menu */
        <div>
          {/* Author Only: Edit Post */}
          {isAuthor && onEdit && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1C1E] hover:bg-[#F4F4FB] transition-colors text-left"
              type="button"
            >
              <Edit3 className="w-4 h-4 text-[#535F70]" />
              <span>{t('postDetail.editPost')}</span>
            </button>
          )}

          {/* Author Only: Change Visibility */}
          {isAuthor && onChangeVisibility && (
            <button
              onClick={() => setShowVisibilityMenu(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#1A1C1E] hover:bg-[#F4F4FB] transition-colors text-left"
              type="button"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#535F70]" />
                <span>{t('postDetail.changeVisibility')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#535F70]" />
            </button>
          )}

          {/* Everyone: Save Post */}
          <button
            onClick={handleSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1C1E] hover:bg-[#F4F4FB] transition-colors text-left"
            type="button"
          >
            <Bookmark className="w-4 h-4 text-[#535F70]" />
            <span>{t('postDetail.savePost')}</span>
          </button>

          {/* Everyone: Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1C1E] hover:bg-[#F4F4FB] transition-colors text-left"
            type="button"
          >
            <Link2 className="w-4 h-4 text-[#535F70]" />
            <span>{t('postDetail.copyLink')}</span>
          </button>

          {/* Non-Author Only: Block User */}
          {!isAuthor && (
            <>
              <div className="my-1 border-t border-[#E2E2EC]" />
              <button
                onClick={handleBlock}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors text-left"
                type="button"
              >
                <ShieldOff className="w-4 h-4" />
                <span>{t('postDetail.blockProfile', { username: authorUsername })}</span>
              </button>
            </>
          )}

          {/* Author Only: Delete Post */}
          {isAuthor && onDelete && (
            <>
              <div className="my-1 border-t border-[#E2E2EC]" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left font-medium"
                type="button"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <span>{t('postDetail.deletePost')}</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PostMoreMenu;
