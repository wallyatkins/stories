import React, { useEffect, useState } from 'react';

export default function FriendList() {
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetch('api/list_friends.php')
      .then((res) => res.json())
      .then((data) => setFriends(data));
  }, []);

  if (!friends.length) return null;

  return (
    <div className="my-4">
      <h2 className="text-xl mb-2">Friends</h2>
      <ul className="list-disc list-inside">
        {friends.map((f, i) => (
          <li key={i}>{f}</li>
        ))}
      </ul>
    </div>
  );
}
