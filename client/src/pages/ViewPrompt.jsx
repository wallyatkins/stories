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
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold">Prompt not found</h1>
        <p>The prompt you are looking for does not exist or you do not have permission to view it.</p>
        <button
          onClick={() => navigate('/prompts')}
          className="mt-4 bg-coral text-white px-6 py-2 rounded hover:bg-opacity-80"
        >
          Go to Prompts
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 flex flex-col items-center">
      <div className="w-full max-w-4xl">
        <ProcessedVideoPlayer
          filename={prompt.filename}
          autoPlay
          className="rounded-lg shadow-xl mb-4"
        />
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/prompts')}
            className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-opacity-80"
          >
            Exit
          </button>
          <button
            onClick={() => setShowDeclineModal(true)}
            className="bg-red-500 text-white px-6 py-2 rounded hover:bg-opacity-80"
          >
            Decline
          </button>
          <button
            onClick={() => navigate(`/record-response/${promptId}`)}
            className="bg-teal text-white px-6 py-2 rounded hover:bg-opacity-80"
          >
            Storytime
          </button>
        </div>
      </div>

      {showDeclineModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Decline Prompt</h2>
            <p>Are you sure you want to decline this prompt?</p>
            <p className="text-sm text-gray-600">The sender will be notified that you declined.</p>
            <div className="mt-6 flex justify-end space-x-4">
              <button
                onClick={() => setShowDeclineModal(false)}
                className="bg-gray-300 px-4 py-2 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDecline}
                className="bg-red-500 text-white px-4 py-2 rounded"
              >
                Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
