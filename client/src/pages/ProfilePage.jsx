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

  if (loading) return null;

  if (!user) {
    return <p className="p-4">You must be logged in to edit your profile.</p>;
  }

  return (
    <div className="container mx-auto p-4">
      <Profile user={user} onUpdated={handleUpdated} onClose={() => {}} />
    </div>
  );
}
