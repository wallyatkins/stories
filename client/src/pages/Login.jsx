import React from 'react';
import LoginForm from '../components/LoginForm';

export default function Login() {
  return (
    <div className="container mx-auto max-w-md px-4 py-16">
      <div className="bubble-card bubble-accent p-8">
        <div className="bubble-content space-y-4 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/40 text-indigo-500 shadow-sm">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">Sign In to Story Prompts</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Sign in with your WallyAuth family account to access prompts and stories.
          </p>
          <div className="pt-4">
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}
