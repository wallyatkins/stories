import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import PromptIcon from '../assets/prompt.svg?react';

export default function Prompts() {
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPrompts() {
      try {
        const res = await fetch('/api/list_prompts');
        const data = await res.json();
        setPrompts(data);
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
      {prompts.length > 0 ? (
        <ul className="space-y-2">
          {prompts.map((prompt) => (
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
                to={`/watch/${prompt.filename}`}
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
    </div>
  );
}
