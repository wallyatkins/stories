import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Logout from './pages/Logout';
import Prompts from './pages/Prompts';
import Stories from './pages/Stories';
import ProfilePage from './pages/ProfilePage';
import Nav from './components/Nav';

function AppRoutes() {
  const location = useLocation();
  const showNav = location.pathname !== '/';
  return (
    <>
      {showNav && <Nav />}
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
