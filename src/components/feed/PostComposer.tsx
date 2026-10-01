import React from 'react';
import { Image, ImagePlay, Smile, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface PostComposerProps {
  onOpenCreateModal: () => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ onOpenCreateModal }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const firstName = user?.firstName || user?.username || t('topNav.userFallback');

  return (
    <article className="bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 shadow-2xs border border-gray-100 dark:border-[#262626] transition-colors duration-200">
      <div className="flex items-center gap-3 mb-3.5">
        <img
          alt={firstName}
          className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-[#363636] shadow-sm"
          src={getAvatarUrl(user?.avatarUrl)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
          }}
        />
        <input
          className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-gray-800 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] py-1.5 cursor-pointer outline-none font-normal"
          placeholder={t('feed.composerPlaceholder', { name: firstName })}
          type="text"
          readOnly
          onClick={onOpenCreateModal}
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-[#262626]">
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition cursor-pointer"
          >
            <ImagePlay className="w-4 h-4 text-emerald-500" />
            <span>{t('feed.photoVideo')}</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition cursor-pointer"
          >
            <Image className="w-4 h-4 text-blue-500" />
            <span>{t('feed.album')}</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition cursor-pointer hidden sm:flex"
          >
            <Smile className="w-4 h-4 text-amber-500" />
            <span>{t('feed.feeling')}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 text-xs text-gray-600 dark:text-[#D4D4D4] bg-gray-100 dark:bg-[#1A1A1A] hover:bg-gray-200 dark:hover:bg-[#363636] px-3 py-1.5 rounded-full font-semibold transition cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-gray-500 dark:text-[#A8A8A8]" />
            <span>{t('feed.public')}</span>
            <ChevronDown className="w-3 h-3 text-gray-400 dark:text-[#737373]" />
          </button>
          <button
            onClick={onOpenCreateModal}
            className="bg-[#004AC6] hover:bg-blue-700 dark:bg-[#0095F6] dark:hover:bg-[#1877F2] text-white font-semibold text-xs px-5 py-1.5 rounded-full transition shadow-xs cursor-pointer min-h-[32px] flex items-center justify-center"
          >
            {t('feed.publish')}
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostComposer;
