import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import UserMenu from './UserMenu';

export default function Nav() {
  const [user, setUser] = useState(null);
  const location = useLocation();

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

  return (
    <nav className="bg-nav-bg text-white p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <>
            <Link to="/contacts" className="hover:text-gold">
              Contacts
            </Link>
            <Link to="/prompts" className="hover:text-gold">
              Prompts
            </Link>
            <Link to="/stories" className="hover:text-gold">
              Stories
            </Link>
          </>
        </div>
        <div>
          <UserMenu user={user} />
        </div>
      </div>
    </nav>
  );
}
