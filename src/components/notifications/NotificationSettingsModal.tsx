import React, { useState, useEffect } from 'react';
import { X, Bell, Heart, MessageCircle, UserCheck, Loader2 } from 'lucide-react';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface NotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationSettingsModal: React.FC<NotificationSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { settings, updateSettings, fetchSettings } = useNotifications();
  const { t } = useLanguage();

  const [pushEnabled, setPushEnabled] = useState(true);
  const [reactionEnabled, setReactionEnabled] = useState(true);
  const [commentEnabled, setCommentEnabled] = useState(true);
  const [friendEnabled, setFriendEnabled] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      void fetchSettings();
    }
  }, [isOpen, fetchSettings]);

  useEffect(() => {
    if (settings) {
      setPushEnabled(settings.pushEnabled ?? true);
      setReactionEnabled(settings.reactionEnabled ?? true);
      setCommentEnabled(settings.commentEnabled ?? true);
      setFriendEnabled(settings.friendEnabled ?? true);
    }
  }, [settings]);

  if (!isOpen) return null;

  const handleToggle = async (key: 'push' | 'reaction' | 'comment' | 'friend') => {
    setIsSaving(true);
    const newPush = key === 'push' ? !pushEnabled : pushEnabled;
    const newReaction = key === 'reaction' ? !reactionEnabled : reactionEnabled;
    const newComment = key === 'comment' ? !commentEnabled : commentEnabled;
    const newFriend = key === 'friend' ? !friendEnabled : friendEnabled;

    if (key === 'push') setPushEnabled(newPush);
    if (key === 'reaction') setReactionEnabled(newReaction);
    if (key === 'comment') setCommentEnabled(newComment);
    if (key === 'friend') setFriendEnabled(newFriend);

    try {
      await updateSettings({
        pushEnabled: newPush,
        reactionEnabled: newReaction,
        commentEnabled: newComment,
        friendEnabled: newFriend,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#181818] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#2E2E2E] overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5]">
                {t('notifications.settingsTitle')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-[#8E8E8E]">
                {t('notifications.settingsDesc')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:text-[#737373] dark:hover:text-[#D4D4D4] rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Items */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* 1. Push notifications */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-[#202020] border border-gray-100 dark:border-[#2A2A2A]">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 text-[#004AC6] dark:text-[#0095F6] flex items-center justify-center shrink-0">
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">
                  {t('notifications.pushNotifications')}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#8E8E8E] leading-relaxed">
                  {t('notifications.pushNotificationsDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={pushEnabled}
              disabled={isSaving}
              onClick={() => handleToggle('push')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                pushEnabled ? 'bg-[#004AC6] dark:bg-[#0095F6]' : 'bg-gray-200 dark:bg-[#3A3A3A]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  pushEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 2. Reaction notifications */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-[#202020] border border-gray-100 dark:border-[#2A2A2A]">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/50 text-rose-500 flex items-center justify-center shrink-0">
                <Heart className="w-4 h-4 fill-rose-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">
                  {t('notifications.reactionsNotif')}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#8E8E8E] leading-relaxed">
                  {t('notifications.reactionsNotifDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={reactionEnabled}
              disabled={isSaving}
              onClick={() => handleToggle('reaction')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                reactionEnabled ? 'bg-[#004AC6] dark:bg-[#0095F6]' : 'bg-gray-200 dark:bg-[#3A3A3A]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  reactionEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 3. Comment notifications */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-[#202020] border border-gray-100 dark:border-[#2A2A2A]">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-500 flex items-center justify-center shrink-0">
                <MessageCircle className="w-4 h-4 fill-emerald-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">
                  {t('notifications.commentsNotif')}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#8E8E8E] leading-relaxed">
                  {t('notifications.commentsNotifDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={commentEnabled}
              disabled={isSaving}
              onClick={() => handleToggle('comment')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                commentEnabled ? 'bg-[#004AC6] dark:bg-[#0095F6]' : 'bg-gray-200 dark:bg-[#3A3A3A]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  commentEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 4. Friend / Follow notifications */}
          <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-gray-50/70 dark:bg-[#202020] border border-gray-100 dark:border-[#2A2A2A]">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/50 text-indigo-500 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-[#F5F5F5]">
                  {t('notifications.friendsNotif')}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#8E8E8E] leading-relaxed">
                  {t('notifications.friendsNotifDesc')}
                </p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={friendEnabled}
              disabled={isSaving}
              onClick={() => handleToggle('friend')}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                friendEnabled ? 'bg-[#004AC6] dark:bg-[#0095F6]' : 'bg-gray-200 dark:bg-[#3A3A3A]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  friendEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50/80 dark:bg-[#1F1F1F] border-t border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#8E8E8E]">
            {isSaving && (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
                <span>Đang đồng bộ...</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#004AC6] dark:bg-[#0095F6] text-white text-xs font-semibold hover:opacity-95 transition cursor-pointer"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
};
