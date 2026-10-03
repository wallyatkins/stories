import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProcessedVideoPlayer from '../components/ProcessedVideoPlayer';

export default function VideoPlayerPage() {
  const { filename } = useParams();
  const navigate = useNavigate();
  return (
    <div className="container mx-auto px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-[520px]">
        <ProcessedVideoPlayer filename={filename} autoPlay className="rounded-3xl shadow-2xl mb-6" />
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-medium transition-all shadow-sm"
        >
          <span>←</span>
          <span>Back</span>
        </button>
      </div>
    </div>
  );
}
