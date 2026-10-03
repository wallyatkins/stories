import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PromptIcon from '../assets/prompt.svg?react';
import StoryIcon from '../assets/story.svg?react';
import { useAuthGuard } from '../hooks/useAuthGuard';

export default function Stories() {
  useAuthGuard();
  const [receivedStories, setReceivedStories] = useState([]);
  const [sentStories, setSentStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStories() {
      try {
        const res = await fetch('/api/list_stories.php');
        const data = await res.json();
        if (data.received) {
          setReceivedStories(data.received);
        }
        if (data.sent) {
          setSentStories(data.sent);
        }
      } catch (error) {
        console.error('Failed to fetch stories:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchStories();
  }, []);

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-coral dark:border-coral-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl space-y-8 px-4 py-8">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Stories</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Your collection of shared memories, always within reach.
        </p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <StoryIcon className="h-7 w-7 text-coral drop-shadow" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Received Stories</h2>
        </div>
        {receivedStories.length > 0 ? (
          <ul className="space-y-3.5">
            {receivedStories.map((story) => (
              <li
                key={story.filename}
                className="bubble-card bubble-accent flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
              >
                <div className="bubble-content space-y-1.5 text-left">
                  <p className="text-xs uppercase font-semibold tracking-[0.25em] text-coral">Story from</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">{story.username || story.user_email}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Received {new Date(story.created_at).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <Link
                    to={`/watch/${story.prompt_filename}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-coral dark:text-teal-400 dark:hover:text-coral"
                    title="Watch Original Prompt"
                  >
                    <PromptIcon className="h-4 w-4" />
                    View original prompt
                  </Link>
                </div>
                <Link
                  to={`/watch/${story.filename}`}
                  className="bubble-content btn-prompt self-start md:self-auto"
                  title="Watch Story"
                >
                  <StoryIcon className="h-5 w-5" />
                  Watch
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="bubble-card p-6 text-sm text-gray-600 dark:text-gray-400">
            <div className="bubble-content">
              You haven&apos;t received any stories yet. Send a prompt to spark one today.
            </div>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <StoryIcon className="h-7 w-7 text-teal dark:text-teal-400 drop-shadow" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sent Stories</h2>
        </div>
        {sentStories.length > 0 ? (
          <ul className="space-y-3.5">
            {sentStories.map((story) => {
              const status = story.status || 'processed';
              const isProcessed = status === 'processed';
              return (
                <li
                  key={story.filename}
                  className="bubble-card bubble-accent flex flex-col gap-4 p-5 md:flex-row md:items-center md:justify-between"
                >
                  <div className="bubble-content space-y-1.5 text-left">
                    <p className="text-xs uppercase font-semibold tracking-[0.25em] text-teal dark:text-teal-400">Story to</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{story.username || story.user_email}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Sent {new Date(story.created_at).toLocaleDateString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                    <Link
                      to={`/watch/${story.prompt_filename}`}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal hover:text-coral dark:text-teal-400 dark:hover:text-coral"
                      title="Watch Original Prompt"
                    >
                      <PromptIcon className="h-4 w-4" />
                      View their prompt
                    </Link>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Status:{' '}
                      <span className={isProcessed ? 'font-medium text-coral' : 'text-gray-400'}>
                        {isProcessed ? 'Ready to rewatch' : 'Processing'}
                      </span>
                    </p>
                  </div>
                  {isProcessed ? (
                    <Link
                      to={`/watch/${story.filename}`}
                      className="bubble-content btn-secondary self-start md:self-auto"
                      title="Watch Story"
                    >
                      <StoryIcon className="h-5 w-5" />
                      Rewatch
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
              Your sent stories will collect here. Reply to a prompt to add your voice.
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
