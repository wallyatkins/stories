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
    <div className="w-full max-w-md rounded-2xl border border-white/20 bg-black/75 dark:bg-[#151515]/90 backdrop-blur-xl p-5 shadow-2xl text-white">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-white/90">Uploading video…</p>
        <span className="text-xs font-bold text-coral">{pct}%</span>
      </div>
      <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-white/10 dark:bg-zinc-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-coral via-gold to-teal transition-all duration-300"
          style={{ width: `${Math.min(100, pct)}%` }}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between text-xs text-white/70">
        <span>
          {formatBytes(loaded)}
          {total ? ` / ${formatBytes(total)}` : ''}
        </span>
        <span>{formatSpeed(bytesPerSecond)}</span>
      </div>
      {etaLabel && <p className="mt-1 text-right text-xs text-gold/80 font-medium">{etaLabel}</p>}
    </div>
  );
}

