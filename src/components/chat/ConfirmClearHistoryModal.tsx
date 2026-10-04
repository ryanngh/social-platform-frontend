import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useChat } from '../../contexts/ChatContext';

interface ConfirmClearHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfirmClearHistoryModal: React.FC<ConfirmClearHistoryModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { t } = useLanguage();
  const { activeConversation, clearHistory } = useChat();
  const [isClearing, setIsClearing] = useState(false);

  if (!isOpen || !activeConversation) return null;

  const handleConfirm = async () => {
    setIsClearing(true);
    try {
      await clearHistory(activeConversation.id);
      onClose();
    } catch { /* ChatContext reports the failure; keep the dialog open for retry. */ } finally {
      setIsClearing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#121212] rounded-3xl max-w-sm w-full border border-gray-100 dark:border-[#262626] shadow-2xl p-5 overflow-hidden animate-scaleIn transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-[#262626] mb-4">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <Trash2 className="w-5 h-5" />
            <h3 className="font-bold text-base text-gray-900 dark:text-[#F5F5F5]">
              {t('messages.clearHistoryConfirm')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-2xl border border-amber-200/60 dark:border-amber-900/40 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              {t('messages.clearHistoryWarning')}
            </p>
          </div>

          <p className="text-xs text-gray-500 dark:text-[#A8A8A8]">
            {t('messages.clearHistoryPrompt', { name: activeConversation.displayName })}
          </p>
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-2xl text-xs font-semibold text-gray-600 dark:text-[#A8A8A8] hover:bg-gray-100 dark:hover:bg-[#262626] cursor-pointer transition"
          >
            {t('messages.cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isClearing}
            className="px-5 py-2 rounded-2xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 disabled:opacity-50 cursor-pointer transition flex items-center gap-1.5 shadow-sm shadow-rose-600/20"
          >
            {isClearing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>{t('messages.confirmClear')}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmClearHistoryModal;
