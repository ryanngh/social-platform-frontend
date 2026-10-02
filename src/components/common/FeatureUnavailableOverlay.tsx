import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Home } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

interface FeatureUnavailableOverlayProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  badge?: string;
  icon?: React.ReactNode;
}

export const FeatureUnavailableOverlay: React.FC<FeatureUnavailableOverlayProps> = ({
  children,
  title,
  description,
  badge,
  icon,
}) => {
  const { t } = useLanguage();

  return (
    <div className="relative min-h-[75vh] w-full">
      {/* Blurred background content */}
      <div
        className="filter blur-[6px] pointer-events-none select-none opacity-40 dark:opacity-25 transition-all duration-300"
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Floating Centered Overlay Card */}
      <div className="absolute inset-0 z-20 flex items-start justify-center pt-16 sm:pt-24 px-4 pointer-events-none">
        <div className="sticky top-24 pointer-events-auto bg-white/85 dark:bg-[#121212]/90 backdrop-blur-xl border border-gray-200/80 dark:border-[#262626] rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl text-center space-y-4 animate-fadeIn">
          {/* Icon Badge */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr from-blue-600/15 via-indigo-600/10 to-purple-600/15 dark:from-blue-500/20 dark:to-purple-500/20 text-[#004AC6] dark:text-[#0095F6] border border-blue-500/20 flex items-center justify-center mx-auto shadow-inner">
            {icon ? icon : <Sparkles className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />}
          </div>

          {/* Texts */}
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-[#004AC6] dark:text-[#0095F6] border border-blue-200/60 dark:border-blue-800/40">
              <span className="w-1.5 h-1.5 rounded-full bg-[#004AC6] dark:bg-[#0095F6] animate-ping" />
              {badge || t('common.underDevelopmentBadge')}
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-[#F5F5F5] tracking-tight">
              {title || t('common.featureUnavailableTitle')}
            </h2>

            <p className="text-xs sm:text-sm text-gray-500 dark:text-[#A8A8A8] max-w-sm mx-auto leading-relaxed">
              {description || t('common.featureUnavailableDesc')}
            </p>
          </div>

          {/* Action Button */}
          <div className="pt-2 flex items-center justify-center">
            <Link
              to="/feed"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#004AC6] dark:bg-[#0095F6] text-white rounded-2xl text-xs sm:text-sm font-bold shadow-lg shadow-blue-500/20 hover:opacity-90 active:scale-95 transition cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>{t('common.backToHome')}</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeatureUnavailableOverlay;
