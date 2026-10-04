import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { formatCallDuration } from '../utils/callDuration';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import type { CallParticipant, CallSnapshot, CallStatus, CallType, CallViewMode } from '../types/call';
import { CallPeer, callService, captureCallMedia } from '../services/callService';
import { switchCallInput, switchCallOutput } from '../services/callDevices';
import chatSocket from '../services/chatSocket';
import { userService } from '../services/userService';
import { startOutgoingDialTone, startIncomingRingtone, playCallConnectedSound, playCallEndedSound, stopCallSounds } from '../utils/callSounds';

interface CallContextType {
  enabled: boolean; ready: boolean; status: CallStatus; type: CallType; viewMode: CallViewMode;
  partner: CallParticipant | null; call: CallSnapshot | null; duration: number;
  isMuted: boolean; isVideoOff: boolean; partnerMuted: boolean; partnerVideoOff: boolean;
  localMediaStream: MediaStream | null; remoteMediaStream: MediaStream | null;
  showSettings: boolean; gridMode: boolean; outputDeviceId: string;
  cameraFallback: boolean; errorCode: string | null;
  startCall: (conversationId: string, type: CallType, partner?: CallParticipant) => Promise<void>;
  acceptCall: () => Promise<void>; declineCall: () => void; endCall: () => void;
  toggleMute: () => void; toggleVideo: () => Promise<void>;
  changeDevice: (kind: 'audio' | 'video', deviceId: string) => Promise<void>;
  changeOutputDevice: (id: string) => Promise<void>; registerAudioElement: (element: HTMLAudioElement | null) => void; setShowSettings: (open: boolean) => void;
  setGridMode: (grid: boolean) => void; setViewMode: (mode: CallViewMode) => void;
  isCameraFlipped: boolean;
  partnerFlipped: boolean;
  toggleFlipCamera: () => void;
  switchCameraDevice: () => Promise<void>;
  continueWithoutCamera: () => void; formatDuration: (seconds: number) => string;
}
const CallContext = createContext<CallContextType | undefined>(undefined);
// eslint-disable-next-line react-refresh/only-export-components
export const useCall = () => { const value = useContext(CallContext); if (!value) throw new Error('CallProvider missing'); return value; };


