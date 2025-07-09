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
      <ul className="space-y-2">
        {friends.map((f, i) => (
          <li key={i} className="flex items-center space-x-2">
            {f.avatar ? (
              <img src={`uploads/avatars/${f.avatar}`} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm">
                {(f.username || f.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <div className="font-semibold">{f.username || f.email}</div>
              <div className="text-sm text-gray-600">{f.email}</div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
