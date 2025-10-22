import React, { useEffect, useRef, useState, useCallback } from 'react';

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}

export default function MirroredVideoPlayer({ src, autoPlay = false, muted = false }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(muted);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    setIsPlaying(false);
    setIsMuted(muted);
    setCurrentTime(0);
  }, [src, autoPlay, muted]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoaded = () => {
      setDuration(video.duration || 0);
    };
    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(video.duration || 0);
    };

    video.addEventListener('loadedmetadata', handleLoaded);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoaded);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isPlaying) {
      const playPromise = video.play();
      if (playPromise?.catch) {
        playPromise.catch(() => setIsPlaying(false));
      }
    } else {
      video.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = isMuted;
  }, [isMuted]);

  const handleCanPlayThrough = useCallback(() => {
    if (!autoPlay) return;
    const video = videoRef.current;
    if (!video || !video.paused) return;
    video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [autoPlay]);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleScrub = useCallback((event) => {
    const video = videoRef.current;
    if (!video) return;
    const nextTime = Number(event.target.value);
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  }, []);

  const progressPercent = duration ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="relative mx-auto w-full max-w-[520px] aspect-[9/16] overflow-hidden rounded-3xl bg-black">
      <video
        key={src}
        ref={videoRef}
        src={src}
        playsInline
        muted={isMuted}
        controls={false}
        onCanPlayThrough={handleCanPlayThrough}
        className="h-full w-full transform -scale-x-100 object-contain"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/10" />
      <div className="pointer-events-auto absolute bottom-4 left-1/2 flex w-[90%] -translate-x-1/2 flex-col gap-3 rounded-2xl bg-black/60 px-4 py-3 text-white shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between text-xs text-white/80">
          <span>Preview</span>
          <span>
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-nav-bg shadow-lg transition hover:scale-105"
          >
            {isPlaying ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M6 19h4.5V5H6v14zm7.5-14v14H18V5h-4.5z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <input
            type="range"
            min="0"
            max={duration || 0}
            step="0.1"
            value={Math.min(currentTime, duration || 0)}
            onChange={handleScrub}
            className="h-1 flex-1 cursor-pointer accent-gold"
          />
          <button
            type="button"
            onClick={toggleMute}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-white transition hover:bg-white/20"
          >
            {isMuted ? (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M16.5 12l3.5 3.5-1.5 1.5L15 13.5l-3.5 3.5h-4V7h4l3.5 3.5 3.5-3.5 1.5 1.5L16.5 12z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
                <path d="M14 3.23v2.06c1.78.73 3 2.47 3 4.48s-1.22 3.75-3 4.48v2.06c2.89-.86 5-3.54 5-6.54s-2.11-5.68-5-6.54zM4 9v6h4l5 5V4L8 9H4z" />
              </svg>
            )}
          </button>
        </div>
        <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/20">
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-coral via-gold to-teal"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
