import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCheck, Settings, Bell, ArrowRight, Loader2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { NotificationItemComponent } from './NotificationItemComponent';
import { NotificationSettingsModal } from './NotificationSettingsModal';
import type { NotificationItem } from '../../types';

interface NotificationPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    notifications,
    unreadCount,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const popupRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popupRef.current &&
        !popupRef.current.contains(event.target as Node) &&
        !showSettingsModal
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, showSettingsModal]);

  if (!isOpen) return null;

  const displayedItems =
    activeTab === 'all'
      ? notifications
      : notifications.filter((item) => !item.isRead);

  const handleItemClick = (item: NotificationItem) => {
    onClose();
    void markAsRead(item.id, item.target?.url);
  };

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <>
      <div
        ref={popupRef}
        className="absolute right-0 top-12 sm:top-14 w-[380px] sm:w-[420px] max-w-[calc(100vw-1.5rem)] bg-white dark:bg-[#181818] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#2E2E2E] z-50 overflow-hidden flex flex-col max-h-[620px] animate-fadeIn"
      >
        {/* 1. Header */}
        <div className="px-5 pt-4 pb-3 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-black text-gray-900 dark:text-[#F5F5F5] tracking-tight">
              {t('notifications.title')}
            </h2>
            {unreadCount > 0 && (
              <span className="bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] font-bold px-2.5 py-0.5 rounded-full text-xs">
                {unreadCount} {t('notifications.tabs.unread').toLowerCase()}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={markAllAsRead}
              title={t('notifications.markAllRead')}
              className="p-1.5 text-gray-500 hover:text-[#004AC6] dark:text-[#A0A0A0] dark:hover:text-[#0095F6] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
            >
              <CheckCheck className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              title={t('notifications.settings')}
              className="p-1.5 text-gray-500 hover:text-[#004AC6] dark:text-[#A0A0A0] dark:hover:text-[#0095F6] hover:bg-gray-100 dark:hover:bg-[#262626] rounded-full transition cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Tabs & Quick Action */}
        <div className="px-5 py-2.5 bg-gray-50/70 dark:bg-[#1E1E1E] flex items-center justify-between border-b border-gray-100 dark:border-[#262626]">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-[#2D2D2D] text-[#004AC6] dark:text-[#0095F6] shadow-xs'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('notifications.tabs.all')}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'unread'
                  ? 'bg-white dark:bg-[#2D2D2D] text-[#004AC6] dark:text-[#0095F6] shadow-xs'
                  : 'text-gray-500 dark:text-[#A0A0A0] hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('notifications.tabs.unread')}
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-[#004AC6] dark:bg-[#0095F6]" />
              )}
            </button>
          </div>

          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllAsRead}
              className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer"
            >
              {t('notifications.markAsReadAction')}
            </button>
          )}
        </div>

        {/* 3. Notification List */}
        <div className="overflow-y-auto flex-1 divide-y divide-gray-100 dark:divide-[#242424] custom-scrollbar max-h-[420px]">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
              <span className="text-xs">{t('common.loading')}</span>
            </div>
          ) : displayedItems.length === 0 ? (
            <div className="py-12 px-6 text-center text-gray-400 dark:text-[#737373]">
              <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-[#242424] flex items-center justify-center mx-auto mb-3">
                <Bell className="w-6 h-6 text-gray-300 dark:text-[#525252]" />
              </div>
              <p className="text-xs font-semibold text-gray-600 dark:text-[#A0A0A0]">
                {activeTab === 'unread'
                  ? t('notifications.emptyUnread')
                  : t('notifications.emptyAll')}
              </p>
              <p className="text-[11px] text-gray-400 dark:text-[#666666] mt-1 max-w-xs mx-auto">
                {activeTab === 'unread'
                  ? t('notifications.emptyUnreadDesc')
                  : t('notifications.emptyAllDesc')}
              </p>
            </div>
          ) : (
            displayedItems.map((item) => (
              <NotificationItemComponent
                key={item.id}
                item={item}
                onClick={handleItemClick}
                variant="popup"
              />
            ))
          )}

          {/* Load more button */}
          {hasMore && displayedItems.length > 0 && (
            <div className="p-2 text-center bg-gray-50/50 dark:bg-[#1A1A1A]">
              <button
                type="button"
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full py-2 text-xs font-bold text-[#004AC6] dark:text-[#0095F6] hover:bg-white dark:hover:bg-[#242424] rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{t('common.loading')}</span>
                  </>
                ) : (
                  <span>{t('notifications.loadMore')}</span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 4. Footer */}
        <div className="p-3 bg-gray-50/80 dark:bg-[#1A1A1A] border-t border-gray-100 dark:border-[#262626] text-center">
          <button
            type="button"
            onClick={handleViewAll}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer"
          >
            <span>{t('notifications.viewAll')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      <NotificationSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />
    </>
  );
};
