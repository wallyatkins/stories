import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ProcessedVideoPlayer from '../components/ProcessedVideoPlayer';

export default function ViewPrompt() {
  const { promptId } = useParams();
  const navigate = useNavigate();
  const [prompt, setPrompt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    async function fetchPrompt() {
      try {
        const res = await fetch(`/api/get_prompt.php?id=${promptId}`);
        if (res.ok) {
          const data = await res.json();
          setPrompt(data);
        } else {
          console.error('Failed to fetch prompt');
        }
      } catch (error) {
        console.error('Failed to fetch prompt:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrompt();
  }, [promptId]);

  const handleDecline = async () => {
    try {
      const res = await fetch('/api/decline_prompt.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt_id: promptId }),
      });

      if (res.ok) {
        navigate('/prompts');
      } else {
        console.error('Failed to decline prompt');
        // Optionally, show an error message to the user
      }
    } catch (error) {
      console.error('Failed to decline prompt:', error);
    } finally {
      setShowDeclineModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto p-6 max-w-md text-center">
        <div className="bubble-card p-8">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display mb-2">Prompt Not Found</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            The prompt you are looking for does not exist or you do not have permission to view it.
          </p>
          <button
            onClick={() => navigate('/prompts')}
            className="btn-coral w-full py-2.5 rounded-full font-semibold shadow-md"
          >
            Back to Prompts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 flex flex-col items-center">
      <div className="w-full max-w-[520px]">
        <ProcessedVideoPlayer
          filename={prompt.filename}
          manifestPath={prompt.processed_manifest}
          autoPlay
          className="rounded-3xl shadow-2xl mb-6"
        />
        
        {/* Actions bar */}
        <div className="flex items-center justify-between gap-3 px-1">
          <button
            onClick={() => navigate('/prompts')}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-full border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-zinc-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-zinc-700 text-sm font-medium transition-all shadow-sm"
          >
            ← Exit
          </button>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeclineModal(true)}
              className="px-4 py-2.5 rounded-full border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 text-sm font-medium transition-all"
            >
              Decline
            </button>
            <button
              onClick={() => navigate(`/record-response/${promptId}`)}
              className="px-6 py-2.5 rounded-full bg-teal hover:bg-teal/90 text-white text-sm font-bold shadow-lg shadow-teal/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>Record Story</span>
              <span>✨</span>
            </button>
          </div>
        </div>
      </div>

      {showDeclineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-white dark:bg-[#151515] border border-slate-200 dark:border-[#2a2a2a] p-6 sm:p-8 rounded-3xl shadow-2xl max-w-sm w-full">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white font-display mb-2">Decline Prompt?</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
              Are you sure you want to decline this story prompt?
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mb-6">
              The sender will be politely notified so they know you saw it.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="px-4 py-2 rounded-full border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 text-sm font-medium transition-colors"
              >
                Keep
              </button>
              <button
                onClick={handleDecline}
                className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-colors shadow-md"
              >
                Yes, Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
