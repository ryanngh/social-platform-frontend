import React from 'react';
import { Plus } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getAvatarUrl, DEFAULT_AVATAR_FALLBACK } from '../../utils/media';

interface Story {
  id: number;
  name: string;
  avatar: string;
  gradient: string;
}

const StoriesCarousel: React.FC = () => {
  const { user } = useAuth();

  const stories: Story[] = [];

  return (
    <section className="bg-white rounded-3xl p-4 shadow-sm border border-gray-100 flex items-center overflow-x-auto custom-scrollbar">
      <div className="flex items-center gap-6 px-2 py-1 overflow-x-auto custom-scrollbar">
        {/* Story 1: Tạo tin */}
        <div className="flex flex-col items-center cursor-pointer flex-shrink-0 group">
          <div className="relative w-16 h-16">
            <img
              alt="Tạo tin"
              className="w-16 h-16 rounded-full object-cover border border-gray-100 shadow-sm group-hover:opacity-90 transition"
              src={getAvatarUrl(user?.avatarUrl)}
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
              }}
            />
            <div className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-[#004AC6] text-white flex items-center justify-center text-xs font-bold border-2 border-white shadow-sm">
              <Plus className="w-3 h-3 stroke-[3]" />
            </div>
          </div>
          <span className="text-xs font-medium text-gray-700 text-center mt-2">Tạo tin</span>
        </div>

        {/* Stories list */}
        {stories.map((story) => (
          <div key={story.id} className="flex flex-col items-center cursor-pointer flex-shrink-0 group">
            <div className={`p-[2.5px] rounded-full bg-gradient-to-tr ${story.gradient} shadow-sm group-hover:scale-105 transition-transform`}>
              <div className="p-0.5 bg-white rounded-full">
                <img
                  alt={story.name}
                  className="w-[58px] h-[58px] rounded-full object-cover"
                  src={story.avatar}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = DEFAULT_AVATAR_FALLBACK;
                  }}
                />
              </div>
            </div>
            <span className="text-xs font-medium text-gray-700 text-center mt-2">{story.name}</span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StoriesCarousel;
