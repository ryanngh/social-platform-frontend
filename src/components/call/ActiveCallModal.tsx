import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Maximize2,
  Minimize2,
  PictureInPicture2,
  Monitor,
  MonitorOff,
  Smile,
  Settings,
  MessageSquare,
  ShieldCheck,
  Signal,
  LayoutGrid,
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';
import AudioVisualizer from './AudioVisualizer';
import CallReactionsOverlay from './CallReactionsOverlay';
import InCallChatDrawer from './InCallChatDrawer';
import CallSettingsModal from './CallSettingsModal';

export const ActiveCallModal: React.FC = () => {
  const {
    status,
    type,
    viewMode,
    partner,
    duration,
    isMuted,
    isVideoOff,
    isScreenSharing,
    virtualBgType,
    activeGridMode,
    showInCallChat,
    showSettings,
    reactions,
    chatMessages,
    isLocalSpeaking,
    isPartnerSpeaking,
    localMediaStream,
    toggleMute,
    toggleVideo,
    toggleScreenShare,
    toggleGridMode,
    toggleInCallChat,
    toggleSettings,
    sendReaction,
    sendInCallChatMessage,
    endCall,
    setViewMode,
    formatDuration,
  } = useCall();

  const { user } = useAuth();
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  // Bind local media stream to local video element if available
  useEffect(() => {
    if (localVideoRef.current && localMediaStream && !isVideoOff) {
      localVideoRef.current.srcObject = localMediaStream;
    }
  }, [localMediaStream, isVideoOff]);

  if ((status !== 'calling' && status !== 'connected') || (viewMode !== 'modal' && viewMode !== 'fullscreen') || !partner) {
    return null;
  }

  const isVideo = type === 'video';
  const isFullscreen = viewMode === 'fullscreen';

  const quickReactions = ['❤️', '🔥', '😂', '👍', '🎉', '🚀', '👏', '😍'];

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center ${
        isFullscreen ? 'p-0 bg-black' : 'p-3 sm:p-6 bg-black/80 backdrop-blur-xl'
      } animate-fadeIn`}
    >
      {/* Main Call Container Stage */}
      <div
        className={`relative w-full flex flex-col bg-[#0C0D12] border border-white/10 text-white overflow-hidden shadow-2xl transition-all duration-300 ${
          isFullscreen
            ? 'h-full w-full rounded-none border-none'
            : 'max-w-5xl h-[88vh] max-h-[760px] rounded-3xl'
        }`}
      >
        {/* Floating Reactions Component */}
        <CallReactionsOverlay reactions={reactions} />

        {/* 1. TOP HEADER BAR */}
        <div className="absolute top-0 left-0 right-0 z-30 px-4 sm:px-6 py-4 flex items-center justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
          {/* Left: Partner name & security */}
          <div className="flex items-center gap-3">
            <img
              src={partner.avatarUrl}
              alt={partner.name}
              className="w-9 h-9 rounded-full object-cover border border-white/30 shrink-0"
            />
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold tracking-tight">{partner.name}</h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Mã hóa E2E</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-gray-300">
                <span className="font-mono text-emerald-400 font-semibold">
                  {status === 'calling' ? 'Đang đổ chuông...' : formatDuration(duration)}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Signal className="w-3 h-3 text-emerald-400" />
                  <span>HD 1080p</span>
                </span>
              </div>
            </div>
          </div>

          {/* Right: Window Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Grid vs PiP Layout toggle (for video call) */}
            {isVideo && (
              <button
                onClick={toggleGridMode}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  activeGridMode === 'grid'
                    ? 'bg-[#004AC6] text-white'
                    : 'bg-white/10 hover:bg-white/20 text-gray-200'
                }`}
                title={activeGridMode === 'grid' ? 'Chế độ hình trong hình (PiP)' : 'Chế độ lưới chia đôi (Grid)'}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}

            {/* Minimize to Floating Widget (PiP) */}
            <button
              onClick={() => setViewMode('floating')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 transition cursor-pointer flex items-center gap-1 text-xs"
              title="Thu nhỏ thành cửa sổ nổi (Floating UI)"
            >
              <PictureInPicture2 className="w-4 h-4" />
              <span className="hidden md:inline font-medium">Thu nhỏ</span>
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setViewMode(isFullscreen ? 'modal' : 'fullscreen')}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-gray-200 transition cursor-pointer"
              title={isFullscreen ? 'Thu gọn' : 'Toàn màn hình'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 2. CENTER STAGE (Video Feeds or Voice Spectrum) */}
        <div className="flex-1 relative w-full h-full flex items-center justify-center overflow-hidden">
          {isVideo ? (
            /* VIDEO CALL EXPERIENCE */
            <div
              className={`w-full h-full relative ${
                activeGridMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 p-3 sm:p-6 pt-16 gap-3' : ''
              }`}
            >
              {/* REMOTE PARTICIPANT FEED */}
              <div
                className={`relative w-full h-full bg-[#111218] flex items-center justify-center overflow-hidden transition-all ${
                  activeGridMode === 'grid'
                    ? 'rounded-2xl border border-white/10 shadow-lg'
                    : 'absolute inset-0'
                }`}
              >
                {/* Simulated Remote Video Background */}
                <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
                  {/* Subtle lighting circles */}
                  <div className="absolute w-[500px] h-[500px] rounded-full bg-blue-600/15 filter blur-3xl animate-pulse" />
                  <div className="absolute w-72 h-72 rounded-full bg-purple-600/10 filter blur-2xl" />

                  {/* Remote Avatar/Portrait */}
                  <div className="relative flex flex-col items-center">
                    <div className="relative">
                      <img
                        src={partner.avatarUrl}
                        alt={partner.name}
                        className={`w-28 sm:w-36 h-28 sm:h-36 rounded-full object-cover border-4 shadow-2xl transition-all duration-300 ${
                          isPartnerSpeaking
                            ? 'border-emerald-400 ring-8 ring-emerald-400/20 scale-105'
                            : 'border-white/20'
                        }`}
                      />
                      {isPartnerSpeaking && (
                        <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                          <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1 animate-pulse">
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Đang nói...</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remote Participant Label */}
                <div className="absolute bottom-20 sm:bottom-24 left-4 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>{partner.name}</span>
                </div>
              </div>

              {/* LOCAL SELF-VIEW (User's Camera PiP or Grid Card) */}
              <div
                className={`transition-all duration-300 overflow-hidden ${
                  activeGridMode === 'grid'
                    ? 'relative w-full h-full bg-[#161720] rounded-2xl border border-white/10 flex items-center justify-center shadow-lg'
                    : 'absolute bottom-24 right-4 z-30 w-36 sm:w-56 h-28 sm:h-38 rounded-2xl bg-[#161720] border-2 border-white/20 shadow-2xl'
                }`}
              >
                {/* Background visual filter according to virtualBgType */}
                <div
                  className={`absolute inset-0 flex items-center justify-center ${
                    virtualBgType === 'studio'
                      ? 'bg-gradient-to-tr from-indigo-900 via-slate-900 to-blue-900'
                      : virtualBgType === 'gradient'
                      ? 'bg-gradient-to-tr from-purple-900 via-pink-900 to-blue-900'
                      : virtualBgType === 'blur'
                      ? 'bg-slate-900/90 backdrop-blur-2xl'
                      : 'bg-slate-900'
                  }`}
                >
                  {isVideoOff ? (
                    <div className="flex flex-col items-center gap-1 text-center p-2">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-gray-400">
                        <VideoOff className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] text-gray-400 font-medium">Camera đang tắt</span>
                    </div>
                  ) : localMediaStream ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />
                  ) : (
                    /* Mock local video user avatar */
                    <div className="flex flex-col items-center">
                      <img
                        src={
                          user?.avatarUrl ||
                          'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                        }
                        alt="You"
                        className={`w-14 sm:w-16 h-14 sm:h-16 rounded-full object-cover border-2 ${
                          isLocalSpeaking ? 'border-emerald-400 ring-4 ring-emerald-400/20' : 'border-white/30'
                        }`}
                      />
                    </div>
                  )}
                </div>

                {/* Local Camera Tag */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between z-10 text-[10px] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-lg border border-white/10">
                  <span className="font-semibold text-white/90">Bạn (Tôi)</span>
                  <div className="flex items-center gap-1">
                    {isMuted && <MicOff className="w-3 h-3 text-red-400" />}
                    {virtualBgType !== 'none' && <Sparkles className="w-3 h-3 text-blue-400" />}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* VOICE CALL EXPERIENCE */
            <div className="flex flex-col items-center justify-center p-6 text-center max-w-lg mx-auto relative z-20">
              {/* Voice Ambient Studio Lighting */}
              <div className="absolute w-80 h-80 rounded-full bg-blue-600/20 filter blur-3xl -z-10 animate-pulse" />
              <div className="absolute w-60 h-60 rounded-full bg-purple-600/15 filter blur-2xl -z-10" />

              {/* Dual Caller Avatars with Wave Resonance */}
              <div className="flex items-center justify-center gap-6 sm:gap-10 mb-8">
                {/* Partner Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={partner.avatarUrl}
                      alt={partner.name}
                      className={`w-24 sm:w-28 h-24 sm:h-28 rounded-full object-cover border-3 shadow-2xl transition-all ${
                        isPartnerSpeaking
                          ? 'border-emerald-400 ring-8 ring-emerald-400/25 scale-105'
                          : 'border-white/30'
                      }`}
                    />
                    {isPartnerSpeaking && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0C0D12] text-white">
                        <Volume2 className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold mt-2 text-white/90">{partner.name}</span>
                </div>

                <span className="text-gray-500 text-lg font-light">&</span>

                {/* Local User Avatar */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <img
                      src={
                        user?.avatarUrl ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
                      }
                      alt="You"
                      className={`w-24 sm:w-28 h-24 sm:h-28 rounded-full object-cover border-3 shadow-2xl transition-all ${
                        isLocalSpeaking && !isMuted
                          ? 'border-emerald-400 ring-8 ring-emerald-400/25 scale-105'
                          : 'border-white/30'
                      }`}
                    />
                    {isMuted && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-[#0C0D12] text-white">
                        <MicOff className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-bold mt-2 text-white/90">Bạn</span>
                </div>
              </div>

              {/* Dynamic Sound Spectrum Wave Visualizer */}
              <div className="w-full max-w-xs mb-4">
                <AudioVisualizer
                  isSpeaking={isPartnerSpeaking || (isLocalSpeaking && !isMuted)}
                  isMuted={isMuted}
                  barCount={32}
                  className="h-12 w-full"
                />
              </div>

              <p className="text-xs text-gray-400">
                {isPartnerSpeaking
                  ? `${partner.name} đang nói...`
                  : isMuted
                  ? 'Micro của bạn đang tắt'
                  : 'Đang kết nối chất lượng thoại HD mượt mà'}
              </p>
            </div>
          )}

          {/* In-Call Chat Drawer Overlay */}
          <InCallChatDrawer
            isOpen={showInCallChat}
            onClose={toggleInCallChat}
            messages={chatMessages}
            onSendMessage={sendInCallChatMessage}
            partnerName={partner.name}
          />
        </div>

        {/* 3. BOTTOM GLASSMORPHISM CONTROL BAR DOCK */}
        <div className="absolute bottom-0 left-0 right-0 z-30 px-4 py-4 sm:py-5 bg-gradient-to-t from-black/90 via-black/60 to-transparent flex items-center justify-center">
          <div className="flex items-center gap-2 sm:gap-3 bg-[#181922]/90 backdrop-blur-2xl px-4 py-2.5 rounded-full border border-white/15 shadow-2xl">
            {/* Mute/Unmute Mic */}
            <button
              onClick={toggleMute}
              className={`p-3 rounded-full transition cursor-pointer relative group ${
                isMuted
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Bật micro (Phím M)' : 'Tắt micro (Phím M)'}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                {isMuted ? 'Bật mic (M)' : 'Tắt mic (M)'}
              </span>
            </button>

            {/* Video Camera Toggle */}
            <button
              onClick={toggleVideo}
              className={`p-3 rounded-full transition cursor-pointer relative group ${
                isVideoOff
                  ? 'bg-red-500 hover:bg-red-600 text-white shadow-md shadow-red-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isVideoOff ? 'Bật camera (Phím V)' : 'Tắt camera (Phím V)'}
            >
              {isVideoOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
              <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                {isVideoOff ? 'Bật camera (V)' : 'Tắt camera (V)'}
              </span>
            </button>

            {/* Share Screen (Video calls) */}
            {isVideo && (
              <button
                onClick={toggleScreenShare}
                className={`p-3 rounded-full transition cursor-pointer relative group ${
                  isScreenSharing
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
                title="Chia sẻ màn hình"
              >
                {isScreenSharing ? <MonitorOff className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-[10px] text-white px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                  Chia sẻ màn hình
                </span>
              </button>
            )}

            {/* Floating Reactions Picker Popover Button */}
            <div className="relative">
              <button
                onClick={() => setShowReactionPicker(!showReactionPicker)}
                className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                title="Gửi biểu tượng cảm xúc"
              >
                <Smile className="w-5 h-5 text-amber-400" />
              </button>

              {/* Reactions Bar Popup */}
              {showReactionPicker && (
                <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-[#1C1D26] border border-white/20 rounded-full px-3 py-2 flex items-center gap-1.5 shadow-2xl animate-scaleUp z-40">
                  {quickReactions.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        sendReaction(emoji);
                        setShowReactionPicker(false);
                      }}
                      className="text-xl hover:scale-135 active:scale-95 transition p-1 cursor-pointer"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* In-Call Text Chat Drawer Toggle */}
            <button
              onClick={toggleInCallChat}
              className={`p-3 rounded-full transition cursor-pointer relative ${
                showInCallChat
                  ? 'bg-[#004AC6] text-white'
                  : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title="Mở tin nhắn trò chuyện"
            >
              <MessageSquare className="w-5 h-5" />
              {chatMessages.length > 0 && !showInCallChat && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#0095F6] rounded-full ring-2 ring-[#181922]" />
              )}
            </button>

            {/* Call Settings / Virtual Background Modal */}
            <button
              onClick={toggleSettings}
              className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Cài đặt âm thanh, camera & nền ảo"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* END CALL BUTTON (Crimson Red Pill) */}
            <button
              onClick={endCall}
              className="px-5 sm:px-6 py-3 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-semibold flex items-center gap-2 shadow-lg shadow-red-600/40 transition cursor-pointer"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-5 h-5" />
              <span className="text-xs hidden sm:inline">Kết thúc</span>
            </button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <CallSettingsModal isOpen={showSettings} onClose={toggleSettings} />
    </div>
  );
};

export default ActiveCallModal;
