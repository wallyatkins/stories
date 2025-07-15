import React, { useEffect, useState } from 'react';
import VideoRecorder from './VideoRecorder';

export default function ResponseRecorder({ promptId }) {
  const [responses, setResponses] = useState([]);

  async function handleRecorded(blob) {
    const formData = new FormData();
    formData.append('video', blob, 'response.mp4');
    await fetch(`api/upload_response?prompt=${promptId}`, {
      method: 'POST',
      body: formData,
    });
    loadResponses();
  }

  async function loadResponses() {
    const res = await fetch(`api/list_responses?prompt=${promptId}`);
    const data = await res.json();
    setResponses(data);
  }

  useEffect(() => {
    loadResponses();
  }, [promptId]);

  return (
    <div>
      <h2 className="text-xl mb-2">Respond to Prompt</h2>
      <video
        src={`api/video?file=${encodeURIComponent(promptId)}`}
        controls
        className="w-full mb-4"
      />
      <VideoRecorder onRecorded={handleRecorded} />
      <h3 className="text-lg mt-4 mb-2">Responses</h3>
      <ul>
        {responses.map((r, i) => (
          <li key={i} className="mb-2">
            <video
              src={`api/video?file=${encodeURIComponent(r.filename)}`}
              controls
              className="w-full"
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
