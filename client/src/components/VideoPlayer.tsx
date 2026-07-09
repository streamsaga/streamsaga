import { useEffect, useRef, useState } from 'react';
import { Movie, Series, Episode, QualityVariant } from '../types';
import Hls from 'hls.js';
import { Play, Pause, RotateCcw, RotateCw, Volume2, VolumeX, Volume1, Maximize, Minimize, ArrowLeft, Settings } from 'lucide-react';

interface VideoPlayerProps {
  item: Movie | Episode;
  seriesContext?: Series | null;
  onBack: () => void;
}

export function VideoPlayer({ item, seriesContext, onBack }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [buffered, setBuffered] = useState(0); // % 0-100
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [qualities, setQualities] = useState<QualityVariant[]>([]);
  const [selectedQualityUrl, setSelectedQualityUrl] = useState<string>('');
  const [showQualityMenu, setShowQualityMenu] = useState(false);

  const progressBarRef = useRef<HTMLDivElement>(null);
  const volumeBarRef = useRef<HTMLDivElement>(null);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const controlsTimeoutRef = useRef<number | null>(null);

  // Extract titles
  const isMovie = 'duration' in item && !('episodeNumber' in item);
  const isEpisode = 'episodeNumber' in item;

  let title = item.title;
  let subtitle = '';
  if (isEpisode && seriesContext) {
    title = seriesContext.title;
    subtitle = `Season ${(item as Episode).season} • Episode ${(item as Episode).episodeNumber} — ${item.title}`;
  } else if (isMovie) {
    subtitle = 'Movie';
  }

  // Load video source & setup hls.js if applicable
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Reset player states
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);

    // Collect available quality variants
    const itemQualities = item.qualities || [];
    setQualities(itemQualities);

    // Get the playlist or video source URL
    // If we have selected a quality, play that. Otherwise, use HLS Master playlist, fallback to first quality, or trailer
    const masterUrl = item.hlsMasterPlaylistUrl;
    const initialUrl = selectedQualityUrl || masterUrl || (itemQualities[0]?.url) || '';

    if (!initialUrl) return;

    const isHlsSource = initialUrl.endsWith('.m3u8') || initialUrl.includes('/master.m3u8') || initialUrl.includes('/transcoded/');

    if (isHlsSource) {
      if (Hls.isSupported()) {
        // Destroy existing HLS instance if any
        if (hlsRef.current) {
          hlsRef.current.destroy();
        }

        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
        });
        hlsRef.current = hls;

        hls.loadSource(initialUrl);
        hls.attachMedia(video);

        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => {});
          setIsPlaying(true);
        });

        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                hls.destroy();
                break;
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Native HLS support (Safari)
        video.src = initialUrl;
        video.addEventListener('loadedmetadata', () => {
          video.play().catch(() => {});
          setIsPlaying(true);
        });
      }
    } else {
      // Direct MP4 playback
      video.src = initialUrl;
      video.load();
      video.play().catch(() => {});
      setIsPlaying(true);
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [item, selectedQualityUrl]);

  // Handle controls visibility timer
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      window.clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = window.setTimeout(() => {
      if (isPlaying) {
        setShowControls(false);
        setShowQualityMenu(false);
      }
    }, 3000);
  };

  useEffect(() => {
    resetControlsTimeout();
    return () => {
      if (controlsTimeoutRef.current) window.clearTimeout(controlsTimeoutRef.current);
    };
  }, [isPlaying]);

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    // Update buffered
    if (video.buffered.length > 0) {
      const buf = video.buffered.end(video.buffered.length - 1);
      setBuffered(video.duration ? (buf / video.duration) * 100 : 0);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const handlePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      video.play().catch(() => {});
      setIsPlaying(true);
    }
    resetControlsTimeout();
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(videoRef.current.duration, videoRef.current.currentTime + seconds)
      );
    }
    resetControlsTimeout();
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    setCurrentTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
    resetControlsTimeout();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = Number(e.target.value);
    setVolume(vol);
    setIsMuted(vol === 0);
    if (videoRef.current) {
      videoRef.current.volume = vol;
      videoRef.current.muted = vol === 0;
    }
    resetControlsTimeout();
  };

  const handleToggleMute = () => {
    const newMute = !isMuted;
    setIsMuted(newMute);
    if (videoRef.current) {
      videoRef.current.muted = newMute;
      videoRef.current.volume = newMute ? 0 : volume;
    }
    resetControlsTimeout();
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error('Fullscreen failed:', err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
    resetControlsTimeout();
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || seconds === Infinity) return '00:00';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const pad = (num: number) => String(num).padStart(2, '0');

    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  const playedPct = duration ? (currentTime / duration) * 100 : 0;

  /* ─── Seek bar: pointer-capture drag ─────────────────────────── */
  const isDraggingSeek = useRef(false);

  const applySeek = (clientX: number) => {
    const bar = progressBarRef.current;
    const video = videoRef.current;
    if (!bar || !video || !duration) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    const t = ratio * duration;
    video.currentTime = t;
    setCurrentTime(t);
  };

  const handleSeekPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingSeek.current = true;
    applySeek(e.clientX);
    resetControlsTimeout();
  };

  const handleSeekPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    // Always update tooltip
    const bar = progressBarRef.current;
    if (bar && duration) {
      const rect = bar.getBoundingClientRect();
      const ratio = Math.min(Math.max((e.clientX - rect.left) / rect.width, 0), 1);
      setHoverTime(ratio * duration);
      setHoverX(e.clientX - rect.left);
    }
    if (!isDraggingSeek.current) return;
    applySeek(e.clientX);
  };

  const handleSeekPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSeek.current) return;
    isDraggingSeek.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    applySeek(e.clientX);
    resetControlsTimeout();
  };

  const handleProgressBarLeave = () => setHoverTime(null);

  /* ─── Volume bar: pointer-capture drag ───────────────────────── */
  const isDraggingVol = useRef(false);

  const applyVolume = (clientX: number) => {
    const bar = volumeBarRef.current;
    const video = videoRef.current;
    if (!bar || !video) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1);
    setVolume(ratio);
    setIsMuted(ratio === 0);
    video.volume = ratio;
    video.muted = ratio === 0;
  };

  const handleVolPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingVol.current = true;
    applyVolume(e.clientX);
    resetControlsTimeout();
  };

  const handleVolPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVol.current) return;
    applyVolume(e.clientX);
  };

  const handleVolPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingVol.current) return;
    isDraggingVol.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
    applyVolume(e.clientX);
    resetControlsTimeout();
  };

  const volPct = isMuted ? 0 : volume * 100;

  const VolumeIcon = isMuted || volume === 0
    ? VolumeX
    : volume < 0.4
    ? Volume1
    : Volume2;

  return (
    <div
      ref={containerRef}
      onMouseMove={resetControlsTimeout}
      onClick={resetControlsTimeout}
      className="fixed inset-0 z-50 bg-black flex items-center justify-center overflow-hidden select-none cursor-none"
      style={{ cursor: showControls ? 'default' : 'none' }}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onClick={(e) => {
          e.stopPropagation();
          handlePlayPause();
        }}
        onEnded={() => setIsPlaying(false)}
        className="w-full h-full object-contain"
        playsInline
      />

      {/* Control Overlay Backdrop */}
      <div
        className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/70 flex flex-col justify-between transition-opacity duration-300 pointer-events-none ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top bar (Header) */}
        <div className="p-6 md:p-8 flex items-center gap-4 pointer-events-auto">
          <button
            onClick={onBack}
            className="text-white hover:text-accent p-2 rounded-full bg-black/40 border border-white/10 hover:border-accent/40 transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="flex flex-col">
            <h1 className="text-lg md:text-xl font-bold text-text uppercase tracking-wide truncate max-w-[250px] sm:max-w-md">
              {title}
            </h1>
            {subtitle && <span className="text-xs text-muted mt-0.5">{subtitle}</span>}
          </div>
        </div>

        {/* Center play buttons overlay (if hovered) */}
        <div className="flex items-center justify-center gap-8 pointer-events-auto">
          <button
            onClick={() => handleSkip(-10)}
            className="text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
            title="Rewind 10s"
          >
            <RotateCcw className="w-8 h-8" />
          </button>

          <button
            onClick={handlePlayPause}
            className="text-white bg-accent p-5 rounded-full hover:bg-accent-hover hover:scale-110 shadow-lg hover:shadow-accent/40 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-8 h-8 fill-white" /> : <Play className="w-8 h-8 fill-white ml-1" />}
          </button>

          <button
            onClick={() => handleSkip(10)}
            className="text-white/80 hover:text-white p-3 rounded-full hover:bg-white/10 transition-colors"
            title="Fast Forward 10s"
          >
            <RotateCw className="w-8 h-8" />
          </button>
        </div>

        {/* Bottom controls panel */}
        <div className="p-6 md:p-8 space-y-4 pointer-events-auto">
          {/* Progress bar */}
          <div className="flex flex-col gap-1.5">
            {/* Seek area */}
            <div
              ref={progressBarRef}
              className="group/seek relative w-full cursor-pointer py-3 touch-none"
              onPointerDown={handleSeekPointerDown}
              onPointerMove={handleSeekPointerMove}
              onPointerUp={handleSeekPointerUp}
              onPointerLeave={handleProgressBarLeave}
            >
              {/* Tooltip */}
              {hoverTime !== null && (
                <div
                  className="absolute -top-7 -translate-x-1/2 rounded px-2 py-0.5 text-[10px] font-mono bg-black/80 text-white border border-white/10 pointer-events-none z-50 whitespace-nowrap"
                  style={{ left: `${hoverX}px` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              {/* Track */}
              <div
                className="relative h-1 w-full rounded-full overflow-hidden group-hover/seek:h-1.5 transition-all duration-150"
                style={{ background: 'rgba(255,255,255,0.15)' }}
              >
                {/* Buffered */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full transition-all duration-500"
                  style={{ width: `${buffered}%`, background: 'rgba(255,255,255,0.30)' }}
                />
                {/* Played */}
                <div
                  className="absolute left-0 top-0 h-full rounded-full"
                  style={{
                    width: `${playedPct}%`,
                    background: 'linear-gradient(90deg,#22d3ee 0%,#818cf8 55%,#f472b6 100%)',
                    boxShadow: '0 0 8px 2px rgba(129,140,248,0.5)',
                  }}
                />
              </div>

              {/* Thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border-2 border-white opacity-0 group-hover/seek:opacity-100 transition-opacity duration-150 pointer-events-none"
                style={{
                  left: `${playedPct}%`,
                  background: 'linear-gradient(135deg,#818cf8,#f472b6)',
                  boxShadow: '0 0 10px 3px rgba(244,114,182,0.55)',
                }}
              />
            </div>

            {/* Time + legend row */}
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-3">
                <span className="text-white/90">{formatTime(currentTime)}</span>
                <span className="hidden sm:flex items-center gap-3 text-[10px] font-mono">
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-5 rounded-full" style={{ background: 'linear-gradient(90deg,#22d3ee,#818cf8,#f472b6)' }} />
                    <span className="text-white/50">Played</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-4 rounded-full" style={{ background: 'rgba(255,255,255,0.30)' }} />
                    <span className="text-white/50">Buffered</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="inline-block h-1.5 w-4 rounded-full" style={{ background: 'rgba(255,255,255,0.15)' }} />
                    <span className="text-white/50">Remaining</span>
                  </span>
                </span>
              </div>
              <span className="text-muted">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls toolbar */}
          <div className="flex items-center justify-between">
            {/* Left: Volume */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleMute}
                className="text-white/90 hover:text-white transition-colors flex-shrink-0"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                <VolumeIcon className={`w-5 h-5 ${isMuted ? 'text-red-400' : volPct > 60 ? 'text-accent' : 'text-white/90'}`} />
              </button>

              {/* Custom volume bar */}
              <div className="flex items-center gap-2">
                <div
                  ref={volumeBarRef}
                  className="group/vol relative w-20 sm:w-28 cursor-pointer py-2 touch-none"
                  onPointerDown={handleVolPointerDown}
                  onPointerMove={handleVolPointerMove}
                  onPointerUp={handleVolPointerUp}
                >
                  {/* Track */}
                  <div
                    className="relative h-1 w-full rounded-full overflow-hidden group-hover/vol:h-1.5 transition-all duration-150"
                    style={{ background: 'rgba(255,255,255,0.18)' }}
                  >
                    {/* Fill */}
                    <div
                      className="absolute left-0 top-0 h-full rounded-full transition-none"
                      style={{
                        width: `${volPct}%`,
                        background:
                          volPct > 70
                            ? 'linear-gradient(90deg,#22c55e,#06b6d4)'
                            : volPct > 30
                            ? 'linear-gradient(90deg,#22c55e,#60a5fa)'
                            : 'linear-gradient(90deg,#22c55e,#22c55e)',
                        boxShadow: `0 0 6px 1px ${volPct > 50 ? 'rgba(6,182,212,0.5)' : 'rgba(34,197,94,0.45)'}`,
                      }}
                    />
                  </div>

                  {/* Thumb dot */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3 w-3 rounded-full border-2 border-white opacity-0 group-hover/vol:opacity-100 transition-opacity duration-150 pointer-events-none"
                    style={{
                      left: `${volPct}%`,
                      background: volPct > 50 ? '#06b6d4' : '#22c55e',
                      boxShadow: `0 0 8px 2px ${volPct > 50 ? 'rgba(6,182,212,0.6)' : 'rgba(34,197,94,0.6)'}`,
                    }}
                  />
                </div>

                {/* Percentage label */}
                <span className="text-[10px] font-mono text-white/50 w-7 text-right tabular-nums">
                  {Math.round(volPct)}%
                </span>
              </div>
            </div>

            {/* Right: Quality selector, Fullscreen */}
            <div className="flex items-center gap-4 relative">
              {/* Quality Settings */}
              {qualities.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowQualityMenu(!showQualityMenu)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                      showQualityMenu
                        ? 'bg-accent/15 border-accent text-accent'
                        : 'bg-black/40 hover:bg-black/60 border-border/80 text-white/90'
                    }`}
                  >
                    <Settings className="w-4 h-4 animate-spin-slow" />
                    Quality
                  </button>

                  {/* Quality selector dropdown */}
                  {showQualityMenu && (
                    <div className="absolute right-0 bottom-full mb-2 w-32 bg-surface border border-border shadow-2xl rounded-lg py-1 overflow-hidden z-40">
                      <button
                        onClick={() => {
                          setSelectedQualityUrl('');
                          setShowQualityMenu(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface2 ${
                          selectedQualityUrl === '' ? 'text-accent' : 'text-text/90'
                        }`}
                      >
                        Auto (HLS)
                      </button>
                      {qualities.map((q) => (
                        <button
                          key={q.resolution}
                          onClick={() => {
                            setSelectedQualityUrl(q.url);
                            setShowQualityMenu(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs font-semibold hover:bg-surface2 ${
                            selectedQualityUrl === q.url ? 'text-accent' : 'text-text/90'
                          }`}
                        >
                          {q.resolution}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Fullscreen Button */}
              <button
                onClick={handleToggleFullscreen}
                className="text-white/90 hover:text-white p-1 rounded-md transition-colors"
              >
                {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
