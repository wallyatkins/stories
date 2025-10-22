import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Logout() {
  const [done, setDone] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    let timeout;
    fetch('/api/logout')
      .then(() => {
        setDone(true);
        timeout = window.setTimeout(() => navigate('/', { replace: true }), 3000);
      })
      .catch((error) => {
        console.error('Failed to log out', error);
        timeout = window.setTimeout(() => navigate('/', { replace: true }), 3000);
      });
    return () => {
      if (timeout) {
        window.clearTimeout(timeout);
      }
    };
  }, [navigate]);
  return (
    <div className="container mx-auto p-4 text-center">
      {done ? <p>You have been logged out. Redirecting…</p> : <p>Logging out...</p>}
    </div>
  );
}
