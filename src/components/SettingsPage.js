import React, { useState, useEffect } from 'react';
import { Settings, Mail, Trash2, Save, Eye, EyeOff, Lock, Info } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const SettingsPage = ({ user, onUserUpdate, onLogout, showFirstTimeHint = false }) => {
  const [alternativeEmail, setAlternativeEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('email'); // 'email' or 'password'

  useEffect(() => {
    if (user?.alternativeEmail) {
      setAlternativeEmail(user.alternativeEmail);
    }
  }, [user]);

  const handleSaveAlternativeEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await axios.put(`${API_BASE_URL}/api/user/alternative-email`, {
        alternativeEmail
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Alternative email saved successfully!');
      onUserUpdate(response.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Error saving alternative email');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await axios.put(`${API_BASE_URL}/api/user/change-password`, {
        currentPassword,
        newPassword
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setSuccess('Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Error changing password');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete your account? This action cannot be undone!'
    );

    if (!confirmed) return;

    const passwordConfirmed = window.prompt(
      'Please enter your password to confirm deletion:'
    );

    if (!passwordConfirmed) return;

    setLoading(true);
    setError('');

    try {
      await axios.delete(`${API_BASE_URL}/api/user/delete-account`, {
        data: { password: passwordConfirmed }
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      localStorage.removeItem('token');
      localStorage.removeItem('user');
      onLogout();
    } catch (err) {
      setError(err.response?.data?.message || 'Error deleting account');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-2xl mx-auto">
        {/* First Time Hint */}
        {showFirstTimeHint && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">Welcome to BLovely! 🎉</h3>
                <p className="text-blue-800 text-sm">
                  Here you can set an alternative email address for password recovery. 
                  This will only be used if you lose access to your primary email or phone number.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="flex items-center mb-8">
            <Settings className="w-8 h-8 text-pink-500 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
          </div>

          {/* Tabs */}
          <div className="flex border-b mb-6">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'email'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Mail className="w-4 h-4 inline mr-2" />
              Alternative Email
            </button>
            <button
              onClick={() => setActiveTab('password')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'password'
                  ? 'text-pink-600 border-b-2 border-pink-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              Change Password
            </button>
          </div>

          {/* Error/Success Messages */}
          {error && (
            <div className="mt-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mt-6 p-3 bg-green-50 text-green-600 rounded-lg text-sm">
              {success}
            </div>
          )}

          {/* Email Tab */}
          {activeTab === 'email' && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Here you can set an alternative email address for password recovery. 
                  This will only be used if you lose access to your primary email or phone number.
                </p>

                <form onSubmit={handleSaveAlternativeEmail} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Alternative Email Address
                    </label>
                    <input
                      type="email"
                      value={alternativeEmail}
                      onChange={(e) => setAlternativeEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                      placeholder="alternative@example.com"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  Here you can change your password. The new password must meet the same security requirements 
                  as during registration.
                </p>

                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="••••••••"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder="New Password (min. 6 characters, 1 uppercase, 1 special character)"
                        required
                        minLength={6}
                        pattern="^(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{6,}$"
                        title="Min. 6 characters: 1 uppercase, 1 special character (@$!%*?&)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Account Deletion Section */}
          <div className="mt-8 p-6 bg-red-50 rounded-lg">
            <div className="flex items-center mb-4">
              <Trash2 className="w-5 h-5 text-red-600 mr-2" />
              <h2 className="text-xl font-semibold text-red-800">Delete Account</h2>
            </div>
            
            <p className="text-red-700 mb-4">
              When you delete your account, all your data will be permanently removed. 
              This action cannot be undone.
            </p>

            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="flex items-center px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {loading ? 'Deleting...' : 'Delete Account Permanently'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
