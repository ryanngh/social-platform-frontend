import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Bookmark,
  FolderPlus,
  Search,
  Folder,
  FileText,
  Image as ImageIcon,
  ShoppingBag,
  ExternalLink,
  Share2,
  X,
  Compass,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  INITIAL_SAVED_COLLECTIONS,
  INITIAL_SAVED_ITEMS,
  type SavedItem,
  type SavedCollection,
  type SavedItemType,
} from '../mocks/savedData';
import { getMediaUrl } from '../utils/media';
import clsx from 'clsx';
import { FeatureUnavailableOverlay } from '../components/common/FeatureUnavailableOverlay';

export const SavedPage: React.FC = () => {
  const { t } = useLanguage();

  const [items, setItems] = useState<SavedItem[]>(INITIAL_SAVED_ITEMS);
  const [collections, setCollections] = useState<SavedCollection[]>(INITIAL_SAVED_COLLECTIONS);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string>('col-all');
  const [selectedType, setSelectedType] = useState<SavedItemType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [selectedColor, setSelectedColor] = useState('bg-purple-500');

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Collection filter
      if (selectedCollectionId !== 'col-all' && item.collectionId !== selectedCollectionId) {
        return false;
      }

      // Type filter
      if (selectedType !== 'ALL' && item.type !== selectedType) {
        return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchExcerpt = item.excerpt.toLowerCase().includes(q);
        const matchAuthor = item.author.name.toLowerCase().includes(q);
        if (!matchTitle && !matchExcerpt && !matchAuthor) return false;
      }

      return true;
    });
  }, [items, selectedCollectionId, selectedType, searchQuery]);

  // Unsave item
  const handleUnsaveItem = (itemId: string) => {
    setItems((prev) => prev.filter((it) => it.id !== itemId));
    toast.success(t('saved.unsaveToast'));
  };

  // Create new collection
  const handleCreateCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCollectionName.trim()) return;

    const newCol: SavedCollection = {
      id: `col-${Date.now()}`,
      name: newCollectionName.trim(),
      itemCount: 0,
      color: selectedColor,
      isPrivate: true,
    };

    setCollections([...collections, newCol]);
    setNewCollectionName('');
    setShowCreateModal(false);
    toast.success(`Đã tạo bộ sưu tập "${newCol.name}" thành công!`);
  };

  // Render Type Badge
  const renderTypeBadge = (type: SavedItemType) => {
    switch (type) {
      case 'POST':
        return (
          <span className="bg-blue-100 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <FileText className="w-3 h-3" />
            Bài viết
          </span>
        );
      case 'MEDIA':
        return (
          <span className="bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ImageIcon className="w-3 h-3" />
            Ảnh & Video
          </span>
        );
      case 'MARKETPLACE':
        return (
          <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ShoppingBag className="w-3 h-3" />
            Chợ mua bán
          </span>
        );
      case 'LINK':
      default:
        return (
          <span className="bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            Liên kết
          </span>
        );
    }
  };

  return (
    <FeatureUnavailableOverlay
      icon={<Bookmark className="w-8 h-8 sm:w-10 sm:h-10 text-[#004AC6] dark:text-[#0095F6] fill-current animate-pulse" />}
    >
      <div className="space-y-5 pb-8">
      {/* 1. Header Card */}
      <div className="bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-2xs transition-colors duration-200">
        <div className="flex items-center justify-between gap-3 mb-3.5">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-[#004AC6] to-[#0095F6] text-white flex items-center justify-center shadow-xs shrink-0">
              <Bookmark className="w-4 h-4 sm:w-5 sm:h-5 fill-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                {t('saved.title')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-[#A8A8A8] hidden sm:block">
                {t('saved.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2.5 bg-[#EFF6FF] dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-xl sm:rounded-2xl text-xs font-bold transition cursor-pointer active:scale-95 shrink-0"
          >
            <FolderPlus className="w-4 h-4" />
            <span>{t('saved.newCollection')}</span>
          </button>
        </div>

        {/* Search saved items */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trong mục đã lưu..."
            className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-xl sm:rounded-2xl text-xs sm:text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6] transition"
          />
        </div>
      </div>

      {/* 2. Collections Horizontal Pills */}
      <section className="bg-white dark:bg-[#121212] rounded-2xl sm:rounded-3xl p-3.5 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-2xs">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider">
            {t('saved.collections')} ({collections.length})
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {collections.map((col) => {
            const isSelected = selectedCollectionId === col.id;
            return (
              <div
                key={col.id}
                onClick={() => setSelectedCollectionId(col.id)}
                className={clsx(
                  'p-3 rounded-2xl border transition cursor-pointer flex items-center gap-3',
                  isSelected
                    ? 'border-[#004AC6] dark:border-[#0095F6] bg-blue-50/60 dark:bg-blue-950/40 shadow-xs'
                    : 'border-gray-100 dark:border-[#262626] bg-gray-50/60 dark:bg-[#1A1A1A] hover:bg-white dark:hover:bg-[#202020]'
                )}
              >
                <div
                  className={clsx(
                    'w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs',
                    col.color
                  )}
                >
                  <Folder className="w-4 h-4 fill-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3
                    className={clsx(
                      'text-xs font-bold truncate',
                      isSelected ? 'text-[#004AC6] dark:text-[#0095F6]' : 'text-gray-900 dark:text-[#F5F5F5]'
                    )}
                  >
                    {col.name}
                  </h3>
                  <p className="text-[10px] text-gray-400">
                    {col.id === 'col-all' ? `${items.length} mục` : `${col.itemCount} mục`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3. Type Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-semibold">
        {(
          [
            { key: 'ALL', label: t('saved.types.all') },
            { key: 'POST', label: t('saved.types.posts') },
            { key: 'MEDIA', label: t('saved.types.media') },
            { key: 'MARKETPLACE', label: t('saved.types.marketplace') },
            { key: 'LINK', label: t('saved.types.links') },
          ] as const
        ).map((tab) => {
          const isActive = selectedType === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setSelectedType(tab.key)}
              className={clsx(
                'px-4 py-2 rounded-2xl whitespace-nowrap transition cursor-pointer border shadow-xs',
                isActive
                  ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white border-transparent'
                  : 'bg-white dark:bg-[#121212] text-gray-700 dark:text-[#D4D4D4] border-gray-200/70 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              )}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 4. Saved Items List */}
      <div className="space-y-3.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white dark:bg-[#121212] rounded-3xl p-10 border border-gray-100 dark:border-[#262626] text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 flex items-center justify-center mx-auto mb-3">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base mb-1">
              {t('saved.noSavedItems')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-sm mx-auto mb-4">
              {t('saved.noSavedItemsDesc')}
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-2xl text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>{t('saved.exploreRySocial')}</span>
            </Link>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-xs hover:shadow-md transition flex flex-col sm:flex-row gap-4 justify-between"
            >
              {/* Left Info */}
              <div className="flex-1 space-y-2.5">
                {/* Author & Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img
                      src={item.author.avatarUrl}
                      alt={item.author.name}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                        {item.author.name}
                      </h4>
                      <span className="text-[11px] text-gray-400">@{item.author.username}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {renderTypeBadge(item.type)}
                    <span className="text-[10px] text-gray-400 font-medium">
                      {t('saved.savedOn', { date: item.savedAt })}
                    </span>
                  </div>
                </div>

                {/* Title & Excerpt */}
                <div>
                  <h3 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5] mb-1 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-[#A8A8A8] line-clamp-2 leading-relaxed">
                    {item.excerpt}
                  </p>
                  {item.price && (
                    <p className="text-sm font-black text-[#004AC6] dark:text-[#0095F6] mt-1">
                      {item.price}
                    </p>
                  )}
                </div>

                {/* Collection Tag & Actions */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-2 text-xs border-t border-gray-100 dark:border-[#262626]">
                  <span className="text-[11px] text-gray-500 dark:text-[#737373] flex items-center gap-1 font-medium">
                    <Folder className="w-3.5 h-3.5 text-gray-400" />
                    {item.collectionName}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        void navigator.clipboard?.writeText(window.location.href);
                        toast.success(t('saved.share'));
                      }}
                      className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition"
                      title="Chia sẻ"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleUnsaveItem(item.id)}
                      className="px-3 py-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 font-semibold transition cursor-pointer text-xs flex items-center gap-1"
                    >
                      <Bookmark className="w-3.5 h-3.5 fill-current" />
                      <span>{t('saved.unsave')}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right Media Thumbnail if available */}
              {item.mediaUrl && (
                <div className="w-full sm:w-36 h-28 sm:h-auto rounded-2xl overflow-hidden bg-gray-100 dark:bg-[#1A1A1A] shrink-0">
                  <img
                    src={getMediaUrl(item.mediaUrl)}
                    alt={item.title}
                    className="w-full h-full object-cover hover:scale-105 transition duration-300"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* 5. Create Collection Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-sm w-full p-5 border border-gray-100 dark:border-[#262626] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
              <h3 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5]">
                {t('saved.newCollectionModalTitle')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1.5">
                  Tên bộ sưu tập *
                </label>
                <input
                  type="text"
                  required
                  value={newCollectionName}
                  onChange={(e) => setNewCollectionName(e.target.value)}
                  placeholder={t('saved.collectionNamePlaceholder')}
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6]"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1.5">
                  Màu sắc
                </label>
                <div className="flex items-center gap-2">
                  {['bg-purple-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500'].map(
                    (col) => (
                      <button
                        key={col}
                        type="button"
                        onClick={() => setSelectedColor(col)}
                        className={clsx(
                          'w-7 h-7 rounded-full transition cursor-pointer border-2',
                          col,
                          selectedColor === col ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'
                        )}
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newCollectionName.trim()}
                  className="px-4 py-2 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl font-bold hover:opacity-90 disabled:opacity-50"
                >
                  {t('saved.createCollection')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </FeatureUnavailableOverlay>
  );
};

export default SavedPage;
