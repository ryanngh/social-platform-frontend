import React from 'react';
import { WifiOff, RotateCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface FeedNetworkErrorStateProps {
  onRetry?: () => void;
}

const FeedNetworkErrorState: React.FC<FeedNetworkErrorStateProps> = ({ onRetry }) => {
  const [retrying, setRetrying] = React.useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (onRetry) {
        onRetry();
      } else {
        toast.success('Đã kết nối lại thành công!');
      }
    }, 800);
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 sm:p-12 text-center flex flex-col items-center">
      {/* Slashed wifi icon */}
      <div className="bg-amber-50 text-amber-500 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6 shadow-sm">
        <WifiOff className="w-10 h-10 text-amber-500 stroke-[1.75]" />
      </div>

      {/* Heading & Subtitle */}
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Không thể kết nối đến máy chủ
      </h3>
      <p className="text-sm text-gray-500 max-w-md mx-auto mb-4 leading-relaxed">
        Đã xảy ra sự cố khi tải dữ liệu bài viết mới. Vui lòng kiểm tra lại đường truyền internet của bạn hoặc thử lại sau vài phút.
      </p>

      {/* Error code badge */}
      <span className="inline-block px-3 py-1 bg-gray-100 text-gray-500 text-xs font-medium rounded-full mb-6">
        Mã lỗi: ERR_NETWORK_CONNECTION_TIMEOUT
      </span>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-3 flex-wrap">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="flex items-center gap-2 bg-[#004AC6] text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-sm hover:bg-blue-700 disabled:opacity-60 transition cursor-pointer"
        >
          <RotateCw className={`w-4 h-4 ${retrying ? 'animate-spin' : ''}`} />
          <span>{retrying ? 'Đang kết nối lại...' : 'Thử lại ngay'}</span>
        </button>
        <button
          onClick={() => toast('Tất cả hệ thống đang hoạt động bình thường (99.98% uptime)', { icon: '🟢' })}
          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition cursor-pointer"
        >
          Kiểm tra trạng thái hệ thống
        </button>
      </div>
    </div>
  );
};

export default FeedNetworkErrorState;
