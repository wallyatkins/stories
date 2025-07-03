import React, { useState, useEffect } from 'react';
import PromptRecorder from './components/PromptRecorder';
import ResponseRecorder from './components/ResponseRecorder';
import LoginForm from './components/LoginForm';

export default function App() {
  const [promptId, setPromptId] = useState('');
  const [recordingPrompt, setRecordingPrompt] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('api/check_login.php')
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return null;
  }

  if (!authenticated) {
    return (
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Video Stories</h1>
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Video Stories</h1>
      {recordingPrompt ? (
        <PromptRecorder onFinish={(id) => { setPromptId(id); setRecordingPrompt(false); }} />
      ) : (
        <button className="bg-blue-500 text-white px-4 py-2 rounded" onClick={() => setRecordingPrompt(true)}>Record Prompt</button>
      )}
      {promptId && (
        <div className="mt-6">
          <ResponseRecorder promptId={promptId} />
        </div>
      )}
    </div>
  );
}
