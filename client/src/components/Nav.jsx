import React from 'react';
import { Link } from 'react-router-dom';

export default function Nav() {
  return (
    <nav className="bg-white shadow mb-4">
      <div className="container mx-auto px-4 py-2 flex space-x-4">
        <Link to="/" className="font-bold">Video Stories</Link>
        <Link to="/prompts">Prompts</Link>
        <Link to="/stories">Stories</Link>
        <Link to="/profile">Profile</Link>
        <Link to="/logout" className="ml-auto">Logout</Link>
      </div>
    </nav>
  );
}
