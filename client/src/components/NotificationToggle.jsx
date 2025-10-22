import React, { useEffect, useState } from 'react';
import {
  subscribeToPush,
  unsubscribeFromPush,
  getExistingSubscription,
  isPushSupported,
} from '../utils/pushNotifications';

export default function NotificationToggle() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function init() {
      try {
        const pushSupported = await isPushSupported();
        if (!active) return;
        setSupported(pushSupported);
        if (!pushSupported) {
          setEnabled(false);
          setLoading(false);
          return;
        }
        const subscription = await getExistingSubscription();
        if (!active) return;
        setEnabled(!!subscription);
      } catch (err) {
        if (!active) return;
        console.warn('Failed to inspect push subscription', err);
        setSupported(false);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    init();
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = async () => {
    if (loading) return;
    setError('');
    try {
      if (!enabled) {
        setLoading(true);
        await subscribeToPush();
        setEnabled(true);
      } else {
        setLoading(true);
        await unsubscribeFromPush();
        setEnabled(false);
      }
    } catch (err) {
      console.error('Notification toggle failed', err);
      setError(err.message || 'Unable to update notifications');
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <div className="px-4 py-2 text-xs text-gray-400">
        Notifications unavailable in this browser.
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={handleToggle}
        disabled={loading}
        className={`flex w-full items-center justify-between px-4 py-2 text-sm transition ${
          enabled
            ? 'text-teal hover:bg-teal/10'
            : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span>{enabled ? 'Disable notifications' : 'Enable notifications'}</span>
        <span
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            enabled ? 'bg-teal' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
              enabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </span>
      </button>
      {error && <span className="px-4 text-xs text-red-500">{error}</span>}
    </div>
  );
}
