import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthGuard() {
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    fetch('/api/check_login')
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted) return;
        if (!data?.authenticated) {
          navigate('/', { replace: true });
        }
      })
      .catch((error) => {
        console.error('Auth guard failed to validate session', error);
        if (isMounted) {
          navigate('/', { replace: true });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [navigate]);
}

