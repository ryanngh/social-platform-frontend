import React, { useState, useMemo } from 'react';
import {
  Store,
  Search,
  Plus,
  MapPin,
  Heart,
  MessageSquare,
  Star,
  X,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import {
  INITIAL_MARKETPLACE_ITEMS,
  type MarketplaceItem,
  type MarketplaceCondition,
} from '../mocks/marketplaceData';
import clsx from 'clsx';

type CategoryKey = 'all' | 'electronics' | 'vehicles' | 'furniture' | 'fashion' | 'gaming' | 'books' | 'free';
type ItemCategory = 'electronics' | 'vehicles' | 'furniture' | 'fashion' | 'gaming' | 'books' | 'free';
type MarketplaceTab = 'browse' | 'myListings' | 'saved';
type SortOption = 'recommended' | 'price_asc' | 'price_desc' | 'newest';

export const MarketplacePage: React.FC = () => {
  const { t } = useLanguage();

  const [items, setItems] = useState<MarketplaceItem[]>(INITIAL_MARKETPLACE_ITEMS);
  const [activeTab, setActiveTab] = useState<MarketplaceTab>('browse');
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('TP. Hồ Chí Minh');
  const [sortBy, setSortBy] = useState<SortOption>('recommended');

  // Modals
  const [activeDetailItem, setActiveDetailItem] = useState<MarketplaceItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Listing Form
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState<ItemCategory>('electronics');
  const [newCondition, setNewCondition] = useState<MarketplaceCondition>('LIKE_NEW');
  const [newLocation, setNewLocation] = useState('TP. Hồ Chí Minh');
  const [newDescription, setNewDescription] = useState('');
  const [newImageUrl, setNewImageUrl] = useState('');

  // Categories definition
  const categories: { key: CategoryKey; label: string; icon: string }[] = [
    { key: 'all', label: t('marketplace.categories.all'), icon: '🛍️' },
    { key: 'electronics', label: t('marketplace.categories.electronics'), icon: '📱' },
    { key: 'furniture', label: t('marketplace.categories.furniture'), icon: '🛋️' },
    { key: 'gaming', label: t('marketplace.categories.gaming'), icon: '🎮' },
    { key: 'fashion', label: t('marketplace.categories.fashion'), icon: '👕' },
    { key: 'vehicles', label: t('marketplace.categories.vehicles'), icon: '🚗' },
    { key: 'books', label: t('marketplace.categories.books'), icon: '📚' },
    { key: 'free', label: t('marketplace.categories.free'), icon: '🎁' },
  ];

  // Helper format price
  const formatPrice = (price: number) => {
    if (price === 0) return 'Miễn phí (0₫)';
    return new Intl.NumberFormat('vi-VN').format(price) + ' ₫';
  };

  // Filtered & Sorted items
  const filteredItems = useMemo(() => {
    let result = items.filter((item) => {
      // Tab filter
      if (activeTab === 'saved') return item.isSaved;
      if (activeTab === 'myListings') return item.seller.username === 'me';

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchLocation = item.location.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchLocation) return false;
      }

      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'free') {
          if (item.price !== 0) return false;
        } else if (item.category !== selectedCategory) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    if (sortBy === 'price_asc') {
      result = [...result].sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => b.price - a.price);
    }

    return result;
  }, [items, activeTab, selectedCategory, searchQuery, sortBy]);

  // Handle Save toggle
  const handleToggleSave = (itemId: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setItems((prev) =>
      prev.map((it) => {
        if (it.id === itemId) {
          const nextState = !it.isSaved;
          toast.success(nextState ? t('marketplace.savedToast') : t('marketplace.unsavedToast'));
          return { ...it, isSaved: nextState };
        }
        return it;
      })
    );

    if (activeDetailItem?.id === itemId) {
      setActiveDetailItem((prev) => (prev ? { ...prev, isSaved: !prev.isSaved } : null));
    }
  };

  // Handle Create Listing
  const handleCreateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    const parsedPrice = parseInt(newPrice.replace(/[^0-9]/g, ''), 10) || 0;

    const newItem: MarketplaceItem = {
      id: `mp-${Date.now()}`,
      title: newTitle.trim(),
      price: parsedPrice,
      currency: '₫',
      condition: newCondition,
      category: newCategory,
      description: newDescription.trim() || 'Mô tả sản phẩm đang được cập nhật.',
      images: [
        newImageUrl.trim() ||
          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80',
      ],
      location: newLocation,
      distanceKm: 1.0,
      isSaved: false,
      viewsCount: 1,
      createdAt: 'Vừa xong',
      seller: {
        id: 'me',
        name: 'Bạn (Me)',
        username: 'me',
        avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        rating: 5.0,
        reviewCount: 1,
        joinDate: 'Tháng 9, 2026',
        responseRate: '100%',
        isVerified: true,
      },
    };

    setItems([newItem, ...items]);
    setShowCreateModal(false);
    setNewTitle('');
    setNewPrice('');
    setNewDescription('');
    setNewImageUrl('');
    toast.success(t('marketplace.createSuccess'));
  };

  // Condition Badge Renderer
  const renderConditionBadge = (cond: MarketplaceCondition) => {
    switch (cond) {
      case 'NEW':
        return (
          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {t('marketplace.conditions.new')}
          </span>
        );
      case 'LIKE_NEW':
        return (
          <span className="bg-blue-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {t('marketplace.conditions.likeNew')}
          </span>
        );
      case 'USED_GOOD':
      default:
        return (
          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs">
            {t('marketplace.conditions.usedGood')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-8">
      {/* 1. Header Banner & Action Bar */}
      <div className="bg-white dark:bg-[#121212] rounded-3xl p-4 sm:p-5 border border-gray-100 dark:border-[#262626] shadow-sm transition-colors duration-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-sm shadow-blue-500/20 shrink-0">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                {t('marketplace.title')}
              </h1>
              <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">
                {t('marketplace.subtitle')}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-2xl text-xs font-bold hover:opacity-90 shadow-sm shadow-blue-500/20 transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{t('marketplace.createListing')}</span>
          </button>
        </div>

        {/* Search, Location, & Sort Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('marketplace.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs text-gray-900 dark:text-[#F5F5F5] placeholder-gray-400 outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6] transition"
            />
          </div>

          {/* Location Selector */}
          <div className="sm:col-span-3 relative">
            <MapPin className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs font-semibold text-gray-900 dark:text-[#F5F5F5] outline-none cursor-pointer"
            >
              <option value="TP. Hồ Chí Minh">TP. Hồ Chí Minh (20km)</option>
              <option value="Hà Nội">Hà Nội (20km)</option>
              <option value="Đà Nẵng">Đà Nẵng (20km)</option>
              <option value="Cần Thơ">Cần Thơ (20km)</option>
            </select>
          </div>

          {/* Sort By */}
          <div className="sm:col-span-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="w-full px-3 py-2.5 bg-gray-100/80 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl text-xs font-semibold text-gray-900 dark:text-[#F5F5F5] outline-none cursor-pointer"
            >
              <option value="recommended">{t('marketplace.sortRecommended')}</option>
              <option value="price_asc">{t('marketplace.sortPriceAsc')}</option>
              <option value="price_desc">{t('marketplace.sortPriceDesc')}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-[#262626] pb-2 px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={clsx(
              'px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer',
              activeTab === 'browse'
                ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-xs'
                : 'text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
            )}
          >
            {t('marketplace.tabs.browse')}
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={clsx(
              'px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5',
              activeTab === 'saved'
                ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-xs'
                : 'text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
            )}
          >
            <Heart className="w-3.5 h-3.5" />
            <span>{t('marketplace.tabs.saved')}</span>
          </button>
          <button
            onClick={() => setActiveTab('myListings')}
            className={clsx(
              'px-4 py-2 rounded-2xl text-xs font-bold transition cursor-pointer',
              activeTab === 'myListings'
                ? 'bg-[#004AC6] dark:bg-[#0095F6] text-white shadow-xs'
                : 'text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#1A1A1A]'
            )}
          >
            {t('marketplace.tabs.myListings')}
          </button>
        </div>

        <span className="text-xs text-gray-400 tabular-nums font-medium">
          {filteredItems.length} sản phẩm
        </span>
      </div>

      {/* 3. Category Pills */}
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
                  ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent'
                  : 'bg-white dark:bg-[#121212] text-gray-700 dark:text-[#D4D4D4] border-gray-200/80 dark:border-[#262626] hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
              )}
            >
              <span>{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* 4. Product Cards Responsive Grid */}
      {filteredItems.length === 0 ? (
        <div className="bg-white dark:bg-[#121212] rounded-3xl p-10 border border-gray-100 dark:border-[#262626] text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-[#1A1A1A] text-gray-400 flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-gray-900 dark:text-[#F5F5F5] text-base mb-1">
            {t('marketplace.noItems')}
          </h3>
          <p className="text-xs text-gray-500 dark:text-[#A8A8A8] max-w-sm mx-auto mb-4">
            {t('marketplace.noItemsDesc')}
          </p>
          <button
            onClick={() => {
              setActiveTab('browse');
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="px-4 py-2 bg-[#004AC6] text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-90 transition cursor-pointer"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setActiveDetailItem(item)}
              className="group bg-white dark:bg-[#121212] rounded-3xl overflow-hidden border border-gray-100 dark:border-[#262626] shadow-xs hover:shadow-md hover:border-gray-200 dark:hover:border-[#363636] transition cursor-pointer flex flex-col justify-between"
            >
              {/* Product Image Box */}
              <div className="relative aspect-4/3 w-full bg-gray-100 dark:bg-[#1A1A1A] overflow-hidden">
                <img
                  src={item.images[0]}
                  alt={item.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Condition Badge Top Left */}
                <div className="absolute top-3 left-3">{renderConditionBadge(item.condition)}</div>

                {/* Bookmark Heart Top Right */}
                <button
                  onClick={(e) => handleToggleSave(item.id, e)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-white/80 dark:bg-black/60 backdrop-blur-md text-gray-700 dark:text-gray-200 hover:scale-110 transition shadow-xs"
                >
                  <Heart
                    className={clsx(
                      'w-4 h-4',
                      item.isSaved ? 'fill-rose-500 text-rose-500' : ''
                    )}
                  />
                </button>
              </div>

              {/* Product Info */}
              <div className="p-3.5 flex flex-col justify-between flex-1">
                <div>
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-base font-extrabold text-[#004AC6] dark:text-[#0095F6]">
                      {formatPrice(item.price)}
                    </span>
                    {item.originalPrice && item.originalPrice > item.price && (
                      <span className="text-[11px] text-gray-400 line-through">
                        {formatPrice(item.originalPrice)}
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5] line-clamp-2 mb-2 group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors leading-snug">
                    {item.title}
                  </h3>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-[#262626] text-[11px] text-gray-400 dark:text-[#737373] flex items-center justify-between">
                  <span className="truncate max-w-[130px] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                    {item.location.split(',')[0]}
                  </span>
                  <span>{item.createdAt}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 5. Product Detail Modal */}
      {activeDetailItem && (
        <div
          className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-6 animate-fadeIn"
          onClick={() => setActiveDetailItem(null)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col md:flex-row border border-gray-100 dark:border-[#262626]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Media Image Slider */}
            <div className="md:w-1/2 bg-black flex items-center justify-center relative min-h-[260px] md:min-h-[460px]">
              <img
                src={activeDetailItem.images[0]}
                alt={activeDetailItem.title}
                className="max-h-[460px] w-full object-contain"
              />
              <div className="absolute top-3 left-3">{renderConditionBadge(activeDetailItem.condition)}</div>
            </div>

            {/* Right Information & Chat Trigger */}
            <div className="md:w-1/2 flex flex-col justify-between p-5 max-h-[480px] overflow-y-auto custom-scrollbar">
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-gray-100 dark:border-[#262626] mb-3">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-[#F5F5F5] leading-tight">
                      {activeDetailItem.title}
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className="text-xl font-black text-[#004AC6] dark:text-[#0095F6]">
                        {formatPrice(activeDetailItem.price)}
                      </span>
                      {activeDetailItem.originalPrice && (
                        <span className="text-xs text-gray-400 line-through">
                          {formatPrice(activeDetailItem.originalPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveDetailItem(null)}
                    className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Location & Time badge */}
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-[#A8A8A8] mb-4">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span>
                    {activeDetailItem.location} ({activeDetailItem.distanceKm}km)
                  </span>
                  <span>· {activeDetailItem.createdAt}</span>
                </div>

                {/* Description */}
                <div className="space-y-1.5 mb-5 text-xs text-gray-700 dark:text-[#D4D4D4] leading-relaxed">
                  <h4 className="font-bold text-gray-900 dark:text-[#F5F5F5]">
                    {t('marketplace.listingDescription')}
                  </h4>
                  <p className="bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-2xl border border-gray-100 dark:border-[#262626]">
                    {activeDetailItem.description}
                  </p>
                </div>

                {/* Seller Box */}
                <div className="bg-blue-50/60 dark:bg-blue-950/30 p-3.5 rounded-2xl border border-blue-100/80 dark:border-blue-900/40 mb-4">
                  <h4 className="font-bold text-[11px] text-gray-400 uppercase tracking-wider mb-2">
                    {t('marketplace.sellerInfo')}
                  </h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={activeDetailItem.seller.avatarUrl}
                        alt={activeDetailItem.seller.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-xs text-gray-900 dark:text-[#F5F5F5]">
                            {activeDetailItem.seller.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-amber-500 font-semibold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{activeDetailItem.seller.rating}</span>
                          <span className="text-gray-400 font-normal">
                            ({activeDetailItem.seller.reviewCount} đánh giá)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-100 dark:border-[#262626] flex items-center gap-2">
                <button
                  onClick={() => handleToggleSave(activeDetailItem.id)}
                  className="p-3 rounded-2xl border border-gray-200 dark:border-[#363636] text-gray-700 dark:text-[#D4D4D4] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition cursor-pointer"
                  title="Lưu vào danh sách"
                >
                  <Heart
                    className={clsx(
                      'w-5 h-5',
                      activeDetailItem.isSaved ? 'fill-rose-500 text-rose-500' : ''
                    )}
                  />
                </button>

                <button
                  onClick={() => {
                    toast.success(
                      `Đã gửi tin nhắn mẫu đến người bán: "Chào bạn, mặt hàng này còn không ạ?"`
                    );
                    setActiveDetailItem(null);
                  }}
                  className="flex-1 py-3 px-4 bg-[#004AC6] dark:bg-[#0095F6] text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2 hover:opacity-90 shadow-sm shadow-blue-500/20 transition cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>{t('marketplace.messageSeller')}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. Create Listing Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="bg-white dark:bg-[#121212] rounded-3xl max-w-lg w-full p-5 sm:p-6 border border-gray-100 dark:border-[#262626] shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
              <h3 className="font-bold text-base text-gray-900 dark:text-[#F5F5F5]">
                {t('marketplace.createListingModalTitle')}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateListing} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                  {t('marketplace.listingTitle')} *
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: iPhone 15 Pro Max 256GB Titan Tự nhiên..."
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                    {t('marketplace.listingPrice')} *
                  </label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="25000000"
                    className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none focus:bg-white dark:focus:bg-[#000000] focus:ring-1 focus:ring-[#004AC6]"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                    {t('marketplace.listingCondition')}
                  </label>
                  <select
                    value={newCondition}
                    onChange={(e) => setNewCondition(e.target.value as MarketplaceCondition)}
                    className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none cursor-pointer"
                  >
                    <option value="NEW">{t('marketplace.conditions.new')}</option>
                    <option value="LIKE_NEW">{t('marketplace.conditions.likeNew')}</option>
                    <option value="USED_GOOD">{t('marketplace.conditions.usedGood')}</option>
                    <option value="USED_FAIR">{t('marketplace.conditions.usedFair')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                    {t('marketplace.listingCategory')}
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ItemCategory)}
                    className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none cursor-pointer"
                  >
                    <option value="electronics">Điện tử & Công nghệ</option>
                    <option value="furniture">Nội thất & Nhà cửa</option>
                    <option value="fashion">Thời trang & Phụ kiện</option>
                    <option value="gaming">Game & Đồ chơi</option>
                    <option value="vehicles">Xe cộ & Phụ tùng</option>
                    <option value="books">Sách & Học tập</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                    {t('marketplace.listingLocation')}
                  </label>
                  <input
                    type="text"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                  Đường dẫn ảnh sản phẩm (Image URL)
                </label>
                <input
                  type="url"
                  value={newImageUrl}
                  onChange={(e) => setNewImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-gray-700 dark:text-[#D4D4D4] mb-1">
                  {t('marketplace.listingDescription')}
                </label>
                <textarea
                  rows={3}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Mô tả chi tiết phụ kiện, tình trạng sử dụng, bảo hành..."
                  className="w-full px-3.5 py-2.5 bg-gray-100 dark:bg-[#1A1A1A] border border-transparent dark:border-[#363636] rounded-2xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-[#262626]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1E1E1E]"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim() || !newPrice}
                  className="px-5 py-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50 shadow-sm"
                >
                  {t('marketplace.publishListing')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketplacePage;