export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [enabled, setEnabled] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [status, setStatus] = useState<CallStatus>('idle');
  const [type, setType] = useState<CallType>('audio');
  const [viewMode, setViewMode] = useState<CallViewMode>('modal');
  const [call, setCall] = useState<CallSnapshot | null>(null);
  const [partner, setPartner] = useState<CallParticipant | null>(null);
  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);
  const [remoteMediaStream, setRemoteMediaStream] = useState<MediaStream | null>(null);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [gridMode, setGridMode] = useState(false);
  const [outputDeviceId, setOutputDeviceId] = useState('');
  const [cameraFallback, setCameraFallback] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [isCameraFlipped, setIsCameraFlipped] = useState<boolean>(() => {
    try {
      const stored = localStorage.getItem('call_flip_camera');
      return stored !== null ? stored === 'true' : true;
    } catch {
      return true;
    }
  });
  const [partnerFlipped, setPartnerFlipped] = useState(false);
  const isCameraFlippedRef = useRef(isCameraFlipped);
  isCameraFlippedRef.current = isCameraFlipped;
  const active = useRef<CallSnapshot | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);
  const peer = useRef<CallPeer | null>(null);
  const peerStarting = useRef<Promise<void> | null>(null);
  const generation = useRef(0);
  const request = useRef<string | null>(null);
  const canceledRequests = useRef(new Set<string>());
  const fallback = useRef<((ok: boolean) => void) | null>(null);
  const recovery = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const invitation = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const resetTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pendingEnd = useRef<{ id: string; type: 'call.cancel' | 'call.reject' | 'call.end' } | null>(null);
  const mutedRef = useRef(false);
  const videoOffRef = useRef(true);
  const statusRef = useRef<CallStatus>('idle');
  const beforeReconnect = useRef<CallStatus>('idle');

  const changeStatus = useCallback((next: CallStatus) => { statusRef.current = next; setStatus(next); }, []);
  const cleanup = useCallback(() => {
    generation.current++; fallback.current?.(false); fallback.current = null;
    clearTimeout(recovery.current); recovery.current = undefined; clearTimeout(invitation.current); clearTimeout(resetTimer.current);
    peer.current?.close(); peer.current = null; peerStarting.current = null;
    stream.current?.getTracks().forEach(track => track.stop()); stream.current = null;
    stopCallSounds();
  }, []);
  const finish = useCallback((code?: string) => {
    cleanup(); active.current = null; request.current = null;
    setLocalMediaStream(null); setRemoteMediaStream(null); setCameraFallback(false);
    setPartnerFlipped(false);
    setShowSettings(false); setErrorCode(code || null); changeStatus('ended');
    playCallEndedSound();
    resetTimer.current = setTimeout(() => { stopCallSounds(); changeStatus('idle'); setCall(null); setPartner(null); setDuration(0); }, 3000);
  }, [cleanup, changeStatus]);

  const terminate = useCallback((reason?: string) => {
    const c = active.current;
    if (request.current && !c) canceledRequests.current.add(request.current);
    if (c && c.status !== 'ended') {
      const kind = c.status === 'ringing' ? (c.caller_id === user?.id ? 'call.cancel' : 'call.reject') : 'call.end';
      if (!chatSocket.sendCall(kind, { call_id: c.id, reason })) pendingEnd.current = { id: c.id, type: kind };
    }
    finish(reason);
  }, [finish, user?.id]);

  const media = useCallback(async (wantVideo: boolean, epoch: number): Promise<MediaStream | null> => {
    const audio = await captureCallMedia(wantVideo, {
      current: () => epoch === generation.current,
      audioReady: audio => { stream.current = audio; setLocalMediaStream(audio); },
      cameraUnavailable: async () => {
        setCameraFallback(true);
        const proceed = await new Promise<boolean>(resolve => { fallback.current = resolve; });
        fallback.current = null; setCameraFallback(false); return proceed;
      },
    });
    if (!audio) return null;
    videoOffRef.current = audio.getVideoTracks().length === 0; mutedRef.current = false;
    setIsVideoOff(videoOffRef.current); setIsMuted(false);
    setLocalMediaStream(new MediaStream(audio.getTracks())); return audio;
  }, []);

  const startCall = useCallback(async (conversationId: string, callType: CallType, contact?: CallParticipant) => {
    if (!enabled || !registered || !chatSocket.isConnected() || !['idle', 'ended'].includes(statusRef.current)) return;
    cleanup(); pendingEnd.current = null; active.current = null;
    const epoch = generation.current;
    setCall(null); setPartner(contact || null); setType(callType); setViewMode('modal'); setDuration(0); setErrorCode(null);
    changeStatus('preparing');
    try {
      const local = await media(callType === 'video', epoch);
      if (!local || epoch !== generation.current) return;
      request.current = crypto.randomUUID();
      if (!chatSocket.sendCall('call.invite', { request_id: request.current, conversation_id: conversationId, type: callType })) throw new Error('SIGNALING_DISCONNECTED');
      changeStatus('calling'); startOutgoingDialTone();
      invitation.current = setTimeout(() => terminate('SIGNALING_DISCONNECTED'), 15_000);
    } catch (error) { if (epoch === generation.current) { const code = error instanceof Error && ['SIGNALING_DISCONNECTED', 'MEDIA_UNSUPPORTED'].includes(error.message) ? error.message : 'MEDIA_ERROR'; toast.error(t(code === 'MEDIA_UNSUPPORTED' ? 'calls.deviceUnsupportedError' : 'calls.mediaError')); finish(code); } }
  }, [enabled, registered, cleanup, changeStatus, media, terminate, finish, t]);

  const acceptCall = useCallback(async () => {
    const c = active.current; if (!c || c.status !== 'ringing' || c.callee_id !== user?.id || statusRef.current !== 'incoming') return;
    const epoch = generation.current;
    stopCallSounds(); changeStatus('preparing');
    try {
      const local = await media(c.type === 'video', epoch);
      if (!local || epoch !== generation.current) return;
      if (!chatSocket.sendCall('call.accept', { call_id: c.id })) throw new Error('SIGNALING_DISCONNECTED');
      changeStatus('connecting');
    } catch { if (epoch === generation.current) { toast.error(t('calls.mediaError')); terminate('MEDIA_ERROR'); } }
  }, [user?.id, media, changeStatus, terminate, t]);

  const beginPeer = useCallback((c: CallSnapshot): Promise<void> => {
    if (peer.current) return Promise.resolve();
    if (peerStarting.current) return peerStarting.current;
    const epoch = generation.current;
    const starting = (async () => {
      const config = await callService.ice(c.id);
      if (epoch !== generation.current || active.current?.id !== c.id || !stream.current) return;
      const engine = new CallPeer(c, stream.current, config, {
        remote: remote => setRemoteMediaStream(new MediaStream(remote.getTracks())),
        connection: state => {
          if (epoch !== generation.current || active.current?.id !== c.id) return;
          if (state === 'connected') {
            clearTimeout(recovery.current); recovery.current = undefined;
            chatSocket.sendCall('call.connected', { call_id: c.id });
            if (active.current?.status === 'active') changeStatus('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            if (recovery.current) return;
            changeStatus('reconnecting');
            recovery.current = setTimeout(() => terminate('connection_failed'), 15_000);
            void peer.current?.restart().catch(() => {});
          }
        },
        message: data => {
          if (data && typeof data === 'object' && 'type' in data && (data as any).type === 'flip') {
            setPartnerFlipped(Boolean((data as any).flipped));
          }
        },
        dataChannelReady: () => {
          engine.sendMeta({ type: 'flip', flipped: isCameraFlippedRef.current });
        },
      }, c.caller_id === user?.id);
      peer.current = engine;
      chatSocket.sendCall('call.media_state', { call_id: c.id, muted: mutedRef.current, video_off: videoOffRef.current });
      if (c.caller_id === user?.id) await engine.offer();
    })();
    peerStarting.current = starting;
    void starting.finally(() => { if (peerStarting.current === starting) peerStarting.current = null; }).catch(() => {});
    return starting;
  }, [user?.id, changeStatus, terminate]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let alive = true;
    const load = () => { void callService.config().then(config => { if (alive) setEnabled(config.enabled); }).catch(() => { if (alive) setEnabled(false); }); };
    load(); const timer = setInterval(load, 30_000);
    return () => { alive = false; clearInterval(timer); };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !user?.id) return;
    let alive = true;
    const loadPartner = async (c: CallSnapshot) => {
      const id = c.caller_id === user.id ? c.callee_id : c.caller_id;
      try {
        const profile = await userService.getUserByIdentifier(id);
        if (alive && active.current?.id === c.id) setPartner({ id, name: [profile.firstName, profile.lastName].filter(Boolean).join(' ') || profile.username || t('calls.user'), username: profile.username, avatarUrl: profile.avatarUrl || '' });
      } catch { if (alive && active.current?.id === c.id) setPartner({ id, name: t('calls.user'), avatarUrl: '' }); }
    };
    const receive = (c: CallSnapshot, event: string) => {
      if (canceledRequests.current.has(c.request_id)) { if (c.status === 'ended') canceledRequests.current.delete(c.request_id); else chatSocket.sendCall('call.cancel', { call_id: c.id }); return; }
      if (pendingEnd.current?.id === c.id) { if (c.status === 'ended') pendingEnd.current = null; else { chatSocket.sendCall(pendingEnd.current.type, { call_id: c.id }); return; } }
      if (event === 'call.incoming') {
        if (c.callee_id !== user.id || (active.current && active.current.id !== c.id) || ['preparing', 'connecting', 'connected', 'reconnecting'].includes(statusRef.current)) return;
        if (active.current?.id === c.id) return;
        cleanup(); active.current = c; setCall(c); setType(c.type); setPartner(null); setDuration(0); setErrorCode(null); setViewMode('modal');
        changeStatus('incoming'); startIncomingRingtone(); void loadPartner(c); return;
      }
      if (c.caller_id === user.id && c.caller_session_id !== chatSocket.callSessionId) return;
      if (c.callee_id === user.id && c.callee_session_id && c.callee_session_id !== chatSocket.callSessionId) {
        if (active.current?.id === c.id) finish('ANSWERED_ELSEWHERE');
        return;
      }
      if (active.current?.id !== c.id && request.current !== c.request_id) return;
      clearTimeout(invitation.current);
      const wasActive = active.current?.status === 'active';
      active.current = c; setCall(c); setType(c.type);
      if (c.status === 'ended') { pendingEnd.current = null; finish(c.reason); return; }
      if (event === 'call.ringing') { changeStatus('calling'); if (!partner) void loadPartner(c); }
      if (event === 'call.snapshot' && c.status === 'ringing') {
        clearTimeout(recovery.current); recovery.current = undefined;
        const next = beforeReconnect.current === 'preparing' ? 'preparing' : c.caller_id === user.id ? 'calling' : 'incoming';
        changeStatus(next);
        if (next === 'calling') startOutgoingDialTone();
        if (next === 'incoming') startIncomingRingtone();
      }
      if (c.status === 'connecting' || c.status === 'active') {
        stopCallSounds();
        if (event === 'call.snapshot' && peer.current?.connected) chatSocket.sendCall('call.connected', { call_id: c.id });
        if (c.status === 'active') {
          if (peer.current?.connected) { clearTimeout(recovery.current); recovery.current = undefined; changeStatus('connected'); }
          if (!wasActive) playCallConnectedSound();
          if (event === 'call.snapshot' && peer.current && !peer.current.connected) void peer.current.restart().catch(() => {});
        } else changeStatus('connecting');
        const epoch = generation.current;
        void beginPeer(c).catch(() => { if (epoch === generation.current && active.current?.id === c.id) terminate('connection_failed'); });
      }
    };
    const unsubscribers = [
      chatSocket.on('call.registered', () => setRegistered(true)),
      chatSocket.on('call.incoming', c => receive(c, 'call.incoming')),
      ...(['call.ringing', 'call.accepted', 'call.connected', 'call.media_state', 'call.ended', 'call.snapshot'] as const).map(event => chatSocket.on(event, c => receive(c, event))),
      chatSocket.on('call.signal', p => {
        const c = active.current; if (!c || c.id !== p.call_id) return;
        const epoch = generation.current;
        void beginPeer(c).then(() => { if (epoch === generation.current && active.current?.id === c.id) return peer.current?.signal(p.signal, p.sdp, p.negotiation_id); }).catch(() => { if (epoch === generation.current && active.current?.id === c.id) terminate('connection_failed'); });
      }),
      chatSocket.on('call.ice', p => {
        const c = active.current; if (!c || c.id !== p.call_id) return;
        const epoch = generation.current;
        void beginPeer(c).then(() => { if (epoch === generation.current && active.current?.id === c.id) return peer.current?.ice(p.candidate, p.negotiation_id); }).catch(() => { if (epoch === generation.current && active.current?.id === c.id) terminate('connection_failed'); });
      }),
      chatSocket.on('call.error', p => {
        if ((p.request_id && p.request_id === request.current) || (p.call_id && p.call_id === active.current?.id)) {
          if (p.code === 'INVALID_STATE' && active.current && ['connecting', 'active'].includes(active.current.status)) return;
          toast.error(t('calls.errors.' + p.code)); terminate(p.code);
        }
      }),
      chatSocket.onStateChange(state => {
        if (state === 'CONNECTED') {
          if (enabled) chatSocket.sendCall('call.register');
          if (pendingEnd.current) { chatSocket.sendCall(pendingEnd.current.type, { call_id: pendingEnd.current.id }); pendingEnd.current = null; }
          else if (active.current) chatSocket.sendCall('call.sync', { call_id: active.current.id });
        } else {
          setRegistered(false);
          if (active.current && !recovery.current) { beforeReconnect.current = statusRef.current; changeStatus('reconnecting'); recovery.current = setTimeout(() => terminate('connection_failed'), 15_000); }
        }
      }),
    ];
    const heartbeat = setInterval(() => {
      if (enabled && chatSocket.isConnected()) chatSocket.sendCall('call.register');
      const c = active.current;
      if (c && chatSocket.isConnected() && (c.caller_id === user.id || c.callee_session_id === chatSocket.callSessionId)) chatSocket.sendCall('call.heartbeat', { call_id: c.id });
    }, 5000);
    return () => { alive = false; unsubscribers.forEach(off => off()); clearInterval(heartbeat); };
  }, [isAuthenticated, user?.id, enabled, cleanup, changeStatus, finish, beginPeer, terminate, t, partner]);

  useEffect(() => {
    if (!call?.connected_at || !['connected', 'reconnecting'].includes(status)) return;
    const tick = () => setDuration(Math.max(0, Math.floor((Date.now() - new Date(call.connected_at!).getTime()) / 1000)));
    tick(); const timer = setInterval(tick, 1000); return () => clearInterval(timer);
  }, [call?.connected_at, status]);
  useEffect(() => {
    if (isAuthenticated) return;
    cleanup(); active.current = null; request.current = null; pendingEnd.current = null;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Logout must synchronize and release the authenticated media session.
    setEnabled(false); setRegistered(false); setCall(null); setPartner(null); setLocalMediaStream(null); setRemoteMediaStream(null); setCameraFallback(false); changeStatus('idle');
  }, [isAuthenticated, cleanup, changeStatus]);
  useEffect(() => {
    const release = () => {
      const c = active.current;
      if (c) chatSocket.sendCall(c.status === 'ringing' ? (c.caller_id === user?.id ? 'call.cancel' : 'call.reject') : 'call.end', { call_id: c.id });
      cleanup();
    };
    window.addEventListener('pagehide', release);
    return () => { window.removeEventListener('pagehide', release); release(); };
  }, [cleanup, user?.id]);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current; setIsMuted(mutedRef.current);
    stream.current?.getAudioTracks().forEach(track => { track.enabled = !mutedRef.current; });
    if (active.current) chatSocket.sendCall('call.media_state', { call_id: active.current.id, muted: mutedRef.current, video_off: videoOffRef.current });
  }, []);
  const changeDevice = useCallback(async (kind: 'audio' | 'video', deviceId: string) => {
    const epoch = generation.current;
    const local = stream.current;
    if (!local) return;
    const track = await switchCallInput(kind, deviceId, {
      stream: local,
      current: () => epoch === generation.current && stream.current === local,
      enabled: () => kind === 'audio' ? !mutedRef.current : !videoOffRef.current,
      replace: (kind, track) => peer.current?.replace(kind, track),
    });
    if (track && epoch === generation.current && stream.current === local) setLocalMediaStream(new MediaStream(local.getTracks()));
  }, []);
  const registerAudioElement = useCallback((element: HTMLAudioElement | null) => { audioElement.current = element; }, []);
  const changeOutputDevice = useCallback(async (id: string) => {
    const epoch = generation.current;
    const element = audioElement.current;
    if (!element) return;
    const selected = await switchCallOutput(element, id, () => epoch === generation.current && audioElement.current === element);
    if (selected !== null) setOutputDeviceId(selected);
  }, []);
  const toggleVideo = useCallback(async () => {
    if (type !== 'video') return;
    if (videoOffRef.current && !stream.current?.getVideoTracks().length) {
      try { await changeDevice('video', ''); } catch { toast.error(t('calls.cameraError')); return; }
    }
    videoOffRef.current = !videoOffRef.current; setIsVideoOff(videoOffRef.current);
    stream.current?.getVideoTracks().forEach(track => { track.enabled = !videoOffRef.current; });
    if (active.current) chatSocket.sendCall('call.media_state', { call_id: active.current.id, muted: mutedRef.current, video_off: videoOffRef.current });
  }, [type, changeDevice, t]);

  const toggleFlipCamera = useCallback(() => {
    setIsCameraFlipped(prev => {
      const next = !prev;
      isCameraFlippedRef.current = next;
      try { localStorage.setItem('call_flip_camera', String(next)); } catch {}
      peer.current?.sendMeta({ type: 'flip', flipped: next });
      return next;
    });
  }, []);

  const switchCameraDevice = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) {
      toggleFlipCamera();
      toast.success(t('calls.flipCamera'));
      return;
    }
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = list.filter(d => d.kind === 'videoinput');
      if (videoDevices.length <= 1) {
        toggleFlipCamera();
        toast.success(t('calls.flipCamera'));
        return;
      }
      const currentTrack = stream.current?.getVideoTracks()[0];
      const currentDeviceId = currentTrack?.getSettings().deviceId;
      const currentIndex = videoDevices.findIndex(d => d.deviceId === currentDeviceId);
      const nextIndex = (currentIndex + 1) % videoDevices.length;
      const nextDevice = videoDevices[nextIndex];
      if (nextDevice) {
        await changeDevice('video', nextDevice.deviceId);
        toast.success(nextDevice.label || t('calls.switchCamera'));
      }
    } catch (e) {
      console.warn('[call] switch camera failed', e);
      toggleFlipCamera();
    }
  }, [changeDevice, t, toggleFlipCamera]);

  const mine = call?.caller_id === user?.id;
  return <CallContext.Provider value={{
    enabled, ready: enabled && registered, status, type, viewMode, partner, call, duration,
    isMuted, isVideoOff, partnerMuted: !!(mine ? call?.callee_muted : call?.caller_muted),
    partnerVideoOff: !!(mine ? call?.callee_video_off : call?.caller_video_off),
    localMediaStream, remoteMediaStream, showSettings, gridMode, outputDeviceId, cameraFallback, errorCode,
    startCall, acceptCall, declineCall: () => terminate(), endCall: () => terminate(), toggleMute, toggleVideo,
    changeDevice, changeOutputDevice, registerAudioElement, setShowSettings, setGridMode, setViewMode,
    isCameraFlipped, partnerFlipped, toggleFlipCamera, switchCameraDevice,
    continueWithoutCamera: () => fallback.current?.(true), formatDuration: formatCallDuration,
  }}>{children}</CallContext.Provider>;
};
