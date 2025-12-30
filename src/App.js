import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import Profile from './components/Profile';
import SearchPage from './components/Search';
import Chat from './components/Chat';
import Likes from './components/Likes';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('search');
  const [chatUser, setChatUser] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
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
      const response = await fetch('http://localhost:5000/api/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      
      // Decode token to get user ID
      const tokenPayload = JSON.parse(atob(token.split('.')[1]));
      
      // Create user object with profile data
      const userData = {
        id: tokenPayload.userId,
        _id: tokenPayload.userId,
        email: data.profile.email || 'google-user@gmail.com',
        googleId: data.profile.googleId,
        profile: data.profile
      };
      
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handleAuth = (userData) => {
    setUser(userData);
    setCurrentPage('search');
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
