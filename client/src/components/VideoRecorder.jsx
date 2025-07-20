import React, { useRef, useState, useEffect } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export default function VideoRecorder({ onRecorded }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const ffmpegRef = useRef(new FFmpeg());
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState(null);
  const [message, setMessage] = useState('Click the red button to start recording');

  // start camera preview when component mounts
  useEffect(() => {
    async function init() {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      videoRef.current.src = '';
      videoRef.current.muted = true;
      setMessage('Loading video tools...');
      const ffmpeg = ffmpegRef.current;
      await ffmpeg.load();
      setMessage('Click the red button to start recording');
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
    const preferredMime = 'video/webm';
    mediaRecorderRef.current = new MediaRecorder(streamRef.current, { mimeType: preferredMime });
    mediaRecorderRef.current.ondataavailable = (e) => chunksRef.current.push(e.data);
    mediaRecorderRef.current.onstop = async () => {
      const mimeType = chunksRef.current[0]?.type || mediaRecorderRef.current.mimeType || preferredMime;
      const blob = new Blob(chunksRef.current, { type: mimeType });
      chunksRef.current = [];

      setMessage('Transcoding video to MP4...');
      const ffmpeg = ffmpegRef.current;
      const inputFileName = 'input.webm';
      const outputFileName = 'output.mp4';
      await ffmpeg.writeFile(inputFileName, await fetchFile(blob));
      await ffmpeg.exec(['-i', inputFileName, '-c:v', 'libx264', '-preset', 'ultrafast', '-c:a', 'aac', outputFileName]);
      const data = await ffmpeg.readFile(outputFileName);
      const newBlob = new Blob([data.buffer], { type: 'video/mp4' });
      await ffmpeg.deleteFile(inputFileName);
      await ffmpeg.deleteFile(outputFileName);

      const url = URL.createObjectURL(newBlob);
      setRecordedUrl(url);
      videoRef.current.srcObject = null;
      videoRef.current.src = url;
      videoRef.current.muted = false;
      setMessage('Transcoding complete. You can now play the video.');
      if (onRecorded) onRecorded(newBlob, url);
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
      </div>
      {!recordedUrl && (
        <button
          className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center"
          onClick={recording ? stopRecording : startRecording}
          disabled={message.includes('Loading') || message.includes('Processing') || message.includes('Transcoding')}
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
