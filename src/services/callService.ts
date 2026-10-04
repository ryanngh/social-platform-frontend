import { chatApi } from './chatService';
import type { CallSnapshot, IceConfig } from '../types/call';
import chatSocket from './chatSocket';

export const callService = {
  config: async () => (await chatApi.get<{ enabled: boolean }>('/api/v1/calls/config')).data,
  ice: async (id: string): Promise<IceConfig> => (await chatApi.get<IceConfig>(`/api/v1/calls/${id}/ice-servers`, {
    headers: { 'X-Call-Session': chatSocket.callSessionId },
  })).data,
};

export async function captureCallMedia(wantVideo: boolean, options: {
  current: () => boolean;
  audioReady: (stream: MediaStream) => void;
  cameraUnavailable: () => Promise<boolean>;
}): Promise<MediaStream | null> {
  if (!navigator.mediaDevices?.getUserMedia) throw new Error('MEDIA_UNSUPPORTED');
  const audio = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true }, video: false });
  const stop = () => audio.getTracks().forEach(track => track.stop());
  if (!options.current()) { stop(); return null; }
  options.audioReady(audio);
  if (wantVideo) {
    try {
      const camera = await navigator.mediaDevices.getUserMedia({ audio: false, video: { width: { ideal: 1280, max: 1280 }, height: { ideal: 720, max: 720 }, frameRate: { ideal: 30, max: 30 } } });
      if (!options.current()) { camera.getTracks().forEach(track => track.stop()); stop(); return null; }
      camera.getVideoTracks().forEach(track => audio.addTrack(track));
    } catch {
      if (!options.current() || !await options.cameraUnavailable() || !options.current()) { stop(); return null; }
    }
  }
  return audio;
}

interface MediaCallbacks {
  remote: (stream: MediaStream) => void;
  connection: (state: RTCPeerConnectionState) => void;
  message?: (data: unknown) => void;
  dataChannelReady?: () => void;
}

/** One owner for peer negotiation. Caller always offers, including ICE restarts. */
export class CallPeer {
  private pc: RTCPeerConnection;
  private call: CallSnapshot;
  private isCaller: boolean;
  private negotiationId = '';
  private pendingIce = new Map<string, RTCIceCandidateInit[]>();
  private queue: Promise<void> = Promise.resolve();
  private audioSender: RTCRtpSender;
  private videoSender?: RTCRtpSender;
  private refreshTimer?: ReturnType<typeof setTimeout>;
  private closed = false;
  private remote = new MediaStream();
  private dataChannel?: RTCDataChannel;

  constructor(call: CallSnapshot, local: MediaStream, config: IceConfig, callbacks: MediaCallbacks, isCaller: boolean) {
    this.call = call; this.isCaller = isCaller;
    this.pc = new RTCPeerConnection({ iceServers: config.ice_servers });
    this.audioSender = this.pc.addTrack(local.getAudioTracks()[0], local);
    if (call.type === 'video') {
      const track = local.getVideoTracks()[0];
      this.videoSender = track ? this.pc.addTrack(track, local) : this.pc.addTransceiver('video', { direction: 'sendrecv' }).sender;
    }
    if (typeof this.pc.createDataChannel === 'function') {
      if (this.isCaller) {
        this.dataChannel = this.pc.createDataChannel('call_meta');
        this.setupDataChannel(this.dataChannel, callbacks);
      }
      this.pc.ondatachannel = ({ channel }) => {
        this.dataChannel = channel;
        this.setupDataChannel(this.dataChannel, callbacks);
      };
    }
    this.pc.ontrack = ({ track }) => {
      if (!this.remote.getTracks().some(t => t.id === track.id)) this.remote.addTrack(track);
      callbacks.remote(this.remote);
    };
    this.pc.onconnectionstatechange = () => callbacks.connection(this.pc.connectionState);
    this.pc.onicecandidate = ({ candidate }) => {
      if (candidate && this.negotiationId && !this.closed) chatSocket.sendCall('call.ice', {
        call_id: this.call.id, negotiation_id: this.negotiationId, candidate: candidate.toJSON(),
      });
    };
    this.scheduleRefresh(config);
  }

