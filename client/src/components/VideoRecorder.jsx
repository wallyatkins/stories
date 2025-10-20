import React, { useRef, useState, useEffect } from 'react';

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [message, setMessage] = useState('Click the red button to start recording');
  const [error, setError] = useState('');

  const mimeCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/webm',
  ];

  const chosenMimeType = mimeCandidates.find((type) => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
      return false;
    }
    return MediaRecorder.isTypeSupported(type);
  }) || '';

  // start camera preview when component mounts
  useEffect(() => {
    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        videoRef.current.srcObject = stream;
        videoRef.current.src = '';
        videoRef.current.muted = true;
        setMessage('Click the red button to start recording');
        setError('');
      } catch (err) {
        console.error('Failed to start camera', err);
        setMessage('Unable to access your camera and microphone');
        setError('Check browser permissions and try again.');
      }
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
    const options = chosenMimeType ? { mimeType: chosenMimeType } : undefined;
    try {
      mediaRecorderRef.current = new MediaRecorder(streamRef.current, options);
    } catch (err) {
      console.error('Failed to create MediaRecorder', err);
      setMessage('Recording not supported in this browser.');
      setError('Try updating your browser or using a different one.');
      return;
    }
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const mimeType = chunksRef.current[0]?.type || mediaRecorderRef.current.mimeType || chosenMimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];

      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
      setMessage('Recording complete. You can now play the video.');
      if (onRecorded) onRecorded(blob, url);
    };
    mediaRecorderRef.current.start();
    setRecording(true);
    setMessage('Recording...');
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setMessage('Processing video...');
    }
  }

  return (
    <div className="relative">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={!!recordedUrl}
        className={`w-full mb-2 ${!recordedUrl ? 'transform -scale-x-100' : ''}`}
      />
      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white p-2 rounded">
        {message}
        {error && <span className="block text-xs text-red-300 mt-1">{error}</span>}
      </div>
      {!recordedUrl && (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center"
          onClick={recording ? stopRecording : startRecording}
          disabled={message.includes('Processing') || message.includes('Unable')}
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
