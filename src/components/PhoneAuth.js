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
  className="px-2 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 bg-white text-sm w-32"
>
  <option value="+93">🇦🇫 +93 Afghanistan</option>
  <option value="+355">🇦🇱 +355 Albania</option>
  <option value="+213">🇩🇿 +213 Algeria</option>
  <option value="+1-684">🇦🇸 +1-684 American Samoa</option>
  <option value="+376">🇦🇩 +376 Andorra</option>
  <option value="+244">🇦🇴 +244 Angola</option>
  <option value="+1-264">🇦🇮 +1-264 Anguilla</option>
  <option value="+1-268">🇦🇬 +1-268 Antigua & Barbuda</option>
  <option value="+54">🇦🇷 +54 Argentina</option>
  <option value="+374">🇦🇲 +374 Armenia</option>
  <option value="+297">🇦🇼 +297 Aruba</option>
  <option value="+61">🇦🇺 +61 Australia</option>
  <option value="+43">🇦🇹 +43 Austria</option>
  <option value="+994">🇦🇿 +994 Azerbaijan</option>

  <option value="+1-242">🇧🇸 +1-242 Bahamas</option>
  <option value="+973">🇧🇭 +973 Bahrain</option>
  <option value="+880">🇧🇩 +880 Bangladesh</option>
  <option value="+1-246">🇧🇧 +1-246 Barbados</option>
  <option value="+375">🇧🇾 +375 Belarus</option>
  <option value="+32">🇧🇪 +32 Belgium</option>
  <option value="+229">🇧🇯 +229 Benin</option>
  <option value="+1-441">🇧🇲 +1-441 Bermuda</option>
  <option value="+975">🇧🇹 +975 Bhutan</option>
  <option value="+591">🇧🇴 +591 Bolivia</option>
  <option value="+387">🇧🇦 +387 Bosnia & Herzegovina</option>
  <option value="+267">🇧🇼 +267 Botswana</option>
  <option value="+55">🇧🇷 +55 Brazil</option>
  <option value="+673">🇧🇳 +673 Brunei</option>
  <option value="+359">🇧🇬 +359 Bulgaria</option>
  <option value="+226">🇧🇫 +226 Burkina Faso</option>
  <option value="+257">🇧🇮 +257 Burundi</option>

  <option value="+855">🇰🇭 +855 Cambodia</option>
  <option value="+1">🇨🇦 +1 Canada</option>
  <option value="+238">🇨🇻 +238 Cape Verde</option>
  <option value="+1-345">🇰🇾 +1-345 Cayman Islands</option>
  <option value="+236">🇨🇫 +236 Central African Republic</option>
  <option value="+235">🇹🇩 +235 Chad</option>
  <option value="+56">🇨🇱 +56 Chile</option>
  <option value="+86">🇨🇳 +86 China</option>
  <option value="+57">🇨🇴 +57 Colombia</option>
  <option value="+269">🇰🇲 +269 Comoros</option>
  <option value="+242">🇨🇬 +242 Congo</option>
  <option value="+506">🇨🇷 +506 Costa Rica</option>
  <option value="+225">🇨🇮 +225 Côte d’Ivoire</option>
  <option value="+385">🇭🇷 +385 Croatia</option>
  <option value="+53">🇨🇺 +53 Cuba</option>
  <option value="+357">🇨🇾 +357 Cyprus</option>
  <option value="+420">🇨🇿 +420 Czech Republic</option>

  <option value="+45">🇩🇰 +45 Denmark</option>
  <option value="+253">🇩🇯 +253 Djibouti</option>
  <option value="+1-767">🇩🇲 +1-767 Dominica</option>
  <option value="+1-809">🇩🇴 +1-809 Dominican Republic</option>

  <option value="+593">🇪🇨 +593 Ecuador</option>
  <option value="+20">🇪🇬 +20 Egypt</option>
  <option value="+503">🇸🇻 +503 El Salvador</option>
  <option value="+372">🇪🇪 +372 Estonia</option>
  <option value="+251">🇪🇹 +251 Ethiopia</option>

  <option value="+358">🇫🇮 +358 Finland</option>
  <option value="+33">🇫🇷 +33 France</option>

  <option value="+995">🇬🇪 +995 Georgia</option>
  <option value="+49">🇩🇪 +49 Germany</option>
  <option value="+233">🇬🇭 +233 Ghana</option>
  <option value="+350">🇬🇮 +350 Gibraltar</option>
  <option value="+30">🇬🇷 +30 Greece</option>
  <option value="+299">🇬🇱 +299 Greenland</option>
  <option value="+502">🇬🇹 +502 Guatemala</option>

  <option value="+852">🇭🇰 +852 Hong Kong</option>
  <option value="+36">🇭🇺 +36 Hungary</option>

  <option value="+354">🇮🇸 +354 Iceland</option>
  <option value="+91">🇮🇳 +91 India</option>
  <option value="+62">🇮🇩 +62 Indonesia</option>
  <option value="+98">🇮🇷 +98 Iran</option>
  <option value="+964">🇮🇶 +964 Iraq</option>
  <option value="+353">🇮🇪 +353 Ireland</option>
  <option value="+972">🇮🇱 +972 Israel</option>
  <option value="+39">🇮🇹 +39 Italy</option>

  <option value="+81">🇯🇵 +81 Japan</option>
  <option value="+962">🇯🇴 +962 Jordan</option>

  <option value="+254">🇰🇪 +254 Kenya</option>
  <option value="+82">🇰🇷 +82 South Korea</option>
  <option value="+965">🇰🇼 +965 Kuwait</option>

  <option value="+371">🇱🇻 +371 Latvia</option>
  <option value="+961">🇱🇧 +961 Lebanon</option>
  <option value="+266">🇱🇸 +266 Lesotho</option>
  <option value="+370">🇱🇹 +370 Lithuania</option>
  <option value="+352">🇱🇺 +352 Luxembourg</option>

  <option value="+60">🇲🇾 +60 Malaysia</option>
  <option value="+356">🇲🇹 +356 Malta</option>
  <option value="+52">🇲🇽 +52 Mexico</option>
  <option value="+976">🇲🇳 +976 Mongolia</option>
  <option value="+382">🇲🇪 +382 Montenegro</option>
  <option value="+212">🇲🇦 +212 Morocco</option>

  <option value="+31">🇳🇱 +31 Netherlands</option>
  <option value="+64">🇳🇿 +64 New Zealand</option>
  <option value="+234">🇳🇬 +234 Nigeria</option>
  <option value="+47">🇳🇴 +47 Norway</option>

  <option value="+92">🇵🇰 +92 Pakistan</option>
  <option value="+63">🇵🇭 +63 Philippines</option>
  <option value="+48">🇵🇱 +48 Poland</option>
  <option value="+351">🇵🇹 +351 Portugal</option>

  <option value="+974">🇶🇦 +974 Qatar</option>

  <option value="+40">🇷🇴 +40 Romania</option>
  <option value="+7">🇷🇺 +7 Russia</option>

  <option value="+966">🇸🇦 +966 Saudi Arabia</option>
  <option value="+381">🇷🇸 +381 Serbia</option>
  <option value="+65">🇸🇬 +65 Singapore</option>
  <option value="+421">🇸🇰 +421 Slovakia</option>
  <option value="+386">🇸🇮 +386 Slovenia</option>
  <option value="+27">🇿🇦 +27 South Africa</option>
  <option value="+34">🇪🇸 +34 Spain</option>
  <option value="+94">🇱🇰 +94 Sri Lanka</option>
  <option value="+46">🇸🇪 +46 Sweden</option>
  <option value="+41">🇨🇭 +41 Switzerland</option>

  <option value="+66">🇹🇭 +66 Thailand</option>
  <option value="+90">🇹🇷 +90 Turkey</option>

  <option value="+380">🇺🇦 +380 Ukraine</option>
  <option value="+971">🇦🇪 +971 United Arab Emirates</option>
  <option value="+44">🇬🇧 +44 United Kingdom</option>
  <option value="+1">🇺🇸 +1 United States</option>
  <option value="+598">🇺🇾 +598 Uruguay</option>

  <option value="+84">🇻🇳 +84 Vietnam</option>

  <option value="+260">🇿🇲 +260 Zambia</option>
  <option value="+263">🇿🇼 +263 Zimbabwe</option>
</select>
              <div className="relative flex-auto">
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
