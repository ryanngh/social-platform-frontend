import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  Volume1,
  VolumeX,
  Maximize2,
  Minimize,
  MoreVertical,
  Check,
  PictureInPicture2,
  RotateCcw,
  SlidersHorizontal,
  ChevronRight,
  ChevronLeft,
  Gauge,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../../contexts/LanguageContext';

export interface VideoQualityOption {
  label: string; // 'Auto' | '1080p' | '720p' | '480p' | '360p'
  src?: string;
  description?: string;
  isHd?: boolean;
}

interface CustomVideoPlayerProps {
  src: string;
  poster?: string;
  title?: string;
  subtitle?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  className?: string;
  videoClassName?: string;
  style?: React.CSSProperties;
  onEnded?: () => void;
  hideTopControls?: boolean;
  qualities?: VideoQualityOption[];
  onQualityChange?: (quality: string) => void;
}

// Rewind 15s icon with circular arrow and '15' in center
export const Rewind15Icon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 4a8 8 0 0 0-7.2 4.5M4 4v4.5h4.5" />
    <path d="M4.8 12a8 8 0 1 0 2.4-5.7" />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="6.5"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      15
    </text>
  </svg>
);

// Forward 15s icon with circular arrow and '15' in center
export const Forward15Icon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 4a8 8 0 0 1 7.2 4.5M20 4v4.5h-4.5" />
    <path d="M19.2 12a8 8 0 1 1-2.4-5.7" />
    <text
      x="12"
      y="15"
      textAnchor="middle"
      fontSize="6.5"
      fontWeight="700"
      fill="currentColor"
      stroke="none"
      fontFamily="system-ui, -apple-system, sans-serif"
    >
      15
    </text>
  </svg>
);

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export const CustomVideoPlayer: React.FC<CustomVideoPlayerProps> = ({
  src,
  poster,
  title,
  subtitle,
  autoPlay = false,
  loop = false,
  muted: initialMuted = false,
  className = '',
  videoClassName = '',
  style,
  onEnded,
  hideTopControls = false,
  qualities,
  onQualityChange,
}) => {
  const { language = 'vi' } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const volumeHideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(loop);

  // Quality state
  const qualityOptions: VideoQualityOption[] =
    qualities && qualities.length > 0
      ? qualities
      : [
          { label: 'Auto', description: language === 'vi' ? 'Tự động' : 'Auto' },
          { label: '1080p', description: 'Full HD', isHd: true },
          { label: '720p', description: 'HD', isHd: true },
          { label: '480p', description: language === 'vi' ? 'Tiêu chuẩn (SD)' : 'SD' },
          { label: '360p', description: language === 'vi' ? 'Tiết kiệm' : 'Data saver' },
        ];
  const [selectedQuality, setSelectedQuality] = useState<string>('Auto');
  const [detectedResolution, setDetectedResolution] = useState<string>('');

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuView, setMenuView] = useState<'main' | 'speed' | 'quality'>('main');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Auto-hide controls timer
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    // Only auto-hide if playing, menu is closed, volume not hovering/dragging, and not scrubbing
    if (isPlaying && !isMenuOpen && !isHoveringVolume && !isDraggingVolume && !isScrubbing) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, isMenuOpen, isHoveringVolume, isDraggingVolume, isScrubbing]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, isHoveringVolume, isDraggingVolume, isMenuOpen, resetHideTimer]);

  // Window mouseup / touchend for volume drag
  useEffect(() => {
    const handleGlobalMouseUp = () => {
      setIsDraggingVolume(false);
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  // Handle menu click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
        setMenuView('main');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Handle Fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(document.fullscreenElement === containerRef.current);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Time & Buffer update
  const handleTimeUpdate = () => {
    if (!videoRef.current || isScrubbing) return;
    setCurrentTime(videoRef.current.currentTime);

    if (videoRef.current.buffered.length > 0) {
      const end = videoRef.current.buffered.end(videoRef.current.buffered.length - 1);
      setBuffered(end);
    }
  };

  const handleLoadedMetadata = () => {
    if (!videoRef.current) return;
    setDuration(videoRef.current.duration);
    const height = videoRef.current.videoHeight;
    if (height >= 1080) {
      setDetectedResolution('1080p');
    } else if (height >= 720) {
      setDetectedResolution('720p');
    } else if (height >= 480) {
      setDetectedResolution('480p');
    } else if (height > 0) {
      setDetectedResolution('360p');
    }
    if (autoPlay) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
    }
  };

  // Play / Pause toggle
  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
      setShowControls(true);
    } else {
      videoRef.current.play();
      setIsPlaying(true);
    }
    resetHideTimer();
  };

  // Seek ±15s
  const seekBy = (delta: number) => {
    if (!videoRef.current) return;
    const newTime = Math.max(0, Math.min(duration, videoRef.current.currentTime + delta));
    videoRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    resetHideTimer();
  };

  // Toggle Mute
  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
    resetHideTimer();
  };

  // Volume hover handlers with graceful debounce
  const handleVolumeMouseEnter = () => {
    if (volumeHideTimerRef.current) {
      clearTimeout(volumeHideTimerRef.current);
      volumeHideTimerRef.current = null;
    }
    setIsHoveringVolume(true);
  };

  const handleVolumeMouseLeave = () => {
    if (isDraggingVolume) return;
    volumeHideTimerRef.current = setTimeout(() => {
      setIsHoveringVolume(false);
    }, 300);
  };

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
    setIsMuted(val === 0);
    resetHideTimer();
  };

  // Quality change
  const handleQualityChange = (qualityLabel: string) => {
    setSelectedQuality(qualityLabel);
    setMenuView('main');
    setIsMenuOpen(false);

    const matchedOption = qualityOptions.find((q) => q.label === qualityLabel);
    if (matchedOption?.src && videoRef.current && matchedOption.src !== videoRef.current.src) {
      const savedTime = videoRef.current.currentTime;
      const wasPlaying = !videoRef.current.paused;
      videoRef.current.src = matchedOption.src;
      videoRef.current.currentTime = savedTime;
      if (wasPlaying) {
        videoRef.current.play().catch(console.error);
      }
    }

    onQualityChange?.(qualityLabel);

    const isVi = language === 'vi';
    const qualityName =
      qualityLabel === 'Auto'
        ? `${isVi ? 'Tự động' : 'Auto'}${detectedResolution ? ` (${detectedResolution})` : ''}`
        : qualityLabel;
    toast.success(`${isVi ? 'Chất lượng video' : 'Video quality'}: ${qualityName}`, {
      id: 'video-quality-toast',
      duration: 2000,
    });
  };

  // Fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen request failed:', err);
    }
  };

  // Picture in Picture
  const togglePiP = async () => {
    if (!videoRef.current) return;
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch (err) {
      console.error('PiP failed:', err);
    }
    setIsMenuOpen(false);
  };

  // Change Speed
  const handleSpeedChange = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackRate(speed);
    }
    setIsMenuOpen(false);
  };

  // Timeline Scrubbing
  const calculateScrubTime = (clientX: number) => {
    if (!progressBarRef.current || duration === 0) return 0;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return pos * duration;
  };

  const handleProgressMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    const newTime = calculateScrubTime(e.clientX);
    setCurrentTime(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const movedTime = calculateScrubTime(moveEvent.clientX);
      setCurrentTime(movedTime);
      if (videoRef.current) {
        videoRef.current.currentTime = movedTime;
      }
    };

    const handleMouseUp = () => {
      setIsScrubbing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleProgressMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration === 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverPos(pos * 100);
    setHoverTime(pos * duration);
  };

  const handleProgressMouseLeave = () => {
    setHoverTime(null);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'k') {
      e.preventDefault();
      togglePlay();
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      seekBy(-15);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      seekBy(15);
    } else if (e.key === 'f') {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === 'm') {
      e.preventDefault();
      toggleMute();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setVolume((prev) => {
        const next = Math.min(1, Math.round((prev + 0.1) * 10) / 10);
        if (videoRef.current) {
          videoRef.current.volume = next;
          videoRef.current.muted = false;
        }
        setIsMuted(false);
        return next;
      });
      resetHideTimer();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setVolume((prev) => {
        const next = Math.max(0, Math.round((prev - 0.1) * 10) / 10);
        if (videoRef.current) {
          videoRef.current.volume = next;
          videoRef.current.muted = next === 0;
        }
        setIsMuted(next === 0);
        return next;
      });
      resetHideTimer();
    }
  };

  const isCurrentHd =
    selectedQuality === '1080p' ||
    selectedQuality === '720p' ||
    (selectedQuality === 'Auto' && (detectedResolution === '1080p' || detectedResolution === '720p'));

  const playedPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedPct = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseMove={resetHideTimer}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => {
        if (isPlaying && !isMenuOpen) setShowControls(false);
      }}
      className={`relative group bg-black overflow-hidden select-none flex items-center justify-center outline-none ${className}`}
      style={style}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        loop={isLooping}
        muted={isMuted}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setShowControls(true);
          onEnded?.();
        }}
        onClick={togglePlay}
        onDoubleClick={toggleFullscreen}
        className={`max-w-full max-h-full object-contain cursor-pointer ${videoClassName}`}
      />

      {/* Top & Bottom Vignette Overlay */}
      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/30 to-transparent" />
        <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      </div>

      {/* Top Controls (Right Aligned Glass Buttons) */}
      {!hideTopControls && (
        <div
          className={`absolute top-4 right-4 z-20 flex items-center gap-2.5 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            title={isFullscreen ? (language === 'vi' ? 'Thoát toàn màn hình (f)' : 'Exit Fullscreen (f)') : (language === 'vi' ? 'Toàn màn hình (f)' : 'Fullscreen (f)')}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Sound / Volume Pill Container */}
          <div
            className={`h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center shadow-lg transition-all duration-300 ${
              isHoveringVolume || isDraggingVolume ? 'px-2.5 gap-2 w-auto' : 'w-10 justify-center'
            }`}
            onMouseEnter={handleVolumeMouseEnter}
            onMouseLeave={handleVolumeMouseLeave}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={toggleMute}
              className="w-6 h-6 flex items-center justify-center hover:scale-110 active:scale-90 transition-transform cursor-pointer flex-shrink-0"
              title={
                isMuted || volume === 0
                  ? language === 'vi'
                    ? 'Bật âm thanh (m)'
                    : 'Unmute (m)'
                  : language === 'vi'
                  ? 'Tắt âm thanh (m)'
                  : 'Mute (m)'
              }
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : volume < 0.5 ? (
                <Volume1 className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            <div
              className={`flex items-center gap-2 overflow-hidden transition-all duration-300 ${
                isHoveringVolume || isDraggingVolume
                  ? 'w-28 sm:w-32 opacity-100'
                  : 'w-0 opacity-0 pointer-events-none'
              }`}
            >
              <input
                type="range"
                min="0"
                max="1"
                step="0.02"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingVolume(true);
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  setIsDraggingVolume(true);
                }}
                className="w-20 sm:w-24 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white hover:bg-white/40"
              />
              <span className="text-[11px] text-white/90 font-mono w-7 text-right flex-shrink-0 select-none">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
          </div>

          {/* Quick HD Quality Badge / Switcher (Temporarily hidden until HLS / qualities is supported) */}
          {qualities && qualities.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen((prev) => !prev || menuView !== 'quality');
                setMenuView('quality');
              }}
              className="h-10 px-3 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center gap-1.5 hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer text-xs font-semibold"
              title={language === 'vi' ? 'Chất lượng video' : 'Video Quality'}
            >
              {isCurrentHd && (
                <span className="px-1 py-0.5 rounded text-[10px] font-bold bg-[#004AC6] text-white leading-none">
                  HD
                </span>
              )}
              <span className="font-mono text-[11px] text-white/90">
                {selectedQuality === 'Auto'
                  ? detectedResolution
                    ? `Auto (${detectedResolution})`
                    : 'Auto'
                  : selectedQuality}
              </span>
            </button>
          )}

          {/* More Options / Settings Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => {
                setIsMenuOpen(!isMenuOpen);
                setMenuView('main');
              }}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              title={language === 'vi' ? 'Cài đặt video' : 'Video Settings'}
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 min-w-52 py-2 bg-black/85 backdrop-blur-lg border border-white/15 rounded-2xl shadow-2xl z-30 text-xs text-white animate-scaleIn">
                {/* MENU VIEW: MAIN */}
                {menuView === 'main' && (
                  <div className="divide-y divide-white/10">
                    <div className="py-1">
                      {/* Quality item (Only show if multiple qualities / HLS available) */}
                      {qualities && qualities.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setMenuView('quality')}
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                        >
                          <span className="flex items-center gap-2 text-white/90 font-medium">
                            <SlidersHorizontal className="w-4 h-4 text-white/70" />
                            <span>{language === 'vi' ? 'Chất lượng' : 'Quality'}</span>
                          </span>
                          <span className="flex items-center gap-1 text-white/60 font-mono text-[11px]">
                            <span>
                              {selectedQuality === 'Auto'
                                ? `${language === 'vi' ? 'Tự động' : 'Auto'}${detectedResolution ? ` (${detectedResolution})` : ''}`
                                : selectedQuality}
                            </span>
                            {isCurrentHd && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#004AC6] text-white">
                                HD
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                          </span>
                        </button>
                      )}

                      {/* Speed item */}
                      <button
                        type="button"
                        onClick={() => setMenuView('speed')}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2 text-white/90 font-medium">
                          <Gauge className="w-4 h-4 text-white/70" />
                          <span>{language === 'vi' ? 'Tốc độ phát' : 'Playback Speed'}</span>
                        </span>
                        <span className="flex items-center gap-1 text-white/60 font-mono text-[11px]">
                          <span>
                            {playbackRate === 1 ? (language === 'vi' ? 'Chuẩn' : 'Normal') : `${playbackRate}x`}
                          </span>
                          <ChevronRight className="w-3.5 h-3.5 text-white/50" />
                        </span>
                      </button>
                    </div>

                    <div className="py-1">
                      {/* Loop Video */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsLooping(!isLooping);
                          setIsMenuOpen(false);
                        }}
                        className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                      >
                        <span className="flex items-center gap-2 text-white/90 font-medium">
                          <RotateCcw className="w-4 h-4 text-white/70" />
                          <span>{language === 'vi' ? 'Lặp lại video' : 'Loop Video'}</span>
                        </span>
                        {isLooping && <Check className="w-4 h-4 text-[#4378FF]" />}
                      </button>

                      {/* Picture in Picture */}
                      <button
                        type="button"
                        onClick={togglePiP}
                        className="w-full px-3 py-2 flex items-center gap-2 text-white/90 font-medium hover:bg-white/15 transition-colors cursor-pointer text-left"
                      >
                        <PictureInPicture2 className="w-4 h-4 text-white/70" />
                        <span>{language === 'vi' ? 'Hình trong hình (PiP)' : 'Picture in Picture'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* MENU VIEW: QUALITY */}
                {menuView === 'quality' && (
                  <div>
                    <div className="px-3 py-2 flex items-center gap-2 font-semibold border-b border-white/10 text-white/90">
                      <button
                        type="button"
                        onClick={() => setMenuView('main')}
                        className="p-1 hover:bg-white/15 rounded-full transition cursor-pointer -ml-1 text-white"
                        title={language === 'vi' ? 'Quay lại' : 'Back'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>{language === 'vi' ? 'Chất lượng video' : 'Video Quality'}</span>
                    </div>
                    <div className="py-1">
                      {qualityOptions.map((q) => {
                        const isSelected = selectedQuality === q.label;
                        return (
                          <button
                            key={q.label}
                            type="button"
                            onClick={() => handleQualityChange(q.label)}
                            className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {q.label === 'Auto' ? (language === 'vi' ? 'Tự động' : 'Auto') : q.label}
                              </span>
                              {q.isHd && (
                                <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-[#004AC6] text-white">
                                  HD
                                </span>
                              )}
                              {q.description && (
                                <span className="text-[10px] text-white/50">
                                  {q.label === 'Auto' && detectedResolution ? `(${detectedResolution})` : q.description}
                                </span>
                              )}
                            </div>
                            {isSelected && <Check className="w-4 h-4 text-[#4378FF]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* MENU VIEW: SPEED */}
                {menuView === 'speed' && (
                  <div>
                    <div className="px-3 py-2 flex items-center gap-2 font-semibold border-b border-white/10 text-white/90">
                      <button
                        type="button"
                        onClick={() => setMenuView('main')}
                        className="p-1 hover:bg-white/15 rounded-full transition cursor-pointer -ml-1 text-white"
                        title={language === 'vi' ? 'Quay lại' : 'Back'}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>{language === 'vi' ? 'Tốc độ phát' : 'Playback Speed'}</span>
                    </div>
                    <div className="py-1">
                      {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <button
                          key={speed}
                          type="button"
                          onClick={() => handleSpeedChange(speed)}
                          className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                        >
                          <span>
                            {speed === 1 ? (language === 'vi' ? 'Chuẩn' : 'Normal') : `${speed}x`}
                          </span>
                          {playbackRate === speed && <Check className="w-4 h-4 text-[#4378FF]" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Center Glass Controls (Rewind 15s - Play/Pause - Forward 15s) */}
      <div
        className={`absolute inset-0 flex items-center justify-center gap-5 sm:gap-7 z-20 transition-all duration-300 pointer-events-none ${
          showControls ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
      >
        {/* Rewind 15s */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            seekBy(-15);
          }}
          className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
          title="Rewind 15s (←)"
        >
          <Rewind15Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>

        {/* Center Play / Pause Glass Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="pointer-events-auto w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-black/55 hover:bg-black/75 backdrop-blur-lg border border-white/25 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-2xl cursor-pointer"
          title={isPlaying ? 'Pause (Space)' : 'Play (Space)'}
        >
          {isPlaying ? (
            <Pause className="w-8 h-8 sm:w-9 sm:h-9 fill-white" />
          ) : (
            <Play className="w-8 h-8 sm:w-9 sm:h-9 fill-white ml-1" />
          )}
        </button>

        {/* Forward 15s */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            seekBy(15);
          }}
          className="pointer-events-auto w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl cursor-pointer"
          title="Forward 15s (→)"
        >
          <Forward15Icon className="w-6 h-6 sm:w-7 sm:h-7" />
        </button>
      </div>

      {/* Bottom Bar: Title, Duration & Timeline Scrub Rail */}
      <div
        className={`absolute bottom-0 inset-x-0 p-4 sm:p-5 z-20 flex flex-col gap-2.5 transition-opacity duration-300 ${
          showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Info & Duration Row */}
        <div className="flex items-end justify-between text-white text-xs sm:text-sm">
          <div className="flex flex-col truncate pr-4">
            {title && (
              <span className="font-semibold text-white/95 truncate drop-shadow-sm text-sm sm:text-base">
                {title}
              </span>
            )}
            {subtitle && (
              <span className="text-white/70 text-xs truncate drop-shadow-sm">{subtitle}</span>
            )}
          </div>
          <div className="font-mono text-[11px] sm:text-xs text-white/90 whitespace-nowrap drop-shadow-sm flex-shrink-0">
            <span>{formatTime(currentTime)}</span>
            <span className="text-white/50 mx-1">/</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Progress Timeline Rail */}
        <div
          ref={progressBarRef}
          onMouseDown={handleProgressMouseDown}
          onMouseMove={handleProgressMouseMove}
          onMouseLeave={handleProgressMouseLeave}
          className="relative h-1.5 hover:h-2.5 bg-white/20 rounded-full cursor-pointer transition-all flex items-center group/rail"
        >
          {/* Buffered track */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white/30 rounded-full pointer-events-none"
            style={{ width: `${bufferedPct}%` }}
          />

          {/* Played track */}
          <div
            className="absolute left-0 top-0 bottom-0 bg-white rounded-full pointer-events-none flex items-center justify-end"
            style={{ width: `${playedPct}%` }}
          >
            {/* Scrubber thumb */}
            <div className="w-3.5 h-3.5 rounded-full bg-white shadow-md scale-0 group-hover/rail:scale-100 transition-transform -mr-1.5" />
          </div>

          {/* Hover Time Tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-7 px-2 py-0.5 rounded bg-black/80 backdrop-blur-xs text-[10px] text-white font-mono pointer-events-none -translate-x-1/2"
              style={{ left: `${hoverPos}%` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomVideoPlayer;
