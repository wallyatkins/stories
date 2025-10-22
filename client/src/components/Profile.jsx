import React, { useCallback, useEffect, useRef, useState } from 'react';
import AvatarImage from './AvatarImage';
import AvatarCropDialog from './AvatarCropDialog';

export default function Profile({ user, onUpdated, onClose }) {
  const [username, setUsername] = useState(user.username || '');
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [cropSource, setCropSource] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileSelect = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      resetFileInput();
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      resetFileInput();
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCropSource(reader.result);
      setError(null);
    };
    reader.onerror = () => {
      setError('Unable to read that image. Please try another.');
      resetFileInput();
    };
    reader.readAsDataURL(file);
  }, [resetFileInput]);

  const handleCropCancel = useCallback(() => {
    setCropSource(null);
    resetFileInput();
  }, [resetFileInput]);

  const handleCropComplete = useCallback((blob) => {
    const filename = `avatar-${Date.now()}.png`;
    const croppedFile = new File([blob], filename, { type: blob.type || 'image/png' });
    setAvatar(croppedFile);
    setCropSource(null);
    resetFileInput();
    setError(null);
    setAvatarPreview((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(blob);
    });
  }, [resetFileInput]);

  const handleSubmit = useCallback(async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('username', username);
      if (avatar) {
        formData.append('avatar', avatar);
      }
      const res = await fetch('/api/update_profile.php', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        const message = await res.text();
        console.error('Failed to update profile:', message);
        setError('Could not save your profile. Please try again.');
        return;
      }
      const data = await res.json();
      onUpdated(data.user);
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError('Something went wrong while saving.');
    } finally {
      setSaving(false);
    }
  }, [avatar, onUpdated, username]);

  return (
    <div className="bubble-card bubble-accent mb-4">
      <div className="bubble-content">
        <h2 className="text-xl font-semibold text-nav-bg">Profile</h2>
        <p className="text-sm text-gray-600">Refresh your name and avatar so your friends recognize your prompts instantly.</p>
      </div>
      <form onSubmit={handleSubmit} className="bubble-content mt-6 space-y-6">
        <div className="flex flex-col items-start gap-4 md:flex-row md:items-center">
          <div className="relative h-24 w-24 overflow-hidden rounded-full border border-white/60 bg-gradient-to-br from-coral/20 via-white to-teal/20 shadow-inner">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : user.avatar ? (
              <AvatarImage filename={user.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-gray-500">
                No avatar
              </div>
            )}
          </div>
          <div className="space-y-2">
            <label className="inline-block">
              <span className="sr-only">Choose avatar</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <span className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-coral/40 bg-white/80 px-4 py-2 text-sm font-semibold text-coral shadow-md transition hover:-translate-y-0.5 hover:border-coral hover:bg-coral/10">
                Change avatar
              </span>
            </label>
            {avatarPreview && (
              <button
                type="button"
                className="text-sm font-medium text-gray-500 underline"
                onClick={() => {
                  setAvatar(null);
                  setAvatarPreview((prev) => {
                    if (prev) {
                      URL.revokeObjectURL(prev);
                    }
                    return null;
                  });
                }}
              >
                Remove selection
              </button>
            )}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-inner focus:border-teal focus:ring-2 focus:ring-teal/40"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="btn-prompt disabled:opacity-60 disabled:saturate-75"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          <button type="button" onClick={onClose} className="btn-secondary">
            Cancel
          </button>
        </div>
      </form>
      {cropSource && (
        <AvatarCropDialog
          imageSrc={cropSource}
          onCancel={handleCropCancel}
          onComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
