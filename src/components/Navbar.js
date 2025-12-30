import React from 'react';
import { Heart, Search, MessageCircle, User, LogOut } from 'lucide-react';

const Navbar = ({ user, currentPage, onNavigate, onLogout, selectedProfile }) => {
  const navItems = [
    { id: 'search', label: 'Discover', icon: Search },
    { id: 'likes', label: 'Likes', icon: Heart },
    { id: 'chat', label: 'Messages', icon: MessageCircle },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">BLovely</span>
          </div>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'profile') {
                      // Always reset to own profile when clicking profile in navbar
                      onNavigate(item.id);
                      if (selectedProfile) {
                        // This will be handled in App.js
                        onNavigate(item.id);
                      }
                    } else if (item.id === 'chat' && currentPage === 'chat') {
                      // If already in chat, go back to conversation list
                      onNavigate('search'); // This will trigger Chat component to show conversation list
                      setTimeout(() => onNavigate('chat'), 0); // Then navigate back to chat
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'bg-primary-100 text-primary-600'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                {user?.profile.photos && user.profile.photos.length > 0 ? (
                  <img
                    src={user.profile.photos[0]}
                    alt={user.profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-gray-400" />
                )}
              </div>
              <span className="text-sm font-medium text-gray-700">{user?.profile.name}</span>
            </div>
            <button
              onClick={onLogout}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden border-t border-gray-200">
          <div className="flex justify-around py-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    if (item.id === 'profile') {
                      // Always reset to own profile when clicking profile in navbar
                      onNavigate(item.id);
                    } else if (item.id === 'chat' && currentPage === 'chat') {
                      // If already in chat, go back to conversation list
                      onNavigate('search'); // This will trigger Chat component to show conversation list
                      setTimeout(() => onNavigate('chat'), 0); // Then navigate back to chat
                    } else {
                      onNavigate(item.id);
                    }
                  }}
                  className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${
                    currentPage === item.id
                      ? 'text-primary-600'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
