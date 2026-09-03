import React, { useState, useEffect } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);

  // Check URL params for error messages from OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get('error');
    if (errParam) {
      setError(errParam);
    }
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('email', email);
    formData.append('trust_device', trustDevice ? '1' : '0');
    try {
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
    } catch (err) {
      setError('Unable to send login link. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-teal/30 bg-teal/10 p-6 text-center shadow-md">
        <p className="font-semibold text-nav-bg">Check your email</p>
        <p className="mt-1 text-sm text-gray-600">We sent a one-time sign-in link to <b>{email}</b>.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      {/* WallyAuth Primary SSO Button */}
      <div className="mb-6">
        <a
          href="/api/oauth_login.php"
          className="flex w-full items-center justify-center gap-3 rounded-full bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-lg transition duration-200 hover:scale-[1.02] hover:shadow-indigo-500/20 active:scale-[0.98]"
        >
          <svg className="h-5 w-5 fill-indigo-400" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <span>Sign in with WallyAuth</span>
        </a>
      </div>

      <div className="relative my-5 flex items-center justify-center">
        <div className="w-full border-t border-gray-300"></div>
        <span className="absolute bg-white/80 px-3 text-xs font-semibold uppercase tracking-wider text-gray-500">
          or use email link
        </span>
      </div>

      {/* Email Link Secondary Form */}
      <form onSubmit={handleSubmit} className="flex flex-col items-center space-y-3">
        <div className="flex w-full flex-col items-center gap-3 sm:flex-row">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-full border border-white/50 bg-white/80 px-4 py-2.5 shadow-inner transition focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/40 sm:flex-1"
            placeholder="Enter your email"
            disabled={loading}
          />
          <button
            className="btn-prompt w-full sm:w-auto disabled:opacity-60"
            type="submit"
            disabled={loading}
          >
            {loading ? 'Sending...' : 'Send Link'}
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
      {error && (
        <div className="mt-4 rounded-lg bg-red-50 border border-red-200 p-3 text-center text-sm font-medium text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
