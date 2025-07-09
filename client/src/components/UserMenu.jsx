import React, { useState, useRef, useEffect } from 'react';

export default function UserMenu({ user, onLogout, onProfile }) {
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

  const avatarLetter = user && (user.username || user.email)
    ? (user.username || user.email).charAt(0).toUpperCase()
    : '?';

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm overflow-hidden"
        onClick={() => setOpen(!open)}
      >
        {user && user.avatar ? (
          <img src={`uploads/avatars/${user.avatar}`} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          avatarLetter
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 bg-white border rounded shadow-md text-sm">
          <button
            className="block px-4 py-2 hover:bg-gray-100 w-full text-left"
            onClick={() => {
              setOpen(false);
              onProfile();
            }}
          >
            Profile
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
