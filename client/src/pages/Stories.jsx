import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PromptIcon from '../assets/prompt.svg?react';
import StoryIcon from '../assets/story.svg?react';

export default function Stories() {
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Stories</h1>

      <h2 className="text-xl font-bold mb-2">Received Stories</h2>
      {receivedStories.length > 0 ? (
        <ul className="space-y-2 mb-6">
          {receivedStories.map((story) => (
            <li
              key={story.filename}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p>
                  Story from:{' '}
                  <strong>{story.username || story.user_email}</strong>
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  In response to your prompt:{' '}
                  <Link
                    to={`/watch/${story.prompt_filename}`}
                    className="text-teal hover:opacity-80"
                    title="Watch Original Prompt"
                  >
                    <PromptIcon className="w-6 h-6" />
                  </Link>
                </p>
                <p className="text-sm text-gray-500">
                  Received: {new Date(story.created_at).toLocaleString()}
                </p>
              </div>
              <Link
                to={`/watch/${story.filename}`}
                className="text-gold hover:opacity-80"
                title="Watch Story"
              >
                <StoryIcon className="w-10 h-10" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have not received any stories yet.</p>
      )}

      <h2 className="text-xl font-bold mb-2">Sent Stories</h2>
      {sentStories.length > 0 ? (
        <ul className="space-y-2">
          {sentStories.map((story) => {
            const status = story.status || 'processed';
            const isProcessed = status === 'processed';
            return (
            <li
              key={story.filename}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p>
                  Story to:{' '}
                  <strong>{story.username || story.user_email}</strong>
                </p>
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  In response to their prompt:{' '}
                  <Link
                    to={`/watch/${story.prompt_filename}`}
                    className="text-teal hover:opacity-80"
                    title="Watch Original Prompt"
                  >
                    <PromptIcon className="w-6 h-6" />
                  </Link>
                </p>
                <p className="text-sm text-gray-500">
                  Sent: {new Date(story.created_at).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500">
                  Status: {isProcessed ? 'Ready' : 'Processing'}
                </p>
              </div>
              {isProcessed ? (
                <Link
                  to={`/watch/${story.filename}`}
                  className="text-gold hover:opacity-80"
                  title="Watch Story"
                >
                  <StoryIcon className="w-10 h-10" />
                </Link>
              ) : (
                <span className="text-gray-400 text-sm">Processing…</span>
              )}
            </li>
            );
          })}
        </ul>
      ) : (
        <p>You have not sent any stories yet.</p>
      )}
    </div>
  );
}
