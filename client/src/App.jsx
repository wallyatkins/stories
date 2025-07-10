import React, { useState, useEffect } from 'react';
import PromptRecorder from './components/PromptRecorder';
import ResponseRecorder from './components/ResponseRecorder';
import LoginForm from './components/LoginForm';
import FriendList from './components/FriendList';
import UserMenu from './components/UserMenu';
import Profile from './components/Profile';

export default function App() {
  const [promptId, setPromptId] = useState('');
  const [targetFriend, setTargetFriend] = useState(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfile, setShowProfile] = useState(false);

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

  function handleProfileUpdated(u) {
    setUser(u);
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Video Stories</h1>
        <UserMenu user={user} onLogout={handleLogout} onProfile={() => setShowProfile(true)} />
      </div>
      {showProfile && (
        <Profile user={user} onUpdated={handleProfileUpdated} onClose={() => setShowProfile(false)} />
      )}
      <FriendList onPrompt={(f) => setTargetFriend(f)} />
      {targetFriend && (
        <PromptRecorder
          friend={targetFriend}
          onFinish={(id) => {
            setPromptId(id);
            setTargetFriend(null);
          }}
        />
      )}
      {promptId && (
        <div className="mt-6">
          <ResponseRecorder promptId={promptId} />
        </div>
      )}
    </div>
  );
}
