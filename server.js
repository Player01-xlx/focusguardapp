
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'dist')));

// Database setup (using in-memory storage for demo - in production, use a proper database)
let users = [];
let leaderboardData = [];
let nextUserId = 1;

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Helper functions
const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
};

const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Authentication routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, username } = req.body;

    // Validate input
    if (!email || !password || !username) {
      return res.status(400).json({ error: 'Email, password, and username are required' });
    }

    // Check if user already exists
    const existingUser = users.find(u => u.email === email || u.username === username);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists with this email or username' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = {
      id: nextUserId++,
      email,
      username,
      password: hashedPassword,
      createdAt: new Date().toISOString(),
      userProgress: {
        xp: 0,
        level: 1,
        totalFocusMinutes: 0,
        totalTasks: 0,
        totalGoalsCompleted: 0,
        streakCount: 0,
        lastStreakDate: null,
        streakFreezes: 0,
        achievements: []
      }
    };

    users.push(user);

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        userProgress: user.userProgress
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Generate token
    const token = generateToken(user.id);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        userProgress: user.userProgress
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Progress sync routes
app.post('/api/progress/sync', verifyToken, (req, res) => {
  try {
    const { userProgress, tasks, dailyGoals, history, sessionHighlights } = req.body;
    
    // Find user and update progress
    const userIndex = users.findIndex(u => u.id === req.userId);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    users[userIndex].userProgress = userProgress;
    users[userIndex].tasks = tasks;
    users[userIndex].dailyGoals = dailyGoals;
    users[userIndex].history = history;
    users[userIndex].sessionHighlights = sessionHighlights;
    users[userIndex].lastSync = new Date().toISOString();

    // Update leaderboard
    updateLeaderboard(users[userIndex]);

    res.json({ message: 'Progress synced successfully' });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/progress/load', verifyToken, (req, res) => {
  try {
    const user = users.find(u => u.id === req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userProgress: user.userProgress,
      tasks: user.tasks || [],
      dailyGoals: user.dailyGoals || [],
      history: user.history || [],
      sessionHighlights: user.sessionHighlights || []
    });
  } catch (error) {
    console.error('Load error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Leaderboard routes
app.get('/api/leaderboard', (req, res) => {
  try {
    const leaderboard = users
      .filter(user => user.userProgress && user.userProgress.xp > 0)
      .map(user => ({
        id: user.id,
        username: user.username,
        level: user.userProgress.level,
        xp: user.userProgress.xp,
        totalFocusMinutes: user.userProgress.totalFocusMinutes,
        streakCount: user.userProgress.streakCount,
        totalTasks: user.userProgress.totalTasks,
        rank: 0
      }))
      .sort((a, b) => b.xp - a.xp)
      .map((user, index) => ({ ...user, rank: index + 1 }));

    res.json(leaderboard);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper function to update leaderboard
function updateLeaderboard(user) {
  const existingIndex = leaderboardData.findIndex(entry => entry.userId === user.id);
  
  const entry = {
    userId: user.id,
    username: user.username,
    level: user.userProgress.level,
    xp: user.userProgress.xp,
    totalFocusMinutes: user.userProgress.totalFocusMinutes,
    streakCount: user.userProgress.streakCount,
    totalTasks: user.userProgress.totalTasks,
    lastUpdate: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    leaderboardData[existingIndex] = entry;
  } else {
    leaderboardData.push(entry);
  }
}

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});
