import React, { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';

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
}

export const EmojiPickerPopover: React.FC<EmojiPickerPopoverProps> = ({
  isOpen,
  onClose,
  onSelectEmoji,
  className = '',
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('smileys');
  const [search, setSearch] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Click outside detection
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredCategories = EMOJI_CATEGORIES.map((cat) => {
    if (!search.trim()) return cat;
    return {
      ...cat,
      emojis: cat.emojis.filter(() => true), // Can be enhanced with keyword lookup
    };
  });

  return (
    <div
      ref={popoverRef}
      className={`bg-white dark:bg-[#262626] rounded-2xl shadow-xl border border-gray-100 dark:border-[#363636] p-3 w-80 max-w-[90vw] z-50 flex flex-col gap-2.5 animate-fadeIn ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search Input */}
      <div className="relative flex items-center">
        <Search className="w-3.5 h-3.5 text-gray-400 dark:text-[#737373] absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Tìm emoji..."
          className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-100 dark:border-[#363636] rounded-xl pl-8 pr-3 py-1.5 text-xs text-gray-800 dark:text-[#F5F5F5] placeholder-gray-400 dark:placeholder-[#737373] outline-none focus:border-[#004AC6] dark:focus:border-[#0095F6] focus:bg-white dark:focus:bg-slate-800 transition"
        />
      </div>

      {/* Category Tabs */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#262626] pb-1.5 text-base">
        {EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`p-1 rounded-lg transition hover:bg-gray-100 dark:hover:bg-[#363636] cursor-pointer ${
              activeCategory === cat.id ? 'bg-blue-50 dark:bg-[#0095F6]/15 ring-1 ring-[#004AC6]/30 dark:ring-[#0095F6]/40' : ''
            }`}
            title={cat.name}
          >
            <span>{cat.icon}</span>
          </button>
        ))}
      </div>

      {/* Emoji Grid */}
      <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-3 pr-1">
        {filteredCategories
          .filter((cat) => !search || activeCategory === cat.id)
          .map((cat) => (
            <div key={cat.id}>
              <p className="text-[11px] font-semibold text-gray-400 dark:text-[#A8A8A8] mb-1.5 px-1">{cat.name}</p>
              <div className="grid grid-cols-8 gap-1">
                {cat.emojis.map((emoji, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectEmoji(emoji);
                    }}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg hover:bg-gray-100 dark:hover:bg-[#363636] active:scale-95 transition cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
};

export default EmojiPickerPopover;
