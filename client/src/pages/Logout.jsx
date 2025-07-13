import React, { useEffect, useState } from 'react';

export default function Logout() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    fetch('api/logout.php').then(() => setDone(true));
  }, []);
  return (
    <div className="container mx-auto p-4 text-center">
      {done ? <p>You have been logged out.</p> : <p>Logging out...</p>}
    </div>
  );
}
