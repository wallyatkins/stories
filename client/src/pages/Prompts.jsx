import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PromptIcon from '../assets/prompt.svg?react';

export default function Prompts() {
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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prompts</h1>

      <h2 className="text-xl font-bold mb-2">Received Prompts</h2>
      {receivedPrompts.length > 0 ? (
        <ul className="space-y-2 mb-6">
          {receivedPrompts.map((prompt) => (
            <li
              key={prompt.filename}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <div>
                <p>
                  From:{' '}
                  <strong>{prompt.username || prompt.user_email}</strong>
                </p>
                <p className="text-sm text-gray-500">
                  Received: {new Date(prompt.created_at).toLocaleString()}
                </p>
              </div>
              <Link
                to={`/prompt/${prompt.id}`}
                className="text-teal hover:opacity-80"
                title="Watch Prompt"
              >
                <PromptIcon className="w-10 h-10" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You have not received any prompts yet.</p>
      )}

      <h2 className="text-xl font-bold mb-2">Sent Prompts</h2>
      {sentPrompts.length > 0 ? (
        <ul className="space-y-2">
          {sentPrompts.map((prompt) => {
            const status = prompt.status || 'processed';
            const isProcessed = status === 'processed';
            return (
              <li
                key={prompt.filename}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p>
                    To:{' '}
                    <strong>{prompt.username || prompt.user_email}</strong>
                  </p>
                  <p className="text-sm text-gray-500">
                    Sent: {new Date(prompt.created_at).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: {isProcessed ? 'Ready' : 'Processing'}
                  </p>
                </div>
                {isProcessed ? (
                  <Link
                    to={`/watch/${prompt.filename}`}
                    className="text-teal hover:opacity-80"
                    title="Watch Prompt"
                  >
                    <PromptIcon className="w-10 h-10" />
                  </Link>
                ) : (
                  <span className="text-gray-400 text-sm">Processing…</span>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p>You have not sent any prompts yet.</p>
      )}
    </div>
  );
}
