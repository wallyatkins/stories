import React from 'react';
import VideoRecorder from './VideoRecorder';

export default function PromptRecorder({ onFinish }) {
  async function handleRecorded(blob) {
    const formData = new FormData();
    formData.append('video', blob, 'prompt.webm');
    const res = await fetch('api/upload_prompt.php', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    onFinish(data.filename);
  }

  return (
    <div>
      <h2 className="text-xl mb-2">Record a Prompt</h2>
      <VideoRecorder onRecorded={handleRecorded} />
    </div>
  );
}
