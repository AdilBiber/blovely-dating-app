import React, { useState, useEffect, useCallback } from 'react';
import { Search, User, MapPin, Filter, Heart, MessageCircle } from 'lucide-react';
import axios from 'axios';
import DropdownSelect from './DropdownSelect';
import { ETHNICITIES, RELIGIONS, COUNTRIES, MAJOR_CITIES } from './constants';
import { API_BASE_URL } from '../config';

const SearchPage = ({ user, onChatOpen, onProfileOpen, selectedProfile }) => {
  const [users, setUsers] = useState([]);
  const [filters, setFilters] = useState({
    ageMin: user?.profile?.searchPreferences?.ageMin || '',
    ageMax: user?.profile?.searchPreferences?.ageMax || '',
    gender: user?.profile?.interestedIn || 'all',
    country: user?.profile?.searchPreferences?.country || '',
    city: user?.profile?.searchPreferences?.city || '',
    
    // Körperliche Merkmale
    heightMin: user?.profile?.searchPreferences?.heightMin || '',
    heightMax: user?.profile?.searchPreferences?.heightMax || '',
    weightMin: user?.profile?.searchPreferences?.weightMin || '',
    weightMax: user?.profile?.searchPreferences?.weightMax || '',
    bodyType: user?.profile?.searchPreferences?.bodyType || 'all',
    
    // Persönliche Merkmale
    ethnicity: user?.profile?.searchPreferences?.ethnicity || '',
    religion: user?.profile?.searchPreferences?.religion || '',
    maritalStatus: user?.profile?.searchPreferences?.maritalStatus || 'all',
    hasChildren: user?.profile?.searchPreferences?.hasChildren || 'all',
    smoking: user?.profile?.searchPreferences?.smoking || 'all',
    drinking: user?.profile?.searchPreferences?.drinking || 'all',
    
    // Optionen
    withPhotosOnly: user?.profile?.searchPreferences?.withPhotosOnly || false,
    onlineOnly: user?.profile?.searchPreferences?.onlineOnly || false
  });
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    searchUsers();
  }, []);

  useEffect(() => {
    if (user?.profile?.interestedIn) {
      setFilters(prev => ({ ...prev, gender: user.profile.interestedIn }));
    }
  }, [user?.profile?.interestedIn]);

  useEffect(() => {
    // Update filters when user profile search preferences change
    if (user?.profile?.searchPreferences) {
      setFilters(prev => ({
        ...prev,
        ageMin: user.profile.searchPreferences.ageMin || '',
        ageMax: user.profile.searchPreferences.ageMax || '',
        country: user.profile.searchPreferences.country || '',
        city: user.profile.searchPreferences.city || '',
        heightMin: user.profile.searchPreferences.heightMin || '',
        heightMax: user.profile.searchPreferences.heightMax || '',
        weightMin: user.profile.searchPreferences.weightMin || '',
        weightMax: user.profile.searchPreferences.weightMax || '',
        bodyType: user.profile.searchPreferences.bodyType || 'all',
        ethnicity: user.profile.searchPreferences.ethnicity || '',
        religion: user.profile.searchPreferences.religion || '',
        maritalStatus: user.profile.searchPreferences.maritalStatus || 'all',
        hasChildren: user.profile.searchPreferences.hasChildren || 'all',
        smoking: user.profile.searchPreferences.smoking || 'all',
        drinking: user.profile.searchPreferences.drinking || 'all',
        withPhotosOnly: user.profile.searchPreferences.withPhotosOnly || false,
        onlineOnly: user.profile.searchPreferences.onlineOnly || false
      }));
    }
  }, [user?.profile?.searchPreferences]);

  const searchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      // Basis-Filter
      if (filters.ageMin) queryParams.append('ageMin', filters.ageMin);
      if (filters.ageMax) queryParams.append('ageMax', filters.ageMax);
      if (filters.gender !== 'all') queryParams.append('gender', filters.gender);
      if (filters.country) queryParams.append('country', filters.country);
      if (filters.city) queryParams.append('city', filters.city);
      
      // Körperliche Merkmale
      if (filters.heightMin) queryParams.append('heightMin', filters.heightMin);
      if (filters.heightMax) queryParams.append('heightMax', filters.heightMax);
      if (filters.weightMin) queryParams.append('weightMin', filters.weightMin);
      if (filters.weightMax) queryParams.append('weightMax', filters.weightMax);
      if (filters.bodyType !== 'all') queryParams.append('bodyType', filters.bodyType);
      
      // Persönliche Merkmale
      if (filters.ethnicity) queryParams.append('ethnicity', filters.ethnicity);
      if (filters.religion) queryParams.append('religion', filters.religion);
      if (filters.maritalStatus !== 'all') queryParams.append('maritalStatus', filters.maritalStatus);
      if (filters.hasChildren !== 'all') queryParams.append('hasChildren', filters.hasChildren);
      if (filters.smoking !== 'all') queryParams.append('smoking', filters.smoking);
      if (filters.drinking !== 'all') queryParams.append('drinking', filters.drinking);
      
      // Optionen
      if (filters.withPhotosOnly) queryParams.append('withPhotosOnly', 'true');
      if (filters.onlineOnly) queryParams.append('onlineOnly', 'true');
      
      const response = await axios.get(`${API_BASE_URL}/api/search?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error searching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSearch = () => {
    searchUsers();
  };

  const handleMessage = (otherUser) => {
    if (onChatOpen) {
      onChatOpen(otherUser);
    }
  };

  const handleProfileOpen = (user) => {
    // Scroll to top immediately when opening profile
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onProfileOpen) {
      onProfileOpen(user);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6" id="search-container">
      <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Discover</h2>
            {user?.profile?.searchPreferences && (
              <p className="text-sm text-gray-600 mt-1">
                Using your search preferences as defaults
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {selectedProfile && (
              <button
                onClick={() => onProfileOpen(null)}
                className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Back to Profile
              </button>
            )}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                <input
                  type="number"
                  name="ageMin"
                  value={filters.ageMin}
                  onChange={handleFilterChange}
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="18"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                <input
                  type="number"
                  name="ageMax"
                  value={filters.ageMax}
                  onChange={handleFilterChange}
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="gender"
                  value={filters.gender}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Standort-Filter */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Location</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    name="country"
                    value={filters.country}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">All countries</option>
                    {COUNTRIES.map(country => (
                      <option key={country} value={country}>{country}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <select
                    name="city"
                    value={filters.city}
                    onChange={handleFilterChange}
                    disabled={!filters.country}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {filters.country ? 'All cities' : 'Select country first'}
                    </option>
                    {filters.country && MAJOR_CITIES[filters.country]?.map(city => (
                      <option key={city} value={city}>{city}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Körperliche Merkmale */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Physical Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Height (cm)</label>
                  <input
                    type="number"
                    name="heightMin"
                    value={filters.heightMin}
                    onChange={handleFilterChange}
                    min="140"
                    max="220"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="160"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Height (cm)</label>
                  <input
                    type="number"
                    name="heightMax"
                    value={filters.heightMax}
                    onChange={handleFilterChange}
                    min="140"
                    max="220"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="190"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Min Weight (kg)</label>
                  <input
                    type="number"
                    name="weightMin"
                    value={filters.weightMin}
                    onChange={handleFilterChange}
                    min="40"
                    max="150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Weight (kg)</label>
                  <input
                    type="number"
                    name="weightMax"
                    value={filters.weightMax}
                    onChange={handleFilterChange}
                    min="40"
                    max="150"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                <select
                  name="bodyType"
                  value={filters.bodyType}
                  onChange={handleFilterChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All</option>
                  <option value="slim">Slim</option>
                  <option value="athletic">Athletic</option>
                  <option value="average">Average</option>
                  <option value="curvy">Curvy</option>
                  <option value="heavyset">Heavyset</option>
                </select>
              </div>
            </div>

            {/* Persönliche Merkmale */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Personal Details</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                  <DropdownSelect
                    options={ETHNICITIES}
                    value={filters.ethnicity}
                    onChange={(value) => setFilters(prev => ({ ...prev, ethnicity: value }))}
                    placeholder="Select ethnicity"
                    allowOther={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                  <DropdownSelect
                    options={RELIGIONS}
                    value={filters.religion}
                    onChange={(value) => setFilters(prev => ({ ...prev, religion: value }))}
                    placeholder="Select religion"
                    allowOther={true}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  <select
                    name="maritalStatus"
                    value={filters.maritalStatus}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="single">Single</option>
                    <option value="married">Married</option>
                    <option value="divorced">Divorced</option>
                    <option value="widowed">Widowed</option>
                    <option value="separated">Separated</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                  <select
                    name="hasChildren"
                    value={filters.hasChildren}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="true">Has children</option>
                    <option value="false">No children</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                  <select
                    name="smoking"
                    value={filters.smoking}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="never">Never</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="regularly">Regularly</option>
                    <option value="trying_to_quit">Trying to quit</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drinking</label>
                  <select
                    name="drinking"
                    value={filters.drinking}
                    onChange={handleFilterChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="all">All</option>
                    <option value="never">Never</option>
                    <option value="occasionally">Occasionally</option>
                    <option value="regularly">Regularly</option>
                    <option value="socially">Socially</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Zusätzliche Optionen */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Additional Options</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="withPhotosOnly"
                    checked={filters.withPhotosOnly}
                    onChange={handleFilterChange}
                    className="mr-2"
                  />
                  Only profiles with photos
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="onlineOnly"
                    checked={filters.onlineOnly}
                    onChange={handleFilterChange}
                    className="mr-2"
                  />
                  Only online members
                </label>
              </div>
            </div>

            <button
              onClick={handleSearch}
              className="mt-4 bg-primary-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors"
            >
              Apply Filters
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
          <p className="mt-2 text-gray-600">Searching for matches...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No matches found</h3>
          <p className="text-gray-600">Try adjusting your filters or check back later</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user) => (
            <div key={user._id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
              <div className="relative">
                <div className="h-64 bg-gray-200">
                  {user.profile.photos && user.profile.photos.length > 0 ? (
                    <img
                      src={user.profile.photos[0]}
                      alt={user.profile.name}
                      onClick={() => handleProfileOpen(user)}
                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div 
                      onClick={() => handleProfileOpen(user)}
                      className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-20 h-20 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-2xl font-bold text-gray-600">
                          {user.profile.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-medium text-gray-900">
                  {user.profile.age}
                </div>
                <div className="absolute top-4 left-4 bg-pink-100 text-pink-800 px-2 py-1 rounded-full text-xs font-medium capitalize">
                  {user.profile.maritalStatus || 'single'}
                </div>
              </div>

              <div className="p-6">
                <div className="mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">{user.profile.name}</h3>
                </div>

                <button
                  onClick={() => handleMessage(user)}
                  className="w-full bg-primary-500 text-white py-2 rounded-lg font-medium hover:bg-primary-600 transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  Message
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchPage;
