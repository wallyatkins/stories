import React from 'react';

const BYTES_IN_MB = 1024 * 1024;

function formatBytes(bytes) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) {
    return '0 MB';
  }
  return `${(bytes / BYTES_IN_MB).toFixed(1)} MB`;
}

function formatSpeed(bytesPerSecond) {
  if (!bytesPerSecond) return '0 MB/s';
  return `${(bytesPerSecond / BYTES_IN_MB).toFixed(2)} MB/s`;
}

function formatEta(loaded, total, bytesPerSecond) {
  if (!total || !bytesPerSecond) return null;
  const remainingBytes = total - loaded;
  if (remainingBytes <= 0) return null;
  const seconds = Math.max(remainingBytes / bytesPerSecond, 0);
  if (!Number.isFinite(seconds)) return null;
  if (seconds < 5) return 'Finishing…';
  if (seconds < 60) return `${Math.round(seconds)}s remaining`;
  const minutes = Math.round(seconds / 60);
  return `${minutes}m remaining`;
}

export default function UploadProgress({ progress }) {
  if (!progress) return null;
  const { loaded = 0, total, percent, bytesPerSecond } = progress;
  const pct = percent ?? (total ? Math.round((loaded / total) * 100) : 0);
  const etaLabel = formatEta(loaded, total, bytesPerSecond);

  return (
    <div className="w-full max-w-md rounded-lg border border-blue-200 bg-white/90 p-4 shadow-lg">
      <p className="text-sm font-medium text-blue-700">Uploading video…</p>
      <div className="mt-2 h-3 w-full overflow-hidden rounded-full bg-blue-100">
        <div
          className="h-full rounded-full bg-blue-500 transition-all"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between text-xs text-gray-600">
        <span>
          {formatBytes(loaded)}
          {total ? ` / ${formatBytes(total)}` : ''}
        </span>
        <span>{formatSpeed(bytesPerSecond)}</span>
      </div>
      {etaLabel && <p className="mt-1 text-right text-xs text-gray-500">{etaLabel}</p>}
    </div>
  );
}

