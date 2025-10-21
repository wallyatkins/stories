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

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white">
            <div className="h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 border-white" />
          </div>
        ) : (
          <video
            key={videoKey}
            className="absolute inset-0 h-full w-full bg-black"
            controls={controls}
            autoPlay={autoPlay}
            playsInline
            preload="metadata"
            muted={autoPlay}
            onPlay={() => setError('')}
            onError={() => setError('We could not play this video. Try refreshing the page.')}
          >
            {sources.map((source) => (
              <source key={source.src} src={source.src} type={source.type} />
            ))}
            Your browser does not support the video tag.
          </video>
        )}
      </div>
      {usingFallback && (
        <p className="mt-2 text-xs text-gray-500">
          Processed versions are not ready yet; playing the original upload instead.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
