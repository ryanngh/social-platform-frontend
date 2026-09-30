import React from 'react';
import { MapPin, Link2, Calendar, Users } from 'lucide-react';
import type { User } from '../../types';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';
import { useLanguage } from '../../contexts/LanguageContext';

interface ProfileInfoCardProps {
  user: User;
}

export const ProfileInfoCard: React.FC<ProfileInfoCardProps> = ({ user }) => {
  const { t, language } = useLanguage();

  const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.username || t('topNav.userFallback');
  
  const formattedDate = user.createdAt
    ? new Date(user.createdAt).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'long', year: 'numeric' })
    : null;

  const joinedText = formattedDate
    ? t('profile.joinedDate', { date: formattedDate })
    : t('profile.justJoined');

  const userInterests: string[] = user.interests || [];
  const userGroups: { name: string }[] = user.groups || [];

  return (
    <section aria-labelledby="profile-info-heading" className="bg-white dark:bg-[#121212] border border-gray-100 dark:border-[#262626] rounded-3xl p-5 shadow-sm">
      {/* User Avatar & Identity */}
      <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100 dark:border-[#262626]">
        <img
          alt={fullName}
          className="w-16 h-16 rounded-full object-cover ring-2 ring-gray-100 dark:ring-[#262626] shadow-sm mb-2.5 bg-white dark:bg-[#1A1A1A]"
          src={getAvatarUrl(user.avatarUrl)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
          }}
        />
        <h2 id="profile-info-heading" className="text-base font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
          {fullName}
        </h2>
        <span className="text-xs text-gray-500 dark:text-[#A8A8A8] mt-0.5">@{user.username || 'user'}</span>
      </div>

      {/* Personal Info List */}
      <div className="py-4 border-b border-gray-100 dark:border-[#262626] space-y-2.5 text-xs sm:text-[13px] text-gray-600 dark:text-[#D4D4D4]">
        <h3 className="text-xs font-bold text-gray-400 dark:text-[#737373] uppercase tracking-wider mb-2">
          {t('profile.personalInfo')}
        </h3>

        {user.location && (
          <div className="flex items-center gap-2.5 text-gray-700 dark:text-[#E5E5E5]">
            <MapPin className="w-4 h-4 text-gray-400 dark:text-[#A8A8A8] shrink-0" />
            <span>{user.location}</span>
          </div>
        )}

        {user.websiteUrl && (
          <div className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-gray-400 dark:text-[#A8A8A8] shrink-0" />
            <a
              className="text-[#004AC6] dark:text-[#0095F6] hover:underline font-medium truncate"
              href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {user.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-gray-500 dark:text-[#A8A8A8]">
          <Calendar className="w-4 h-4 text-gray-400 dark:text-[#A8A8A8] shrink-0" />
          <span>{joinedText}</span>
        </div>

        {!user.location && !user.websiteUrl && (
          <p className="text-xs text-gray-400 dark:text-[#737373] italic pt-1">
            {t('profile.unspecifiedLocationWebsite')}
          </p>
        )}
      </div>

      {/* Interests Tags */}
      <div className="py-4 border-b border-gray-100 dark:border-[#262626]">
        <h3 className="text-xs font-bold text-gray-400 dark:text-[#737373] uppercase tracking-wider mb-2.5">
          {t('profile.interests')}
        </h3>
        {userInterests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {userInterests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 text-xs bg-gray-100 dark:bg-[#1A1A1A] border border-gray-200/60 dark:border-[#363636] rounded-full text-gray-700 dark:text-[#E5E5E5] hover:bg-gray-200/70 dark:hover:bg-[#262626] transition font-medium"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('profile.noInterests')}</p>
        )}
      </div>

      {/* Groups Section */}
      <div className="pt-4">
        <h3 className="text-xs font-bold text-gray-400 dark:text-[#737373] uppercase tracking-wider mb-3">
          {t('profile.groups')}
        </h3>
        {userGroups.length > 0 ? (
          <ul className="space-y-2.5">
            {userGroups.map((group) => (
              <li key={group.name} className="flex items-center gap-2.5 group cursor-pointer">
                <span className="w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center text-[#004AC6] dark:text-[#0095F6] group-hover:bg-blue-100 dark:group-hover:bg-blue-900/60 transition shrink-0">
                  <Users className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-medium text-gray-700 dark:text-[#E5E5E5] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition truncate">
                  {group.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 dark:text-[#737373] italic">{t('profile.noGroups')}</p>
        )}
      </div>
    </section>
  );
};

export default ProfileInfoCard;
