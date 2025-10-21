import React, { useEffect, useState } from 'react';
import VideoRecorder from './VideoRecorder';
import ProcessedVideoPlayer from './ProcessedVideoPlayer';
import UploadProgress from './UploadProgress';
import { extensionForMimeType, filenameWithExtension } from '../utils/video';
import { uploadWithProgress } from '../utils/uploadWithProgress';

export default function ResponseRecorder({ promptId }) {
  const [responses, setResponses] = useState([]);
  const [loadingResponses, setLoadingResponses] = useState(true);
  const [prompt, setPrompt] = useState(null);
  const [loadingPrompt, setLoadingPrompt] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);

  async function handleRecorded(blob /*, url */) {
    const extension = extensionForMimeType(blob.type);
    const filename = filenameWithExtension('response', extension);
    const formData = new FormData();
    formData.append('video', blob, filename);
    setUploading(true);
    setProgress({ loaded: 0, total: null, percent: 0, bytesPerSecond: 0 });
    try {
      await uploadWithProgress({
        url: `/api/upload_response?prompt=${promptId}`,
        formData,
        onProgress: setProgress,
      });
      await loadResponses();
    } catch (error) {
      console.error('Failed to upload response', error);
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setProgress(null);
    }
  }

  async function loadResponses() {
    setLoadingResponses(true);
    try {
      const res = await fetch(`/api/list_responses?prompt=${promptId}`);
      if (!res.ok) {
        throw new Error('Failed to fetch responses');
      }
      const data = await res.json();
      setResponses(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error(error);
      setResponses([]);
    } finally {
      setLoadingResponses(false);
    }
  }

  useEffect(() => {
    async function fetchPrompt() {
      setLoadingPrompt(true);
      try {
        const res = await fetch(`/api/get_prompt.php?id=${promptId}`);
        if (!res.ok) throw new Error('Failed to fetch prompt');
        const data = await res.json();
        setPrompt(data);
      } catch (error) {
        console.error(error);
        setPrompt(null);
      } finally {
        setLoadingPrompt(false);
      }
    }
    if (promptId) {
      fetchPrompt();
      loadResponses();
    }
  }, [promptId]);

  return (
    <div>
      <h2 className="text-xl mb-2">Respond to Prompt</h2>
      {loadingPrompt ? (
        <div className="flex justify-center items-center h-48">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
        </div>
      ) : prompt?.filename ? (
        <ProcessedVideoPlayer
          filename={prompt.filename}
          autoPlay
          className="mb-4"
        />
      ) : (
        <div className="mb-4 text-sm text-gray-500">
          Prompt video unavailable. It may still be processing.
        </div>
      )}
      {uploading ? (
        <div className="my-4 flex items-center justify-center">
          <UploadProgress progress={progress} />
        </div>
      ) : (
        <VideoRecorder onRecorded={handleRecorded} />
      )}
      <h3 className="text-lg mt-4 mb-2">Responses</h3>
      {loadingResponses ? (
        <div className="flex justify-center items-center h-24">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900" />
        </div>
      ) : responses.length === 0 ? (
        <p className="text-sm text-gray-500">No responses yet.</p>
      ) : (
        <ul className="space-y-4">
          {responses.map((response) => (
            <li key={response.filename} className="w-full">
              <ProcessedVideoPlayer filename={response.filename} className="w-full" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
