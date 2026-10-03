import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImage from '../components/AvatarImage';
import promptLogo from '../assets/prompt.svg';
import { useAuthGuard } from '../hooks/useAuthGuard';

function FriendAvatar({ friend, size = 'w-12 h-12' }) {
  const displayName = friend.username || friend.email;
  if (friend.avatar) {
    return (
      <AvatarImage
        filename={friend.avatar}
        alt={`${displayName} avatar`}
        className={`${size} rounded-full object-cover ring-2 ring-white/50 dark:ring-[#2a2a2a]`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gradient-to-tr from-coral/20 to-teal/20 flex items-center justify-center text-base font-bold text-teal dark:bg-[#202020] dark:text-teal-300 ring-2 ring-white/30 dark:ring-[#2a2a2a]`}>
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Contacts() {
  useAuthGuard();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    async function fetchFriends() {
      try {
        const res = await fetch('/api/list_friends');
        if (!res.ok) {
          throw new Error(`Failed to load contacts: ${res.status}`);
        }
        const data = await res.json();
        if (!cancelled) {
          setFriends(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error('Failed to fetch friends:', error);
        if (!cancelled) {
          setFriends([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchFriends();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSendPrompt = (friend) => {
    navigate(`/record/${friend.id}`, { state: { friend } });
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseProfile = () => {
    setSelectedFriend(null);
  };

  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-teal dark:border-teal-400" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-1">
        <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Pick a contact to spark a video prompt or view their shared stories.
        </p>
      </div>

      {friends.length > 0 ? (
        <ul className="space-y-3.5">
          {friends.map((friend) => {
            const displayName = friend.username || friend.email;
            return (
              <li
                key={friend.id}
                className="bubble-card bubble-accent flex items-center justify-between p-4 sm:p-5"
              >
                <button
                  type="button"
                  onClick={() => handleSelectFriend(friend)}
                  className="bubble-content flex flex-1 items-center gap-4 text-left focus:outline-none focus:ring-2 focus:ring-teal/50 rounded-2xl p-1"
                >
                  <FriendAvatar friend={friend} size="w-12 h-12" />
                  <div className="flex flex-col">
                    <span className="text-base font-bold text-gray-900 dark:text-white">{displayName}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{friend.email}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPrompt(friend)}
                  className="bubble-content ml-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-tr from-coral via-gold to-teal p-2.5 text-white shadow-lg transition hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gold/70"
                  aria-label={`Send prompt to ${displayName}`}
                  title={`Record prompt for ${displayName}`}
                >
                  <img src={promptLogo} alt="" className="h-7 w-7 drop-shadow" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bubble-card p-8 text-center text-gray-600 dark:text-gray-400">
          <p>No contacts found yet.</p>
        </div>
      )}

      {selectedFriend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseProfile}
        >
          <div
            className="bubble-card w-full max-w-sm border border-gray-200 dark:border-[#2a2a2a] dark:bg-[#151515]"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseProfile}
              className="bubble-content ml-auto flex h-8 w-8 items-center justify-center rounded-full border border-gray-300 bg-white/80 text-gray-600 hover:bg-gray-100 dark:border-[#333] dark:bg-[#222] dark:text-gray-300 dark:hover:bg-[#2a2a2a]"
              aria-label="Close profile"
            >
              ✕
            </button>
            <div className="bubble-content mt-2 flex flex-col items-center text-center">
              <FriendAvatar friend={selectedFriend} size="w-24 h-24" />
              <h2 className="mt-4 font-display text-xl font-bold text-gray-900 dark:text-white">
                {selectedFriend.username || selectedFriend.email}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{selectedFriend.email}</p>
              <div className="mt-6 w-full rounded-2xl bg-white/90 p-4 text-sm text-gray-700 shadow-inner dark:bg-[#1c1c1c] dark:text-gray-300">
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 dark:text-gray-400">Prompts you&apos;ve sent</span>
                  <span className="font-bold text-coral text-base">{selectedFriend.prompts_sent ?? 0}</span>
                </div>
                <div className="my-1 border-t border-gray-100 dark:border-[#282828]" />
                <div className="flex justify-between items-center py-1">
                  <span className="text-gray-500 dark:text-gray-400">Prompts they&apos;ve sent</span>
                  <span className="font-bold text-teal dark:text-teal-400 text-base">{selectedFriend.prompts_received ?? 0}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  handleCloseProfile();
                  handleSendPrompt(selectedFriend);
                }}
                className="btn-prompt mt-5 w-full"
              >
                Record prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
