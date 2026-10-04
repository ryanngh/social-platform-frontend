import { useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, PictureInPicture2, Maximize2, Minimize2, Settings, LayoutGrid, FlipHorizontal, SwitchCamera } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl } from '../../utils/media';
import CallVideo from './CallVideo';
import AudioVisualizer from './AudioVisualizer';
import CallSettingsModal from './CallSettingsModal';
import CallDialog from './CallDialog';

export default function ActiveCallModal() {
  const c = useCall();
  const { user } = useAuth();
  const { t } = useLanguage();
  const connected = c.status === 'connected' || c.status === 'reconnecting';
  const ended = c.status === 'ended';

  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number; moved: boolean } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const localVideoRef = useRef<HTMLDivElement | null>(null);

  const isTouchDevice = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  useEffect(() => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    navigator.mediaDevices.enumerateDevices().then(list => {
      setHasMultipleCameras(list.filter(d => d.kind === 'videoinput').length > 1);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setLocalPos(prev => {
        if (!prev || !containerRef.current || !localVideoRef.current) return prev;
        const container = containerRef.current.getBoundingClientRect();
        const box = localVideoRef.current.getBoundingClientRect();
        const maxX = Math.max(8, container.width - box.width - 8);
        const maxY = Math.max(8, container.height - box.height - 8);
        return {
          x: Math.max(8, Math.min(maxX, prev.x)),
          y: Math.max(8, Math.min(maxY, prev.y)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const key = (event: KeyboardEvent) => {
      if ((event.target as HTMLElement)?.closest('input,textarea,select') || c.showSettings || ended || c.status === 'preparing') return;
      if (event.key.toLowerCase() === 'm') c.toggleMute();
      if (event.key.toLowerCase() === 'v' && c.type === 'video') void c.toggleVideo();
      if (event.key.toLowerCase() === 'f' && c.type === 'video') c.toggleFlipCamera();
      if (event.key === 'Escape') c.setViewMode(c.viewMode === 'fullscreen' ? 'modal' : 'floating');
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [c, ended]);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (c.gridMode) return;
    if ((e.target as HTMLElement).closest('button')) return;
    const container = containerRef.current;
    const box = localVideoRef.current;
    if (!container || !box) return;

    const containerRect = container.getBoundingClientRect();
    const boxRect = box.getBoundingClientRect();

    const currentX = localPos ? localPos.x : (boxRect.left - containerRect.left);
    const currentY = localPos ? localPos.y : (boxRect.top - containerRect.top);

    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initX: currentX,
      initY: currentY,
      moved: false,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = dragRef.current;
    const container = containerRef.current;
    const box = localVideoRef.current;
    if (!d || !container || !box) return;

    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && (Math.abs(dx) > 3 || Math.abs(dy) > 3)) {
      d.moved = true;
    }

    const containerRect = container.getBoundingClientRect();
    const boxWidth = box.offsetWidth;
    const boxHeight = box.offsetHeight;

    const maxX = Math.max(8, containerRect.width - boxWidth - 8);
    const maxY = Math.max(8, containerRect.height - boxHeight - 8);

    const nextX = Math.max(8, Math.min(maxX, d.initX + dx));
    const nextY = Math.max(8, Math.min(maxY, d.initY + dy));

    setLocalPos({ x: nextX, y: nextY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (dragRef.current) {
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId);
        }
      } catch {}
      dragRef.current = null;
    }
  };

  const control = 'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 active:scale-95 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-blue-400 shrink-0 transition-transform';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-2 sm:p-6">
      <CallDialog
        label={t('calls.title')}
        className={
          'relative flex w-full flex-col overflow-hidden border border-white/10 bg-[#0C0D12] text-white shadow-2xl ' +
          (c.viewMode === 'fullscreen' ? 'h-full max-w-none' : 'h-[92vh] sm:h-[88vh] max-h-[760px] max-w-5xl rounded-2xl sm:rounded-3xl')
        }
      >
        <div className="flex items-center justify-between gap-3 p-3 sm:p-4">
          <div className="min-w-0">
            <h2 className="truncate font-bold">{c.partner?.name || t('calls.user')}</h2>
            <p aria-live="polite" className="text-xs sm:text-sm text-gray-300">
              {c.status === 'connected' ? c.formatDuration(c.duration) : t('calls.status.' + c.status)}
            </p>
          </div>
          <div className="flex gap-2">
            {c.type === 'video' && (
              <button
                className={control}
                aria-label={t('calls.grid')}
                aria-pressed={c.gridMode}
                onClick={() => c.setGridMode(!c.gridMode)}
              >
                <LayoutGrid size={18} />
              </button>
            )}
            <button className={control} aria-label={t('calls.minimize')} onClick={() => c.setViewMode('floating')}>
              <PictureInPicture2 size={18} />
            </button>
            <button
              className={control}
              aria-label={t('calls.fullscreen')}
              onClick={() => c.setViewMode(c.viewMode === 'fullscreen' ? 'modal' : 'fullscreen')}
            >
              {c.viewMode === 'fullscreen' ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>
          </div>
        </div>

        <div
          ref={containerRef}
          className={'relative flex-1 min-h-0 overflow-hidden ' + (c.gridMode && c.type === 'video' ? 'grid grid-cols-1 gap-3 p-3 md:grid-cols-2' : '')}
        >
          <div className="relative flex h-full min-h-0 items-center justify-center overflow-hidden rounded-2xl bg-[#111218]">
            {c.type === 'video' && c.remoteMediaStream && !c.partnerVideoOff ? (
              <CallVideo stream={c.remoteMediaStream} mirrored={c.partnerFlipped} className="h-full w-full object-contain" />
            ) : (
              <div className="w-full max-w-xs text-center">
                <img className="mx-auto mb-4 h-24 w-24 sm:h-28 sm:w-28 rounded-full object-cover" src={getAvatarUrl(c.partner?.avatarUrl)} alt="" />
                {connected && <AudioVisualizer stream={c.remoteMediaStream} isMuted={c.partnerMuted} />}
                {c.partnerMuted && <p className="text-sm text-gray-400">{t('calls.partnerMuted')}</p>}
              </div>
            )}
          </div>

          {c.type === 'video' && (
            <div
              ref={localVideoRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={
                c.gridMode
                  ? undefined
                  : localPos
                  ? { left: `${localPos.x}px`, top: `${localPos.y}px`, touchAction: 'none' }
                  : { touchAction: 'none' }
              }
              className={
                'group overflow-hidden rounded-2xl border border-white/20 bg-[#161720] shadow-2xl select-none ' +
                (c.gridMode
                  ? 'relative min-h-0'
                  : (localPos ? 'absolute z-20 cursor-grab active:cursor-grabbing ' : 'absolute bottom-3 right-3 z-20 cursor-grab active:cursor-grabbing ') +
                    'h-28 w-36 sm:h-36 sm:w-52')
              }
            >
              {c.localMediaStream && !c.isVideoOff ? (
                <div className="relative h-full w-full">
                  <CallVideo stream={c.localMediaStream} mirrored={c.isCameraFlipped} className="h-full w-full object-cover pointer-events-none" />
                  {/* Quick Action Buttons on thumbnail - Visible on mobile/touch, group-hover on desktop */}
                  <div className="absolute top-2 right-2 flex items-center gap-1.5 z-30 pointer-events-auto">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        c.toggleFlipCamera();
                      }}
                      title={t('calls.flipCamera')}
                      aria-label={t('calls.flipCamera')}
                      className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80 hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-blue-400 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <FlipHorizontal size={14} />
                    </button>
                    {(hasMultipleCameras || isTouchDevice) && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          void c.switchCameraDevice();
                        }}
                        title={t('calls.switchCamera')}
                        aria-label={t('calls.switchCamera')}
                        className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition hover:bg-black/80 hover:text-white active:scale-95 focus-visible:outline-2 focus-visible:outline-blue-400 opacity-90 sm:opacity-0 sm:group-hover:opacity-100"
                      >
                        <SwitchCamera size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-gray-400">
                  <VideoOff />
                  <span className="text-xs">{t('calls.cameraOff')}</span>
                </div>
              )}
            </div>
          )}

          {c.type === 'audio' && !ended && (
            <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 text-xs text-gray-400">
              <img className="h-7 w-7 rounded-full" src={getAvatarUrl(user?.avatarUrl)} alt="" />
              <span>{t('calls.you')}</span>
              <AudioVisualizer stream={c.localMediaStream} isMuted={c.isMuted} className="h-6 w-28" />
            </div>
          )}
        </div>

        {c.cameraFallback && (
          <div className="mx-4 mt-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-3 text-center">
            <p className="text-sm">{t('calls.cameraError')}</p>
            <button className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm" onClick={c.continueWithoutCamera}>
              {t('calls.continueAudio')}
            </button>
          </div>
        )}

        {ended && <p aria-live="polite" className="p-3 text-center text-sm text-gray-300">{t('calls.errors.' + (c.errorCode || 'completed'))}</p>}

        {!ended && (
          <div className="flex justify-center items-center gap-2 sm:gap-3 p-3 sm:p-4 overflow-x-auto">
            <button
              className={control + (c.isMuted ? ' bg-red-600' : '')}
              disabled={!c.localMediaStream || c.status === 'preparing'}
              aria-label={t('calls.microphone')}
              aria-pressed={!c.isMuted}
              onClick={c.toggleMute}
            >
              {c.isMuted ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            {c.type === 'video' && (
              <button
                className={control}
                disabled={!c.localMediaStream || c.cameraFallback || c.status === 'preparing'}
                aria-label={t('calls.camera')}
                aria-pressed={!c.isVideoOff}
                onClick={() => void c.toggleVideo()}
              >
                {c.isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}
              </button>
            )}
            {c.type === 'video' && (
              <button
                className={control + (c.isCameraFlipped ? ' text-blue-400 bg-white/20' : '')}
                disabled={!c.localMediaStream || c.isVideoOff || c.status === 'preparing'}
                aria-label={t('calls.flipCamera')}
                title={t('calls.flipCamera')}
                aria-pressed={c.isCameraFlipped}
                onClick={c.toggleFlipCamera}
              >
                <FlipHorizontal size={18} />
              </button>
            )}
            {c.type === 'video' && (hasMultipleCameras || isTouchDevice) && (
              <button
                className={control}
                disabled={!c.localMediaStream || c.isVideoOff || c.status === 'preparing'}
                aria-label={t('calls.switchCamera')}
                title={t('calls.switchCamera')}
                onClick={() => void c.switchCameraDevice()}
              >
                <SwitchCamera size={18} />
              </button>
            )}
            <button
              className={control}
              disabled={!c.localMediaStream || c.status === 'preparing'}
              aria-label={t('calls.settings')}
              onClick={() => c.setShowSettings(true)}
            >
              <Settings size={18} />
            </button>
            <button
              className={control + ' !bg-red-600 hover:!bg-red-700'}
              aria-label={t('calls.end')}
              onClick={c.endCall}
            >
              <PhoneOff size={18} />
            </button>
          </div>
        )}

        {c.showSettings && <CallSettingsModal />}
      </CallDialog>
    </div>
  );
}
