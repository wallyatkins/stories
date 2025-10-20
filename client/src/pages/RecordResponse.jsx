import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';
import { extensionForMimeType, filenameWithExtension } from '../utils/video';

export default function RecordResponse() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const res = await fetch(`/api/get_prompt.php?id=${promptId}`);
        if (res.ok) {
          const data = await res.json();
          setPrompt(data);
        } else {
          console.error('Failed to fetch prompt');
          navigate('/prompts');
        }
      } catch (error) {
        console.error('Failed to fetch prompt:', error);
        navigate('/prompts');
      }
    }
    fetchPrompt();
  }, [promptId, navigate]);

  function handleRecorded(blob, url) {
    setRecordedBlob(blob);
    setRecordedUrl(url);
  }

  async function sendVideo() {
    if (!recordedBlob || !prompt) return;
    setUploading(true);
    const formData = new FormData();
    const extension = extensionForMimeType(recordedBlob.type);
    const filename = filenameWithExtension('response', extension);
    formData.append('video', recordedBlob, filename);
    formData.append('prompt_id', prompt.id);
    
    await fetch('/api/upload_response.php', {
      method: 'POST',
      body: formData,
    });

    setUploading(false);
    navigate('/stories');
  }

  function discard() {
    navigate(`/prompt/${promptId}`);
  }

  function rerecord() {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
  }

  if (!prompt) return null;

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center">
      {uploading ? (
        <div className="text-white">Uploading...</div>
      ) : recordedBlob ? (
        <div className="w-full h-full relative flex flex-col">
          <video src={recordedUrl} controls className="flex-1 bg-black object-contain" />
          <div className="absolute bottom-24 left-0 right-0 flex justify-center space-x-8">
            <button onClick={discard} className="flex flex-col items-center">
              <span className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white text-xl">🗑️</span>
              <span className="text-red-400 text-sm mt-1">Discard</span>
            </button>
            <button onClick={rerecord} className="flex flex-col items-center">
              <span className="w-12 h-12 rounded-full bg-yellow-400 flex items-center justify-center text-xl">🔄</span>
              <span className="text-yellow-300 text-sm mt-1">Re-record</span>
            </button>
            <button onClick={sendVideo} className="flex flex-col items-center">
              <span className="w-12 h-12 rounded-full bg-green-600 flex items-center justify-center text-white text-xl">📤</span>
              <span className="text-green-400 text-sm mt-1">Send</span>
            </button>
          </div>
        </div>
      ) : (
        <VideoRecorder onRecorded={handleRecorded} />
      )}
    </div>
  );
}
