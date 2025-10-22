import React, { useEffect, useMemo, useState } from 'react';

function encodeSegments(path) {
  return path
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function stripLeadingSlash(path) {
  return path.replace(/^\/+/, '');
}

function stripExtension(path) {
  const lastSlash = path.lastIndexOf('/');
  const lastDot = path.lastIndexOf('.');
  if (lastDot > lastSlash) {
    return path.slice(0, lastDot);
  }
  return path;
}

function buildManifestUrl(filename, manifestPath) {
  if (manifestPath) {
    const cleaned = stripLeadingSlash(manifestPath);
    return `/uploads/processed/${encodeSegments(cleaned)}`;
  }
  const clean = stripLeadingSlash(filename);
  const manifestRelative = `${stripExtension(clean)}.manifest.json`;
  return `/uploads/processed/${encodeSegments(manifestRelative)}`;
}

function guessMimeType(url = '') {
  const lower = url.toLowerCase();
  if (lower.endsWith('.mp4')) return 'video/mp4';
  if (lower.endsWith('.webm')) return 'video/webm';
  if (lower.endsWith('.mov')) return 'video/quicktime';
  return 'video/mp4';
}

function variantToSource(variant) {
  if (!variant) return null;
  if (variant.url) {
    return { src: variant.url, type: variant.type || guessMimeType(variant.url) };
  }
  if (variant.path) {
    const encoded = encodeSegments(variant.path.replace(/^\/+/, ''));
    const src = `/uploads/processed/${encoded}`;
    return {
      src,
      type: variant.type || guessMimeType(src),
    };
  }
  return null;
}

export default function ProcessedVideoPlayer({ filename, manifestPath = '', autoPlay = false, className = '', controls = true }) {
  const [sources, setSources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [error, setError] = useState('');
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const fallbackSource = useMemo(() => {
    const clean = stripLeadingSlash(filename);
    const src = `/uploads/${encodeSegments(clean)}`;
    return { src, type: guessMimeType(src) };
  }, [filename]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setUsingFallback(false);
      setError('');
      const manifestUrl = buildManifestUrl(filename, manifestPath);
      try {
        const res = await fetch(manifestUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error(`Manifest not found at ${manifestUrl}`);
        const manifest = await res.json();
        const urls = (manifest?.variants || [])
          .map(variantToSource)
          .filter(Boolean);
        if (!urls.length) throw new Error('Manifest missing variants');
        if (!cancelled) {
          setSources(urls);
        }
      } catch (err) {
        console.warn('Falling back to original upload', err);
        if (!cancelled) {
          setUsingFallback(true);
          setSources([fallbackSource]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [filename, manifestPath, fallbackSource]);

  const videoKey = `${usingFallback ? 'fallback' : 'processed'}-${filename}`;

  const handleLoadedMetadata = (event) => {
    setDuration(event.currentTarget.duration || 0);
  };

  const handleTimeUpdate = (event) => {
    setCurrentTime(event.currentTarget.currentTime || 0);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const togglePlay = (event) => {
    const video = event.currentTarget.parentElement.querySelector('video');
    if (!video) return;
    if (video.paused) {
      video.play();
    } else {
      video.pause();
    }
  };

  const toggleMute = (event) => {
    const video = event.currentTarget.parentElement.querySelector('video');
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleScrub = (event) => {
    const videoContainer = event.currentTarget.closest('.video-shell');
    const video = videoContainer?.querySelector('video');
    if (!video) return;
    const next = Number(event.target.value);
    video.currentTime = next;
    setCurrentTime(next);
  };

  const progressPercent = duration ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className={`video-shell relative w-full overflow-hidden rounded-3xl bg-black ${className}`}>
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-white" />
          </div>
        ) : (
          <video
            key={videoKey}
            className="absolute inset-0 h-full w-full bg-black object-contain"
            controls={false}
            autoPlay={autoPlay}
            playsInline
            preload="metadata"
            muted={isMuted}
            onPlay={(event) => {
              setError('');
              setIsPlaying(true);
              handleTimeUpdate(event);
            }}
            onPause={() => setIsPlaying(false)}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onError={() => setError('We could not play this video. Try refreshing the page.')}
          >
            {sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/10" />
      {!loading && (
        <div className="pointer-events-auto absolute bottom-4 left-1/2 flex w-[90%] max-w-xl -translate-x-1/2 flex-col gap-3 rounded-2xl bg-black/60 px-4 py-3 text-white shadow-2xl backdrop-blur">
          <div className="flex items-center justify-between text-xs text-white/80">
            <span>{usingFallback ? 'Original upload' : 'Story playback'}</span>
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
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${mins}:${secs}`;
}
