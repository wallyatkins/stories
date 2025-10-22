import React, { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('trust_device', trustDevice ? '1' : '0');
    const res = await fetch('/api/request_login', {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    if (res.ok) {
      setSent(true);
      setError('');
    } else {
      setError(data.error || 'Request failed');
    }
    setLoading(false);
  }

  if (sent) {
    return <p>Check your email for a login link.</p>;
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-3">
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-full border border-white/50 bg-white/80 px-4 py-2 shadow-inner transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40 sm:w-64"
            placeholder="Email"
            disabled={loading}
          />
          <button
            className="btn-prompt w-full sm:w-auto disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
        </div>
        <label className="flex items-center justify-center gap-2 text-xs font-medium uppercase tracking-[0.25em] text-gray-600">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            disabled={loading}
          />
          <span>Trust this device for 30 days</span>
        </label>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
