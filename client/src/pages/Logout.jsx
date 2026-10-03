import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let timeout;
    fetch('/api/logout.php')
      .then(() => {
        setDone(true);
        timeout = window.setTimeout(() => navigate('/', { replace: true }), 1500);
      })
      .catch((error) => {
        console.error('Failed to log out', error);
        timeout = window.setTimeout(() => navigate('/', { replace: true }), 1500);
      });
    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [navigate]);

  return (
    <div className="container mx-auto max-w-md px-4 py-16 text-center">
      <div className="bubble-card p-8">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-2">Signing Out</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {done ? 'You have been signed out of Story Prompts. Redirecting…' : 'Signing out...'}
        </p>
      </div>
    </div>
  );
}