  private setupDataChannel(channel: RTCDataChannel, callbacks: MediaCallbacks) {
    channel.onopen = () => { callbacks.dataChannelReady?.(); };
    channel.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        callbacks.message?.(data);
      } catch {}
    };
  }

  sendMeta(data: unknown): boolean {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      try {
        this.dataChannel.send(JSON.stringify(data));
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  private serialize(task: () => Promise<void>): Promise<void> {
    const next = this.queue.then(() => { if (!this.closed) return task(); });
    this.queue = next.catch(() => {});
    return next;
  }

  get connected() { return this.pc.connectionState === 'connected'; }

  offer(restart = false): Promise<void> {
    return this.serialize(async () => {
      if (!this.isCaller) return;
      // Do not overwrite an offer while waiting for the current answer.
      if (restart && this.pc.signalingState === 'have-local-offer') await this.pc.setLocalDescription({ type: 'rollback' });
      if (this.pc.signalingState !== 'stable') return;
      this.negotiationId = crypto.randomUUID();
      if (restart) this.pc.restartIce();
      const offer = await this.pc.createOffer();
      if (this.closed) return;
      await this.pc.setLocalDescription(offer);
      if (!chatSocket.sendCall('call.signal', { call_id: this.call.id, signal: 'offer', sdp: offer.sdp, negotiation_id: this.negotiationId })) throw new Error('SIGNALING_DISCONNECTED');
    });
  }

  signal(signal: 'offer' | 'answer' | 'restart_request', sdp: string | undefined, id: string): Promise<void> {
    if (signal === 'restart_request') return this.offer(true);
    return this.serialize(async () => {
      if (signal === 'offer') {
        if (this.isCaller) return;
        this.negotiationId = id;
        await this.pc.setRemoteDescription({ type: 'offer', sdp });
        await this.flushIce(id);
        const answer = await this.pc.createAnswer();
        if (this.closed) return;
        await this.pc.setLocalDescription(answer);
        if (!chatSocket.sendCall('call.signal', { call_id: this.call.id, signal: 'answer', sdp: answer.sdp, negotiation_id: id })) throw new Error('SIGNALING_DISCONNECTED');
      } else if (this.isCaller && id === this.negotiationId && this.pc.signalingState === 'have-local-offer') {
        await this.pc.setRemoteDescription({ type: 'answer', sdp });
        await this.flushIce(id);
      }
    });
  }

  ice(candidate: RTCIceCandidateInit, id: string): Promise<void> {
    return this.serialize(async () => {
      if (id === this.negotiationId && this.pc.remoteDescription && this.pc.signalingState === 'stable') {
        await this.pc.addIceCandidate(candidate);
      } else {
        if (this.pendingIce.size >= 4 && !this.pendingIce.has(id)) return;
        const pending = this.pendingIce.get(id) || [];
        if (pending.length < 100) pending.push(candidate);
        this.pendingIce.set(id, pending);
      }
    });
  }

  private async flushIce(id: string) {
    const pending = this.pendingIce.get(id) || [];
    this.pendingIce.clear();
    for (const candidate of pending) { if (!this.closed) await this.pc.addIceCandidate(candidate); }
  }

  async restart() {
    if (this.isCaller) await this.offer(true);
    else chatSocket.sendCall('call.signal', { call_id: this.call.id, signal: 'restart_request', negotiation_id: crypto.randomUUID() });
  }

  async replace(kind: 'audio' | 'video', track: MediaStreamTrack) {
    if (this.closed) { track.stop(); return; }
    const sender = kind === 'audio' ? this.audioSender : this.videoSender;
    if (!sender) { track.stop(); throw new Error('INVALID_DEVICE'); }
    await sender.replaceTrack(track);
  }

  private scheduleRefresh(config: IceConfig) {
    clearTimeout(this.refreshTimer);
    this.refreshTimer = setTimeout(() => void this.refreshCredentials(), Math.max(1000, new Date(config.expires_at).getTime() - Date.now() - 15 * 60_000));
  }

  private async refreshCredentials() {
    if (this.closed) return;
    try {
      const next = await callService.ice(this.call.id);
      if (this.closed) return;
      this.pc.setConfiguration({ iceServers: next.ice_servers });
      this.scheduleRefresh(next);
      // Both peers refresh their credentials; only the caller creates the restart offer.
      await this.restart();
    } catch {
      if (!this.closed) { clearTimeout(this.refreshTimer); this.refreshTimer = setTimeout(() => void this.refreshCredentials(), 30_000); }
    }
  }

  close() {
    this.closed = true;
    clearTimeout(this.refreshTimer);
    try { this.dataChannel?.close(); } catch {}
    this.pc.ontrack = null; this.pc.onicecandidate = null; this.pc.onconnectionstatechange = null;
    this.pc.close(); this.remote.getTracks().forEach(track => track.stop()); this.pendingIce.clear();
  }
}
