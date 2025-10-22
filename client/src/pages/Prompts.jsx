import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PromptIcon from '../assets/prompt.svg?react';
import { useAuthGuard } from '../hooks/useAuthGuard';

export default function Prompts() {
  useAuthGuard();
  const [receivedPrompts, setReceivedPrompts] = useState([]);
  const [sentPrompts, setSentPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        const res = await fetch('/api/list_prompts.php');
        const data = await res.json();
        if (data.received) {
          setReceivedPrompts(data.received);
        }
        if (data.sent) {
          setSentPrompts(data.sent);
        }
      } catch (error) {
        console.error('Failed to fetch prompts:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchPrompts();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-nav-bg">Prompts</h1>
        <p className="text-sm text-gray-600">
          Watch conversations ripple back and forth between your circle.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <PromptIcon className="h-8 w-8 text-coral" />
          <h2 className="text-xl font-semibold text-nav-bg">Received Prompts</h2>
        </div>
      {receivedPrompts.length > 0 ? (
        <ul className="space-y-4">
          {receivedPrompts.map((prompt) => (
            <li
              key={prompt.filename}
              className="bubble-card bubble-accent flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="bubble-content space-y-1 text-left">
                <p className="text-sm uppercase tracking-[0.25em] text-coral/80">From</p>
                <p className="text-lg font-semibold text-nav-bg">{prompt.username || prompt.user_email}</p>
                <p className="text-sm text-gray-600">
                  Received {new Date(prompt.created_at).toLocaleString()}
                </p>
              </div>
              <Link
                to={`/prompt/${prompt.id}`}
                className="bubble-content btn-secondary"
                title="Watch Prompt"
              >
                <PromptIcon className="h-6 w-6" />
                Watch
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bubble-card bubble-accent text-sm text-gray-600">
          <div className="bubble-content">
            Your inbox is quiet for now. Send a new invitation from the contacts page to spark a story.
          </div>
        </div>
      )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <PromptIcon className="h-8 w-8 text-teal" />
          <h2 className="text-xl font-semibold text-nav-bg">Sent Prompts</h2>
        </div>
      {sentPrompts.length > 0 ? (
        <ul className="space-y-4">
          {sentPrompts.map((prompt) => {
            const status = prompt.status || 'processed';
            const isProcessed = status === 'processed';
            return (
              <li
                key={prompt.filename}
                className="bubble-card bubble-accent flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="bubble-content space-y-1 text-left">
                  <p className="text-sm uppercase tracking-[0.25em] text-teal/80">To</p>
                  <p className="text-lg font-semibold text-nav-bg">{prompt.username || prompt.user_email}</p>
                  <p className="text-sm text-gray-600">
                    Sent {new Date(prompt.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    Status:{' '}
                    <span className={isProcessed ? 'text-coral font-medium' : 'text-gray-500'}>
                      {isProcessed ? 'Ready to play' : 'Processing'}
                    </span>
                  </p>
                </div>
                {isProcessed ? (
                  <Link
                    to={`/watch/${prompt.filename}`}
                    className="bubble-content btn-secondary"
                    title="Watch Prompt"
                  >
                    <PromptIcon className="h-6 w-6" />
                    Replay
                  </Link>
                ) : (
                  <span className="bubble-content text-sm text-gray-500">Processing…</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bubble-card bubble-accent text-sm text-gray-600">
          <div className="bubble-content">
            You haven&apos;t sent a prompt yet. Head to your contacts to spark a new conversation.
          </div>
        </div>
      )}
      </section>
    </div>
  );
}
