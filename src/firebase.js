import { initializeApp } from 'firebase/app';
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';

// Firebase Configuration - ECHTE KEYS VON BLOVELY-PHONE
const firebaseConfig = {
  apiKey: "AIzaSyAYkN7HTMgyvv8TdfUfnp_rbQ5Vt6UT7ME",
  authDomain: "blovely-phone.firebaseapp.com",
  projectId: "blovely-phone",
  storageBucket: "blovely-phone.firebasestorage.app",
  messagingSenderId: "329632672142",
  appId: "1:329632672142:web:5b0742755f5433aa431cdf"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

export { RecaptchaVerifier, signInWithPhoneNumber };
