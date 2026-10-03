import { Phone, Video } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { callDuration, callPreview } from '../../utils/callHistory';
import type { CallSummary } from '../../types/call';
import type { ChatConversationItem } from '../../types/chat';
export default function CallHistoryCard({ call, conversation, createdAt }: { call: CallSummary; conversation: ChatConversationItem; createdAt: string }) {
  const c = useCall(); const { user } = useAuth(); const { t } = useLanguage();
  const partner = conversation.partner;
  return <div className="my-3 flex justify-center"><div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-800 dark:border-white/10 dark:bg-[#202020] dark:text-gray-200">
    <div className="flex items-center gap-3">{call.type === 'video' ? <Video size={20} aria-hidden="true" /> : <Phone size={20} aria-hidden="true" />}<div><p>{callPreview(call, user?.id || '', t)}</p><p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{call.connected_at && c.formatDuration(callDuration(call)) + ' · '}{new Date(createdAt).toLocaleString()}</p></div></div>
    {c.enabled && conversation.type === 'DM' && <button disabled={!c.ready || !['idle', 'ended'].includes(c.status)} onClick={() => void c.startCall(conversation.id, call.type, partner ? { id: partner.id, name: partner.displayName, avatarUrl: partner.avatarUrl || '' } : undefined)} className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-40">{t('calls.callBack')}</button>}
  </div></div>;
}
