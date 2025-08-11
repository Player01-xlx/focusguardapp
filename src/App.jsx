
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
    achievements: true,
    streaks: true,
    sessionHighlights: true
  },
  sectionOrder: ['tasks', 'dailyGoals', 'insights', 'achievements', 'streaks', 'sessionHighlights', 'settings', 'history']
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

  // Customization state
  const [customization, setCustomization] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_customization");
      return saved ? JSON.parse(saved) : DEFAULT_CUSTOMIZATION;
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

  // UI state
  const [showCustomization, setShowCustomization] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
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
  }, [userProgress]);

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
    const startTime = sessionStartRef.current || (endTime - (settings.focusMinutes * 60 * 1000));
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

  // Notifications
  function requestNotificationPermission() {
    if (!("Notification" in window)) {
      alert("This browser does not support notifications.");
      return;
    }
    Notification.requestPermission().then((p) => {
      alert("Notification permission: " + p);
    });
  }
  function sendNotification(title, body) {
    if (!("Notification" in window)) return;
    if (Notification.permission === "granted") {
      try {
        new Notification(title, { body });
      } catch (e) {
        // Some browsers restrict notifications on insecure origins (http). Replit uses https though.
        console.warn("Notification failed", e);
      }
    }
  }

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
          const newTotalTasks = prev.totalTasks + 1;
          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.id === 'task_master' && newTotalTasks >= 50) {
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });
          
          return {
            ...prev,
            xp: prev.xp + 5, // 5 XP per task
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
          const newGoalsCompleted = prev.totalGoalsCompleted + 1;
          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.id === 'goal_crusher' && newGoalsCompleted >= 25) {
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });
          
          return {
            ...prev,
            xp: prev.xp + 10, // 10 XP per goal
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

  // Customization handlers
  function updateCustomization(key, value) {
    setCustomization(prev => ({ ...prev, [key]: value }));
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
        
      case 'achievements':
        const unlockedAchievements = userProgress.achievements.filter(a => a.unlocked);
        return (
          <div key="achievements" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Achievements 🏆</h3>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 24, marginBottom: 4 }}>Level {userProgress.level}</div>
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
                  width: `${((userProgress.xp % 100) / 100) * 100}%`,
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
        
      default:
        return null;
    }
  }

  // ---------------------- Render ----------------------
  const currentStyles = isDarkMode ? { ...styles, ...darkStyles } : styles;

  return (
    <div style={{ ...currentStyles.app, ...(isDarkMode ? { background: "#1a1a1a", color: "#e0e0e0" } : {}) }}>
      <style>{isDarkMode ? darkCssStyles : cssStyles}</style>
      <header style={currentStyles.header}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{
            ...currentStyles.logo,
            backgroundColor: isDarkMode ? "#ffffff" : "#111",
            color: isDarkMode ? "#0d1117" : "#fff"
          }}>FG</div>
          <h1 style={{ margin: 0, fontSize: 20 }}>FocusGuard</h1>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button 
            style={{ ...styles.btn, ...(isDarkMode ? styles.darkBtn : {}) }} 
            onClick={() => setShowCustomization(!showCustomization)}
          >
            🎨 Customize
          </button>
          <button 
            style={{ ...styles.btn, ...(isDarkMode ? styles.darkBtn : {}) }} 
            onClick={() => setIsDarkMode(!isDarkMode)}
          >
            {isDarkMode ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button style={{ ...styles.btn, ...(isDarkMode ? styles.darkBtn : {}) }} onClick={requestNotificationPermission}>Enable Notifications</button>
        </div>
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
          justifyContent: 'center'
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: 500,
            maxHeight: '80vh',
            overflow: 'auto',
            margin: 20
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0 }}>Customize Your App</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowCustomization(false)}>✖</button>
            </div>
            
            <div style={{ marginBottom: 16 }}>
              <h4>Theme Color</h4>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                      position: 'relative'
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
              <h4>Section Order & Visibility</h4>
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
                  <span style={{ flex: 1, textTransform: 'capitalize' }}>
                    {section.replace(/([A-Z])/g, ' $1')}
                  </span>
                </div>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={currentStyles.btn} onClick={() => setShowCustomization(false)}>
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      <main style={currentStyles.main}>
        <section style={currentStyles.leftCol}>
          <div style={currentStyles.timerCard}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 12, color: "#666" }}>Mode</div>
                <div style={{ fontWeight: 700 }}>{mode === "focus" ? "Focus" : mode === "short" ? "Short Break" : "Long Break"}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 12, color: "#666" }}>Remaining</div>
                <div style={{ fontSize: 28, fontWeight: 700 }}>{formatTime(remaining)}</div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              {!running ? (
                <button style={{ ...currentStyles.btn, flex: 1 }} onClick={startTimer}>Start</button>
              ) : (
                <button style={{ ...currentStyles.btn, flex: 1 }} onClick={pauseTimer}>Pause</button>
              )}
              <button style={{ ...currentStyles.btn, flex: 1 }} onClick={resetTimer}>Reset</button>
            </div>

            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <button style={currentStyles.smallBtn} onClick={() => { setMode("focus"); resetTimer(); }}>Focus</button>
              <button style={currentStyles.smallBtn} onClick={() => { setMode("short"); resetTimer(); }}>Short Break</button>
              <button style={currentStyles.smallBtn} onClick={() => { setMode("long"); resetTimer(); }}>Long Break</button>
            </div>
          </div>
        </section>

        <aside style={currentStyles.rightCol}>
          {customization.sectionOrder.map(renderSection)}
          
          <div style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>Quick Tips</h3>
            <ol style={{ margin: 0, paddingLeft: 18 }}>
              <li>Earn XP for every minute of focus time!</li>
              <li>Complete tasks and goals to unlock achievements.</li>
              <li>Maintain streaks to boost your productivity.</li>
              <li>Unlock new themes and sounds as you level up.</li>
            </ol>
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
          justifyContent: 'center'
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: 400,
            margin: 20
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
            <div style={{ display: 'flex', gap: 8 }}>
              <button style={currentStyles.btn} onClick={saveReflection}>
                Save Reflection
              </button>
              <button style={currentStyles.btn} onClick={() => setShowReflection(false)}>
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
          justifyContent: 'center'
        }}>
          <div style={{
            ...currentStyles.card,
            maxWidth: 400,
            margin: 20
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

      <footer style={currentStyles.footer}>
        <small>Made on Replit • Level {userProgress.level} • {userProgress.xp} XP</small>
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
const styles = {
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
  },
  smallBtn: {
    background: "#eee",
    color: "#111",
    padding: "6px 8px",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
  },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #ddd",
  },
  smallInput: {
    width: 80,
    padding: 6,
    marginLeft: 8,
    borderRadius: 6,
    border: "1px solid #ddd",
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
@media (max-width: 720px) {
  /* Make layout single column on small screens */
  main { grid-template-columns: 1fr !important; }
}
`;

const darkCssStyles = `
body { background: #0d1117; margin: 0; color: #e6edf3; }
* { box-sizing: border-box; }
@media (max-width: 880px) {
  .App { padding: 8px; }
}
@media (max-width: 720px) {
  /* Make layout single column on small screens */
  main { grid-template-columns: 1fr !important; }
}
`;

// Dark theme style overrides
const darkStyles = {
  timerCard: {
    padding: 12,
    borderRadius: 10,
    background: "#161b22",
    boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
    border: "1px solid #30363d",
  },
  card: {
    marginTop: 12,
    padding: 12,
    borderRadius: 10,
    background: "#161b22",
    boxShadow: "0 1px 6px rgba(0,0,0,0.3)",
    border: "1px solid #30363d",
  },
  btn: {
    background: "#21262d",
    color: "#e6edf3",
    padding: "8px 12px",
    border: "1px solid #30363d",
    borderRadius: 8,
    cursor: "pointer",
  },
  darkBtn: {
    background: "#ffffff",
    color: "#0d1117",
    border: "1px solid #30363d",
  },
  smallBtn: {
    background: "#ffffff",
    color: "#0d1117",
    padding: "6px 8px",
    border: "1px solid #30363d",
    borderRadius: 8,
    cursor: "pointer",
  },
  input: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    border: "1px solid #30363d",
    background: "#0d1117",
    color: "#e6edf3",
  },
  smallInput: {
    width: 80,
    padding: 6,
    marginLeft: 8,
    borderRadius: 6,
    border: "1px solid #30363d",
    background: "#0d1117",
    color: "#e6edf3",
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
  },
  logo: {
    width: 44,
    height: 44,
    borderRadius: 8,
    background: "#ffffff",
    color: "#0d1117",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 800,
  },
};
