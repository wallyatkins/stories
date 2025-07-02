import React, { useRef, useState, useEffect } from 'react';

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);

  async function startRecording() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    setRecordedUrl(null);
    videoRef.current.srcObject = stream;
    videoRef.current.src = '';
    videoRef.current.muted = true;
    mediaRecorderRef.current = new MediaRecorder(stream);
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      chunksRef.current = [];
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
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

  // Cleanup created object URLs when a new recording starts or component unmounts
  useEffect(() => {
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [recordedUrl]);

  return (
    <div>
      <video ref={videoRef} autoPlay controls={!!recordedUrl} className="w-full mb-2" />
      {recording ? (
        <button className="bg-red-500 text-white px-4 py-2 rounded" onClick={stopRecording}>Stop</button>
      ) : (
        <button className="bg-green-500 text-white px-4 py-2 rounded" onClick={startRecording}>Record</button>
      )}
    </div>
  );
}
