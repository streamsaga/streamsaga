import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import toast from 'react-hot-toast';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  Loader2,
  Volume1,
  RotateCcw,
} from 'lucide-react';

interface VideoPlayerProps {
  url: string;
  onClose?: () => void;
}

export default function VideoPlayer({ url }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [error, setError] = useState<string | null>(null);
  
  // HLS level states
  const [hlsInstance, setHlsInstance] = useState<Hls | null>(null);
  const [qualities, setQualities] = useState<string[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 is Auto
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);

  // Progress bar states
  const [buffered, setBuffered] = useState(0); // percentage 0–100
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const controlsTimeoutRef = useRef<any>(null);

  // Initialize HLS / Video Source
  useEffect(() => {
    let hls: Hls | null = null;
    const video = videoRef.current;
    if (!video || !url) return;

    setIsLoading(true);
    setIsPlaying(false);
    setError(null);

    if (url.endsWith('.m3u8') || url.includes('/transcoded/')) {
      if (Hls.isSupported()) {
        hls = new Hls({
          autoStartLoad: true,
          startLevel: -1, // Auto
        });
        hls.loadSource(url);
        hls.attachMedia(video);
        setHlsInstance(hls);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
          setError(null);
          // Map heights (resolutions) of available streams
          const levels = hls!.levels.map((lvl) => `${lvl.height}p`);
          setQualities(levels);
        });

        hls.on(Hls.Events.LEVEL_SWITCHED, (_event, data) => {
          // If level is auto, data.level is index of auto level
          if (hls!.loadLevel === -1) {
            // Keep Auto active
          }
        });

        hls.on(Hls.Events.ERROR, (_event, data) => {
          console.error('HLS error:', data);
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
              if (data.response && data.response.code === 404) {
                setError('Video stream not found (404). Transcoding may have failed, or files were deleted.');
                setIsLoading(false);
              } else {
                hls!.startLoad();
              }
            } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
              hls!.recoverMediaError();
            } else {
              setError('Fatal error playing video stream.');
              setIsLoading(false);
              hls!.destroy();
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS (Safari)
        video.src = url;
        video.addEventListener('loadedmetadata', () => {
          setIsLoading(false);
        });
        video.addEventListener('error', () => {
          setError('Failed to load HLS stream.');
          setIsLoading(false);
        });
      }
    } else {
      // Direct Mp4
      video.src = url;
      video.addEventListener('loadedmetadata', () => {
        setIsLoading(false);
        setDuration(video.duration || 0);
      });
      video.addEventListener('error', () => {
        setError('Failed to load video file.');
        setIsLoading(false);
      });
    }

    return () => {
      if (hls) {
        hls.destroy();
      }
      setHlsInstance(null);
      setQualities([]);
      setCurrentQuality(-1);
    };
  }, [url]);

  // Handle Play/Pause
  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(video.currentTime);
    const onDurationChange = () => setDuration(video.duration || 0);
    const onProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const dur = video.duration || 1;
        setBuffered((bufferedEnd / dur) * 100);
      }
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);

    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('durationchange', onDurationChange);
    video.addEventListener('progress', onProgress);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);

    return () => {
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('durationchange', onDurationChange);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
    };
  }, []);

  // Format Time (00:00)
  const formatTime = (timeInSeconds: number) => {
    if (isNaN(timeInSeconds)) return '0:00';
    const hours = Math.floor(timeInSeconds / 3600);
    const minutes = Math.floor((timeInSeconds % 3600) / 60);
    const seconds = Math.floor(timeInSeconds % 60);

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hours > 0) {
      return `${hours}:${pad(minutes)}:${pad(seconds)}`;
    }
    return `${minutes}:${pad(seconds)}`;
  };

  // Handle Seek progress click
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const seekTime = Number(e.target.value);
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle Volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const vol = Number(e.target.value);
    setVolume(vol);
    video.volume = vol;
    setIsMuted(vol === 0);
  };

  // Toggle Mute
  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const nextMute = !isMuted;
    setIsMuted(nextMute);
    video.muted = nextMute;
  };

  // Toggle Fullscreen
  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch(() => {});
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      }).catch(() => {});
    }
  };

  // Listen for fullscreen state changes (e.g. Esc button pressed)
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Handle Mouse movement to auto-fade controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowSettingsMenu(false);
      }
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, []);

  // Handle Quality Selection
  const handleQualityChange = (levelIndex: number) => {
    if (hlsInstance) {
      hlsInstance.currentLevel = levelIndex;
      setCurrentQuality(levelIndex);
      setShowSettingsMenu(false);
      
      // Notify toast
      const label = levelIndex === -1 ? 'Auto' : qualities[levelIndex];
      toast.success(`Switched quality to ${label}`, { id: 'quality-switch' });
    }
  };

  // Handle Speed Selection
  const handleSpeedChange = (rate: number) => {
    const video = videoRef.current;
    if (video) {
      video.playbackRate = rate;
      setPlaybackRate(rate);
      setShowSettingsMenu(false);
    }
  };

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const video = videoRef.current;
      if (!video) return;

      // Prevent triggering if editing fields
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(duration, video.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          const nextVolUp = Math.min(1, video.volume + 0.05);
          setVolume(nextVolUp);
          video.volume = nextVolUp;
          setIsMuted(false);
          break;
        case 'ArrowDown':
          e.preventDefault();
          const nextVolDown = Math.max(0, video.volume - 0.05);
          setVolume(nextVolDown);
          video.volume = nextVolDown;
          setIsMuted(nextVolDown === 0);
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, duration]);

  const percentage = duration ? (currentTime / duration) * 100 : 0;

  // Handle mouse hover on progress bar to show tooltip time
  const handleProgressHover = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    if (!bar || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    setHoverTime(ratio * duration);
    setHoverX(e.clientX - rect.left);
  };

  const handleProgressLeave = () => setHoverTime(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
    const seekTime = ratio * duration;
    video.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative flex aspect-video w-full flex-col overflow-hidden rounded-lg bg-black group select-none"
    >
      {/* Video Stream Element */}
      <video
        ref={videoRef}
        onClick={togglePlay}
        className="h-full w-full object-contain cursor-pointer"
        playsInline
      />

      {/* Loading Spinner */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <Loader2 className="animate-spin text-accent" size={48} />
        </div>
      )}

      {/* Error Overlay */}
      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-6 text-center z-20">
          <RotateCcw className="text-draft mb-3 animate-pulse" size={36} />
          <p className="text-sm font-semibold text-draft max-w-md">{error}</p>
        </div>
      )}

      {/* Double-click big play/pause feedback overlay */}
      <div 
        onClick={togglePlay}
        className={`absolute inset-0 flex items-center justify-center transition-all pointer-events-auto cursor-pointer duration-300 ${
          showControls ? 'bg-black/35' : 'bg-transparent'
        }`}
      >
        {!isLoading && showControls && (
          <button 
            onClick={(e) => { e.stopPropagation(); togglePlay(); }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 text-white border border-white/20 hover:scale-110 active:scale-95 transition-transform duration-200"
          >
            {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} className="translate-x-0.5" fill="currentColor" />}
          </button>
        )}
      </div>

      {/* Sleek Custom Controls Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-10 flex flex-col bg-gradient-to-t from-black/90 via-black/60 to-transparent p-4 transition-all duration-300 ${
          showControls ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
        }`}
      >
        {/* Multi-colour Progress Bar */}
        <div
          ref={progressBarRef}
          className="group/slider relative w-full mb-3 cursor-pointer py-2"
          onMouseMove={handleProgressHover}
          onMouseLeave={handleProgressLeave}
          onClick={handleProgressClick}
        >
          {/* Hover time tooltip */}
          {hoverTime !== null && (
            <div
              className="absolute -top-8 flex -translate-x-1/2 items-center justify-center rounded px-1.5 py-0.5 text-[10px] font-mono bg-black/80 text-white border border-white/10 pointer-events-none z-50 whitespace-nowrap"
              style={{ left: `${hoverX}px` }}
            >
              {formatTime(hoverTime)}
            </div>
          )}

          {/* Track container */}
          <div className="relative h-1 w-full rounded-full overflow-hidden transition-all duration-200 group-hover/slider:h-1.5" style={{ background: 'rgba(255,255,255,0.12)' }}>
            {/* Buffered segment — white/30 shown behind played */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-all duration-300"
              style={{
                width: `${buffered}%`,
                background: 'rgba(255,255,255,0.28)',
              }}
            />
            {/* Played segment — vibrant gradient */}
            <div
              className="absolute left-0 top-0 h-full rounded-full transition-none"
              style={{
                width: `${percentage}%`,
                background: 'linear-gradient(90deg, #22d3ee 0%, #818cf8 55%, #f472b6 100%)',
                boxShadow: '0 0 8px 1px rgba(129,140,248,0.55)',
              }}
            />
          </div>

          {/* Thumb dot */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white shadow-lg scale-0 group-hover/slider:scale-100 transition-transform duration-150 pointer-events-none"
            style={{
              left: `${percentage}%`,
              background: 'linear-gradient(135deg, #818cf8, #f472b6)',
              boxShadow: '0 0 10px 3px rgba(244,114,182,0.6)',
            }}
          />

          {/* Invisible range input for native seek interaction */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            value={currentTime}
            onChange={handleSeek}
            className="absolute inset-0 w-full h-full cursor-pointer opacity-0"
          />
        </div>

        {/* Playback colour legend */}
        <div className="flex items-center gap-4 text-[10px] font-mono mb-2 select-none">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-6 rounded-full" style={{ background: 'linear-gradient(90deg,#22d3ee,#818cf8,#f472b6)' }} />
            <span className="text-white/60">Played {formatTime(currentTime)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full" style={{ background: 'rgba(255,255,255,0.28)' }} />
            <span className="text-white/60">Buffered {formatTime((buffered / 100) * duration)}</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2 w-4 rounded-full" style={{ background: 'rgba(255,255,255,0.12)' }} />
            <span className="text-white/60">Remaining {formatTime(Math.max(0, duration - currentTime))}</span>
          </span>
        </div>

        {/* Buttons and Settings row */}
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-4 text-white">
            {/* Play/Pause Button */}
            <button onClick={togglePlay} className="hover:text-accent transition-colors">
              {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/volume">
              <button onClick={toggleMute} className="hover:text-accent transition-colors">
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : volume < 0.5 ? (
                  <Volume1 size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-0 scale-x-0 origin-left transition-all duration-200 group-hover/volume:w-16 group-hover/volume:scale-x-100 h-1 accent-accent bg-white/30 rounded-lg cursor-pointer"
              />
            </div>

            {/* Time Indicator */}
            <span className="font-mono text-xs select-none">
              {formatTime(currentTime)} <span className="text-white/40">/</span> {formatTime(duration)}
            </span>
          </div>

          <div className="flex items-center gap-4 text-white relative">
            {/* Settings (Quality / Speed) Trigger */}
            <button 
              onClick={() => setShowSettingsMenu(!showSettingsMenu)} 
              className={`hover:text-accent transition-colors ${showSettingsMenu ? 'text-accent rotate-45' : ''}`}
            >
              <Settings size={18} />
            </button>

            {/* Custom Settings Popover Panel */}
            {showSettingsMenu && (
              <div className="absolute bottom-10 right-0 w-48 rounded-lg bg-surface border border-border/80 shadow-panel p-2 text-xs flex flex-col space-y-2 z-55">
                {/* HLS Video Quality Selection */}
                {qualities.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-muted px-2 block">Quality</span>
                    <button
                      onClick={() => handleQualityChange(-1)}
                      className={`w-full text-left px-2.5 py-1 rounded transition-colors ${
                        currentQuality === -1 ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-surface2 text-text'
                      }`}
                    >
                      Auto
                    </button>
                    {qualities.map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQualityChange(idx)}
                        className={`w-full text-left px-2.5 py-1 rounded transition-colors ${
                          currentQuality === idx ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-surface2 text-text'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-border/40 my-1" />

                {/* Playback speed selector */}
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-mono tracking-wider text-muted px-2 block">Speed</span>
                  {[0.5, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handleSpeedChange(rate)}
                      className={`w-full text-left px-2.5 py-1 rounded transition-colors ${
                        playbackRate === rate ? 'bg-accent/20 text-accent font-semibold' : 'hover:bg-surface2 text-text'
                      }`}
                    >
                      {rate === 1 ? 'Normal' : `${rate}x`}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Fullscreen Button */}
            <button onClick={toggleFullscreen} className="hover:text-accent transition-colors">
              {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
