import React from 'react';
import { MapPin, Link2, Calendar } from 'lucide-react';
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
    <section aria-labelledby="profile-info-heading" className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
      {/* User Avatar & Identity */}
      <div className="flex flex-col items-center text-center pb-5 border-b border-[#E2E2EC]">
        <img
          alt={fullName}
          className="w-20 h-20 rounded-full object-cover ring-2 ring-white shadow-sm mb-3 bg-white"
          src={getAvatarUrl(user.avatarUrl)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
          }}
        />
        <h2 id="profile-info-heading" className="text-lg font-bold text-[#1A1C1E] leading-tight">
          {fullName}
        </h2>
        <span className="text-sm text-[#535F70]">@{user.username || 'user'}</span>
      </div>

      {/* Personal Info List */}
      <div className="py-4 border-b border-[#E2E2EC] space-y-2.5 text-xs text-[#535F70]">
        <h3 className="text-xs font-bold text-[#1A1C1E] uppercase tracking-wider mb-2">
          {t('profile.personalInfo')}
        </h3>

        {user.location && (
          <div className="flex items-center gap-2.5 text-[#1A1C1E]">
            <MapPin className="w-4 h-4 text-[#535F70] shrink-0" />
            <span>{user.location}</span>
          </div>
        )}

        {user.websiteUrl && (
          <div className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-[#535F70] shrink-0" />
            <a
              className="text-[#004AC6] hover:underline font-medium truncate"
              href={user.websiteUrl.startsWith('http') ? user.websiteUrl : `https://${user.websiteUrl}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {user.websiteUrl.replace(/^https?:\/\//, '')}
            </a>
          </div>
        )}

        <div className="flex items-center gap-2.5 text-[#535F70]">
          <Calendar className="w-4 h-4 text-[#535F70] shrink-0" />
          <span>{joinedText}</span>
        </div>

        {!user.location && !user.websiteUrl && (
          <p className="text-xs text-gray-400 italic pt-1">
            {t('profile.unspecifiedLocationWebsite')}
          </p>
        )}
      </div>

      {/* Interests Tags */}
      <div className="py-4 border-b border-[#E2E2EC]">
        <h3 className="text-xs font-bold text-[#1A1C1E] uppercase tracking-wider mb-2.5">
          {t('profile.interests')}
        </h3>
        {userInterests.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {userInterests.map((interest) => (
              <span
                key={interest}
                className="px-2.5 py-1 text-xs bg-[#F3F3FD] border border-[#E2E2EC] rounded-full text-[#1A1C1E] hover:bg-[#EFF4FF] transition"
              >
                {interest}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 italic">{t('profile.noInterests')}</p>
        )}
      </div>

      {/* Groups Section */}
      <div className="pt-4">
        <h3 className="text-xs font-bold text-[#1A1C1E] uppercase tracking-wider mb-3">
          {t('profile.groups')}
        </h3>
        {userGroups.length > 0 ? (
          <ul className="space-y-3">
            {userGroups.map((group) => (
              <li key={group.name} className="flex items-center gap-2.5 group cursor-pointer">
                <span className="w-7 h-7 rounded-full bg-[#EDEDF8] border border-[#E2E2EC] flex items-center justify-center text-[#004AC6] group-hover:bg-[#EFF4FF] transition">
                  👥
                </span>
                <span className="text-xs font-medium text-[#1A1C1E] group-hover:text-[#004AC6] transition truncate">
                  {group.name}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 italic">{t('profile.noGroups')}</p>
        )}
      </div>
    </section>
  );
};

export default ProfileInfoCard;
