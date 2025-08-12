/*
FocusGuard - React Starter

How to use:
1) On Replit: create a new Replit using the "React" template.
2) Open `src/App.js` and replace its content with everything in this file.
3) (Optional) Replace `src/index.css` with your own styles or keep the defaults.
4) Run the Replit preview (the "Run" button). The app will appear.

What this app does (simple, beginner-friendly):
- A mobile-friendly Pomodoro-style focus timer (start / pause / reset).
- A small task list you can add items to and check off.
- Session history (saved in localStorage) with ability to download history as JSON.
- Settings to change focus / break durations.
- Uses the Browser Notifications API to notify you when a session ends (you must allow notifications).

This file is a single-file React app (default export) so it's easy to paste into Replit's src/App.js.
Comments explain each section so you can learn and modify.
*/

import React, { useState, useEffect, useRef } from "react";

// Authentication API functions
const API_BASE = process.env.NODE_ENV === 'production' ? '' : 'http://localhost:5000';

const authAPI = {
  register: async (email, password, username) => {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, username })
    });
    return response.json();
  },

  login: async (email, password) => {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  },

  syncProgress: async (token, data) => {
    const response = await fetch(`${API_BASE}/api/progress/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    return response.json();
  },

  loadProgress: async (token) => {
    const response = await fetch(`${API_BASE}/api/progress/load`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.json();
  },

  getLeaderboard: async () => {
    const response = await fetch(`${API_BASE}/api/leaderboard`);
    return response.json();
  }
};

// ---------------------- Constants & Utilities ----------------------
const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
};

const DEFAULT_CUSTOMIZATION = {
  layout: 'default', // 'default', 'compact', 'minimal'
  theme: 'blue', // 'blue', 'green', 'purple', 'orange'
  visibleSections: {
    tasks: true,
    dailyGoals: true,
    settings: true,
    history: true,
    insights: true,
    recommendations: true,
    achievements: true,
    streaks: true,
    sessionHighlights: true,
    smartReminders: true
  },
  sectionOrder: ['recommendations', 'tasks', 'dailyGoals', 'insights', 'achievements', 'streaks', 'sessionHighlights', 'smartReminders', 'settings', 'history'],
  headerButtons: {
    customize: true,
    analytics: true,
    layoutToggle: true,
    darkMode: true,
    notifications: true,
    leaderboard: true,
    auth: true
  },
  showHeaderButtons: true
};

const ACHIEVEMENTS = [
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a focus session before 9 AM', icon: '🌅', unlocked: false },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a focus session after 10 PM', icon: '🦉', unlocked: false },
  { id: 'first_session', name: 'Getting Started', description: 'Complete your first focus session', icon: '🎯', unlocked: false },
  { id: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥', unlocked: false },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintain a 7-day streak', icon: '⚡', unlocked: false },
  { id: 'hundred_minutes', name: 'Century Club', description: 'Focus for 100 minutes total', icon: '💯', unlocked: false },
  { id: 'task_master', name: 'Task Master', description: 'Complete 50 tasks', icon: '✅', unlocked: false },
  { id: 'goal_crusher', name: 'Goal Crusher', description: 'Complete all daily goals 5 times', icon: '🏆', unlocked: false },
];

const UNLOCKABLE_THEMES = {
  blue: { name: 'Ocean Blue', unlockLevel: 1, primary: '#3b82f6', secondary: '#1e40af' },
  green: { name: 'Forest Green', unlockLevel: 3, primary: '#22c55e', secondary: '#15803d' },
  purple: { name: 'Royal Purple', unlockLevel: 5, primary: '#8b5cf6', secondary: '#7c3aed' },
  orange: { name: 'Sunset Orange', unlockLevel: 8, primary: '#f97316', secondary: '#ea580c' },
  pink: { name: 'Sakura Pink', unlockLevel: 10, primary: '#ec4899', secondary: '#db2777' },
  teal: { name: 'Ocean Teal', unlockLevel: 15, primary: '#14b8a6', secondary: '#0f766e' }
};

const UNLOCKABLE_SOUNDS = {
  chime: { name: 'Gentle Chime', unlockLevel: 2 },
  bell: { name: 'Temple Bell', unlockLevel: 4 },
  nature: { name: 'Nature Sounds', unlockLevel: 6 },
  piano: { name: 'Piano Melody', unlockLevel: 9 }
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

function getXPForNextLevel(currentXP) {
  const currentLevel = calculateLevel(currentXP);
  return currentLevel * 100;
}

function getXPProgressInCurrentLevel(currentXP) {
  return currentXP % 100;
}

// ---------------------- Main App ----------------------
export default function App() {
  // Settings persisted in localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_settings");
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_darkMode");
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  // Mobile layout detection
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [forceMobileLayout, setForceMobileLayout] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_forceMobileLayout");
      return saved ? JSON.parse(saved) : false;
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    localStorage.setItem("fg_forceMobileLayout", JSON.stringify(forceMobileLayout));
  }, [forceMobileLayout]);

  // Customization state
  const [customization, setCustomization] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_customization");
      const parsed = saved ? JSON.parse(saved) : DEFAULT_CUSTOMIZATION;
      // Ensure headerButtons exists
      if (!parsed.headerButtons) {
        parsed.headerButtons = DEFAULT_CUSTOMIZATION.headerButtons;
      }
      return parsed;
    } catch (e) {
      return DEFAULT_CUSTOMIZATION;
    }
  });

  // User progress state
  const [userProgress, setUserProgress] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_userProgress");
      return saved ? JSON.parse(saved) : {
        xp: 0,
        level: 1,
        totalFocusMinutes: 0,
        totalTasks: 0,
        totalGoalsCompleted: 0,
        streakCount: 0,
        lastStreakDate: null,
        streakFreezes: 0,
        achievements: ACHIEVEMENTS
      };
    } catch (e) {
      return {
        xp: 0,
        level: 1,
        totalFocusMinutes: 0,
        totalTasks: 0,
        totalGoalsCompleted: 0,
        streakCount: 0,
        lastStreakDate: null,
        streakFreezes: 0,
        achievements: ACHIEVEMENTS
      };
    }
  });

  // Tasks (simple todo list)
  const [tasks, setTasks] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_tasks");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [taskInput, setTaskInput] = useState("");

  // Timer state
  const [mode, setMode] = useState("focus"); // 'focus' | 'short' | 'long'
  const [remaining, setRemaining] = useState(settings.focusMinutes * 60);
  const [running, setRunning] = useState(false);

  // History of sessions
  const [history, setHistory] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_history");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  // Daily goals
  const [dailyGoals, setDailyGoals] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_dailyGoals");
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [goalInput, setGoalInput] = useState("");

  // Authentication state
  const [user, setUser] = useState(() => {
    try {
      const savedAuth = localStorage.getItem("fg_auth");
      return savedAuth ? JSON.parse(savedAuth) : null;
    } catch (e) {
      return null;
    }
  });
  const [authToken, setAuthToken] = useState(() => localStorage.getItem("fg_token"));
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'register'
  const [authForm, setAuthForm] = useState({ email: '', password: '', username: '' });
  const [authError, setAuthError] = useState('');
  const [leaderboard, setLeaderboard] = useState([]);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  // UI state
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false); // New state for Analytics Dashboard
  const [showReflection, setShowReflection] = useState(false);
  const [showBreakOptions, setShowBreakOptions] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [showRewardAnimation, setShowRewardAnimation] = useState(false);

  // Session highlights
  const [sessionHighlights, setSessionHighlights] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_sessionHighlights");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_sessionHighlights", JSON.stringify(sessionHighlights));
  }, [sessionHighlights]);

  // Keep track of completed focus cycles in the current round
  const cyclesRef = useRef(0);
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Persist all state whenever they change
  useEffect(() => {
    localStorage.setItem("fg_settings", JSON.stringify(settings));
  }, [settings]);
  useEffect(() => {
    localStorage.setItem("fg_tasks", JSON.stringify(tasks));
  }, [tasks]);
  useEffect(() => {
    localStorage.setItem("fg_history", JSON.stringify(history));
  }, [history]);
  useEffect(() => {
    localStorage.setItem("fg_darkMode", JSON.stringify(isDarkMode));
  }, [isDarkMode]);
  useEffect(() => {
    localStorage.setItem("fg_dailyGoals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);
  useEffect(() => {
    localStorage.setItem("fg_customization", JSON.stringify(customization));
  }, [customization]);
  useEffect(() => {
    localStorage.setItem("fg_userProgress", JSON.stringify(userProgress));

    // Auto-sync to cloud if user is logged in
    if (user && authToken) {
      syncToCloud();
    }
  }, [userProgress]);

  useEffect(() => {
    if (user && authToken) {
      localStorage.setItem("fg_auth", JSON.stringify(user));
      localStorage.setItem("fg_token", authToken);
      loadFromCloud();
      loadLeaderboard();
    }
  }, [user, authToken]);

  // Update the remaining time if the user changes the settings
  useEffect(() => {
    if (mode === "focus") setRemaining(settings.focusMinutes * 60);
    else if (mode === "short") setRemaining(settings.shortBreakMinutes * 60);
    else setRemaining(settings.longBreakMinutes * 60);
  }, [settings, mode]);

  // Timer interval
  useEffect(() => {
    if (!running) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }
    // Start interval
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          // End of session
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          handleTimerEnd();
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    // Clean up on unmount or when running changes
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);

  function handleTimerEnd() {
    // Record session in history
    const endTime = Date.now();
    const startTime = sessionStartRef.current || (endTime - (settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60 * 1000));
    const durationSec = Math.round((endTime - startTime) / 1000);

    const sessionRecord = {
      id: generateId(),
      mode: mode,
      startTime: startTime,
      endTime: endTime,
      durationSec: durationSec,
    };
    setHistory((h) => [sessionRecord, ...h]);

    // Show reward animation
    setShowRewardAnimation(true);
    setTimeout(() => setShowRewardAnimation(false), 3000);

    // Award XP and update progress for focus sessions
    if (mode === "focus") {
      const focusMinutes = Math.round(durationSec / 60);
      const xpGained = focusMinutes * 2; // 2 XP per minute

      // Show reflection prompt
      setShowReflection(true);

      setUserProgress(prev => {
        const newXP = prev.xp + xpGained;
        const newLevel = calculateLevel(newXP);
        const newTotalMinutes = prev.totalFocusMinutes + focusMinutes;

        // Check for level up
        if (newLevel > prev.level) {
          sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
        }

        // Update streak
        const today = new Date().toISOString().slice(0, 10);
        const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
        let newStreak = prev.streakCount;

        if (prev.lastStreakDate === yesterday || prev.lastStreakDate === null) {
          newStreak = prev.lastStreakDate === yesterday ? prev.streakCount + 1 : 1;
        } else if (prev.lastStreakDate !== today) {
          newStreak = 1;
        }

        // Check achievements
        const updatedAchievements = prev.achievements.map(achievement => {
          if (achievement.unlocked) return achievement;

          const hour = new Date().getHours();
          switch (achievement.id) {
            case 'first_session':
              return { ...achievement, unlocked: true };
            case 'early_bird':
              return hour < 9 ? { ...achievement, unlocked: true } : achievement;
            case 'night_owl':
              return hour >= 22 ? { ...achievement, unlocked: true } : achievement;
            case 'streak_3':
              return newStreak >= 3 ? { ...achievement, unlocked: true } : achievement;
            case 'streak_7':
              return newStreak >= 7 ? { ...achievement, unlocked: true } : achievement;
            case 'hundred_minutes':
              return newTotalMinutes >= 100 ? { ...achievement, unlocked: true } : achievement;
            default:
              return achievement;
          }
        });

        return {
          ...prev,
          xp: newXP,
          level: newLevel,
          totalFocusMinutes: newTotalMinutes,
          streakCount: newStreak,
          lastStreakDate: today,
          achievements: updatedAchievements
        };
      });

      cyclesRef.current += 1;
    } else {
      // Show micro-break options for break sessions
      setShowBreakOptions(true);
    }

    // Decide next mode
    if (mode === "focus") {
      // If we've reached cyclesBeforeLongBreak, go to long break
      if (cyclesRef.current >= settings.cyclesBeforeLongBreak) {
        cyclesRef.current = 0; // reset
        setMode("long");
      } else {
        setMode("short");
      }
    } else {
      // from a break -> always go to focus
      setMode("focus");
    }

    // Prepare next duration (will be set by the mode effect)
    // Ask for permission and send a browser notification if allowed
    sendNotification(`Session finished`, `Mode: ${mode} — next: ${mode === "focus" ? (cyclesRef.current === 0 ? "long break" : "short break") : "focus"}`);
  }

  // Post-session reflection handler
  function saveReflection() {
    if (reflectionText.trim()) {
      const highlight = {
        id: generateId(),
        text: reflectionText.trim(),
        timestamp: Date.now(),
        sessionDuration: Math.round((Date.now() - sessionStartRef.current) / 60000)
      };
      setSessionHighlights(prev => [highlight, ...prev.slice(0, 49)]);
    }
    setReflectionText('');
    setShowReflection(false);
  }

  // Timer controls
  function startTimer() {
    if (!running) {
      sessionStartRef.current = Date.now() - ((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60 - remaining) * 1000);
      setRunning(true);
    }
  }
  function pauseTimer() {
    setRunning(false);
  }
  function resetTimer() {
    setRunning(false);
    if (mode === "focus") setRemaining(settings.focusMinutes * 60);
    else if (mode === "short") setRemaining(settings.shortBreakMinutes * 60);
    else setRemaining(settings.longBreakMinutes * 60);
    sessionStartRef.current = null;
  }

  // Smart Reminders & Automation state
  const [smartReminders, setSmartReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_smartReminders");
      return saved ? JSON.parse(saved) : {
        enabled: false,
        optimalTimes: [],
        scheduledReminders: [],
        preferences: {
          reminderTypes: ['focus', 'break', 'streak'],
          frequency: 'adaptive', // 'low', 'medium', 'high', 'adaptive'
          quietHours: { start: 22, end: 7 }
        }
      };
    } catch {
      return {
        enabled: false,
        optimalTimes: [],
        scheduledReminders: [],
        preferences: {
          reminderTypes: ['focus', 'break', 'streak'],
          frequency: 'adaptive',
          quietHours: { start: 22, end: 7 }
        }
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_smartReminders", JSON.stringify(smartReminders));
  }, [smartReminders]);

  // AI-powered optimal time analysis
  function analyzeOptimalNotificationTimes() {
    const focusSessions = history.filter(s => s.mode === 'focus');
    if (focusSessions.length < 5) return [];

    // Analyze session start times and success rates
    const hourlyPerformance = {};
    focusSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const success = session.durationSec >= (settings.focusMinutes * 60 * 0.8);

      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { total: 0, successful: 0, sessions: [] };
      }
      hourlyPerformance[hour].total++;
      if (success) hourlyPerformance[hour].successful++;
      hourlyPerformance[hour].sessions.push({
        date: new Date(session.startTime).toISOString().slice(0, 10),
        dayOfWeek: new Date(session.startTime).getDay(),
        success
      });
    });

    // Calculate optimal times based on success rate and frequency
    const optimalTimes = Object.keys(hourlyPerformance)
      .map(hour => ({
        hour: parseInt(hour),
        successRate: hourlyPerformance[hour].successful / hourlyPerformance[hour].total,
        frequency: hourlyPerformance[hour].total,
        confidence: Math.min(hourlyPerformance[hour].total / 10, 1) // Confidence based on data points
      }))
      .filter(time => time.successRate >= 0.6 && time.frequency >= 2)
      .sort((a, b) => (b.successRate * b.confidence) - (a.successRate * a.confidence))
      .slice(0, 5);

    return optimalTimes;
  }

  // Generate AI-powered reminder suggestions
  function generateSmartReminderSuggestions() {
    const suggestions = [];
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();
    const today = new Date().toISOString().slice(0, 10);

    // Check if it's quiet hours
    const isQuietHours = (currentHour >= smartReminders.preferences.quietHours.start || 
                         currentHour <= smartReminders.preferences.quietHours.end);

    const todaysSessions = history.filter(s => 
      new Date(s.startTime).toISOString().slice(0, 10) === today && s.mode === 'focus'
    );

    // Streak protection reminder
    if (smartReminders.preferences.reminderTypes.includes('streak') && 
        userProgress.streakCount >= 3 && todaysSessions.length === 0 && !isQuietHours) {
      suggestions.push({
        type: 'streak_protection',
        priority: 'high',
        title: '🔥 Streak Alert!',
        message: `Your ${userProgress.streakCount}-day streak needs attention! Quick focus session?`,
        suggestedTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
        action: () => {
          setMode('focus');
          setSettings(prev => ({ ...prev, focusMinutes: 15 }));
          resetTimer();
        }
      });
    }

    // Optimal time reminders
    const optimalTimes = analyzeOptimalNotificationTimes();
    const nextOptimalHour = optimalTimes.find(time => 
      time.hour > currentHour && time.hour < smartReminders.preferences.quietHours.start
    );

    if (nextOptimalHour && smartReminders.preferences.reminderTypes.includes('focus')) {
      const timeUntil = (nextOptimalHour.hour - currentHour) * 60 * 60 * 1000;
      suggestions.push({
        type: 'optimal_time',
        priority: 'medium',
        title: '🎯 Peak Performance Time',
        message: `${nextOptimalHour.hour}:00 is your peak focus time (${Math.round(nextOptimalHour.successRate * 100)}% success rate)`,
        suggestedTime: new Date(Date.now() + timeUntil - 15 * 60 * 1000), // 15 min before optimal time
        action: () => {
          alert(`⏰ Peak time approaching! Your historical success rate at ${nextOptimalHour.hour}:00 is ${Math.round(nextOptimalHour.successRate * 100)}%`);
        }
      });
    }

    // Break reminders for long focus sessions
    if (smartReminders.preferences.reminderTypes.includes('break') && running && remaining < 300) { // Less than 5 minutes left
      suggestions.push({
        type: 'break_preparation',
        priority: 'low',
        title: '🧘‍♀️ Break Time Soon',
        message: 'Focus session ending soon. Plan your break activity!',
        suggestedTime: new Date(Date.now() + remaining * 1000),
        action: () => {
          setShowBreakOptions(true);
        }
      });
    }

    return suggestions;
  }

  // Schedule smart reminders
  function scheduleSmartReminder(suggestion) {
    const timeUntilReminder = suggestion.suggestedTime.getTime() - Date.now();

    if (timeUntilReminder > 0) {
      const reminderId = setTimeout(() => {
        if (Notification.permission === "granted") {
          const notification = new Notification(suggestion.title, {
            body: suggestion.message,
            icon: '/favicon.svg',
            badge: '/favicon.svg'
          });

          notification.onclick = () => {
            window.focus();
            if (suggestion.action) suggestion.action();
            notification.close();
          };
        } else {
          // Fallback to browser alert
          const shouldAct = confirm(`${suggestion.title}\n\n${suggestion.message}\n\nTake action now?`);
          if (shouldAct && suggestion.action) suggestion.action();
        }

        // Remove from scheduled reminders
        setSmartReminders(prev => ({
          ...prev,
          scheduledReminders: prev.scheduledReminders.filter(r => r.id !== suggestion.id)
        }));
      }, timeUntilReminder);

      const scheduledReminder = {
        ...suggestion,
        id: Vr(),
        scheduledAt: Date.now(),
        timeoutId: reminderId
      };

      setSmartReminders(prev => ({
        ...prev,
        scheduledReminders: [...prev.scheduledReminders, scheduledReminder]
      }));

      return scheduledReminder;
    }
    return null;
  }

  // Smart notification system with AI suggestions
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        // Enable smart reminders and analyze optimal times
        const optimalTimes = analyzeOptimalNotificationTimes();

        setSmartReminders(prev => ({
          ...prev,
          enabled: true,
          optimalTimes
        }));

        // Generate and schedule initial smart reminders
        const suggestions = generateSmartReminderSuggestions();
        suggestions.forEach(suggestion => {
          scheduleSmartReminder(suggestion);
        });

        alert(`🤖 Smart Reminders Activated!\n\n✅ Notification permission granted\n📊 Analyzed ${history.filter(s => s.mode === 'focus').length} focus sessions\n🎯 Found ${optimalTimes.length} optimal time slots\n⏰ Scheduled ${suggestions.length} smart reminders\n\nAI will now suggest the best times to focus based on your habits!`);
      } else {
        alert("Notification permission denied. Smart reminders will use browser alerts instead.");
      }
    });
  }

  // Enhanced notification with smart scheduling
  function sendNotification(title, body, options = {}) {
    if (!("Notification" in window)) return;

    if (Notification.permission === "granted") {
      try {
        const notification = new Notification(title, { 
          body,
          icon: '/favicon.svg',
          badge: '/favicon.svg',
          ...options
        });

        // Auto-schedule next smart reminder after each session
        if (smartReminders.enabled && title.includes('finished')) {
          setTimeout(() => {
            const suggestions = generateSmartReminderSuggestions();
            suggestions.slice(0, 2).forEach(suggestion => { // Limit to 2 suggestions
              scheduleSmartReminder(suggestion);
            });
          }, 5000); // Wait 5 seconds after session end
        }

        return notification;
      } catch (e) {
        console.warn("Notification failed", e);
      }
    }
  }

  // Clear scheduled reminders
  function clearScheduledReminders() {
    smartReminders.scheduledReminders.forEach(reminder => {
      if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
      }
    });

    setSmartReminders(prev => ({
      ...prev,
      scheduledReminders: []
    }));
  }

  // Authentication functions
  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');

    try {
      let result;
      if (authMode === 'register') {
        result = await authAPI.register(authForm.email, authForm.password, authForm.username);
      } else {
        result = await authAPI.login(authForm.email, authForm.password);
      }

      if (result.error) {
        setAuthError(result.error);
        return;
      }

      setUser(result.user);
      setAuthToken(result.token);
      setShowAuth(false);
      setAuthForm({ email: '', password: '', username: '' });

      // Load user's cloud data
      await loadFromCloud();
    } catch (error) {
      setAuthError('Connection error. Please try again.');
      console.error('Auth error:', error);
    }
  }

  function logout() {
    setUser(null);
    setAuthToken(null);
    localStorage.removeItem("fg_auth");
    localStorage.removeItem("fg_token");
    setLeaderboard([]);
  }

  // Cloud sync functions
  async function syncToCloud() {
    if (!user || !authToken) return;

    try {
      await authAPI.syncProgress(authToken, {
        userProgress,
        tasks,
        dailyGoals,
        history,
        sessionHighlights
      });
    } catch (error) {
      console.error('Sync error:', error);
    }
  }

  async function loadFromCloud() {
    if (!user || !authToken) return;

    try {
      const data = await authAPI.loadProgress(authToken);
      if (data.error) return;

      if (data.userProgress) setUserProgress(data.userProgress);
      if (data.tasks) setTasks(data.tasks);
      if (data.dailyGoals) setDailyGoals(data.dailyGoals);
      if (data.history) setHistory(data.history);
      if (data.sessionHighlights) setSessionHighlights(data.sessionHighlights);
    } catch (error) {
      console.error('Load error:', error);
    }
  }

  async function loadLeaderboard() {
    try {
      const data = await authAPI.getLeaderboard();
      if (Array.isArray(data)) {
        setLeaderboard(data);
      }
    } catch (error) {
      console.error('Leaderboard error:', error);
    }
  }

  // Refresh leaderboard every 30 seconds
  useEffect(() => {
    if (user) {
      loadLeaderboard();
      const interval = setInterval(loadLeaderboard, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  // Tasks handlers
  function addTask() {
    const text = taskInput.trim();
    if (!text) return;
    const t = { id: generateId(), text, done: false };
    setTasks((s) => [t, ...s]);
    setTaskInput("");
  }
  function toggleTask(id) {
    setTasks((s) => s.map((t) => {
      if (t.id === id && !t.done) {
        // Task completed - award XP
        setUserProgress(prev => {
          const newXP = prev.xp + 5; // 5 XP per task
          const newLevel = calculateLevel(newXP);
          const newTotalTasks = prev.totalTasks + 1;
          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.id === 'task_master' && newTotalTasks >= 50) {
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });

          // Check for level up
          if (newLevel > prev.level) {
            sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
          }

          return {
            ...prev,
            xp: newXP,
            level: newLevel,
            totalTasks: newTotalTasks,
            achievements: updatedAchievements
          };
        });
      }
      return t.id === id ? { ...t, done: !t.done } : t;
    }));
  }
  function removeTask(id) {
    setTasks((s) => s.filter((t) => t.id !== id));
  }

  // History export
  function downloadHistory() {
    const blob = new Blob([JSON.stringify(history, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `focusguard_history_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  // Daily goals handlers
  function addDailyGoal() {
    const text = goalInput.trim();
    if (!text) return;
    const goal = { 
      id: generateId(), 
      text, 
      completed: false, 
      createdAt: new Date().toISOString().slice(0, 10) // YYYY-MM-DD format
    };
    setDailyGoals((goals) => [goal, ...goals]);
    setGoalInput("");
  }
  function toggleDailyGoal(id) {
    setDailyGoals((goals) => goals.map((goal) => {
      if (goal.id === id && !goal.completed) {
        // Goal completed - award XP
        setUserProgress(prev => {
          const newXP = prev.xp + 10; // 10 XP per goal
          const newLevel = calculateLevel(newXP);
          const newGoalsCompleted = prev.totalGoalsCompleted + 1;
          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.id === 'goal_crusher' && newGoalsCompleted >= 25) {
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });

          // Check for level up
          if (newLevel > prev.level) {
            sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
          }

          return {
            ...prev,
            xp: newXP,
            level: newLevel,
            totalGoalsCompleted: newGoalsCompleted,
            achievements: updatedAchievements
          };
        });
      }
      return goal.id === id ? { ...goal, completed: !goal.completed } : goal;
    }));
  }
  function removeDailyGoal(id) {
    setDailyGoals((goals) => goals.filter((goal) => goal.id !== id));
  }
  function clearOldGoals() {
    const today = new Date().toISOString().slice(0, 10);
    setDailyGoals((goals) => goals.filter((goal) => goal.createdAt === today));
  }

  // Get today's goals
  const todayGoals = dailyGoals.filter(goal => goal.createdAt === new Date().toISOString().slice(0, 10));
  const completedTodayGoals = todayGoals.filter(goal => goal.completed);

  // Progress calculations
  const completedTasks = tasks.filter(task => task.done);
  const taskProgress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;
  const goalProgress = todayGoals.length > 0 ? (completedTodayGoals.length / todayGoals.length) * 100 : 0;

  // Progress bar component
  function ProgressBar({ progress, total, completed }) {
    return (
      <div style={{ marginBottom: 12 }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          fontSize: 12, 
          color: isDarkMode ? "#999" : "#666",
          marginBottom: 4 
        }}>
          <span>Progress: {completed}/{total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{
          width: '100%',
          height: 8,
          backgroundColor: isDarkMode ? '#30363d' : '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: getThemeColor(),
            transition: 'width 0.3s ease',
            borderRadius: 4
          }} />
        </div>
      </div>
    );
  }

  // Get current theme color
  function getThemeColor() {
    const theme = UNLOCKABLE_THEMES[customization.theme];
    return theme ? theme.primary : '#22c55e';
  }

  // AI-Powered Recommendations System
  function getAIRecommendations() {
    const recommendations = [];
    const recentSessions = history.slice(0, 20);
    const focusSessions = recentSessions.filter(s => s.mode === 'focus');
    const completedSessions = focusSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8);
    const completionRate = focusSessions.length > 0 ? completedSessions.length / focusSessions.length : 0;

    // Analyze session patterns
    const sessionTimes = focusSessions.map(s => new Date(s.startTime).getHours());
    const hourCounts = sessionTimes.reduce((acc, hour) => {
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {});
    const peakHour = Object.keys(hourCounts).reduce((a, b) => hourCounts[a] > hourCounts[b] ? a : b, 0);

    // Session length optimization
    if (completionRate < 0.6 && settings.focusMinutes > 15) {
      recommendations.push({
        type: 'optimization',
        title: 'Reduce Session Length',
        description: `Your completion rate is ${Math.round(completionRate * 100)}%. Try ${Math.max(15, settings.focusMinutes - 10)}-minute sessions for better success.`,
        action: () => setSettings(prev => ({ ...prev, focusMinutes: Math.max(15, settings.focusMinutes - 10) })),
        priority: 'high',
        icon: '⏱️'
      });
    }

    if (completionRate > 0.9 && settings.focusMinutes < 50) {
      recommendations.push({
        type: 'optimization',
        title: 'Increase Session Length',
        description: `Excellent ${Math.round(completionRate * 100)}% completion rate! Try ${settings.focusMinutes + 10}-minute sessions for deeper focus.`,
        action: () => setSettings(prev => ({ ...prev, focusMinutes: Math.min(50, settings.focusMinutes + 10) })),
        priority: 'medium',
        icon: '🚀'
      });
    }

    // Peak time recommendations
    if (focusSessions.length >= 5 && peakHour) {
      const currentHour = new Date().getHours();
      if (Math.abs(currentHour - peakHour) <= 1) {
        recommendations.push({
          type: 'timing',
          title: 'Perfect Timing!',
          description: `${peakHour}:00 is your peak focus time. You're ${Math.round(hourCounts[peakHour] / focusSessions.length * 100)}% more productive now.`,
          action: () => {
            setMode('focus');
            resetTimer();
          },
          priority: 'high',
          icon: '🎯'
        });
      } else if (Math.abs(currentHour - peakHour) <= 3) {
        recommendations.push({
          type: 'timing',
          title: 'Approaching Peak Time',
          description: `Your peak focus time is ${peakHour}:00. Consider scheduling important tasks then.`,
          action: null,
          priority: 'low',
          icon: '📅'
        });
      }
    }

    // Task management suggestions
    const overdueTasks = tasks.filter(t => !t.done).length;
    const taskCompletionRate = tasks.length > 0 ? tasks.filter(t => t.done).length / tasks.length : 0;

    if (overdueTasks > 5) {
      recommendations.push({
        type: 'productivity',
        title: 'Task Overload Detected',
        description: `You have ${overdueTasks} pending tasks. Consider breaking large tasks into smaller ones.`,
        action: () => alert('💡 Tip: Break large tasks into 25-minute chunks. Each small win builds momentum!'),
        priority: 'medium',
        icon: '📋'
      });
    }

    if (taskCompletionRate < 0.3 && tasks.length > 3) {
      recommendations.push({
        type: 'productivity',
        title: 'Focus on Task Completion',
        description: `Low task completion rate (${Math.round(taskCompletionRate * 100)}%). Try focusing on 2-3 important tasks.`,
        action: () => alert('💡 Tip: Use the 1-3-5 rule: 1 big thing, 3 medium things, 5 small things per day.'),
        priority: 'medium',
        icon: '✅'
      });
    }

    // Streak protection and motivation
    if (userProgress.streakCount >= 5) {
      const today = new Date().toISOString().slice(0, 10);
      const todaysSessions = history.filter(s => 
        new Date(s.startTime).toISOString().slice(0, 10) === today && s.mode === 'focus'
      );

      if (todaysSessions.length === 0 && new Date().getHours() >= 18) {
        recommendations.push({
          type: 'streak',
          title: 'Streak Alert!',
          description: `Protect your ${userProgress.streakCount}-day streak! Quick 15-minute session before bed?`,
          action: () => {
            setSettings(prev => ({ ...prev, focusMinutes: 15 }));
            setMode('focus');
            resetTimer();
          },
          priority: 'high',
          icon: '🔥'
        });
      }
    }

    // Theme and customization suggestions
    const unlockedThemes = Object.entries(UNLOCKABLE_THEMES).filter(([_, theme]) => userProgress.level >= theme.unlockLevel);
    if (unlockedThemes.length > 1 && customization.theme === 'blue') {
      recommendations.push({
        type: 'customization',
        title: 'New Themes Available',
        description: `You've unlocked ${unlockedThemes.length} themes! Try a new look to stay motivated.`,
        action: () => setShowCustomization(true),
        priority: 'low',
        icon: '🎨'
      });
    }

    // Weekly goal setting
    const thisWeekSessions = history.filter(s => {
      const sessionDate = new Date(s.startTime);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return sessionDate >= weekStart && s.mode === 'focus';
    });

    if (thisWeekSessions.length >= 10) {
      recommendations.push({
        type: 'achievement',
        title: 'Weekly Goal Crusher!',
        description: `${thisWeekSessions.length} focus sessions this week! You're building excellent habits.`,
        action: null,
        priority: 'low',
        icon: '🏆'
      });
    } else if (thisWeekSessions.length < 3 && new Date().getDay() >= 3) {
      recommendations.push({
        type: 'motivation',
        title: 'Weekly Boost Needed',
        description: `Only ${thisWeekSessions.length} sessions this week. Small consistent efforts lead to big results!`,
        action: () => {
          setMode('focus');
          resetTimer();
        },
        priority: 'medium',
        icon: '💪'
      });
    }

    // Break frequency optimization
    const breakSessions = history.filter(s => s.mode !== 'focus');
    const breakToFocusRatio = focusSessions.length > 0 ? breakSessions.length / focusSessions.length : 0;

    if (breakToFocusRatio < 0.5) {
      recommendations.push({
        type: 'wellness',
        title: 'Take More Breaks',
        description: 'Regular breaks improve focus quality. Try following your focus sessions with short breaks.',
        action: () => alert('💡 Remember: Breaks aren\'t lazy time—they\'re brain maintenance time!'),
        priority: 'medium',
        icon: '🧘‍♀️'
      });
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]).slice(0, 5);
  }

  // Customization handlers
  function updateCustomization(key, value) {
    setCustomization(prev => {
      const updated = { ...prev, [key]: value };
      // Ensure headerButtons always exists
      if (!updated.headerButtons) {
        updated.headerButtons = DEFAULT_CUSTOMIZATION.headerButtons;
      }
      return updated;
    });
  }

  function toggleSectionVisibility(section) {
    setCustomization(prev => ({
      ...prev,
      visibleSections: {
        ...prev.visibleSections,
        [section]: !prev.visibleSections[section]
      }
    }));
  }

  function moveSectionUp(index) {
    if (index > 0) {
      setCustomization(prev => {
        const newOrder = [...prev.sectionOrder];
        [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
        return { ...prev, sectionOrder: newOrder };
      });
    }
  }

  function moveSectionDown(index) {
    if (index < customization.sectionOrder.length - 1) {
      setCustomization(prev => {
        const newOrder = [...prev.sectionOrder];
        [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
        return { ...prev, sectionOrder: newOrder };
      });
    }
  }

  // Settings UI handlers
  function updateSetting(key, value) {
    setSettings((s) => ({ ...s, [key]: Number(value) }));
  }

  // Adaptive Focus Scheduling & Smart Insights
  function getAdaptiveSessionLength() {
    const recentSessions = history.slice(0, 10).filter(s => s.mode === 'focus');
    if (recentSessions.length < 3) return settings.focusMinutes;

    const completedSessions = recentSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8);
    const completionRate = completedSessions.length / recentSessions.length;

    if (completionRate < 0.6) {
      return Math.max(10, Math.floor(settings.focusMinutes * 0.8)); // Shorter sessions
    } else if (completionRate > 0.9) {
      return Math.min(60, Math.floor(settings.focusMinutes * 1.2)); // Longer sessions
    }
    return settings.focusMinutes;
  }

  function getSmartTimeSlots() {
    const focusSessions = history.filter(s => s.mode === 'focus');
    if (focusSessions.length < 5) return [];

    const hourPerformance = {};
    focusSessions.forEach(session => {
      const hour = new Date(session.startTime).getHours();
      const completionRate = session.durationSec >= (settings.focusMinutes * 60 * 0.8) ? 1 : 0;
      if (!hourPerformance[hour]) hourPerformance[hour] = { total: 0, completed: 0 };
      hourPerformance[hour].total++;
      hourPerformance[hour].completed += completionRate;
    });

    return Object.keys(hourPerformance)
      .map(hour => ({
        hour: parseInt(hour),
        rate: hourPerformance[hour].completed / hourPerformance[hour].total,
        count: hourPerformance[hour].total
      }))
      .filter(slot => slot.count >= 2 && slot.rate >= 0.7)
      .sort((a, b) => b.rate - a.rate)
      .slice(0, 3);
  }

  function getSmartInsights() {
    const recentSessions = history.slice(0, 20);
    const focusSessions = recentSessions.filter(s => s.mode === 'focus');
    const smartSlots = getSmartTimeSlots();
    const adaptiveLength = getAdaptiveSessionLength();

    let insights = [];

    // Adaptive session length suggestion
    if (adaptiveLength !== settings.focusMinutes) {
      insights.push({
        type: 'suggestion',
        message: adaptiveLength < settings.focusMinutes 
          ? `Based on your recent performance, try shorter ${adaptiveLength}-minute sessions.`
          : `You're doing great! Try extending to ${adaptiveLength}-minute sessions.`,
        action: 'Apply Suggestion'
      });
    }

    // Smart time slot suggestions
    const currentHour = new Date().getHours();
    const bestSlot = smartSlots.find(slot => Math.abs(slot.hour - currentHour) <= 1);
    if (bestSlot) {
      insights.push({
        type: 'suggestion',
        message: `You have ${Math.round(bestSlot.rate * 100)}% success rate at ${bestSlot.hour}:00. Great time to focus!`,
        action: 'Start Smart Session'
      });
    }

    // Streak protection
    if (userProgress.streakCount >= 3) {
      const today = new Date().toISOString().slice(0, 10);
      const todaysSessions = history.filter(s => 
        new Date(s.startTime).toISOString().slice(0, 10) === today && s.mode === 'focus'
      );

      if (todaysSessions.length === 0) {
        insights.push({
          type: 'warning',
          message: `Protect your ${userProgress.streakCount}-day streak! Complete a focus session today.`,
          action: 'Start Session'
        });
      }
    }

    // Monthly goal forecast
    const monthlyGoal = userProgress.level * 20;
    const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
    const currentDay = new Date().getDate();
    const remainingDays = daysInMonth - currentDay;
    const hoursNeeded = Math.max(0, monthlyGoal - (userProgress.totalFocusMinutes / 60));

    if (hoursNeeded > 0 && remainingDays > 0) {
      const hoursPerDay = Math.ceil(hoursNeeded / remainingDays * 10) / 10;
      insights.push({
        type: 'forecast',
        message: `${hoursNeeded.toFixed(1)} hours left to reach your monthly goal. Aim for ${hoursPerDay} hours/day.`,
        action: 'View Progress'
      });
    }

    return insights;
  }

  // Render sections based on customization
  function renderSection(sectionKey) {
    if (!customization.visibleSections[sectionKey]) return null;

    switch (sectionKey) {
      case 'tasks':
        return (
          <div key="tasks" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Tasks</h3>
            <ProgressBar 
              progress={taskProgress} 
              total={tasks.length} 
              completed={completedTasks.length} 
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a task (e.g. study chapter 3)"
                style={currentStyles.input}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              />
              <button style={currentStyles.btn} onClick={addTask}>Add</button>
            </div>
            <div style={{ marginTop: 12, maxHeight: 240, overflow: "auto" }}>
              {tasks.length === 0 ? (
                <div style={{ color: isDarkMode ? "#999" : "#666" }}>No tasks yet.</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} style={currentStyles.taskRow}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                      <div style={{ flex: 1, textDecoration: t.done ? "line-through" : "none" }}>{t.text}</div>
                      <button style={currentStyles.iconBtn} onClick={() => removeTask(t.id)}>✖</button>
                    </label>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'dailyGoals':
        return (
          <div key="dailyGoals" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Daily Goals</h3>
            <ProgressBar 
              progress={goalProgress} 
              total={todayGoals.length} 
              completed={completedTodayGoals.length} 
            />
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a daily goal (e.g. finish report)"
                style={currentStyles.input}
                onKeyDown={(e) => { if (e.key === "Enter") addDailyGoal(); }}
              />
              <button style={currentStyles.btn} onClick={addDailyGoal}>Add</button>
            </div>
            <div style={{ marginTop: 12, maxHeight: 200, overflow: "auto" }}>
              {todayGoals.length === 0 ? (
                <div style={{ color: isDarkMode ? "#999" : "#666" }}>No daily goals yet.</div>
              ) : (
                todayGoals.map((goal) => (
                  <div key={goal.id} style={currentStyles.taskRow}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                      <input type="checkbox" checked={goal.completed} onChange={() => toggleDailyGoal(goal.id)} />
                      <div style={{ flex: 1, textDecoration: goal.completed ? "line-through" : "none", fontWeight: goal.completed ? "normal" : "500" }}>
                        {goal.text}
                      </div>
                      <button style={currentStyles.iconBtn} onClick={() => removeDailyGoal(goal.id)}>✖</button>
                    </label>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={currentStyles.btn} onClick={clearOldGoals}>Clear Old Goals</button>
            </div>
          </div>
        );

      case 'insights':
        const insights = getSmartInsights();
        return (
          <div key="insights" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Smart Insights 🧠</h3>
            {insights.length === 0 ? (
              <div style={{ color: isDarkMode ? "#999" : "#666" }}>Complete more sessions to see insights.</div>
            ) : (
              insights.map((insight, index) => (
                <div key={index} style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  marginBottom: 8,
                  backgroundColor: insight.type === 'warning' ? (isDarkMode ? '#5d1a1a' : '#fef2f2') : 
                                 insight.type === 'suggestion' ? (isDarkMode ? '#1a5d2e' : '#f0fdf4') :
                                 (isDarkMode ? '#1a2d5d' : '#f0f9ff'),
                  border: `1px solid ${insight.type === 'warning' ? '#dc2626' : 
                                      insight.type === 'suggestion' ? getThemeColor() : '#3b82f6'}`
                }}>
                  <div style={{ fontSize: 13, marginBottom: 4 }}>{insight.message}</div>
                  {insight.action && (
                    <button 
                      style={{ ...currentStyles.smallBtn, fontSize: 11 }}
                      onClick={() => {
                        if (insight.action.includes('Start')) {
                          setMode('focus');
                          resetTimer();
                        } else if (insight.action === 'Apply Suggestion') {
                          const adaptiveLength = getAdaptiveSessionLength();
                          setSettings(prev => ({ ...prev, focusMinutes: adaptiveLength }));
                        }
                      }}
                    >
                      {insight.action}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );

      case 'recommendations':
        const recommendations = getAIRecommendations();
        return (
          <div key="recommendations" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🤖 AI Recommendations</h3>
            {recommendations.length === 0 ? (
              <div style={{ color: isDarkMode ? "#999" : "#666" }}>Use the app more to get personalized AI recommendations!</div>
            ) : (
              recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: 10,
                  borderRadius: 8,
                  marginBottom: 10,
                  backgroundColor: rec.priority === 'high' ? (isDarkMode ? '#5d1a1a' : '#fef2f2') :
                                 rec.priority === 'medium' ? (isDarkMode ? '#1a5d2e' : '#f0fdf4') :
                                 (isDarkMode ? '#1a2d5d' : '#f0f9ff'),
                  border: `1px solid ${rec.priority === 'high' ? '#f59e0b' :
                                      rec.priority === 'medium' ? getThemeColor() : '#3b82f6'}`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 6,
                    right: 6,
                    fontSize: 10,
                    fontWeight: 600,
                    color: rec.priority === 'high' ? '#f59e0b' :
                           rec.priority === 'medium' ? getThemeColor() : '#3b82f6',
                    textTransform: 'uppercase'
                  }}>
                    {rec.priority}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 6 }}>
                    <span style={{ fontSize: 18 }}>{rec.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{rec.title}</div>
                      <div style={{ fontSize: 12, color: isDarkMode ? "#ccc" : "#555", lineHeight: 1.4 }}>
                        {rec.description}
                      </div>
                    </div>
                  </div>
                  {rec.action && (
                    <button
                      style={{
                        ...currentStyles.smallBtn,
                        fontSize: 11,
                        marginTop: 6,
                        backgroundColor: rec.priority === 'high' ? '#f59e0b' :
                                       rec.priority === 'medium' ? getThemeColor() : '#3b82f6',
                        color: '#fff',
                        border: 'none'
                      }}
                      onClick={rec.action}
                    >
                      Apply Recommendation
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );

      case 'achievements':
        const unlockedAchievements = userProgress.achievements.filter(a => a.unlocked);
        return (
          <div key="achievements" style={currentStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Achievements 🏆</h3>
              {user && (
                <div style={{ 
                  fontSize: 10, 
                  color: getThemeColor(),
                  backgroundColor: isDarkMode ? '#1a5d2e' : '#f0fdf4',
                  padding: '2px 6px',
                  borderRadius: 4,
                  border: `1px solid ${getThemeColor()}`
                }}>
                  ☁️ SYNCED
                </div>
              )}
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>Level {calculateLevel(userProgress.xp)}</div>
              <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666", marginBottom: 4 }}>
                {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
              </div>
              <div style={{
                width: '100%',
                height: 6,
                backgroundColor: isDarkMode ? '#30363d' : '#e0e0e0',
                borderRadius: 3
              }}>
                <div style={{
                  width: `${(getXPProgressInCurrentLevel(userProgress.xp) / 100) * 100}%`,
                  height: '100%',
                  backgroundColor: getThemeColor(),
                  borderRadius: 3
                }} />
              </div>
            </div>
            <div style={{ maxHeight: 150, overflow: 'auto' }}>
              {unlockedAchievements.length === 0 ? (
                <div style={{ color: isDarkMode ? "#999" : "#666" }}>No achievements yet. Start focusing!</div>
              ) : (
                unlockedAchievements.map(achievement => (
                  <div key={achievement.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 6,
                    borderRadius: 4,
                    backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
                    marginBottom: 4
                  }}>
                    <span style={{ fontSize: 20 }}>{achievement.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{achievement.name}</div>
                      <div style={{ fontSize: 11, color: isDarkMode ? "#999" : "#666" }}>{achievement.description}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'streaks':
        return (
          <div key="streaks" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Streaks & Stats 📊</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getThemeColor() }}>
                  {userProgress.streakCount}
                </div>
                <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getThemeColor() }}>
                  {Math.round(userProgress.totalFocusMinutes)}
                </div>
                <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>Total Minutes</div>
              </div>
            </div>
            {userProgress.streakFreezes > 0 && (
              <div style={{ 
                marginTop: 8, 
                padding: 6, 
                borderRadius: 4, 
                backgroundColor: isDarkMode ? '#2d1b69' : '#f3f4f6',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 12 }}>🛡️ {userProgress.streakFreezes} Streak Freezes Available</div>
              </div>
            )}
          </div>
        );

      case 'settings':
        return (
          <div key="settings" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Settings</h3>
            <div style={{ display: "grid", gap: 8 }}>
              <label style={currentStyles.rowLabel}>Focus minutes
                <input type="number" min={1} value={settings.focusMinutes} onChange={(e) => updateSetting("focusMinutes", e.target.value)} style={currentStyles.smallInput} />
              </label>
              <label style={currentStyles.rowLabel}>Short break minutes
                <input type="number" min={1} value={settings.shortBreakMinutes} onChange={(e) => updateSetting("shortBreakMinutes", e.target.value)} style={currentStyles.smallInput} />
              </label>
              <label style={currentStyles.rowLabel}>Long break minutes
                <input type="number" min={1} value={settings.longBreakMinutes} onChange={(e) => updateSetting("longBreakMinutes", e.target.value)} style={currentStyles.smallInput} />
              </label>
              <label style={currentStyles.rowLabel}>Cycles before long break
                <input type="number" min={1} value={settings.cyclesBeforeLongBreak} onChange={(e) => updateSetting("cyclesBeforeLongBreak", e.target.value)} style={currentStyles.smallInput} />
              </label>
            </div>
          </div>
        );

      case 'history':
        return (
          <div key="history" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Session History</h3>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {history.length === 0 ? (
                <div style={{ color: isDarkMode ? "#999" : "#666" }}>No sessions yet — start a focus session.</div>
              ) : (
                history.map((s) => (
                  <div key={s.id} style={currentStyles.historyRow}>
                    <div>
                      <strong>{s.mode === "focus" ? "Focus" : s.mode === "short" ? "Short Break" : "Long Break"}</strong>
                      <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>{new Date(s.startTime).toLocaleString()}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>{formatTime(s.durationSec)}</div>
                  </div>
                ))
              )}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button style={currentStyles.btn} onClick={() => setHistory([])}>Clear History</button>
              <button style={currentStyles.btn} onClick={downloadHistory}>Download JSON</button>
            </div>
          </div>
        );

      case 'sessionHighlights':
        return (
          <div key="sessionHighlights" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Session Highlights 📝</h3>
            <div style={{ maxHeight: 180, overflow: "auto" }}>
              {sessionHighlights.length === 0 ? (
                <div style={{ color: isDarkMode ? "#999" : "#666" }}>Complete focus sessions and reflect to build your productivity journal.</div>
              ) : (
                sessionHighlights.map((highlight) => (
                  <div key={highlight.id} style={{
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 8,
                    backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
                    border: `1px solid ${isDarkMode ? '#30363d' : '#e0e0e0'}`
                  }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{highlight.text}</div>
                    <div style={{ fontSize: 11, color: isDarkMode ? "#999" : "#666" }}>
                      {highlight.sessionDuration}min session • {new Date(highlight.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
            <button style={currentStyles.btn} onClick={() => setSessionHighlights([])}>Clear Highlights</button>
          </div>
        );

      case 'smartReminders':
        return (
          <div key="smartReminders" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🤖 Smart Reminders</h3>
            {smartReminders.enabled ? (
              <div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  backgroundColor: isDarkMode ? '#1a5d2e' : '#f0fdf4',
                  border: '1px solid #22c55e',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>✅ Active</div>
                  <div style={{ fontSize: 12, color: isDarkMode ? "#ccc" : "#666" }}>
                    {smartReminders.optimalTimes.length} optimal times identified
                  </div>
                  <div style={{ fontSize: 12, color: isDarkMode ? "#ccc" : "#666" }}>
                    {smartReminders.scheduledReminders.length} reminders scheduled
                  </div>
                </div>

                {smartReminders.optimalTimes.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>📊 Your Peak Times:</div>
                    {smartReminders.optimalTimes.slice(0, 3).map((time, index) => (
                      <div key={index} style={{
                        fontSize: 12,
                        padding: 4,
                        backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
                        borderRadius: 4,
                        marginBottom: 4,
                        display: 'flex',
                        justifyContent: 'space-between'
                      }}>
                        <span>{time.hour}:00</span>
                        <span>{Math.round(time.successRate * 100)}% success</span>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Reminder Types:</div>
                  {['focus', 'break', 'streak'].map(type => (
                    <label key={type} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: 12,
                      marginBottom: 4 
                    }}>
                      <input
                        type="checkbox"
                        checked={smartReminders.preferences.reminderTypes.includes(type)}
                        onChange={(e) => {
                          const isChecked = e.target.checked;
                          setSmartReminders(prev => ({
                            ...prev,
                            preferences: {
                              ...prev.preferences,
                              reminderTypes: isChecked 
                                ? [...prev.preferences.reminderTypes, type]
                                : prev.preferences.reminderTypes.filter(t => t !== type)
                            }
                          }));
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{type} Reminders</span>
                    </label>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <button 
                    style={{...currentStyles.smallBtn, flex: 1 }}
                    onClick={() => {
                      const suggestions = generateSmartReminderSuggestions();
                      suggestions.slice(0, 3).forEach(scheduleSmartReminder);
                      alert(`🤖 Scheduled ${suggestions.length} new smart reminders!`);
                    }}
                  >
                    ⚡ Generate Now
                  </button>
                  <button 
                    style={{...currentStyles.smallBtn, flex: 1 }}
                    onClick={() => {
                      clearScheduledReminders();
                      setSmartReminders(prev => ({ ...prev, enabled: false }));
                      alert('🔕 Smart reminders disabled');
                    }}
                  >
                    🔕 Disable
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: isDarkMode ? "#999" : "#666", marginBottom: 12 }}>
                  AI analyzes your focus patterns to suggest optimal notification times and automatically schedule smart reminders.
                </p>
                <div style={{ fontSize: 12, color: isDarkMode ? "#ccc" : "#777", marginBottom: 12 }}>
                  <div>🧠 Learns from {history.filter(s => s.mode === 'focus').length} focus sessions</div>
                  <div>📈 Identifies peak performance times</div>
                  <div>⏰ Schedules personalized reminders</div>
                  <div>🎯 Protects streaks intelligently</div>
                </div>
                <button 
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    ...(smartReminders.enabled ? {
                      backgroundColor: getThemeColor(),
                      color: '#fff',
                      border: `1px solid ${getThemeColor()}`
                    } : {})
                  }} 
                  onClick={requestNotificationPermission}
                >
                  🤖 Enable Smart Reminders
                </button>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  }

  // Check if should use mobile layout
  const useMobileLayout = isMobile || forceMobileLayout;

  // ---------------------- Render ----------------------
  const currentStyles = isDarkMode ? { ...baseStyles, ...darkStyles } : baseStyles;

  return (
    <div style={{ ...currentStyles.app, ...(isDarkMode ? { backgroundColor: "#1a1a1a", color: "#e0e0e0" } : {}) }}>
      <style>{isDarkMode ? darkCssStyles : cssStyles}</style>
      <header style={{
        ...currentStyles.header,
        ...(useMobileLayout ? {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 12,
          marginBottom: 16
        } : {})
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 12,
          ...(useMobileLayout ? { justifyContent: 'center' } : {})
        }}>
          <div style={{
            ...currentStyles.logo,
            backgroundColor: isDarkMode ? "#ffffff" : "#111",
            color: isDarkMode ? "#0d1117" : "#fff"
          }}>FG</div>
          <h1 style={{ margin: 0, fontSize: useMobileLayout ? 18 : 20 }}>FocusGuard</h1>
        </div>
        {customization.showHeaderButtons && customization.headerButtons && (
          <div style={{ 
            display: "grid", 
            ...(useMobileLayout ? {
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              width: '100%'
            } : {
              display: "flex",
              gap: 8,
              flexWrap: "wrap"
            })
          }}>
            {customization.headerButtons.customize && (
              <button 
                style={{
                  ...baseStyles.btn, 
                  ...(isDarkMode ? baseStyles.darkBtn : {}),
                  ...(useMobileLayout ? { 
                    padding: '10px 8px',
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  } : {})
                }} 
                onClick={() => setShowCustomization(!showCustomization)}
              >
                🎨 Customize
              </button>
            )}
            {customization.headerButtons.analytics && (
              <button 
                style={{
                  ...baseStyles.btn, 
                  ...(isDarkMode ? baseStyles.darkBtn : {}),
                  ...(useMobileLayout ? { 
                    padding: '10px 8px',
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  } : {})
                }} 
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                📊 Analytics
              </button>
            )}
            {customization.headerButtons.layoutToggle && (
              <button 
                style={{
                  ...baseStyles.btn, 
                  ...(isDarkMode ? baseStyles.darkBtn : {}),
                  ...(useMobileLayout ? { 
                    padding: '10px 8px',
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  } : {})
                }} 
                onClick={() => setForceMobileLayout(!forceMobileLayout)}
              >
                {useMobileLayout ? "🖥️ Desktop" : "📱 Mobile"}
              </button>
            )}
            {customization.headerButtons.darkMode && (
              <button 
                style={{
                  ...baseStyles.btn, 
                  ...(isDarkMode ? baseStyles.darkBtn : {}),
                  ...(useMobileLayout ? { 
                    padding: '10px 8px',
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  } : {})
                }} 
                onClick={() => setIsDarkMode(!isDarkMode)}
              >
                {isDarkMode ? "☀️ Light" : "🌙 Dark"}
              </button>
            )}
            {customization.headerButtons.notifications && (
              <button 
                style={{
                  ...baseStyles.btn, 
                  ...(isDarkMode ? baseStyles.darkBtn : {}),
                  ...(useMobileLayout ? { 
                    padding: '10px 8px',
                    fontSize: 12,
                    whiteSpace: 'nowrap'
                  } : {}),
                  ...(smartReminders.enabled ? {
                    backgroundColor: getThemeColor(),
                    color: '#fff',
                    border: `1px solid ${getThemeColor()}`
                  } : {})
                }} 
                onClick={requestNotificationPermission}
              >
                {smartReminders.enabled 
                  ? (useMobileLayout ? "🤖 Smart" : "🤖 Smart Reminders") 
                  : (useMobileLayout ? "🔔 Notify" : "Enable Smart Notifications")
                }
              </button>
            )}
            {customization.headerButtons.leaderboard && (
              <button 
                style={{
                  ...baseStyles.btn, 
                  ...(isDarkMode ? baseStyles.darkBtn : {}),
                  ...(useMobileLayout ? { 
                    padding: '10px 8px',
                    fontSize: 14,
                    whiteSpace: 'nowrap'
                  } : {})
                }} 
                onClick={() => setShowLeaderboard(!showLeaderboard)}
              >
                🏆 Leaderboard
              </button>
            )}
            {customization.headerButtons.auth && (
              user ? (
                <button 
                  style={{
                    ...baseStyles.btn, 
                    ...(isDarkMode ? baseStyles.darkBtn : {}),
                    ...(useMobileLayout ? { 
                      padding: '10px 8px',
                      fontSize: 14,
                      whiteSpace: 'nowrap'
                    } : {}),
                    backgroundColor: getThemeColor(),
                    color: '#fff',
                    border: `1px solid ${getThemeColor()}`
                  }} 
                  onClick={logout}
                >
                  👤 {user.username} | Logout
                </button>
              ) : (
                <button 
                  style={{
                    ...baseStyles.btn, 
                    ...(isDarkMode ? baseStyles.darkBtn : {}),
                    ...(useMobileLayout ? { 
                      padding: '10px 8px',
                      fontSize: 14,
                      whiteSpace: 'nowrap'
                    } : {})
                  }} 
                  onClick={() => setShowAuth(true)}
                >
                  🔐 Login
                </button>
              )
            )}
            <button 
              style={{
                ...baseStyles.btn, 
                ...(isDarkMode ? baseStyles.darkBtn : {}),
                ...(useMobileLayout ? { 
                  padding: '10px 8px',
                  fontSize: 14,
                  whiteSpace: 'nowrap'
                } : {}),
                backgroundColor: '#dc2626',
                color: '#fff',
                border: '1px solid #dc2626'
              }} 
              onClick={() => updateCustomization('showHeaderButtons', false)}
            >
              ➖ Hide Controls
            </button>
          </div>
        )}
        {!customization.showHeaderButtons && (
          <button 
            style={{
              ...baseStyles.btn, 
              ...(isDarkMode ? baseStyles.darkBtn : {}),
              padding: '6px 12px',
              fontSize: 12
            }} 
            onClick={() => updateCustomization('showHeaderButtons', true)}
          >
            ⚙️ Show Controls
          </button>
        )}
      </header>

      {showCustomization && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: useMobileLayout ? '100%' : 500,
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Customize Your App</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowCustomization(false)}>✖</button>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4>Theme Color</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(50px, 1fr))', gap: 8 }}>
                {Object.entries(UNLOCKABLE_THEMES).map(([key, theme]) => (
                  <button
                    key={key}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      backgroundColor: theme.primary,
                      border: customization.theme === key ? '3px solid #fff' : '1px solid #ddd',
                      cursor: userProgress.level >= theme.unlockLevel ? 'pointer' : 'not-allowed',
                      opacity: userProgress.level >= theme.unlockLevel ? 1 : 0.5,
                      position: 'relative',
                      justifySelf: 'center'
                    }}
                    onClick={() => {
                      if (userProgress.level >= theme.unlockLevel) {
                        updateCustomization('theme', key);
                      }
                    }}
                    title={`${theme.name} (Level ${theme.unlockLevel})`}
                  >
                    {userProgress.level < theme.unlockLevel && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 16 }}>🔒</div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4>Header Button Visibility</h4>
              <div style={{ marginBottom: 12 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <input
                    type="checkbox"
                    checked={customization.showHeaderButtons}
                    onChange={(e) => updateCustomization('showHeaderButtons', e.target.checked)}
                  />
                  <span style={{ fontWeight: 600 }}>Show Header Buttons</span>
                </label>
                {customization.showHeaderButtons && (
                  <div style={{ marginLeft: 20, padding: 8, backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa', borderRadius: 6 }}>
                    {Object.entries(customization.headerButtons).map(([button, visible]) => (
                      <label key={button} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 4 }}>
                        <input
                          type="checkbox"
                          checked={visible}
                          onChange={(e) => {
                            setCustomization(prev => ({
                              ...prev,
                              headerButtons: {
                                ...prev.headerButtons,
                                [button]: e.target.checked
                              }
                            }));
                          }}
                        />
                        <span style={{ textTransform: 'capitalize' }}>
                          {button === 'layoutToggle' ? 'Layout Toggle' : 
                           button === 'darkMode' ? 'Dark Mode' : 
                           button === 'notifications' ? 'Smart Notifications' : 
                           button === 'auth' ? 'Login/Account' : button}
                        </span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <h4>Section Order & Visibility</h4>
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {customization.sectionOrder.map((section, index) => (
                  <div key={section} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8, 
                    marginBottom: 8,
                    padding: 8,
                    borderRadius: 6,
                    backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <button
                        style={{ ...currentStyles.iconBtn, fontSize: 12, padding: 2 }}
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button
                        style={{ ...currentStyles.iconBtn, fontSize: 12, padding: 2 }}
                        onClick={() => moveSectionDown(index)}
                        disabled={index === customization.sectionOrder.length - 1}
                      >
                        ▼
                      </button>
                    </div>
                    <input
                      type="checkbox"
                      checked={customization.visibleSections[section]}
                      onChange={() => toggleSectionVisibility(section)}
                    />
                    <span style={{ flex: 1, textTransform: 'capitalize', fontSize: 14 }}>
                      {section === 'smartReminders' ? 'Smart Reminders' : 
                       section === 'sessionHighlights' ? 'Session Highlights' :
                       section === 'dailyGoals' ? 'Daily Goals' :
                       section.replace(/([A-Z])/g, ' $1')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={currentStyles.btn} onClick={() => {
                setCustomization(DEFAULT_CUSTOMIZATION);
              }}>
                Reset to Default
              </button>
              <button style={currentStyles.btn} onClick={() => setShowCustomization(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Modal */}
      {showAuth && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: useMobileLayout ? '100%' : 400,
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>{authMode === 'login' ? 'Login' : 'Create Account'}</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAuth(false)}>✖</button>
            </div>

            <form onSubmit={handleAuth}>
              {authMode === 'register' && (
                <input
                  type="text"
                  placeholder="Username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm(prev => ({ ...prev, username: e.target.value }))}
                  style={{ ...currentStyles.input, width: '100%', marginBottom: 12 }}
                  required
                />
              )}
              <input
                type="email"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm(prev => ({ ...prev, email: e.target.value }))}
                style={{ ...currentStyles.input, width: '100%', marginBottom: 12 }}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm(prev => ({ ...prev, password: e.target.value }))}
                style={{ ...currentStyles.input, width: '100%', marginBottom: 12 }}
                required
              />

              {authError && (
                <div style={{ 
                  color: '#dc2626',
                  fontSize: 12,
                  marginBottom: 12,
                  padding: 8,
                  backgroundColor: isDarkMode ? '#5d1a1a' : '#fef2f2',
                  borderRadius: 6
                }}>
                  {authError}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  type="submit"
                  style={{
                    ...currentStyles.btn,
                    flex: 1,
                    backgroundColor: getThemeColor(),
                    color: '#fff',
                    border: 'none'
                  }}
                >
                  {authMode === 'login' ? 'Login' : 'Create Account'}
                </button>
              </div>
            </form>

            <div style={{ textAlign: 'center' }}>
              <button
                style={{ ...currentStyles.smallBtn, background: 'transparent', color: getThemeColor() }}
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthError('');
                }}
              >
                {authMode === 'login' ? 'Need an account? Sign up' : 'Have an account? Login'}
              </button>
            </div>

            <div style={{ 
              marginTop: 16, 
              padding: 12, 
              backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
              borderRadius: 8,
              fontSize: 12,
              color: isDarkMode ? '#999' : '#666'
            }}>
              <strong>Why create an account?</strong>
              <ul style={{ margin: '8px 0', paddingLeft: 16 }}>
                <li>Save your progress across devices</li>
                <li>Compete on the global leaderboard</li>
                <li>Sync your achievements and streaks</li>
                <li>Access advanced analytics</li>
              </ul>
              <em>Guests can still use all features locally!</em>
            </div>
          </div>
        </div>
      )}

      {/* Live Leaderboard Modal */}
      {showLeaderboard && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: useMobileLayout ? '100%' : 600,
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>🏆 Live Leaderboard</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowLeaderboard(false)}>✖</button>
            </div>

            {!user && (
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                backgroundColor: isDarkMode ? '#5d1a1a' : '#fef2f2',
                borderRadius: 8,
                border: '1px solid #f59e0b'
              }}>
                <div style={{ fontWeight: 600, marginBottom: 4 }}>🔐 Account Required</div>
                <div style={{ fontSize: 13, marginBottom: 8 }}>
                  Create an account to see your rank and compete with others!
                </div>
                <button 
                  style={{ ...currentStyles.smallBtn, backgroundColor: getThemeColor(), color: '#fff' }}
                  onClick={() => { setShowLeaderboard(false); setShowAuth(true); }}
                >
                  Create Account
                </button>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <div style={{ 
                fontSize: 12, 
                color: isDarkMode ? '#999' : '#666',
                display: 'flex',
                justifyContent: 'space-between'
              }}>
                <span>Updates every 30 seconds</span>
                <span>{leaderboard.length} players</span>
              </div>
            </div>

            <div style={{ maxHeight: 400, overflow: 'auto' }}>
              {leaderboard.length === 0 ? (
                <div style={{ 
                  textAlign: 'center', 
                  color: isDarkMode ? '#999' : '#666',
                  padding: 40
                }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>🏁</div>
                  <div>No players yet!</div>
                  <div style={{ fontSize: 13, marginTop: 8 }}>
                    Be the first to create an account and start climbing!
                  </div>
                </div>
              ) : (
                leaderboard.map((player, index) => (
                  <div 
                    key={player.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: 12,
                      marginBottom: 8,
                      borderRadius: 8,
                      backgroundColor: user?.id === player.id ? 
                        (isDarkMode ? '#1a5d2e' : '#f0fdf4') : 
                        (isDarkMode ? '#21262d' : '#f8f9fa'),
                      border: user?.id === player.id ? 
                        `2px solid ${getThemeColor()}` : 
                        `1px solid ${isDarkMode ? '#30363d' : '#e0e0e0'}`
                    }}
                  >
                    <div style={{ 
                      width: 32, 
                      textAlign: 'center', 
                      fontWeight: 700,
                      fontSize: 16,
                      color: index < 3 ? (index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32') : 'inherit'
                    }}>
                      {index < 3 ? (index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉') : `#${player.rank}`}
                    </div>
                    <div style={{ flex: 1, marginLeft: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {player.username}
                        {user?.id === player.id && <span style={{ fontSize: 12, color: getThemeColor() }}>(You)</span>}
                      </div>
                      <div style={{ fontSize: 12, color: isDarkMode ? '#999' : '#666' }}>
                        Level {player.level} • {player.xp} XP • {Math.round(player.totalFocusMinutes)}min focused
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 12, color: isDarkMode ? '#999' : '#666' }}>
                        🔥 {player.streakCount} • ✅ {player.totalTasks}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div style={{ 
              marginTop: 16,
              padding: 12,
              backgroundColor: isDarkMode ? '#21262d' : '#f8f9fa',
              borderRadius: 8,
              fontSize: 12,
              color: isDarkMode ? '#999' : '#666'
            }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>🎯 How Rankings Work:</div>
              <div>• Ranked by total XP earned</div>
              <div>• XP earned from focus sessions and completed tasks</div>
              <div>• Updates automatically when you sync progress</div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Analytics Dashboard Modal */}
      {showAnalytics && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.7)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: useMobileLayout ? '100%' : 800,
            maxHeight: '90vh',
            overflow: 'auto',
            width: '100%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Analytics Dashboard 📊</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAnalytics(false)}>✖</button>
            </div>

            {/* Progress Overview Cards */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: useMobileLayout ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: 12,
              marginBottom: 20
            }}>
              <div style={{ ...currentStyles.card, textAlign: 'center', padding: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getThemeColor() }}>
                  {calculateLevel(userProgress.xp)}
                </div>
                <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>Current Level</div>
              </div>
              <div style={{ ...currentStyles.card, textAlign: 'center', padding: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getThemeColor() }}>
                  {userProgress.xp}
                </div>
                <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>Total XP</div>
              </div>
              <div style={{ ...currentStyles.card, textAlign: 'center', padding: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getThemeColor() }}>
                  {Math.round(userProgress.totalFocusMinutes)}
                </div>
                <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>Focus Minutes</div>
              </div>
              <div style={{ ...currentStyles.card, textAlign: 'center', padding: 12 }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: getThemeColor() }}>
                  {userProgress.streakCount}
                </div>
                <div style={{ fontSize: 12, color: isDarkMode ? "#999" : "#666" }}>Day Streak</div>
              </div>
            </div>

            {/* Chart Visualizations */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(2, 1fr)', 
              gap: 16,
              marginBottom: 16
            }}>
              {/* Focus Session Trend Chart */}
              <div style={currentStyles.card}>
                <h4 style={{ marginTop: 0 }}>📈 Focus Session Trends (Last 7 Days)</h4>
                <div style={{ height: 150, position: 'relative' }}>
                  {(() => {
                    const last7Days = Array.from({length: 7}, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (6 - i));
                      return date.toISOString().slice(0, 10);
                    });

                    const dailyData = last7Days.map(date => {
                      const daysSessions = history.filter(s => 
                        s.mode === 'focus' && 
                        new Date(s.startTime).toISOString().slice(0, 10) === date
                      );
                      return {
                        date,
                        sessions: daysSessions.length,
                        minutes: Math.round(daysSessions.reduce((sum, s) => sum + s.durationSec / 60, 0))
                      };
                    });

                    const maxMinutes = Math.max(...dailyData.map(d => d.minutes), 1);

                    return (
                      <div style={{ display: 'flex', alignItems: 'end', height: '100%', gap: 8 }}>
                        {dailyData.map((day, i) => (
                          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div 
                              style={{
                                width: '100%',
                                backgroundColor: getThemeColor(),
                                height: `${(day.minutes / maxMinutes) * 120}px`,
                                marginBottom: 4,
                                borderRadius: 2,
                                minHeight: day.minutes > 0 ? 4 : 0
                              }}
                              title={`${day.minutes} minutes, ${day.sessions} sessions`}
                            />
                            <div style={{ 
                              fontSize: 10, 
                              color: isDarkMode ? "#999" : "#666",
                              transform: 'rotate(-45deg)',
                              transformOrigin: 'center'
                            }}>
                              {new Date(day.date).toLocaleDateString('en', { weekday: 'short' })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Task Completion Chart */}
              <div style={currentStyles.card}>
                <h4 style={{ marginTop: 0 }}>✅ Task Completion Progress</h4>
                <div style={{ height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {(() => {
                    const completedTasks = tasks.filter(t => t.done).length;
                    const totalTasks = tasks.length;
                    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
                    const circumference = 2 * Math.PI * 45;
                    const offset = circumference - (completionRate / 100) * circumference;

                    return (
                      <div style={{ position: 'relative', width: 120, height: 120 }}>
                        <svg width="120" height="120" style={{ transform: 'rotate(-90deg)' }}>
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            stroke={isDarkMode ? "#30363d" : "#e0e0e0"}
                            strokeWidth="8"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="45"
                            fill="none"
                            stroke={getThemeColor()}
                            strokeWidth="8"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div style={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}>
                          <div style={{ fontSize: 18, fontWeight: 700 }}>
                            {Math.round(completionRate)}%
                          </div>
                          <div style={{ fontSize: 10, color: isDarkMode ? "#999" : "#666" }}>
                            {completedTasks}/{totalTasks}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Hourly Performance Heatmap */}
              <div style={currentStyles.card}>
                <h4 style={{ marginTop: 0 }}>🕒 Peak Performance Hours</h4>
                <div style={{ height: 150 }}>
                  {(() => {
                    const hourlyData = Array.from({length: 24}, (_, hour) => {
                      const hourSessions = history.filter(s => 
                        s.mode === 'focus' && 
                        new Date(s.startTime).getHours() === hour
                      );
                      const completedSessions = hourSessions.filter(s => 
                        s.durationSec >= (settings.focusMinutes * 60 * 0.8)
                      );
                      return {
                        hour,
                        total: hourSessions.length,
                        completed: completedSessions.length,
                        rate: hourSessions.length > 0 ? completedSessions.length / hourSessions.length : 0
                      };
                    });

                    const maxTotal = Math.max(...hourlyData.map(d => d.total), 1);

                    return (
                      <div style={{ 
                        display: 'grid', 
                        gridTemplateColumns: 'repeat(12, 1fr)', 
                        gap: 2,
                        height: '100%'
                      }}>
                        {hourlyData.map((data, i) => (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                            {i % 2 === 0 && (
                              <div style={{ 
                                fontSize: 8, 
                                color: isDarkMode ? "#999" : "#666",
                                textAlign: 'center',
                                height: 12
                              }}>
                                {i}
                              </div>
                            )}
                            <div
                              style={{
                                flex: 1,
                                backgroundColor: data.total > 0 ? 
                                  `${getThemeColor()}${Math.floor(255 * (data.total / maxTotal)).toString(16).padStart(2, '0')}` :
                                  (isDarkMode ? '#30363d' : '#f0f0f0'),
                                borderRadius: 2,
                                minHeight: 4
                              }}
                              title={`${data.hour}:00 - ${data.total} sessions (${Math.round(data.rate * 100)}% success)`}
                            />
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Achievement Progress */}
              <div style={currentStyles.card}>
                <h4 style={{ marginTop: 0 }}>🏆 Achievement Progress</h4>
                <div style={{ height: 150, overflow: 'auto' }}>
                  {userProgress.achievements.map(achievement => (
                    <div key={achievement.id} style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: 4,
                      marginBottom: 4,
                      borderRadius: 4,
                      backgroundColor: achievement.unlocked ? 
                        (isDarkMode ? '#1a5d2e' : '#f0fdf4') : 
                        (isDarkMode ? '#21262d' : '#f8f9fa'),
                      opacity: achievement.unlocked ? 1 : 0.6
                    }}>
                      <span style={{ fontSize: 16 }}>{achievement.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {achievement.name}
                        </div>
                        <div style={{ fontSize: 10, color: isDarkMode ? "#999" : "#666" }}>
                          {achievement.unlocked ? '✅ Unlocked' : '🔒 Locked'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Download Reports */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button 
                style={currentStyles.btn}
                onClick={() => {
                  const csvData = [
                    ['Date', 'Mode', 'Duration (minutes)', 'Completed'],
                    ...history.map(session => [
                      new Date(session.startTime).toISOString().slice(0, 10),
                      session.mode,
                      Math.round(session.durationSec / 60),
                      session.mode === 'focus' && session.durationSec >= (settings.focusMinutes * 60 * 0.8) ? 'Yes' : 'No'
                    ])
                  ].map(row => row.join(',')).join('\n');

                  const blob = new Blob([csvData], { type: 'text/csv' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `focusguard_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                📊 Download CSV Report
              </button>
              <button 
                style={currentStyles.btn}
                onClick={() => {
                  const reportData = {
                    generatedAt: new Date().toISOString(),
                    userProgress,
                    sessionHistory: history,
                    analytics: {
                      totalSessions: history.length,
                      focusSessions: history.filter(s => s.mode === 'focus').length,
                      averageSessionLength: Math.round(history.reduce((sum, s) => sum + s.durationSec, 0) / history.length / 60) || 0,
                      completionRate: Math.round((history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length / Math.max(history.filter(s => s.mode === 'focus').length, 1)) * 100)
                    }
                  };

                  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `focusguard_full_report_${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                📋 Download Full Report
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={{
        ...currentStyles.main,
        gridTemplateColumns: useMobileLayout ? "1fr" : "1fr 360px",
        gap: useMobileLayout ? 12 : 16
      }}>
        <section style={currentStyles.leftCol}>
          <div style={{
            ...currentStyles.timerCard,
            padding: useMobileLayout ? 16 : 12
          }}>
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              ...(useMobileLayout ? { flexDirection: 'column', gap: 12, textAlign: 'center' } : {})
            }}>
              <div>
                <div style={{ fontSize: 12, color: "#666" }}>Mode</div>
                <div style={{ fontWeight: 700, fontSize: useMobileLayout ? 16 : 14 }}>
                  {mode === "focus" ? "Focus" : mode === "short" ? "Short Break" : "Long Break"}
                </div>
              </div>
              <div style={{ textAlign: useMobileLayout ? "center" : "right" }}>
                <div style={{ fontSize: 12, color: "#666" }}>Remaining</div>
                <div style={{ fontSize: useMobileLayout ? 32 : 28, fontWeight: 700 }}>{formatTime(remaining)}</div>
              </div>
            </div>

            <div style={{ 
              display: "flex", 
              gap: 8, 
              marginTop: 16,
              ...(useMobileLayout ? { flexDirection: 'column' } : {})
            }}>
              {!running ? (
                <button style={{ ...currentStyles.btn, flex: 1, padding: useMobileLayout ? '12px' : '8px 12px' }} onClick={startTimer}>Start</button>
              ) : (
                <button style={{ ...currentStyles.btn, flex: 1, padding: useMobileLayout ? '12px' : '8px 12px' }} onClick={pauseTimer}>Pause</button>
              )}
              <button style={{ ...currentStyles.btn, flex: 1, padding: useMobileLayout ? '12px' : '8px 12px' }} onClick={resetTimer}>Reset</button>
            </div>

            <div style={{ 
              marginTop: 12, 
              display: "grid", 
              gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(3, 1fr)',
              gap: 8 
            }}>
              <button style={{...currentStyles.smallBtn, padding: useMobileLayout ? '10px' : '6px 8px'}} onClick={() => { setMode("focus"); resetTimer(); }}>Focus</button>
              <button style={{...currentStyles.smallBtn, padding: useMobileLayout ? '10px' : '6px 8px'}} onClick={() => { setMode("short"); resetTimer(); }}>Short Break</button>
              <button style={{...currentStyles.smallBtn, padding: useMobileLayout ? '10px' : '6px 8px'}} onClick={() => { setMode("long"); resetTimer(); }}>Long Break</button>
            </div>
          </div>
        </section>

        <aside style={{
          ...currentStyles.rightCol,
          ...(useMobileLayout ? { marginTop: 8 } : {})
        }}>
          {customization.sectionOrder.map(renderSection)}

          <div style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Quick Tips</h3>
            <ol style={{ margin: 0, paddingLeft: 18, fontSize: useMobileLayout ? 14 : 13 }}>
              <li>Earn XP for every minute of focus time!</li>
              <li>Complete tasks and goals to unlock achievements.</li>
              <li>Maintain streaks to boost your productivity.</li>
              <li>Unlock new themes and sounds as you level up.</li>
            </ol>
          </div>



          <div style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>⚠️ Reset Progress</h3>
            <p style={{ fontSize: 13, color: isDarkMode ? "#999" : "#666", marginBottom: 12 }}>
              This will permanently delete all your progress, stats, and achievements.
            </p>
            <button 
              style={{
                ...currentStyles.btn,
                backgroundColor: '#dc2626',
                border: '1px solid #dc2626',
                width: '100%',
                padding: useMobileLayout ? '12px' : '8px 12px'
              }}
              onClick={() => {
                if (window.confirm('⚠️ Are you absolutely sure?\n\nThis will DELETE ALL your progress including:\n• Level and XP\n• Tasks and goals\n• Session history\n• Achievements\n• Streaks\n\nThis action cannot be undone!')) {
                  // Reset all progress
                  clearScheduledReminders();
                  setUserProgress({
                    xp: 0,
                    level: 1,
                    totalFocusMinutes: 0,
                    totalTasks: 0,
                    totalGoalsCompleted: 0,
                    streakCount: 0,
                    lastStreakDate: null,
                    streakFreezes: 0,
                    achievements: ACHIEVEMENTS
                  });
                  setTasks([]);
                  setDailyGoals([]);
                  setHistory([]);
                  setSessionHighlights([]);
                  setSmartReminders({
                    enabled: false,
                    optimalTimes: [],
                    scheduledReminders: [],
                    preferences: {
                      reminderTypes: ['focus', 'break', 'streak'],
                      frequency: 'adaptive',
                      quietHours: { start: 22, end: 7 }
                    }
                  });
                  alert('✅ Progress has been reset successfully!');
                }
              }}
            >
              🗑️ DELETE ALL PROGRESS
            </button>
          </div>
        </aside>
      </main>

      {/* Reward Animation */}
      {showRewardAnimation && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 2000,
          fontSize: 60,
          animation: 'bounce 1s ease-in-out infinite'
        }}>
          🎉
        </div>
      )}

      {/* Post-Session Reflection Modal */}
      {showReflection && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: useMobileLayout ? '100%' : 400,
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0 }}>Quick Reflection 🤔</h3>
            <p style={{ color: isDarkMode ? "#999" : "#666", margin: '8px 0' }}>
              What did you achieve in this focus session?
            </p>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="I completed the first draft of my report..."
              style={{
                ...currentStyles.input,
                width: '100%',
                height: 80,
                resize: 'vertical',
                marginBottom: 12
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button style={{ ...currentStyles.btn, flex: 1 }} onClick={saveReflection}>
                Save Reflection
              </button>
              <button style={{ ...currentStyles.btn, flex: 1 }} onClick={() => setShowReflection(false)}>
                Skip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Micro-Break Options Modal */}
      {showBreakOptions && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: useMobileLayout ? '100%' : 400,
            width: '100%'
          }}>
            <h3 style={{ marginTop: 0 }}>Break Time! 🧘‍♀️</h3>
            <p style={{ color: isDarkMode ? "#999" : "#666", margin: '8px 0 16px' }}>
              Choose an activity to refresh your mind:
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 12 }}
                onClick={() => {
                  alert('🧘‍♀️ Stand up, stretch your arms, roll your shoulders, and take 3 deep breaths.');
                  setShowBreakOptions(false);
                }}
              >
                🧘‍♀️ Mini Stretch & Posture Reset
              </button>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 12 }}
                onClick={() => {
                  alert('🧠 Quick mental game: Count backwards from 50 to 1 by 3s. (50, 47, 44...)');
                  setShowBreakOptions(false);
                }}
              >
                🧠 Brain Refresh Quiz
              </button>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 12 }}
                onClick={() => {
                  alert('💧 Hydration check! Drink a glass of water and notice how it makes you feel.');
                  setShowBreakOptions(false);
                }}
              >
                💧 Water Reminder
              </button>
              <button 
                style={currentStyles.smallBtn}
                onClick={() => setShowBreakOptions(false)}
              >
                Skip Activities
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={{
        ...currentStyles.footer,
        padding: useMobileLayout ? '16px 0' : '8px 0'
      }}>
        <small style={{ fontSize: useMobileLayout ? 14 : 12 }}>
          Made on Replit • Level {calculateLevel(userProgress.xp)} • {userProgress.xp} XP
          {user ? (
            <span style={{ color: getThemeColor(), marginLeft: 8 }}>
              • ☁️ Synced to {user.username}
            </span>
          ) : (
            <span style={{ color: isDarkMode ? '#999' : '#666', marginLeft: 8 }}>
              • 📱 Guest Mode (Local Only)
            </span>
          )}
        </small>
      </footer>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% { transform: translate(-50%, -50%) translateY(0); }
          40% { transform: translate(-50%, -50%) translateY(-30px); }
          60% { transform: translate(-50%, -50%) translateY(-15px); }
        }
      `}</style>
    </div>
  );
}

// ---------------------- Inline Styles ----------------------
const baseStyles = {
  app: {
    fontFamily: "Inter, Roboto, Arial, sans-serif",
    maxWidth: 980,
    margin: "12px auto",
    padding: 12,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "1fr 360px",
    gap: 12,
  },
  leftCol: {},
  rightCol: {},
  timerCard: {
    padding: 12,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#fff",
    boxShadow: "0 1px 6px rgba(0,0,0,0.06)",
  },
  btn: {
    background: "#111",
    color: "#fff",
    padding: "8px 12px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  smallBtn: {
    background: "#eee",
    color: "#111",
    padding: "6px 8px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  smallInput: {
    width: 80,
    padding: 6,
    marginLeft: 8,
    borderRadius: 6,
    border: "1px solid #ddd",
    fontSize: 14,
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 4px",
    borderBottom: "1px dashed #eee",
  },
  taskRow: {
    padding: 6,
    borderBottom: "1px solid #fafafa",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#c33",
    padding: 4,
  },
  footer: {
    marginTop: 18,
    textAlign: "center",
    color: "#666",
  },
  rowLabel: { display: "flex", justifyContent: "space-between", alignItems: "center" },
};

const cssStyles = `
body { background: #f6f8fa; margin: 0; }
* { box-sizing: border-box; }
@media (max-width: 880px) {
  .App { padding: 8px; }
}
@media (max-width: 768px) {
  /* Mobile optimizations */
  main { grid-template-columns: 1fr !important; }
  header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
  .timer-card { padding: 16px !important; }
  .card { padding: 10px !important; margin-top: 8px !important; }
}
`;

const darkCssStyles = `
body { background: #0d1117; margin: 0; color: #e6edf3; }
* { box-sizing: border-box; }
@media (max-width: 880px) {
  .App { padding: 8px; }
}
@media (max-width: 768px) {
  /* Mobile optimizations */
  main { grid-template-columns: 1fr !important; }
  header { flex-direction: column !important; align-items: stretch !important; gap: 12px !important; }
  .timer-card { padding: 16px !important; }
  .card { padding: 10px !important; margin-top: 8px !important; }
}
`;

// Dark theme style overrides
const darkStyles = {
  timerCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#161b22",
    boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
    border: "1px solid #30363d",
  },
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#161b22",
    boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
    border: "1px solid #30363d",
  },
  btn: {
    backgroundColor: "#21262d",
    color: "#e6edf3",
    padding: "8px 12px",
    border: "1px solid #30363d",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
  },
  darkBtn: {
    backgroundColor: "#ffffff",
    color: "#0d1117",
    border: "1px solid #30363d",
  },
  smallBtn: {
    backgroundColor: "#ffffff",
    color: "#0d1117",
    padding: "6px 8px",
    border: "1px solid #30363d",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
  },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #30363d",
    backgroundColor: "#0d1117",
    color: "#e6edf3",
    fontSize: 14,
  },
  smallInput: {
    width: 80,
    padding: 6,
    marginLeft: 8,
    borderRadius: 6,
    border: "1px solid #30363d",
    backgroundColor: "#0d1117",
    color: "#e6edf3",
    fontSize: 14,
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "8px 4px",
    borderBottom: "1px dashed #30363d",
  },
  taskRow: {
    padding: 6,
    borderBottom: "1px solid #21262d",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#f85149",
    padding: 4,
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    color: "#0d1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
};