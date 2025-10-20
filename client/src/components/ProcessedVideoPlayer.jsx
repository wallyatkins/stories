import React, { useEffect, useMemo, useState } from 'react';
import ReactPlayer from 'react-player';

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

function variantToSource(variant) {
  if (!variant) return null;
  if (variant.url) return { src: variant.url, type: variant.type };
  if (variant.path) {
    const encoded = encodeSegments(variant.path.replace(/^\/+/, ''));
    return {
      src: `/uploads/processed/${encoded}`,
      type: variant.type,
    };
  }
  return null;
}

export default function ProcessedVideoPlayer({ filename, manifestPath = '', autoPlay = false, className = '', controls = true }) {
  const [sources, setSources] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);

  const fallbackUrl = useMemo(() => {
    const clean = stripLeadingSlash(filename);
    return `/uploads/${encodeSegments(clean)}`;
  }, [filename]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setUsingFallback(false);
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
          setSources(urls.length === 1 ? urls[0] : urls);
        }
      } catch (error) {
        console.warn('Falling back to original upload', error);
        if (!cancelled) {
          setUsingFallback(true);
          setSources(fallbackUrl);
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
  }, [filename, manifestPath, fallbackUrl]);

  return (
    <div className={`w-full ${className}`}>
      <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
        {loading ? (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75 text-white">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white" />
          </div>
        ) : (
          <ReactPlayer
            url={sources}
            playing={autoPlay}
            controls={controls}
            width="100%"
            height="100%"
            style={{ position: 'absolute', top: 0, left: 0 }}
          />
        )}
      </div>
      {usingFallback && (
        <p className="mt-2 text-xs text-gray-500">
          Processed versions are not ready yet; playing the original upload instead.
        </p>
      )}
    </div>
  );
}
