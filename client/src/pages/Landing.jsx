import React from 'react';
import LoginForm from '../components/LoginForm';
import promptLogo from '../assets/prompt.svg';
import storyLogo from '../assets/story.svg';

export default function Landing() {
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="mb-4 flex flex-col items-center gap-2 text-4xl font-bold">
        <span className="flex items-center gap-2">
          <img src={promptLogo} alt="" className="h-12 w-12" />
          <span>Story</span>
        </span>
        <span className="flex items-center gap-2">
          <span>Prompts</span>
          <img src={storyLogo} alt="" className="h-12 w-12" />
        </span>
      </h1>
      <p className="mb-6">
        Record a short video to prompt a friend and let them reply with a story of their own.
      </p>
      <LoginForm />
    </div>
  );
}
