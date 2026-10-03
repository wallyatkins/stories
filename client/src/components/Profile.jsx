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

  useEffect(() => () => {
    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }
  }, [avatarPreview]);

  const resetFileInput = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleFileSelect = useCallback(
    (event) => {
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
    },
    [resetFileInput]
  );

  const handleCropCancel = useCallback(() => {
    setCropSource(null);
    resetFileInput();
  }, [resetFileInput]);

  const handleCropComplete = useCallback(
    (blob) => {
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
    },
    [resetFileInput]
  );

  const handleSubmit = useCallback(
    async (event) => {
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
    },
    [avatar, onUpdated, username]
  );

  return (
    <div className="bubble-card p-6 md:p-8">
      <h2 className="text-2xl font-bold font-display text-slate-900 dark:text-white">Your Profile</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
        Update your display name and family avatar portrait.
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex items-center space-x-5">
          <div className="h-24 w-24 overflow-hidden rounded-full bg-slate-100 dark:bg-zinc-800 ring-4 ring-coral/20 shrink-0 shadow-inner">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
            ) : user.avatar ? (
              <AvatarImage filename={user.avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-xs text-slate-400 dark:text-slate-500 font-medium">
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
              <span className="inline-flex cursor-pointer items-center rounded-full border border-slate-300 dark:border-white/10 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 transition-colors shadow-sm">
                Change avatar
              </span>
            </label>
            {avatarPreview && (
              <div>
                <button
                  type="button"
                  className="text-xs text-rose-500 hover:text-rose-600 transition-colors underline"
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
              </div>
            )}
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-white/70 dark:bg-zinc-900/60 px-4 py-3 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-coral/50 transition-all shadow-sm"
            placeholder="Your name"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-3.5 py-2 text-xs text-rose-600 dark:text-rose-400">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            className="btn-coral px-6 py-2.5 rounded-full font-bold shadow-md hover:shadow-coral/20 disabled:opacity-60 transition-all"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {typeof onClose === 'function' && (
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full border border-slate-200 dark:border-zinc-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-zinc-800 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          )}
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
