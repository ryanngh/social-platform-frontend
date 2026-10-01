import React, { useState, useMemo } from 'react';
import {
  Bell,
  CheckCheck,
  Settings,
  RefreshCw,
  Heart,
  MessageCircle,
  AtSign,
  UserPlus,
  Repeat,
  Inbox,
  Loader2,
  Sparkles,
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';
import { useLanguage } from '../contexts/LanguageContext';
import { NotificationItemComponent } from '../components/notifications/NotificationItemComponent';
import { NotificationSettingsModal } from '../components/notifications/NotificationSettingsModal';
import { getNotificationTimeGroup, getTimeGroupTitle } from '../utils/notification';
import type { NotificationItem } from '../types';

type FilterTab = 'all' | 'unread' | 'reactions' | 'comments' | 'mentions' | 'friends' | 'reposts';

export const NotificationsPage: React.FC = () => {
  const { t, language } = useLanguage();
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    fetchInitialNotifications,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchInitialNotifications();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filter items based on active tab
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'unread') return !item.isRead;
      if (activeTab === 'reactions') {
        return item.type === 'POST_REACTED' || item.type === 'COMMENT_REACTED';
      }
      if (activeTab === 'comments') {
        return item.type === 'POST_COMMENTED' || item.type === 'COMMENT_REPLIED';
      }
      if (activeTab === 'mentions') {
        return item.type === 'USER_MENTIONED';
      }
      if (activeTab === 'friends') {
        return item.type === 'USER_FOLLOWED' || item.type === 'FRIEND_REQUEST';
      }
      if (activeTab === 'reposts') {
        return item.type === 'POST_REPOSTED' || item.type === 'POST_SHARED';
      }
      return true;
    });
  }, [notifications, activeTab]);

  // Group items by time (Hôm nay, Tuần này, Trước đó)
  const groupedNotifications = useMemo(() => {
    const groups: {
      group: 'today' | 'this_week' | 'earlier';
      title: string;
      items: NotificationItem[];
    }[] = [
      { group: 'today', title: getTimeGroupTitle('today', language), items: [] },
      { group: 'this_week', title: getTimeGroupTitle('this_week', language), items: [] },
      { group: 'earlier', title: getTimeGroupTitle('earlier', language), items: [] },
    ];

    filteredNotifications.forEach((item) => {
      const groupKey = getNotificationTimeGroup(item.updatedAt);
      const targetGroup = groups.find((g) => g.group === groupKey);
      if (targetGroup) {
        targetGroup.items.push(item);
      } else {
        groups[2].items.push(item);
      }
    });

    return groups.filter((g) => g.items.length > 0);
  }, [filteredNotifications, language]);

  const handleItemClick = (item: NotificationItem) => {
    void markAsRead(item.id, item.target?.url);
  };

  const handleToggleRead = (e: React.MouseEvent, item: NotificationItem) => {
    e.stopPropagation();
    void markAsRead(item.id);
  };

  const filterTabsConfig: {
    key: FilterTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }[] = [
    { key: 'all', label: t('notifications.tabs.all'), icon: Bell },
    {
      key: 'unread',
      label: t('notifications.tabs.unread'),
      icon: Inbox,
      count: unreadCount,
    },
    { key: 'reactions', label: t('notifications.tabs.reactions'), icon: Heart },
    { key: 'comments', label: t('notifications.tabs.comments'), icon: MessageCircle },
    { key: 'mentions', label: t('notifications.tabs.mentions'), icon: AtSign },
    { key: 'friends', label: t('notifications.tabs.friends'), icon: UserPlus },
    { key: 'reposts', label: t('notifications.tabs.reposts'), icon: Repeat },
  ];

  const getEmptyMessage = () => {
    switch (activeTab) {
      case 'unread':
        return {
          title: t('notifications.emptyUnread'),
          desc: t('notifications.emptyUnreadDesc'),
          icon: Sparkles,
        };
      case 'reactions':
        return {
          title: t('notifications.emptyReactions'),
          desc: t('notifications.emptyReactionsDesc'),
          icon: Heart,
        };
      case 'comments':
        return {
          title: t('notifications.emptyComments'),
          desc: t('notifications.emptyCommentsDesc'),
          icon: MessageCircle,
        };
      case 'mentions':
        return {
          title: t('notifications.emptyMentions'),
          desc: t('notifications.emptyMentionsDesc'),
          icon: AtSign,
        };
      case 'friends':
        return {
          title: t('notifications.emptyFriends'),
          desc: t('notifications.emptyFriendsDesc'),
          icon: UserPlus,
        };
      case 'reposts':
        return {
          title: t('notifications.emptyReposts'),
          desc: t('notifications.emptyRepostsDesc'),
          icon: Repeat,
        };
      default:
        return {
          title: t('notifications.emptyAll'),
          desc: t('notifications.emptyAllDesc'),
          icon: Bell,
        };
    }
  };

  const emptyInfo = getEmptyMessage();
  const EmptyIcon = emptyInfo.icon;

  return (
    <div className="space-y-4">
      {/* 1. Page Header Card */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-[#004AC6] text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-[#F5F5F5] tracking-tight">
                  {t('notifications.title')}
                </h1>
                {unreadCount > 0 && (
                  <span className="bg-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                    {unreadCount} {t('notifications.tabs.unread').toLowerCase()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title="Làm mới"
              className="p-2.5 text-gray-600 dark:text-[#D4D4D4] hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#2A2A2A] transition cursor-pointer"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`}
              />
            </button>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-[#004AC6] dark:text-[#0095F6] hover:bg-blue-100 dark:hover:bg-blue-900/50 text-xs font-bold transition cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>{t('notifications.markAllRead')}</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 text-gray-600 dark:text-[#D4D4D4] hover:text-gray-900 dark:hover:text-white bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-2xl border border-gray-100 dark:border-[#2A2A2A] transition cursor-pointer"
              title={t('notifications.settings')}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Filter Tabs (Scrollable on small screens) */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1 custom-scrollbar">
          {filterTabsConfig.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold shrink-0 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-md shadow-blue-500/25'
                    : 'bg-gray-50 dark:bg-[#1A1A1A] text-gray-600 dark:text-[#A0A0A0] hover:bg-gray-100 dark:hover:bg-[#262626] border border-gray-100 dark:border-[#2A2A2A]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : ''}`} />
                <span>{tab.label}</span>
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive
                        ? 'bg-white text-[#004AC6]'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Notifications Feed Card */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl p-3 sm:p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#004AC6] dark:text-[#0095F6]" />
            <p className="text-xs font-semibold">{t('common.loading')}</p>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="py-16 px-6 text-center text-gray-400 dark:text-[#737373]">
            <div className="w-16 h-16 rounded-3xl bg-gray-50 dark:bg-[#1A1A1A] flex items-center justify-center mx-auto mb-4 border border-gray-100 dark:border-[#262626]">
              <EmptyIcon className="w-8 h-8 text-gray-300 dark:text-[#525252]" />
            </div>
            <h3 className="text-base font-bold text-gray-800 dark:text-[#E0E0E0] mb-1">
              {emptyInfo.title}
            </h3>
            <p className="text-xs text-gray-400 dark:text-[#737373] max-w-sm mx-auto leading-relaxed">
              {emptyInfo.desc}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedNotifications.map((group) => (
              <div key={group.group} className="space-y-2">
                {/* Group Header */}
                <div className="flex items-center justify-between px-3 pt-1">
                  <h3 className="text-xs font-bold text-gray-400 dark:text-[#737373] uppercase tracking-wider">
                    {group.title}
                  </h3>
                  <span className="text-[11px] text-gray-400 dark:text-[#606060]">
                    {group.items.length} {t('notifications.title').toLowerCase()}
                  </span>
                </div>

                {/* Group Items */}
                <div className="divide-y divide-gray-100 dark:divide-[#1E1E1E]">
                  {group.items.map((item) => (
                    <NotificationItemComponent
                      key={item.id}
                      item={item}
                      onClick={handleItemClick}
                      onToggleRead={handleToggleRead}
                      variant="full"
                    />
                  ))}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {hasMore && (
              <div className="pt-4 text-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="px-6 py-2.5 rounded-2xl bg-[#EFF6FF] dark:bg-blue-950/60 text-[#003A9F] dark:text-[#0095F6] hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition inline-flex items-center gap-2 cursor-pointer shadow-xs"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('common.loading')}</span>
                    </>
                  ) : (
                    <span>{t('notifications.loadMore')}</span>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </div>
  );
};

export default NotificationsPage;
