import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';

export default function RecordPrompt() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [friend, setFriend] = useState(location.state?.friend || null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!friend) {
      fetch('api/list_friends')
        .then(res => res.json())
        .then(data => {
          const f = data.find(fr => String(fr.id) === String(friendId));
          setFriend(f);
        });
    }
  }, [friend, friendId]);

  function handleRecorded(blob, url) {
    setRecordedBlob(blob);
    setRecordedUrl(url);
  }

  async function sendVideo() {
    if (!recordedBlob || !friend) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('video', recordedBlob, 'prompt.mp4');
    formData.append('friend_id', friend.id);
    await fetch('api/upload_prompt', {
      method: 'POST',
      body: formData,
    });
    setUploading(false);
    navigate('/prompts');
  }

  function discard() {
    navigate('/prompts');
  }

  function rerecord() {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedBlob(null);
    setRecordedUrl(null);
  }

  if (!friend) return null;

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
