const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const http = require('http');
const { MONGODB_URI, GOOGLE_CALLBACK_URL, FRONTEND_URL } = require('./src/config');
const socketIo = require('socket.io');
const admin = require('firebase-admin');
require('dotenv').config();

// Firebase Admin Setup (optional für echte SMS)
const serviceAccount = require('./firebase-service-account.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: [FRONTEND_URL, "http://localhost:3000"],
    methods: ["GET", "POST"]
  },
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, "http://localhost:3000"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.JWT_SECRET || 'blovely-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  password: { type: String },
  googleId: { type: String },
  phoneNumber: { type: String, unique: true, sparse: true },
  phonePassword: { type: String, required: function() { return this.phoneNumber; } },
  pinAttempts: { type: Number, default: 0 },
  alternativeEmail: { type: String, unique: true, sparse: true },
  passwordResetRequested: { type: Boolean, default: false },
  passwordResetMethod: { type: String }, // 'email', 'whatsapp', 'line', 'alternative-email'
  passwordResetRequestedAt: { type: Date },
  passwordResetStatus: { type: String, default: null }, // 'pending', 'sent', 'completed'
  passwordResetEmailType: { type: String }, // 'primary' or 'alternative'
  profile: {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, required: true },
    interestedIn: { type: String, default: 'female' },
    bio: { type: String },
    interests: [{ type: String }],
    
    // Körperliche Merkmale
    height: { type: Number }, // in cm
    weight: { type: Number }, // in kg
    bodyType: { 
      type: String, 
      enum: ['slim', 'athletic', 'average', 'curvy', 'heavyset'],
      default: 'average'
    },
    hairColor: { type: String },
    hairStyle: { type: String },
    eyeColor: { type: String },
    
    // Persönliche Merkmale
    ethnicity: { type: String },
    religion: { type: String },
    languages: [{ type: String }],
    maritalStatus: { 
      type: String, 
      enum: ['single', 'married', 'divorced', 'widowed', 'separated'],
      default: 'single'
    },
    hasChildren: { type: Boolean },
    wantsChildren: { type: Boolean },
    smoking: { 
      type: String, 
      enum: ['never', 'occasionally', 'regularly', 'trying_to_quit'],
      default: 'never'
    },
    drinking: { 
      type: String, 
      enum: ['never', 'occasionally', 'regularly', 'socially'],
      default: 'occasionally'
    },
    
    // Beruf & Bildung
    profession: { type: String },
    education: { type: String },
    
    // Standort
    country: { type: String },
    city: { type: String },
    location: { type: String }, // Legacy field
    
    // Medien
    photos: [{ type: String }],
    
    // Status
    isOnline: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now }
  },
  createdAt: { type: Date, default: Date.now },
  blockedUsers: { type: [mongoose.Schema.Types.ObjectId], ref: 'User', default: [] }
});

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

const User = mongoose.model('User', UserSchema);
const Message = mongoose.model('Message', MessageSchema);

// Migration: Add blockedUsers field to existing users
const migrateUsers = async () => {
  try {
    // First check if User model exists
    if (mongoose.models.User) {
      const User = mongoose.model('User');
      const result = await User.updateMany(
        { blockedUsers: { $exists: false } },
        { $set: { blockedUsers: [] } }
      );
      console.log('User migration completed, updated:', result.modifiedCount);
    } else {
      console.log('User model not yet available, skipping migration');
    }
  } catch (err) {
    console.error('Migration error:', err);
  }
};

// Run migration on startup
migrateUsers();

// Passport Strategies
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: GOOGLE_CALLBACK_URL
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      return done(null, user);
    }
    user = new User({
      email: profile.emails[0].value,
      googleId: profile.id,
      profile: {
        name: profile.displayName,
        age: 25,
        gender: 'other',
        bio: '',
        interests: [],
        location: '',
        photos: [profile.photos[0].value]
      }
    });
    await user.save();
    done(null, user);
  } catch (err) {
    done(err, null);
  }
}));

