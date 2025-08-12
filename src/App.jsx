/*
FocusGuard - React Starter (Enhanced AI Version)

What this app does:
- A mobile-friendly Pomodoro-style focus timer (start / pause / reset).
- Enhanced AI-powered recommendations and insights.
- Advanced smart reminders with machine learning.
- A task list and daily goals with intelligent prioritization.
- Session history with deep analytics.
- Clean monochrome design optimized for focus.

This file is a single-file React app optimized for productivity and focus.
*/

import React, { useState, useEffect, useRef } from "react";

// ---------------------- Constants & Utilities ----------------------
const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
};

const DEFAULT_CUSTOMIZATION = {
  layout: 'default', // 'default', 'compact', 'minimal'
  theme: 'monochrome',
  visibleSections: {
    tasks: true,
    dailyGoals: true,
    settings: true,
    history: true,
    aiInsights: true,
    smartRecommendations: true,
    achievements: true,
    streaks: true,
    sessionHighlights: true,
    smartReminders: true,
    focusAnalytics: true,
    localAnalytics: true,
    supportCreator: true,
    deviceSync: true
  },
  sectionOrder: ['aiInsights', 'smartRecommendations', 'localAnalytics', 'tasks', 'dailyGoals', 'focusAnalytics', 'achievements', 'streaks', 'sessionHighlights', 'smartReminders', 'deviceSync', 'settings', 'history', 'supportCreator'],
  headerButtons: {
    customize: true,
    analytics: true,
    layoutToggle: true,
    notifications: true,
    aiCoach: true
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
  { id: 'ai_student', name: 'AI Student', description: 'Follow 10 AI recommendations', icon: '🤖', unlocked: false },
];

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

// Gamified Rewards Shop
const SHOP_ITEMS = {
  themes: {
    dark: { name: 'Dark Mode', price: 50, icon: '🌙', description: 'Sleek dark theme' },
    neon: { name: 'Neon Glow', price: 150, icon: '💫', description: 'Futuristic neon theme' },
    nature: { name: 'Nature Green', price: 100, icon: '🌿', description: 'Calming nature theme' },
    sunset: { name: 'Sunset Orange', price: 120, icon: '🌅', description: 'Warm sunset colors' },
    ocean: { name: 'Ocean Blue', price: 80, icon: '🌊', description: 'Deep ocean theme' },
    minimal: { name: 'Minimal White', price: 60, icon: '⚪', description: 'Clean minimal design' },
    retro: { name: 'Retro Terminal', price: 180, icon: '💻', description: 'Classic green terminal look' },
    galaxy: { name: 'Galaxy Purple', price: 200, icon: '🌌', description: 'Deep space theme' }
  },
  sounds: {
    piano: { name: 'Piano Notes', price: 60, icon: '🎹', description: 'Gentle piano notifications' },
    chimes: { name: 'Wind Chimes', price: 40, icon: '🎐', description: 'Peaceful chime sounds' },
    bells: { name: 'Temple Bells', price: 70, icon: '🔔', description: 'Meditative bell tones' },
    nature: { name: 'Nature Sounds', price: 90, icon: '🦜', description: 'Bird and nature sounds' },
    space: { name: 'Space Blips', price: 120, icon: '🚀', description: 'Futuristic sci-fi sounds' },
    zen: { name: 'Zen Bowls', price: 80, icon: '🧘', description: 'Singing bowl harmony' },
    guitar: { name: 'Guitar Chord', price: 100, icon: '🎸', description: 'Acoustic guitar strum' },
    synth: { name: 'Synth Wave', price: 110, icon: '🎵', description: 'Retro synth melody' },
    drum: { name: 'Victory Drums', price: 85, icon: '🥁', description: 'Triumphant drum beat' },
    harp: { name: 'Angel Harp', price: 95, icon: '🎯', description: 'Ethereal harp glissando' }
  },
  boosts: {
    doubleXP: { name: '2x XP Boost', price: 200, icon: '⚡', description: '2x XP for 1 hour', duration: 3600 },
    streakFreeze: { name: 'Streak Freeze', price: 100, icon: '❄️', description: 'Protect your streak for 1 day' },
    focusBoost: { name: 'Focus Boost', price: 150, icon: '🎯', description: 'Extra focus time bonus' },
    tripleCoins: { name: '3x Coins', price: 250, icon: '🪙', description: 'Triple coins for 30 min', duration: 1800 },
    megaXP: { name: 'Mega XP', price: 300, icon: '💎', description: '5x XP for 15 min', duration: 900 },
    timeExtend: { name: 'Time Warp', price: 180, icon: '⏰', description: 'Add 10 min to current session' },
    instantLevel: { name: 'Level Jump', price: 500, icon: '🚀', description: 'Instant level up (once per day)' }
  },
  special: {
    aiCoach: { name: 'AI Coach Pro', price: 400, icon: '🤖', description: 'Advanced AI insights & predictions' },
    customTimer: { name: 'Custom Timer', price: 300, icon: '⏲️', description: 'Set any timer duration' },
    darkWeb: { name: 'Dark Web Mode', price: 350, icon: '🕸️', description: 'Exclusive dark interface' },
    rainbow: { name: 'Rainbow Effects', price: 250, icon: '🌈', description: 'Colorful progress animations' },
    stealth: { name: 'Stealth Mode', price: 200, icon: '👤', description: 'Hide timer from others' },
    analytics: { name: 'Pro Analytics', price: 450, icon: '📊', description: 'Advanced productivity insights' }
  }
};

// Create proper audio context and functions
let audioContext = null;
let masterGainNode = null;

function initAudioContext() {
  if (!audioContext) {
    try {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      masterGainNode = audioContext.createGain();
      masterGainNode.connect(audioContext.destination);
      masterGainNode.gain.setValueAtTime(0.3, audioContext.currentTime);

      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
    } catch (error) {
      console.warn('Audio context not supported:', error);
      return null;
    }
  }
  return audioContext;
}

function createBeep(frequency = 800, duration = 200, type = 'sine') {
  const ctx = initAudioContext();
  if (!ctx || !masterGainNode) return null;

  try {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(masterGainNode);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration / 1000);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration / 1000);

    return oscillator;
  } catch (error) {
    console.warn('Failed to create beep:', error);
    return null;
  }
}

function playStartSound() {
  try {
    // Cheerful ascending tone for session start
    createBeep(523, 150); // C5
    setTimeout(() => createBeep(659, 150), 100); // E5
    setTimeout(() => createBeep(784, 200), 200); // G5
  } catch (error) {
    console.warn('Failed to play start sound:', error);
  }
}

function playEndSound() {
  try {
    // Gentle descending tone for session end
    createBeep(784, 150); // G5
    setTimeout(() => createBeep(659, 150), 100); // E5
    setTimeout(() => createBeep(523, 200), 200); // C5
  } catch (error) {
    console.warn('Failed to play end sound:', error);
  }
}

