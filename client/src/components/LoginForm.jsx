import React, { useState, useEffect } from 'react';

export default function LoginForm() {
  const [error, setError] = useState('');
  const [returnTo, setReturnTo] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errParam = params.get('error');
    if (errParam) {
      setError(errParam);
    }
    const returnParam = params.get('return_to');
    if (returnParam) {
      setReturnTo(returnParam);
    }
  }, []);

  const loginUrl = returnTo
    ? `/api/oauth_login.php?return_to=${encodeURIComponent(returnTo)}`
    : '/api/oauth_login.php';

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Primary WallyAuth SSO Card */}
      <div className="space-y-4">
        <a
          href={loginUrl}
          className="group flex w-full items-center justify-center gap-3 rounded-full border border-indigo-500/30 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 px-6 py-3.5 text-sm font-semibold text-white shadow-xl transition-all duration-200 hover:scale-[1.02] hover:border-indigo-400 hover:shadow-indigo-500/25 active:scale-[0.98] dark:border-indigo-400/30 dark:from-[#13141f] dark:via-[#1e1c38] dark:to-[#13141f]"
        >
          <svg className="h-5 w-5 fill-indigo-400 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
            <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
          </svg>
          <span className="tracking-wide">Sign in with WallyAuth</span>
        </a>

        <div className="flex items-center justify-center gap-1.5 text-center text-xs text-slate-500 dark:text-zinc-400">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          <span>Secured by WallyAuth OIDC Single Sign-On</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/30 p-3.5 text-center text-xs font-medium text-rose-700 dark:text-rose-300">
          <p className="font-semibold mb-0.5">Authentication Error</p>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
}
