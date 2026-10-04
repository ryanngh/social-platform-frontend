import { useEffect, useState } from 'react';
import { FlipHorizontal, SwitchCamera, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCall } from '../../contexts/CallContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { callDeviceErrorKey } from '../../services/callDevices';
import CallDialog from './CallDialog';

export default function CallSettingsModal() {
  const c = useCall(); const { t } = useLanguage();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [busy, setBusy] = useState(false);
  const mediaDevices = navigator.mediaDevices;
  const canEnumerate = typeof mediaDevices?.enumerateDevices === 'function';
  const canSelectOutput = typeof HTMLMediaElement.prototype.setSinkId === 'function';
  useEffect(() => {
    if (!canEnumerate) return;
    let alive = true;
    const load = () => { void mediaDevices.enumerateDevices().then(list => { if (alive) setDevices(list.filter(d => d.deviceId)); }).catch(error => { if (alive) toast.error(t(callDeviceErrorKey(error))); }); };
    load(); mediaDevices.addEventListener('devicechange', load);
    return () => { alive = false; mediaDevices.removeEventListener('devicechange', load); };
  }, [canEnumerate, mediaDevices, t]);
  const select = async (kind: 'audio' | 'video' | 'output', id: string) => {
    setBusy(true);
    try {
      if (kind === 'output') await c.changeOutputDevice(id);
      else await c.changeDevice(kind, id);
      if (canEnumerate) setDevices((await mediaDevices.enumerateDevices()).filter(d => d.deviceId));
    } catch (error) {
      console.warn('[call] device selection failed', { kind, name: error && typeof error === 'object' && 'name' in error ? error.name : 'UnknownError' });
      toast.error(t(callDeviceErrorKey(error)));
    } finally { setBusy(false); }
  };
  return <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
    <CallDialog label={t('calls.settings')} className="w-full max-w-md rounded-2xl border border-white/15 bg-[#18181E] p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-bold">{t('calls.settings')}</h2><button aria-label={t('calls.close')} onClick={() => c.setShowSettings(false)} className="rounded-full p-3 hover:bg-white/10"><X size={18} /></button></div>
      {!canEnumerate && <p role="alert" className="mb-4 text-sm text-amber-300">{t('calls.deviceUnsupportedError')}</p>}
      {(['audio', 'video'] as const).filter(kind => kind === 'audio' || c.type === 'video').map(kind => <label className="mb-4 block text-sm" key={kind}>{t(kind === 'audio' ? 'calls.microphone' : 'calls.camera')}
        <select disabled={busy || !canEnumerate || !c.localMediaStream} value={c.localMediaStream?.getTracks().find(track => track.kind === kind)?.getSettings().deviceId || ''} onChange={event => void select(kind, event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#23232B] p-3 disabled:opacity-40">
          <option value="">{t('calls.defaultDevice')}</option>
          {devices.filter(d => d.kind === (kind === 'audio' ? 'audioinput' : 'videoinput')).map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t('calls.device') + ' ' + (i + 1)}</option>)}
        </select>
      </label>)}
      {c.type === 'video' && (
        <div className="mb-4 rounded-xl border border-white/10 bg-white/[0.03] p-3.5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <FlipHorizontal size={18} className="text-gray-400 shrink-0" />
              <div>
                <p className="text-sm font-medium text-white">{t('calls.flipCamera')}</p>
                <p className="text-xs text-gray-400">{t('calls.flipCameraDesc')}</p>
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-label={t('calls.flipCamera')}
              aria-checked={c.isCameraFlipped}
              onClick={c.toggleFlipCamera}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                c.isCameraFlipped ? 'bg-blue-600' : 'bg-white/20'
              }`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  c.isCameraFlipped ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
          {devices.filter(d => d.kind === 'videoinput').length > 1 && (
            <div className="pt-2 border-t border-white/10 flex justify-end">
              <button
                type="button"
                onClick={() => void c.switchCameraDevice()}
                className="flex items-center gap-1.5 rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/20 active:scale-[0.98] transition-all"
              >
                <SwitchCamera size={14} />
                {t('calls.switchCamera')}
              </button>
            </div>
          )}
        </div>
      )}
      {canSelectOutput && canEnumerate ? <label className="block text-sm">{t('calls.speaker')}<select disabled={busy} value={c.outputDeviceId} onChange={event => void select('output', event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#23232B] p-3 disabled:opacity-40"><option value="">{t('calls.defaultDevice')}</option>{devices.filter(d => d.kind === 'audiooutput' && d.deviceId !== 'default').map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t('calls.device') + ' ' + (i + 1)}</option>)}</select></label> : <p className="text-sm text-gray-400">{t('calls.systemAudioOutput')}</p>}
    </CallDialog>
  </div>;
}
