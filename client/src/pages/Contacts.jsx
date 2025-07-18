import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Contacts() {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFriends() {
      try {
        const res = await fetch('/api/list_friends');
        const data = await res.json();
        setFriends(data);
      } catch (error) {
        console.error('Failed to fetch friends:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchFriends();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Contacts</h1>
      {friends.length > 0 ? (
        <ul className="space-y-2">
          {friends.map((friend) => (
            <li
              key={friend.id}
              className="p-4 border rounded-lg flex justify-between items-center"
            >
              <span>{friend.username || friend.email}</span>
              <Link
                to={`/record/${friend.id}`}
                className="bg-coral text-white px-4 py-2 rounded hover:bg-opacity-80"
              >
                Send Prompt
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p>You currently have no contacts.</p>
      )}
    </div>
  );
}
