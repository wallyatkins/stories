import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';

function BrandMark() {
  return (
    <Link to="/" className="group flex items-center gap-3 text-white">
      <span className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute h-12 w-12 rounded-full bg-gradient-to-tr from-coral via-gold to-teal opacity-90 blur-sm transition group-hover:scale-110" />
        <span className="relative flex items-center gap-1 text-lg">
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-coral shadow-lg transition group-hover:-translate-y-0.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="relative -ml-3 flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-teal/80 text-white shadow-lg transition group-hover:translate-y-0.5">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </span>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-sm uppercase tracking-[0.3em] text-white/70">Story</span>
        <span className="text-lg font-semibold text-white">Prompts</span>
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
    <nav className="sticky top-0 z-50 border-b border-white/20 bg-gradient-to-r from-nav-bg via-nav-bg/95 to-teal/80 text-white backdrop-blur">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <BrandMark />
        <div className="flex items-center gap-8">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/5 text-white shadow md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation"
          >
            <span className="relative block h-4 w-5">
              <span className={`absolute inset-x-0 top-0 h-0.5 rounded-full bg-white transition ${mobileOpen ? 'translate-y-2 rotate-45' : ''}`} />
              <span className={`absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-white transition ${mobileOpen ? 'opacity-0' : ''}`} />
              <span className={`absolute inset-x-0 bottom-0 h-0.5 rounded-full bg-white transition ${mobileOpen ? '-translate-y-2 -rotate-45' : ''}`} />
            </span>
          </button>
          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-sm font-medium shadow-lg md:flex">
            {links.map((link) => {
              const active = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative px-3 py-1 transition-all duration-300 ${
                    active
                      ? 'text-gold'
                      : 'text-white/80 hover:text-gold hover:tracking-wide'
                  }`}
                >
                  {link.label}
                  {active && (
                    <span className="absolute inset-x-2 -bottom-1 h-0.5 rounded-full bg-gold" />
                  )}
                </Link>
              );
            })}
          </div>
          <UserMenu user={user} />
        </div>
      </div>
      {mobileOpen && (
        <div className="md:hidden">
          <div className="mx-4 mt-2 space-y-2 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 backdrop-blur">
            {links.map((link) => {
              const active = location.pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`block rounded-full px-4 py-2 text-sm transition ${
                    active ? 'bg-white/80 text-teal' : 'text-white/90 hover:bg-white/20'
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
