import React, { useState, useEffect } from 'react';
import { User, Edit2, Save, X, Camera, Trash2, Mail, MapPin, MessageCircle } from 'lucide-react';
import axios from 'axios';
import ImageUpload from './ImageUpload';
import DropdownSelect from './DropdownSelect';
import { EYE_COLORS, HAIR_COLORS, HAIR_STYLES, ETHNICITIES, RELIGIONS, EDUCATION_LEVELS, LANGUAGES, COUNTRIES, MAJOR_CITIES } from './constants';

// API Configuration
// Production: https://blovely-backend.onrender.com
// Local: http://localhost:5000
const API_BASE_URL = 'https://blovely-backend.onrender.com';

const Profile = ({ user, setUser, selectedProfile, onChatOpen }) => {
  const [profile, setProfile] = useState({
    name: '',
    age: '',
    gender: 'male',
    interestedIn: 'female',
    bio: '',
    interests: '',
    
    // Körperliche Merkmale
    height: '',
    weight: '',
    bodyType: 'average',
    hairColor: '',
    hairStyle: '',
    eyeColor: '',
    
    // Persönliche Merkmale
    ethnicity: '',
    religion: '',
    languages: '',
    maritalStatus: 'single',
    hasChildren: false,
    wantsChildren: false,
    smoking: 'never',
    drinking: 'occasionally',
    
    // Beruf & Bildung
    profession: '',
    education: '',
    
    // Custom values
    customEyeColor: '',
    customHairColor: '',
    customHairStyle: '',
    customEthnicity: '',
    customReligion: '',
    customEducation: '',
    customLanguages: [],
    
    // Standort
    country: '',
    city: '',
    location: '',
    
    // Suchpräferenzen (für Filter-Defaults)
    searchPreferences: {
      ageMin: '',
      ageMax: '',
      heightMin: '',
      heightMax: '',
      weightMin: '',
      weightMax: '',
      bodyType: 'all',
      ethnicity: '',
      religion: '',
      maritalStatus: 'all',
      hasChildren: 'all',
      smoking: 'all',
      drinking: 'all',
      country: '',
      city: '',
      withPhotosOnly: false,
      onlineOnly: false
    },
    
    photos: []
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if viewing own profile or someone else's
  const isOwnProfile = !selectedProfile;
  const displayUser = selectedProfile || user;

  useEffect(() => {
    if (displayUser && displayUser.profile) {
      console.log('Loading profile data:', displayUser.profile);
      console.log('Interests type:', typeof displayUser.profile.interests);
      console.log('Interests value:', displayUser.profile.interests);
      console.log('Languages type:', typeof displayUser.profile.languages);
      console.log('Languages value:', displayUser.profile.languages);
      setProfile({
        name: displayUser.profile.name || '',
        age: displayUser.profile.age || '',
        gender: displayUser.profile.gender || '',
        interestedIn: displayUser.profile.interestedIn || 'female',
        bio: displayUser.profile.bio || '',
        interests: displayUser.profile.interests || [],
        height: displayUser.profile.height || '',
        weight: displayUser.profile.weight || '',
        bodyType: displayUser.profile.bodyType || 'average',
        hairColor: displayUser.profile.hairColor || '',
        hairStyle: displayUser.profile.hairStyle || '',
        eyeColor: displayUser.profile.eyeColor || '',
        ethnicity: displayUser.profile.ethnicity || '',
        religion: displayUser.profile.religion || '',
        languages: displayUser.profile.languages || [],
        maritalStatus: displayUser.profile.maritalStatus || 'single',
        hasChildren: displayUser.profile.hasChildren || false,
        wantsChildren: displayUser.profile.wantsChildren || false,
        smoking: displayUser.profile.smoking || 'never',
        drinking: displayUser.profile.drinking || 'occasionally',
        profession: displayUser.profile.profession || '',
        education: displayUser.profile.education || '',
        country: displayUser.profile.country || '',
        city: displayUser.profile.city || '',
        location: displayUser.profile.location || '',
        searchPreferences: displayUser.profile.searchPreferences || {
          ageMin: '',
          ageMax: '',
          heightMin: '',
          heightMax: '',
          weightMin: '',
          weightMax: '',
          bodyType: 'all',
          ethnicity: '',
          religion: '',
          maritalStatus: 'all',
          hasChildren: 'all',
          smoking: 'all',
          drinking: 'all',
          country: '',
          city: '',
          withPhotosOnly: false,
          onlineOnly: false
        },
        photos: displayUser.profile.photos || []
      });
    }
  }, [displayUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested searchPreferences
    if (name.startsWith('searchPref_')) {
      const prefName = name.replace('searchPref_', '');
      setProfile(prev => ({
        ...prev,
        searchPreferences: {
          ...prev.searchPreferences,
          [prefName]: value
        }
      }));
    } else {
      setProfile(prev => ({ ...prev, [name]: value }));
    }
  };

 const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const updatedProfile = {
        ...profile,
        age: parseInt(profile.age),
        height: profile.height ? parseInt(profile.height) : undefined,
        weight: profile.weight ? parseInt(profile.weight) : undefined,
        interests: Array.isArray(profile.interests) ? profile.interests : (profile.interests ? profile.interests.split(',').map(i => i.trim()).filter(i => i) : []),
        languages: Array.isArray(profile.languages) ? profile.languages : (profile.languages ? profile.languages.split(',').map(i => i.trim()).filter(i => i) : [])
      };
      
      const response = await axios.put(`${API_BASE_URL}/api/profile`, { profile: updatedProfile }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const updatedUser = { ...user, profile: updatedProfile };
      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone and will permanently delete your profile, messages, likes, and matches.')) {
      return;
    }
    
    if (!window.confirm('This is your final warning. All your data will be permanently deleted. Are you absolutely sure?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      console.log('Attempting to delete account...');
      console.log('Token exists:', !!token);
      
      const response = await axios.delete(`${API_BASE_URL}/api/account`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Delete response:', response.data);
      
      // Clear local storage and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error deleting account:', error);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Request error:', error.message);
      }
      alert('Error deleting account. Please check the console for details and try again.');
    }
  };

  const handleCancel = () => {
    if (user) {
      setProfile({
        name: user.profile.name || '',
        age: user.profile.age || '',
        gender: user.profile.gender || 'male',
        bio: user.profile.bio || '',
        interests: user.profile.interests ? user.profile.interests.join(', ') : '',
        
        // Körperliche Merkmale
        height: user.profile.height || '',
        weight: user.profile.weight || '',
        bodyType: user.profile.bodyType || 'average',
        hairColor: user.profile.hairColor || '',
        hairStyle: user.profile.hairStyle || '',
        eyeColor: user.profile.eyeColor || '',
        
        // Persönliche Merkmale
        ethnicity: user.profile.ethnicity || '',
        religion: user.profile.religion || '',
        languages: user.profile.languages ? user.profile.languages.join(', ') : '',
        maritalStatus: user.profile.maritalStatus || 'single',
        hasChildren: user.profile.hasChildren || false,
        wantsChildren: user.profile.wantsChildren || false,
        smoking: user.profile.smoking || 'never',
        drinking: user.profile.drinking || 'occasionally',
        
        // Beruf & Bildung
        profession: user.profile.profession || '',
        education: user.profile.education || '',
        
        // Standort
        country: user.profile.country || '',
        city: user.profile.city || '',
        location: user.profile.location || '',
        photos: user.profile.photos || []
      });
    }
    setIsEditing(false);
  };

  const handleMessage = () => {
    if (selectedProfile && onChatOpen) {
      onChatOpen(selectedProfile);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-pink-500 to-red-500 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">{isOwnProfile ? 'My Profile' : `${displayUser.profile.name}'s Profile`}</h2>
            {!isEditing && isOwnProfile ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={handleDeleteAccount}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            ) : null}
            {!isEditing && !isOwnProfile ? (
              <button
                onClick={handleMessage}
                className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors flex items-center gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                Message
              </button>
            ) : null}
            {isEditing && isOwnProfile && (
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="bg-white text-primary-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Saving...' : <Save className="w-4 h-4 inline" />}
                </button>
                <button
                  onClick={handleCancel}
                  className="bg-white text-red-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
                >
                  <X className="w-4 h-4 inline" />
                </button>
              </div>
            )}
          </div>

          {/* Photo Upload Section */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
            {isEditing && isOwnProfile ? (
              <ImageUpload
                images={profile.photos || []}
                onImagesChange={(newPhotos) => setProfile(prev => ({ ...prev, photos: newPhotos }))}
                maxImages={5}
              />
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {profile.photos && profile.photos.length > 0 ? (
                  profile.photos.map((photo, index) => (
                    <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                      <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 col-span-3">No photos uploaded yet</p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start gap-6 mb-6">
            <div className="relative">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
                {profile.photos && profile.photos.length > 0 ? (
                  <img src={profile.photos[0]} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-gray-400" />
                )}
              </div>
              {isEditing && isOwnProfile && (
                <button className="absolute bottom-0 right-0 bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 transition-colors">
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900 font-medium">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Age
                  </label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="age"
                      value={profile.age}
                      onChange={handleChange}
                      min="18"
                      max="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.age} years old</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  {isEditing ? (
                    <select
                      name="gender"
                      value={profile.gender}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.gender}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interested In</label>
                  {isEditing ? (
                    <select
                      name="interestedIn"
                      value={profile.interestedIn}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="all">All</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.interestedIn}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                  {isEditing ? (
                    <select
                      name="maritalStatus"
                      value={profile.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.maritalStatus}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  {isEditing ? (
                    <select
                      name="country"
                      value={profile.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="">Select country</option>
                      {COUNTRIES.map(country => (
                        <option key={country} value={country}>{country}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.country || 'Not specified'}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  {isEditing ? (
                    <select
                      name="city"
                      value={profile.city}
                      onChange={handleChange}
                      disabled={!profile.country}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="">
                        {profile.country ? 'Select city' : 'Select country first'}
                      </option>
                      {profile.country && MAJOR_CITIES[profile.country]?.map(city => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-gray-900">{profile.city || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Körperliche Merkmale */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Physical Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="height"
                      value={profile.height}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.height || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  {isEditing ? (
                    <input
                      type="number"
                      name="weight"
                      value={profile.weight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.weight || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                  {isEditing ? (
                    <select
                      name="bodyType"
                      value={profile.bodyType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="slim">Slim</option>
                      <option value="athletic">Athletic</option>
                      <option value="average">Average</option>
                      <option value="curvy">Curvy</option>
                      <option value="heavyset">Heavyset</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.bodyType}</p>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hair Color</label>
                  {isEditing ? (
                    <DropdownSelect
                      options={HAIR_COLORS}
                      value={profile.hairColor}
                      onChange={(value) => setProfile(prev => ({ ...prev, hairColor: value }))}
                      placeholder="Select hair color"
                      allowOther={true}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.hairColor || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hair Style</label>
                  {isEditing ? (
                    <DropdownSelect
                      options={HAIR_STYLES}
                      value={profile.hairStyle}
                      onChange={(value) => setProfile(prev => ({ ...prev, hairStyle: value }))}
                      placeholder="Select hair style"
                      allowOther={true}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.hairStyle || 'Not specified'}</p>
                  )}
                </div>
              </div>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Eye Color</label>
                {isEditing ? (
                  <DropdownSelect
                    options={EYE_COLORS}
                    value={profile.eyeColor}
                    onChange={(value) => setProfile(prev => ({ ...prev, eyeColor: value }))}
                    placeholder="Select eye color"
                    allowOther={true}
                  />
                ) : (
                  <p className="text-gray-900">{profile.eyeColor || 'Not specified'}</p>
                )}
              </div>
            </div>

            {/* Persönliche Merkmale */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                  {isEditing ? (
                    <DropdownSelect
                      options={ETHNICITIES}
                      value={profile.ethnicity}
                      onChange={(value) => setProfile(prev => ({ ...prev, ethnicity: value }))}
                      placeholder="Select ethnicity"
                      allowOther={true}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.ethnicity || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                  {isEditing ? (
                    <DropdownSelect
                      options={RELIGIONS}
                      value={profile.religion}
                      onChange={(value) => setProfile(prev => ({ ...prev, religion: value }))}
                      placeholder="Select religion"
                      allowOther={true}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.religion || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                  {isEditing ? (
                    <select
                      name="smoking"
                      value={profile.smoking}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="never">Never</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="regularly">Regularly</option>
                      <option value="trying_to_quit">Trying to quit</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.smoking}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Drinking</label>
                  {isEditing ? (
                    <select
                      name="drinking"
                      value={profile.drinking}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="never">Never</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="regularly">Regularly</option>
                      <option value="socially">Socially</option>
                    </select>
                  ) : (
                    <p className="text-gray-900 capitalize">{profile.drinking}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                  {isEditing ? (
                    <DropdownSelect
                      options={LANGUAGES}
                      value={profile.languages}
                      onChange={(value) => setProfile(prev => ({ ...prev, languages: value }))}
                      placeholder="Select languages"
                      multiSelect={true}
                      allowOther={true}
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(profile.languages) && profile.languages.length > 0 ? (
                        profile.languages.map((language, index) => (
                          <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {language}
                          </span>
                        ))
                      ) : (
                        <p className="text-gray-500">No languages specified</p>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="hasChildren"
                        checked={profile.hasChildren}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          hasChildren: e.target.checked
                        }))}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      Has children
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="wantsChildren"
                        checked={profile.wantsChildren}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          wantsChildren: e.target.checked
                        }))}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      Wants children
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Beruf & Bildung */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Career & Education</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                  {isEditing ? (
                    <input
                      type="text"
                      name="profession"
                      value={profile.profession}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-900">{profile.profession || 'Not specified'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                  {isEditing ? (
                    <DropdownSelect
                      options={EDUCATION_LEVELS}
                      value={profile.education}
                      onChange={(value) => setProfile(prev => ({ ...prev, education: value }))}
                      placeholder="Select education level"
                      allowOther={true}
                    />
                  ) : (
                    <p className="text-gray-900">{profile.education || 'Not specified'}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Bio & Interessen */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profile.bio}
                  onChange={handleChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-900">{profile.bio || 'No bio added yet'}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Heart className="w-4 h-4 inline mr-1" />
                Interests
              </label>
              {isEditing ? (
                <input
                  type="text"
                  name="interests"
                  value={profile.interests}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Music, Travel, Sports (comma separated)"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {profile.interests && Array.isArray(profile.interests) && profile.interests.length > 0 ? (
                    profile.interests.map((interest, index) => (
                      <span key={index} className="bg-pink-100 text-pink-800 px-3 py-1 rounded-full text-sm">
                        {interest}
                      </span>
                    ))
                  ) : (
                    <p className="text-gray-500">No interests added yet</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {profile.photos && profile.photos.length > 1 && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">More Photos</h3>
              <div className="grid grid-cols-3 gap-3">
                {profile.photos.slice(1).map((photo, index) => (
                  <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                    <img src={photo} alt={`Photo ${index + 2}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

                    {/* Suchpräferenzen */}
          {isOwnProfile && (
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Search Preferences</h3>
              <p className="text-sm text-gray-600 mb-4">These values will be used as defaults when you search for other profiles</p>
              
              <div className="space-y-4">
                {/* Altersbereich */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Age Range</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="searchPref_ageMin"
                          value={profile.searchPreferences.ageMin}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="18"
                          min="18"
                          max="100"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.ageMin || 'No minimum'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Age</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="searchPref_ageMax"
                          value={profile.searchPreferences.ageMax}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="50"
                          min="18"
                          max="100"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.ageMax || 'No maximum'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Körperliche Merkmale */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Physical Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Height (cm)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="searchPref_heightMin"
                          value={profile.searchPreferences.heightMin}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="150"
                          min="100"
                          max="250"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.heightMin || 'No minimum'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Height (cm)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="searchPref_heightMax"
                          value={profile.searchPreferences.heightMax}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="200"
                          min="100"
                          max="250"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.heightMax || 'No maximum'}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Min Weight (kg)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="searchPref_weightMin"
                          value={profile.searchPreferences.weightMin}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="50"
                          min="30"
                          max="200"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.weightMin || 'No minimum'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Max Weight (kg)</label>
                      {isEditing ? (
                        <input
                          type="number"
                          name="searchPref_weightMax"
                          value={profile.searchPreferences.weightMax}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                          placeholder="100"
                          min="30"
                          max="200"
                        />
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.weightMax || 'No maximum'}</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                    {isEditing ? (
                      <select
                        name="searchPref_bodyType"
                        value={profile.searchPreferences.bodyType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      >
                        <option value="all">All body types</option>
                        <option value="slim">Slim</option>
                        <option value="average">Average</option>
                        <option value="athletic">Athletic</option>
                        <option value="curvy">Curvy</option>
                        <option value="heavy">Heavy</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 capitalize">{profile.searchPreferences.bodyType === 'all' ? 'All body types' : profile.searchPreferences.bodyType || 'Not specified'}</p>
                    )}
                  </div>
                </div>

                {/* Persönliche Merkmale */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Personal Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                      {isEditing ? (
                        <select
                          name="searchPref_ethnicity"
                          value={profile.searchPreferences.ethnicity}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">All ethnicities</option>
                          {ETHNICITIES.map(ethnicity => (
                            <option key={ethnicity} value={ethnicity}>{ethnicity}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.ethnicity || 'All ethnicities'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                      {isEditing ? (
                        <select
                          name="searchPref_religion"
                          value={profile.searchPreferences.religion}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">All religions</option>
                          {RELIGIONS.map(religion => (
                            <option key={religion} value={religion}>{religion}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.religion || 'All religions'}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                      {isEditing ? (
                        <select
                          name="searchPref_maritalStatus"
                          value={profile.searchPreferences.maritalStatus}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="all">All statuses</option>
                          <option value="single">Single</option>
                          <option value="married">Married</option>
                          <option value="divorced">Divorced</option>
                          <option value="widowed">Widowed</option>
                          <option value="separated">Separated</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 capitalize">{profile.searchPreferences.maritalStatus === 'all' ? 'All statuses' : profile.searchPreferences.maritalStatus || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                      {isEditing ? (
                        <select
                          name="searchPref_hasChildren"
                          value={profile.searchPreferences.hasChildren}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="all">All</option>
                          <option value="true">Has children</option>
                          <option value="false">No children</option>
                        </select>
                      ) : (
                        <p className="text-gray-900">
                          {profile.searchPreferences.hasChildren === 'all' ? 'All' : 
                           profile.searchPreferences.hasChildren === 'true' ? 'Has children' : 
                           profile.searchPreferences.hasChildren === 'false' ? 'No children' : 'Not specified'}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                      {isEditing ? (
                        <select
                          name="searchPref_smoking"
                          value={profile.searchPreferences.smoking}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="all">All</option>
                          <option value="never">Never</option>
                          <option value="occasionally">Occasionally</option>
                          <option value="regularly">Regularly</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 capitalize">{profile.searchPreferences.smoking === 'all' ? 'All' : profile.searchPreferences.smoking || 'Not specified'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Drinking</label>
                      {isEditing ? (
                        <select
                          name="searchPref_drinking"
                          value={profile.searchPreferences.drinking}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="all">All</option>
                          <option value="never">Never</option>
                          <option value="occasionally">Occasionally</option>
                          <option value="regularly">Regularly</option>
                        </select>
                      ) : (
                        <p className="text-gray-900 capitalize">{profile.searchPreferences.drinking === 'all' ? 'All' : profile.searchPreferences.drinking || 'Not specified'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Standort */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Location Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                      {isEditing ? (
                        <select
                          name="searchPref_country"
                          value={profile.searchPreferences.country}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                          <option value="">All countries</option>
                          {COUNTRIES.map(country => (
                            <option key={country} value={country}>{country}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.country || 'All countries'}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                      {isEditing ? (
                        <select
                          name="searchPref_city"
                          value={profile.searchPreferences.city}
                          onChange={handleChange}
                          disabled={!profile.searchPreferences.country}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                        >
                          <option value="">
                            {profile.searchPreferences.country ? 'All cities' : 'Select country first'}
                          </option>
                          {profile.searchPreferences.country && MAJOR_CITIES[profile.searchPreferences.country]?.map(city => (
                            <option key={city} value={city}>{city}</option>
                          ))}
                        </select>
                      ) : (
                        <p className="text-gray-900">{profile.searchPreferences.city || 'All cities'}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Optionen */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Search Options</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="searchPref_withPhotosOnly"
                        checked={profile.searchPreferences.withPhotosOnly}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          searchPreferences: {
                            ...prev.searchPreferences,
                            withPhotosOnly: e.target.checked
                          }
                        }))}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      Only show profiles with photos
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="searchPref_onlineOnly"
                        checked={profile.searchPreferences.onlineOnly}
                        onChange={(e) => setProfile(prev => ({
                          ...prev,
                          searchPreferences: {
                            ...prev.searchPreferences,
                            onlineOnly: e.target.checked
                          }
                        }))}
                        disabled={!isEditing}
                        className="mr-2"
                      />
                      Only show online profiles
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
