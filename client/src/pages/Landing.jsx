import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import ThemeToggle from '../components/ThemeToggle';
import promptLogo from '../assets/prompt.svg';
import storyLogo from '../assets/story.svg';

function HeroGraphic() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center">
      <div className="ripple-ring" />
      <div className="relative flex items-center gap-4 sm:gap-6">
        <div className="bubble-card bubble-accent p-5 sm:p-6 shadow-2xl">
          <div className="bubble-content flex items-center gap-3 sm:gap-4">
            <img src={promptLogo} alt="Prompt bubble" className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow-lg" />
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-semibold text-coral">Prompt</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Share a question</p>
            </div>
          </div>
        </div>
        <div className="bubble-card bubble-accent p-5 sm:p-6 shadow-2xl">
          <div className="bubble-content flex items-center gap-3 sm:gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] font-semibold text-teal">Response</p>
              <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Capture a story</p>
            </div>
            <img src={storyLogo} alt="Response bubble" className="h-14 w-14 sm:h-16 sm:w-16 drop-shadow-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    fetch('/api/check_login', { headers: { 'Cache-Control': 'no-store' } })
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.authenticated) {
          navigate('/contacts', { replace: true });
        }
      })
      .catch((error) => {
        console.warn('Failed to check login state on landing', error);
      });
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[480px] bg-gradient-to-br from-coral/25 via-gold/15 to-teal/25 blur-3xl dark:from-coral/15 dark:via-gold/5 dark:to-teal/15" />

      {/* Top Header Bar for Landing */}
      <header className="container mx-auto flex items-center justify-between px-6 pt-6">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-teal dark:text-teal-400">Story Prompts</span>
        </div>
        <ThemeToggle />
      </header>

      <div className="container mx-auto flex flex-col items-center gap-12 px-6 py-12 text-center md:flex-row md:items-start md:gap-16 md:text-left">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-teal/30 bg-teal/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-teal shadow-sm dark:border-teal-500/30 dark:bg-teal-950/30 dark:text-teal-300">
            Video stories made personal
          </div>
          <h1 className="font-display text-4xl font-bold leading-tight text-gray-900 md:text-5xl lg:text-6xl dark:text-white">
            Prompt a memory, capture a story, and keep your circle close.
          </h1>
          <p className="text-lg text-gray-600 md:max-w-xl dark:text-gray-300">
            Story Prompts makes sharing quick video questions and heartfelt replies effortless. Invite friends and family into warm conversations that keep your family lore alive.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 md:justify-start">
            <a href="/api/oauth_login.php" className="btn-prompt">
              Get started
            </a>
            <a href="#how-it-works" className="btn-secondary">
              How it works
            </a>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-6 md:items-stretch">
          <HeroGraphic />
          <div id="get-started" className="bubble-card w-full max-w-md">
            <div className="bubble-content space-y-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Sign in to your story hub</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Sign in with your WallyAuth family account to start sharing story prompts.
              </p>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>

      <section id="how-it-works" className="container mx-auto grid gap-6 px-6 pb-20 md:grid-cols-3">
        {[
          { title: 'Spark with a prompt', description: 'Record a warm video question inside a cozy interface and send it to someone special.' },
          { title: 'Share with intent', description: 'Your prompt lands as an intimate notification—family members feel the presence before they even hit play.' },
          { title: 'Capture the reply', description: 'They respond with their own video story, building a living family archive you can revisit anytime.' }
        ].map((item) => (
          <div key={item.title} className="bubble-card bubble-accent">
            <div className="bubble-content flex flex-col gap-3 text-left">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
