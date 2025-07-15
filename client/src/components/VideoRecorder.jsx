import React, { useRef, useState, useEffect } from 'react';

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);

  // start camera preview when component mounts
  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.src = '';
      videoRef.current.muted = true;
    }
    init();
    return () => {
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  async function startRecording() {
    if (!streamRef.current) return;
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    const preferredMime = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : 'video/webm';
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: preferredMime });
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = () => {
      const mimeType = chunksRef.current[0]?.type || mediaRecorderRef.current.mimeType || preferredMime;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];
      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
      if (onRecorded) onRecorded(blob, url);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={!!recordedUrl}
        className="w-full mb-2"
      />
      {!recordedUrl && (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center"
          onClick={recording ? stopRecording : startRecording}
        >
          {recording ? (
            <span className="block rounded-full border-4 border-red-600 w-16 h-16 flex items-center justify-center">
              <span className="bg-red-600 w-6 h-6"></span>
            </span>
          ) : (
            <span className="block rounded-full bg-red-600 w-16 h-16"></span>
          )}
        </button>
      )}
    </div>
  );
}
