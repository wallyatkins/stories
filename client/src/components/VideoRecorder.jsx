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
    <div className="relative mx-auto w-full max-w-[520px] aspect-[9/16] overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={!!recordedUrl}
        className="h-full w-full object-cover transform -scale-x-100"
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
      
      {/* Status HUD */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-10 w-[90%] pointer-events-none">
        <div className="flex items-center gap-2 rounded-full bg-black/60 px-4 py-1.5 backdrop-blur-md border border-white/15 text-white shadow-lg">
          {recording ? (
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
          ) : (
            <span className="h-2 w-2 rounded-full bg-gold" />
          )}
          <span className="text-xs font-medium tracking-wide">{message}</span>
        </div>
        {error && (
          <span className="rounded-full bg-rose-950/80 border border-rose-500/30 px-3 py-1 text-xs text-rose-300 backdrop-blur-md text-center">
            {error}
          </span>
        )}
      </div>

      {/* Record button */}
      {!recordedUrl && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20">
          <button
            type="button"
            className="flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            onClick={recording ? stopRecording : startRecording}
            disabled={message.includes('Processing') || message.includes('Unable')}
            title={recording ? 'Stop recording' : 'Start recording'}
          >
            {recording ? (
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/80 bg-black/40 backdrop-blur-sm shadow-2xl animate-pulse">
                <span className="h-8 w-8 rounded-lg bg-red-600 shadow-md"></span>
              </span>
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-black/40 backdrop-blur-sm shadow-2xl p-1">
                <span className="h-full w-full rounded-full bg-red-600 hover:bg-red-500 shadow-md transition-colors"></span>
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
