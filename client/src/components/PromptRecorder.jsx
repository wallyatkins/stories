import React, { useState } from 'react';
import VideoRecorder from './VideoRecorder';

export default function PromptRecorder({ friend, onFinish }) {
  const [uploading, setUploading] = useState(false);
  async function handleRecorded(blob) {
    setUploading(true);
    const formData = new FormData();
    formData.append('video', blob, 'prompt.mp4');
    formData.append('friend_id', friend.id);
    const res = await fetch('api/upload_prompt.php', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setUploading(false);
    onFinish(data.filename);
  }

  return (
    <div>
      <h2 className="text-xl mb-2">
        Record a Prompt for {friend.username || friend.email}
      </h2>
      {uploading ? (
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <VideoRecorder onRecorded={handleRecorded} />
      )}
    </div>
  );
}
