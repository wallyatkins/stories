import React, { useState } from 'react';

export default function Profile({ user, onUpdated, onClose }) {
  const [username, setUsername] = useState(user.username || '');
  const [avatar, setAvatar] = useState(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData();
    formData.append('username', username);
    if (avatar) formData.append('avatar', avatar);
    const res = await fetch('api/update_profile', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setSaving(false);
    onUpdated(data.user);
    onClose();
  }

  return (
    <div className="border p-4 rounded mb-4">
      <h2 className="text-xl mb-2">Profile</h2>
      <form onSubmit={handleSubmit} className="space-y-2">
        <div>
          <label className="block mb-1">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border px-2 py-1 w-full"
          />
        </div>
        <div>
          <label className="block mb-1">Avatar</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setAvatar(e.target.files[0])}
          />
        </div>
        <div className="space-x-2">
          <button
            type="submit"
            className="bg-blue-500 text-white px-4 py-1 rounded"
            disabled={saving}
          >
            Save
          </button>
          <button type="button" onClick={onClose} className="px-4 py-1 border rounded">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

