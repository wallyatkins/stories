import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImage from './AvatarImage';

export default function FriendList() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    fetch('/api/list_friends')
      .then((res) => res.json())
      .then((data) => setFriends(data));
  }, []);

  if (!friends.length) return null;

  return (
    <div className="my-4 bubble-card p-4">
      <h2 className="text-lg font-bold font-display text-slate-900 dark:text-white mb-3">Friends</h2>
      <ul className="space-y-3">
        {friends.map((f, i) => (
          <li key={i} className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
            {f.avatar ? (
              <AvatarImage filename={f.avatar} alt="avatar" className="w-10 h-10 rounded-full object-cover ring-2 ring-coral/20" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-zinc-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-sm">
                {(f.username || f.email).charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="font-semibold text-slate-900 dark:text-white text-sm truncate">{f.username || f.email}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{f.email}</div>
            </div>
            <button
              className="h-9 w-9 rounded-full bg-coral/10 hover:bg-coral/20 text-coral flex items-center justify-center transition-colors shadow-sm"
              onClick={() => navigate(`/record/${f.id}`, { state: { friend: f } })}
              title="Send prompt"
            >
              💬
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
