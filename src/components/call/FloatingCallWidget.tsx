import { useRef, useState } from 'react';
import { Maximize2, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { getAvatarUrl } from '../../utils/media';
import CallVideo from './CallVideo';
import AudioVisualizer from './AudioVisualizer';
export default function FloatingCallWidget() {
  const c = useCall(); const { t } = useLanguage();
  const preparing = c.status === 'preparing';
  const ended = c.status === 'ended';
  const [position, setPosition] = useState({ x: Math.max(8, window.innerWidth - 330), y: Math.max(8, window.innerHeight - 240) });
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  return <section aria-label={t('calls.title')} style={{ left: position.x, top: position.y }} className="fixed z-50 w-[300px] max-w-[calc(100vw-16px)] overflow-hidden rounded-2xl border border-white/20 bg-[#14141A] text-white shadow-2xl">
    <div style={{ touchAction: 'none' }} onPointerDown={e => { if ((e.target as HTMLElement).closest('button')) return; drag.current = { x: e.clientX, y: e.clientY, px: position.x, py: position.y }; e.currentTarget.setPointerCapture(e.pointerId); }} onPointerMove={e => { const d = drag.current; if (d) setPosition({ x: Math.max(8, Math.min(window.innerWidth - 308, d.px + e.clientX - d.x)), y: Math.max(8, Math.min(window.innerHeight - 220, d.py + e.clientY - d.y)) }); }} onPointerUp={() => { drag.current = null; }} className="flex cursor-move items-center justify-between gap-2 px-3 py-2">
      <div className="min-w-0"><p className="truncate text-sm font-bold">{c.partner?.name || t('calls.user')}</p><p aria-live="polite" className="text-xs text-gray-400">{c.status === 'connected' ? c.formatDuration(c.duration) : t('calls.status.' + c.status)}</p></div>
      <button aria-label={t('calls.expand')} onClick={() => c.setViewMode('modal')} className="rounded-full p-3 hover:bg-white/10"><Maximize2 size={18} /></button>
    </div>
    <div className="flex h-32 items-center justify-center bg-black/30">
      {c.type === 'video' && c.remoteMediaStream && !c.partnerVideoOff ? <CallVideo stream={c.remoteMediaStream} className="h-full w-full object-contain" /> : <><img className="h-14 w-14 rounded-full" src={getAvatarUrl(c.partner?.avatarUrl)} alt="" /><AudioVisualizer stream={c.remoteMediaStream} isMuted={c.partnerMuted} className="h-10 w-32" /></>}
    </div>
    {ended ? <p aria-live="polite" className="p-3 text-center text-sm text-gray-300">{t('calls.errors.' + (c.errorCode || 'completed'))}</p> : <div className="flex justify-center gap-3 p-2">
      <button aria-label={t('calls.microphone')} aria-pressed={!c.isMuted} disabled={!c.localMediaStream || preparing} onClick={c.toggleMute} className="rounded-full p-3 hover:bg-white/10 disabled:opacity-40">{c.isMuted ? <MicOff size={18} /> : <Mic size={18} />}</button>
      {c.type === 'video' && <button aria-label={t('calls.camera')} aria-pressed={!c.isVideoOff} disabled={!c.localMediaStream || preparing || c.cameraFallback} onClick={() => void c.toggleVideo()} className="rounded-full p-3 hover:bg-white/10 disabled:opacity-40">{c.isVideoOff ? <VideoOff size={18} /> : <Video size={18} />}</button>}
      <button aria-label={t('calls.end')} onClick={c.endCall} className="rounded-full bg-red-600 p-3 hover:bg-red-700"><PhoneOff size={18} /></button>
    </div>}
    {c.cameraFallback && <button className="w-full bg-blue-600 p-3 text-sm" onClick={c.continueWithoutCamera}>{t('calls.continueAudio')}</button>}
  </section>;
}
