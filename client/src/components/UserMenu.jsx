import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import AvatarImage from './AvatarImage';

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
    return null;
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-sm overflow-hidden border-2 border-gold"
        onClick={() => setOpen(!open)}
      >
        {user.avatar ? (
          <AvatarImage filename={user.avatar} alt="avatar" className="w-full h-full object-cover" />
        ) : (
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user.email)}&background=random&color=fff`}
            alt="avatar"
            className="w-full h-full object-cover"
          />
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 text-gray-800">
          <Link
            to="/profile"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/logout"
            className="block px-4 py-2 text-sm hover:bg-gray-100"
            onClick={() => setOpen(false)}
          >
            Logout
          </Link>
        </div>
      )}
    </div>
  );
}
