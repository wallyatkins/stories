import React, { useState } from 'react';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const formData = new FormData();
    formData.append('email', email);
    await fetch('api/request_login.php', {
      method: 'POST',
      body: formData,
    });
    setSent(true);
  }

  if (sent) {
    return <p>Check your email for a login link.</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="space-x-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        className="border px-2 py-1"
        placeholder="Email"
      />
      <button className="bg-blue-500 text-white px-4 py-1 rounded" type="submit">
        Send Login Link
      </button>
    </form>
  );
}
