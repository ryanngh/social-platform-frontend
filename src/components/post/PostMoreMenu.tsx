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
import { copyToClipboard, handleCopyAndSharePost } from '../../utils/share';

interface PostMoreMenuProps {
  postId?: string;
  authorUsername: string;
  isAuthor: boolean;
  currentVisibility?: PostVisibility;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onChangeVisibility?: (visibility: PostVisibility) => void;
  onDelete?: () => void;
  onCopyLink?: () => void;
}

export const PostMoreMenu: React.FC<PostMoreMenuProps> = ({
  postId,
  authorUsername,
  isAuthor,
  currentVisibility = 'PUBLIC',
  isOpen,
  onClose,
  onEdit,
  onChangeVisibility,
  onDelete,
  onCopyLink,
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

  const handleCopyLink = async () => {
    if (onCopyLink) {
      onCopyLink();
    } else if (postId) {
      await handleCopyAndSharePost(postId, {
        successMessage: t('postDetail.copiedToast'),
        errorMessage: t('postDetail.copyLinkFailed'),
      });
    } else {
      await copyToClipboard(window.location.href);
      toast.success(t('postDetail.copiedToast'));
    }
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
    onClose();
    onDelete?.();
  };

  const handleSelectVisibility = (newVis: PostVisibility) => {
    onChangeVisibility?.(newVis);
    setShowVisibilityMenu(false);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-[#E2E2EC] dark:border-[#363636] z-50 py-2 animate-in fade-in slide-in-from-top-2 duration-150"
    >
      {showVisibilityMenu ? (
        /* Visibility Submenu */
        <div className="space-y-1">
          <div className="flex items-center gap-2 px-3 pb-2 border-b border-[#E2E2EC] dark:border-[#363636] text-xs font-bold text-[#1A1C1E] dark:text-[#F5F5F5]">
            <button
              type="button"
              onClick={() => setShowVisibilityMenu(false)}
              className="p-1 hover:bg-[#F4F4FB] dark:hover:bg-[#262626] rounded-lg transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
            </button>
            <span>{t('postDetail.changeVisibility')}</span>
          </div>

          <button
            onClick={() => handleSelectVisibility('PUBLIC')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              currentVisibility === 'PUBLIC'
                ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold bg-blue-50/50 dark:bg-[#0095F6]/15'
                : 'text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
              <span>{t('postDetail.publicVisibility')}</span>
            </div>
            {currentVisibility === 'PUBLIC' && <Check className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />}
          </button>

          <button
            onClick={() => handleSelectVisibility('FRIENDS')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              currentVisibility === 'FRIENDS'
                ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold bg-blue-50/50 dark:bg-[#0095F6]/15'
                : 'text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
              <span>{t('postDetail.friendsVisibility')}</span>
            </div>
            {currentVisibility === 'FRIENDS' && <Check className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />}
          </button>

          <button
            onClick={() => handleSelectVisibility('CLOSE_FRIENDS')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              currentVisibility === 'CLOSE_FRIENDS'
                ? 'text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50/50 dark:bg-emerald-950/30'
                : 'text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>{t('postDetail.closeFriendsVisibility')}</span>
            </div>
            {currentVisibility === 'CLOSE_FRIENDS' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
          </button>

          <button
            onClick={() => handleSelectVisibility('PRIVATE')}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors cursor-pointer ${
              currentVisibility === 'PRIVATE'
                ? 'text-[#004AC6] dark:text-[#0095F6] font-semibold bg-blue-50/50 dark:bg-[#0095F6]/15'
                : 'text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626]'
            }`}
            type="button"
          >
            <div className="flex items-center gap-3">
              <Lock className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
              <span>{t('postDetail.privateVisibility')}</span>
            </div>
            {currentVisibility === 'PRIVATE' && <Check className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6]" />}
          </button>
        </div>
      ) : (
        /* Main Menu */
        <div>
          {/* Author Only: Edit Post */}
          {isAuthor && onEdit && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626] transition-colors text-left cursor-pointer"
              type="button"
            >
              <Edit3 className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
              <span>{t('postDetail.editPost')}</span>
            </button>
          )}

          {/* Author Only: Change Visibility */}
          {isAuthor && onChangeVisibility && (
            <button
              onClick={() => setShowVisibilityMenu(true)}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626] transition-colors text-left cursor-pointer"
              type="button"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
                <span>{t('postDetail.changeVisibility')}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
            </button>
          )}

          {/* Everyone: Save Post */}
          <button
            onClick={handleSave}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626] transition-colors text-left cursor-pointer"
            type="button"
          >
            <Bookmark className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
            <span>{t('postDetail.savePost')}</span>
          </button>

          {/* Everyone: Copy Link */}
          <button
            onClick={handleCopyLink}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[#1A1C1E] dark:text-[#E5E5E5] hover:bg-[#F4F4FB] dark:hover:bg-[#262626] transition-colors text-left cursor-pointer"
            type="button"
          >
            <Link2 className="w-4 h-4 text-[#535F70] dark:text-[#A8A8A8]" />
            <span>{t('postDetail.copyLink')}</span>
          </button>

          {/* Non-Author Only: Block User */}
          {!isAuthor && (
            <>
              <div className="my-1 border-t border-[#E2E2EC] dark:border-[#363636]" />
              <button
                onClick={handleBlock}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors text-left cursor-pointer"
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
              <div className="my-1 border-t border-[#E2E2EC] dark:border-[#363636]" />
              <button
                onClick={handleDelete}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-rose-400 hover:bg-red-50 dark:hover:bg-rose-950/30 transition-colors text-left font-medium cursor-pointer"
                type="button"
              >
                <Trash2 className="w-4 h-4 text-red-600 dark:text-rose-400" />
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
