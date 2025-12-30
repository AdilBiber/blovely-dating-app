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
const socketIo = require('socket.io');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(session({
  secret: process.env.JWT_SECRET || 'blovely-secret',
  resave: false,
  saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/blovely', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// User Schema
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String },
  googleId: { type: String },
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
  callbackURL: "http://localhost:5000/auth/google/callback"
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
    res.redirect(`http://localhost:3000/auth/success?token=${token}`);
  }
);

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
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
    
    // Filter by interestedIn - only show users who are interested in current user's gender
    if (currentUser.profile.interestedIn && currentUser.profile.interestedIn !== 'all') {
      query['profile.interestedIn'] = currentUser.profile.gender;
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
