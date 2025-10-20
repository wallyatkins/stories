import React, { useEffect, useMemo, useState } from 'react';

function buildPrimarySrc(filename) {
  return `/avatars/${encodeURIComponent(filename)}`;
}

function buildFallbackSrc(filename) {
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
      onError={() => {
        if (src !== fallback) {
          setSrc(fallback);
        }
      }}
    />
  );
}
