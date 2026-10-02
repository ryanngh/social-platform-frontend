import React from 'react';

interface BrandLoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export const BrandLoadingScreen: React.FC<BrandLoadingScreenProps> = ({
  message,
  fullScreen = true,
}) => {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-[#FAFAFB] dark:bg-[#000000] transition-colors duration-200 ${
        fullScreen ? 'min-h-screen fixed inset-0 z-[9999]' : 'w-full py-16'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated Brand Logo Container */}
        <div className="relative flex items-center justify-center">
          {/* Subtle glowing ring pulse behind logo */}
          <div className="absolute w-20 h-20 rounded-full bg-[#004AC6]/15 dark:bg-[#0095F6]/20 animate-ping" />
          <div className="relative w-16 h-16 rounded-2xl bg-white dark:bg-[#121212] p-2.5 shadow-md border border-gray-100 dark:border-[#262626] flex items-center justify-center">
            <img
              src="/logo.svg"
              alt="RySocial"
              className="w-full h-full object-contain animate-pulse drop-shadow-xs"
            />
          </div>
        </div>

        {/* Brand Name */}
        <div className="flex flex-col items-center gap-1.5 mt-1">
          <span className="text-xl font-extrabold tracking-tight text-[#004AC6] dark:text-[#0095F6]">
            RySocial
          </span>
          {message && (
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 animate-pulse">
              {message}
            </p>
          )}
        </div>

        {/* Smooth Linear Progress Bar Indicator */}
        <div className="w-32 h-1 bg-gray-200 dark:bg-[#262626] rounded-full overflow-hidden relative mt-1">
          <div className="h-full bg-gradient-to-r from-[#004AC6] to-[#0095F6] rounded-full absolute inset-y-0 w-1/2 animate-[shimmer_1.4s_ease-in-out_infinite]" />
        </div>
      </div>
    </div>
  );
};

export default BrandLoadingScreen;
