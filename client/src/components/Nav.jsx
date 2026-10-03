import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';
import ThemeToggle from './ThemeToggle';

function BrandMark() {
  return (
    <Link to="/" className="group flex items-center gap-3 text-white">
      <span className="relative flex h-11 w-11 items-center justify-center">
        <span className="absolute h-11 w-11 rounded-full bg-gradient-to-tr from-coral via-gold to-teal opacity-90 blur-sm transition group-hover:scale-110" />
        <span className="relative flex items-center gap-1 text-lg">
          <span className="relative flex h-7 w-7 items-center justify-center rounded-full bg-white text-coral shadow-lg transition group-hover:-translate-y-0.5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="relative -ml-2.5 flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-teal text-white shadow-lg transition group-hover:translate-y-0.5">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/70">Story</span>
        <span className="font-display text-lg font-bold text-white tracking-wide">Prompts</span>
      </div>
    </Link>
  );
}

export default function Nav() {
  const [user, setUser] = useState(null);
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/check_login')
      .then(res => res.json())
      .then(data => {
        if (!cancelled) {
          setUser(data.user || null);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load user for nav:', error);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const links = [
    { href: '/contacts', label: 'Contacts' },
    { href: '/prompts', label: 'Prompts' },
    { href: '/stories', label: 'Stories' },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-200/40 bg-slate-900/90 text-white backdrop-blur dark:border-[#2a2a2a] dark:bg-[#0f0f0f]/95">
      <div className="container mx-auto flex items-center justify-between px-4 py-2.5">
        <BrandMark />
        <div className="flex items-center gap-3 sm:gap-6">
          <div className="hidden items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm font-medium shadow-inner md:flex dark:border-[#2a2a2a] dark:bg-[#151515]">
            {links.map((link) => {
              const active = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative rounded-full px-3.5 py-1 text-xs font-semibold tracking-wide transition-all duration-200 ${
                    active
                      ? 'bg-gradient-to-r from-coral/90 to-teal/90 text-white shadow'
                      : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>

          <ThemeToggle />

          <button
            type="button"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white shadow md:hidden dark:border-[#2a2a2a] dark:bg-[#1d1d1d]"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="relative block h-4 w-4">
              <span className={`absolute inset-x-0 top-0.5 h-0.5 rounded-full bg-white transition ${mobileOpen ? 'translate-y-1.5 rotate-45' : ''}`} />
              <span className={`absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-white transition ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`absolute inset-x-0 bottom-0.5 h-0.5 rounded-full bg-white transition ${mobileOpen ? '-translate-y-1.5 -rotate-45' : ''}`} />
            </span>
          </button>

          <UserMenu user={user} />
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-white/10 bg-slate-900/95 px-4 py-3 md:hidden dark:border-[#2a2a2a] dark:bg-[#151515]/95">
          <div className="space-y-1.5">
            {links.map((link) => {
              const active = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block rounded-xl px-4 py-2 text-sm font-medium transition ${
                    active ? 'bg-gradient-to-r from-coral/80 to-teal/80 text-white' : 'text-gray-300 hover:bg-white/10'
                  }`}
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}
