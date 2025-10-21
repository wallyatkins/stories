const AVATAR_OUTPUT_SIZE = 512;

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = (error) => reject(error);
    image.src = src;
  });
}

export async function getCroppedAvatar(imageSrc, cropPixels, outputSize = AVATAR_OUTPUT_SIZE) {
  if (!imageSrc || !cropPixels) {
    throw new Error('Missing image source or crop dimensions.');
  }

  const image = await loadImage(imageSrc);
  const canvas = document.createElement('canvas');
  const size = outputSize;
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context.');
  }

  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  ctx.drawImage(
    image,
    cropPixels.x,
    cropPixels.y,
    cropPixels.width,
    cropPixels.height,
    0,
    0,
    size,
    size
  );

  ctx.restore();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create cropped avatar.'));
          return;
        }
        const pngBlob = blob.type ? blob : new Blob([blob], { type: 'image/png' });
        resolve(pngBlob);
      },
      'image/png',
      0.92
    );
  });
}

