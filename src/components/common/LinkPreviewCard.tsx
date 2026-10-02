import React from 'react';
import { ExternalLink, Globe } from 'lucide-react';
import { getLinkPreviewMetadata } from '../../utils/linkPreview';
import { useLanguage } from '../../contexts/LanguageContext';

interface LinkPreviewCardProps {
  url: string;
  className?: string;
}

export const LinkPreviewCard: React.FC<LinkPreviewCardProps> = ({ url, className = '' }) => {
  const { language } = useLanguage();
  const preview = getLinkPreviewMetadata(url, language);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(preview.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      onClick={handleClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          window.open(preview.url, '_blank', 'noopener,noreferrer');
        }
      }}
      className={`block mt-2 mb-3 bg-[#F8FAFC] dark:bg-[#0D1117] rounded-2xl border border-gray-200/80 dark:border-[#30363D] overflow-hidden hover:border-[#004AC6]/50 dark:hover:border-[#58A6FF]/50 transition-all duration-200 cursor-pointer group shadow-2xs ${className}`}
    >
      <div className="p-3.5 sm:p-4">
        {/* Site Name & Favicon Header */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {preview.favicon ? (
              <img
                src={preview.favicon}
                alt={preview.siteName}
                className="w-3.5 h-3.5 object-contain shrink-0 rounded-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            ) : (
              <Globe className="w-3.5 h-3.5 text-gray-400 dark:text-[#8B949E] shrink-0" />
            )}
            <span className="text-xs font-semibold text-gray-600 dark:text-[#8B949E] truncate">
              {preview.siteName || preview.domain}
            </span>
          </div>
          <ExternalLink className="w-3.5 h-3.5 text-gray-400 dark:text-[#8B949E] opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
        </div>

        {/* Title */}
        <h4 className="text-[14px] sm:text-[15px] font-bold text-[#004AC6] dark:text-[#58A6FF] group-hover:underline leading-snug line-clamp-2 mb-1.5 transition-colors">
          {preview.title}
        </h4>

        {/* Description */}
        <p className="text-[12.5px] sm:text-[13px] text-gray-600 dark:text-[#8B949E] leading-relaxed line-clamp-3 mb-3">
          {preview.description}
        </p>

        {/* Visual Banner Media */}
        {preview.imageUrl && (
          <div className="w-full rounded-xl overflow-hidden border border-gray-200/60 dark:border-[#21262D] bg-[#070913] relative aspect-[1.91/1] max-h-[340px] flex items-center justify-center">
            <img
              src={preview.imageUrl}
              alt={preview.title}
              className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300"
              loading="lazy"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default LinkPreviewCard;
