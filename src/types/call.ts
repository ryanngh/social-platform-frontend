export type CallType = 'audio' | 'video';
export type CallStatus = 'idle' | 'preparing' | 'calling' | 'incoming' | 'connecting' | 'connected' | 'reconnecting' | 'ended';
export type CallViewMode = 'modal' | 'floating' | 'fullscreen';
export interface CallParticipant { id: string; name: string; username?: string; avatarUrl: string; }
export interface CallSummary {
  id: string; type: CallType; caller_id: string; callee_id: string; reason: string;
  connected_at: string | null; ended_at: string | null;
  duration_seconds?: number;
}
export interface CallSnapshot extends CallSummary {
  conversation_id: string; request_id: string; caller_session_id: string; callee_session_id: string | null;
  status: 'ringing' | 'connecting' | 'active' | 'ended'; created_at: string; deadline: string;
  negotiation_id: string | null; caller_muted: boolean; callee_muted: boolean;
  caller_video_off: boolean; callee_video_off: boolean;
}
export interface IceConfig { ice_servers: RTCIceServer[]; expires_at: string; }
export interface CallCommand {
  call_id?: string; request_id?: string; conversation_id?: string; type?: CallType;
  negotiation_id?: string; signal?: 'offer' | 'answer' | 'restart_request'; sdp?: string;
  candidate?: RTCIceCandidateInit; muted?: boolean; video_off?: boolean; reason?: string;
}
export type CallClientEvent = 'call.register' | 'call.invite' | 'call.accept' | 'call.reject' | 'call.cancel' | 'call.end' | 'call.signal' | 'call.ice' | 'call.connected' | 'call.media_state' | 'call.heartbeat' | 'call.sync';
export type CallClientFrame = { type: CallClientEvent; payload: CallCommand };
type SnapshotEvent = 'call.ringing' | 'call.incoming' | 'call.accepted' | 'call.connected' | 'call.media_state' | 'call.ended' | 'call.snapshot';
export type CallServerFrame =
  { [K in SnapshotEvent]: { type: K; payload: CallSnapshot } }[SnapshotEvent]
  | { type: 'call.signal'; payload: Required<Pick<CallCommand, 'call_id' | 'negotiation_id' | 'signal'>> & Pick<CallCommand, 'sdp'> }
  | { type: 'call.ice'; payload: Required<Pick<CallCommand, 'call_id' | 'negotiation_id' | 'candidate'>> }
  | { type: 'call.registered'; payload: { session_id: string } }
  | { type: 'call.error'; payload: { code: string; message?: string; call_id?: string; request_id?: string } };
