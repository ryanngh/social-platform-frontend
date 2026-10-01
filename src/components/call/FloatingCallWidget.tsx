import React, { useState, useRef, useEffect } from 'react';
import {
  Maximize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Volume2,
} from 'lucide-react';
import { useCall } from '../../contexts/CallContext';
import AudioVisualizer from './AudioVisualizer';
import CallReactionsOverlay from './CallReactionsOverlay';

export const FloatingCallWidget: React.FC = () => {
  const {
    status,
    type,
    viewMode,
    partner,
    duration,
    isMuted,
    isVideoOff,
    isPartnerSpeaking,
    reactions,
    toggleMute,
    toggleVideo,
    endCall,
    setViewMode,
    formatDuration,
  } = useCall();

  const [isHovered, setIsHovered] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number }>({
    startX: 0,
    startY: 0,
    initialX: 0,
    initialY: 0,
  });

  const widgetRef = useRef<HTMLDivElement>(null);

  // Set default initial bottom-right position on mount
  useEffect(() => {
    if (typeof window !== 'undefined' && position === null) {
      const defaultX = Math.max(20, window.innerWidth - 340);
      const defaultY = Math.max(80, window.innerHeight - 240);
      setPosition({ x: defaultX, y: defaultY });
    }
  }, [position]);

  if ((status !== 'calling' && status !== 'connected') || viewMode !== 'floating' || !partner) {
    return null;
  }

  // Handle Dragging
  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag from header or empty areas, not buttons
    if ((e.target as HTMLElement).closest('button')) return;

    isDraggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position?.x || 0,
      initialY: position?.y || 0,
    };
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current) return;

    const deltaX = e.clientX - dragStartRef.current.startX;
    const deltaY = e.clientY - dragStartRef.current.startY;

    const widgetWidth = type === 'video' ? 300 : 280;
    const widgetHeight = type === 'video' ? 200 : 80;

    const maxX = window.innerWidth - widgetWidth - 10;
    const maxY = window.innerHeight - widgetHeight - 10;

    const newX = Math.min(Math.max(10, dragStartRef.current.initialX + deltaX), maxX);
    const newY = Math.min(Math.max(10, dragStartRef.current.initialY + deltaY), maxY);

    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      //
    }
  };

  const isVideo = type === 'video';

  return (
    <div
      ref={widgetRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: position ? `translate3d(${position.x}px, ${position.y}px, 0)` : 'none',
        touchAction: 'none',
      }}
      className={`fixed top-0 left-0 z-50 cursor-grab active:cursor-grabbing select-none transition-shadow duration-200 ${
        isVideo
          ? 'w-[280px] sm:w-[320px] h-[190px] sm:h-[210px] rounded-3xl bg-[#0F0F13] border border-white/20 shadow-2xl overflow-hidden'
          : 'w-[280px] sm:w-[300px] h-[78px] rounded-2xl bg-[#14141A]/95 border border-white/15 shadow-2xl backdrop-blur-xl p-2.5 flex items-center gap-3'
      }`}
    >
      {/* Floating Reactions Overlay inside floating widget */}
      <CallReactionsOverlay reactions={reactions} />

      {/* 1. Video Call Mode Content */}
      {isVideo ? (
        <div className="relative w-full h-full group">
          {/* Simulated Video Stream or Fallback Avatar */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-900 via-indigo-950 to-blue-950 flex items-center justify-center overflow-hidden">
            {/* Background dynamic ambient glow */}
            <div className="absolute w-44 h-44 rounded-full bg-blue-600/30 filter blur-2xl animate-pulse" />
            
            <img
              src={partner.avatarUrl}
              alt={partner.name}
              className={`w-20 h-20 rounded-full object-cover border-2 shadow-lg relative z-10 transition-transform ${
                isPartnerSpeaking ? 'border-emerald-400 scale-105 ring-4 ring-emerald-500/30' : 'border-white/40'
              }`}
            />
          </div>

          {/* Top Info Bar */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between z-20 pointer-events-none">
            <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 text-[10px] text-white font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="truncate max-w-[90px]">{partner.name}</span>
              <span className="text-gray-400 font-mono">
                {status === 'calling' ? 'Đang gọi...' : formatDuration(duration)}
              </span>
            </div>

            <div className="flex items-center gap-1 pointer-events-auto">
              <button
                onClick={() => setViewMode('modal')}
                className="p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition cursor-pointer shadow-xs"
                title="Phóng to toàn màn hình"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Bottom Hover Control Bar */}
          <div
            className={`absolute bottom-2 left-2 right-2 z-20 flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 transition-opacity duration-200 ${
              isHovered ? 'opacity-100' : 'opacity-85 sm:opacity-0'
            }`}
          >
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition cursor-pointer ${
                isMuted ? 'bg-red-500/80 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isMuted ? 'Bật mic' : 'Tắt mic'}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={toggleVideo}
              className={`p-2 rounded-full transition cursor-pointer ${
                isVideoOff ? 'bg-red-500/80 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
              }`}
              title={isVideoOff ? 'Bật camera' : 'Tắt camera'}
            >
              {isVideoOff ? <VideoOff className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => setViewMode('modal')}
              className="p-2 rounded-full bg-white/15 hover:bg-white/25 text-white transition cursor-pointer"
              title="Mở rộng cửa sổ cuộc gọi"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={endCall}
              className="p-2 rounded-full bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30 transition cursor-pointer"
              title="Kết thúc cuộc gọi"
            >
              <PhoneOff className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        /* 2. Voice Call Mode Content */
        <>
          {/* Avatar with pulse ring */}
          <div className="relative shrink-0">
            <img
              src={partner.avatarUrl}
              alt={partner.name}
              className={`w-11 h-11 rounded-full object-cover border-2 shadow-sm ${
                isPartnerSpeaking ? 'border-emerald-400 ring-2 ring-emerald-400/40' : 'border-white/30'
              }`}
            />
            {isPartnerSpeaking && (
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-[#14141A] flex items-center justify-center">
                <Volume2 className="w-2 h-2 text-white" />
              </span>
            )}
          </div>

          {/* Name & Wave visualizer */}
          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center justify-between mb-0.5">
              <span className="text-xs font-bold text-white truncate max-w-[90px]">
                {partner.name}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 font-semibold shrink-0">
                {status === 'calling' ? 'Đang gọi...' : formatDuration(duration)}
              </span>
            </div>

            <div className="h-4 flex items-center">
              <AudioVisualizer
                isSpeaking={isPartnerSpeaking}
                isMuted={isMuted}
                barCount={14}
                className="h-4 w-full"
              />
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={toggleMute}
              className={`p-1.5 rounded-full transition cursor-pointer ${
                isMuted ? 'bg-red-500/80 text-white' : 'bg-white/10 hover:bg-white/20 text-white'
              }`}
              title={isMuted ? 'Bật mic' : 'Tắt mic'}
            >
              {isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
            </button>

            <button
              onClick={() => setViewMode('modal')}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="Phóng to"
            >
              <Maximize2 className="w-3 h-3" />
            </button>

            <button
              onClick={endCall}
              className="p-1.5 rounded-full bg-red-600 hover:bg-red-700 text-white transition cursor-pointer shadow-xs"
              title="Kết thúc"
            >
              <PhoneOff className="w-3 h-3" />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default FloatingCallWidget;
