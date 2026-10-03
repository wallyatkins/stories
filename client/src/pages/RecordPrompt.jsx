import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import VideoRecorder from '../components/VideoRecorder';
import UploadProgress from '../components/UploadProgress.jsx';
import MirroredVideoPlayer from '../components/MirroredVideoPlayer.jsx';
import { extensionForMimeType, filenameWithExtension } from '../utils/video';
import { uploadWithProgress } from '../utils/uploadWithProgress';

export default function RecordPrompt() {
  const { friendId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [friend, setFriend] = useState(location.state?.friend || null);
  const [recordedBlob, setRecordedBlob] = useState(null);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(null);

  useEffect(() => {
    if (!friend) {
      fetch('/api/list_friends')
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
    setProgress({ loaded: 0, total: null, percent: 0, bytesPerSecond: 0 });
    const formData = new FormData();
    const extension = extensionForMimeType(recordedBlob.type);
    const filename = filenameWithExtension('prompt', extension);
    formData.append('video', recordedBlob, filename);
    formData.append('friend_id', friend.id);
    try {
      await uploadWithProgress({
        url: '/api/upload_prompt',
        formData,
        onProgress: setProgress,
      });
      navigate('/prompts');
    } catch (error) {
      console.error('Failed to upload prompt video', error);
      alert('Upload failed. Please try sending your video again.');
    } finally {
      setUploading(false);
      setProgress(null);
    }
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
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center select-none">
      {/* Top HUD overlay */}
      {!uploading && (
        <div className="absolute top-4 inset-x-4 z-30 flex items-center justify-between pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 backdrop-blur-md border border-white/15 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-coral animate-pulse" />
            <span className="text-xs font-medium text-white/80">Prompting:</span>
            <span className="text-xs font-bold text-coral">{friend.username || friend.email}</span>
          </div>
          <button
            onClick={discard}
            type="button"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all shadow-lg"
            title="Cancel"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      )}

      {uploading ? (
        <div className="flex flex-col items-center gap-4 text-white px-4 w-full max-w-md">
          <UploadProgress progress={progress} />
          <p className="text-xs text-white/70 tracking-wide">Please keep this page open until the upload finishes.</p>
        </div>
      ) : recordedBlob ? (
        <div className="relative flex h-full w-full flex-col">
          <MirroredVideoPlayer src={recordedUrl} autoPlay />
          <div className="absolute bottom-8 left-0 right-0 flex justify-center space-x-8 z-20">
            <button onClick={discard} className="flex flex-col items-center group">
              <span className="w-14 h-14 rounded-full bg-rose-600/90 hover:bg-rose-600 flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-105">
                🗑️
              </span>
              <span className="text-rose-300 text-xs mt-1.5 font-medium tracking-wide">Discard</span>
            </button>
            <button onClick={rerecord} className="flex flex-col items-center group">
              <span className="w-14 h-14 rounded-full bg-amber-500/90 hover:bg-amber-500 flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-105">
                🔄
              </span>
              <span className="text-amber-300 text-xs mt-1.5 font-medium tracking-wide">Re-record</span>
            </button>
            <button onClick={sendVideo} className="flex flex-col items-center group">
              <span className="w-14 h-14 rounded-full bg-teal hover:bg-teal/90 flex items-center justify-center text-white text-xl shadow-lg transition-transform group-hover:scale-105">
                📤
              </span>
              <span className="text-teal text-xs mt-1.5 font-medium tracking-wide">Send Prompt</span>
            </button>
          </div>
        </div>
      ) : (
        <VideoRecorder onRecorded={handleRecorded} />
      )}
    </div>
  );
}
