import React, { useState, useEffect } from 'react';
import PromptWorkflow from '../components/PromptWorkflow';
import LoginForm from '../components/LoginForm';

export default function Prompts() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('api/check_login')
      .then(res => res.json())
      .then(data => {
        setAuthenticated(data.authenticated);
        setLoading(false);
      });
  }, []);

  if (loading) return null;

  if (!authenticated) {
    return (
      <div className="container mx-auto p-4">
        <LoginForm />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Prompts</h1>
      <PromptWorkflow />
    </div>
  );
}
