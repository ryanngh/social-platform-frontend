import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Search, Check, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { userService } from '../../services/userService';
import { searchService } from '../../services/searchService';
import UserAvatar from '../common/UserAvatar';
import type { UserSummary } from '../../types';
import clsx from 'clsx';

interface NewConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewConversationModal: React.FC<NewConversationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();
  const { startOrOpenDM, createGroup } = useChat();

  const [activeTab, setActiveTab] = useState<'dm' | 'group'>('dm');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupTitle, setGroupTitle] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [contacts, setContacts] = useState<UserSummary[]>([]);
  const [isLoadingContacts, setIsLoadingContacts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load following / suggested users on mount/open
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const loadInitialUsers = async () => {
      setIsLoadingContacts(true);
      try {
        const results: UserSummary[] = [];

        // 1. Fetch user's following list
        if (user?.id) {
          try {
            const followingRes = await userService.getFollowing(user.id, { page: 0, size: 50 });
            if (followingRes?.content) {
              const mappedFollowing: UserSummary[] = followingRes.content
                .filter((u: any) => (u.id || u.userId) !== user.id)
                .map((u: any) => ({
                  id: u.id || u.userId,
                  username: u.username || 'user',
                  firstName: u.firstName,
                  lastName: u.lastName,
                  fullName: u.fullName,
                  avatarUrl: u.avatarUrl,
                }));
              results.push(...mappedFollowing);
            }
          } catch (e) {
            console.warn('Could not load following users:', e);
          }
        }

        if (isMounted) {
          setContacts(results);
        }
      } finally {
        if (isMounted) {
          setIsLoadingContacts(false);
        }
      }
    };

    void loadInitialUsers();

    return () => {
      isMounted = false;
    };
  }, [isOpen, user?.id]);

  // Live search debounced
  useEffect(() => {
    if (!searchQuery.trim() || !isOpen) return;

    let isMounted = true;
    const delayTimer = setTimeout(async () => {
      try {
        const searchRes = await searchService.searchUsersPaged(searchQuery.trim(), 0, 20);
        if (isMounted && searchRes?.content) {
          const mapped: UserSummary[] = searchRes.content
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
            mapped.forEach((item) => map.set(item.id, item));
            prev.forEach((item) => {
              if (!map.has(item.id)) map.set(item.id, item);
            });
            return Array.from(map.values());
          });
        }
      } catch (err) {
        console.warn('Search users failed:', err);
      }
    }, 300);

    return () => {
      isMounted = false;
      clearTimeout(delayTimer);
    };
  }, [searchQuery, isOpen, user?.id]);

  // Filtered contacts based on query
  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase().trim();
    return contacts.filter((c) => {
      const fullName = `${c.firstName || ''} ${c.lastName || ''}`.toLowerCase();
      const username = (c.username || '').toLowerCase();
      return fullName.includes(q) || username.includes(q);
    });
  }, [contacts, searchQuery]);

  if (!isOpen) return null;

  const handleStartDM = async (contact: UserSummary) => {
    const targetId = contact.id || (contact as any).userId;
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      const convId = await startOrOpenDM(targetId, contact);
      onClose();
      if (convId) {
        navigate(`/messages/${convId}`);
      }
    } catch {
      // Error handled in ChatContext toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleMember = (userId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleCreateGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupTitle.trim() || selectedMemberIds.length === 0) return;

    setIsSubmitting(true);
    try {
      const convId = await createGroup(groupTitle.trim(), selectedMemberIds);
      onClose();
      if (convId) {
        navigate(`/messages/${convId}`);
      }
    } catch {
      // Error handled in ChatContext
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] rounded-t-3xl sm:rounded-3xl max-w-md w-full max-h-[90dvh] sm:max-h-[85vh] border-t sm:border border-gray-100 dark:border-[#262626] shadow-2xl overflow-hidden animate-scaleIn transition-colors flex flex-col pb-safe sm:pb-0"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-gray-100 dark:border-[#262626] flex items-center justify-between flex-shrink-0">
          <h3 className="font-bold text-base text-gray-900 dark:text-[#F5F5F5]">
            {t('messages.newMessageModalTitle')}
          </h3>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-100 dark:border-[#262626] text-xs font-bold flex-shrink-0">
          <button
            onClick={() => setActiveTab('dm')}
            className={clsx(
              'flex-1 py-3 flex items-center justify-center border-b-2 cursor-pointer transition min-h-[44px]',
              activeTab === 'dm'
                ? 'border-[#0084FF] text-[#0084FF] dark:border-[#3797F0] dark:text-[#3797F0] bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-[#F5F5F5]'
            )}
          >
            <span>{t('messages.dmTab')}</span>
          </button>

          <button
            onClick={() => setActiveTab('group')}
            className={clsx(
              'flex-1 py-3 flex items-center justify-center border-b-2 cursor-pointer transition min-h-[44px]',
              activeTab === 'group'
                ? 'border-[#0084FF] text-[#0084FF] dark:border-[#3797F0] dark:text-[#3797F0] bg-blue-50/50 dark:bg-blue-950/20'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-[#F5F5F5]'
            )}
          >
            <span>{t('messages.groupTab')}</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 space-y-3">
          {activeTab === 'group' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-700 dark:text-[#D4D4D4]">
                {t('messages.groupName')}
              </label>
              <input
                type="text"
                value={groupTitle}
                onChange={(e) => setGroupTitle(e.target.value)}
                placeholder={t('messages.groupNamePlaceholder')}
                className="w-full px-3.5 py-2.5 bg-gray-100/90 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#0084FF] dark:focus:ring-[#3797F0] transition"
              />
            </div>
          )}

          {/* Search bar */}
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

          {/* Contact List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-bold text-gray-400 dark:text-[#737373] uppercase">
                {activeTab === 'dm'
                  ? t('messages.selectRecipient')
                  : `${t('messages.addMember')} (${selectedMemberIds.length})`}
              </p>
              {isLoadingContacts && <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />}
            </div>

            <div className="space-y-1 max-h-60 overflow-y-auto custom-scrollbar">
              {filteredContacts.length === 0 ? (
                <div className="text-center py-8 text-xs text-gray-400">
                  {isLoadingContacts ? (
                    <p>{t('messages.loadingMessages')}</p>
                  ) : (
                    <p>{t('messages.noFilteredConversationsDesc')}</p>
                  )}
                </div>
              ) : (
                filteredContacts.map((contact) => {
                  const isSelected = selectedMemberIds.includes(contact.id);
                  const displayName =
                    [contact.firstName, contact.lastName].filter(Boolean).join(' ') ||
                    contact.username ||
                    'User';

                  return (
                    <div
                      key={contact.id}
                      onClick={() => {
                        if (activeTab === 'dm') {
                          void handleStartDM(contact);
                        } else {
                          handleToggleMember(contact.id);
                        }
                      }}
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
                          <p className="text-[11px] text-gray-400 truncate">@{contact.username}</p>
                        </div>
                      </div>

                      {activeTab === 'group' && (
                        <div
                          className={clsx(
                            'w-5 h-5 rounded-lg border flex items-center justify-center transition shrink-0',
                            isSelected
                              ? 'bg-[#0084FF] dark:bg-[#3797F0] border-transparent text-white'
                              : 'border-gray-300 dark:border-[#363636] bg-white dark:bg-[#262626]'
                          )}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer (for Group) */}
        {activeTab === 'group' && (
          <div className="p-4 border-t border-gray-100 dark:border-[#262626] flex items-center justify-end gap-2 bg-gray-50/50 dark:bg-[#151515]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-2xl text-xs font-semibold text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-200 dark:hover:bg-[#262626] cursor-pointer transition"
            >
              {t('messages.cancel')}
            </button>
            <button
              type="button"
              onClick={handleCreateGroupSubmit}
              disabled={!groupTitle.trim() || selectedMemberIds.length === 0 || isSubmitting}
              className="px-5 py-2 rounded-2xl bg-[#0084FF] dark:bg-[#3797F0] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50 cursor-pointer transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{t('messages.creatingGroup')}</span>
                </>
              ) : (
                <span>{t('messages.createGroupBtn', { count: selectedMemberIds.length })}</span>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NewConversationModal;
