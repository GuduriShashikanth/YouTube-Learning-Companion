import { useEffect, useRef, useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, Minimize } from 'lucide-react';

interface VideoPlayerProps {
  youtubeVideoId: string;
  startTime?: number;
  onTimeUpdate?: (seconds: number) => void;
}

let apiLoadingPromise: Promise<void> | null = null;
function loadYouTubeAPI(): Promise<void> {
  if ((window as any).YT) return Promise.resolve();
  if (apiLoadingPromise) return apiLoadingPromise;

  apiLoadingPromise = new Promise<void>((resolve) => {
    if (document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      if ((window as any).YT) {
        resolve();
      } else {
        const prev = (window as any).onYouTubeIframeAPIReady;
        (window as any).onYouTubeIframeAPIReady = () => {
          if (prev) prev();
          resolve();
        };
      }
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

    const prevReady = (window as any).onYouTubeIframeAPIReady;
    (window as any).onYouTubeIframeAPIReady = () => {
      if (prevReady) prevReady();
      resolve();
    };
  });

  return apiLoadingPromise;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoPlayer({
  youtubeVideoId,
  startTime,
  onTimeUpdate,
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(1);
  const [volume, setVolume] = useState(50);
  const [isMuted, setIsMuted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track fullscreen changes
  useEffect(() => {
    const handleFsChange = () => {
      const fs =
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement;
      setIsFullscreen(!!fs);
      setControlsVisible(true);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    document.addEventListener('webkitfullscreenchange', handleFsChange);
    document.addEventListener('msfullscreenchange', handleFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFsChange);
      document.removeEventListener('webkitfullscreenchange', handleFsChange);
      document.removeEventListener('msfullscreenchange', handleFsChange);
    };
  }, []);

  // Auto-hide controls after 2.5s of inactivity (always, since controls are a transparent overlay)
  const resetHideTimer = () => {
    setControlsVisible(true);
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 1000);
  };

  // Start the initial hide timer on mount
  useEffect(() => {
    hideControlsTimer.current = setTimeout(() => setControlsVisible(false), 1000);
    return () => {
      if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const initPlayer = async () => {
      await loadYouTubeAPI();
      if (!active) return;

      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }

      new (window as any).YT.Player('youtube-player-iframe', {
        videoId: youtubeVideoId,
        playerVars: {
          controls: 0,
          rel: 0,
          modestbranding: 1,
          disablekb: 1,
          fs: 0,          // disable YouTube's own fullscreen button (we handle it)
          start: startTime !== undefined ? Math.floor(startTime) : undefined,
        },
        events: {
          onReady: (event: any) => {
            if (!active) return;
            playerRef.current = event.target;
            setIsReady(true);
            setDuration(event.target.getDuration() || 1);
            setVolume(event.target.getVolume() || 50);
            setIsMuted(event.target.isMuted() || false);
            if (startTime !== undefined) {
              event.target.seekTo(startTime, true);
            }
          },
          onStateChange: (event: any) => {
            if (!active) return;
            const state = event.data;
            setIsPlaying(state === 1);
            if (state === 1) {
              setDuration(event.target.getDuration() || 1);
            }
          },
        },
      });
    };

    initPlayer();

    return () => {
      active = false;
      if (playerRef.current) {
        try { playerRef.current.destroy(); } catch (e) {}
        playerRef.current = null;
      }
      setIsReady(false);
    };
  }, [youtubeVideoId]);

  // Handle startTime updates from clicking timestamps
  useEffect(() => {
    if (playerRef.current && isReady && startTime !== undefined) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
    }
  }, [startTime, isReady]);

  // Periodic time updates
  useEffect(() => {
    let intervalId: any = null;
    if (isPlaying && playerRef.current && isReady) {
      intervalId = setInterval(() => {
        if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
          const t = playerRef.current.getCurrentTime();
          setCurrentTime(t);
          onTimeUpdate?.(t);
        }
      }, 250);
    }
    return () => { if (intervalId) clearInterval(intervalId); };
  }, [isPlaying, onTimeUpdate, isReady]);

  const togglePlay = () => {
    if (!playerRef.current || !isReady) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const toggleMute = () => {
    if (!playerRef.current || !isReady) return;
    if (isMuted) {
      playerRef.current.unMute();
      setIsMuted(false);
    } else {
      playerRef.current.mute();
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseInt(e.target.value, 10);
    setVolume(v);
    if (playerRef.current && isReady) {
      playerRef.current.setVolume(v);
      if (v > 0 && isMuted) {
        playerRef.current.unMute();
        setIsMuted(false);
      }
    }
  };

  const handleScrub = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);
    onTimeUpdate?.(newTime);
    if (playerRef.current && isReady) {
      playerRef.current.seekTo(newTime, true);
    }
  };

  const toggleFullscreen = () => {
    const el = wrapperRef.current;
    if (!el) return;
    if (!isFullscreen) {
      if (el.requestFullscreen) el.requestFullscreen();
      else if ((el as any).webkitRequestFullscreen) (el as any).webkitRequestFullscreen();
      else if ((el as any).msRequestFullscreen) (el as any).msRequestFullscreen();
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
      else if ((document as any).webkitExitFullscreen) (document as any).webkitExitFullscreen();
      else if ((document as any).msExitFullscreen) (document as any).msExitFullscreen();
    }
  };

  return (
    <div
      ref={wrapperRef}
      onMouseMove={resetHideTimer}
      onMouseLeave={() => isFullscreen && setControlsVisible(false)}
      className="relative overflow-hidden rounded-2xl bg-black"
    >
      {/* Video Container */}
      <div className="relative w-full bg-black" style={{ paddingTop: '56.25%' }}>
        <div
          id="youtube-player-iframe"
          className="absolute inset-0 h-full w-full pointer-events-none"
        />
        {/* Click overlay to toggle play/pause */}
        <div
          onClick={() => { togglePlay(); resetHideTimer(); }}
          className="absolute inset-0 cursor-pointer z-10"
        />
      </div>

      {/* Custom Control Bar — always overlaid at the bottom, transparent */}
      <div
        className={[
          'absolute bottom-0 left-0 right-0 flex flex-col gap-2 px-4 pt-8 pb-3 select-none transition-opacity duration-500 z-20',
          'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
          controlsVisible ? 'opacity-100' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      >
        {/* Timeline Row */}
        <div className="flex items-center gap-3 w-full">
          <span className="text-xs font-medium font-mono text-white/90 drop-shadow">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min="0"
            max={duration.toString()}
            step="0.1"
            value={currentTime.toString()}
            onChange={handleScrub}
            className="flex-1 accent-[#E11D48] h-1.5 bg-surface-light rounded-lg cursor-pointer appearance-none outline-none"
          />
          <span className="text-xs font-medium font-mono text-white/90 drop-shadow">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Play/Pause Button */}
            <button
              onClick={togglePlay}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200"
              aria-label={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? (
                <Pause className="h-4.5 w-4.5 fill-current" />
              ) : (
                <Play className="h-4.5 w-4.5 fill-current ml-0.5" />
              )}
            </button>

            {/* Volume controls */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200"
                aria-label={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-4.5 w-4.5" />
                ) : (
                  <Volume2 className="h-4.5 w-4.5" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="100"
                value={isMuted ? '0' : volume.toString()}
                onChange={handleVolumeChange}
                className="w-16 md:w-20 accent-[#E11D48] h-1 bg-surface-light rounded-lg cursor-pointer appearance-none opacity-0 group-hover/volume:opacity-100 transition-opacity duration-300"
              />
            </div>
          </div>

          <div>
            {/* Fullscreen Toggle Button */}
            <button
              onClick={toggleFullscreen}
              className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-sm text-white hover:bg-white/25 transition-all duration-200"
              aria-label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize className="h-4.5 w-4.5" />
              ) : (
                <Maximize className="h-4.5 w-4.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
