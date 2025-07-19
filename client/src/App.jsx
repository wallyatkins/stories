import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Logout from './pages/Logout';
import ProfilePage from './pages/ProfilePage';
import RecordPrompt from './pages/RecordPrompt';
import RecordResponse from './pages/RecordResponse';
import Nav from './components/Nav';
import Contacts from './pages/Contacts';
import Prompts from './pages/Prompts';
import ViewPrompt from './pages/ViewPrompt';
import Stories from './pages/Stories';
import VideoPlayerPage from './pages/VideoPlayerPage';

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
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/prompts" element={<Prompts />} />
        <Route path="/prompt/:promptId" element={<ViewPrompt />} />
        <Route path="/stories" element={<Stories />} />
        <Route path="/record/:friendId" element={<RecordPrompt />} />
        <Route path="/record-response/:promptId" element={<RecordResponse />} />
        <Route path="/watch/:filename" element={<VideoPlayerPage />} />
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