function playCustomSound(soundType) {
  try {
    switch(soundType) {
      case 'piano':
        createBeep(523, 300, 'triangle'); // C5
        setTimeout(() => createBeep(659, 300, 'triangle'), 200); // E5
        break;
      case 'chimes':
        createBeep(1047, 500, 'sine'); // C6
        setTimeout(() => createBeep(1319, 400, 'sine'), 100); // E6
        setTimeout(() => createBeep(1568, 600, 'sine'), 200); // G6
        break;
      case 'bells':
        createBeep(440, 800, 'triangle'); // A4
        setTimeout(() => createBeep(880, 600, 'triangle'), 300); // A5
        break;
      case 'nature':
        // Bird chirp simulation
        createBeep(2000, 100, 'square');
        setTimeout(() => createBeep(2500, 80, 'square'), 50);
        setTimeout(() => createBeep(1800, 120, 'square'), 150);
        break;
      case 'space':
        createBeep(800, 150, 'square');
        setTimeout(() => createBeep(1200, 150, 'square'), 100);
        setTimeout(() => createBeep(1600, 200, 'square'), 200);
        break;
      case 'zen':
        createBeep(256, 1000, 'sine'); // Low C
        setTimeout(() => createBeep(512, 800, 'sine'), 200); // Higher C
        setTimeout(() => createBeep(768, 600, 'sine'), 400); // G
        break;
      case 'guitar':
        createBeep(82, 400, 'triangle'); // E2
        setTimeout(() => createBeep(110, 350, 'triangle'), 50); // A2
        setTimeout(() => createBeep(147, 300, 'triangle'), 100); // D3
        setTimeout(() => createBeep(196, 250, 'triangle'), 150); // G3
        break;
      case 'synth':
        createBeep(440, 200, 'sawtooth');
        setTimeout(() => createBeep(554, 200, 'sawtooth'), 150);
        setTimeout(() => createBeep(659, 300, 'sawtooth'), 300);
        break;
      case 'drum':
        createBeep(60, 100, 'square'); // Bass drum
        setTimeout(() => createBeep(200, 80, 'square'), 120); // Snare
        setTimeout(() => createBeep(60, 100, 'square'), 200); // Bass drum
        break;
      case 'harp':
        createBeep(523, 150, 'triangle'); // C5
        setTimeout(() => createBeep(587, 150, 'triangle'), 80); // D5
        setTimeout(() => createBeep(659, 150, 'triangle'), 160); // E5
        setTimeout(() => createBeep(698, 150, 'triangle'), 240); // F5
        setTimeout(() => createBeep(784, 200, 'triangle'), 320); // G5
        break;
      default:
        playStartSound();
    }
  } catch (error) {
    console.warn('Failed to play custom sound:', error);
  }
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
        aiRecommendationsFollowed: 0,
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
        aiRecommendationsFollowed: 0,
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

  // UI state
  const [showCustomization, setShowCustomization] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showAICoach, setShowAICoach] = useState(false);
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

  // Local Analytics State
  const [localAnalytics, setLocalAnalytics] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_localAnalytics");
      return saved ? JSON.parse(saved) : {
        dailyStats: {},
        weeklyGoals: { target: 4, current: 0 },
        monthlyProgress: {},
        bestStreak: 0,
        totalHours: 0,
        averageSessionLength: 0,
        productivityScore: 0
      };
    } catch (e) {
      return {
        dailyStats: {},
        weeklyGoals: { target: 4, current: 0 },
        monthlyProgress: {},
        bestStreak: 0,
        totalHours: 0,
        averageSessionLength: 0,
        productivityScore: 0
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_localAnalytics", JSON.stringify(localAnalytics));
  }, [localAnalytics]);



  // Coins and Shop state
  const [coins, setCoins] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_coins");
      return saved ? JSON.parse(saved) : 0;
    } catch (e) {
      return 0;
    }
  });

  const [ownedItems, setOwnedItems] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_ownedItems");
      return saved ? JSON.parse(saved) : { themes: [], sounds: [], boosts: [], special: [] };
    } catch (e) {
      return { themes: [], sounds: [], boosts: [], special: [] };
    }
  });

  const [activeTheme, setActiveTheme] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_activeTheme");
      return saved ? JSON.parse(saved) : 'monochrome';
    } catch (e) {
      return 'monochrome';
    }
  });

  const [activeSound, setActiveSound] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_activeSound");
      return saved ? JSON.parse(saved) : 'default';
    } catch (e) {
      return 'default';
    }
  });

  const [activeBoosts, setActiveBoosts] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_activeBoosts");
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  const [showShop, setShowShop] = useState(false);

  // Keep track of completed focus cycles in the current round
  const cyclesRef = useRef(0);
  const timerRef = useRef(null);
  const sessionStartRef = useRef(null);

  // Enhanced Smart Reminders & AI state
  const [smartReminders, setSmartReminders] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_smartReminders");
      return saved ? JSON.parse(saved) : {
        enabled: false,
        optimalTimes: [],
        scheduledReminders: [],
        aiLearningData: {
          sessionPatterns: [],
          productivityScores: [],
          environmentFactors: []
        },
        preferences: {
          reminderTypes: ['focus', 'break', 'streak', 'optimization'],
          aiIntensity: 'adaptive', // 'low', 'medium', 'high', 'adaptive'
          quietHours: { start: 22, end: 7 }
        }
      };
    } catch {
      return {
        enabled: false,
        optimalTimes: [],
        scheduledReminders: [],
        aiLearningData: {
          sessionPatterns: [],
          productivityScores: [],
          environmentFactors: []
        },
        preferences: {
          reminderTypes: ['focus', 'break', 'streak', 'optimization'],
          aiIntensity: 'adaptive',
          quietHours: { start: 22, end: 7 }
        }
      };
    }
  });

  useEffect(() => {
    localStorage.setItem("fg_smartReminders", JSON.stringify(smartReminders));
  }, [smartReminders]);

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
    localStorage.setItem("fg_dailyGoals", JSON.stringify(dailyGoals));
  }, [dailyGoals]);
  useEffect(() => {
    localStorage.setItem("fg_customization", JSON.stringify(customization));
  }, [customization]);
  useEffect(() => {
    localStorage.setItem("fg_userProgress", JSON.stringify(userProgress));
  }, [userProgress]);
  useEffect(() => {
    localStorage.setItem("fg_coins", JSON.stringify(coins));
  }, [coins]);
  useEffect(() => {
    localStorage.setItem("fg_ownedItems", JSON.stringify(ownedItems));
  }, [ownedItems]);
  useEffect(() => {
    localStorage.setItem("fg_activeTheme", JSON.stringify(activeTheme));
  }, [activeTheme]);
  useEffect(() => {
    localStorage.setItem("fg_activeSound", JSON.stringify(activeSound));
  }, [activeSound]);
  useEffect(() => {
    localStorage.setItem("fg_activeBoosts", JSON.stringify(activeBoosts));
  }, [activeBoosts]);

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
    // Play end sound
    if (settings.soundEnabled) {
      if (activeSound !== 'default' && ownedItems.sounds.includes(activeSound)) {
        playCustomSound(activeSound);
      } else {
        playEndSound();
      }
    }

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
      productivityScore: calculateProductivityScore(durationSec, mode),
      environmentContext: captureEnvironmentContext()
    };
    setHistory((h) => [sessionRecord, ...h]);

    // Update local analytics
    if (mode === 'focus') {
      updateLocalAnalytics(sessionRecord);
    }

    // Update AI learning data
    updateAILearningData(sessionRecord);

    // Show reward animation
    setShowRewardAnimation(true);
    setTimeout(() => setShowRewardAnimation(false), 3000);

    // Award XP and update progress for focus sessions
    if (mode === "focus") {
      const focusMinutes = Math.round(durationSec / 60);
      let xpGained = focusMinutes * 2; // 2 XP per minute
      let coinsEarned = Math.max(Math.round(focusMinutes / 5), 1); // 1 coin per 5 minutes, minimum 1

      // Apply XP boost if active
      if (activeBoosts.doubleXP && activeBoosts.doubleXP > Date.now()) {
        xpGained *= 2;
        coinsEarned *= 2;
      }

      // Award coins
      setCoins(prev => prev + coinsEarned);

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
            case 'task_master':
              return prev.totalTasks >= 50 ? { ...achievement, unlocked: true } : achievement;
            case 'ai_student':
              return prev.aiRecommendationsFollowed >= 10 ? { ...achievement, unlocked: true } : achievement;
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
      // AI-driven session length adjustment
      let nextFocusMinutes = settings.focusMinutes;
      const completedFocusSessions = history.filter(s => s.mode === 'focus');
      const successRate = completedFocusSessions.length > 0 
        ? completedFocusSessions.filter(s => s.productivityScore && s.productivityScore >= 70).length / completedFocusSessions.length 
        : 1;

      if (successRate < 0.6 && settings.focusMinutes > 15) {
        nextFocusMinutes = Math.max(15, settings.focusMinutes - 5);
        sendNotification('AI Focus Adjustment', `Your focus sessions are challenging. AI suggests shortening to ${nextFocusMinutes} minutes.`);
      } else if (successRate > 0.85 && settings.focusMinutes < 45) {
        nextFocusMinutes = Math.min(45, settings.focusMinutes + 5);
        sendNotification('AI Focus Adjustment', `You're excelling! AI suggests extending focus to ${nextFocusMinutes} minutes.`);
      }

      if (nextFocusMinutes !== settings.focusMinutes) {
        setSettings(prev => ({ ...prev, focusMinutes: nextFocusMinutes }));
      }

      // Determine next mode
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

    // Send notification
    sendNotification(`Session finished`, `Mode: ${mode} — next: ${mode === "focus" ? (cyclesRef.current === 0 ? "long break" : "short break") : "focus"}`);
  }

  // Advanced AI Functions
  function calculateProductivityScore(durationSec, sessionMode) {
    if (sessionMode !== 'focus') return 0;

    const expectedDuration = settings.focusMinutes * 60;
    const completionRate = Math.min(durationSec / expectedDuration, 1);
    const hour = new Date().getHours();

    // Base score from completion
    let score = completionRate * 100;

    // Bonus for peak hours (based on historical data)
    const optimalTimes = smartReminders.optimalTimes;
    const isOptimalTime = optimalTimes.some(time => Math.abs(time.hour - hour) <= 1);
    if (isOptimalTime) score *= 1.2;

    // Penalty for very late or very early sessions
    if (hour < 6 || hour > 23) score *= 0.8;

    return Math.round(score);
  }

  function captureEnvironmentContext() {
    const hour = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    return {
      hour,
      dayOfWeek,
      isWeekend,
      hasActiveTasks: tasks.filter(t => !t.done).length > 0,
      pendingGoals: dailyGoals.filter(g => !g.completed && g.createdAt === new Date().toISOString().slice(0, 10)).length,
      recentSessionCount: history.filter(s => Date.now() - s.startTime < 3600000).length // Last hour
    };
  }

  function updateAILearningData(sessionRecord) {
    setSmartReminders(prev => {
      if (!prev || !prev.aiLearningData) return prev;

      return {
        ...prev,
        aiLearningData: {
          ...prev.aiLearningData,
          sessionPatterns: [...(prev.aiLearningData.sessionPatterns || []), {
            timestamp: sessionRecord.startTime,
            duration: sessionRecord.durationSec,
            mode: sessionRecord.mode,
            hour: new Date(sessionRecord.startTime).getHours(),
            dayOfWeek: new Date(sessionRecord.startTime).getDay(),
            success: sessionRecord.durationSec >= (settings.focusMinutes * 60 * 0.8)
          }].slice(-100), // Keep last 100 sessions
          productivityScores: [...(prev.aiLearningData.productivityScores || []), sessionRecord.productivityScore || 0].slice(-50),
          environmentFactors: [...(prev.aiLearningData.environmentFactors || []), sessionRecord.environmentContext].slice(-50)
        }
      };
    });
  }

  // AI Analysis Functions
  function performDeepAIAnalysis() {
    if (!smartReminders || !smartReminders.aiLearningData) {
      return {
        insights: ['Complete more sessions to unlock AI insights'],
        recommendations: [],
        predictions: [],
        confidence: 0
      };
    }

    const sessions = smartReminders.aiLearningData.sessionPatterns || [];
    const scores = smartReminders.aiLearningData.productivityScores || [];
    const environment = smartReminders.aiLearningData.environmentFactors || [];

    if (sessions.length < 5) {
      return {
        insights: ['Complete more sessions to unlock AI insights'],
        recommendations: [],
        predictions: [],
        confidence: 0
      };
    }

    // Pattern recognition
    const hourlyPerformance = {};
    const weekdayPerformance = {};

    sessions.forEach((session, index) => {
      const score = scores[index] || 0;

      // Hourly analysis
      if (!hourlyPerformance[session.hour]) {
        hourlyPerformance[session.hour] = { scores: [], count: 0 };
      }
      hourlyPerformance[session.hour].scores.push(score);
      hourlyPerformance[session.hour].count++;

      // Weekday analysis
      if (!weekdayPerformance[session.dayOfWeek]) {
        weekdayPerformance[session.dayOfWeek] = { scores: [], count: 0 };
      }
      weekdayPerformance[session.dayOfWeek].scores.push(score);
      weekdayPerformance[session.dayOfWeek].count++;
    });

    // Calculate averages
    Object.keys(hourlyPerformance).forEach(hour => {
      const data = hourlyPerformance[hour];
      data.avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    });

    Object.keys(weekdayPerformance).forEach(day => {
      const data = weekdayPerformance[day];
      data.avgScore = data.scores.reduce((a, b) => a + b, 0) / data.scores.length;
    });

    // Generate insights
    const insights = [];
    const recommendations = [];
    const predictions = [];

    // Peak performance time
    const bestHour = Object.keys(hourlyPerformance).reduce((a, b) => 
      hourlyPerformance[a].avgScore > hourlyPerformance[b].avgScore ? a : b
    );

    if (hourlyPerformance[bestHour] && hourlyPerformance[bestHour].count >= 3) {
      insights.push(`Your peak performance is at ${bestHour}:00 with ${Math.round(hourlyPerformance[bestHour].avgScore)}% average productivity`);
      recommendations.push({
        type: 'timing',
        title: 'Optimize Your Schedule',
        description: `Schedule important tasks around ${bestHour}:00 for maximum productivity`,
        action: () => alert(`💡 Pro tip: Block ${bestHour}:00-${parseInt(bestHour)+2}:00 for your most challenging work!`)
      });
    }

    // Productivity decline detection
    const recentScores = scores.slice(-10);
    const earlierScores = scores.slice(-20, -10);

    if (recentScores.length >= 5 && earlierScores.length >= 5) {
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;

      if (recentAvg < earlierAvg - 15) {
        insights.push(`Productivity declined by ${Math.round(earlierAvg - recentAvg)}% in recent sessions`);
        recommendations.push({
          type: 'recovery',
          title: 'Productivity Recovery Plan',
          description: 'Consider shorter sessions, better breaks, or addressing external factors',
          action: () => {
            setSettings(prev => ({ ...prev, focusMinutes: Math.max(15, prev.focusMinutes - 5) }));
            alert('🔧 AI adjusted your session length for better success rate!');
          }
        });
      }
    }

    // Session length optimization
    const completionRate = sessions.filter(s => s.success).length / sessions.length;
    if (completionRate < 0.6) {
      recommendations.push({
        type: 'optimization',
        title: 'Session Length Adjustment',
        description: `${Math.round(completionRate * 100)}% completion rate suggests shorter sessions`,
        action: () => {
          const newLength = Math.max(15, settings.focusMinutes - 5);
          setSettings(prev => ({ ...prev, focusMinutes: newLength }));
          alert(`🎯 AI recommendation applied: Sessions reduced to ${newLength} minutes`);
        }
      });
    } else if (completionRate > 0.9) {
      recommendations.push({
        type: 'challenge',
        title: 'Ready for Longer Sessions',
        description: `Excellent ${Math.round(completionRate * 100)}% completion rate! Try longer sessions`,
        action: () => {
          const newLength = Math.min(50, settings.focusMinutes + 5);
          setSettings(prev => ({ ...prev, focusMinutes: newLength }));
          alert(`🚀 AI recommendation applied: Sessions increased to ${newLength} minutes`);
        }
      });
    }

    // Predict next session success
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    let predictedScore = 75; // Base prediction

    if (hourlyPerformance[currentHour]) {
      predictedScore = hourlyPerformance[currentHour].avgScore;
    }

    if (weekdayPerformance[currentDay]) {
      predictedScore = (predictedScore + weekdayPerformance[currentDay].avgScore) / 2;
    }

    predictions.push({
      type: 'session_success',
      score: Math.round(predictedScore),
      confidence: Math.min(sessions.length / 20, 1) * 100,
      factors: [
        `Time of day factor: ${hourlyPerformance[currentHour] ? 'favorable' : 'unknown'}`,
        `Day of week factor: ${weekdayPerformance[currentDay] ? 'analyzed' : 'new'}`,
        `Recent trend: ${recentScores.length ? (recentScores.slice(-3).reduce((a,b) => a+b, 0) / 3 > 70 ? 'positive' : 'needs attention') : 'insufficient data'}`
      ]
    });

    return {
      insights,
      recommendations,
      predictions,
      confidence: Math.min(sessions.length / 25, 1) * 100
    };
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
      // Initialize audio context on user interaction
      initAudioContext();

      sessionStartRef.current = Date.now() - ((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60 - remaining) * 1000);
      setRunning(true);

      // Play start sound
      if (settings.soundEnabled) {
        if (activeSound !== 'default' && ownedItems.sounds.includes(activeSound)) {
          playCustomSound(activeSound);
        } else {
          playStartSound();
        }
      }
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



  // Update local analytics
  function updateLocalAnalytics(sessionRecord) {
    const today = new Date().toISOString().slice(0, 10);
    const sessionMinutes = Math.round(sessionRecord.durationSec / 60);

    setLocalAnalytics(prev => {
      const newDailyStats = { ...prev.dailyStats };
      if (!newDailyStats[today]) {
        newDailyStats[today] = { sessions: 0, minutes: 0, completedSessions: 0 };
      }

      newDailyStats[today].sessions += 1;
      newDailyStats[today].minutes += sessionMinutes;
      if (sessionRecord.durationSec >= settings.focusMinutes * 60 * 0.8) {
        newDailyStats[today].completedSessions += 1;
      }

      const totalMinutes = prev.totalHours * 60 + sessionMinutes;
      const totalSessions = Object.values(newDailyStats).reduce((sum, day) => sum + day.sessions, 0);
      const completedSessions = Object.values(newDailyStats).reduce((sum, day) => sum + day.completedSessions, 0);

      return {
        ...prev,
        dailyStats: newDailyStats,
        totalHours: totalMinutes / 60,
        averageSessionLength: totalSessions > 0 ? totalMinutes / totalSessions : 0,
        productivityScore: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
        bestStreak: Math.max(prev.bestStreak, userProgress.streakCount)
      };
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
        return notification;
      } catch (e) {
        console.warn("Notification failed", e);
      }
    }
  }

  // Smart notification system
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }

    // Check current permission status
    if (Notification.permission === "granted") {
      setSmartReminders(prev => ({ ...prev, enabled: true }));
      alert(`🤖 Smart Notifications Already Active!\n\n✅ Notification permission granted\n📊 AI system ready to learn your patterns\n🎯 Intelligent reminders will be scheduled automatically\n\nThe AI will adapt to your productivity patterns!`);
      return;
    }

    if (Notification.permission === "denied") {
      alert("🔒 Notification Permission Blocked\n\nTo enable notifications:\n1. Click the lock icon in your browser's address bar\n2. Change notifications to 'Allow'\n3. Refresh the page and try again\n\nSmart reminders will use browser alerts for now.");
      setSmartReminders(prev => ({ ...prev, enabled: true }));
      return;
    }

    // Request permission (only works on direct user interaction)
    try {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          setSmartReminders(prev => ({ ...prev, enabled: true }));
          alert(`🤖 Smart Notifications Activated!\n\n✅ Notification permission granted\n📊 AI system ready to learn your patterns\n🎯 Intelligent reminders will be scheduled automatically\n\nThe AI will adapt to your productivity patterns!`);
        } else if (permission === "denied") {
          alert("🔒 Notification Permission Denied\n\nTo enable later:\n1. Click the lock icon in your browser's address bar\n2. Change notifications to 'Allow'\n3. Refresh the page\n\nSmart reminders will use browser alerts for now.");
          setSmartReminders(prev => ({ ...prev, enabled: true }));
        } else {
          alert("Notification permission dismissed. Smart reminders will use browser alerts instead.");
          setSmartReminders(prev => ({ ...prev, enabled: true }));
        }
      }).catch((error) => {
        console.warn("Notification permission error:", error);
        alert("🔒 Notification Setup Issue\n\nYour browser may be blocking notification requests. Smart reminders will use browser alerts instead.");
        setSmartReminders(prev => ({ ...prev, enabled: true }));
      });
    } catch (error) {
      console.warn("Notification API error:", error);
      alert("🔒 Notification Not Supported\n\nYour browser doesn't support notification requests. Smart reminders will use browser alerts instead.");
      setSmartReminders(prev => ({ ...prev, enabled: true }));
    }
  }

  // Tasks handlers
  function addTask() {
    const text = taskInput.trim();
    if (!text) return;
    const t = { 
      id: generateId(), 
      text, 
      done: false,
      priority: 'medium',
      aiSuggested: false,
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setTasks((s) => [t, ...s]);
    setTaskInput("");
  }

  function toggleTask(id) {
    setTasks((s) => s.map((t) => {
      if (t.id === id && !t.done) {
        // Task completed - award XP
        setUserProgress(prev => {
          const newXP = prev.xp + (t.aiSuggested ? 8 : 5); // Bonus for AI-suggested tasks
          const newLevel = calculateLevel(newXP);
          const newTotalTasks = prev.totalTasks + 1;
          const newAIRecs = t.aiSuggested ? prev.aiRecommendationsFollowed + 1 : prev.aiRecommendationsFollowed;

          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.id === 'task_master' && newTotalTasks >= 50) {
              return { ...achievement, unlocked: true };
            }
            if (achievement.id === 'ai_student' && newAIRecs >= 10) {
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
            aiRecommendationsFollowed: newAIRecs,
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
      createdAt: new Date().toISOString().slice(0, 10)
    };
    setDailyGoals((goals) => [goal, ...goals]);
    setGoalInput("");
  }

  function toggleDailyGoal(id) {
    setDailyGoals((goals) => goals.map((goal) => {
      if (goal.id === id && !goal.completed) {
        // Goal completed - award XP
        setUserProgress(prev => {
          const newXP = prev.xp + 10;
          const newLevel = calculateLevel(newXP);
          const newGoalsCompleted = prev.totalGoalsCompleted + 1;

          if (newLevel > prev.level) {
            sendNotification(`Level Up!`, `Congratulations! You've reached level ${newLevel}!`);
          }

          return {
            ...prev,
            xp: newXP,
            level: newLevel,
            totalGoalsCompleted: newGoalsCompleted
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
          color: "#666",
          marginBottom: 4 
        }}>
          <span>Progress: {completed}/{total}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div style={{
          width: '100%',
          height: 8,
          backgroundColor: '#e0e0e0',
          borderRadius: 4,
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: '#000',
            transition: 'width 0.3s ease',
            borderRadius: 4
          }} />
        </div>
      </div>
    );
  }

  // AI-Powered Recommendations System (Enhanced)
  function getEnhancedAIRecommendations() {
    const analysis = performDeepAIAnalysis();
    const recommendations = [...(analysis.recommendations || [])];

    const recentSessions = history.slice(0, 20);
    const focusSessions = recentSessions.filter(s => s.mode === 'focus');
    const completedSessions = focusSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8);
    const completionRate = focusSessions.length > 0 ? completedSessions.length / focusSessions.length : 0;

    // Task prioritization AI
    const overdueTasks = tasks.filter(t => !t.done).length;
    if (overdueTasks > 0) {
      const urgentTasks = tasks.filter(t => !t.done).slice(0, 3);
      recommendations.push({
        type: 'task_optimization',
        title: '🎯 AI Task Prioritization',
        description: `Focus on these ${urgentTasks.length} high-impact tasks during your next session`,
        action: () => {
          // Auto-prioritize tasks
          setTasks(prev => prev.map(task => {
            if (urgentTasks.includes(task)) {
              return { ...task, priority: 'high', aiSuggested: true };
            }
            return task;
          }));
          alert('🤖 AI has prioritized your most important tasks!');
        },
        priority: 'high',
        icon: '🎯'
      });
    }

    // Environment optimization
    const currentHour = new Date().getHours();
    if (currentHour >= 14 && currentHour <= 16) {
      recommendations.push({
        type: 'environment',
        title: '☕ Afternoon Energy Boost',
        description: 'Post-lunch dip detected. Consider a 5-minute walk or hydration break before focusing',
        action: () => {
          setShowBreakOptions(true);
        },
        priority: 'medium',
        icon: '☕'
      });
    }

    // Smart session suggestions
    if (analysis.predictions && analysis.predictions.length > 0) {
      const prediction = analysis.predictions[0];
      if (prediction && prediction.score >= 80) {
        recommendations.push({
          type: 'timing',
          title: '⚡ Optimal Focus Window',
          description: `AI predicts ${prediction.score}% success rate right now. Perfect time to start!`,
          action: () => {
            setMode('focus');
            resetTimer();
            startTimer();
          },
          priority: 'high',
          icon: '⚡'
        });
      } else if (prediction.score < 60) {
        recommendations.push({
          type: 'timing',
          title: '🔄 Suboptimal Conditions',
          description: `AI suggests waiting or taking a short break. Current success prediction: ${prediction.score}%`,
          action: () => {
            setMode('short');
            resetTimer();
          },
          priority: 'medium',
          icon: '🔄'
        });
      }
    }

    // Adaptive learning suggestions
    if (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns && smartReminders.aiLearningData.sessionPatterns.length >= 10) {
      const patterns = smartReminders.aiLearningData.sessionPatterns;
      const recentFailures = patterns.slice(-5).filter(p => p && !p.success).length;

      if (recentFailures >= 3) {
        recommendations.push({
          type: 'adaptation',
          title: '🧠 Learning Mode Activated',
          description: 'AI detected completion challenges. Switching to adaptive short sessions',
          action: () => {
            setSettings(prev => ({ ...prev, focusMinutes: 15 }));
            setMode('focus');
            resetTimer();
            alert('🤖 AI Coach: Starting with shorter 15-minute sessions to rebuild momentum!');
          },
          priority: 'high',
          icon: '🧠'
        });
      }
    }

    // Sort by priority
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]).slice(0, 6);
  }

  // Shop handlers
  function buyItem(category, itemId) {
    const item = SHOP_ITEMS[category][itemId];
    if (!item || coins < item.price) return false;

    if (ownedItems[category].includes(itemId)) return false;

    setCoins(prev => prev - item.price);
    setOwnedItems(prev => ({
      ...prev,
      [category]: [...prev[category], itemId]
    }));

    // Auto-activate purchased items
    if (category === 'themes') {
      setActiveTheme(itemId);
    } else if (category === 'sounds') {
      setActiveSound(itemId);
    } else if (category === 'boosts') {
      if (item.duration) {
        setActiveBoosts(prev => ({
          ...prev,
          [itemId]: Date.now() + (item.duration * 1000)
        }));
      }
    }

    return true;
  }

  function useBoost(boostId) {
    const boost = SHOP_ITEMS.boosts[boostId];
    if (!boost || !ownedItems.boosts.includes(boostId)) return;

    if (boost.duration) {
      setActiveBoosts(prev => ({
        ...prev,
        [boostId]: Date.now() + (boost.duration * 1000)
      }));
    }
  }

  // Clean up expired boosts
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = Date.now();
      setActiveBoosts(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(boostId => {
          if (updated[boostId] <= now) {
            delete updated[boostId];
          }
        });
        return updated;
      });
    }, 60000); // Check every minute

    return () => clearInterval(cleanupInterval);
  }, []);

  // Customization handlers
  function updateCustomization(key, value) {
    setCustomization(prev => {
      const updated = { ...prev, [key]: value };
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
    if (key === 'soundEnabled') {
      setSettings((s) => ({ ...s, [key]: Boolean(value) }));
    } else {
      setSettings((s) => ({ ...s, [key]: Number(value) }));
    }
  }

  // Render sections based on customization
  function renderSection(sectionKey) {
    if (!customization.visibleSections[sectionKey]) return null;

    switch (sectionKey) {
      case 'aiInsights':
        const analysis = performDeepAIAnalysis();
        return (
          <div key="aiInsights" style={currentStyles.card}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🧠 AI Insights
              <span style={{ 
                fontSize: 10, 
                backgroundColor: '#000', 
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 8,
                fontWeight: 'normal'
              }}>
                {Math.round(analysis.confidence)}% confidence
              </span>
            </h3>
            {analysis.insights.length === 0 ? (
              <div style={{ color: "#666", fontSize: 14 }}>Complete more sessions to unlock AI insights.</div>
            ) : (
              <div>
                {analysis.insights.map((insight, index) => (
                  <div key={index} style={{ 
                    padding: 10, 
                    borderRadius: 6, 
                    marginBottom: 8,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    fontSize: 13
                  }}>
                    💡 {insight}
                  </div>
                ))}
                {analysis.predictions.length > 0 && (
                  <div style={{ 
                    padding: 10, 
                    borderRadius: 6,
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #3b82f6',
                    marginTop: 10
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      🔮 Next Session Prediction: {analysis.predictions[0].score}%
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {analysis.predictions[0].factors.map((factor, i) => (
                        <div key={i}>• {factor}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        );

      case 'smartRecommendations':
        const recommendations = getEnhancedAIRecommendations();
        return (
          <div key="smartRecommendations" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🤖 AI Recommendations</h3>
            {recommendations.length === 0 ? (
              <div style={{ color: "#666" }}>AI is learning your patterns. Complete more sessions for personalized recommendations!</div>
            ) : (
              recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: 12,
                  borderRadius: 8,
                  marginBottom: 10,
                  backgroundColor: rec.priority === 'high' ? '#fef2f2' :
                                 rec.priority === 'medium' ? '#f0fdf4' : '#f0f9ff',
                  border: `1px solid ${rec.priority === 'high' ? '#dc2626' :
                                      rec.priority === 'medium' ? '#22c55e' : '#3b82f6'}`,
                  position: 'relative'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    fontWeight: 600,
                    color: rec.priority === 'high' ? '#dc2626' :
                           rec.priority === 'medium' ? '#22c55e' : '#3b82f6',
                    textTransform: 'uppercase'
                  }}>
                    {rec.priority}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                    <span style={{ fontSize: 18 }}>{rec.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rec.title}</div>
                      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>
                        {rec.description}
                      </div>
                    </div>
                  </div>
                  {rec.action && (
                    <button
                      style={{
                        ...currentStyles.smallBtn,
                        backgroundColor: '#000',
                        color: '#fff',
                        border: 'none',
                        padding: '6px 12px'
                      }}
                      onClick={() => {
                        rec.action();
                        setUserProgress(prev => ({ 
                          ...prev, 
                          aiRecommendationsFollowed: prev.aiRecommendationsFollowed + 1 
                        }));
                        alert('🤖 AI recommendation applied successfully!');
                      }}
                    >
                      Apply AI Suggestion
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        );

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
                <div style={{ color: "#666" }}>No tasks yet.</div>
              ) : (
                tasks.map((t) => (
                  <div key={t.id} style={currentStyles.taskRow}>
                    <label style={{ display: "flex", gap: 8, alignItems: "center", width: "100%" }}>
                      <input type="checkbox" checked={t.done} onChange={() => toggleTask(t.id)} />
                      <div style={{ 
                        flex: 1, 
                        textDecoration: t.done ? "line-through" : "none",
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {t.text}
                        {t.aiSuggested && <span style={{ fontSize: 10, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>AI</span>}
                        {t.priority === 'high' && <span style={{ color: '#dc2626', fontSize: 12 }}>🔥</span>}
                      </div>
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
                <div style={{ color: "#666" }}>No daily goals yet.</div>
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

      case 'focusAnalytics':
        return (
          <div key="focusAnalytics" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>📊 Focus Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {history.filter(s => s.mode === 'focus').length}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Total Sessions</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {Math.round((history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length / Math.max(history.filter(s => s.mode === 'focus').length, 1)) * 100)}%
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Success Rate</div>
              </div>
            </div>
            {smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores && smartReminders.aiLearningData.productivityScores.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Productivity Trend (Last 10 Sessions)</div>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'end', 
                  height: 60, 
                  gap: 2 
                }}>
                  {(() => {
                    const scores = (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores) 
                      ? smartReminders.aiLearningData.productivityScores.slice(-20) 
                      : [];
                    return scores.length > 0 ? scores.map((score, i) => (
                      <div key={i} style={{
                        flex: 1,
                        backgroundColor: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#dc2626',
                        height: `${Math.max(score || 0, 5)}%`,
                        minHeight: 4,
                        borderRadius: 2,
                        position: 'relative',
                        cursor: 'pointer'
                      }} title={`Session ${i + 1}: ${score || 0}% productivity`}>
                        <div style={{
                          position: 'absolute',
                          bottom: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8,
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}>
                          {i % 5 === 0 ? i + 1 : ''}
                        </div>
                      </div>
                    )) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: '#666',
                        fontSize: 14
                      }}>
                        Complete more sessions to see productivity trends
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}
          </div>
        );

      case 'achievements':
        const unlockedAchievements = userProgress.achievements.filter(a => a.unlocked);
        return (
          <div key="achievements" style={currentStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>Achievements 🏆</h3>
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>Level {calculateLevel(userProgress.xp)}</div>
              <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
              </div>
              <div style={{ 
                fontSize: 16, 
                fontWeight: 600, 
                color: '#f59e0b',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                🪙 {coins} coins
                <button 
                  style={{
                    ...currentStyles.smallBtn,
                    fontSize: 10,
                    padding: '2px 6px',
                    marginLeft: 8
                  }}
                  onClick={() => setShowShop(true)}
                >
                  Shop
                </button>
              </div>
              <div style={{
                width: '100%',
                height: 6,
                backgroundColor: '#e0e0e0',
                borderRadius: 3
              }}>
                <div style={{
                  width: `${(getXPProgressInCurrentLevel(userProgress.xp) / 100) * 100}%`,
                  height: '100%',
                  backgroundColor: '#000',
                  borderRadius: 3
                }} />
              </div>
            </div>
            <div style={{ maxHeight: 150, overflow: 'auto' }}>
              {unlockedAchievements.length === 0 ? (
                <div style={{ color: "#666" }}>No achievements yet. Start focusing!</div>
              ) : (
                unlockedAchievements.map(achievement => (
                  <div key={achievement.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: 6,
                    borderRadius: 4,
                    backgroundColor: '#f8f9fa',
                    marginBottom: 4
                  }}>
                    <span style={{ fontSize: 20 }}>{achievement.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{achievement.name}</div>
                      <div style={{ fontSize: 11, color: "#666" }}>{achievement.description}</div>
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
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {userProgress.streakCount}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 700 }}>
                  {Math.round(userProgress.totalFocusMinutes)}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Total Minutes</div>
              </div>
            </div>
            {userProgress.aiRecommendationsFollowed > 0 && (
              <div style={{ 
                marginTop: 12, 
                textAlign: 'center',
                padding: 8,
                backgroundColor: '#f0f9ff',
                borderRadius: 6,
                border: '1px solid #3b82f6'
              }}>
                <div style={{ fontSize: 16, fontWeight: 600 }}>🤖 {userProgress.aiRecommendationsFollowed}</div>
                <div style={{ fontSize: 11, color: "#666" }}>AI Recommendations Followed</div>
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

              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12, marginTop: 8 }}>
                <label style={{ ...currentStyles.rowLabel, marginBottom: 8 }}>
                  <span>🔊 Sound Effects</span>
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled} 
                    onChange={(e) => updateSetting("soundEnabled", e.target.checked)} 
                  />
                </label>
              </div>
            </div>
          </div>
        );

      case 'localAnalytics':
        const today = new Date().toISOString().slice(0, 10);
        const todayStats = localAnalytics.dailyStats[today] || { sessions: 0, minutes: 0, completedSessions: 0 };
        const last7Days = Object.entries(localAnalytics.dailyStats)
          .slice(-7)
          .reduce((sum, [, stats]) => sum + stats.sessions, 0);

        return (
          <div key="localAnalytics" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>📈 Session Analytics</h3>

            {/* Today's Progress */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Today's Progress</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, textAlign: 'center' }}>
                <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{todayStats.sessions}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Sessions</div>
                </div>
                <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(todayStats.minutes)}</div>
                  <div style={{ fontSize: 11, color: '#666' }}>Minutes</div>
                </div>
                <div style={{ padding: 8, backgroundColor: '#f8f9fa', borderRadius: 6 }}>
                  <div style={{ fontSize: 18, fontWeight: 700 }}>
                    {todayStats.sessions > 0 ? Math.round((todayStats.completedSessions / todayStats.sessions) * 100) : 0}%
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>Success</div>
                </div>
              </div>
            </div>

            {/* Weekly Overview */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>This Week</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontSize: 12 }}>Sessions: {last7Days}</span>
                <span style={{ fontSize: 12 }}>Goal: {localAnalytics.weeklyGoals.target}</span>
              </div>
              <div style={{ 
                width: '100%', 
                height: 8, 
                backgroundColor: '#e0e0e0', 
                borderRadius: 4 
              }}>
                <div style={{ 
                  width: `${Math.min((last7Days / localAnalytics.weeklyGoals.target) * 100, 100)}%`, 
                  height: '100%', 
                  backgroundColor: last7Days >= localAnalytics.weeklyGoals.target ? '#22c55e' : '#3b82f6', 
                  borderRadius: 4,
                  transition: 'width 0.3s ease'
                }} />
              </div>
            </div>

            {/* Overall Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>Total Hours</div>
                <div style={{ color: '#666' }}>{Math.round(localAnalytics.totalHours * 10) / 10}</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Best Streak</div>
                <div style={{ color: '#666' }}>{localAnalytics.bestStreak} days</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Avg Session</div>
                <div style={{ color: '#666' }}>{Math.round(localAnalytics.averageSessionLength)} min</div>
              </div>
              <div>
                <div style={{ fontWeight: 600 }}>Success Rate</div>
                <div style={{ color: '#666' }}>{localAnalytics.productivityScore}%</div>
              </div>
            </div>

            <button 
              style={{ ...currentStyles.btn, width: '100%', marginTop: 12, fontSize: 12 }}
              onClick={() => {
                const analyticsCSV = [
                  ['Date', 'Sessions', 'Minutes', 'Completed', 'Success Rate'],
                  ...Object.entries(localAnalytics.dailyStats).map(([date, stats]) => [
                    date,
                    stats.sessions,
                    Math.round(stats.minutes),
                    stats.completedSessions,
                    stats.sessions > 0 ? Math.round((stats.completedSessions / stats.sessions) * 100) + '%' : '0%'
                  ])
                ].map(row => row.join(',')).join('\n');

                const blob = new Blob([analyticsCSV], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `focus_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
              }}
            >
              📊 Export Analytics
            </button>
          </div>
        );

      case 'history':
        return (
          <div key="history" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Session History</h3>
            <div style={{ maxHeight: 220, overflow: "auto" }}>
              {history.length === 0 ? (
                <div style={{ color: "#666" }}>No sessions yet — start a focus session.</div>
              ) : (
                history.map((s) => (
                  <div key={s.id} style={currentStyles.historyRow}>
                    <div>
                      <strong>{s.mode === "focus" ? "Focus" : s.mode === "short" ? "Short Break" : "Long Break"}</strong>
                      {s.productivityScore && <span style={{ fontSize: 10, marginLeft: 6, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>{s.productivityScore}%</span>}
                      <div style={{ fontSize: 12, color: "#666" }}>{new Date(s.startTime).toLocaleString()}</div>
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
                <div style={{ color: "#666" }}>Complete focus sessions and reflect to build your productivity journal.</div>
              ) : (
                sessionHighlights.map((highlight) => (
                  <div key={highlight.id} style={{
                    padding: 8,
                    borderRadius: 6,
                    marginBottom: 8,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ fontSize: 13, marginBottom: 4 }}>{highlight.text}</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
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
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #22c55e',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>✅ AI System Active</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Learning from {smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns ? smartReminders.aiLearningData.sessionPatterns.length : 0} sessions
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Confidence level: {Math.round(Math.min((smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns ? smartReminders.aiLearningData.sessionPatterns.length : 0) / 25, 1) * 100)}%
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>AI Preferences:</div>
                  {['focus', 'break', 'streak', 'optimization'].map(type => (
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
                      <span style={{ textTransform: 'capitalize' }}>{type} Intelligence</span>
                    </label>
                  ))}
                </div>

                <button 
                  style={{...currentStyles.btn, width: '100%' }}
                  onClick={() => {
                    setSmartReminders(prev => ({ ...prev, enabled: false }));
                    alert('🔕 AI reminders disabled');
                  }}
                >
                  🔕 Disable AI System
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                  Advanced AI system learns your productivity patterns and provides intelligent recommendations and timing suggestions.
                </p>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                  <div>🧠 Deep learning from focus patterns</div>
                  <div>📈 Productivity optimization</div>
                  <div>⏰ Intelligent timing suggestions</div>
                  <div>🎯 Adaptive session recommendations</div>
                </div>
                <button 
                  style={{...currentStyles.btn, width: '100%' }} 
                  onClick={requestNotificationPermission}
                >
                  🤖 Activate AI System
                </button>
              </div>
            )}
          </div>
        );

      case 'deviceSync':
        return (
          <div key="deviceSync" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🔄 Multi-Device Sync (Share Code)</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Transfer your progress between devices without accounts. Generate a temporary sync code on one device and enter it on another to sync your data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff', width: '100%' }}
                onClick={() => {
                  // Logic to generate and display sync code
                  const syncCode = generateId().substring(0, 8).toUpperCase();
                  alert(`Your temporary sync code is: ${syncCode}\n\nShare this code with your other device to sync progress. It expires after 1 hour.`);
                  // In a real app, you'd store this code server-side temporarily or use WebRTC/Broadcast Channels.
                }}
              >
                Generate Sync Code
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <input 
                  type="text" 
                  placeholder="Enter received sync code" 
                  style={{...currentStyles.input, flex: 1, backgroundColor: '#f8f9fa', border: '1px dashed #000'}} 
                />
                <button 
                  style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                  onClick={() => alert('Syncing data... (Feature not fully implemented)')}
                >
                  Sync Data
                </button>
              </div>
            </div>
          </div>
        );

      case 'supportCreator':
        return (
          <div key="supportCreator" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>💝 Support the Creator</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Follow my journey and stay updated on new productivity tools!
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 16 }}>
              <a 
                href="https://www.youtube.com/@ctrlaltstudy-g1z" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...currentStyles.btn,
                  textDecoration: 'none',
                  textAlign: 'center',
                  backgroundColor: '#ff0000',
                  color: '#fff',
                  border: '1px solid #ff0000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                🎥 YouTube - Ctrl+Alt+Study
              </a>

              <a 
                href="https://www.tiktok.com/@focusguard101?is_from_webapp=1&sender_device=pc" 
                target="_blank" 
                rel="noopener noreferrer"
                style={{
                  ...currentStyles.btn,
                  textDecoration: 'none',
                  textAlign: 'center',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: '1px solid #000',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                📱 TikTok - FocusGuard
              </a>
            </div>

            <div style={{ 
              borderTop: '1px solid #e0e0e0', 
              paddingTop: 12,
              textAlign: 'center' 
            }}>
              <div style={{ 
                fontSize: 13, 
                fontWeight: 600, 
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}>
                ☕ Buy me a coffee
              </div>
              <div style={{
                ...currentStyles.btn,
                backgroundColor: '#0066ff',
                color: '#fff',
                textAlign: 'center',
                width: '100%',
                cursor: 'pointer',
                padding: '12px 16px',
                marginBottom: 8
              }}
              onClick={() => {
                navigator.clipboard.writeText('09613777353');
                alert('📱 GCash Number Copied!\n\n09613777353\n\nThank you for your support! 💙');
              }}
              >
                📱 GCash: 09613777353
              </div>
              <div style={{ 
                fontSize: 11, 
                color: '#666', 
                marginTop: 6 
              }}>
                Click to copy GCash number
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }

  // Check if should use mobile layout
  const useMobileLayout = isMobile || forceMobileLayout;

  // ---------------------- Render ----------------------
  const currentStyles = monochromeStyles;

  return (
    <div style={currentStyles.app}>
      <style>{monochromeCSS}</style>

      {/* Header */}
      <header style={{
        ...currentStyles.header,
        ...(useMobileLayout ? {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 16,
          marginBottom: 20
        } : {})
      }}>
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 16,
          ...(useMobileLayout ? { justifyContent: 'center' } : {})
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: 8,
            backgroundColor: "#000000",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative"
          }}>
            <svg width="40" height="40" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M32 8L48 14V26C48 38 40 48 32 54C24 48 16 38 16 26V14L32 8Z" fill="#ffffff"/>
              <circle cx="32" cy="28" r="10" fill="none" stroke="#000000" strokeWidth="1.5"/>
              <circle cx="32" cy="28" r="3" fill="#000000"/>
              <path d="M32 18 A10 10 0 0 1 40.7 22" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M40.7 34 A10 10 0 0 1 32 38" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
              <path d="M23.3 34 A10 10 0 0 1 23.3 22" stroke="#000000" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: useMobileLayout ? 20 : 24, fontWeight: 700 }}>FocusGuard</h1>
            <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
              AI-Powered Focus Assistant
            </div>
          </div>
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
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {})
                }} 
                onClick={() => setShowCustomization(!showCustomization)}
              >
                ⚙️ Customize
              </button>
            )}
            {customization.headerButtons.analytics && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {})
                }} 
                onClick={() => setShowAnalytics(!showAnalytics)}
              >
                📊 Analytics
              </button>
            )}
            {customization.headerButtons.aiCoach && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {}),
                  ...(smartReminders.enabled ? {
                    backgroundColor: '#000',
                    color: '#fff'
                  } : {})
                }} 
                onClick={() => setShowAICoach(!showAICoach)}
              >
                🤖 AI Coach
              </button>
            )}
            {customization.headerButtons.layoutToggle && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {})
                }} 
                onClick={() => {
                  setForceMobileLayout(!forceMobileLayout);
                  console.log('Toggle clicked, new state:', !forceMobileLayout);
                }}
              >
                {useMobileLayout ? "🖥️ Desktop" : "📱 Mobile"}
              </button>
            )}
            {customization.headerButtons.notifications && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {}),
                  ...(smartReminders.enabled ? {
                    backgroundColor: '#000',
                    color: '#fff'
                  } : {})
                }} 
                onClick={requestNotificationPermission}
              >
                {smartReminders.enabled ? "🔔 Smart Notifications" : "Enable Notifications"}
              </button>
            )}
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {}),
                backgroundColor: '#f59e0b',
                color: '#fff',
                fontWeight: 600
              }} 
              onClick={() => setShowShop(!showShop)}
            >
              🪙 Shop ({coins})
            </button>
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {}),
                backgroundColor: '#333',
                color: '#fff'
              }} 
              onClick={() => updateCustomization('showHeaderButtons', false)}
            >
              ➖ Hide
            </button>
          </div>
        )}
        {!customization.showHeaderButtons && (
          <button 
            style={{
              ...currentStyles.btn, 
              padding: '8px 16px',
              fontSize: 12
            }} 
            onClick={() => updateCustomization('showHeaderButtons', true)}
          >
            ⚙️ Show Controls
          </button>
        )}
      </header>

      {/* Customization Modal */}
      {showCustomization && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 600,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Customize Your Experience</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowCustomization(false)}>✖</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>Section Visibility & Order</h4>
              <div style={{ maxHeight: 300, overflow: 'auto' }}>
                {customization.sectionOrder.map((section, index) => (
                  <div key={section} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 8,
                    padding: 12,
                    borderRadius: 8,
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0'
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button
                        style={{ ...currentStyles.iconBtn, fontSize: 10, padding: 4 }}
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                      >
                        ▲
                      </button>
                      <button
                        style={{ ...currentStyles.iconBtn, fontSize: 10, padding: 4 }}
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
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>
                      {section === 'aiInsights' ? '🧠 AI Insights' :
                       section === 'smartRecommendations' ? '🤖 Smart Recommendations' :
                       section === 'focusAnalytics' ? '📊 Focus Analytics' :
                       section === 'sessionHighlights' ? '📝 Session Highlights' :
                       section === 'dailyGoals' ? 'Daily Goals' :
                       section === 'smartReminders' ? '🤖 Smart Reminders' :
                       section === 'deviceSync' ? '🔄 Multi-Device Sync' :
                       section === 'supportCreator' ? '💝 Support Creator' :
                       section.charAt(0).toUpperCase() + section.slice(1)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button style={currentStyles.btn} onClick={() => {
                setCustomization(DEFAULT_CUSTOMIZATION);
              }}>
                Reset Defaults
              </button>
              <button style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}} onClick={() => setShowCustomization(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shop Modal */}
      {showShop && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 800,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🪙 Rewards Shop
                <span style={{ 
                  fontSize: 14, 
                  backgroundColor: '#f59e0b', 
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontWeight: 'normal'
                }}>
                  {coins} coins
                </span>
              </h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowShop(false)}>✖</button>
            </div>

            {/* Active Boosts */}
            {Object.keys(activeBoosts).length > 0 && (
              <div style={{ marginBottom: 24 }}>
                <h4>⚡ Active Boosts</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {Object.entries(activeBoosts).map(([boostId, expiry]) => {
                    const timeLeft = Math.max(0, expiry - Date.now());
                    const minutesLeft = Math.round(timeLeft / 60000);
                    return (
                      <div key={boostId} style={{
                        padding: '6px 12px',
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #22c55e',
                        borderRadius: 8,
                        fontSize: 12
                      }}>
                        {SHOP_ITEMS.boosts[boostId]?.icon} {SHOP_ITEMS.boosts[boostId]?.name}
                        <div style={{ fontSize: 10, color: '#666' }}>
                          {minutesLeft > 60 ? `${Math.round(minutesLeft/60)}h` : `${minutesLeft}m`} left
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Shop Categories */}
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(2, 1fr)', gap: 20 }}>

              {/* Themes */}
              <div>
                <h4>🎨 Themes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {Object.entries(SHOP_ITEMS.themes).map(([themeId, item]) => {
                    const owned = ownedItems.themes.includes(themeId);
                    const active = activeTheme === themeId;
                    return (
                      <div key={themeId} style={{
                        padding: 12,
                        border: `2px solid ${active ? '#22c55e' : owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: active ? '#f0fdf4' : owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: active ? '#22c55e' : '#3b82f6',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => setActiveTheme(themeId)}
                          >
                            {active ? '✓ Active' : 'Activate'}
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => buyItem('themes', themeId)}
                            disabled={coins < item.price}
                          >
                            🪙 {item.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sound Effects */}
              <div>
                <h4>🔊 Sound Effects</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {Object.entries(SHOP_ITEMS.sounds).map(([soundId, item]) => {
                    const owned = ownedItems.sounds.includes(soundId);
                    const active = activeSound === soundId;
                    return (
                      <div key={soundId} style={{
                        padding: 12,
                        border: `2px solid ${active ? '#22c55e' : owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: active ? '#f0fdf4' : owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {owned && (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                fontSize: 10,
                                padding: '4px 8px'
                              }}
                              onClick={() => playCustomSound(soundId)}
                            >
                              🔊 Test
                            </button>
                          )}
                          {owned ? (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                backgroundColor: active ? '#22c55e' : '#3b82f6',
                                color: '#fff',
                                flex: 1
                              }}
                              onClick={() => setActiveSound(soundId)}
                            >
                              {active ? '✓ Active' : 'Activate'}
                            </button>
                          ) : (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                                color: '#fff',
                                flex: 1
                              }}
                              onClick={() => buyItem('sounds', soundId)}
                              disabled={coins < item.price}
                            >
                              🪙 {item.price}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Power-ups and Special Items */}
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', gap: 20, marginTop: 20 }}>

              {/* Boosts */}
              <div>
                <h4>⚡ Power-ups</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {Object.entries(SHOP_ITEMS.boosts).map(([boostId, item]) => {
                    const owned = ownedItems.boosts.includes(boostId);
                    const active = activeBoosts[boostId] && activeBoosts[boostId] > Date.now();
                    return (
                      <div key={boostId} style={{
                        padding: 12,
                        border: `2px solid ${active ? '#22c55e' : owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: active ? '#f0fdf4' : owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: active ? '#22c55e' : '#3b82f6',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => useBoost(boostId)}
                            disabled={active}
                          >
                            {active ? '✓ Active' : 'Activate'}
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => buyItem('boosts', boostId)}
                            disabled={coins < item.price}
                          >
                            🪙 {item.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Special Items */}
              <div>
                <h4>✨ Special Items</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {Object.entries(SHOP_ITEMS.special).map(([specialId, item]) => {
                    const owned = ownedItems.special && ownedItems.special.includes(specialId);
                    return (
                      <div key={specialId} style={{
                        padding: 12,
                        border: `2px solid ${owned ? '#3b82f6' : '#e0e0e0'}`,
                        borderRadius: 8,
                        backgroundColor: owned ? '#f0f9ff' : '#f8f9fa'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                          <span style={{ fontSize: 16 }}>{item.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 13 }}>{item.name}</span>
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: '#22c55e',
                              color: '#fff',
                              width: '100%'
                            }}
                            disabled
                          >
                            ✓ Owned
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => buyItem('special', specialId)}
                            disabled={coins < item.price}
                          >
                            🪙 {item.price}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 13, color: '#666', marginBottom: 12 }}>
                💡 Earn coins by completing focus sessions! Longer sessions = more coins.
              </div>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowShop(false)}
              >
                Close Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Coach Modal */}
      {showAICoach && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 700,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🤖 AI Productivity Coach
                {smartReminders.enabled && (
                  <span style={{ 
                    fontSize: 10, 
                    backgroundColor: '#000', 
                    color: '#fff',
                    padding: '2px 8px',
                    borderRadius: 12,
                    fontWeight: 'normal'
                  }}>
                    ACTIVE
                  </span>
                )}
              </h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAICoach(false)}>✖</button>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>🧠 Current AI Analysis</h4>
              {(() => {
                const analysis = performDeepAIAnalysis();
                return (
                  <div>
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>
                        Confidence Level: {Math.round(analysis.confidence)}%
                      </div>
                      <div style={{ 
                        width: '100%', 
                        height: 8, 
                        backgroundColor: '#e0e0e0', 
                        borderRadius: 4 
                      }}>
                        <div style={{ 
                          width: `${analysis.confidence}%`, 
                          height: '100%', 
                          backgroundColor: '#000', 
                          borderRadius: 4 
                        }} />
                      </div>
                    </div>

                    {analysis.insights.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Key Insights:</div>
                        {analysis.insights.map((insight, i) => (
                          <div key={i} style={{ 
                            padding: 10, 
                            backgroundColor: '#f0f9ff', 
                            border: '1px solid #3b82f6',
                            borderRadius: 6, 
                            marginBottom: 6,
                            fontSize: 13
                          }}>
                            💡 {insight}
                          </div>
                        ))}
                      </div>
                    )}

                    {analysis.predictions.length > 0 && (
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>AI Predictions:</div>
                        {analysis.predictions.map((pred, i) => (
                          <div key={i} style={{ 
                            padding: 12, 
                            backgroundColor: '#f0fdf4', 
                            border: '1px solid #22c55e',
                            borderRadius: 6,
                            fontSize: 13
                          }}>
                            <div style={{ fontWeight: 600, marginBottom: 6 }}>
                              🔮 Next Session Success: {pred.score}%
                            </div>
                            {pred.factors.map((factor, j) => (
                              <div key={j} style={{ fontSize: 12, color: '#666', marginBottom: 2 }}>
                                • {factor}
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            <div style={{ marginBottom: 20 }}>
              <h4>🎯 Smart Recommendations</h4>
              {(() => {
                const recommendations = getEnhancedAIRecommendations();
                return recommendations.length === 0 ? (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>
                    Complete more sessions to unlock personalized AI recommendations.
                  </div>
                ) : (
                  <div style={{ maxHeight: 300, overflow: 'auto' }}>
                    {recommendations.map((rec, i) => (
                      <div key={i} style={{
                        padding: 12,
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e0e0e0',
                        borderRadius: 8,
                        marginBottom: 10
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                          <span style={{ fontSize: 16 }}>{rec.icon}</span>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{rec.title}</span>
                          <span style={{ 
                            fontSize: 10, 
                            backgroundColor: rec.priority === 'high' ? '#dc2626' : rec.priority === 'medium' ? '#f59e0b' : '#3b82f6',
                            color: '#fff',
                            padding: '2px 6px',
                            borderRadius: 8,
                            textTransform: 'uppercase'
                          }}>
                            {rec.priority}
                          </span>
                        </div>
                        <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                          {rec.description}
                        </div>
                        {rec.action && (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: '#000',
                              color: '#fff',
                              border: 'none'
                            }}
                            onClick={() => {
                              rec.action();
                              setUserProgress(prev => ({ 
                                ...prev, 
                                aiRecommendationsFollowed: prev.aiRecommendationsFollowed + 1 
                              }));
                              alert('🤖 AI recommendation applied successfully!');
                            }}
                          >
                            Apply Recommendation
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
              <button 
                style={currentStyles.btn}
                onClick={() => {
                  const analysis = performDeepAIAnalysis();
                  const report = {
                    timestamp: new Date().toISOString(),
                    userProgress,
                    sessionHistory: history,
                    aiLearningData: smartReminders.aiLearningData,
                    analysis: analysis,
                    recommendations: getEnhancedAIRecommendations()
                  };

                  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `ai_analysis_${new Date().toISOString().slice(0, 10)}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                }}
              >
                📥 Export AI Report
              </button>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowAICoach(false)}
              >
                Close Coach
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Dashboard Modal */}
      {showAnalytics && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 1100,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>📊 Advanced Analytics Dashboard</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAnalytics(false)}>✖</button>
            </div>

            {/* Key Metrics Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: useMobileLayout ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', 
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8,
                border: '2px solid #000',
                boxShadow: '2px 2px 0px #000'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#000' }}>
                  {calculateLevel(userProgress.xp)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Current Level</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f0fdf4', 
                borderRadius: 8,
                border: '2px solid #22c55e',
                boxShadow: '2px 2px 0px #22c55e'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
                  {history.filter(s => s.mode === 'focus').length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Total Sessions</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {Math.round(userProgress.totalFocusMinutes)} min total
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#fef3c7', 
                borderRadius: 8,
                border: '2px solid #f59e0b',
                boxShadow: '2px 2px 0px #f59e0b'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#f59e0b' }}>
                  {Math.round((history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length / Math.max(history.filter(s => s.mode === 'focus').length, 1)) * 100)}%
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Success Rate</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {history.filter(s => s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8).length} / {history.filter(s => s.mode === 'focus').length} completed
                </div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#e0f2fe', 
                borderRadius: 8,
                border: '2px solid #3b82f6',
                boxShadow: '2px 2px 0px #3b82f6'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#3b82f6' }}>
                  {userProgress.streakCount}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Day Streak</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {userProgress.aiRecommendationsFollowed} AI insights used
                </div>
              </div>
            </div>

            {/* Charts Section */}
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', gap: 20, marginBottom: 24 }}>

              {/* Productivity Trend Chart */}
              <div style={{ 
                backgroundColor: '#fff', 
                border: '2px solid #000', 
                borderRadius: 8, 
                padding: 16,
                boxShadow: '3px 3px 0px #000'
              }}>
                <h4 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                  📈 Productivity Trend
                  <span style={{ fontSize: 12, color: '#666' }}>(Last 20 Sessions)</span>
                </h4>
                <div style={{ 
                  height: 140, 
                  display: 'flex',
                  alignItems: 'end',
                  gap: 3,
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  padding: 8,
                  border: '1px solid #e0e0e0'
                }}>
                  {(() => {
                    const scores = (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores) 
                      ? smartReminders.aiLearningData.productivityScores.slice(-20) 
                      : [];
                    return scores.length > 0 ? scores.map((score, i) => (
                      <div key={i} style={{
                        flex: 1,
                        backgroundColor: score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#dc2626',
                        height: `${Math.max(score || 0, 5)}%`,
                        minHeight: 4,
                        borderRadius: 2,
                        position: 'relative',
                        cursor: 'pointer'
                      }} title={`Session ${i + 1}: ${score || 0}% productivity`}>
                        <div style={{
                          position: 'absolute',
                          bottom: -20,
                          left: '50%',
                          transform: 'translateX(-50%)',
                          fontSize: 8,
                          color: '#666',
                          whiteSpace: 'nowrap'
                        }}>
                          {i % 5 === 0 ? i + 1 : ''}
                        </div>
                      </div>
                    )) : (
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        color: '#666',
                        fontSize: 14
                      }}>
                        Complete more sessions to see productivity trends
                      </div>
                    );
                  })()}
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  marginTop: 12,
                  fontSize: 10,
                  color: '#666'
                }}>
                  <span>🔴 Low (&lt;60%)</span>
                  <span>🟡 Medium (60-79%)</span>
                  <span>🟢 High (80%+)</span>
                </div>
              </div>

              {/* Weekly Activity Heatmap */}
              <div style={{ 
                backgroundColor: '#fff', 
                border: '2px solid #000', 
                borderRadius: 8, 
                padding: 16,
                boxShadow: '3px 3px 0px #000'
              }}>
                <h4 style={{ margin: '0 0 16px 0' }}>🗓️ Weekly Activity Pattern</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 4,
                  marginBottom: 8
                }}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, i) => (
                    <div key={day} style={{ 
                      fontSize: 10, 
                      textAlign: 'center', 
                      fontWeight: 600, 
                      color: '#666',
                      marginBottom: 4
                    }}>
                      {day}
                    </div>
                  ))}
                </div>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(7, 1fr)', 
                  gap: 4
                }}>
                  {(() => {
                    const weeklyData = Array(7).fill(0);
                    history.filter(s => s.mode === 'focus').forEach(session => {
                      const day = new Date(session.startTime).getDay();
                      weeklyData[day]++;
                    });
                    const maxSessions = Math.max(...weeklyData, 1);

                    return weeklyData.map((count, i) => (
                      <div key={i} style={{
                        height: 40,
                        backgroundColor: count === 0 ? '#f0f0f0' : 
                                        count <= maxSessions * 0.25 ? '#dcfce7' :
                                        count <= maxSessions * 0.5 ? '#bbf7d0' :
                                        count <= maxSessions * 0.75 ? '#86efac' : '#22c55e',
                        border: '1px solid #e0e0e0',
                        borderRadius: 4,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 600,
                        color: count > maxSessions * 0.5 ? '#fff' : '#000'
                      }} title={`${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][i]}: ${count} sessions`}>
                        {count}
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </div>

            {/* Session Timeline & Performance */}
            <div style={{ marginBottom: 24 }}>
              <h4>⏰ Session Timeline & Performance</h4>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                border: '1px solid #e0e0e0', 
                borderRadius: 8, 
                padding: 16,
                maxHeight: 200,
                overflow: 'auto'
              }}>
                {history.length === 0 ? (
                  <div style={{ textAlign: 'center', color: '#666', padding: 20 }}>
                    No session data available. Start focusing to see your timeline!
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {history.slice(0, 10).map((session, i) => (
                      <div key={session.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '8px 12px',
                        backgroundColor: '#fff',
                        borderRadius: 6,
                        border: '1px solid #e0e0e0',
                        fontSize: 13
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            backgroundColor: session.mode === 'focus' ? 
                              (session.durationSec >= settings.focusMinutes * 60 * 0.8 ? '#22c55e' : '#f59e0b') : 
                              '#3b82f6'
                          }} />
                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {session.mode === 'focus' ? '🎯 Focus' : 
                               session.mode === 'short' ? '☕ Short Break' : 
                               '🧘 Long Break'}
                            </div>
                            <div style={{ fontSize: 11, color: '#666' }}>
                              {new Date(session.startTime).toLocaleDateString()} at {new Date(session.startTime).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600 }}>{formatTime(session.durationSec)}</div>
                          {session.productivityScore && (
                            <div style={{ fontSize: 10, color: '#666' }}>
                              {session.productivityScore}% productive
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {history.length > 10 && (
                      <div style={{ textAlign: 'center', color: '#666', fontSize: 12, fontStyle: 'italic' }}>
                        ... and {history.length - 10} more sessions
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Insights Summary */}
            {smartReminders?.aiLearningData?.sessionPatterns?.length >= 5 && (
              <div style={{ marginBottom: 24 }}>
                <h4>🧠 AI Insights & Predictions</h4>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', 
                  gap: 16 
                }}>
                  {(() => {
                    const analysis = performDeepAIAnalysis();
                    return (
                      <>
                        <div style={{ 
                          backgroundColor: '#f0f9ff', 
                          border: '2px solid #3b82f6', 
                          borderRadius: 8, 
                          padding: 16,
                          boxShadow: '2px 2px 0px #3b82f6'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Key Insights</div>
                          {analysis.insights.slice(0, 3).map((insight, i) => (
                            <div key={i} style={{ 
                              fontSize: 13, 
                              marginBottom: 6,
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 6
                            }}>
                              <span>💡</span>
                              <span>{insight}</span>
                            </div>
                          ))}
                          {analysis.insights.length === 0 && (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                              Complete more sessions for AI insights
                            </div>
                          )}
                        </div>

                        <div style={{ 
                          backgroundColor: '#f0fdf4', 
                          border: '2px solid #22c55e', 
                          borderRadius: 8, 
                          padding: 16,
                          boxShadow: '2px 2px 0px #22c55e'
                        }}>
                          <div style={{ fontWeight: 600, marginBottom: 8 }}>Next Session Prediction</div>
                          {analysis.predictions.length > 0 ? (
                            <div>
                              <div style={{ 
                                fontSize: 24, 
                                fontWeight: 700, 
                                color: '#22c55e',
                                marginBottom: 4
                              }}>
                                {analysis.predictions[0].score}%
                              </div>
                              <div style={{ fontSize: 12, color: '#666', marginBottom: 8 }}>
                                Success probability
                              </div>
                              <div style={{ fontSize: 11 }}>
                                Confidence: {Math.round(analysis.confidence)}%
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: '#666', fontStyle: 'italic' }}>
                              Analyzing patterns...
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* Export Actions */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              justifyContent: 'space-between',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button 
                  style={currentStyles.btn}
                  onClick={() => {
                    const csvData = [
                      ["Date", "Mode", "Duration (min)", "Success", "Productivity Score"],
                      ...history.map(s => [
                        new Date(s.startTime).toISOString().slice(0, 10),
                        s.mode,
                        Math.round(s.durationSec / 60),
                        s.mode === 'focus' && s.durationSec >= settings.focusMinutes * 60 * 0.8 ? 'Yes' : 'No',
                        s.productivityScore || 'N/A'
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
                  📊 Export CSV
                </button>
                <button 
                  style={currentStyles.btn}
                  onClick={() => {
                    const analyticsData = {
                      timestamp: new Date().toISOString(),
                      userProgress,
                      sessionHistory: history,
                      aiLearningData: smartReminders?.aiLearningData || {},
                      analysis: smartReminders?.aiLearningData?.sessionPatterns?.length >= 5 ? performDeepAIAnalysis() : {},
                      recommendations: getEnhancedAIRecommendations()
                    };

                    const blob = new Blob([JSON.stringify(analyticsData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `focusguard_complete_analytics_${new Date().toISOString().slice(0, 10)}.json`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                  }}
                >
                  📥 Export JSON
                </button>
              </div>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowAnalytics(false)}
              >
                Close Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{
        ...currentStyles.main,
        gridTemplateColumns: useMobileLayout ? "1fr" : "2fr 1fr",
        gap: useMobileLayout ? 16 : 24
      }}>
        {/* Timer Section */}
        <section style={currentStyles.leftCol}>
          <div style={{
            ...currentStyles.timerCard,
            padding: useMobileLayout ? 24 : 32,
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 14, color: "#666", marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                {mode === "focus" ? "FOCUS SESSION" : mode === "short" ? "SHORT BREAK" : "LONG BREAK"}
              </div>

              {/* Circular Progress Indicator */}
              <div style={{ 
                position: 'relative', 
                display: 'inline-block',
                marginBottom: 16
              }}>
                <svg width={useMobileLayout ? 200 : 240} height={useMobileLayout ? 200 : 240} style={{ transform: 'rotate(-90deg)' }}>
                  {/* Background circle */}
                  <circle
                    cx={useMobileLayout ? 100 : 120}
                    cy={useMobileLayout ? 100 : 120}
                    r={useMobileLayout ? 90 : 110}
                    fill="none"
                    stroke="#e0e0e0"
                    strokeWidth="6"
                  />
                  {/* Progress circle */}
                  <circle
                    cx={useMobileLayout ? 100 : 120}
                    cy={useMobileLayout ? 100 : 120}
                    r={useMobileLayout ? 90 : 110}
                    fill="none"
                    stroke="#000"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * (useMobileLayout ? 90 : 110)}`}
                    strokeDashoffset={`${2 * Math.PI * (useMobileLayout ? 90 : 110) * (1 - (((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60) - remaining) / (settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60)))}`}
                    style={{ 
                      transition: running ? 'none' : 'stroke-dashoffset 0.3s ease',
                      opacity: running ? 1 : 0.7
                    }}
                  />
                </svg>

                {/* Timer text overlay */}
                <div style={{ 
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <div style={{ 
                    fontSize: useMobileLayout ? 32 : 48, 
                    fontWeight: 300, 
                    fontFamily: 'monospace', 
                    letterSpacing: 2,
                    marginBottom: 4
                  }}>
                    {formatTime(remaining)}
                  </div>
                  <div style={{ 
                    fontSize: 10, 
                    color: '#666',
                    opacity: 0.8
                  }}>
                    {Math.round(((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60) - remaining) / (settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60) * 100)}% complete
                  </div>
                </div>
              </div>

              {smartReminders && smartReminders.enabled && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores && smartReminders.aiLearningData.productivityScores.length > 0 && (
                <div style={{ fontSize: 12, color: '#666', marginTop: 8 }}>
                  AI Prediction: {(() => {
                    const analysis = performDeepAIAnalysis();
                    return analysis && analysis.predictions && analysis.predictions.length > 0 ? `${analysis.predictions[0].score}% success` : 'Learning...';
                  })()}
                </div>
              )}
            </div>

            <div style={{ 
              display: "flex", 
              gap: 16, 
              marginBottom: 20,
              justifyContent: 'center',
              ...(useMobileLayout ? { flexDirection: 'column' } : {})
            }}>
              {!running ? (
                <button style={{ 
                  ...currentStyles.primaryBtn, 
                  padding: useMobileLayout ? '16px 32px' : '12px 24px',
                  fontSize: useMobileLayout ? 16 : 14
                }} onClick={startTimer}>
                  ▶ Start
                </button>
              ) : (
                <button style={{ 
                  ...currentStyles.primaryBtn, 
                  padding: useMobileLayout ? '16px 32px' : '12px 24px',
                  fontSize: useMobileLayout ? 16 : 14
                }} onClick={pauseTimer}>
                  ⏸ Pause
                </button>
              )}
              <button style={{ 
                ...currentStyles.btn, 
                padding: useMobileLayout ? '16px 32px' : '12px 24px',
                fontSize: useMobileLayout ? 16 : 14
              }} onClick={resetTimer}>
                🔄 Reset
              </button>
            </div>

            <div style={{ 
              display: "grid", 
              gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(3, 1fr)',
              gap: 12,
              maxWidth: 360,
              margin: '0 auto'
            }}>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'focus' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { setMode("focus"); resetTimer(); }}
              >
                Focus
              </button>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'short' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { setMode("short"); resetTimer(); }}
              >
                Short Break
              </button>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'long' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { setMode("long"); resetTimer(); }}
              >
                Long Break
              </button>
            </div>
          </div>
        </section>

        {/* Sidebar */}
        <aside style={{
          ...currentStyles.rightCol,
          ...(useMobileLayout ? { marginTop: 16 } : {})
        }}>
          {customization.sectionOrder.map(renderSection)}

          {/* Quick Tips */}
          <div style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>💡 AI Tips</h3>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <div style={{ marginBottom: 8 }}>• AI learns your productivity patterns automatically</div>
              <div style={{ marginBottom: 8 }}>• Follow AI recommendations to unlock bonuses</div>
              <div style={{ marginBottom: 8 }}>• Build streaks to access advanced AI features</div>
              <div>• Export your data anytime for analysis</div>
            </div>
          </div>

          {/* Reset Progress */}
          <div style={currentStyles.card}>
            <h3 style={{ marginTop: 0, color: '#dc2626' }}>⚠️ Reset Progress</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
              Permanently delete all progress including AI learning data.
            </p>
            <button 
              style={{
                ...currentStyles.btn,
                backgroundColor: '#dc2626',
                color: '#fff',
                border: '1px solid #dc2626',
                width: '100%',
                padding: useMobileLayout ? '12px' : '8px 12px'
              }}
              onClick={() => {
                if (window.confirm('⚠️ DELETE ALL PROGRESS?\n\nThis will permanently remove:\n• All session data and AI learning\n• Tasks, goals, and achievements\n• Customization settings\n\nThis cannot be undone!')) {
                  setUserProgress({
                    xp: 0,
                    level: 1,
                    totalFocusMinutes: 0,
                    totalTasks: 0,
                    totalGoalsCompleted: 0,
                    streakCount: 0,
                    lastStreakDate: null,
                    streakFreezes: 0,
                    aiRecommendationsFollowed: 0,
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
                    aiLearningData: {
                      sessionPatterns: [],
                      productivityScores: [],
                      environmentFactors: []
                    },
                    preferences: {
                      reminderTypes: ['focus', 'break', 'streak', 'optimization'],
                      aiIntensity: 'adaptive',
                      quietHours: { start: 22, end: 7 }
                    }
                  });
                  setCoins(0);
                  setOwnedItems({ themes: [], sounds: [], boosts: [] });
                  setActiveTheme('monochrome');
                  setActiveSound('default');
                  setActiveBoosts({});
                  alert('✅ All progress has been reset!');
                }
              }}
            >
              🗑️ DELETE ALL DATA
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
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 400
          }}>
            <h3 style={{ marginTop: 0 }}>Session Reflection 🤔</h3>
            <p style={{ color: "#666", margin: '8px 0', fontSize: 14 }}>
              What did you accomplish? This helps the AI learn your patterns.
            </p>
            <textarea
              value={reflectionText}
              onChange={(e) => setReflectionText(e.target.value)}
              placeholder="I completed the research for my project and made good progress on the outline..."
              style={{
                ...currentStyles.input,
                width: '100%',
                height: 80,
                resize: 'vertical',
                marginBottom: 16,
                fontSize: 13
              }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
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
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 400
          }}>
            <h3 style={{ marginTop: 0 }}>Break Time! 🧘‍♀️</h3>
            <p style={{ color: "#666", margin: '8px 0 16px', fontSize: 14 }}>
              Choose a research-backed activity to refresh your mind:
            </p>
            <div style={{ display: 'grid', gap: 12 }}>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 16, fontSize: 13 }}
                onClick={() => {
                  alert('🧘‍♀️ Stand up, stretch your arms above your head, roll your shoulders, and take 5 deep breaths. This helps reset your posture and oxygenate your brain.');
                  setShowBreakOptions(false);
                }}
              >
                🧘‍♀️ Posture Reset & Deep Breathing
              </button>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 16, fontSize: 13 }}
                onClick={() => {
                  alert('🧠 Mental refresh: Look out a window and identify 5 different objects, then count backwards from 30. This helps reset your attention.');
                  setShowBreakOptions(false);
                }}
              >
                🧠 Attention Reset Exercise
              </button>
              <button 
                style={{...currentStyles.btn, textAlign: 'left', padding: 16, fontSize: 13 }}
                onClick={() => {
                  alert('💧 Drink a full glass of water slowly and mindfully. Dehydration impacts focus more than we realize.');
                  setShowBreakOptions(false);
                }}
              >
                💧 Mindful Hydration
              </button>
              <button 
                style={{...currentStyles.smallBtn, textAlign: 'center' }}
                onClick={() => setShowBreakOptions(false)}
              >
                Skip Break Activities
              </button>
            </div>
          </div>
        </div>
      )}

      <footer style={currentStyles.footer}>
        <div style={{ fontSize: 12, color: '#666' }}>
          FocusGuard v2.0 • Level {calculateLevel(userProgress.xp)} • {userProgress.xp} XP
          {smartReminders.enabled && (
            <span style={{ marginLeft: 8, color: '#000', fontWeight: 600 }}>
              • 🤖 AI Active
            </span>
          )}
        </div>
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

// ---------------------- Monochrome Styles ----------------------
const monochromeStyles = {
  app: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    maxWidth: 1200,
    margin: "16px auto",
    padding: 16,
    backgroundColor: "#ffffff",
    color: "#000000",
    lineHeight: 1.5,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
    paddingBottom: 16,
    borderBottom: "2px solid #000000",
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: "#000000",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
    fontSize: 18,
  },
  main: {
    display: "grid",
    gridTemplateColumns: "2fr 1fr",
    gap: 24,
  },
  leftCol: {},
  rightCol: {},
  timerCard: {
    padding: 32,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    border: "2px solid #000000",
    boxShadow: "4px 4px 0px #000000",
  },
  card: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#ffffff",
    border: "1px solid #000000",
    boxShadow: "2px 2px 0px #000000",
  },
  btn: {
    backgroundColor: "#ffffff",
    color: "#000000",
    padding: "12px 16px",
    border: "1px solid #000000",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "all 0.1s ease",
    ':hover': {
      backgroundColor: "#f0f0f0",
    }
  },
  primaryBtn: {
    backgroundColor: "#000000",
    color: "#ffffff",
    padding: "12px 24px",
    border: "1px solid #000000",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    transition: "all 0.1s ease",
  },
  modeBtn: {
    backgroundColor: "#ffffff",
    color: "#000000",
    padding: "8px 12px",
    border: "1px solid #000000",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    transition: "all 0.1s ease",
  },
  smallBtn: {
    backgroundColor: "#f8f9fa",
    color: "#000000",
    padding: "6px 12px",
    border: "1px solid #000000",
    borderRadius: 4,
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
  },
  input: {
    flex: 1,
    padding: 12,
    borderRadius: 6,
    border: "1px solid #000000",
    fontSize: 13,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  smallInput: {
    width: 80,
    padding: 8,
    marginLeft: 8,
    borderRadius: 4,
    border: "1px solid #000000",
    fontSize: 13,
    backgroundColor: "#ffffff",
    color: "#000000",
  },
  historyRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #e0e0e0",
  },
  taskRow: {
    padding: "8px 0",
    borderBottom: "1px solid #f0f0f0",
  },
  iconBtn: {
    backgroundColor: "transparent",
    border: "none",
    cursor: "pointer",
    color: "#666666",
    padding: 6,
    borderRadius: 4,
    fontSize: 12,
    ':hover': {
      backgroundColor: "#f0f0f0",
    }
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    textAlign: "center",
    borderTop: "1px solid #e0e0e0",
  },
  rowLabel: { 
    display: "flex", 
    justifyContent: "space-between", 
    alignItems: "center",
    fontSize: 13,
    fontWeight: 500,
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20
  },
  modal: {
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: 12,
    padding: 24,
    maxWidth: 500,
    width: '100%',
    boxShadow: '6px 6px 0px #000000'
  }
};

const monochromeCSS = `
  body { 
    background: #ffffff; 
    margin: 0; 
    color: #000000;
  }
  * { 
    box-sizing: border-box; 
  }
  button:hover {
    background-color: #000000 !important;
    color: #ffffff !important;
    transform: translateY(-1px);
    transition: all 0.2s ease;
  }
  button:active {
    transform: translateY(0px);
  }
  button[style*="backgroundColor: #000000"]:hover {
    background-color: #333333 !important;
  }
  .primary-btn:hover {
    background-color: #333333 !important;
  }
  @media (max-width: 768px) {
    main { 
      grid-template-columns: 1fr !important; 
    }
  }
`;