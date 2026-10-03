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
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-teal dark:border-teal-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Prompts</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Watch conversations ripple back and forth between your family circle.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <PromptIcon className="h-7 w-7 text-coral drop-shadow" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Received Prompts</h2>
        </div>
        {receivedPrompts.length > 0 ? (
          <ul className="space-y-3.5">
            {receivedPrompts.map((prompt) => (
              <li
                key={prompt.id || prompt.filename}
                className="bubble-card bubble-accent flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="bubble-content space-y-1 text-left">
                  <p className="text-xs uppercase font-semibold tracking-[0.25em] text-coral">From</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{prompt.username || prompt.user_email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Received {new Date(prompt.created_at).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                </div>
                <Link
                  to={`/prompt/${prompt.id}`}
                  className="bubble-content btn-secondary self-start md:self-auto"
                  title="Watch Prompt"
                >
                  <PromptIcon className="h-5 w-5" />
                  Watch &amp; Reply
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bubble-card p-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="bubble-content">
              Your inbox is quiet for now. Send a new prompt from the contacts page to spark a story.
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <PromptIcon className="h-7 w-7 text-teal dark:text-teal-400 drop-shadow" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sent Prompts</h2>
        </div>
        {sentPrompts.length > 0 ? (
          <ul className="space-y-3.5">
            {sentPrompts.map((prompt) => {
              const status = prompt.status || 'processed';
              const isProcessed = status === 'processed';
              return (
                <li
                  key={prompt.id || prompt.filename}
                  className="bubble-card bubble-accent flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="bubble-content space-y-1 text-left">
                    <p className="text-xs uppercase font-semibold tracking-[0.25em] text-teal dark:text-teal-400">To</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{prompt.username || prompt.user_email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sent {new Date(prompt.created_at).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status:{' '}
                      <span className={isProcessed ? 'font-medium text-coral' : 'text-gray-400'}>
                        {isProcessed ? 'Ready to play' : 'Processing'}
                      </span>
                    </p>
                  </div>
                  {isProcessed ? (
                    <Link
                      to={`/watch/${prompt.filename}`}
                      className="bubble-content btn-secondary self-start md:self-auto"
                      title="Watch Prompt"
                    >
                      <PromptIcon className="h-5 w-5" />
                      Replay
                    </Link>
                  ) : (
                    <span className="bubble-content text-xs text-gray-400">Processing…</span>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <div className="bubble-card p-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="bubble-content">
              You haven&apos;t sent a prompt yet. Head to your contacts to spark a new conversation.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
