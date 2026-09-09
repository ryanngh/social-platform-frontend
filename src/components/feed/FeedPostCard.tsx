import React, { useState } from 'react';
import { 
  MessageSquare, 
  Repeat2, 
  Heart, 
  BarChart2, 
  Bookmark, 
  Share2, 
  MoreHorizontal 
} from 'lucide-react';
import toast from 'react-hot-toast';

export const ImageFeedPost: React.FC = () => {
  const [isLiked, setIsLiked] = useState(true);
  const [likeCount, setLikeCount] = useState(285);
  const [isBookmarked, setIsBookmarked] = useState(false);

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
    <article className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            alt="Maya Patel"
            className="w-10 h-10 rounded-full object-cover"
            src="https://images.unsplash.com/photo-1534447677768-be436bb09401?w=150&auto=format&fit=crop&q=80"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
            }}
          />
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <h4 className="font-bold text-gray-900 text-sm">Maya Patel</h4>
            </div>
            <p className="text-xs text-gray-400">@mayadesigns · 1 giờ</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition" title="Tùy chọn">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Post Content */}
      <p className="text-sm text-gray-800 mb-3">
        Building a design system, one component at a time. 🎨
      </p>

      {/* Media Attachment */}
      <div className="relative rounded-2xl overflow-hidden mb-3 border border-gray-100 bg-amber-50">
        <span className="absolute top-3 right-3 bg-black/60 backdrop-blur-sm text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full">
          1/5
        </span>
        <img
          alt="Workspace and coffee"
          className="w-full h-80 object-cover"
          src="https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&auto=format&fit=crop&q=80";
          }}
        />
        <div className="p-3 bg-white border-t border-gray-100 text-xs text-gray-600">
          <p className="italic text-[11px] text-gray-500 leading-relaxed">
            Morning essentials to start the day right! ☕✨ So productive with my brew from @elevatecoffee_co y favorite workspace. What's fueling your creativity today? #ElevateYourDay #CoffeeLover #WorkFromAnywhere #CafeVibes #MorningRoutine #Productivity #ElevateCoffeeCo
          </p>
        </div>
      </div>

      {/* Hashtags */}
      <p className="text-xs font-semibold text-[#004AC6] mb-4 hover:underline cursor-pointer">
        #DesignSystem
      </p>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium">
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
            onClick={() => toast.success('Đã sao chép liên kết bài viết!')}
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
    <article className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
      {/* Author Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <img
            alt="Tech Digest"
            className="w-10 h-10 rounded-full object-cover"
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
            }}
          />
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <h4 className="font-bold text-gray-900 text-sm">Tech Digest</h4>
            </div>
            <p className="text-xs text-gray-400">@techdigest · 4 giờ</p>
          </div>
        </div>
        <button className="text-gray-400 hover:text-gray-600 transition" title="Tùy chọn">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      <p className="text-sm text-gray-800 mb-4 font-normal">
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
              className={`relative overflow-hidden border rounded-2xl h-11 flex items-center px-4 justify-between bg-white cursor-pointer transition-all ${
                isSelected
                  ? 'border-[#004AC6] ring-1 ring-[#004AC6]'
                  : 'border-gray-200/80 hover:border-gray-300'
              }`}
            >
              <div
                className={`absolute inset-y-0 left-0 rounded-2xl transition-all duration-500 ${
                  isSelected ? 'bg-[#BFDBFE]' : option.percent === 62 ? 'bg-[#DBEAFE]' : 'bg-[#EFF6FF]'
                }`}
                style={{ width: `${option.percent}%` }}
              ></div>
              <span className={`relative z-10 text-xs ${isSelected ? 'font-bold text-[#004AC6]' : 'font-semibold text-gray-800'}`}>
                {option.label} {isSelected && '✓'}
              </span>
              <span className="relative z-10 text-xs font-bold text-gray-900">
                {option.percent}%
              </span>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-400 mb-4">
        {totalVotes.toLocaleString()} votes · 10 giờ còn lại
      </p>

      {/* Post Actions */}
      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-xs text-gray-500 font-medium">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => toast('Mở khung bình luận', { icon: '💬' })}
            className="flex items-center gap-1.5 hover:text-gray-800 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>16</span>
          </button>
          <button 
            onClick={() => toast.success('Đã chia sẻ lại bài viết')}
            className="flex items-center gap-1.5 hover:text-gray-800 transition"
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
          <div className="flex items-center gap-1.5 text-gray-500">
            <BarChart2 className="w-4 h-4" />
            <span>1.6K</span>
          </div>
        </div>

        <div className="flex items-center gap-3 text-gray-400">
          <button 
            onClick={() => {
              setIsBookmarked(!isBookmarked);
              toast(isBookmarked ? 'Đã bỏ lưu bài viết' : 'Đã lưu bài viết', { icon: '🔖' });
            }}
            className="hover:text-gray-600 transition"
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-[#004AC6] text-[#004AC6]' : ''}`} />
          </button>
          <button 
            onClick={() => toast.success('Đã sao chép liên kết!')}
            className="hover:text-gray-600 transition"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
};
