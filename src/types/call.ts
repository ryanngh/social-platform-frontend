export type CallType = 'audio' | 'video';

export type CallStatus = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';

export type CallViewMode = 'modal' | 'floating' | 'fullscreen' | 'minimized';

export type NetworkQuality = 'excellent' | 'good' | 'poor';

export interface CallParticipant {
  id: string;
  name: string;
  username?: string;
  avatarUrl: string;
  isMuted?: boolean;
  isVideoOff?: boolean;
  isSpeaking?: boolean;
  isScreenSharing?: boolean;
  networkQuality?: NetworkQuality;
}

export interface CallReactionItem {
  id: string;
  emoji: string;
  senderName: string;
  createdAt: number;
}

export interface InCallChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: string;
  isMine: boolean;
}

export interface CallState {
  status: CallStatus;
  type: CallType;
  viewMode: CallViewMode;
  partner: CallParticipant | null;
  duration: number; // in seconds
  isMuted: boolean;
  isVideoOff: boolean;
  isSpeakerOn: boolean;
  isScreenSharing: boolean;
  isVirtualBgActive: boolean;
  virtualBgType: 'none' | 'blur' | 'studio' | 'gradient';
  activeGridMode: 'pip' | 'grid';
  showInCallChat: boolean;
  showSettings: boolean;
  reactions: CallReactionItem[];
  chatMessages: InCallChatMessage[];
  networkQuality: NetworkQuality;
  isLocalSpeaking: boolean;
  isPartnerSpeaking: boolean;
  floatingPosition: { x: number; y: number };
}
