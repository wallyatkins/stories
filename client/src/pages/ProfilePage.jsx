import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Profile from '../components/Profile';
import { useAuthGuard } from '../hooks/useAuthGuard';

export default function ProfilePage() {
  useAuthGuard();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/check_login')
      .then(res => res.json())
      .then(data => {
        setUser(data.user || null);
        setLoading(false);
      });
  }, []);

  function handleUpdated(u) {
    setUser(u);
    navigate('/contacts', { replace: true });
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-coral"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-md text-center">
        <div className="bubble-card p-6">
          <p className="text-slate-700 dark:text-slate-300 font-medium">You must be logged in to edit your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Profile user={user} onUpdated={handleUpdated} onClose={() => navigate('/contacts')} />
    </div>
  );
}
