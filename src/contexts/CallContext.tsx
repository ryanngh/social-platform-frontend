import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import type {
  CallType,
  CallStatus,
  CallViewMode,
  CallParticipant,
  CallReactionItem,
  InCallChatMessage,
  NetworkQuality,
} from '../types/call';
import {
  startOutgoingDialTone,
  startIncomingRingtone,
  playCallConnectedSound,
  playCallEndedSound,
  stopCallSounds,
} from '../utils/callSounds';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface CallContextType {
  status: CallStatus;
  type: CallType;
  viewMode: CallViewMode;
  partner: CallParticipant | null;
  duration: number;
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
  localMediaStream: MediaStream | null;
  
  // Handlers
  startCall: (partner: CallParticipant, type?: CallType) => void;
  simulateIncomingCall: (caller?: Partial<CallParticipant>, type?: CallType) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleSpeaker: () => void;
  toggleScreenShare: () => void;
  toggleVirtualBackground: (type?: 'none' | 'blur' | 'studio' | 'gradient') => void;
  toggleGridMode: () => void;
  toggleInCallChat: () => void;
  toggleSettings: () => void;
  sendReaction: (emoji: string) => void;
  sendInCallChatMessage: (content: string) => void;
  setViewMode: (mode: CallViewMode) => void;
  setFloatingPosition: (pos: { x: number; y: number }) => void;
  formatDuration: (totalSec: number) => string;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [status, setStatus] = useState<CallStatus>('idle');
  const [type, setType] = useState<CallType>('video');
  const [viewMode, setViewMode] = useState<CallViewMode>('modal');
  const [partner, setPartner] = useState<CallParticipant | null>(null);
  const [duration, setDuration] = useState<number>(0);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isVirtualBgActive, setIsVirtualBgActive] = useState(false);
  const [virtualBgType, setVirtualBgType] = useState<'none' | 'blur' | 'studio' | 'gradient'>('none');
  const [activeGridMode, setActiveGridMode] = useState<'pip' | 'grid'>('pip');
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [networkQuality] = useState<NetworkQuality>('excellent');

  const [reactions, setReactions] = useState<CallReactionItem[]>([]);
  const [chatMessages, setChatMessages] = useState<InCallChatMessage[]>([]);
  const [isLocalSpeaking, setIsLocalSpeaking] = useState(false);
  const [isPartnerSpeaking, setIsPartnerSpeaking] = useState(false);

  const [floatingPosition, setFloatingPosition] = useState<{ x: number; y: number }>({
    x: typeof window !== 'undefined' ? window.innerWidth - 360 : 1000,
    y: typeof window !== 'undefined' ? window.innerHeight - 260 : 600,
  });

  const [localMediaStream, setLocalMediaStream] = useState<MediaStream | null>(null);

  const callTimerRef = useRef<number | null>(null);
  const autoConnectTimerRef = useRef<number | null>(null);
  const speakingSimulationTimerRef = useRef<number | null>(null);

  // Format seconds to mm:ss or hh:mm:ss
  const formatDuration = useCallback((totalSec: number): string => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;

    const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  }, []);

  // Request actual camera/mic stream when starting video call if supported
  const requestMediaStream = async (wantVideo: boolean) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: wantVideo,
          audio: true,
        });
        setLocalMediaStream(stream);
      }
    } catch {
      // User declined or camera in use — graceful mock simulation will take over seamlessly
      setLocalMediaStream(null);
    }
  };

  // Stop media stream tracks on end
  const stopMediaStream = useCallback(() => {
    if (localMediaStream) {
      localMediaStream.getTracks().forEach((track) => track.stop());
      setLocalMediaStream(null);
    }
  }, [localMediaStream]);

  // Handle call timer
  useEffect(() => {
    if (status === 'connected') {
      callTimerRef.current = window.setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    }

    return () => {
      if (callTimerRef.current) {
        clearInterval(callTimerRef.current);
        callTimerRef.current = null;
      }
    };
  }, [status]);

  // Speaking pulse simulation for realism
  useEffect(() => {
    if (status === 'connected') {
      speakingSimulationTimerRef.current = window.setInterval(() => {
        // Partner speaking simulation
        if (!isMuted && Math.random() > 0.4) {
          setIsPartnerSpeaking(true);
          setTimeout(() => setIsPartnerSpeaking(false), 2400);
        }
        // Local speaking simulation if unmuted
        if (!isMuted && Math.random() > 0.6) {
          setIsLocalSpeaking(true);
          setTimeout(() => setIsLocalSpeaking(false), 1800);
        }
      }, 4000);
    } else {
      setIsLocalSpeaking(false);
      setIsPartnerSpeaking(false);
      if (speakingSimulationTimerRef.current) {
        clearInterval(speakingSimulationTimerRef.current);
        speakingSimulationTimerRef.current = null;
      }
    }

    return () => {
      if (speakingSimulationTimerRef.current) {
        clearInterval(speakingSimulationTimerRef.current);
      }
    };
  }, [status, isMuted]);

  // Start outgoing call
  const startCall = useCallback(
    (targetPartner: CallParticipant, callType: CallType = 'video') => {
      stopCallSounds();
      setPartner(targetPartner);
      setType(callType);
      setStatus('calling');
      setViewMode('modal');
      setDuration(0);
      setIsMuted(false);
      setIsVideoOff(callType === 'audio');
      setIsScreenSharing(false);
      setShowInCallChat(false);
      setShowSettings(false);
      setReactions([]);
      setChatMessages([]);

      startOutgoingDialTone();
      void requestMediaStream(callType === 'video');

      // Simulate partner picking up after 3.2s
      if (autoConnectTimerRef.current) clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = window.setTimeout(() => {
        playCallConnectedSound();
        setStatus('connected');
        toast.success(`Đã kết nối cuộc gọi với ${targetPartner.name}`);
      }, 3200);
    },
    []
  );

  // Simulate incoming call from a contact or demo partner
  const simulateIncomingCall = useCallback(
    (callerData?: Partial<CallParticipant>, callType: CallType = 'video') => {
      stopCallSounds();
      const defaultCaller: CallParticipant = {
        id: 'user-alex',
        name: 'Alex Nguyen',
        username: 'alexnguyen',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
        networkQuality: 'excellent',
        ...callerData,
      };

      setPartner(defaultCaller);
      setType(callType);
      setStatus('incoming');
      setDuration(0);
      setIsMuted(false);
      setIsVideoOff(callType === 'audio');
      setIsScreenSharing(false);
      setShowInCallChat(false);
      setReactions([]);
      setChatMessages([]);

      startIncomingRingtone();
    },
    []
  );

  // Accept incoming call
  const acceptCall = useCallback(() => {
    stopCallSounds();
    playCallConnectedSound();
    setStatus('connected');
    setViewMode('modal');
    setDuration(0);
    void requestMediaStream(type === 'video');
    toast.success(`Đã nhận cuộc gọi từ ${partner?.name || 'bạn bè'}`);
  }, [type, partner]);

  // Decline incoming call
  const declineCall = useCallback(() => {
    stopCallSounds();
    playCallEndedSound();
    setStatus('ended');
    stopMediaStream();

    setTimeout(() => {
      setStatus('idle');
      setPartner(null);
    }, 1500);
  }, [stopMediaStream]);

  // End active call
  const endCall = useCallback(() => {
    if (autoConnectTimerRef.current) {
      clearTimeout(autoConnectTimerRef.current);
      autoConnectTimerRef.current = null;
    }
    stopCallSounds();
    playCallEndedSound();
    setStatus('ended');
    stopMediaStream();

    toast(`Cuộc gọi đã kết thúc (${formatDuration(duration)})`, {
      icon: '📞',
    });

    setTimeout(() => {
      setStatus('idle');
      setPartner(null);
      setDuration(0);
    }, 1500);
  }, [duration, formatDuration, stopMediaStream]);

  // Controls
  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      toast(next ? 'Đã tắt micro' : 'Đã bật micro', {
        icon: next ? '🔇' : '🎙️',
        duration: 1500,
      });
      if (localMediaStream) {
        localMediaStream.getAudioTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  }, [localMediaStream]);

  const toggleVideo = useCallback(() => {
    setIsVideoOff((prev) => {
      const next = !prev;
      toast(next ? 'Đã tắt camera' : 'Đã bật camera', {
        icon: next ? '📷' : '📹',
        duration: 1500,
      });
      if (localMediaStream) {
        localMediaStream.getVideoTracks().forEach((t) => (t.enabled = !next));
      }
      return next;
    });
  }, [localMediaStream]);

  const toggleSpeaker = useCallback(() => {
    setIsSpeakerOn((prev) => {
      const next = !prev;
      toast(next ? 'Loa ngoài: Bật' : 'Loa ngoài: Tắt (Tai nghe)', {
        icon: next ? '🔊' : '🔈',
        duration: 1500,
      });
      return next;
    });
  }, []);

  const toggleScreenShare = useCallback(() => {
    setIsScreenSharing((prev) => {
      const next = !prev;
      toast(next ? 'Bắt đầu chia sẻ màn hình' : 'Đã dừng chia sẻ màn hình', {
        icon: '🖥️',
        duration: 1800,
      });
      return next;
    });
  }, []);

  const toggleVirtualBackground = useCallback((bgType?: 'none' | 'blur' | 'studio' | 'gradient') => {
    if (bgType) {
      setVirtualBgType(bgType);
      setIsVirtualBgActive(bgType !== 'none');
    } else {
      setIsVirtualBgActive((prev) => {
        const next = !prev;
        setVirtualBgType(next ? 'blur' : 'none');
        return next;
      });
    }
  }, []);

  const toggleGridMode = useCallback(() => {
    setActiveGridMode((prev) => (prev === 'pip' ? 'grid' : 'pip'));
  }, []);

  const toggleInCallChat = useCallback(() => {
    setShowInCallChat((prev) => !prev);
  }, []);

  const toggleSettings = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  const sendReaction = useCallback(
    (emoji: string) => {
      const newReaction: CallReactionItem = {
        id: `react-${Date.now()}-${Math.random()}`,
        emoji,
        senderName: user?.fullName || 'Bạn',
        createdAt: Date.now(),
      };
      setReactions((prev) => [...prev, newReaction]);

      // Automatically prune reactions after 3.5s
      setTimeout(() => {
        setReactions((prev) => prev.filter((r) => r.id !== newReaction.id));
      }, 3500);

      // Simulate occasional partner reaction echo for liveliness
      if (Math.random() > 0.5) {
        setTimeout(() => {
          const partnerReaction: CallReactionItem = {
            id: `react-partner-${Date.now()}`,
            emoji,
            senderName: partner?.name || 'Alex',
            createdAt: Date.now(),
          };
          setReactions((prev) => [...prev, partnerReaction]);
          setTimeout(() => {
            setReactions((prev) => prev.filter((r) => r.id !== partnerReaction.id));
          }, 3500);
        }, 800);
      }
    },
    [user, partner]
  );

  const sendInCallChatMessage = useCallback(
    (content: string) => {
      if (!content.trim()) return;

      const newMsg: InCallChatMessage = {
        id: `incall-${Date.now()}`,
        senderId: 'me',
        senderName: user?.fullName || 'Bạn',
        senderAvatar:
          user?.avatarUrl ||
          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        content: content.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isMine: true,
      };

      setChatMessages((prev) => [...prev, newMsg]);

      // Partner auto reply in call
      setTimeout(() => {
        const partnerReplies = [
          'Âm thanh nghe rõ và nét lắm bạn ơi!',
          'Okie bạn, mình đang xem tài liệu bạn gửi 👍',
          'Độ phân giải HD mượt ghê!',
          'Nghe rõ nhé!',
        ];
        const randomReply = partnerReplies[Math.floor(Math.random() * partnerReplies.length)];
        const replyMsg: InCallChatMessage = {
          id: `incall-reply-${Date.now()}`,
          senderId: partner?.id || 'partner',
          senderName: partner?.name || 'Alex Nguyen',
          senderAvatar:
            partner?.avatarUrl ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
          content: randomReply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMine: false,
        };
        setChatMessages((prev) => [...prev, replyMsg]);
      }, 1400);
    },
    [user, partner]
  );

  // Keyboard shortcuts: M for mute, V for video, Esc to minimize or exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== 'connected' && status !== 'calling') return;

      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'v' || e.key === 'V') {
        toggleVideo();
      } else if (e.key === 'Escape') {
        if (viewMode === 'fullscreen') {
          setViewMode('modal');
        } else if (viewMode === 'modal') {
          setViewMode('floating');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, viewMode, toggleMute, toggleVideo]);

  return (
    <CallContext.Provider
      value={{
        status,
        type,
        viewMode,
        partner,
        duration,
        isMuted,
        isVideoOff,
        isSpeakerOn,
        isScreenSharing,
        isVirtualBgActive,
        virtualBgType,
        activeGridMode,
        showInCallChat,
        showSettings,
        reactions,
        chatMessages,
        networkQuality,
        isLocalSpeaking,
        isPartnerSpeaking,
        floatingPosition,
        localMediaStream,
        startCall,
        simulateIncomingCall,
        acceptCall,
        declineCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleSpeaker,
        toggleScreenShare,
        toggleVirtualBackground,
        toggleGridMode,
        toggleInCallChat,
        toggleSettings,
        sendReaction,
        sendInCallChatMessage,
        setViewMode,
        setFloatingPosition,
        formatDuration,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
