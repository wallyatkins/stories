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
    <div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="space-x-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="border px-2 py-1"
            placeholder="Email"
            disabled={loading}
          />
          <button
            className="bg-blue-500 text-white px-4 py-1 rounded"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Login Link'}
          </button>
        </div>
        <label className="flex items-center space-x-2 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            disabled={loading}
          />
          <span>Trust this device for 30 days</span>
        </label>
      </form>
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
}
