import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Clock,
  X,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useSearchHistory, useTypeaheadSearch } from '../../hooks/useSearch';
import { formatSearchCount } from './UserSearchCard';
import UserAvatar from '../common/UserAvatar';
import type { UserSearchResult, SearchHistoryItem } from '../../types';


export interface SearchTypeaheadDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  query: string;
  onSelectQuery: (queryText: string) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export const SearchTypeaheadDropdown: React.FC<SearchTypeaheadDropdownProps> = ({
  isOpen,
  onClose,
  query,
  onSelectQuery,
}) => {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user: currentUser } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const trimmedQuery = query.trim();
  const isQueryEmpty = trimmedQuery.length === 0;

  // Lấy lịch sử tìm kiếm khi ô trống
  const {
    history,
    isLoading: isLoadingHistory,
    deleteItem,
    clearAll,
  } = useSearchHistory(isOpen && isQueryEmpty);

  // Gợi ý tức thì khi gõ
  const {
    data: typeaheadData,
    isFetching: isFetchingTypeahead,
  } = useTypeaheadSearch(query, isOpen && !isQueryEmpty);

  // Safe normalized arrays
  const rawHistory = Array.isArray(history) ? history : [];
  const users = Array.isArray(typeaheadData?.users) ? typeaheadData.users : [];
  const recentSearchSuggestions = Array.isArray(typeaheadData?.recentSearches)
    ? typeaheadData.recentSearches
    : [];

  if (!isOpen) return null;

  const handleExecuteSearch = (q: string) => {
    const cleanText = q.trim();
    if (!cleanText) return;
    onSelectQuery(cleanText);
    onClose();
    navigate(`/search?q=${encodeURIComponent(cleanText)}`);
  };

  const handleUserClick = (userId: string, username: string | null) => {
    onClose();
    const target = username ? `/${username}` : userId ? `/${userId}` : '/feed';
    navigate(target);
  };

  return (
    <div
      ref={dropdownRef}
      onMouseDown={(e) => {
        // Ngăn chặn event mousedown làm mất focus của input
        e.stopPropagation();
      }}
      className="absolute top-full left-0 right-0 mt-2 w-full min-w-[320px] sm:min-w-[380px] md:min-w-[420px] bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#262626] overflow-hidden z-50 animate-fadeIn transition-colors duration-200"
    >
      {/* 1. STATE KHI Ô TÌM KIẾM TRỐNG (HIỂN THỊ LỊCH SỬ GẦN ĐÂY) */}
      {isQueryEmpty ? (
        <div className="p-3.5 sm:p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-[#262626]">
            <span className="text-xs font-bold text-gray-500 dark:text-[#A8A8A8] flex items-center gap-1.5 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              {t('search.recentSearches')}
            </span>

            {rawHistory.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  clearAll();
                }}
                className="text-[11px] font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer flex items-center gap-1"
              >
                <span>{t('search.clearAll')}</span>
              </button>
            )}
          </div>

          {isLoadingHistory ? (
            <div className="py-6 flex items-center justify-center text-gray-400 gap-2 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
              <span>{t('common.loading')}</span>
            </div>
          ) : rawHistory.length === 0 ? (
            <div className="py-6 text-center text-gray-400 dark:text-[#737373]">
              <Search className="w-6 h-6 mx-auto mb-2 text-gray-300 dark:text-[#444444]" />
              <p className="text-xs font-medium">{t('search.noRecentSearches')}</p>
              <p className="text-[11px] text-gray-400 dark:text-[#666666] mt-0.5">
                {t('search.noRecentSearchesDesc')}
              </p>
            </div>
          ) : (
            <div className="space-y-1 max-h-[320px] overflow-y-auto custom-scrollbar pr-0.5">
              {rawHistory.map((item, idx) => {
                const itemId =
                  typeof item === 'object' && item !== null && item.id
                    ? item.id
                    : `hist-${idx}`;
                const itemKeyword =
                  typeof item === 'string'
                    ? item
                    : item?.keyword || (item as any)?.query || '';

                if (!itemKeyword) return null;

                return (
                  <div
                    key={itemId}
                    onClick={() => handleExecuteSearch(itemKeyword)}
                    className="group flex items-center justify-between px-3 py-2 rounded-2xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <Clock className="w-4 h-4 text-gray-400 group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors shrink-0" />
                      <span className="text-xs font-medium text-gray-800 dark:text-[#E5E5E5] truncate group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6]">
                        {itemKeyword}
                      </span>
                    </div>

                    {typeof item === 'object' && item !== null && item.id && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          deleteItem(item.id);
                        }}
                        className="p-1 text-gray-400 hover:text-rose-500 rounded-full hover:bg-gray-200/60 dark:hover:bg-[#262626] transition shrink-0 cursor-pointer"
                        title={t('search.deleteItem')}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* 2. STATE KHI ĐANG GÕ TỪ KHÓA (TYPEAHEAD SUGGESTIONS) */
        <div className="py-2">
          {/* Header Bar with Loading indicator */}
          <div className="flex items-center justify-between px-4 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
            <span>{t('search.instantSuggestions')}</span>
            {isFetchingTypeahead && (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
            )}
          </div>

          {/* Section A: Matching Users */}
          {users.length > 0 && (
            <div className="border-b border-gray-100 dark:border-[#262626] pb-1.5 mb-1.5">
              <div className="px-4 py-1 text-[11px] font-bold text-gray-400 dark:text-[#737373]">
                {t('search.tabs.people')}
              </div>
              <div className="space-y-0.5">
                {users.map((user: UserSearchResult, idx: number) => {
                  if (!user) return null;
                  const userKey = user.userId || `user-${idx}`;
                  const displayName =
                    user.fullName ||
                    `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
                    user.username ||
                    'User';
                  const userHandle =
                    user.username ||
                    (user.userId ? String(user.userId).slice(0, 8) : 'user');

                  return (
                    <div
                      key={userKey}
                      onClick={() => handleUserClick(user.userId, user.username)}
                      className="flex items-center justify-between px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <UserAvatar
                          userId={user.userId}
                          src={user.avatarUrl}
                          alt={displayName}
                          isVerified={user.isVerified}
                          size="sm"
                          className="w-9 h-9"
                        />
                        <div className="min-w-0 flex-1 leading-tight">
                          <div className="flex items-center gap-1">
                            <span className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5] truncate">
                              {displayName}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] truncate">
                            @{userHandle}
                            {(user.followerCount ?? 0) > 0 && (
                              <>
                                {' '}·{' '}
                                <span>
                                  {formatSearchCount(user.followerCount)}{' '}
                                  {t('search.followers')}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Relationship Pill */}
                      {user.userId === currentUser?.id ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] border border-blue-200/60 dark:border-blue-800/40">
                          {language === 'vi' ? 'Bạn' : 'You'}
                        </span>
                      ) : user.isMutual ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                          {t('search.friends')}
                        </span>
                      ) : user.isFollowing ? (
                        <span className="shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-[#A8A8A8]">
                          {t('search.following')}
                        </span>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Section B: Matching keywords or history */}
          {recentSearchSuggestions.length > 0 && (
            <div className="space-y-0.5 pb-1 mb-1 border-b border-gray-100 dark:border-[#262626]">
              {recentSearchSuggestions.map((item: string | SearchHistoryItem, idx: number) => {
                const text =
                  typeof item === 'string'
                    ? item
                    : (item as any)?.keyword ||
                      (item as any)?.query ||
                      String(item || '');

                if (!text) return null;

                return (
                  <div
                    key={`sug-${idx}`}
                    onClick={() => handleExecuteSearch(text)}
                    className="flex items-center gap-2.5 px-4 py-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer"
                  >
                    <Search className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-xs font-medium text-gray-700 dark:text-[#D4D4D4] truncate">
                      {text}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Section C: Action "Xem tất cả kết quả cho query" */}
          <div
            onClick={() => handleExecuteSearch(trimmedQuery)}
            className="flex items-center justify-between px-4 py-2.5 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[#004AC6] dark:text-[#0095F6] transition cursor-pointer font-semibold text-xs"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <Search className="w-4 h-4 shrink-0" />
              <span className="truncate">
                {language === 'vi'
                  ? `Tìm kiếm tất cả kết quả cho "${trimmedQuery}"`
                  : `Search all results for "${trimmedQuery}"`}
              </span>
            </div>
            <ArrowRight className="w-4 h-4 shrink-0" />
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchTypeaheadDropdown;
