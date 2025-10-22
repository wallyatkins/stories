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
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold text-nav-bg">Stories</h1>
        <p className="text-sm text-gray-600">Your collection of shared memories, always within reach.</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <StoryIcon className="h-8 w-8 text-coral" />
          <h2 className="text-xl font-semibold text-nav-bg">Received Stories</h2>
        </div>
      {receivedStories.length > 0 ? (
        <ul className="space-y-4">
          {receivedStories.map((story) => (
            <li
              key={story.filename}
              className="bubble-card bubble-accent flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="bubble-content space-y-2 text-left">
                <p className="text-sm uppercase tracking-[0.25em] text-coral/80">Story from</p>
                <p className="text-lg font-semibold text-nav-bg">{story.username || story.user_email}</p>
                <p className="text-sm text-gray-600">
                  Received {new Date(story.created_at).toLocaleString()}
                </p>
                <Link
                  to={`/watch/${story.prompt_filename}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral"
                  title="Watch Original Prompt"
                >
                  <PromptIcon className="h-5 w-5" />
                  View original prompt
                </Link>
              </div>
              <Link
                to={`/watch/${story.filename}`}
                className="bubble-content btn-secondary"
                title="Watch Story"
              >
                <StoryIcon className="h-6 w-6" />
                Watch
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="bubble-card bubble-accent text-sm text-gray-600">
          <div className="bubble-content">
            You haven&apos;t received any stories yet. Send a prompt to spark one today.
          </div>
        </div>
      )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-3">
          <StoryIcon className="h-8 w-8 text-teal" />
          <h2 className="text-xl font-semibold text-nav-bg">Sent Stories</h2>
        </div>
      {sentStories.length > 0 ? (
        <ul className="space-y-4">
          {sentStories.map((story) => {
            const status = story.status || 'processed';
            const isProcessed = status === 'processed';
            return (
            <li
              key={story.filename}
              className="bubble-card bubble-accent flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="bubble-content space-y-2 text-left">
                <p className="text-sm uppercase tracking-[0.25em] text-teal/80">Story to</p>
                <p className="text-lg font-semibold text-nav-bg">{story.username || story.user_email}</p>
                <p className="text-sm text-gray-600">
                  Sent {new Date(story.created_at).toLocaleString()}
                </p>
                <Link
                  to={`/watch/${story.prompt_filename}`}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-teal hover:text-coral"
                  title="Watch Original Prompt"
                >
                  <PromptIcon className="h-5 w-5" />
                  View their prompt
                </Link>
                <p className="text-sm text-gray-600">
                  Status:{' '}
                  <span className={isProcessed ? 'text-coral font-medium' : 'text-gray-500'}>
                    {isProcessed ? 'Ready to rewatch' : 'Processing'}
                  </span>
                </p>
              </div>
              {isProcessed ? (
                <Link
                  to={`/watch/${story.filename}`}
                  className="bubble-content btn-secondary"
                  title="Watch Story"
                >
                  <StoryIcon className="h-6 w-6" />
                  Watch
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
            Your sent stories will collect here. Reply to a prompt to add your voice.
          </div>
        </div>
      )}
      </section>
    </div>
  );
}
