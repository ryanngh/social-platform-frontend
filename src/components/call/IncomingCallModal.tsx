import { Phone, PhoneOff, Video } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl } from '../../utils/media';
import CallDialog from './CallDialog';
export default function IncomingCallModal() {
  const { type, partner, acceptCall, declineCall } = useCall();
  const { t } = useLanguage();
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
    <CallDialog label={t('calls.incoming')} className="w-full max-w-sm rounded-3xl border border-white/15 bg-[#141419] p-8 text-center text-white shadow-2xl">
      <p className="mb-5 text-sm text-gray-300">{t(type === 'video' ? 'calls.incomingVideo' : 'calls.incomingAudio')}</p>
      <img className="mx-auto mb-4 h-24 w-24 rounded-full object-cover" src={getAvatarUrl(partner?.avatarUrl)} alt="" />
      <h2 className="text-xl font-bold">{partner?.name || t('calls.user')}</h2>
      <div className="mt-7 flex justify-center gap-10">
        <button aria-label={t('calls.reject')} onClick={declineCall} className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 hover:bg-red-700"><PhoneOff /></button>
        <button aria-label={t('calls.accept')} onClick={() => void acceptCall()} className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 hover:bg-emerald-700">{type === 'video' ? <Video /> : <Phone />}</button>
      </div>
    </CallDialog>
  </div>;
}
