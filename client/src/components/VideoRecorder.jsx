import React, { useRef, useState, useEffect } from 'react';

function getOptimalMimeType() {
  if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) {
    return '';
  }

  const isApple = /iPad|iPhone|iPod|Macintosh/.test(navigator.userAgent) && !window.MSStream;

  // Prioritize hardware-accelerated MP4 (H.264 + AAC) on Apple devices, WebM on others
  const appleCandidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];

  const standardCandidates = [
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4;codecs=avc1,mp4a',
    'video/mp4',
  ];

  const candidates = isApple ? appleCandidates : standardCandidates;
  for (const mime of candidates) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return mime;
    }
  }
  return '';
}

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  const [recording, setRecording] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [message, setMessage] = useState('Tap red button to record');
  const [error, setError] = useState('');
  const [facingMode, setFacingMode] = useState('user');
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

  // Detect if device has multiple cameras (e.g. mobile front/back)
  useEffect(() => {
    navigator.mediaDevices?.enumerateDevices?.()
      .then((devices) => {
        const videoInputs = devices.filter((d) => d.kind === 'videoinput');
        if (videoInputs.length > 1) {
          setHasMultipleCameras(true);
        }
      })
      .catch(() => {});
  }, []);

  // Initialize camera stream
  async function initCamera(facing) {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    const optimalConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: {
        facingMode: facing,
        width: { ideal: 1280, max: 1920 },
        height: { ideal: 720, max: 1080 },
        frameRate: { ideal: 30, max: 30 },
      },
    };

    try {
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia(optimalConstraints);
      } catch (optErr) {
        console.warn('720p constraints rejected, falling back to basic camera', optErr);
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: facing },
          });
        } catch (facingErr) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        }
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.src = '';
        videoRef.current.muted = true;
      }
      setMessage('Tap red button to record');
      setError('');
    } catch (err) {
      console.error('Failed to access camera and microphone', err);
      setMessage('Unable to access camera & microphone');
      setError('Please check browser permissions and try again.');
    }
  }

  useEffect(() => {
    initCamera(facingMode);
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    if (recording) return;
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  async function startRecording() {
    if (!streamRef.current) return;
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
      setRecordedUrl(null);
    }
    chunksRef.current = [];

    const chosenMime = getOptimalMimeType();

    // 1.8 Mbps video + 128 kbps audio (crisp 720p, ~14MB/min, universally smooth)
    const optionsWithBitrates = {
      mimeType: chosenMime || undefined,
      videoBitsPerSecond: 1800000,
      audioBitsPerSecond: 128000,
    };

    let recorder = null;
    try {
      recorder = new MediaRecorder(streamRef.current, optionsWithBitrates);
    } catch (err) {
      console.warn('MediaRecorder rejected bitrate options, attempting fallback', err);
      try {
        recorder = new MediaRecorder(
          streamRef.current,
          chosenMime ? { mimeType: chosenMime } : undefined
        );
      } catch (fallbackErr) {
        recorder = new MediaRecorder(streamRef.current);
      }
    }

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      const mimeType =
        chunksRef.current[0]?.type ||
        recorder.mimeType ||
        chosenMime ||
        'video/webm';

      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];

      const url = URL.createObjectURL(blob);
      setRecordedUrl(url);

      if (videoRef.current) {
        videoRef.current.srcObject = null;
        videoRef.current.src = url;
        videoRef.current.muted = false;
      }
      setMessage('Recording complete');
      if (onRecorded) onRecorded(blob, url);
    };

    // Emit timeslice chunks every 1000ms for stable buffer packaging
    recorder.start(1000);
    setRecording(true);
    setElapsedSeconds(0);
    setMessage('Recording...');

    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= 300) {
          // 5-minute safety limit
          stopRecording();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }

  function stopRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);
      setMessage('Processing video...');
    }
  }

  const isMirrored = facingMode === 'user';

  return (
    <div className="relative mx-auto w-full max-w-[520px] aspect-[9/16] overflow-hidden rounded-3xl bg-black shadow-2xl border border-white/10">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={!!recordedUrl}
        className={`h-full w-full object-cover transition-transform duration-300 ${
          isMirrored ? 'transform -scale-x-100' : ''
        }`}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

      {/* Top HUD: Status & Timer */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 z-10 w-[90%] pointer-events-none">
        <div className="flex items-center gap-2.5 rounded-full bg-black/70 px-4 py-1.5 backdrop-blur-md border border-white/15 text-white shadow-lg">
          {recording ? (
            <>
              <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-sm font-bold text-red-400">
                {formatDuration(elapsedSeconds)}
              </span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-gold" />
              <span className="text-xs font-medium tracking-wide">{message}</span>
            </>
          )}
        </div>
        {error && (
          <span className="rounded-full bg-rose-950/80 border border-rose-500/30 px-3 py-1 text-xs text-rose-300 backdrop-blur-md text-center">
            {error}
          </span>
        )}
      </div>

      {/* Flip Camera Button (if device has front and back cameras) */}
      {hasMultipleCameras && !recording && !recordedUrl && (
        <div className="absolute top-16 right-4 z-20">
          <button
            type="button"
            onClick={toggleCamera}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/15 hover:bg-white/20 transition-all shadow-lg"
            title="Flip camera"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 10c0-4.418-3.582-8-8-8s-8 3.582-8 8c0 1.25.285 2.435.795 3.5" />
              <path d="M4 14c0 4.418 3.582 8 8 8s8-3.582 8-8c0-1.25-.285-2.435-.795-3.5" />
              <polyline points="1 10 5 10 5 6" />
              <polyline points="23 14 19 14 19 18" />
            </svg>
          </button>
        </div>
      )}

      {/* Record / Stop Button */}
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
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white/90 bg-black/40 backdrop-blur-sm shadow-2xl animate-pulse">
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