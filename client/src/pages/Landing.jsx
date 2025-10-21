import React from 'react';
import LoginForm from '../components/LoginForm';
import PromptIcon from '../assets/prompt.svg?react';
import StoryIcon from '../assets/story.svg?react';

export default function Landing() {
  return (
    <div className="container mx-auto p-8 text-center">
      <h1 className="mb-4 flex flex-col items-center gap-2 text-4xl font-bold">
        <span className="flex items-center gap-2">
          <PromptIcon className="h-12 w-12" aria-hidden="true" />
          <span>Story</span>
        </span>
        <span className="flex items-center gap-2">
          <span>Prompts</span>
          <StoryIcon className="h-12 w-12" aria-hidden="true" />
        </span>
      </h1>
      <p className="mb-6">
        Record a short video to prompt a friend and let them reply with a story of their own.
      </p>
      <LoginForm />
    </div>
  );
}