passport.use(new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return done(null, false, { message: 'Invalid credentials' });
    }
    done(null, user);
  } catch (err) {
    done(err);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, profile } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }
    
    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 uppercase letter' });
    }
    
    if (!/(?=.*[^A-Za-z0-9])/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 special character' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({
      email,
      password: hashedPassword,
      profile
    });
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'blovely-secret');
    res.status(201).json({ token, user: { id: user._id, email: user.email, profile: user.profile } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'blovely-secret');
    res.json({ token, user: { id: user._id, email: user.email, profile: user.profile } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    const token = jwt.sign({ userId: req.user._id }, process.env.JWT_SECRET || 'blovely-secret');
    res.redirect(`${FRONTEND_URL}/auth/success?token=${token}`);
  }
);

const authMiddleware = (req, res, next) => {
  // Try to get token from Authorization header first
  let token = req.header('Authorization')?.replace('Bearer ', '');
  
  // If no token in header, try to get from query parameters
  if (!token) {
    token = req.query.token;
  }
  
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'blovely-secret');
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Settings Routes
app.put('/api/user/alternative-email', authMiddleware, async (req, res) => {
  try {
    const { alternativeEmail } = req.body;
    const userId = req.userId;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if alternative email is already used by another user
    if (alternativeEmail) {
      const existingUser = await User.findOne({ 
        alternativeEmail, 
        _id: { $ne: userId } 
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Alternative email already in use' });
      }
    }

    // Update alternative email
    user.alternativeEmail = alternativeEmail || null;
    await user.save();

    res.json({ 
      message: 'Alternative email updated successfully',
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        alternativeEmail: user.alternativeEmail,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.put('/api/user/change-password', authMiddleware, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.userId;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    if (user.password) {
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid current password' });
      }
    } else if (user.phonePassword) {
      const isMatch = await bcrypt.compare(currentPassword, user.phonePassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid current password' });
      }
    } else {
      return res.status(400).json({ message: 'No password set' });
    }

    // Password validation for new password
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least 1 uppercase letter' });
    }
    
    if (!/(?=.*[^A-Za-z0-9])/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least 1 special character' });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password based on user type
    if (user.password) {
      user.password = hashedPassword;
    } else if (user.phonePassword) {
      user.phonePassword = hashedPassword;
    }

    await user.save();

    res.json({ 
      message: 'Password changed successfully',
      user: {
        id: user._id,
        email: user.email,
        phoneNumber: user.phoneNumber,
        alternativeEmail: user.alternativeEmail,
        profile: user.profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.delete('/api/user/delete-account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.userId;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify password
    if (user.password) {
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    } else if (user.phonePassword) {
      const isMatch = await bcrypt.compare(password, user.phonePassword);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid password' });
      }
    } else {
      return res.status(400).json({ message: 'No password set' });
    }

    // Delete user and all related data
    await User.findByIdAndDelete(userId);

    res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Forgot Password Route
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { method, phoneNumber, email, phoneMethod, emailMethod } = req.body;
    
    let user;
    
    if (method === 'phone') {
      // Find user by phone number
      user = await User.findOne({ phoneNumber });
      if (!user) {
        return res.status(404).json({ message: 'Kein Benutzer mit dieser Telefonnummer gefunden' });
      }
      
      // Store password reset request in database
      user.passwordResetRequested = true;
      user.passwordResetMethod = phoneMethod;
      user.passwordResetRequestedAt = new Date();
      user.passwordResetStatus = 'pending'; // 'pending', 'sent', 'completed'
      await user.save();
      
      console.log(`Password reset request for ${phoneNumber} via ${phoneMethod} - Status: pending`);
      
      res.json({ 
        message: `Deine Anfrage auf Passwort-Zurücksetzung per ${phoneMethod === 'whatsapp' ? 'WhatsApp' : phoneMethod === 'line' ? 'Line' : 'alternativer E-Mail'} wurde gespeichert. Wir werden dein neues Passwort so schnell wie möglich senden.` 
      });
      
    } else if (method === 'email') {
      // Find user by email or alternative email based on selection
      let emailField = emailMethod === 'alternative' ? 'alternativeEmail' : 'email';
      
      user = await User.findOne({ [emailField]: email });
      
      if (!user) {
        return res.status(404).json({ message: `Kein Benutzer mit dieser ${emailMethod === 'alternative' ? 'alternativen' : 'Haupt-'}E-Mail-Adresse gefunden` });
      }
      
      // Store password reset request in database
      user.passwordResetRequested = true;
      user.passwordResetMethod = 'email';
      user.passwordResetRequestedAt = new Date();
      user.passwordResetStatus = 'pending'; // 'pending', 'sent', 'completed'
      user.passwordResetEmailType = emailMethod; // 'primary' or 'alternative'
      await user.save();
      
      console.log(`Password reset request for ${email} (${emailMethod}) - Status: pending`);
      
      res.json({ 
        message: `Deine Anfrage auf Passwort-Zurücksetzung an deine ${emailMethod === 'alternative' ? 'alternative' : 'Haupt-'}E-Mail-Adresse wurde gespeichert. Wir werden dein neues Passwort so schnell wie möglich senden.` 
      });
    } else {
      return res.status(400).json({ message: 'Ungültige Methode' });
    }
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Reset Password Route (for admin use - when password is actually sent)
app.post('/api/reset-password', async (req, res) => {
  try {
    const { userId, newPassword } = req.body;
    
    // Find user by ID
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Password validation
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    if (!/(?=.*[A-Z])/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least 1 uppercase letter' });
    }
    
    if (!/(?=.*[^A-Za-z0-9])/.test(newPassword)) {
      return res.status(400).json({ message: 'Password must contain at least 1 special character' });
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password based on user type
    if (user.password) {
      user.password = hashedPassword;
    } else if (user.phonePassword) {
      user.phonePassword = hashedPassword;
    }
    
    // Update reset status
    user.passwordResetStatus = 'completed';
    user.passwordResetRequested = false;
    
    await user.save();
    
    res.json({ message: 'Passwort wurde erfolgreich zurückgesetzt' });
    
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Route to view pending password reset requests
app.get('/api/admin/password-reset-requests', async (req, res) => {
  try {
    const pendingRequests = await User.find({
      passwordResetRequested: true,
      passwordResetStatus: 'pending'
    }).select('email phoneNumber alternativeEmail passwordResetMethod passwordResetRequestedAt passwordResetEmailType profile.name');
    
    res.json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin Route to mark request as sent
app.put('/api/admin/password-reset-requests/:userId/sent', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    user.passwordResetStatus = 'sent';
    await user.save();
    
    res.json({ message: 'Request marked as sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Phone Authentication Routes
app.post('/api/register-phone-password', async (req, res) => {
  try {
    const { phoneNumber, password, profile } = req.body;
    
    // Check if phone number already exists
    const existingUser = await User.findOne({ phoneNumber });
    if (existingUser) {
      return res.status(400).json({ message: 'Phone number already registered' });
    }
    
    // Password validation
    if (password.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }
    
    if (!/(?=.*[A-Z])/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 uppercase letter' });
    }
    
    if (!/(?=.*[^A-Za-z0-9])/.test(password)) {
      return res.status(400).json({ message: 'Password must contain at least 1 special character' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Create new user with phone number and password
    const user = new User({
      phoneNumber,
      phonePassword: hashedPassword,
      profile
    });
    
    await user.save();
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'blovely-secret');
    
    res.status(201).json({ 
      message: 'Account created successfully',
      token, 
      user: { 
        id: user._id, 
        phoneNumber: user.phoneNumber, 
        profile: user.profile 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.post('/api/login-phone-password', async (req, res) => {
  try {
    const { phoneNumber, password } = req.body;
    
    // Find user by phone number
    const user = await User.findOne({ phoneNumber });
    if (!user) {
      return res.status(400).json({ message: 'Phone number not registered' });
    }
    
    // Check if account is locked (3 failed attempts)
    if (user.pinAttempts >= 3) {
      return res.status(400).json({ message: 'Account locked due to too many failed attempts' });
    }
    
    // Verify password
    const isMatch = await bcrypt.compare(password, user.phonePassword);
    if (!isMatch) {
      user.pinAttempts += 1;
      await user.save();
      
      if (user.pinAttempts >= 3) {
        return res.status(400).json({ message: 'Account locked due to too many failed attempts' });
      }
      
      return res.status(400).json({ message: 'Invalid password' });
    }
    
    // Reset attempts on successful login
    user.pinAttempts = 0;
    await user.save();
    
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'blovely-secret');
    
    res.json({ 
      token, 
      user: { 
        id: user._id, 
        phoneNumber: user.phoneNumber, 
        profile: user.profile 
      } 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

app.get('/api/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ profile: user.profile });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/profile', authMiddleware, async (req, res) => {
  try {
    const { profile } = req.body;
    await User.findByIdAndUpdate(req.userId, { profile });
    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/search', authMiddleware, async (req, res) => {
  try {
    const { 
      ageMin, ageMax, gender, country, city,
      heightMin, heightMax, weightMin, weightMax, bodyType,
      ethnicity, religion, maritalStatus, hasChildren, smoking, drinking,
      withPhotosOnly, onlineOnly
    } = req.query;
    
    const searchUser = await User.findById(req.userId);
    
    let query = { _id: { $ne: searchUser._id } };
    
    console.log('Search query initial:', query);
    console.log('Current user ID:', searchUser._id);
    
    // Basis-Filter
    if (ageMin || ageMax) {
      query['profile.age'] = {};
      if (ageMin) query['profile.age'].$gte = parseInt(ageMin);
      if (ageMax) query['profile.age'].$lte = parseInt(ageMax);
    }
    
    if (gender && gender !== 'all') {
      query['profile.gender'] = gender;
    }
    
    if (country) {
      query['profile.country'] = new RegExp(country, 'i');
    }
    
    if (city) {
      query['profile.city'] = new RegExp(city, 'i');
    }
    
    // Körperliche Merkmale
    if (heightMin || heightMax) {
      query['profile.height'] = {};
      if (heightMin) query['profile.height'].$gte = parseInt(heightMin);
      if (heightMax) query['profile.height'].$lte = parseInt(heightMax);
    }
    
    if (weightMin || weightMax) {
      query['profile.weight'] = {};
      if (weightMin) query['profile.weight'].$gte = parseInt(weightMin);
      if (weightMax) query['profile.weight'].$lte = parseInt(weightMax);
    }
    
    if (bodyType && bodyType !== 'all') {
      query['profile.bodyType'] = bodyType;
    }
    
    // Persönliche Merkmale
    if (ethnicity) {
      query['profile.ethnicity'] = new RegExp(ethnicity, 'i');
    }
    
    if (religion) {
      query['profile.religion'] = new RegExp(religion, 'i');
    }
    
    if (maritalStatus && maritalStatus !== 'all') {
      query['profile.maritalStatus'] = maritalStatus;
    }
    
    if (hasChildren && hasChildren !== 'all') {
      query['profile.hasChildren'] = hasChildren === 'true';
    }
    
    if (smoking && smoking !== 'all') {
      query['profile.smoking'] = smoking;
    }
    
    if (drinking && drinking !== 'all') {
      query['profile.drinking'] = drinking;
    }
    
    // Zusätzliche Optionen
    if (withPhotosOnly === 'true') {
      query['profile.photos'] = { $exists: true, $ne: [] };
    }
    
    if (onlineOnly === 'true') {
      query['profile.isOnline'] = true;
    }
    
    // Exclude blocked users and users who blocked current user
    const currentUser = await User.findById(req.userId);
    const blockedByOthers = await User.find({ blockedUsers: req.userId }).select('_id');
    const blockedUserIds = [
      ...(currentUser.blockedUsers || []),
      ...blockedByOthers.map(user => user._id.toString())
    ];
    
    console.log('Blocked user IDs:', blockedUserIds);
    
    if (blockedUserIds.length > 0) {
      query._id = { $nin: blockedUserIds };
    }
    
    console.log('Final search query:', query);
    
    const users = await User.find(query).select('-password -googleId');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/messages/:userId', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.userId, receiver: req.params.userId },
        { sender: req.params.userId, receiver: req.userId }
      ]
    }).populate('sender receiver', 'profile.name profile.photos').sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/conversations', authMiddleware, async (req, res) => {
  try {
    // Get all messages where current user is sender or receiver
    const messages = await Message.find({
      $or: [
        { sender: req.userId },
        { receiver: req.userId }
      ]
    }).populate('sender receiver', 'profile.name profile.photos').sort({ createdAt: -1 });

    // Group by conversation partner and get latest message
    const conversations = {};
    messages.forEach(message => {
      const partnerId = message.sender._id.toString() === req.userId 
        ? message.receiver._id.toString() 
        : message.sender._id.toString();
      
      if (!conversations[partnerId] || message.createdAt > conversations[partnerId].createdAt) {
        conversations[partnerId] = {
          user: message.sender._id.toString() === req.userId ? message.receiver : message.sender,
          lastMessage: message,
          unreadCount: 0
        };
      }
    });

    res.json(Object.values(conversations));
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Block/Unblock User APIs
app.post('/api/block/:userId', authMiddleware, async (req, res) => {
  try {
    const userToBlock = req.params.userId;
    await User.findByIdAndUpdate(req.userId, {
      $addToSet: { blockedUsers: userToBlock }
    });
    res.json({ message: 'User blocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/unblock/:userId', authMiddleware, async (req, res) => {
  try {
    const userToUnblock = req.params.userId;
    await User.findByIdAndUpdate(req.userId, {
      $pull: { blockedUsers: userToUnblock }
    });
    res.json({ message: 'User unblocked successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/blocked-users', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('blockedUsers', 'profile.name profile.photos');
    res.json(user.blockedUsers || []);
  } catch (err) {
    console.error('Error fetching blocked users:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Message API
app.delete('/api/messages/:messageId', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }
    
    // Only allow sender to delete their own messages
    if (message.sender.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }
    
    await Message.findByIdAndDelete(req.params.messageId);
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Test endpoint without auth
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working!', timestamp: new Date().toISOString() });
});

// Likes/Matches APIs
app.get('/api/potential-matches', authMiddleware, async (req, res) => {
  try {
    const { 
      ageMin, ageMax, gender, country, city,
      heightMin, heightMax, weightMin, weightMax, bodyType,
      ethnicity, religion, maritalStatus, hasChildren, smoking, drinking,
      withPhotosOnly, onlineOnly
    } = req.query;
    
    const currentUser = await User.findById(req.userId);
    
    // Debug: Log current user and search params
    console.log('Current user:', currentUser._id, 'Gender:', currentUser.profile.gender, 'InterestedIn:', currentUser.profile.interestedIn);
    console.log('Search params:', req.query);
    
    let query = { _id: { $ne: req.userId } };
    
    // Use same logic as search API but for potential matches
    // Basis-Filter
    if (ageMin || ageMax) {
      query['profile.age'] = {};
      if (ageMin) query['profile.age'].$gte = parseInt(ageMin);
      if (ageMax) query['profile.age'].$lte = parseInt(ageMax);
    }
    
    if (gender && gender !== 'all') {
      query['profile.gender'] = gender;
    }
    
    // Note: Removed interestedIn filter to show same results as Discover/Search
    
    if (country) {
      query['profile.country'] = new RegExp(country, 'i');
    }
    
    if (city) {
      query['profile.city'] = new RegExp(city, 'i');
    }
    
    // Körperliche Merkmale
    if (heightMin || heightMax) {
      query['profile.height'] = {};
      if (heightMin) query['profile.height'].$gte = parseInt(heightMin);
      if (heightMax) query['profile.height'].$lte = parseInt(heightMax);
    }
    
    if (weightMin || weightMax) {
      query['profile.weight'] = {};
      if (weightMin) query['profile.weight'].$gte = parseInt(weightMin);
      if (weightMax) query['profile.weight'].$lte = parseInt(weightMax);
    }
    
    if (bodyType && bodyType !== 'all') {
      query['profile.bodyType'] = bodyType;
    }
    
    // Persönliche Merkmale
    if (ethnicity) {
      query['profile.ethnicity'] = new RegExp(ethnicity, 'i');
    }
    
    if (religion) {
      query['profile.religion'] = new RegExp(religion, 'i');
    }
    
    if (maritalStatus && maritalStatus !== 'all') {
      query['profile.maritalStatus'] = maritalStatus;
    }
    
    if (hasChildren && hasChildren !== 'all') {
      query['profile.hasChildren'] = hasChildren === 'true';
    }
    
    if (smoking && smoking !== 'all') {
      query['profile.smoking'] = smoking;
    }
    
    if (drinking && drinking !== 'all') {
      query['profile.drinking'] = drinking;
    }
    
    // Zusätzliche Optionen
    if (withPhotosOnly === 'true') {
      query['profile.photos'] = { $exists: true, $ne: [] };
    }
    
    if (onlineOnly === 'true') {
      query['profile.isOnline'] = true;
    }
    
    // Debug: Log final query
    console.log('Final query:', JSON.stringify(query, null, 2));
    
    // Exclude blocked users and users who blocked current user
    const blockedByOthers = await User.find({ blockedUsers: req.userId }).select('_id');
    const blockedUserIds = [
      ...(currentUser.blockedUsers || []),
      ...blockedByOthers.map(user => user._id.toString())
    ];
    
    if (blockedUserIds.length > 0) {
      query._id = { $nin: blockedUserIds };
    }
    
    // Get users and shuffle for variety
    const users = await User.find(query).select('-password -googleId');
    console.log('Found users:', users.length);
    
    const shuffled = users.sort(() => 0.5 - Math.random());
    
    res.json(shuffled);
  } catch (err) {
    console.error('Error fetching potential matches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Like/Pass schemas
const LikeSchema = new mongoose.Schema({
  liker: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  liked: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const MatchSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now }
});

const Like = mongoose.model('Like', LikeSchema);
const Match = mongoose.model('Match', MatchSchema);

app.post('/api/like/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId;
    
    // Check if already liked
    const existingLike = await Like.findOne({ liker: currentUserId, liked: targetUserId });
    if (existingLike) {
      return res.json({ isMatch: false });
    }
    
    // Create like
    const like = new Like({ liker: currentUserId, liked: targetUserId });
    await like.save();
    
    // Check if it's a mutual like (match)
    const mutualLike = await Like.findOne({ liker: targetUserId, liked: currentUserId });
    let isMatch = false;
    
    if (mutualLike) {
      // Create match
      const existingMatch = await Match.findOne({
        $or: [
          { user1: currentUserId, user2: targetUserId },
          { user1: targetUserId, user2: currentUserId }
        ]
      });
      
      if (!existingMatch) {
        const match = new Match({ user1: currentUserId, user2: targetUserId });
        await match.save();
        isMatch = true;
      }
    }
    
    res.json({ isMatch });
  } catch (err) {
    console.error('Error liking user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/pass/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId;
    
    // Remove any existing like (if user previously liked them)
    await Like.deleteOne({ liker: currentUserId, liked: targetUserId });
    
    res.json({ success: true });
  } catch (err) {
    console.error('Error passing user:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/matches', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    
    // Get all matches for current user
    const matches = await Match.find({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ]
    }).populate('user1 user2', 'profile.name profile.age profile.photos profile.location');
    
    // Extract the matched users (not the current user)
    const matchedUsers = matches.map(match => {
      return match.user1._id.toString() === currentUserId ? match.user2 : match.user1;
    });
    
    res.json(matchedUsers);
  } catch (err) {
    console.error('Error fetching matches:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Conversation API
app.delete('/api/conversations/:userId', authMiddleware, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.userId;
    
    // Delete all messages between current user and target user
    await Message.deleteMany({
      $or: [
        { sender: currentUserId, receiver: targetUserId },
        { sender: targetUserId, receiver: currentUserId }
      ]
    });
    
    res.json({ message: 'Conversation deleted successfully' });
  } catch (err) {
    console.error('Error deleting conversation:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete Account API
app.delete('/api/account', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.userId;
    
    // Delete all messages where user is sender or receiver
    await Message.deleteMany({
      $or: [
        { sender: currentUserId },
        { receiver: currentUserId }
      ]
    });
    
    // Delete all likes where user is liker or liked
    await Like.deleteMany({
      $or: [
        { liker: currentUserId },
        { liked: currentUserId }
      ]
    });
    
    // Delete all matches where user is involved
    await Match.deleteMany({
      $or: [
        { user1: currentUserId },
        { user2: currentUserId }
      ]
    });
    
    // Delete the user account
    await User.findByIdAndDelete(currentUserId);
    
    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Socket.io for real-time chat
io.on('connection', (socket) => {
  socket.on('joinRoom', async ({ userId }) => {
    console.log('User joining room:', userId);
    
    // If userId is not a valid ObjectId, try to find user by email or googleId
    const mongoose = require('mongoose');
    let actualUserId = userId;
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      try {
        const User = mongoose.model('User');
        console.log('Searching for user with googleId:', userId);
        let user = await User.findOne({ googleId: userId });
        console.log('Found by googleId:', user);
        
        if (!user && userId.includes('@')) {
          console.log('Trying email lookup for:', userId);
          user = await User.findOne({ email: userId });
          console.log('Found by email:', user);
        }
        
        if (!user) {
          console.log('Trying to find any user...');
          const allUsers = await User.find({});
          console.log('All users in DB:', allUsers.map(u => ({ _id: u._id, email: u.email, googleId: u.googleId })));
        }
        
        if (user) {
          actualUserId = user._id.toString();
          console.log('Found actual user ID:', actualUserId);
        } else {
          console.log('Could not find valid user for:', userId);
          return;
        }
      } catch (err) {
        console.error('Error finding user:', err);
        return;
      }
    }
    
    socket.userId = actualUserId;
    socket.join(`room_${actualUserId}`);
    console.log(`User ${actualUserId} joined room_${actualUserId}`);
  });

  socket.on('sendMessage', async ({ receiverId, content }) => {
    try {
      console.log('Sending message - socket.userId:', socket.userId, 'receiverId:', receiverId);
      
      // Validate ObjectIds
      const mongoose = require('mongoose');
      if (!mongoose.Types.ObjectId.isValid(socket.userId) || !mongoose.Types.ObjectId.isValid(receiverId)) {
        console.log('Invalid IDs detected');
        throw new Error('Invalid user IDs');
      }

      // Check if users are blocked
      console.log('Looking up sender:', socket.userId);
      const sender = await User.findById(socket.userId);
      console.log('Looking up receiver:', receiverId);
      const receiver = await User.findById(receiverId);
      
      console.log('Sender found:', !!sender);
      console.log('Receiver found:', !!receiver);
      
      if (!sender || !receiver) {
        console.log('Sender or receiver not found');
        return;
      }
      
      console.log('Sender blockedUsers:', sender.blockedUsers);
      console.log('Receiver blockedUsers:', receiver.blockedUsers);
      
      const senderBlockedUsers = (sender.blockedUsers || []).map(id => id.toString());
      const receiverBlockedUsers = (receiver.blockedUsers || []).map(id => id.toString());
      
      console.log('Checking block - senderBlockedUsers:', senderBlockedUsers);
      console.log('Checking block - receiverBlockedUsers:', receiverBlockedUsers);
      console.log('Checking block - receiverId:', receiverId.toString());
      console.log('Checking block - socket.userId:', socket.userId.toString());
      
      if (senderBlockedUsers.includes(receiverId.toString()) || receiverBlockedUsers.includes(socket.userId.toString())) {
        console.log('Message BLOCKED - users are blocking each other');
        return; // Silently ignore the message
      }

      console.log('Creating message with valid IDs');
      const message = new Message({
        sender: new mongoose.Types.ObjectId(socket.userId),
        receiver: new mongoose.Types.ObjectId(receiverId),
        content,
        createdAt: new Date()
      });
      
      console.log('Saving message to database...');
      await message.save();
      console.log('Message saved successfully');
      
      console.log('Populating message...');
      await message.populate('sender receiver', 'profile.name profile.photos');
      console.log('Message populated');
      
      // Send to both sender and receiver
      console.log('Emitting messages...');
      io.to(`room_${receiverId}`).emit(`message_${receiverId}`, message);
      io.to(`room_${socket.userId}`).emit(`message_${socket.userId}`, message);
      console.log('Messages emitted');
    } catch (err) {
      console.error('Error sending message:', err);
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
