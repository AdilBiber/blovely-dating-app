import React, { useState, useEffect, useRef } from 'react';
import { Heart, X, MessageCircle, RotateCcw } from 'lucide-react';
import axios from 'axios';

// API Configuration
// Production: https://blovely-backend.onrender.com
// Local: http://localhost:5000
const API_BASE_URL = 'https://blovely-backend.onrender.com';

const Likes = ({ user, onNavigate }) => {
  const [potentialMatches, setPotentialMatches] = useState([]);
  const [matches, setMatches] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showMatchNotification, setShowMatchNotification] = useState(false);
  const [currentMatchUser, setCurrentMatchUser] = useState(null);

  useEffect(() => {
    fetchPotentialMatches();
    fetchMatches();
  }, []);

  const fetchPotentialMatches = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters from user's search preferences
      const queryParams = new URLSearchParams();
      const prefs = user?.profile?.searchPreferences;
      
      if (prefs) {
        // Age range
        if (prefs.ageMin) queryParams.append('ageMin', prefs.ageMin);
        if (prefs.ageMax) queryParams.append('ageMax', prefs.ageMax);
        
        // Physical preferences
        if (prefs.heightMin) queryParams.append('heightMin', prefs.heightMin);
        if (prefs.heightMax) queryParams.append('heightMax', prefs.heightMax);
        if (prefs.weightMin) queryParams.append('weightMin', prefs.weightMin);
        if (prefs.weightMax) queryParams.append('weightMax', prefs.weightMax);
        if (prefs.bodyType && prefs.bodyType !== 'all') queryParams.append('bodyType', prefs.bodyType);
        
        // Personal preferences
        if (prefs.ethnicity) queryParams.append('ethnicity', prefs.ethnicity);
        if (prefs.religion) queryParams.append('religion', prefs.religion);
        if (prefs.maritalStatus && prefs.maritalStatus !== 'all') queryParams.append('maritalStatus', prefs.maritalStatus);
        if (prefs.hasChildren && prefs.hasChildren !== 'all') queryParams.append('hasChildren', prefs.hasChildren === 'true');
        if (prefs.smoking && prefs.smoking !== 'all') queryParams.append('smoking', prefs.smoking);
        if (prefs.drinking && prefs.drinking !== 'all') queryParams.append('drinking', prefs.drinking);
        
        // Location preferences
        if (prefs.country) queryParams.append('country', prefs.country);
        if (prefs.city) queryParams.append('city', prefs.city);
        
        // Search options
        if (prefs.withPhotosOnly) queryParams.append('withPhotosOnly', 'true');
        if (prefs.onlineOnly) queryParams.append('onlineOnly', 'true');
      }
      
      // If no preferences are set, add default parameters to get some results
      if (queryParams.toString() === '') {
        // Default: show users with photos only to ensure good experience
        queryParams.append('withPhotosOnly', 'true');
      }
      
      const response = await axios.get(`${API_BASE_URL}/api/potential-matches`, {params: queryParams}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPotentialMatches(response.data);
    } catch (error) {
      console.error('Error fetching potential matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMatches = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/matches`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMatches(response.data);
    } catch (error) {
      console.error('Error fetching matches:', error);
    }
  };

  const handleLike = async () => {
    if (currentIndex >= potentialMatches.length) return;
    
    const currentUser = potentialMatches[currentIndex];
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/api/like/${currentUser._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.isMatch) {
        setCurrentMatchUser(currentUser);
        setShowMatchNotification(true);
        setTimeout(() => setShowMatchNotification(false), 3000);
        fetchMatches(); // Refresh matches list
      }

      nextProfile();
    } catch (error) {
      console.error('Error liking user:', error);
    }
  };

  const handlePass = async () => {
    if (currentIndex >= potentialMatches.length) return;
    
    const currentUser = potentialMatches[currentIndex];
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/api/pass/${currentUser._id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      nextProfile();
    } catch (error) {
      console.error('Error passing user:', error);
    }
  };

  const nextProfile = () => {
    setCurrentIndex(prev => prev + 1);
  };

  const handleSwipe = useCallback((direction) => {
    if (direction === 'right') {
      handleLike();
    } else if (direction === 'left') {
      handlePass();
    }
  }, [currentIndex]);

  const handleTouchStart = (e) => {
    const touchStart = e.targetTouches[0].clientX;
    const touchEnd = (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStart - touchEndX;
      
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          handleSwipe('left');
        } else {
          handleSwipe('right');
        }
      }
    };
    
    e.target.addEventListener('touchend', touchEnd, { once: true });
  };

  const currentProfile = potentialMatches[currentIndex];

  if (loading) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-4 text-gray-600">Loading profiles...</p>
        </div>
      </div>
    );
  }

  if (currentIndex >= potentialMatches.length) {
    return (
      <div className="max-w-md mx-auto p-6">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">No more profiles</h2>
          <p className="text-gray-600 mb-6">Check back later for more potential matches!</p>
          <button
            onClick={fetchPotentialMatches}
            className="bg-primary-500 text-white px-6 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Matches Section - Always show when there are matches */}
        {matches.length > 0 && (
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Your Matches 💕</h3>
            <div className="grid grid-cols-3 gap-2">
              {matches.map((match) => (
                <div
                  key={match._id}
                  onClick={() => onNavigate('profile', match)}
                  className="relative group cursor-pointer"
                >
                  <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    {match.profile.photos?.length > 0 ? (
                      <img
                        src={match.profile.photos[0]}
                        alt={match.profile.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-12 h-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 rounded-b-lg">
                    <p className="text-white text-xs font-semibold truncate">
                      {match.profile.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6">
      {/* Match Notification */}
      {showMatchNotification && currentMatchUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 text-center animate-bounce">
            <h2 className="text-3xl font-bold text-green-500 mb-4">It's a Match! 💕</h2>
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4 overflow-hidden">
              {currentMatchUser.profile.photos?.length > 0 ? (
                <img
                  src={currentMatchUser.profile.photos[0]}
                  alt={currentMatchUser.profile.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-full h-full text-gray-400 p-6" />
              )}
            </div>
            <p className="text-lg font-semibold text-gray-900 mb-2">
              You and {currentMatchUser.profile.name} liked each other!
            </p>
            <p className="text-gray-600 mb-6">Start a conversation now</p>
            <button
              onClick={() => {
                setShowMatchNotification(false);
                onNavigate('chat', currentMatchUser);
              }}
              className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 transition-colors mr-2"
            >
              <MessageCircle className="w-5 h-5 inline mr-2" />
              Message
            </button>
            <button
              onClick={() => setShowMatchNotification(false)}
              className="bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Keep Swiping
            </button>
          </div>
        </div>
      )}

      {/* Profile Card */}
      <div className="relative">
        <div
          className="bg-white rounded-2xl shadow-lg overflow-hidden"
          onTouchStart={handleTouchStart}
        >
          {/* Image */}
          <div className="h-96 bg-gray-200 relative">
            {currentProfile.profile.photos?.length > 0 ? (
              <img
                src={currentProfile.profile.photos[0]}
                alt={currentProfile.profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-24 h-24 text-gray-400" />
              </div>
            )}
            
            {/* Profile Info Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-6">
              <h3 className="text-2xl font-bold text-white mb-1">
                {currentProfile.profile.name}, {currentProfile.profile.age}
              </h3>
              <p className="text-white text-opacity-90">
                {currentProfile.profile.location}
              </p>
            </div>
          </div>

          {/* Bio */}
          <div className="p-6">
            <p className="text-gray-700 mb-4">
              {currentProfile.profile.bio || 'No bio available'}
            </p>

            {/* Quick Info */}
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold text-gray-900">Height:</span>
                <span className="text-gray-600 ml-2">
                  {currentProfile.profile.height || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Body Type:</span>
                <span className="text-gray-600 ml-2 capitalize">
                  {currentProfile.profile.bodyType || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Marital Status:</span>
                <span className="text-gray-600 ml-2 capitalize">
                  {currentProfile.profile.maritalStatus || 'Not specified'}
                </span>
              </div>
              <div>
                <span className="font-semibold text-gray-900">Children:</span>
                <span className="text-gray-600 ml-2">
                  {currentProfile.profile.hasChildren ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={handlePass}
            className="bg-white text-red-500 p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <X className="w-8 h-8" />
          </button>
          <button
            onClick={handleLike}
            className="bg-white text-green-500 p-4 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-110"
          >
            <Heart className="w-8 h-8" />
          </button>
        </div>
      </div>

      {/* Matches Section */}
      {matches.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Your Matches 💕</h3>
          <div className="grid grid-cols-3 gap-2">
            {matches.map((match) => (
              <div
                key={match._id}
                onClick={() => onNavigate('profile', match)}
                className="relative group cursor-pointer"
              >
                <div className="w-full aspect-square bg-gray-200 rounded-lg overflow-hidden">
                  {match.profile.photos?.length > 0 ? (
                    <img
                      src={match.profile.photos[0]}
                      alt={match.profile.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2 rounded-b-lg">
                  <p className="text-white text-xs font-semibold truncate">
                    {match.profile.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Likes;
