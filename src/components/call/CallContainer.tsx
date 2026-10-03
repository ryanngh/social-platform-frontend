import { useEffect, useRef, useState } from 'react';
import { useCall } from '../../contexts/CallContext';
import { useLanguage } from '../../contexts/LanguageContext';
import IncomingCallModal from './IncomingCallModal';
import ActiveCallModal from './ActiveCallModal';
import FloatingCallWidget from './FloatingCallWidget';
import toast from 'react-hot-toast';

export default function CallContainer() {
  const { status, viewMode, remoteMediaStream, outputDeviceId } = useCall();
  const { t } = useLanguage();
  const audio = useRef<HTMLAudioElement>(null);
  const [blocked, setBlocked] = useState(false);
  useEffect(() => {
    const element = audio.current;
    if (!element) return;
    element.srcObject = remoteMediaStream;
    if (remoteMediaStream) void element.play().then(() => setBlocked(false)).catch(() => setBlocked(true));

  }, [remoteMediaStream]);
  useEffect(() => {
    if (audio.current && 'setSinkId' in audio.current) void audio.current.setSinkId(outputDeviceId).catch(() => toast.error(t('calls.deviceError')));
  }, [outputDeviceId, t]);
  return <>
    <audio ref={audio} autoPlay />
    {blocked && remoteMediaStream && status !== 'idle' && <button className="fixed bottom-4 left-4 z-[80] rounded-xl bg-blue-600 px-4 py-3 text-white" onClick={() => { void audio.current?.play().then(() => setBlocked(false)).catch(() => toast.error(t('calls.enableAudio'))); }}>{t('calls.enableAudio')}</button>}
    {status === 'incoming' && <IncomingCallModal />}
    {!['idle', 'incoming'].includes(status) && (viewMode === 'floating' ? <FloatingCallWidget /> : <ActiveCallModal />)}
  </>;
}
