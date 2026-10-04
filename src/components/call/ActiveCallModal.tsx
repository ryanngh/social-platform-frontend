import { useEffect } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, PictureInPicture2, Maximize2, Minimize2, Settings, LayoutGrid, FlipHorizontal } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl } from '../../utils/media';
import CallVideo from './CallVideo';
import AudioVisualizer from './AudioVisualizer';
import CallSettingsModal from './CallSettingsModal';
import CallDialog from './CallDialog';
export default function ActiveCallModal() {
  const c = useCall(); const { user } = useAuth(); const { t } = useLanguage();
  const connected = c.status === 'connected' || c.status === 'reconnecting';
  const ended = c.status === 'ended';
  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input,textarea,select') || c.showSettings || ended || c.status === 'preparing') return;
      if (event.key.toLowerCase() === 'm') c.toggleMute();
      if (event.key.toLowerCase() === 'v' && c.type === 'video') void c.toggleVideo();
      if (event.key.toLowerCase() === 'f' && c.type === 'video') c.toggleFlipCamera();
      if (event.key === 'Escape') c.setViewMode(c.viewMode === 'fullscreen' ? 'modal' : 'floating');
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, [c, ended]);
  const control = 'flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-400';
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-6">
    <CallDialog label={t('calls.title')} className={'relative flex w-full flex-col overflow-hidden border border-white/10 bg-[#0C0D12] text-white shadow-2xl ' + (c.viewMode === 'fullscreen' ? 'h-full max-w-none' : 'h-[88vh] max-h-[760px] max-w-5xl rounded-3xl')}>
      <div className="flex items-center justify-between gap-3 p-4">
        <div className="min-w-0"><h2 className="truncate font-bold">{c.partner?.name || t('calls.user')}</h2>
          <p aria-live="polite" className="text-sm text-gray-300">{c.status === 'connected' ? c.formatDuration(c.duration) : t('calls.status.' + c.status)}</p>
        </div>
        <div className="flex gap-2">
          {c.type === 'video' && <button className={control} aria-label={t('calls.grid')} aria-pressed={c.gridMode} onClick={() => c.setGridMode(!c.gridMode)}><LayoutGrid size={18} /></button>}
          <button className={control} aria-label={t('calls.minimize')} onClick={() => c.setViewMode('floating')}><PictureInPicture2 size={18} /></button>
          <button className={control} aria-label={t('calls.fullscreen')} onClick={() => c.setViewMode(c.viewMode === 'fullscreen' ? 'modal' : 'fullscreen')}>{c.viewMode === 'fullscreen' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}</button>
        </div>
      </div>
      <div className={'relative flex-1 min-h-0 ' + (c.gridMode && c.type === 'video' ? 'grid grid-cols-1 gap-3 p-3 md:grid-cols-2' : '')}>
        <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl bg-[#111218]">
          {c.type === 'video' && c.remoteMediaStream && !c.partnerVideoOff ? <CallVideo stream={c.remoteMediaStream} className="h-full w-full object-contain" /> :
            <div className="w-full max-w-xs text-center"><img className="mx-auto mb-4 h-28 w-28 rounded-full object-cover" src={getAvatarUrl(c.partner?.avatarUrl)} alt="" />
              {connected && <AudioVisualizer stream={c.remoteMediaStream} isMuted={c.partnerMuted} />}
              {c.partnerMuted && <p className="text-sm text-gray-400">{t('calls.partnerMuted')}</p>}
            </div>}
        </div>
        {c.type === 'video' && <div className={'group relative overflow-hidden rounded-2xl border border-white/15 bg-[#161720] ' + (c.gridMode ? 'min-h-0' : 'absolute bottom-3 right-3 h-28 w-36 sm:h-36 sm:w-52')}>
          {c.localMediaStream && !c.isVideoOff ? (
            <>
              <CallVideo stream={c.localMediaStream} mirrored={c.isCameraFlipped} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={c.toggleFlipCamera}
                title={t('calls.flipCamera')}
                aria-label={t('calls.flipCamera')}
                className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white/80 opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/80 hover:text-white group-hover:opacity-100 focus:opacity-100 focus-visible:outline-2 focus-visible:outline-blue-400"
              >
                <FlipHorizontal size={14} />
              </button>
            </>
          ) : <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400"><VideoOff /><span className="text-xs">{t('calls.cameraOff')}</span></div>}
        </div>}
        {c.type === 'audio' && !ended && <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-gray-400"><img className="h-7 w-7 rounded-full" src={getAvatarUrl(user?.avatarUrl)} alt="" /><span>{t('calls.you')}</span><AudioVisualizer stream={c.localMediaStream} isMuted={c.isMuted} className="h-6 w-28" /></div>}
      </div>
      {c.cameraFallback && <div className="mx-4 mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-center"><p className="text-sm">{t('calls.cameraError')}</p><button className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm" onClick={c.continueWithoutCamera}>{t('calls.continueAudio')}</button></div>}
      {ended && <p aria-live="polite" className="p-3 text-center text-sm text-gray-300">{t('calls.errors.' + (c.errorCode || 'completed'))}</p>}
      {!ended && <div className="flex justify-center gap-3 p-4">
        <button className={control + (c.isMuted ? ' bg-red-600' : '')} disabled={!c.localMediaStream || c.status === 'preparing'} aria-label={t('calls.microphone')} aria-pressed={!c.isMuted} onClick={c.toggleMute}>{c.isMuted ? <MicOff /> : <Mic />}</button>
        {c.type === 'video' && <button className={control} disabled={!c.localMediaStream || c.cameraFallback || c.status === 'preparing'} aria-label={t('calls.camera')} aria-pressed={!c.isVideoOff} onClick={() => void c.toggleVideo()}>{c.isVideoOff ? <VideoOff /> : <Video />}</button>}
        <button className={control} disabled={!c.localMediaStream || c.status === 'preparing'} aria-label={t('calls.settings')} onClick={() => c.setShowSettings(true)}><Settings /></button>
        <button className={control + ' !bg-red-600 hover:!bg-red-700'} aria-label={t('calls.end')} onClick={c.endCall}><PhoneOff /></button>
      </div>}
      {c.showSettings && <CallSettingsModal />}
    </CallDialog>
  </div>;
}
