import React, { useState, useEffect, useMemo } from 'react';
import { X, Search, Check, Loader2, UserPlus } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { userService } from '../../services/userService';
import { searchService } from '../../services/searchService';
import UserAvatar from '../common/UserAvatar';
import type { UserSummary } from '../../types';
import clsx from 'clsx';

interface AddGroupMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGroupMemberModal: React.FC<AddGroupMemberModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const { activeConversation, addMemberToGroup } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<'MEMBER' | 'ADMIN'>('MEMBER');
  const [contacts, setContacts] = useState<UserSummary[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load user's following list on open
  useEffect(() => {
    if (!isOpen || !user?.id) return;

    let isMounted = true;
    const loadFollowing = async () => {
      setIsLoadingContacts(true);
      try {
        const followingRes = await userService.getFollowing(user.id, { page: 0, size: 50 });
        if (followingRes?.content && isMounted) {
          const list: UserSummary[] = followingRes.content
            .filter((u: any) => (u.id || u.userId) !== user.id)
            .map((u: any) => ({
              id: u.id || u.userId,
              username: u.username || 'user',
              firstName: u.firstName,
              lastName: u.lastName,
              fullName: u.fullName,
              avatarUrl: u.avatarUrl,
            }));
          setContacts(list);
        }
      } catch (err) {
        console.warn('Could not load following for adding to group:', err);
      } finally {
        if (isMounted) setIsLoadingContacts(false);
      }
    };

    void loadFollowing();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.id]);

  // Live search users
  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) return;

    let isMounted = true;
    const timer = setTimeout(async () => {
      try {
        const searchRes = await searchService.searchUsersPaged(searchQuery.trim(), 0, 20);
        if (isMounted && searchRes?.content) {
          const list: UserSummary[] = searchRes.content
            .filter((u: any) => (u.userId || u.id) !== user?.id)
            .map((u: any) => ({
              id: u.userId || u.id,
              username: u.username || 'user',
              firstName: u.firstName,
              lastName: u.lastName,
              fullName: u.fullName,
              avatarUrl: u.avatarUrl,
            }));

          setContacts((prev) => {
            const map = new Map<string, UserSummary>();
            list.forEach((item) => map.set(item.id, item));
            prev.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Search users for group failed:', err);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isOpen, user?.id]);

  // Filter contacts not already in the group
  const availableContacts = useMemo(() => {
    const existingMemberIds = new Set(activeConversation?.members?.map((m) => m.userId) || []);
    return contacts.filter((c) => {
      if (existingMemberIds.has(c.id)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
        const username = (c.username || '').toLowerCase();
        return fullName.includes(q) || username.includes(q);
      }
      return true;
    });
  }, [activeConversation?.members, contacts, searchQuery]);

  if (!isOpen) return null;

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;

    setIsSubmitting(true);
    try {
      await addMemberToGroup(selectedUserId, selectedRole);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] rounded-3xl max-w-md w-full border border-gray-100 dark:border-[#262626] shadow-2xl overflow-hidden animate-scaleIn transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[#0084FF] dark:text-[#3797F0]" />
            <h3 className="font-bold text-base text-gray-900 dark:text-[#F5F5F5]">
              {t('messages.addMemberTitle')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleAddSubmit} className="p-4 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('messages.addMemberSearchPlaceholder')}
              className="w-full pl-9 pr-4 py-2 bg-gray-100/90 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#0084FF] dark:focus:ring-[#3797F0] transition"
            />
          </div>

          {/* Role selector */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="font-semibold text-gray-700 dark:text-[#D4D4D4]">{t('messages.role')}:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole('MEMBER')}
                className={clsx(
                  'px-3 py-1 rounded-xl font-semibold transition cursor-pointer',
                  selectedRole === 'MEMBER'
                    ? 'bg-[#0084FF] dark:bg-[#3797F0] text-white'
                    : 'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-[#A8A8A8]'
                )}
              >
                {t('messages.roleMember')}
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('ADMIN')}
                className={clsx(
                  'px-3 py-1 rounded-xl font-semibold transition cursor-pointer',
                  selectedRole === 'ADMIN'
                    ? 'bg-[#0084FF] dark:bg-[#3797F0] text-white'
                    : 'bg-gray-100 dark:bg-[#262626] text-gray-600 dark:text-[#A8A8A8]'
                )}
              >
                {t('messages.roleAdmin')}
              </button>
            </div>
          </div>

          {/* List */}
          <div className="space-y-1 max-h-56 overflow-y-auto custom-scrollbar">
            {isLoadingContacts ? (
              <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#0084FF]" />
                <span>{t('messages.loadingMessages')}</span>
              </div>
            ) : availableContacts.length === 0 ? (
              <p className="text-center py-6 text-xs text-gray-400">
                {t('messages.allMembersInGroup')}
              </p>
            ) : (
              availableContacts.map((contact) => {
                const isSelected = selectedUserId === contact.id;
                const displayName =
                  [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
                  contact.username ||
                  'User';

                return (
                  <div
                    key={contact.id}
                    onClick={() => setSelectedUserId(contact.id)}
                    className={clsx(
                      'flex items-center justify-between p-2 rounded-2xl cursor-pointer transition',
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60'
                        : 'hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <UserAvatar
                        userId={contact.id}
                        src={contact.avatarUrl}
                        alt={displayName}
                        size="md"
                        className="w-10 h-10"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] truncate">
                          {displayName}
                        </p>
                        <p className="text-[12px] text-gray-400 truncate">@{contact.username}</p>
                      </div>
                    </div>

                    <div
                      className={clsx(
                        'w-5 h-5 rounded-full border flex items-center justify-center transition shrink-0',
                        isSelected
                          ? 'bg-[#0084FF] dark:bg-[#3797F0] border-transparent text-white'
                          : 'border-gray-300 dark:border-[#363636] bg-white dark:bg-[#262626]'
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-[#262626]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#262626] cursor-pointer"
            >
              {t('messages.cancel')}
            </button>
            <button
              type="submit"
              disabled={!selectedUserId || isSubmitting}
              className="px-5 py-2 rounded-2xl bg-[#0084FF] dark:bg-[#3797F0] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{t('messages.addMemberSubmit')}</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddGroupMemberModal;
