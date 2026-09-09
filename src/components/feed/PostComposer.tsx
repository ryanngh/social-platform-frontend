import React from 'react';
import { Image, ImagePlay, Smile, Globe, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface PostComposerProps {
  onOpenCreateModal: () => void;
}

const PostComposer: React.FC<PostComposerProps> = ({ onOpenCreateModal }) => {
  const { user } = useAuth();

  const firstName = user?.firstName || user?.username || 'bạn';

  return (
    <article className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100">
      <div className="flex items-center gap-3 mb-3">
        <img
          alt={firstName}
          className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm"
          src={getAvatarUrl(user?.avatarUrl)}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
          }}
        />
        <input
          className="flex-1 text-sm bg-transparent border-none focus:ring-0 text-gray-800 placeholder-gray-400 py-1 cursor-pointer outline-none"
          placeholder={`Bạn đang nghĩ gì, ${firstName}?`}
          type="text"
          readOnly
          onClick={onOpenCreateModal}
        />
      </div>

      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-1 sm:gap-3">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition"
          >
            <ImagePlay className="w-4 h-4 text-emerald-500" />
            <span>Ảnh/Video</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition"
          >
            <Image className="w-4 h-4 text-blue-500" />
            <span>Album</span>
          </button>
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded-xl transition"
          >
            <Smile className="w-4 h-4 text-amber-500" />
            <span>Cảm xúc</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-1 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-full font-medium transition"
          >
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            <span>Công khai</span>
            <ChevronDown className="w-3 h-3 text-gray-400" />
          </button>
          <button
            onClick={onOpenCreateModal}
            className="bg-[#004AC6] hover:bg-blue-700 text-white font-medium text-xs px-5 py-1.5 rounded-full transition shadow-sm"
          >
            Đăng
          </button>
        </div>
      </div>
    </article>
  );
};

export default PostComposer;
