import React from 'react';
import LoginForm from '../components/LoginForm';

export default function Landing() {
  return (
    <div className="container mx-auto p-8 text-center">
      <div className="text-6xl mb-4">📖</div>
      <h1 className="text-4xl font-bold mb-2">Story Prompts</h1>
      <p className="mb-6">
        Record a short video to prompt a friend and let them reply with a story of their own.
      </p>
      <LoginForm />
    </div>
  );
}
