import React, { useCallback, useState } from 'react';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedAvatar } from '../utils/cropImage';

export default function AvatarCropDialog({ imageSrc, onCancel, onComplete }) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleCropComplete = useCallback((_, areaPixels) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!croppedAreaPixels) {
      return;
    }
    try {
      setProcessing(true);
      const blob = await getCroppedAvatar(imageSrc, croppedAreaPixels);
      setProcessing(false);
      onComplete(blob);
    } catch (err) {
      console.error('Failed to crop avatar', err);
      setProcessing(false);
      setError('Unable to crop image. Please try a different picture.');
    }
  }, [croppedAreaPixels, imageSrc, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-lg bg-white p-4 shadow-xl">
        <h2 className="text-lg font-semibold">Adjust your avatar</h2>
        <p className="mt-1 text-sm text-gray-600">Zoom and drag to frame your photo inside the circle.</p>
        <div className="relative mt-4 w-full overflow-hidden rounded-lg bg-black/80">
          <div className="relative aspect-square w-full">
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              showGrid={false}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700" htmlFor="avatar-zoom">
            Zoom
          </label>
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-1 w-full"
          />
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        <div className="mt-4 flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-60"
            disabled={processing}
          >
            {processing ? 'Saving…' : 'Use Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

