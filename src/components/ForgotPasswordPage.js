import React, { useState } from 'react';
import { ArrowLeft, Mail, Phone, MessageCircle, Lock, Check } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const ForgotPasswordPage = ({ onBack }) => {
  const [step, setStep] = useState(1); // 1: choose method, 2: enter details, 3: success
  const [method, setMethod] = useState(''); // 'phone' or 'email'
  const [phoneMethod, setPhoneMethod] = useState(''); // 'whatsapp', 'line', 'alternative-email'
  const [emailMethod, setEmailMethod] = useState(''); // 'primary' or 'alternative'
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+49');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const countryCodes = [
    { code: '+49', country: 'Deutschland', flag: '🇩🇪' },
    { code: '+43', country: 'Österreich', flag: '🇦🇹' },
    { code: '+41', country: 'Schweiz', flag: '🇨🇭' },
    { code: '+1', country: 'USA', flag: '🇺🇸' },
    { code: '+44', country: 'UK', flag: '🇬🇧' },
    { code: '+33', country: 'Frankreich', flag: '🇫🇷' },
    { code: '+81', country: 'Japan', flag: '🇯🇵' },
    { code: '+82', country: 'Südkorea', flag: '🇰🇷' },
    { code: '+86', country: 'China', flag: '🇨🇳' },
    { code: '+91', country: 'Indien', flag: '🇮🇳' },
  ];

  const handleMethodSelect = (selectedMethod) => {
    setMethod(selectedMethod);
    setStep(2);
    setError('');
  };

  const handlePhoneMethodSelect = (selectedPhoneMethod) => {
    setPhoneMethod(selectedPhoneMethod);
  };

  const handleEmailMethodSelect = (selectedEmailMethod) => {
    setEmailMethod(selectedEmailMethod);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        method,
        ...(method === 'phone' && {
          phoneNumber: countryCode + phoneNumber.replace(/\s/g, ''),
          phoneMethod
        }),
        ...(method === 'email' && { 
          email,
          emailMethod 
        })
      };

      const response = await axios.post(`${API_BASE_URL}/api/forgot-password`, payload);
      
      setSuccess(response.data.message);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Fehler beim Senden der Anfrage');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setMethod('');
    setPhoneMethod('');
    setEmailMethod('');
    setEmail('');
    setPhoneNumber('');
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-800 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Login
        </button>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Step 1: Choose Method */}
          {step === 1 && (
            <>
              <div className="text-center mb-8">
                <Lock className="w-16 h-16 text-pink-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-800 mb-2">Forgot Password?</h1>
                <p className="text-gray-600">Choose how you want to reset your password</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => handleMethodSelect('phone')}
                  className="w-full flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all group"
                >
                  <Phone className="w-6 h-6 text-pink-500 mr-4" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Phone Number</div>
                    <div className="text-sm text-gray-600">Via WhatsApp, Line or Email</div>
                  </div>
                </button>

                <button
                  onClick={() => handleMethodSelect('email')}
                  className="w-full flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-all group"
                >
                  <Mail className="w-6 h-6 text-pink-500 mr-4" />
                  <div className="text-left">
                    <div className="font-semibold text-gray-800">Email Address</div>
                    <div className="text-sm text-gray-600">Via Email or alternative email</div>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* Step 2: Enter Details */}
          {step === 2 && (
            <>
              <div className="text-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {method === 'phone' ? 'Enter Phone Number' : 'Enter Email Address'}
                </h2>
                <p className="text-gray-600">
                  {method === 'phone' 
                    ? 'Choose how you want to receive your new password'
                    : 'Enter your email address'
                  }
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {method === 'phone' && (
                  <>
                    {/* Phone Number Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone Number
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={countryCode}
                          onChange={(e) => setCountryCode(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        >
                          {countryCodes.map((country) => (
                            <option key={country.code} value={country.code}>
                              {country.flag} {country.code} {country.country}
                            </option>
                          ))}
                        </select>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                          placeholder="177 2722126"
                          required
                        />
                      </div>
                    </div>

                    {/* Phone Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        How would you like to receive your new password?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer">
                          <input
                            type="radio"
                            name="phoneMethod"
                            value="whatsapp"
                            checked={phoneMethod === 'whatsapp'}
                            onChange={(e) => handlePhoneMethodSelect(e.target.value)}
                            className="mr-3"
                          />
                          <MessageCircle className="w-5 h-5 text-green-500 mr-2" />
                          <span>WhatsApp</span>
                        </label>
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer">
                          <input
                            type="radio"
                            name="phoneMethod"
                            value="line"
                            checked={phoneMethod === 'line'}
                            onChange={(e) => handlePhoneMethodSelect(e.target.value)}
                            className="mr-3"
                          />
                          <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
                          <span>Line</span>
                        </label>
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer">
                          <input
                            type="radio"
                            name="phoneMethod"
                            value="alternative-email"
                            checked={phoneMethod === 'alternative-email'}
                            onChange={(e) => handlePhoneMethodSelect(e.target.value)}
                            className="mr-3"
                          />
                          <Mail className="w-5 h-5 text-blue-500 mr-2" />
                          <span>Alternative E-Mail</span>
                        </label>
                      </div>
                    </div>
                  </>
                )}

                {method === 'email' && (
                  <>
                    {/* Email Method Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Welche E-Mail-Adresse möchtest du verwenden?
                      </label>
                      <div className="space-y-2">
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer">
                          <input
                            type="radio"
                            name="emailMethod"
                            value="primary"
                            checked={emailMethod === 'primary'}
                            onChange={(e) => handleEmailMethodSelect(e.target.value)}
                            className="mr-3"
                          />
                          <Mail className="w-5 h-5 text-blue-500 mr-2" />
                          <div>
                            <div className="font-medium">Primary Email</div>
                            <div className="text-sm text-gray-600">The email you registered with</div>
                          </div>
                        </label>
                        <label className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-pink-50 cursor-pointer">
                          <input
                            type="radio"
                            name="emailMethod"
                            value="alternative"
                            checked={emailMethod === 'alternative'}
                            onChange={(e) => handleEmailMethodSelect(e.target.value)}
                            className="mr-3"
                          />
                          <Mail className="w-5 h-5 text-green-500 mr-2" />
                          <div>
                            <div className="font-medium">Alternative Email</div>
                            <div className="text-sm text-gray-600">The alternative email from settings</div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Email Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                        placeholder={emailMethod === 'alternative' ? 'alternative@email.com' : 'your@email.com'}
                        required
                      />
                    </div>
                  </>
                )}

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Zurück
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (method === 'phone' && !phoneMethod) || (method === 'email' && !emailMethod)}
                    className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {loading ? 'Senden...' : 'Senden'}
                  </button>
                </div>
              </form>
            </>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">Request Sent!</h2>
              <p className="text-gray-600 mb-6">
                {success}
              </p>
              <div className="space-y-3">
                <button
                  onClick={resetForm}
                  className="w-full px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                >
                  Send New Request
                </button>
                <button
                  onClick={onBack}
                  className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back to Login
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
