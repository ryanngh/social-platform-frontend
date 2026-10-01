import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

export interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  loadingText?: string;
  variant?: 'danger' | 'warning' | 'info' | 'primary';
  icon?: React.ReactNode;
  isLoading?: boolean;
  maxWidth?: string;
  children?: React.ReactNode;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText,
  cancelText,
  loadingText,
  variant = 'danger',
  icon,
  isLoading = false,
  maxWidth = 'max-w-sm',
  children,
}) => {
  const { t } = useLanguage();

  // Lock body scroll while modal is active
  useEffect(() => {
    if (!isOpen) return;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isLoading, onClose]);

  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return {
          iconBox:
            'bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-600 dark:text-amber-400',
          confirmBtn:
            'bg-amber-600 hover:bg-amber-700 active:scale-[0.98] text-white hover:shadow-amber-900/30',
        };
      case 'info':
      case 'primary':
        return {
          iconBox:
            'bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-[#004AC6] dark:text-[#0095F6]',
          confirmBtn:
            'bg-[#004AC6] hover:bg-[#003da6] dark:bg-[#0095F6] dark:hover:bg-[#1877F2] active:scale-[0.98] text-white hover:shadow-blue-900/30',
        };
      case 'danger':
      default:
        return {
          iconBox:
            'bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/40 text-rose-600 dark:text-rose-400',
          confirmBtn:
            'bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white hover:shadow-rose-900/30',
        };
    }
  };

  const styles = getVariantStyles();

  const modalContent = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby={description ? 'confirm-modal-desc' : undefined}
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
      onClick={() => {
        if (!isLoading) onClose();
      }}
    >
      <div
        className={`bg-white dark:bg-[#121212] rounded-3xl shadow-2xl border border-gray-100 dark:border-[#262626] w-full ${maxWidth} overflow-hidden flex flex-col p-6 text-center animate-in zoom-in-95 duration-150 relative transition-all`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-gray-400 dark:text-[#A8A8A8] hover:text-gray-600 dark:hover:text-[#F5F5F5] p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-[#262626] transition-colors cursor-pointer disabled:opacity-50"
          aria-label={t('postDetail.cancel', { defaultValue: 'Hủy' })}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon Container */}
        <div className="mx-auto mb-3.5 flex items-center justify-center">
          {icon ? (
            icon
          ) : (
            <div
              className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-xs ${styles.iconBox}`}
            >
              <AlertTriangle className="w-6 h-6 stroke-[1.8]" />
            </div>
          )}
        </div>

        {/* Title */}
        <h3
          id="confirm-modal-title"
          className="text-base sm:text-lg font-bold text-gray-900 dark:text-[#F5F5F5] leading-snug mb-1.5"
        >
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p
            id="confirm-modal-desc"
            className="text-xs sm:text-[13px] text-gray-500 dark:text-[#A8A8A8] leading-relaxed mb-4 max-w-xs mx-auto"
          >
            {description}
          </p>
        )}

        {/* Optional Custom Body / Snippet */}
        {children}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2.5 mt-2">
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`w-full py-2.5 px-4 font-semibold text-xs sm:text-sm rounded-2xl shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed hover:shadow-md min-h-[44px] ${styles.confirmBtn}`}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{loadingText || t('profile.loadingMore', { defaultValue: 'Đang xử lý...' })}</span>
              </>
            ) : (
              <span>{confirmText || t('postDetail.save', { defaultValue: 'Xác nhận' })}</span>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-[#1E1E1E] dark:hover:bg-[#2A2A2A] active:scale-[0.98] text-gray-700 dark:text-[#E5E5E5] font-semibold text-xs sm:text-sm rounded-2xl transition-all cursor-pointer disabled:opacity-50 min-h-[44px]"
          >
            {cancelText || t('postDetail.cancel', { defaultValue: 'Hủy' })}
          </button>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default ConfirmModal;
