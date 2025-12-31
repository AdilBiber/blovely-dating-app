import React, { useState } from 'react';
import { Heart, Mail, Lock, User, Calendar, MapPin, Camera, Google } from 'lucide-react';
import axios from 'axios';

// API Configuration
// Production: https://blovely-backend.onrender.com
// Local: http://localhost:5000
const API_BASE_URL = 'https://blovely-backend.onrender.com';
import ImageUpload from './ImageUpload';
import DropdownSelect from './DropdownSelect';
import { EYE_COLORS, HAIR_COLORS, HAIR_STYLES, ETHNICITIES, RELIGIONS, EDUCATION_LEVELS, LANGUAGES } from './constants';

const Auth = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    profile: {
      name: '',
      age: '',
      gender: 'male',
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
      languages: [],
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
      photos: []
    }
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('profile.')) {
      const profileField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        profile: { ...prev.profile, [profileField]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const endpoint = isLogin ? '/api/login' : '/api/register';
      const data = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            ...formData, 
            profile: { 
              ...formData.profile, 
              age: parseInt(formData.profile.age),
              height: formData.profile.height ? parseInt(formData.profile.height) : undefined,
              weight: formData.profile.weight ? parseInt(formData.profile.weight) : undefined,
              interests: formData.profile.interests ? formData.profile.interests.split(',').map(i => i.trim()).filter(i => i) : [],
              languages: Array.isArray(formData.profile.languages) ? formData.profile.languages : (formData.profile.languages ? formData.profile.languages.split(',').map(i => i.trim()).filter(i => i) : [])
            }
          };
      
      const response = await axios.post(`${API_BASE_URL}/api/register`, data);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      onAuth(response.data.user);
    } catch (error) {
      console.error('Auth error:', error);
      alert('Authentication failed');
    }
  };

  const handleGoogleAuth = () => {
    window.open(`${API_BASE_URL}/auth/google`, '_self');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-red-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500 rounded-full mb-4">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">BLovely</h1>
          <p className="text-gray-600 mt-2">Find your perfect match</p>
        </div>

        <button
          onClick={handleGoogleAuth}
          className="w-full flex items-center justify-center gap-3 bg-white border border-gray-300 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors mb-6"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="your@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Lock className="w-4 h-4 inline mr-1" />
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="••••••••"
            />
          </div>

          {!isLogin && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <User className="w-4 h-4 inline mr-1" />
                  Name
                </label>
                <input
                  type="text"
                  name="profile.name"
                  value={formData.profile.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Age
                </label>
                <input
                  type="number"
                  name="profile.age"
                  value={formData.profile.age}
                  onChange={handleChange}
                  required
                  min="18"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="25"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select
                  name="profile.gender"
                  value={formData.profile.gender}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  name="profile.location"
                  value={formData.profile.location}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="City, Country"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  name="profile.bio"
                  value={formData.profile.bio}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Tell us about yourself..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Interests</label>
                <input
                  type="text"
                  name="profile.interests"
                  value={formData.profile.interests}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Music, Travel, Sports (comma separated)"
                />
              </div>

              {/* Körperliche Merkmale */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Physical Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                    <input
                      type="number"
                      name="profile.height"
                      value={formData.profile.height}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="175"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      name="profile.weight"
                      value={formData.profile.weight}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="70"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Body Type</label>
                    <select
                      name="profile.bodyType"
                      value={formData.profile.bodyType}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="slim">Slim</option>
                      <option value="athletic">Athletic</option>
                      <option value="average">Average</option>
                      <option value="curvy">Curvy</option>
                      <option value="heavyset">Heavyset</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Hair Color</label>
                    <DropdownSelect
                      options={HAIR_COLORS}
                      value={formData.profile.hairColor}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, hairColor: value }
                      }))}
                      placeholder="Select hair color"
                      allowOther={true}
                      otherValue={formData.profile.customHairColor}
                      onOtherChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, customHairColor: value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Eye Color</label>
                    <DropdownSelect
                      options={EYE_COLORS}
                      value={formData.profile.eyeColor}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, eyeColor: value }
                      }))}
                      placeholder="Select eye color"
                      allowOther={true}
                      otherValue={formData.profile.customEyeColor}
                      onOtherChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, customEyeColor: value }
                      }))}
                    />
                  </div>
                </div>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hair Style</label>
                  <DropdownSelect
                    options={HAIR_STYLES}
                    value={formData.profile.hairStyle}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, hairStyle: value }
                    }))}
                    placeholder="Select hair style"
                    allowOther={true}
                    otherValue={formData.profile.customHairStyle}
                    onOtherChange={(value) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, customHairStyle: value }
                    }))}
                  />
                </div>
              </div>
              {/* Persönliche Merkmale */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Personal Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ethnicity</label>
                    <DropdownSelect
                      options={ETHNICITIES}
                      value={formData.profile.ethnicity}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, ethnicity: value }
                      }))}
                      placeholder="Select ethnicity"
                      allowOther={true}
                      otherValue={formData.profile.customEthnicity}
                      onOtherChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, customEthnicity: value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Religion</label>
                    <DropdownSelect
                      options={RELIGIONS}
                      value={formData.profile.religion}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, religion: value }
                      }))}
                      placeholder="Select religion"
                      allowOther={true}
                      otherValue={formData.profile.customReligion}
                      onOtherChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, customReligion: value }
                      }))}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Languages</label>
                  <DropdownSelect
                    options={LANGUAGES}
                    value={formData.profile.languages}
                    onChange={(value) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, languages: value }
                    }))}
                    placeholder="Select languages"
                    multiSelect={true}
                    allowOther={true}
                    otherValue={formData.profile.customLanguages}
                    onOtherChange={(value) => setFormData(prev => ({
                      ...prev,
                      profile: { ...prev.profile, customLanguages: value }
                    }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
                    <select
                      name="profile.maritalStatus"
                      value={formData.profile.maritalStatus}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="divorced">Divorced</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Smoking</label>
                    <select
                      name="profile.smoking"
                      value={formData.profile.smoking}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="never">Never</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="regularly">Regularly</option>
                      <option value="trying_to_quit">Trying to quit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Drinking</label>
                    <select
                      name="profile.drinking"
                      value={formData.profile.drinking}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="never">Never</option>
                      <option value="occasionally">Occasionally</option>
                      <option value="regularly">Regularly</option>
                      <option value="socially">Socially</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Children</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="profile.hasChildren"
                          checked={formData.profile.hasChildren}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            profile: { ...prev.profile, hasChildren: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        Have children
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          name="profile.wantsChildren"
                          checked={formData.profile.wantsChildren}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            profile: { ...prev.profile, wantsChildren: e.target.checked }
                          }))}
                          className="mr-2"
                        />
                        Want children
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* Beruf & Bildung */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Career & Education</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Profession</label>
                    <input
                      type="text"
                      name="profile.profession"
                      value={formData.profile.profession}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Software Engineer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Education</label>
                    <DropdownSelect
                      options={EDUCATION_LEVELS}
                      value={formData.profile.education}
                      onChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, education: value }
                      }))}
                      placeholder="Select education level"
                      allowOther={true}
                      otherValue={formData.profile.customEducation}
                      onOtherChange={(value) => setFormData(prev => ({
                        ...prev,
                        profile: { ...prev.profile, customEducation: value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Standort */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Location</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      name="profile.country"
                      value={formData.profile.country}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Germany"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      name="profile.city"
                      value={formData.profile.city}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Berlin"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <MapPin className="w-4 h-4 inline mr-1" />
                      Location
                    </label>
                    <input
                      type="text"
                      name="profile.location"
                      value={formData.profile.location}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="Berlin, Germany"
                    />
                  </div>
                </div>
              </div>

              {/* Photo Upload */}
              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Photos</h3>
                <ImageUpload
                  images={formData.profile.photos || []}
                  onImagesChange={(newPhotos) => setFormData(prev => ({
                    ...prev,
                    profile: { ...prev.profile, photos: newPhotos }
                  }))}
                  maxImages={5}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            className="w-full bg-primary-500 text-white py-3 rounded-lg font-semibold hover:bg-primary-600 transition-colors"
          >
            {isLogin ? 'Sign In' : 'Sign Up'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary-500 hover:text-primary-600 font-medium"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
