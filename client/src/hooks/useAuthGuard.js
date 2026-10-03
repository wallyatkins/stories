import { useEffect } from 'react';

export function useAuthGuard() {
  useEffect(() => {
    let isMounted = true;
    fetch('/api/check_login', { headers: { 'Cache-Control': 'no-store' } })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (!data?.authenticated) {
          const currentPath = window.location.pathname + window.location.search;
          const returnTo = currentPath !== '/' && currentPath !== '/login' ? currentPath : '/contacts';
          window.location.href = `/api/oauth_login.php?return_to=${encodeURIComponent(returnTo)}`;
        }
      })
      .catch((error) => {
        console.error('Auth guard failed to validate session', error);
        if (isMounted) {
          const currentPath = window.location.pathname + window.location.search;
          const returnTo = currentPath !== '/' && currentPath !== '/login' ? currentPath : '/contacts';
          window.location.href = `/api/oauth_login.php?return_to=${encodeURIComponent(returnTo)}`;
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);
}

