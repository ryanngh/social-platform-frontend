import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Smile } from 'lucide-react';

interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: string[];
}

const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'smileys',
    name: 'Smileys & Emotion',
    icon: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
      '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
      '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
      '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '😣', '😖',
      '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
      '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔',
      '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦',
      '😴', '🤤', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤕',
    ],
  },
  {
    id: 'gestures',
    name: 'Gestures & Hearts',
    icon: '❤️',
    emojis: [
      '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
      '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '👍',
      '👎', '👏', '🙌', '👐', '🤲', '🤝', '👊', '✊', '🤛', '🤜',
      '🤞', '✌️', '🤟', '🤘', '👌', '🤏', '👈', '👉', '👆', '👇',
      '✋', '🤚', '🖐️', '🖖', '👋', '🤙', '💪', '🙏', '✨', '🔥',
    ],
  },
  {
    id: 'animals',
    name: 'Animals & Nature',
    icon: '🐶',
    emojis: [
      '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯',
      '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🦆', '🦅',
      '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌',
      '🌸', '🌺', '🌹', '🌷', '🌻', '🌼', '🌲', '🌳', '🌴', '🍀',
      '🍁', '🍂', '🍃', '☀️', '🌤️', '⛅', '🌈', '⚡', '❄️', '⭐',
    ],
  },
  {
    id: 'food',
    name: 'Food & Drink',
    icon: '🍔',
    emojis: [
      '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🍒',
      '🍑', '🍍', '🥥', '🥝', '🍅', '🥑', '🥦', '🌽', '🥕', '🥔',
      '🥐', '🍞', '🧀', '🍳', '🥞', '🥓', '🥩', '🍗', '🍔', '🍟',
      '🍕', '🌭', '🥪', '🌮', '🌯', '🍜', '🍝', '🍣', '🍦', '🍩',
      '🍪', '🎂', '🍰', '🍫', '🍬', '🍭', '☕', '🍵', '🧃', '🍺',
    ],
  },
  {
    id: 'objects',
    name: 'Objects & Fun',
    icon: '🎉',
    emojis: [
      '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⚽', '🏀',
      '🏈', '⚾', '🎾', '🎮', '🕹️', '🎯', '🎲', '🎨', '🎬', '🎤',
      '🎧', '🎸', '🎹', '💡', '📱', '💻', '📷', '📹', '🔍', '🔒',
      '🔑', '🏷️', '📦', '💌', '📮', '📌', '📍', '🚀', '✈️', '🚗',
    ],
  },
];

interface EmojiPickerPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEmoji: (emoji: string) => void;
  className?: string;
  embedded?: boolean;
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  className = '',
  embedded = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('smileys');
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth < 640 : false
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Click outside detection (only for desktop floating popovers)
  useEffect(() => {
    if (!isOpen || embedded || isMobile) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, embedded, isMobile, onClose]);

  if (!isOpen) return null;

  const filteredCategories = EMOJI_CATEGORIES.map((cat) => {
    if (!search.trim()) return cat;
    return {
      ...cat,
      emojis: cat.emojis.filter(() => true),
    };
  });

  const pickerContent = (
    <>
      {/* Mobile Handle & Header */}
      {isMobile && !embedded && (
        <div className="flex flex-col gap-2 shrink-0 pb-1">
          <div className="w-10 h-1 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto" />
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] uppercase tracking-wider flex items-center gap-1.5">
              <Smile className="w-4 h-4 text-amber-500" />
              Biểu tượng cảm xúc
            </span>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 -mr-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer transition hover:bg-gray-100 dark:hover:bg-[#333333] min-w-[36px] min-h-[36px] flex items-center justify-center"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Search Input */}
      <div className="relative flex items-center shrink-0">
        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-[#737373] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm emoji..."
          className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#363636] rounded-xl pl-8 pr-3 py-2 sm:py-1.5 text-xs text-gray-800 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] outline-none focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:bg-white dark:focus:bg-slate-800 transition"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262626] pb-1.5 text-base shrink-0">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`p-1.5 sm:p-1 rounded-lg transition hover:bg-gray-100 dark:hover:bg-[#363636] cursor-pointer min-w-[36px] min-h-[36px] sm:min-w-0 sm:min-h-0 flex items-center justify-center ${
              activeCategory === cat.id ? 'bg-blue-50 dark:bg-[#0095F6]/15 ring-1 ring-[#004AC6]/30 dark:ring-[#0095F6]/40' : ''
            }`}
            title={cat.name}
          >
            <span>{cat.icon}</span>
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
        {filteredCategories
          .filter((cat) => !search || activeCategory === cat.id)
          .map((cat) => (
            <div key={cat.id}>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#A8A8A8] mb-1.5 px-1">{cat.name}</p>
              <div className="grid grid-cols-7 sm:grid-cols-8 gap-1.5 sm:gap-1">
                {cat.emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectEmoji(emoji);
                    }}
                    className="w-full aspect-square sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xl sm:text-lg hover:bg-gray-100 dark:hover:bg-[#363636] active:scale-90 transition cursor-pointer select-none"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </>
  );

  if (embedded) {
    return (
      <div
        ref={popoverRef}
        className={`w-full flex-1 flex flex-col gap-2.5 select-none ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {pickerContent}
      </div>
    );
  }

  if (isMobile) {
    return createPortal(
      <div className="fixed inset-0 z-[99999] flex flex-col justify-end pointer-events-none">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity pointer-events-auto animate-fadeIn"
          onClick={onClose}
        />
        {/* Drawer */}
        <div
          ref={popoverRef}
          className="relative z-10 w-full bg-white dark:bg-[#1E1E1E] rounded-t-3xl border-t border-gray-200 dark:border-[#333333] shadow-2xl p-4 max-h-[60vh] flex flex-col gap-3 pb-[calc(1.25rem+env(safe-area-inset-bottom,0px))] animate-slideUp pointer-events-auto select-none"
          onClick={(e) => e.stopPropagation()}
        >
          {pickerContent}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <div
      ref={popoverRef}
      className={`bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] p-3 w-80 max-w-[90vw] z-50 flex flex-col gap-2.5 animate-fadeIn select-none ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {pickerContent}
    </div>
  );
};

export default EmojiPickerPopover;
