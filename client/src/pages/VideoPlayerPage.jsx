import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

export default function VideoPlayerPage() {
  const { filename } = useParams();
  const navigate = useNavigate();
  const videoSrc = `/uploads/${filename}`;

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <video
          src={videoSrc}
          controls
          autoPlay
          className="w-full rounded-lg shadow-xl mb-4"
        />
        <button
          onClick={() => navigate(-1)} // Go back to the previous page
          className="bg-coral text-white px-6 py-2 rounded hover:bg-opacity-80"
        >
          &larr; Back
        </button>
      </div>
    </div>
  );
}
