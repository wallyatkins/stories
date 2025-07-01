import React, { useRef, useState } from 'react';

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    videoRef.current.srcObject = stream;
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = [];
      onRecorded(blob);
      stream.getTracks().forEach(t => t.stop());
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current.stop();
    setRecording(false);
  }

  return (
    <div>
      <video ref={videoRef} autoPlay className="w-full mb-2" />
      {recording ? (
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={stopRecording}>Stop</button>
      ) : (
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={startRecording}>Record</button>
      )}
    </div>
  );
}
