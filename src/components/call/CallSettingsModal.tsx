import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
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
      {canSelectOutput && canEnumerate ? <label className="block text-sm">{t('calls.speaker')}<select disabled={busy} value={c.outputDeviceId} onChange={event => void select('output', event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#23232B] p-3 disabled:opacity-40"><option value="">{t('calls.defaultDevice')}</option>{devices.filter(d => d.kind === 'audiooutput' && d.deviceId !== 'default').map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t('calls.device') + ' ' + (i + 1)}</option>)}</select></label> : <p className="text-sm text-gray-400">{t('calls.systemAudioOutput')}</p>}
    </CallDialog>
  </div>;
}
