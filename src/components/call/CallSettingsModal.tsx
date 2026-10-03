import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';
import { useCall } from '../../contexts/CallContext';
import { useLanguage } from '../../contexts/LanguageContext';
import CallDialog from './CallDialog';
export default function CallSettingsModal() {
  const c = useCall(); const { t } = useLanguage();
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let alive = true;
    const load = () => { void navigator.mediaDevices.enumerateDevices().then(list => { if (alive) setDevices(list); }).catch(() => toast.error(t('calls.deviceError'))); };
    load(); navigator.mediaDevices.addEventListener('devicechange', load);
    return () => { alive = false; navigator.mediaDevices.removeEventListener('devicechange', load); };
  }, [t]);
  const select = async (kind: 'audio' | 'video', id: string) => { setBusy(true); try { await c.changeDevice(kind, id); } catch { toast.error(t('calls.deviceError')); } finally { setBusy(false); } };
  return <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 p-4">
    <CallDialog label={t('calls.settings')} className="w-full max-w-md rounded-2xl border border-white/15 bg-[#18181E] p-5 shadow-2xl">
      <div className="mb-5 flex items-center justify-between"><h2 className="font-bold">{t('calls.settings')}</h2><button aria-label={t('calls.close')} onClick={() => c.setShowSettings(false)} className="rounded-full p-3 hover:bg-white/10"><X size={18} /></button></div>
      {(['audio', 'video'] as const).filter(kind => kind === 'audio' || c.type === 'video').map(kind => <label className="mb-4 block text-sm" key={kind}>{t(kind === 'audio' ? 'calls.microphone' : 'calls.camera')}
        <select disabled={busy} value={c.localMediaStream?.getTracks().find(track => track.kind === kind)?.getSettings().deviceId || ''} onChange={event => void select(kind, event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#23232B] p-3">
          <option value="">{t('calls.defaultDevice')}</option>
          {devices.filter(d => d.kind === (kind === 'audio' ? 'audioinput' : 'videoinput')).map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t('calls.device') + ' ' + (i + 1)}</option>)}
        </select>
      </label>)}
      {'setSinkId' in HTMLMediaElement.prototype && <label className="block text-sm">{t('calls.speaker')}<select value={c.outputDeviceId} onChange={event => c.setOutputDeviceId(event.target.value)} className="mt-2 w-full rounded-xl border border-white/20 bg-[#23232B] p-3"><option value="">{t('calls.defaultDevice')}</option>{devices.filter(d => d.kind === 'audiooutput').map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || t('calls.device') + ' ' + (i + 1)}</option>)}</select></label>}
    </CallDialog>
  </div>;
}
