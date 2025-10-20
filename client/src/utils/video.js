export function extensionForMimeType(mimeType = '') {
  const lower = mimeType.toLowerCase();
  if (lower.includes('mp4') || lower.includes('mpeg')) return 'mp4';
  if (lower.includes('webm')) return 'webm';
  if (lower.includes('quicktime')) return 'mov';
  if (lower.includes('ogg')) return 'ogg';
  if (lower.includes('x-matroska') || lower.includes('matroska')) return 'mkv';
  return 'webm';
}

export function filenameWithExtension(baseName, extension) {
  if (!extension) return baseName;
  const sanitized = extension.replace(/^\./, '');
  return `${baseName}.${sanitized}`;
}
