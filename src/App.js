import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Profile from './components/Profile';
import SearchPage from './components/Search';
import Chat from './components/Chat';
import Likes from './components/Likes';
import Navbar from './components/Navbar';
import SettingsPage from './components/SettingsPage';
import { API_BASE_URL } from './config';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('search');
  const [chatUser, setChatUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  const [showFirstTimeHint, setShowFirstTimeHint] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setUser(userData);
        
        // Check if user has alternative email set
        if (!userData.alternativeEmail) {
          setShowFirstTimeHint(true);
        }
      } catch (error) {
        console.error('Error parsing saved user:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    
    if (token) {
      localStorage.setItem('token', token);
      // Fetch user data with token
      fetchUserData(token);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const fetchUserData = async (token) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      console.log('API Response:', data); // DEBUG
      
      // Decode token to get user ID
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      
      // Create user object with profile data
      const userData = {
        id: tokenPayload.userId,
        _id: tokenPayload.userId,
        email: data.email || data.profile.email || 'google-user@gmail.com',
        alternativeEmail: data.alternativeEmail,
        googleId: data.profile.googleId,
        profile: data.profile
      };
      
      console.log('User Data:', userData); // DEBUG
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleUserUpdate = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Hide first time hint after user updates their profile
    if (updatedUser.alternativeEmail) {
      setShowFirstTimeHint(false);
    }
  };

  const handleAuth = (userData) => {
    setUser(userData);
    
    // Check if user has alternative email set
    if (!userData.alternativeEmail) {
      setShowFirstTimeHint(true);
      setCurrentPage('search'); // Gehe zur Startseite, nicht zu Settings
    } else {
      setCurrentPage('search');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentPage('search');
    setChatUser(null);
  };

  const handleNavigate = (page, user) => {
    if (page === 'profile') {
      if (user) {
        // Navigate to specific user's profile
        setSelectedProfile(user);
      } else {
        // Navigate to own profile
        setSelectedProfile(null);
      }
      // Scroll to top when opening profile
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setCurrentPage(page);
    if (page !== 'chat') {
      setChatUser(null);
    }
    if (page === 'chat' && user) {
      setChatUser(user);
    }
  };

  const handleChatOpen = (user) => {
    setChatUser(user);
    setCurrentPage('chat');
  };

  const handleProfileOpen = (profileUser) => {
    setSelectedProfile(profileUser);
    setCurrentPage('profile');
  };

  if (!user) {
    return <Auth onAuth={handleAuth} />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'profile':
        return <Profile user={user} setUser={setUser} selectedProfile={selectedProfile} onChatOpen={handleChatOpen} />;
      case 'chat':
        return (
          <Chat
            user={user}
            onBack={() => handleNavigate('search')}
            initialChatUser={chatUser}
          />
        );
      case 'likes':
        return <Likes user={user} onNavigate={handleNavigate} />;
      case 'settings':
        return <SettingsPage user={user} onUserUpdate={handleUserUpdate} onLogout={handleLogout} showFirstTimeHint={showFirstTimeHint} />;
      case 'search':
      default:
        return currentPage === 'search' && <SearchPage user={user} onChatOpen={handleChatOpen} onProfileOpen={handleProfileOpen} selectedProfile={selectedProfile} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar
        user={user}
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        selectedProfile={selectedProfile}
      />
      <main className="py-6">
        {renderCurrentPage()}
      </main>
    </div>
  );
}

export default App;
