import React, { useEffect, useMemo, useState } from 'react';

function isRemoteUrl(path) {
  return typeof path === 'string' && (path.startsWith('http://') || path.startsWith('https://'));
}

function buildPrimarySrc(filename) {
  if (!filename) return '';
  if (isRemoteUrl(filename)) {
    return filename;
  }
  return `/avatars/${encodeURIComponent(filename)}`;
}

function buildFallbackSrc(filename) {
  if (!filename || isRemoteUrl(filename)) {
    return null;
  }
  return `/uploads/avatars/${encodeURIComponent(filename)}`;
}

export default function AvatarImage({ filename, alt = 'avatar', className = '' }) {
  const [src, setSrc] = useState(() => buildPrimarySrc(filename));
  const fallback = useMemo(() => buildFallbackSrc(filename), [filename]);

  useEffect(() => {
    setSrc(buildPrimarySrc(filename));
  }, [filename]);

  if (!filename) {
    return null;
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      crossOrigin="anonymous"
      onError={() => {
        if (fallback && src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}
