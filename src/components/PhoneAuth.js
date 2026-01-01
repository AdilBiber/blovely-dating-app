import React, { useState } from 'react';
import { Phone } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const PhoneAuth = ({ onAuth }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [countryCode, setCountryCode] = useState('+49');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
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
      
      // Standort
      country: '',
      city: '',
      
      // Medien
      photos: []
    }
  });
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Combine country code and phone number
    const fullPhoneNumber = `${countryCode}${phoneNumber}`;

    try {
      if (isLogin) {
        // Login with phone number and password
        const response = await axios.post(`${API_BASE_URL}/api/login-phone-password`, {
          phoneNumber: fullPhoneNumber,
          password
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onAuth(response.data.user);
      } else {
        // Register with phone number and password
        const response = await axios.post(`${API_BASE_URL}/api/register-phone-password`, {
          phoneNumber: fullPhoneNumber,
          password,
          profile: formData.profile
        });
        
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        onAuth(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      profile: {
        ...prev.profile,
        [field]: value
      }
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <Phone className="w-16 h-16 text-pink-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">
            {isLogin ? 'Login with Phone' : 'Register with Phone'}
          </h2>
          <p className="text-gray-600 mt-2">
            {isLogin ? 'Enter your phone number and password' : 'Create account with phone number and password'}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <div className="flex space-x-2">
              <select
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                className="px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 bg-white"
              >
                <option value="+49">🇩🇪 +49</option>
                <option value="+43">🇦🇹 +43</option>
                <option value="+41">🇨🇭 +41</option>
                <option value="+33">🇫🇷 +33</option>
                <option value="+31">🇳🇱 +31</option>
                <option value="+44">🇬🇧 +44</option>
                <option value="+39">🇮🇹 +39</option>
                <option value="+34">🇪🇸 +34</option>
                <option value="+46">🇸🇪 +46</option>
                <option value="+47">🇳🇴 +47</option>
                <option value="+45">🇩🇰 +45</option>
                <option value="+358">🇫🇮 +358</option>
                <option value="+351">🇵🇹 +351</option>
                <option value="+30">🇬🇷 +30</option>
              </select>
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="tel"
                  placeholder="123 4567890"
                  value={phoneNumber}
                  onChange={(e) => {
                    // Remove leading zeros and non-digits
                    const value = e.target.value.replace(/^0+|[^\d]/g, '');
                    setPhoneNumber(value);
                  }}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                  minLength={6}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">Telefonnummer ohne führende 0</p>
          </div>

          <div className="mb-4">
            <input
              type="password"
              placeholder="Password (min. 6 Zeichen, 1 Großbuchstabe, 1 Sonderzeichen)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
              required
              minLength={6}
              pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$"
              title="Min. 6 Zeichen: 1 Großbuchstabe, 1 Sonderzeichen (@$!%*?&)"
            />
          </div>

          {!isLogin && (
            <div className="space-y-4 mb-6">
              <div>
                <input
                  type="text"
                  placeholder="Name"
                  value={formData.profile.name}
                  onChange={(e) => handleProfileChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <input
                  type="number"
                  placeholder="Age"
                  value={formData.profile.age}
                  onChange={(e) => handleProfileChange('age', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                  required
                />
                
                <select
                  value={formData.profile.gender}
                  onChange={(e) => handleProfileChange('gender', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <textarea
                placeholder="Bio"
                value={formData.profile.bio}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                rows="3"
              />
            </div>
          )}

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-pink-500 text-white py-4 rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold text-lg shadow-lg"
          >
            {loading ? 'Processing...' : (isLogin ? '🔓 LOGIN' : '👤 CREATE ACCOUNT')}
          </button>

          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="w-full mt-4 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            {isLogin ? '🔔 Need an account? Register' : '🔑 Have an account? Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default PhoneAuth;
