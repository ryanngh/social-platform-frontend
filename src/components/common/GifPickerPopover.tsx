import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { giphyService, type GiphyGifItem } from '../../services/giphyService';

interface CategoryOption {
  label: string;
  value: string;
}

const GIF_CATEGORIES: CategoryOption[] = [
  { label: 'Tất cả', value: 'All' },
  { label: 'Vui vẻ', value: 'happy' },
  { label: 'Yêu thích', value: 'love' },
  { label: 'Đồng ý', value: 'thumbs up' },
  { label: 'Ngạc nhiên', value: 'mind blown' },
  { label: 'Hài hước', value: 'laughing' },
  { label: 'Tiệc tùng', value: 'party' },
  { label: 'Dễ thương', value: 'cute' },
  { label: 'Anime', value: 'anime' },
];

const PAGE_SIZE = 20;

interface GifPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectGif: (gifUrl: string) => void;
  className?: string;
  embedded?: boolean;
}

export const GifPickerPopover: React.FC<GifPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectGif,
  className = '',
  embedded = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [search, setSearch] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  const [gifs, setGifs] = useState<GiphyGifItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef<number>(0);
  const isFetchingRef = useRef<boolean>(false);

  // Close on outside click (only for non-embedded popover)
  useEffect(() => {
    if (!isOpen || embedded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, embedded, onClose]);

  // Debounce search input (350ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(handler);
  }, [search]);

  // Core load function
  const loadGifs = useCallback(
    async (isInitial: boolean) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;

      const currentOffset = isInitial ? 0 : offsetRef.current;

      if (isInitial) {
        setLoading(true);
        setError(null);
        if (gridContainerRef.current) {
          gridContainerRef.current.scrollTop = 0;
        }
      } else {
        setLoadingMore(true);
      }

      try {
        const query =
          debouncedSearch.trim() ||
          (activeCategory !== 'All' ? activeCategory : '');

        const result = query
          ? await giphyService.search(query, currentOffset, PAGE_SIZE)
          : await giphyService.getTrending(currentOffset, PAGE_SIZE);

        if (isInitial) {
          setGifs(result.gifs);
        } else {
          setGifs((prev) => {
            const existingIds = new Set(prev.map((g) => g.id));
            const newGifs = result.gifs.filter((g) => !existingIds.has(g.id));
            return [...prev, ...newGifs];
          });
        }

        offsetRef.current = currentOffset + result.gifs.length;
        setHasMore(result.hasMore);
      } catch (err) {
        console.error('Failed to load GIFs:', err);
        if (isInitial) {
          setError('Không thể kết nối đến GIPHY. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        isFetchingRef.current = false;
      }
    },
    [debouncedSearch, activeCategory]
  );

  // Trigger search/trending when popover opens or query/category changes
  useEffect(() => {
    if (!isOpen) return;
    offsetRef.current = 0;
    loadGifs(true);
  }, [isOpen, debouncedSearch, activeCategory, loadGifs]);

  // Handle scroll for infinite scrolling
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 90;

    if (isNearBottom && hasMore && !loading && !loadingMore && !isFetchingRef.current) {
      loadGifs(false);
    }
  };

  const handleCategorySelect = (value: string) => {
    setActiveCategory(value);
    setSearch('');
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (activeCategory !== 'All') {
      setActiveCategory('All');
    }
  };

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className={
        embedded
          ? `w-full flex-1 flex flex-col gap-3 select-none ${className}`
          : `bg-white dark:bg-[#262626] rounded-2xl shadow-2xl border border-gray-100 dark:border-[#363636] p-3.5 w-84 max-w-[92vw] z-50 flex flex-col gap-2.5 animate-fadeIn select-none ${className}`
      }
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header - only for popup mode */}
      {!embedded && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
            <span className="px-1.5 py-0.5 rounded bg-[#004AC6] text-white text-[10px] font-black tracking-normal">
              GIF
            </span>
            Kho ảnh động
          </span>
          <div className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-[#A8A8A8] font-medium">
            <span>Powered by</span>
            <span className="font-extrabold text-[#004AC6] dark:text-[#0095F6]">GIPHY</span>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-[#737373] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={handleSearchChange}
          placeholder="Tìm kiếm GIF trên GIPHY..."
          className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#363636] rounded-xl pl-8 pr-3 py-2 text-xs text-gray-800 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] outline-none focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:bg-white dark:focus:bg-slate-800 transition shadow-2xs"
          autoFocus
        />
        {loading && (
          <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin absolute right-3 pointer-events-none" />
        )}
      </div>

      {/* Categories Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-xs">
        {GIF_CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            type="button"
            onClick={() => handleCategorySelect(cat.value)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition cursor-pointer ${
              activeCategory === cat.value
                ? 'bg-[#004AC6] text-white shadow-xs font-semibold'
                : 'bg-gray-100 dark:bg-[#1A1A1A] text-gray-600 dark:text-[#D4D4D4] hover:bg-gray-200 dark:hover:bg-[#363636]'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* GIF Grid / Content */}
      <div
        ref={gridContainerRef}
        onScroll={handleScroll}
        className={
          embedded
            ? 'grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[52vh] min-h-[220px] overflow-y-auto custom-scrollbar pr-1'
            : 'grid grid-cols-2 gap-2 max-h-64 min-h-[160px] overflow-y-auto custom-scrollbar pr-1'
        }
      >
        {/* Loading Skeletons */}
        {loading && (
          <>
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="rounded-xl aspect-video bg-gray-100 dark:bg-[#1A1A1A] animate-pulse border border-gray-100 dark:border-[#363636]"
              />
            ))}
          </>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="col-span-2 flex flex-col items-center justify-center py-6 text-center text-gray-500 dark:text-[#A8A8A8] gap-2">
            <AlertCircle className="w-6 h-6 text-amber-500" />
            <p className="text-xs">{error}</p>
            <button
              type="button"
              onClick={() => loadGifs(true)}
              className="mt-1 flex items-center gap-1 text-[11px] font-medium text-[#004AC6] dark:text-[#0095F6] hover:underline cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" /> Thử lại
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && gifs.length === 0 && (
          <div className="col-span-2 flex flex-col items-center justify-center py-8 text-center text-gray-400 dark:text-[#737373]">
            <p className="text-xs font-medium">Không tìm thấy GIF nào</p>
            <p className="text-[11px] text-gray-400 dark:text-[#737373] mt-0.5">
              Thử tìm kiếm với từ khóa khác nhé
            </p>
          </div>
        )}

        {/* GIFs Grid List */}
        {!loading &&
          gifs.map((gif) => (
            <button
              key={gif.id}
              type="button"
              onClick={() => {
                onSelectGif(gif.url);
                onClose();
              }}
              title={gif.title}
              className="group relative rounded-xl overflow-hidden aspect-video bg-gray-100 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#363636] hover:opacity-90 hover:scale-[1.02] transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#004AC6]"
            >
              <img
                src={gif.previewUrl}
                alt={gif.title}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white font-medium truncate text-left">
                  {gif.title}
                </p>
              </div>
            </button>
          ))}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="col-span-2 flex justify-center py-2">
            <Loader2 className="w-4 h-4 text-[#004AC6] dark:text-[#0095F6] animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
};

export default GifPickerPopover;
