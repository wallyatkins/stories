import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';
import promptLogo from '../assets/prompt.svg';
import storyLogo from '../assets/story.svg';

function HeroGraphic() {
  return (
    <div className="relative mx-auto flex w-full max-w-lg items-center justify-center">
      <div className="ripple-ring" />
      <div className="relative flex items-center gap-6">
        <div className="bubble-card bubble-accent p-6 shadow-2xl">
          <div className="bubble-content flex items-center gap-4">
            <img src={promptLogo} alt="Prompt bubble" className="h-16 w-16 drop-shadow-lg" />
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-coral/80">Prompt</p>
              <p className="text-xl font-semibold text-nav-bg">Share a question</p>
            </div>
          </div>
        </div>
        <div className="bubble-card bubble-accent p-6 shadow-2xl">
          <div className="bubble-content flex items-center gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-teal/80">Response</p>
              <p className="text-xl font-semibold text-nav-bg">Capture a story</p>
            </div>
            <img src={storyLogo} alt="Response bubble" className="h-16 w-16 drop-shadow-lg" />
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
    <div className="relative">
      <div className="absolute inset-x-0 top-0 -z-10 h-[420px] bg-gradient-to-br from-coral/40 via-gold/25 to-teal/40 blur-3xl" />
      <div className="container mx-auto flex flex-col items-center gap-12 px-6 py-16 text-center md:flex-row md:items-start md:gap-16 md:text-left">
        <div className="flex-1 space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-teal shadow-md">
            Video stories made personal
          </div>
          <h1 className="text-4xl font-bold leading-snug text-nav-bg md:text-5xl">
            Prompt a memory, capture a story, and keep your circle close.
          </h1>
          <p className="text-lg text-gray-600 md:max-w-xl">
            Story Prompts makes sharing quick video questions and heartfelt replies effortless. Invite friends into warm, ripple-like conversations that keep your family lore alive.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 md:justify-start">
            <a href="#get-started" className="btn-prompt">
              Get started
            </a>
            <a href="#how-it-works" className="btn-secondary">
              How it works
            </a>
          </div>
        </div>
        <div className="flex flex-1 flex-col items-center gap-6 md:items-stretch">
          <HeroGraphic />
          <div id="get-started" className="bubble-card w-full max-w-md bg-white/90">
            <div className="bubble-content space-y-4">
              <h2 className="text-lg font-semibold text-nav-bg">Log in to your story hub</h2>
              <p className="text-sm text-gray-600">
                We’ll send a secure link to your inbox so you can start prompting and responding.
              </p>
              <LoginForm />
            </div>
          </div>
        </div>
      </div>
      <section id="how-it-works" className="container mx-auto grid gap-6 px-6 pb-16 md:grid-cols-3">
        {[{ title: 'Spark a prompt', description: 'Record a warm video question inside a cozy, speech-bubble interface and send it to someone special.' },
          { title: 'Watch the ripple', description: 'Your prompt lands with a shimmering ripple—friends can feel the intent before they even hit play.' },
          { title: 'Capture the reply', description: 'They respond with their own story bubble, building a living library you can revisit anytime.' }].map((item) => (
          <div key={item.title} className="bubble-card bubble-accent">
            <div className="bubble-content flex flex-col gap-3 text-left">
              <h3 className="text-xl font-semibold text-nav-bg">{item.title}</h3>
              <p className="text-sm text-gray-600">{item.description}</p>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
