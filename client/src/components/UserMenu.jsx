import React, { useState, useRef, useEffect } from 'react';

export default function UserMenu({ user, onLogout }) {
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

  const avatar = user ? user.charAt(0).toUpperCase() : '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm"
        onClick={() => setOpen(!open)}
      >
        {avatar}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white border rounded shadow-md text-sm">
          <button
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            onClick={() => setOpen(false)}
          >
            Settings
          </button>
          <button
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
