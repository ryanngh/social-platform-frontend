import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, Flame, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTrendingHashtags } from '../../hooks/useTrending';
import type { TrendingHashtag } from '../../types';
import clsx from 'clsx';

// ============================================================
// Subcomponent: Trending Topic Item
// ============================================================
export interface TrendingTopicItemProps {
  trend: TrendingHashtag;
  rank: number;
}

export const TrendingTopicItem: React.FC<TrendingTopicItemProps> = ({ trend, rank }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();

  const handleHashtagClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/search?q=${encodeURIComponent('#' + trend.tag)}`);
  };

  const getRankBadgeClass = (pos: number) => {
    if (pos === 1) {
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-300/60 dark:border-amber-700/50';
    }
    if (pos === 2) {
      return 'bg-blue-100 text-[#004AC6] dark:bg-blue-950/60 dark:text-[#0095F6] border border-blue-300/60 dark:border-blue-700/50';
    }
    if (pos === 3) {
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border border-rose-300/60 dark:border-rose-700/50';
    }
    return 'bg-gray-100 text-gray-500 dark:bg-[#262626] dark:text-[#888888] border border-transparent';
  };

  return (
    <div
      onClick={handleHashtagClick}
      className="group flex items-center justify-between p-2 -mx-2 rounded-2xl cursor-pointer transition-all duration-150 hover:bg-gray-50 dark:hover:bg-[#1A1A1A]"
    >
      <div className="flex items-start gap-3 min-w-0">
        <span
          className={clsx(
            'w-5 h-5 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 mt-0.5',
            getRankBadgeClass(rank)
          )}
        >
          {rank}
        </span>

        <div className="leading-snug min-w-0">
          <p className="text-xs font-bold text-gray-900 dark:text-[#F5F5F5] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] transition-colors truncate">
            #{trend.tag}
          </p>
          <p className="text-[11px] text-gray-400 dark:text-[#A8A8A8] mt-0.5">
            {language === 'vi'
              ? `${trend.formattedCount} bài viết`
              : `${trend.formattedCount} posts`}
          </p>
        </div>
      </div>

      <ChevronRight className="w-3.5 h-3.5 text-gray-300 dark:text-[#525252] group-hover:text-[#004AC6] dark:group-hover:text-[#0095F6] group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
};

// ============================================================
// Main Reusable TrendingTopicsCard Component
// ============================================================
export interface TrendingTopicsCardProps {
  limit?: number;
  title?: string;
  showHeader?: boolean;
  className?: string;
}

export const TrendingTopicsCard: React.FC<TrendingTopicsCardProps> = ({
  limit = 5,
  title,
  showHeader = true,
  className,
}) => {
  const { t } = useLanguage();

  const {
    data: trendingHashtags,
    isLoading: isLoadingTrends,
  } = useTrendingHashtags(limit);

  return (
    <section
      aria-labelledby="trending-heading"
      className={clsx(
        'bg-white dark:bg-[#121212] rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-[#262626] transition-colors duration-200',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-rose-500 fill-rose-500/20" />
            <h4
              id="trending-heading"
              className="font-bold text-gray-900 dark:text-[#F5F5F5] text-sm"
            >
              {title || t('rightSidebar.trending', { defaultValue: 'Chủ đề thịnh hành' })}
            </h4>
          </div>
        </div>
      )}

      {isLoadingTrends ? (
        <div className="flex flex-col gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="w-5 h-5 rounded bg-gray-200 dark:bg-[#262626]" />
              <div className="space-y-1.5 flex-1">
                <div className="w-28 h-3 bg-gray-200 dark:bg-[#262626] rounded" />
                <div className="w-16 h-2.5 bg-gray-200 dark:bg-[#262626] rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : trendingHashtags && trendingHashtags.length > 0 ? (
        <div className="flex flex-col gap-1">
          {trendingHashtags.map((trend, idx) => (
            <TrendingTopicItem
              key={trend.id || `tr-${idx}`}
              trend={trend}
              rank={idx + 1}
            />
          ))}
        </div>
      ) : (
        <div className="py-5 text-center text-gray-400 dark:text-[#737373]">
          <TrendingUp className="w-7 h-7 mx-auto mb-2 text-gray-300 dark:text-[#525252] stroke-[1.5]" />
          <p className="text-xs text-gray-400 dark:text-[#737373]">
            {t('rightSidebar.noTrending', { defaultValue: 'Chưa có chủ đề thịnh hành' })}
          </p>
        </div>
      )}
    </section>
  );
};

export default TrendingTopicsCard;
