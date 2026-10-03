import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AvatarImage from './AvatarImage';
import NotificationToggle from './NotificationToggle.jsx';

export default function UserMenu({ user }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  if (!user) {
    return (
      <a
        href="/api/oauth_login.php"
        className="rounded-full bg-gradient-to-r from-coral to-teal px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:brightness-110 transition-all flex items-center gap-1.5"
      >
        <span>Sign In</span>
      </a>
    );
  }

  const displayName = user.username || user.email;

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-gold/80 bg-gold text-sm shadow-sm transition hover:border-gold hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold/50"
        onClick={() => setOpen(!open)}
        aria-label="User menu"
      >
        {user.avatar ? (
          <AvatarImage filename={user.avatar} alt="avatar" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-tr from-coral to-teal text-xs font-bold text-white uppercase">
            {displayName.charAt(0)}
          </div>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-60 rounded-2xl border border-gray-200 bg-white/95 py-2 shadow-2xl backdrop-blur z-50 text-gray-800 dark:border-[#2a2a2a] dark:bg-[#151515]/95 dark:text-gray-100 dark:shadow-black/70">
          <div className="border-b border-gray-100 px-4 pb-2.5 pt-1 dark:border-[#242424]">
            <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Signed in as</p>
            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{displayName}</p>
            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
          </div>
          <div className="px-2 pt-1.5">
            <NotificationToggle />
          </div>
          <div className="my-1.5 border-t border-gray-100 dark:border-[#242424]" />
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm text-gray-700 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-[#202020]"
            onClick={() => setOpen(false)}
          >
            Profile & Settings
          </Link>
          <Link
            to="/logout"
            className="block px-4 py-2 text-sm text-red-600 transition hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
            onClick={() => setOpen(false)}
          >
            Sign Out
          </Link>
        </div>
      )}
    </div>
  );
}
