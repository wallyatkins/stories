import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImage from '../components/AvatarImage';
import promptLogo from '../assets/prompt.svg';

function FriendAvatar({ friend, size = 'w-12 h-12' }) {
  const displayName = friend.username || friend.email;
  if (friend.avatar) {
    return (
      <AvatarImage
        filename={friend.avatar}
        alt={`${displayName} avatar`}
        className={`${size} rounded-full object-cover`}
      />
    );
  }
  return (
    <div className={`${size} rounded-full bg-gray-200 flex items-center justify-center text-lg font-medium text-gray-600`}>
      {displayName.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Contacts() {
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
      <div className="flex h-32 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Contacts</h1>
      {friends.length > 0 ? (
        <ul className="space-y-2">
          {friends.map((friend) => {
            const displayName = friend.username || friend.email;
            return (
              <li
                key={friend.id}
                className="flex items-center justify-between rounded-lg border p-3 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() => handleSelectFriend(friend)}
                  className="flex flex-1 items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <FriendAvatar friend={friend} />
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-gray-900">{displayName}</span>
                    <span className="text-sm text-gray-600">{friend.email}</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendPrompt(friend)}
                  className="ml-3 rounded-full p-2 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label={`Send prompt to ${displayName}`}
                >
                  <img src={promptLogo} alt="" className="h-10 w-10" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p>You currently have no contacts.</p>
      )}

      {selectedFriend && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          role="dialog"
          aria-modal="true"
          onClick={handleCloseProfile}
        >
          <div
            className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleCloseProfile}
              className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
              aria-label="Close profile"
            >
              X
            </button>
            <div className="mt-2 flex flex-col items-center text-center">
              <FriendAvatar friend={selectedFriend} size="w-24 h-24" />
              <h2 className="mt-4 text-xl font-semibold text-gray-900">
                {selectedFriend.username || selectedFriend.email}
              </h2>
              <p className="text-sm text-gray-600">{selectedFriend.email}</p>
              <div className="mt-6 w-full rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Prompts you&apos;ve sent</span>
                  <span className="font-semibold">{selectedFriend.prompts_sent ?? 0}</span>
                </div>
                <div className="mt-2 flex justify-between">
                  <span>Prompts they&apos;ve sent</span>
                  <span className="font-semibold">{selectedFriend.prompts_received ?? 0}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
