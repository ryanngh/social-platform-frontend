import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MessageSquare, 
  Repeat2, 
  Heart, 
  BarChart2, 
  Bookmark, 
  Share2, 
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { copyToClipboard } from '../../utils/share';
import { DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

const MOCK_POST_IMAGES = [
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
];

export const ImageFeedPost: React.FC = () => {
  const [isLiked, setIsLiked] = useState(true);
  const [likeCount, setLikeCount] = useState(285);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  const toggleLike = () => {
    if (isLiked) {
      setIsLiked(false);
      setLikeCount((prev) => prev - 1);
    } else {
      setIsLiked(true);
      setLikeCount((prev) => prev + 1);
      toast('Đã thích bài viết', { icon: '❤️' });
    }
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast(isBookmarked ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết vào mục Đã lưu', {
      icon: isBookmarked ? '🗑️' : '🔖',
    });
  };

  return (
    <article className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to="/mayadesigns" className="flex-shrink-0 hover:opacity-90 transition cursor-pointer">
            <img
              alt="Maya Patel"
              className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-[#363636]"
              src={DEFAULT_AVATAR_FALLBACK}
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <Link to="/mayadesigns" className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer">
                Maya Patel
              </Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-[#A8A8A8]">
              <Link to="/mayadesigns" className="hover:underline hover:text-gray-700 dark:hover:text-[#F5F5F5] transition-colors cursor-pointer">
                @mayadesigns
              </Link>
              <span> · 1 giờ</span>
            </p>
          </div>
        </div>
        <button className="text-gray-400 dark:text-[#737373] hover:text-gray-600 dark:hover:text-[#F5F5F5] transition cursor-pointer" title="Tùy chọn">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <p className="text-sm text-gray-800 dark:text-[#E5E5E5] mb-3">
        Building a design system, one component at a time. 🎨
      </p>

      {/* Media Attachment (Instagram aspect ratio) */}
      <div className="relative rounded-2xl overflow-hidden mb-3 border border-gray-100 dark:border-[#262626] bg-amber-50 dark:bg-[#121212] aspect-square sm:aspect-[4/5] max-h-[580px] w-full flex flex-col justify-end select-none group">
        {/* Media Counter Badge */}
        <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full z-10 pointer-events-none">
          {activeImageIdx + 1}/{MOCK_POST_IMAGES.length}
        </span>

        {/* Previous Arrow */}
        {activeImageIdx > 0 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveImageIdx((prev) => Math.max(0, prev - 1));
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
            title="Ảnh trước"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Next Arrow */}
        {activeImageIdx < MOCK_POST_IMAGES.length - 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveImageIdx((prev) => Math.min(MOCK_POST_IMAGES.length - 1, prev + 1));
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-black/60 hover:bg-black/85 text-white flex items-center justify-center backdrop-blur-md shadow-lg border border-white/20 transition-all hover:scale-110 active:scale-95 cursor-pointer opacity-90 group-hover:opacity-100"
            title="Ảnh tiếp theo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        <div className="flex-1 w-full overflow-hidden relative">
          <img
            key={MOCK_POST_IMAGES[activeImageIdx]}
            alt="Workspace and coffee"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            src={MOCK_POST_IMAGES[activeImageIdx]}
            onError={(e) => {
              e.currentTarget.onerror = null;
              (e.currentTarget as HTMLElement).style.display = 'none';
            }}
          />

          {/* Dots Indicator */}
          <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1.5 z-10 pointer-events-none">
            {MOCK_POST_IMAGES.map((_, dotIdx) => (
              <div
                key={dotIdx}
                className={`rounded-full transition-all duration-200 ${
                  dotIdx === activeImageIdx
                    ? 'w-4 h-1.5 bg-white shadow-sm'
                    : 'w-1.5 h-1.5 bg-white/50 backdrop-blur-xs'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-3 bg-white dark:bg-[#121212] border-t border-gray-100 dark:border-[#262626] text-xs text-gray-600 dark:text-[#D4D4D4] flex-shrink-0 transition-colors">
          <p className="italic text-[11px] text-gray-500 dark:text-[#A8A8A8] leading-relaxed">
            Morning essentials to start the day right! ☕✨ So productive with my brew from @elevatecoffee_co y favorite workspace. What's fueling your creativity today? #ElevateYourDay #CoffeeLover #WorkFromAnywhere #CafeVibes #MorningRoutine #Productivity #ElevateCoffeeCo
          </p>
        </div>
      </div>

      {/* Hashtags */}
      <p className="text-xs font-semibold text-[#004AC6] dark:text-[#0095F6] mb-4 hover:underline cursor-pointer">
        #DesignSystem
      </p>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#262626] text-xs text-gray-500 dark:text-[#A8A8A8] font-medium">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => toast('Mở khung bình luận', { icon: '💬' })}
            className="flex items-center gap-1.5 hover:text-gray-800 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>42</span>
          </button>
          <button 
            onClick={() => toast.success('Đã chia sẻ lại bài viết')}
            className="flex items-center gap-1.5 hover:text-gray-800 transition"
          >
            <Repeat2 className="w-4 h-4" />
            <span>12</span>
          </button>
          <button 
            onClick={toggleLike}
            className={`flex items-center gap-1.5 transition ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1.5 text-gray-500">
            <BarChart2 className="w-4 h-4" />
            <span>12.5K</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <button onClick={toggleBookmark} className="hover:text-gray-600 transition" title="Lưu">
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#004AC6] text-[#004AC6]' : ''}`} />
          </button>
          <button 
            onClick={async () => {
              await copyToClipboard(`${window.location.origin}/posts/mock-image-post`);
              toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
            }}
            className="hover:text-gray-600 transition" 
            title="Chia sẻ"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};

export const PollFeedPost: React.FC = () => {
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [votes, setVotes] = useState([
    { id: 1, label: 'Design Systems', percent: 62 },
    { id: 2, label: 'AI in Design', percent: 24 },
    { id: 3, label: 'Web Performance', percent: 14 },
  ]);
  const [totalVotes, setTotalVotes] = useState(1245);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(32);
  const [isBookmarked, setIsBookmarked] = useState(false);

  const handleVote = (id: number) => {
    if (selectedOption !== null) return;
    setSelectedOption(id);
    setTotalVotes((prev) => prev + 1);
    setVotes((prev) =>
      prev.map((opt) =>
        opt.id === id ? { ...opt, percent: opt.percent + 1 } : opt
      )
    );
    toast.success('Đã bình chọn thành công!');
  };

  return (
    <article className="bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <Link to="/techdigest" className="flex-shrink-0 hover:opacity-90 transition cursor-pointer">
            <img
              alt="Tech Digest"
              className="w-10 h-10 rounded-full object-cover border border-gray-100 dark:border-[#363636]"
              src={DEFAULT_AVATAR_FALLBACK}
            />
          </Link>
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <Link to="/techdigest" className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm hover:underline hover:text-[#004AC6] dark:hover:text-[#0095F6] transition-colors cursor-pointer">
                Tech Digest
              </Link>
            </div>
            <p className="text-xs text-gray-400 dark:text-[#A8A8A8]">
              <Link to="/techdigest" className="hover:underline hover:text-gray-700 dark:hover:text-[#F5F5F5] transition-colors cursor-pointer">
                @techdigest
              </Link>
              <span> · 4 giờ</span>
            </p>
          </div>
        </div>
        <button className="text-gray-400 dark:text-[#737373] hover:text-gray-600 dark:hover:text-[#F5F5F5] transition cursor-pointer" title="Tùy chọn">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-800 dark:text-[#E5E5E5] mb-4 font-normal">
        Which topic should we cover next?
      </p>

      {/* Poll Bars */}
      <div className="flex flex-col gap-2.5 mb-3">
        {votes.map((option) => {
          const isSelected = selectedOption === option.id;
          return (
            <div
              key={option.id}
              onClick={() => handleVote(option.id)}
              className={`relative overflow-hidden border rounded-2xl h-11 flex items-center px-4 justify-between bg-white dark:bg-[#1A1A1A] cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#004AC6] dark:border-[#0095F6] ring-1 ring-[#004AC6] dark:ring-[#0095F6]'
                  : 'border-gray-200/80 dark:border-[#363636] hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-500 ${
                  isSelected
                    ? 'bg-[#BFDBFE] dark:bg-blue-900/60'
                    : option.percent === 62
                    ? 'bg-[#DBEAFE] dark:bg-blue-950/70'
                    : 'bg-[#EFF6FF] dark:bg-[#262626]/50'
                }`}
                style={{ width: `${option.percent}%` }}
              ></div>
              <span className={`relative z-10 text-xs ${isSelected ? 'font-bold text-[#004AC6] dark:text-[#0095F6]' : 'font-semibold text-gray-800 dark:text-[#E5E5E5]'}`}>
                {option.label} {isSelected && '✓'}
              </span>
              <span className="relative z-10 text-xs font-bold text-gray-900 dark:text-[#F5F5F5]">
                {option.percent}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 dark:text-[#A8A8A8] mb-4">
        {totalVotes.toLocaleString()} votes · 10 giờ còn lại
      </p>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-[#262626] text-xs text-gray-500 dark:text-[#A8A8A8] font-medium">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => toast('Mở khung bình luận', { icon: '💬' })}
            className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-[#F5F5F5] transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>16</span>
          </button>
          <button 
            onClick={() => toast.success('Đã chia sẻ lại bài viết')}
            className="flex items-center gap-1.5 hover:text-gray-800 dark:hover:text-[#F5F5F5] transition"
          >
            <Repeat2 className="w-4 h-4" />
            <span>3</span>
          </button>
          <button 
            onClick={() => {
              setIsLiked(!isLiked);
              setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
            }}
            className={`flex items-center gap-1.5 transition ${isLiked ? 'text-rose-500' : 'hover:text-rose-500'}`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            <span>{likeCount}</span>
          </button>
          <div className="flex items-center gap-1.5 text-gray-500 dark:text-[#A8A8A8]">
            <BarChart2 className="w-4 h-4" />
            <span>1.6K</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-400 dark:text-[#A8A8A8]">
          <button 
            onClick={() => {
              setIsBookmarked(!isBookmarked);
              toast(isBookmarked ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết', { icon: '🔖' });
            }}
            className="hover:text-gray-600 dark:hover:text-[#F5F5F5] transition"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#004AC6] text-[#004AC6]' : ''}`} />
          </button>
          <button 
            onClick={async () => {
              await copyToClipboard(`${window.location.origin}/posts/mock-poll-post`);
              toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
            }}
            className="hover:text-gray-600 dark:hover:text-[#F5F5F5] transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
