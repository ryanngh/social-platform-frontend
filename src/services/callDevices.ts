export type CallInputKind = 'audio' | 'video';

type OutputMediaDevices = MediaDevices & {
  selectAudioOutput?: (options?: { deviceId?: string }) => Promise<MediaDeviceInfo>;
};

export function callDeviceErrorKey(error: unknown): string {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  const message = error instanceof Error ? error.message : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'calls.devicePermissionError';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'calls.deviceMissingError';
  if (name === 'NotReadableError' || name === 'AbortError') return 'calls.deviceBusyError';
  if (name === 'InvalidModificationError') return 'calls.deviceFormatError';
  if (message === 'MEDIA_UNSUPPORTED' || message === 'OUTPUT_UNSUPPORTED') return 'calls.deviceUnsupportedError';
  return 'calls.deviceError';
}

/** Acquire and replace first; failed/canceled switches must preserve the current device. */
export async function switchCallInput(kind: CallInputKind, deviceId: string, options: {
  stream: MediaStream;
  current: () => boolean;
  enabled: () => boolean;
  replace: (kind: CallInputKind, track: MediaStreamTrack) => Promise<void> | undefined;
}): Promise<MediaStreamTrack | null> {
  if (!options.current()) return null;
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('MEDIA_UNSUPPORTED');
  const previous = options.stream.getTracks().filter(track => track.kind === kind);
  if (deviceId && previous.some(track => track.readyState === 'live' && track.getSettings().deviceId === deviceId)) return previous[0];
  const selected = deviceId ? { exact: deviceId } : undefined;
  const next = await navigator.mediaDevices.getUserMedia(kind === 'audio'
    ? { audio: { deviceId: selected, echoCancellation: true, noiseSuppression: true }, video: false }
    : { audio: false, video: { deviceId: selected, width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } } });
  const stop = () => next.getTracks().forEach(track => track.stop());
  if (!options.current()) { stop(); return null; }
  const track = next.getTracks().find(track => track.kind === kind);
  if (!track) { stop(); throw new DOMException('Requested input is unavailable', 'NotFoundError'); }
  track.enabled = options.enabled();
  try {
    const replacement = options.replace(kind, track);
    if (replacement) await replacement;
  } catch (error) { stop(); throw error; }
  if (!options.current()) { stop(); return null; }
  track.enabled = options.enabled();
  previous.forEach(old => { options.stream.removeTrack(old); old.stop(); });
  options.stream.addTrack(track);
  next.getTracks().filter(other => other !== track).forEach(other => other.stop());
  return track;
}

/** Invoked directly by the device picker, preserving browser user activation for permission. */
export async function switchCallOutput(element: HTMLAudioElement, deviceId: string, current: () => boolean): Promise<string | null> {
  if (!current()) return null;
  if (typeof element.setSinkId !== 'function') throw new Error('OUTPUT_UNSUPPORTED');
  let id = deviceId === 'default' ? '' : deviceId;
  if (element.sinkId === id) return id;
  const devices = navigator.mediaDevices as OutputMediaDevices | undefined;
  if (id && devices?.selectAudioOutput) {
    const authorized = await devices.selectAudioOutput({ deviceId: id });
    id = authorized.deviceId;
  }
  if (!current()) return null;
  await element.setSinkId(id);
  return current() ? id : null;
}
