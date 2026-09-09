import React from 'react';
import { Bookmark } from 'lucide-react';

interface BookmarkItem {
  id: string | number;
  title: string;
  subtitle: string;
}

export const ProfileBookmarksCard: React.FC<{ bookmarks?: BookmarkItem[] }> = ({ bookmarks = [] }) => {
  return (
    <section aria-labelledby="bookmarks-heading" className="bg-white border border-[#E2E2EC] rounded-xl p-5 shadow-card">
      <div className="flex items-center gap-2 mb-3.5">
        <Bookmark className="w-4 h-4 text-[#004AC6]" fill="#004AC6" />
        <h2 id="bookmarks-heading" className="text-xs font-bold text-[#1A1C1E] uppercase tracking-wider">
          Mục đã lưu
        </h2>
      </div>

      {bookmarks.length > 0 ? (
        <div className="space-y-3">
          {bookmarks.map((b) => (
            <div key={b.id} className="flex items-start gap-3 group cursor-pointer">
              <div className="w-8 h-8 rounded-lg bg-[#EDEDF8] flex items-center justify-center shrink-0 mt-0.5 text-[#004AC6] group-hover:bg-[#EFF4FF] transition">
                <Bookmark className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#1A1C1E] leading-snug group-hover:text-[#004AC6] transition truncate">
                  {b.title}
                </p>
                <p className="text-[11px] text-[#535F70] truncate">{b.subtitle}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-400 italic py-1">Chưa có bài viết hay mục nào được lưu</p>
      )}
    </section>
  );
};

export default ProfileBookmarksCard;
