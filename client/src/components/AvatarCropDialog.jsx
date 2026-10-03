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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#2a2a2a] p-6 shadow-2xl text-slate-900 dark:text-white">
        <h2 className="text-xl font-bold font-display">Adjust your avatar</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Zoom and drag to frame your photo inside the circle.
        </p>
        <div className="relative mt-5 w-full overflow-hidden rounded-2xl bg-black/90 border border-slate-200 dark:border-white/10">
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
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <label htmlFor="avatar-zoom">Zoom</label>
            <span>{zoom.toFixed(1)}x</span>
          </div>
          <input
            id="avatar-zoom"
            type="range"
            min={1}
            max={4}
            step={0.01}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="mt-1 w-full accent-coral cursor-pointer"
          />
        </div>
        {error && (
          <p className="mt-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-3 py-2 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-full border border-slate-200 dark:border-zinc-700 px-5 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 transition-colors"
            disabled={processing}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="btn-coral px-6 py-2 text-sm font-bold shadow-md hover:shadow-coral/20 rounded-full disabled:opacity-60 transition-all"
            disabled={processing}
          >
            {processing ? 'Saving…' : 'Use Photo'}
          </button>
        </div>
      </div>
    </div>
  );
}

