import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="container mx-auto p-4 text-center">
      <h1 className="text-3xl font-bold mb-4">Video Stories</h1>
      <p className="mb-6">Record and share video prompts with friends and respond with your own stories.</p>
      <Link
        to="/login"
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Log In
      </Link>
    </div>
  );
}
