import React, { useState } from 'react';
import VideoRecorder from './VideoRecorder';
import UploadProgress from './UploadProgress';
import { extensionForMimeType, filenameWithExtension } from '../utils/video';
import { uploadWithProgress } from '../utils/uploadWithProgress';

export default function PromptRecorder({ friend, onFinish }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);
  async function handleRecorded(blob /*, url */) {
    setUploading(true);
    setProgress({ loaded: 0, total: null, percent: 0, bytesPerSecond: 0 });
    const formData = new FormData();
    const extension = extensionForMimeType(blob.type);
    const filename = filenameWithExtension('prompt', extension);
    formData.append('video', blob, filename);
    formData.append('friend_id', friend.id);
    try {
      const { body } = await uploadWithProgress({
        url: '/api/upload_prompt',
        formData,
        onProgress: setProgress,
      });
      const data = typeof body === 'object' ? body : {};
      if (data.filename) {
        onFinish(data.filename);
      } else {
        console.warn('Upload succeeded but no filename returned.');
        onFinish(null);
      }
    } catch (error) {
      console.error('Upload failed', error);
      alert('Sorry, we could not upload your video. Please try again.');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  return (
    <div>
      <h2 className="text-xl mb-2">
        Record a Prompt for {friend.username || friend.email}
      </h2>
      {uploading ? (
        <div className="flex h-32 items-center justify-center">
          <UploadProgress progress={progress} />
        </div>
      ) : (
        <VideoRecorder onRecorded={handleRecorded} />
      )}
    </div>
  );
}
