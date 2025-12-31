// Zentrale Konfiguration
// Ändere hier zwischen Local und Production

const ENVIRONMENT = 'production'; // 'local' oder 'production'

const CONFIG = {
  local: {
    API_BASE_URL: 'http://localhost:5000',
    FRONTEND_URL: 'http://localhost:3000',
    MONGODB_URI: 'mongodb://localhost:27017/blovely',
    GOOGLE_CALLBACK_URL: 'http://localhost:5000/auth/google/callback'
  },
  production: {
    API_BASE_URL: 'https://blovely-backend.onrender.com',
    FRONTEND_URL: 'https://blovely-dating-app.vercel.app',
    MONGODB_URI: 'mongodb+srv://blovely-admin:yVigTnbZNBg5q7eMfDXt@blovely-cluster.oplqrqb.mongodb.net/blovely?retryWrites=true&w=majority',
    GOOGLE_CALLBACK_URL: 'https://blovely-backend.onrender.com/auth/google/callback'
  }
};

export const {
  API_BASE_URL,
  FRONTEND_URL,
  MONGODB_URI,
  GOOGLE_CALLBACK_URL
} = CONFIG[ENVIRONMENT];

export default CONFIG;
