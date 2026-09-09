import React from 'react';
import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

const FeedAllCaughtUpState: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center my-2 flex flex-col items-center">
      {/* Blue Checkmark Badge */}
      <div className="w-16 h-16 bg-blue-50 text-[#004AC6] rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
        <Check className="w-8 h-8 stroke-[2.5]" />
      </div>

      {/* Heading & Subtitle */}
      <h3 className="text-base font-bold text-gray-900 mb-1.5">
        Bạn đã xem hết tin mới hôm nay! 🎉
      </h3>
      <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed mb-6">
        Bạn đã bắt kịp mọi bài viết từ bạn bè và các nhóm bạn tham gia trong 24 giờ qua.
      </p>

      {/* Action Buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap mb-6">
        <Link
          to="/saved"
          className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-5 py-2.5 rounded-2xl transition"
        >
          Xem các bài viết đã lưu
        </Link>
        <Link
          to="/explore"
          className="border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold px-5 py-2.5 rounded-2xl transition"
        >
          Khám phá chủ đề xu hướng
        </Link>
      </div>

      {/* Back to top Link */}
      <div className="w-full border-t border-gray-100 pt-4 flex justify-center">
        <button
          onClick={scrollToTop}
          className="text-xs font-semibold text-[#004AC6] hover:underline flex items-center gap-1 cursor-pointer"
        >
          Quay lại đầu trang ↑
        </button>
      </div>
    </div>
  );
};

export default FeedAllCaughtUpState;
