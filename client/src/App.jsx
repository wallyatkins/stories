import React, { useState, useEffect } from 'react';
import PromptRecorder from './components/PromptRecorder';
import ResponseRecorder from './components/ResponseRecorder';
import LoginForm from './components/LoginForm';
import FriendList from './components/FriendList';
import UserMenu from './components/UserMenu';

export default function App() {
  const [promptId, setPromptId] = useState('');
  const [recordingPrompt, setRecordingPrompt] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('api/check_login.php')
      .then((res) => res.json())
      .then((data) => {
        setAuthenticated(data.authenticated);
        setUser(data.user || null);
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

  function handleLogout() {
    fetch('api/logout.php').then(() => {
      setAuthenticated(false);
      setUser(null);
    });
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Video Stories</h1>
        <UserMenu user={user} onLogout={handleLogout} />
      </div>
      <FriendList />
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
