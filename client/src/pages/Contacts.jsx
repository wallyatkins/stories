import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImage from '../components/AvatarImage';
import promptLogo from '../assets/prompt.svg';
import { useAuthGuard } from '../hooks/useAuthGuard';

function FriendAvatar({ friend, size = 'w-12 h-12' }) {
  const displayName = friend.username || friend.email || 'Friend';
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
  const [currentUser, setCurrentUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [addStatus, setAddStatus] = useState({ loading: false, error: '', success: '' });
  const navigate = useNavigate();

  async function loadData() {
    try {
      const [authRes, friendsRes] = await Promise.all([
        fetch('/api/check_login', { headers: { 'Cache-Control': 'no-store' } }),
        fetch('/api/list_friends', { headers: { 'Cache-Control': 'no-store' } }),
      ]);

      if (authRes.ok) {
        const authData = await authRes.json();
        if (authData?.user) {
          setCurrentUser(authData.user);
        }
      }

      if (friendsRes.ok) {
        const friendsData = await friendsRes.json();
        setFriends(Array.isArray(friendsData) ? friendsData : []);
      }
    } catch (err) {
      console.error('Failed to load contacts data:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleSendPrompt = (friend) => {
    navigate(`/record/${friend.id}`, { state: { friend } });
  };

  const handleSendSelfPrompt = () => {
    if (!currentUser) return;
    const selfObj = {
      id: currentUser.id,
      username: currentUser.username ? `${currentUser.username} (Self)` : 'Myself (Practice)',
      email: currentUser.email,
      avatar: currentUser.avatar,
    };
    navigate(`/record/${currentUser.id}`, { state: { friend: selfObj } });
  };

  const handleSelectFriend = (friend) => {
    setSelectedFriend(friend);
  };

  const handleCloseProfile = () => {
    setSelectedFriend(null);
  };

  const handleAddFriend = async (e) => {
    e.preventDefault();
    const emailToSubmit = newEmail.trim().toLowerCase();
    if (!emailToSubmit) return;

    setAddStatus({ loading: true, error: '', success: '' });
    try {
      const res = await fetch('/api/friends.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailToSubmit }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add contact');
      }

      setAddStatus({ loading: false, error: '', success: data.message || 'Contact added successfully!' });
      setNewEmail('');
      await loadData();
      setTimeout(() => {
        setAddStatus({ loading: false, error: '', success: '' });
        setShowAddForm(false);
      }, 1500);
    } catch (err) {
      setAddStatus({ loading: false, error: err.message || 'Error adding contact', success: '' });
    }
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
      {/* Header */}
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Send a prompt to spark a story, or practice by recording to yourself.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddForm(!showAddForm)}
          className="mt-3 inline-flex items-center gap-1.5 self-start rounded-full bg-teal/10 px-4 py-2 text-xs font-semibold text-teal hover:bg-teal/20 dark:bg-teal-900/30 dark:text-teal-300 dark:hover:bg-teal-900/50 sm:mt-0 transition-colors"
        >
          <span>{showAddForm ? '✕ Close' : '+ Add Contact'}</span>
        </button>
      </div>

      {/* Add Contact Form (Collapsible) */}
      {showAddForm && (
        <form onSubmit={handleAddFriend} className="bubble-card mb-6 p-5 transition-all">
          <h3 className="mb-2 text-sm font-bold text-gray-900 dark:text-white">Add Contact by Email</h3>
          <p className="mb-4 text-xs text-gray-500 dark:text-gray-400">
            Enter their email address. They don&apos;t need an account yet—we&apos;ll notify them when you send a prompt!
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="friend@example.com"
              required
              className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-teal focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-white"
            />
            <button
              type="submit"
              disabled={addStatus.loading}
              className="rounded-xl bg-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal/90 disabled:opacity-50 transition"
            >
              {addStatus.loading ? 'Adding…' : 'Add Contact'}
            </button>
          </div>
          {addStatus.error && (
            <p className="mt-2 text-xs text-red-600 dark:text-red-400">{addStatus.error}</p>
          )}
          {addStatus.success && (
            <p className="mt-2 text-xs text-green-600 dark:text-green-400">{addStatus.success}</p>
          )}
        </form>
      )}

      {/* Self / Practice Card */}
      {currentUser && (
        <div className="mb-8">
          <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-teal dark:text-teal-400">
            Practice &amp; Notes
          </p>
          <div className="bubble-card border-2 border-teal/30 bg-teal/5 dark:bg-teal-950/20 flex flex-col sm:flex-row items-center justify-between p-5 gap-4">
            <div className="flex items-center gap-4 text-left w-full sm:w-auto">
              <div className="relative">
                <FriendAvatar friend={currentUser} size="w-14 h-14" />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-teal text-[10px] text-white shadow">
                  ★
                </span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-gray-900 dark:text-white">
                    {currentUser.username || currentUser.email}
                  </span>
                  <span className="rounded-full bg-teal/20 px-2 py-0.5 text-[11px] font-semibold text-teal dark:text-teal-300">
                    You (Self)
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{currentUser.email}</span>
                <span className="text-xs text-teal/80 dark:text-teal-300/80 mt-0.5">
                  Record prompts to yourself for testing or personal video journaling
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSendSelfPrompt}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gradient-to-r from-teal to-coral px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:scale-105 active:scale-95 transition-transform"
              title="Record prompt to yourself"
            >
              <img src={promptLogo} alt="" className="h-5 w-5 drop-shadow" />
              <span>Prompt Myself</span>
            </button>
          </div>
        </div>
      )}

      {/* Circle / Friends List */}
      <div>
        <p className="mb-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          Family &amp; Circle
        </p>

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
            <p className="mb-3 text-sm">No other contacts added to your circle yet.</p>
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="rounded-full bg-teal px-4 py-2 text-xs font-semibold text-white hover:bg-teal/90 transition"
            >
              + Add Your First Contact
            </button>
          </div>
        )}
      </div>

      {/* Selected Friend Profile Modal */}
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