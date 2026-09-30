import React, { useState, useMemo } from 'react';
import {
  Search,
  Compass,
  Heart,
  MessageCircle,
  Share2,
  Bookmark,
  Play,
  Layers,
  X,
  Send,
  UserCheck,
  UserPlus,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  INITIAL_EXPLORE_ITEMS,
  INITIAL_FEATURED_CREATORS,
  INITIAL_TRENDING_TOPICS,
  type ExploreItem,
  type FeaturedCreator,
} from '../mocks/exploreData';
import clsx from 'clsx';

type CategoryFilter = 'all' | 'tech' | 'design' | 'photography' | 'gaming' | 'lifestyle' | 'travel' | 'food';
type MediaFilter = 'all' | 'photos' | 'videos' | 'carousel';

export const ExplorePage: React.FC = () => {
  const { t } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>('all');
  const [selectedMediaFilter, setSelectedMediaFilter] = useState<MediaFilter>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const [items, setItems] = useState<ExploreItem[]>(INITIAL_EXPLORE_ITEMS);
  const [creators, setCreators] = useState<FeaturedCreator[]>(INITIAL_FEATURED_CREATORS);
  const [activeModalItem, setActiveModalItem] = useState<ExploreItem | null>(null);
  const [commentInput, setCommentInput] = useState('');

  // Category list
  const categories: { key: CategoryFilter; label: string; icon: string }[] = [
    { key: 'all', label: t('explore.categories.all'), icon: '✨' },
    { key: 'tech', label: t('explore.categories.tech'), icon: '💻' },
    { key: 'design', label: t('explore.categories.design'), icon: '🎨' },
    { key: 'photography', label: t('explore.categories.photography'), icon: '📸' },
    { key: 'gaming', label: t('explore.categories.gaming'), icon: '🎮' },
    { key: 'travel', label: t('explore.categories.travel'), icon: '✈️' },
    { key: 'lifestyle', label: t('explore.categories.lifestyle'), icon: '☕' },
    { key: 'food', label: t('explore.categories.food'), icon: '🍜' },
  ];

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(query);
        const matchCaption = item.caption.toLowerCase().includes(query);
        const matchAuthor = item.author.name.toLowerCase().includes(query) || item.author.username.toLowerCase().includes(query);
        const matchTags = item.tags.some((tag) => tag.toLowerCase().includes(query));
        if (!matchTitle && !matchCaption && !matchAuthor && !matchTags) return false;
      }

      // Tag filter
      if (selectedTag && !item.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase())) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }

      // Media filter
      if (selectedMediaFilter === 'photos' && item.mediaType !== 'IMAGE') return false;
      if (selectedMediaFilter === 'videos' && item.mediaType !== 'VIDEO') return false;
      if (selectedMediaFilter === 'carousel' && item.mediaType !== 'CAROUSEL') return false;

      return true;
    });
  }, [items, searchQuery, selectedTag, selectedCategory, selectedMediaFilter]);

  // Handle follow toggle
  const handleToggleFollow = (creatorId: string) => {
    setCreators((prev) =>
      prev.map((c) => {
        if (c.id === creatorId) {
          const nextState = !c.isFollowing;
          toast.success(nextState ? `Đã theo dõi @${c.username}` : `Đã hủy theo dõi @${c.username}`);
          return { ...c, isFollowing: nextState };
        }
        return c;
      })
    );
  };

  // Handle like post
  const handleToggleLike = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const isLiked = !it.isLiked;
          const likesCount = isLiked ? it.likesCount + 1 : Math.max(0, it.likesCount - 1);
          return { ...it, isLiked, likesCount };
        }
        return it;
      })
    );

    if (activeModalItem?.id === itemId) {
      setActiveModalItem((prev) => {
        if (!prev) return null;
        const isLiked = !prev.isLiked;
        return {
          ...prev,
          isLiked,
          likesCount: isLiked ? prev.likesCount + 1 : Math.max(0, prev.likesCount - 1),
        };
      });
    }
  };

  // Handle save post
  const handleToggleSave = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const isSaved = !it.isSaved;
          toast.success(isSaved ? t('feed.savedToast', { defaultValue: 'Đã lưu bài viết vào mục Đã lưu' }) : t('feed.unsavedToast', { defaultValue: 'Đã bỏ lưu bài viết' }));
          return { ...it, isSaved };
        }
        return it;
      })
    );

    if (activeModalItem?.id === itemId) {
      setActiveModalItem((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    }
  };

  // Handle send comment
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !activeModalItem) return;

    const newComment = {
      id: `c-${Date.now()}`,
      author: {
        name: 'Bạn',
        username: 'me',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      },
      content: commentInput.trim(),
      time: 'Vừa xong',
    };

    const updatedComments = [newComment, ...activeModalItem.comments];
    const updatedCount = activeModalItem.commentsCount + 1;

    setActiveModalItem({
      ...activeModalItem,
      comments: updatedComments,
      commentsCount: updatedCount,
    });

    setItems((prev) =>
      prev.map((it) =>
        it.id === activeModalItem.id
          ? { ...it, comments: updatedComments, commentsCount: updatedCount }
          : it
      )
    );

    setCommentInput('');
    toast.success('Đã đăng bình luận');
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header Search & Discovery Bar */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#004AC6] to-[#0095F6] flex items-center justify-center text-white shadow-sm shadow-blue-500/20 shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
              {t('explore.title')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">
              Khám phá xu hướng, hình ảnh, video và cộng đồng sáng tạo trên RySocial
            </p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="relative mb-4">
          <Search className="w-4 h-4 text-gray-400 dark:text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('explore.searchPlaceholder')}
            className="w-full pl-10 pr-10 py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-sm text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] focus:bg-white dark:focus:bg-[#000000] focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:ring-1 focus:ring-[#004AC6] outline-none transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition rounded-full"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Trending Tags Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          <span className="text-gray-400 dark:text-[#737373] font-medium flex items-center gap-1 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
            Hot:
          </span>
          {INITIAL_TRENDING_TOPICS.map((topic) => {
            const isSelected = selectedTag === topic.tag;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTag(isSelected ? null : topic.tag)}
                className={clsx(
                  'px-3 py-1 rounded-full whitespace-nowrap font-medium transition cursor-pointer flex items-center gap-1',
                  isSelected
                    ? 'bg-[#004AC6] text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-[#1E1E1E] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-200 dark:hover:bg-[#2A2A2A]'
                )}
              >
                <span>{topic.tag}</span>
                <span className="text-[10px] opacity-70">({topic.postsCount})</span>
              </button>
            );
          })}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-[11px] text-rose-500 hover:underline shrink-0 font-medium ml-1 cursor-pointer"
            >
              Xóa bộ lọc tag
            </button>
          )}
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => {
          const isActive = selectedCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={clsx(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition cursor-pointer border shadow-xs',
                isActive
                  ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white border-transparent shadow-blue-500/20'
                  : 'bg-white dark:bg-[#121212] text-gray-700 dark:text-[#D4D4D4] border-gray-200/80 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Featured Creators Carousel */}
      <section className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm transition-colors duration-200">
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h2 className="text-sm font-bold text-gray-900 dark:text-[#F5F5F5]">
              {t('explore.featuredCreators')}
            </h2>
          </div>
          <span className="text-xs text-gray-400 dark:text-[#737373]">Được gợi ý theo sở thích</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {creators.map((creator) => (
            <div
              key={creator.id}
              className="group relative bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#262626] rounded-2xl p-3 flex flex-col items-center text-center transition hover:shadow-md hover:border-gray-200 dark:hover:border-[#363636]"
            >
              <div className="relative mb-2">
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-[#262626] shadow-xs group-hover:scale-105 transition"
                />
                {creator.isVerified && (
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-[#0095F6] text-white rounded-full flex items-center justify-center text-[9px] border-2 border-white dark:border-[#121212]">
                    ✓
                  </span>
                )}
              </div>
              <h3 className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5] truncate w-full">
                {creator.name}
              </h3>
              <p className="text-[11px] text-gray-400 dark:text-[#737373] truncate w-full mb-1">
                @{creator.username}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-[#A8A8A8] line-clamp-1 mb-2.5 px-1">
                {creator.role}
              </p>

              <button
                onClick={() => handleToggleFollow(creator.id)}
                className={clsx(
                  'w-full py-1.5 px-2 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition cursor-pointer',
                  creator.isFollowing
                    ? 'bg-gray-200 dark:bg-[#2A2A2A] text-gray-700 dark:text-[#D4D4D4] hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400'
                    : 'bg-[#004AC6] dark:bg-[#0095F6] text-white hover:opacity-90 shadow-xs'
                )}
              >
                {creator.isFollowing ? (
                  <>
                    <UserCheck className="w-3 h-3" />
                    <span>{t('explore.following')}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3 h-3" />
                    <span>{t('explore.follow')}</span>
                  </>
                )}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Media Filter Tabs */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-[#1A1A1A] p-1 rounded-2xl border border-gray-200/50 dark:border-[#262626] text-xs font-semibold text-gray-600 dark:text-[#A8A8A8]">
          <button
            onClick={() => setSelectedMediaFilter('all')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              selectedMediaFilter === 'all'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('explore.tabs.all')}
          </button>
          <button
            onClick={() => setSelectedMediaFilter('photos')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              selectedMediaFilter === 'photos'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('explore.tabs.photos')}
          </button>
          <button
            onClick={() => setSelectedMediaFilter('videos')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              selectedMediaFilter === 'videos'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            {t('explore.tabs.videos')}
          </button>
          <button
            onClick={() => setSelectedMediaFilter('carousel')}
            className={clsx(
              'px-3 py-1.5 rounded-xl transition cursor-pointer',
              selectedMediaFilter === 'carousel'
                ? 'bg-white dark:bg-[#262626] text-gray-900 dark:text-white shadow-xs font-bold'
                : 'hover:text-gray-900 dark:hover:text-white'
            )}
          >
            Bộ sưu tập
          </button>
        </div>

        <span className="text-xs text-gray-400 dark:text-[#737373] tabular-nums">
          {filteredItems.length} nội dung
        </span>
      </div>

      {/* 5. Explore Responsive Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-3xl p-10 border border-gray-100 dark:border-[#262626] text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 dark:text-[#737373] flex items-center justify-center mx-auto mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base mb-1">
            {t('explore.noResults')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-sm mx-auto mb-4">
            {t('explore.noResultsDesc')}
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedMediaFilter('all');
              setSelectedTag(null);
            }}
            className="px-4 py-2 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
          >
            Đặt lại bộ lọc
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveModalItem(item)}
              className="group relative bg-gray-100 dark:bg-[#1A1A1A] rounded-3xl overflow-hidden cursor-pointer aspect-square shadow-sm hover:shadow-md transition duration-300"
            >
              {/* Media Image */}
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500 ease-out"
                loading="lazy"
              />

              {/* Badge top-right for Media Type */}
              <div className="absolute top-3 right-3 flex items-center gap-1 z-10">
                {item.mediaType === 'VIDEO' && (
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs">
                    <Play className="w-2.5 h-2.5 fill-white" />
                    {item.videoDuration || 'Video'}
                  </span>
                )}
                {item.mediaType === 'CAROUSEL' && (
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold p-1 rounded-full shadow-xs">
                    <Layers className="w-3 h-3" />
                  </span>
                )}
              </div>

              {/* Gradient & Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-3.5 sm:p-4 text-white">
                <div className="flex justify-end">
                  <button
                    onClick={(e) => handleToggleSave(item.id, e)}
                    className="p-2 rounded-full bg-white/20 backdrop-blur-md hover:bg-white/30 text-white transition"
                    title="Lưu bài viết"
                  >
                    <Bookmark
                      className={clsx('w-4 h-4', item.isSaved && 'fill-white text-white')}
                    />
                  </button>
                </div>

                <div>
                  {/* Author line */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={item.author.avatarUrl}
                      alt={item.author.name}
                      className="w-5 h-5 rounded-full object-cover border border-white/60"
                    />
                    <span className="text-xs font-semibold truncate drop-shadow-sm">
                      {item.author.name}
                    </span>
                  </div>

                  {/* Title */}
                  <p className="text-xs font-bold line-clamp-1 drop-shadow-sm mb-2">
                    {item.title}
                  </p>

                  {/* Stats Footer */}
                  <div className="flex items-center gap-4 text-[11px] font-medium text-white/90">
                    <span className="flex items-center gap-1">
                      <Heart
                        className={clsx('w-3.5 h-3.5', item.isLiked ? 'fill-rose-500 text-rose-500' : 'fill-white/20')}
                      />
                      {item.likesCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {item.commentsCount}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 6. Post Detail Modal */}
      {activeModalItem && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setActiveModalItem(null)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-100 dark:border-[#262626]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Media View */}
            <div className="md:w-3/5 bg-black flex items-center justify-center relative min-h-[300px] md:min-h-[500px]">
              <img
                src={activeModalItem.imageUrl}
                alt={activeModalItem.title}
                className="max-h-[500px] w-full object-contain"
              />
              {activeModalItem.mediaType === 'VIDEO' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <div className="w-16 h-16 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center cursor-pointer hover:scale-110 transition text-white">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                </div>
              )}
            </div>

            {/* Right Info & Comments View */}
            <div className="md:w-2/5 flex flex-col justify-between p-5 max-h-[500px]">
              {/* Header */}
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-3">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={activeModalItem.author.avatarUrl}
                      alt={activeModalItem.author.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5]">
                          {activeModalItem.author.name}
                        </span>
                        {activeModalItem.author.isVerified && (
                          <span className="text-[#0095F6] text-xs">✓</span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 dark:text-[#737373]">
                        @{activeModalItem.author.username} · {activeModalItem.createdAt}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveModalItem(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Caption & Tags */}
                <div className="space-y-2 mb-4 text-xs text-gray-800 dark:text-[#D4D4D4] leading-relaxed">
                  <h3 className="font-bold text-sm text-gray-900 dark:text-[#F5F5F5]">
                    {activeModalItem.title}
                  </h3>
                  <p>{activeModalItem.caption}</p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeModalItem.tags.map((tg, i) => (
                      <span
                        key={i}
                        className="text-[#004AC6] dark:text-[#0095F6] font-semibold hover:underline cursor-pointer"
                      >
                        {tg}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Comments Stream */}
                <div className="border-t border-gray-100 dark:border-[#262626] pt-3 max-h-[160px] overflow-y-auto space-y-3 custom-scrollbar pr-1">
                  <p className="text-[11px] font-bold text-gray-400 dark:text-[#737373] uppercase tracking-wider">
                    Bình luận ({activeModalItem.commentsCount})
                  </p>
                  {activeModalItem.comments.length === 0 ? (
                    <p className="text-xs text-gray-400 italic py-2">
                      Chưa có bình luận nào. Hãy là người đầu tiên!
                    </p>
                  ) : (
                    activeModalItem.comments.map((cm) => (
                      <div key={cm.id} className="flex items-start gap-2 text-xs">
                        <img
                          src={cm.author.avatarUrl}
                          alt={cm.author.name}
                          className="w-6 h-6 rounded-full object-cover shrink-0 mt-0.5"
                        />
                        <div className="bg-gray-50 dark:bg-[#1E1E1E] p-2 rounded-2xl flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="font-bold text-gray-900 dark:text-[#F5F5F5] text-[11px]">
                              {cm.author.name}
                            </span>
                            <span className="text-[10px] text-gray-400">{cm.time}</span>
                          </div>
                          <p className="text-gray-700 dark:text-[#D4D4D4] leading-snug">
                            {cm.content}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Actions & Comment Input */}
              <div className="pt-3 border-t border-gray-100 dark:border-[#262626] mt-3">
                {/* Actions Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleLike(activeModalItem.id)}
                      className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-[#D4D4D4] hover:text-rose-500 transition cursor-pointer"
                    >
                      <Heart
                        className={clsx(
                          'w-5 h-5',
                          activeModalItem.isLiked
                            ? 'fill-rose-500 text-rose-500'
                            : 'text-gray-500 dark:text-[#A8A8A8]'
                        )}
                      />
                      <span>{activeModalItem.likesCount}</span>
                    </button>
                    <button
                      onClick={() => {
                        void navigator.clipboard?.writeText(window.location.href);
                        toast.success('Đã sao chép liên kết chia sẻ!');
                      }}
                      className="p-1.5 text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
                      title="Chia sẻ"
                    >
                      <Share2 className="w-5 h-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleSave(activeModalItem.id)}
                    className="p-1.5 text-gray-500 dark:text-[#A8A8A8] hover:text-[#004AC6] dark:hover:text-[#0095F6] transition cursor-pointer"
                    title="Lưu"
                  >
                    <Bookmark
                      className={clsx(
                        'w-5 h-5',
                        activeModalItem.isSaved &&
                          'fill-[#004AC6] text-[#004AC6] dark:fill-[#0095F6] dark:text-[#0095F6]'
                      )}
                    />
                  </button>
                </div>

                {/* Comment Input */}
                <form onSubmit={handleAddComment} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={t('explore.writeComment')}
                    className="flex-1 px-3.5 py-2 bg-gray-100 dark:bg-[#1E1E1E] rounded-full text-xs text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] outline-none focus:ring-1 focus:ring-[#004AC6] transition"
                  />
                  <button
                    type="submit"
                    disabled={!commentInput.trim()}
                    className="p-2 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-full disabled:opacity-40 hover:opacity-90 transition cursor-pointer shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExplorePage;
