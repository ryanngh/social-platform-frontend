import { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { relationshipService } from '../../services/relationshipService';
import { securityError } from '../../services/accountSecurity';
import type { ChatConversationItem } from '../../types/chat';
export function ChatBlockButton({ conversation }: { conversation: ChatConversationItem }) {
  const { t } = useLanguage(); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  if (conversation.type !== 'DM' || !conversation.partner || conversation.partnerDeleted) return null;
  const toggle = async () => {
    if (!conversation.blockedByMe && !window.confirm(t('security.blockConfirmation'))) return;
    setBusy(true); setError('');
    try { if (conversation.blockedByMe) await relationshipService.unblockUser(conversation.partner!.id); else await relationshipService.blockUser(conversation.partner!.id); }
    catch (e) { setError(securityError(e)); } finally { setBusy(false); }
  };
  return <div><button disabled={busy} type="button" onClick={() => void toggle()} className="px-3 py-2 text-[13px] font-semibold rounded-xl border border-gray-300 dark:border-gray-600 text-red-600 dark:text-red-400">{conversation.blockedByMe ? t('security.unblock') : t('messages.blockUser')}</button>{error && <p role="alert" className="text-red-600 text-[13px]">{error}</p>}</div>;
}
export default function ChatBlockNotice({ conversation }: { conversation: ChatConversationItem }) {
  const { t } = useLanguage();
  if (conversation.canMessage !== false) return null;
  return <div role="status" className="p-3 text-center border-t border-gray-200 dark:border-gray-700 text-[13px] space-y-2"><p>{conversation.blockedByMe ? t('security.blockedByMe') : conversation.blockedByOther ? t('security.blockedByOther') : t('security.unavailableAccount')}</p>{conversation.blockedByMe && <ChatBlockButton conversation={conversation} />}</div>;
}
