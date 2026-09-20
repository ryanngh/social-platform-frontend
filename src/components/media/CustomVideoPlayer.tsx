import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize,
  MoreVertical,
  Check,
  PictureInPicture2,
  RotateCcw,
} from 'lucide-react';

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(initialMuted);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLooping, setIsLooping] = useState(loop);

  // UI state
  const [showControls, setShowControls] = useState(true);
  const [isHoveringVolume, setIsHoveringVolume] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [isScrubbing, setIsScrubbing] = useState(false);

  // Auto-hide controls timer
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
    // Only auto-hide if playing and menu is closed and not scrubbing
    if (isPlaying && !isMenuOpen && !isHoveringVolume && !isScrubbing) {
      hideTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2500);
    }
  }, [isPlaying, isMenuOpen, isHoveringVolume, isScrubbing]);

  useEffect(() => {
    resetHideTimer();
    return () => {
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, [isPlaying, resetHideTimer]);

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

  // Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
      setIsMuted(val === 0);
    }
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
    }
  };

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

      {/* Top Controls (Right Aligned Glass Buttons matching Image 2) */}
      {!hideTopControls && (
        <div
          className={`absolute top-4 right-4 z-20 flex items-center gap-2.5 transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen (f)' : 'Fullscreen (f)'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>

          {/* Sound / Volume with flyout */}
          <div
            className="relative"
            onMouseEnter={() => setIsHoveringVolume(true)}
            onMouseLeave={() => setIsHoveringVolume(false)}
          >
            <button
              type="button"
              onClick={toggleMute}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              title={isMuted ? 'Unmute (m)' : 'Mute (m)'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>

            {/* Volume slider popover on hover */}
            {isHoveringVolume && (
              <div className="absolute right-0 top-12 p-3 bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl shadow-xl flex items-center gap-2 animate-fadeIn z-30">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-24 h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-white"
                />
                <span className="text-[11px] text-white/90 font-mono w-7 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            )}
          </div>

          {/* More Options / Settings Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg cursor-pointer"
              title="More settings"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 top-12 w-48 py-2 bg-black/85 backdrop-blur-lg border border-white/15 rounded-2xl shadow-2xl z-30 text-xs text-white divide-y divide-white/10 animate-scaleIn">
                <div className="px-3 py-1.5 font-semibold text-white/60 text-[10px] uppercase tracking-wider">
                  Playback Speed
                </div>
                <div className="py-1">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                    <button
                      key={speed}
                      type="button"
                      onClick={() => handleSpeedChange(speed)}
                      className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                    >
                      <span>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                      {playbackRate === speed && <Check className="w-4 h-4 text-[#4378FF]" />}
                    </button>
                  ))}
                </div>

                <div className="py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsLooping(!isLooping);
                      setIsMenuOpen(false);
                    }}
                    className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-white/15 transition-colors cursor-pointer text-left"
                  >
                    <span className="flex items-center gap-2">
                      <RotateCcw className="w-3.5 h-3.5" /> Loop Video
                    </span>
                    {isLooping && <Check className="w-4 h-4 text-[#4378FF]" />}
                  </button>

                  <button
                    type="button"
                    onClick={togglePiP}
                    className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-white/15 transition-colors cursor-pointer text-left"
                  >
                    <PictureInPicture2 className="w-3.5 h-3.5" /> Picture in Picture
                  </button>
                </div>
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
