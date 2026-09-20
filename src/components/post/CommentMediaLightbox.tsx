import React, { useEffect } from 'react';
import { X, Download } from 'lucide-react';
import { getMediaUrl } from '../../utils/media';
import CustomVideoPlayer from '../media/CustomVideoPlayer';

interface CommentMediaLightboxProps {
  isOpen: boolean;
  onClose: () => void;
  media: {
    url: string;
    type: 'IMAGE' | 'VIDEO';
  } | null;
  authorName?: string;
}

export const CommentMediaLightbox: React.FC<CommentMediaLightboxProps> = ({
  isOpen,
  onClose,
  media,
  authorName,
}) => {
  // Listen for Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !media) return null;

  const resolvedUrl = getMediaUrl(media.url);
  const isVideo = media.type === 'VIDEO' || /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(media.url);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-black/85 backdrop-blur-md animate-fadeIn select-none"
      onClick={onClose}
    >
      {/* Top Action Bar (Close & Download) */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50 flex items-center gap-3">
        <a
          href={resolvedUrl}
          download
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          title="Tải xuống"
        >
          <Download className="w-5 h-5" />
        </a>

        <button
          type="button"
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-md transition hover:scale-105 active:scale-95 shadow-lg cursor-pointer"
          title="Đóng (Esc)"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Centered Media Content */}
      <div
        className="relative max-w-4xl max-h-[85vh] w-full flex items-center justify-center animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {isVideo ? (
          <div className="w-full max-h-[85vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black">
            <CustomVideoPlayer
              src={resolvedUrl}
              autoPlay
              title={authorName ? `Bình luận của ${authorName}` : undefined}
              className="max-h-[85vh] aspect-video w-full rounded-2xl"
            />
          </div>
        ) : (
          <img
            src={resolvedUrl}
            alt="Comment attachment"
            className="max-h-[85vh] max-w-full w-auto object-contain rounded-2xl shadow-2xl border border-white/10 transition-transform duration-200"
          />
        )}
      </div>
    </div>
  );
};

export default CommentMediaLightbox;
