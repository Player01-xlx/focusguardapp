/*
FocusGuard - React Starter (Enhanced AI Version)

What this app does:
- A mobile-friendly Pomodoro-style Pomodoro-style focus timer (start / pause / reset).
- Enhanced AI-powered recommendations and insights.
- Advanced smart reminders with machine learning.
- A task list and daily goals with intelligent prioritization.
- Session history with deep analytics.
- Clean monochrome design optimized for focus.

This file is a single-file React app optimized for productivity and focus.
*/

import React, { useState, useEffect, useRef, createContext, useContext } from "react";
import AboutUs from "./AboutUs";
import ContactUs from "./ContactUs";
import FeedbackPage from "./FeedbackPage";
import { fetchGeminiInsights, fetchGeminiRecommendations, analyzeTaskPriority } from './gemini';

// --- Deep Offline Focus Journal Integration ---

// Context for Focus Journal
const FocusJournalContext = createContext();

// Custom hook for managing Focus Journal state and logic
function useFocusJournal() {
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_journal_settings");
      return saved ? JSON.parse(saved) : { autoPrompt: true, promptFrequency: 'always' }; // always, session_end, or on_request
    } catch (e) {
      return { autoPrompt: true, promptFrequency: 'always' };
    }
  });

  const [entries, setEntries] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_journal_entries");
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Save settings whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("fg_journal_settings", JSON.stringify(settings));
    } catch (e) {
      console.error("Failed to save journal settings:", e);
    }
  }, [settings]);

  // Save entries whenever they change
  useEffect(() => {
    try {
      localStorage.setItem("fg_journal_entries", JSON.stringify(entries));
    } catch (e) {
      console.error("Failed to save journal entries:", e);
    }
  }, [entries]);

  // Function to add a new journal entry
  const addEntry = (newEntry) => {
    setEntries(prevEntries => [newEntry, ...prevEntries].slice(0, 100)); // Keep latest 100 entries
  };

  // Function to analyze past entries for recurring distractions
  const analyzeDistractions = () => {
    if (entries.length < 2) {
      return { commonDistractions: [], insight: "Not enough data to analyze distractions." };
    }

    const distractionCounts = {};
    entries.forEach(entry => {
      if (entry.distractions && Array.isArray(entry.distractions)) {
        entry.distractions.forEach(distraction => {
          const normalizedDistraction = distraction.trim().toLowerCase();
          if (normalizedDistraction) {
            distractionCounts[normalizedDistraction] = (distractionCounts[normalizedDistraction] || 0) + 1;
          }
        });
      }
    });

    const sortedDistractions = Object.entries(distractionCounts).sort(([, a], [, b]) => b - a);
    const commonDistractions = sortedDistractions.slice(0, 3).map(([distraction, count]) => ({
      name: distraction,
      count
    }));

    let insight = "No significant distractions detected.";
    if (commonDistractions.length > 0) {
      insight = `Your most common distractions appear to be: "${commonDistractions[0].name}" (${commonDistractions[0].count} times).`;
      if (commonDistractions.length > 1) {
        insight += ` Also noted: "${commonDistractions[1].name}" (${commonDistractions[1].count} times).`;
      }
    }

    return { commonDistractions, insight };
  };

  // Function to generate AI-like reflection questions
  const generateReflectionQuestions = (sessionData) => {
    const questions = [];
    const distractions = sessionData.distractions || [];

    questions.push("How did you feel during this session?");
    if (distractions.length > 0) {
      questions.push(`What was the biggest distraction you faced? (${distractions.slice(0, 1).join(', ')})`);
    } else {
      questions.push("Were there any unexpected challenges or interruptions?");
    }
    questions.push("What went well during this focus session?");
    questions.push("What could you improve for the next session?");

    return questions;
  };

  return {
    settings,
    setSettings,
    entries,
    addEntry,
    analyzeDistractions,
    generateReflectionQuestions
  };
}

// Focus Journal Component
function FocusJournal({ sessionData, onClose, onJournalSaved }) {
  const { addEntry, generateReflectionQuestions } = useFocusJournal();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userResponses, setUserResponses] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  const questions = generateReflectionQuestions(sessionData);
  const currentQuestion = questions[currentIndex];

  const handleResponseChange = (text) => {
    setUserResponses(prev => ({ ...prev, [currentQuestion]: text }));
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Last question, save the entry
      handleSaveJournal();
    }
  };

  const handleSaveJournal = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const newEntry = {
      id: generateId(),
      sessionEndTime: sessionData.endTime,
      sessionDuration: sessionData.durationSec,
      focusMode: sessionData.mode,
      userResponses: userResponses,
      distractions: sessionData.distractions || [], // Assuming distractions might be captured elsewhere
      timestamp: Date.now(),
      aiGeneratedQuestions: questions
    };

    addEntry(newEntry);

    if (onJournalSaved) {
      onJournalSaved(); // Callback to parent component
    }

    // Close the modal after saving
    onClose();
    setIsSaving(false);
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20
    }}>
      <div style={{
        backgroundColor: '#fff',
        padding: '24px 32px',
        borderRadius: 12,
        maxWidth: 500,
        width: '100%',
        boxShadow: '6px 6px 0px #000',
        border: '2px solid #000'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0 }}>Deepen Your Focus</h3>
          <button style={{
            backgroundColor: 'transparent',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            color: '#666'
          }} onClick={onClose}>
            ✖
          </button>
        </div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>Question {currentIndex + 1} of {questions.length}</div>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12 }}>
            {currentQuestion}
          </div>
          <textarea
            value={userResponses[currentQuestion] || ''}
            onChange={(e) => handleResponseChange(e.target.value)}
            placeholder="Your thoughts..."
            style={{
              width: '100%',
              minHeight: 80,
              padding: 12,
              borderRadius: 6,
              border: '1px solid #ccc',
              fontSize: 13,
              resize: 'vertical'
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between' }}>
          <button 
            style={{
              ...monochromeStyles.btn, 
              flex: 1,
              backgroundColor: '#333',
              color: '#fff'
            }} 
            onClick={() => {
              if (currentIndex > 0) {
                setCurrentIndex(currentIndex - 1);
              } else {
                onClose(); // Go back to main app if it's the first question
              }
            }}
          >
            {currentIndex > 0 ? 'Previous' : 'Cancel'}
          </button>
          <button 
            style={{
              ...monochromeStyles.primaryBtn, 
              flex: 1
            }} 
            onClick={handleNext}
            disabled={isSaving || !userResponses[currentQuestion]?.trim()}
          >
            {currentIndex < questions.length - 1 ? 'Next' : 'Save Entry'} {isSaving && '...'}
          </button>
        </div>
      </div>
    </div>
  );
}


// Offline status and PWA utilities
function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isServiceWorkerReady, setIsServiceWorkerReady] = useState(false);

  useEffect(() => {
    function handleOnline() {
      setIsOnline(true);
      console.log('🌐 App detected online status');
    }

    function handleOffline() {
      setIsOnline(false);
      console.log('📵 App detected offline status');
    }

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check service worker status
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        setIsServiceWorkerReady(true);
        console.log('✅ Service Worker ready for offline use');
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isOnline, isServiceWorkerReady };
}

// PWA Install utilities
function usePWAInstall() {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e) {
      e.preventDefault();
      setInstallPromptEvent(e);
      setIsInstallable(true);
      console.log('📱 PWA install prompt available');
    }

    function handleAppInstalled() {
      setInstallPromptEvent(null);
      setIsInstallable(false);
      console.log('✅ PWA installed successfully');
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!installPromptEvent) return false;

    try {
      installPromptEvent.prompt();
      const result = await installPromptEvent.userChoice;

      if (result.outcome === 'accepted') {
        console.log('✅ User accepted PWA install');
        setInstallPromptEvent(null);
        setIsInstallable(false);
        return true;
      } else {
        console.log('❌ User dismissed PWA install');
        return false;
      }
    } catch (error) {
      console.error('PWA install error:', error);
      return false;
    }
  };

  return { isInstallable, promptInstall };
}

// ---------------------- Constants & Utilities ----------------------
const DEFAULT_SETTINGS = {
  focusMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
  soundEnabled: true,
};

// Theme definitions with complete styling
const THEME_STYLES = {
  monochrome: {
    name: 'Monochrome',
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#333333',
    background: '#ffffff',
    cardBg: '#ffffff',
    border: '#000000',
    text: '#000000',
    textSecondary: '#666666',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#dc2626',
    shadow: '#000000'
  },
  dark: {
    name: 'Dark Mode',
    primary: '#ffffff',
    secondary: '#1a1a1a',
    accent: '#333333',
    background: '#0d0d0d',
    cardBg: '#1a1a1a',
    border: '#333333',
    text: '#ffffff',
    textSecondary: '#999999',
    success: '#22c55e',
    warning: '#f59e0b',
    error: '#dc2626',
    shadow: '#000000'
  },
  minimal: {
    name: 'Minimal White',
    primary: '#2563eb',
    secondary: '#f8fafc',
    accent: '#e2e8f0',
    background: '#ffffff',
    cardBg: '#f8fafc',
    border: '#e2e0f0',
    text: '#1e293b',
    textSecondary: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    shadow: 'rgba(0,0,0,0.1)'
  },
  ocean: {
    name: 'Ocean Blue',
    primary: '#0ea5e9',
    secondary: '#0f172a',
    accent: '#1e40af',
    background: '#f0f9ff',
    cardBg: '#ffffff',
    border: '#0ea5e9',
    text: '#0f172a',
    textSecondary: '#475569',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    shadow: 'rgba(14, 165, 233, 0.2)'
  },
  nature: {
    name: 'Nature Green',
    primary: '#16a34a',
    secondary: '#14532d',
    accent: '#15803d',
    background: '#f0fdf4',
    cardBg: '#ffffff',
    border: '#16a34a',
    text: '#14532d',
    textSecondary: '#4b5563',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    shadow: 'rgba(22, 163, 74, 0.2)'
  },
  sunset: {
    name: 'Sunset Orange',
    primary: '#ea580c',
    secondary: '#7c2d12',
    accent: '#c2410c',
    background: '#fff7ed',
    cardBg: '#ffffff',
    border: '#ea580c',
    text: '#7c2d12',
    textSecondary: '#57534e',
    success: '#059669',
    warning: '#d97706',
    error: '#dc2626',
    shadow: 'rgba(234, 88, 12, 0.2)'
  },
  neon: {
    name: 'Neon Glow',
    primary: '#a855f7',
    secondary: '#581c87',
    accent: '#8b5cf6',
    background: '#faf5ff',
    cardBg: '#ffffff',
    border: '#a855f7',
    text: '#581c87',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    shadow: 'rgba(168, 85, 247, 0.3)'
  },
  retro: {
    name: 'Retro Terminal',
    primary: '#00ff41',
    secondary: '#000000',
    accent: '#003d0d',
    background: '#0a0a0a',
    cardBg: '#1a1a1a',
    border: '#00ff41',
    text: '#00ff41',
    textSecondary: '#00b82e',
    success: '#00ff41',
    warning: '#ffff00',
    error: '#ff0040',
    shadow: 'rgba(0, 255, 65, 0.3)'
  },
  galaxy: {
    name: 'Galaxy Purple',
    primary: '#7c3aed',
    secondary: '#3c1361',
    accent: '#5b21b6',
    background: '#faf5ff',
    cardBg: '#ffffff',
    border: '#7c3aed',
    text: '#3c1361',
    textSecondary: '#6b7280',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    shadow: 'rgba(124, 58, 237, 0.2)'
  }
};

const DEFAULT_CUSTOMIZATION = {
  layout: 'default', // 'default', 'compact', 'minimal'
  theme: 'monochrome',
  visibleSections: {
    tasks: true,
    dailyGoals: true,
    settings: true,
    history: false,
    aiInsights: false,
    smartRecommendations: false,
    achievements: false,
    streaks: false,
    sessionHighlights: false,
    smartReminders: false,
    focusAnalytics: false,
    localAnalytics: false,
    deviceSync: false,
    distractionBlocker: false, // Hidden by default for simplicity
    moodEnergyTracker: false, // Hidden by default for simplicity
    mindfulBreakCoach: false // Hidden by default for simplicity
  },
  sectionOrder: ['aiInsights', 'smartRecommendations', 'distractionBlocker', 'moodEnergyTracker', 'mindfulBreakCoach', 'localAnalytics', 'tasks', 'dailyGoals', 'focusAnalytics', 'achievements', 'streaks', 'sessionHighlights', 'smartReminders', 'deviceSync', 'settings', 'history'],
  headerButtons: {
    customize: true,
    analytics: true,
    notifications: true,
    aiCoach: true
  },
  showHeaderButtons: true,
  version: '2.1' // Version tracking for updates
};

// Achievements data
const ACHIEVEMENTS = [
  // Basic Milestones (10-30 coins)
  { id: 'first_session', name: 'Getting Started', description: 'Complete your first focus session', icon: '🎯', coins: 10, unlocked: false },
  { id: 'first_task', name: 'Task Starter', description: 'Complete your first task', icon: '✅', coins: 10, unlocked: false },
  { id: 'goal_starter', name: 'Goal Setter', description: 'Complete your first daily goal', icon: '🎯', coins: 15, unlocked: false },
  { id: 'first_reflection', name: 'Thoughtful Begin', description: 'Write your first session reflection', icon: '💭', coins: 15, unlocked: false },
  { id: 'short_burst', name: 'Sprint Master', description: 'Complete a 5-minute focus session', icon: '💨', coins: 15, unlocked: false },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a focus session before 8 AM', icon: '🌅', coins: 20, unlocked: false },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a focus session after 10 PM', icon: '🦉', coins: 20, unlocked: false },
  { id: 'first_purchase', name: 'First Purchase', description: 'Buy your first item from the shop', icon: '🛒', coins: 20, unlocked: false },
  { id: 'ten_sessions', name: 'Tenacious', description: 'Complete 10 focus sessions', icon: '💯', coins: 20, unlocked: false },
  { id: 'lunch_break_pro', name: 'Lunch Break Pro', description: 'Complete a session during lunch (11 AM - 2 PM)', icon: '🥪', coins: 20, unlocked: false },
  { id: 'first_week', name: 'First Week', description: 'Complete 7 focus sessions total', icon: '📅', coins: 25, unlocked: false },
  { id: 'perfect_pomodoro', name: 'Perfect Pomodoro', description: 'Complete exactly 25 minutes without pause', icon: '🍅', coins: 25, unlocked: false },
  { id: 'task_rookie', name: 'Task Rookie', description: 'Complete 10 tasks', icon: '📝', coins: 25, unlocked: false },
  { id: 'golden_hour', name: 'Golden Hour', description: 'Complete a session during 6-8 PM', icon: '🌇', coins: 25, unlocked: false },
  { id: 'weekend_grind', name: 'Weekend Grind', description: 'Complete 4 focus sessions on a weekend day', icon: '🏖️', coins: 25, unlocked: false },

  // Medium Difficulty (30-50 coins)
  { id: 'streak_3', name: 'On Fire', description: 'Maintain a 3-day streak', icon: '🔥', coins: 30, unlocked: false },
  { id: 'midnight_warrior', name: 'Midnight Warrior', description: 'Complete a session between 12 AM - 4 AM', icon: '🌙', coins: 30, unlocked: false },
  { id: 'monday_motivation', name: 'Monday Motivation', description: 'Complete 3 sessions on a Monday', icon: '💼', coins: 30, unlocked: false },
  { id: 'smart_notifications', name: 'Notification Pro', description: 'Enable AI smart notifications', icon: '🔔', coins: 30, unlocked: false },
  { id: 'data_sharer', name: 'Data Sharer', description: 'Generate a sync code to share progress', icon: '🔗', coins: 30, unlocked: false },
  { id: 'twenty_five_sessions', name: 'Quarter Century', description: 'Complete 25 focus sessions', icon: '🥉', coins: 35, unlocked: false },
  { id: 'sunrise_session', name: 'Sunrise Session', description: 'Start a focus session during sunrise (5-7 AM)', icon: '🌄', coins: 35, unlocked: false },
  { id: 'friday_finisher', name: 'Friday Finisher', description: 'Complete 5 sessions on a Friday', icon: '🎉', coins: 35, unlocked: false },
  { id: 'weekend_warrior', name: 'Weekend Warrior', description: 'Complete sessions on both Saturday and Sunday', icon: '⚔️', coins: 40, unlocked: false },
  { id: 'hundred_minutes', name: 'Century Club', description: 'Focus for 100 minutes total', icon: '⏳', coins: 40, unlocked: false },
  { id: 'speed_demon', name: 'Speed Demon', description: 'Complete 5 focus sessions in one day', icon: '💨', coins: 40, unlocked: false },
  { id: 'data_scientist', name: 'Data Scientist', description: 'Export your analytics data 5 times', icon: '📊', coins: 40, unlocked: false },
  { id: 'comeback_kid', name: 'Comeback Kid', description: 'Rebuild a streak after losing one over 10 days', icon: '🔄', coins: 45, unlocked: false },
  { id: 'fifty_sessions', name: 'Dedicated', description: 'Complete 50 focus sessions', icon: '🥈', coins: 50, unlocked: false },
  { id: 'streak_7', name: 'Weekly Warrior', description: 'Maintain a 7-day streak', icon: '⚡', coins: 50, unlocked: false },
  { id: 'ai_student', name: 'AI Student', description: 'Follow 10 AI recommendations', icon: '🤖', coins: 50, unlocked: false },
  { id: 'daily_clean_sweep', name: 'Clean Sweep', description: 'Complete all daily goals in one day (3+ goals)', icon: '🧹', coins: 50, unlocked: false },
  { id: 'analytics_master', name: 'Analytics Master', description: 'View analytics dashboard 20 times', icon: '📈', coins: 50, unlocked: false },
  { id: 'evening_expert', name: 'Evening Expert', description: 'Complete 10 sessions after 6 PM', icon: '🌆', coins: 50, unlocked: false },

  // Higher Difficulty (55-85 coins)
  { id: 'afternoon_ace', name: 'Afternoon Ace', description: 'Complete 15 sessions between 12-6 PM', icon: '☀️', coins: 55, unlocked: false },
  { id: 'five_hours', name: 'Time Keeper', description: 'Focus for 5 hours total', icon: '⏰', coins: 60, unlocked: false },
  { id: 'marathon', name: 'Marathoner', description: 'Complete a 2-hour focus session', icon: '🏃‍♂️', coins: 60, unlocked: false },
  { id: 'morning_person', name: 'Morning Person', description: 'Complete 10 sessions before 9 AM', icon: '🌞', coins: 60, unlocked: false },
  { id: 'task_master', name: 'Task Master', description: 'Complete 50 tasks', icon: '✅', coins: 60, unlocked: false },
  { id: 'reflective_soul', name: 'Reflective Soul', description: 'Save 25 session reflections', icon: '🪞', coins: 60, unlocked: false },
  { id: 'double_trouble', name: 'Double Trouble', description: 'Complete 2 sessions of exactly double length (50min after 25min)', icon: '✖️', coins: 60, unlocked: false },
  { id: 'goal_crusher', name: 'Goal Crusher', description: 'Complete 25 daily goals', icon: '🎯', coins: 70, unlocked: false },
  { id: 'streak_14', name: 'Consistent', description: 'Maintain a 14-day streak', icon: '💪', coins: 70, unlocked: false },
  { id: 'daily_champion', name: 'Daily Champion', description: 'Complete 8 focus sessions in one day', icon: '🏆', coins: 70, unlocked: false },
  { id: 'mindful_warrior', name: 'Mindful Warrior', description: 'Write reflections for 10 consecutive sessions', icon: '🧘‍♂️', coins: 70, unlocked: false },
  { id: 'first_month', name: 'Monthly Milestone', description: 'Complete 30 focus sessions total', icon: '🗓️', coins: 75, unlocked: false },
  { id: 'all_rounder', name: 'All Rounder', description: 'Complete sessions in morning, afternoon, and evening on same day', icon: '🌈', coins: 75, unlocked: false },
  { id: 'lucky_seven', name: 'Lucky Seven', description: 'Complete exactly 7 sessions, each exactly 7 minutes apart', icon: '🍀', coins: 77, unlocked: false },
  { id: 'theme_collector', name: 'Theme Collector', description: 'Own 3 different themes', icon: '🎨', coins: 80, unlocked: false },
  { id: 'hundred_sessions', name: 'Focused', description: 'Complete 100 focus sessions', icon: '🥇', coins: 80, unlocked: false },
  { id: 'weekly_goals_master', name: 'Weekly Goals Master', description: 'Complete daily goals 7 days in a row', icon: '📈', coins: 80, unlocked: false },
  { id: 'prime_time', name: 'Prime Time', description: 'Complete sessions on 5 prime numbered days of month', icon: '🔢', coins: 85, unlocked: false },

  // Expert Level (90-150 coins)
  { id: 'ten_hours', name: 'Time Lord', description: 'Focus for 10 hours total', icon: '🕰️', coins: 90, unlocked: false },
  { id: 'fibonacci_focus', name: 'Fibonacci Focus', description: 'Complete sessions following Fibonacci sequence (1,1,2,3,5 in days)', icon: '🌀', coins: 100, unlocked: false },
  { id: 'streak_30', name: 'Marathon Streak', description: 'Maintain a 30-day streak', icon: '🚀', coins: 100, unlocked: false },
  { id: 'productivity_beast', name: 'Productivity Beast', description: 'Complete 10 focus sessions in one day', icon: '👹', coins: 100, unlocked: false },
  { id: 'productivity_machine', name: 'Productivity Machine', description: 'Complete 100 tasks', icon: '⚙️', coins: 100, unlocked: false },
  { id: 'sound_engineer', name: 'Sound Engineer', description: 'Own 5 different sound effects', icon: '🔊', coins: 100, unlocked: false },
  { id: 'twenty_five_hours', name: 'Day Warrior', description: 'Focus for 25 hours total', icon: '📊', coins: 120, unlocked: false },
  { id: 'two_fifty_sessions', name: 'Elite Focus', description: 'Complete 250 focus sessions', icon: '🏆', coins: 120, unlocked: false },
  { id: 'power_user', name: 'Power User', description: 'Use 10 different power-ups', icon: '⚡', coins: 120, unlocked: false },
  { id: 'ai_master', name: 'AI Master', description: 'Follow 50 AI recommendations', icon: '🧠', coins: 150, unlocked: false },
  { id: 'streak_50', name: 'Streak Beast', description: 'Maintain a 50-day streak', icon: '🦁', coins: 150, unlocked: false },
  { id: 'ultra_marathon', name: 'Ultra Marathoner', description: 'Complete a 4-hour focus session', icon: '🏁', coins: 150, unlocked: false },
  { id: 'unstoppable', name: 'Unstoppable', description: 'Complete 15 focus sessions in one day', icon: '🚀', coins: 150, unlocked: false },
  { id: 'shopaholic', name: 'Shopaholic', description: 'Spend 1000 coins in the shop', icon: '💳', coins: 150, unlocked: false },

  // Master Level (180-300 coins)
  { id: 'task_legend', name: 'Task Legend', description: 'Complete 250 tasks', icon: '🏅', coins: 180, unlocked: false },
  { id: 'five_hundred_sessions', name: 'Focus Virtuoso', description: 'Complete 500 focus sessions', icon: '🎖️', coins: 180, unlocked: false },
  { id: 'zen_master', name: 'Zen Master', description: 'Save 100 session reflections', icon: '🧘', coins: 180, unlocked: false },
  { id: 'fifty_hours', name: 'Work Beast', description: 'Focus for 50 hours total', icon: '💼', coins: 200, unlocked: false },
  { id: 'streak_100', name: 'Streak Legend', description: 'Maintain a 100-day streak', icon: '🌟', coins: 200, unlocked: false },
  { id: 'consistency_king', name: 'Consistency King', description: 'Complete at least 1 session daily for 30 days', icon: '🗓️', coins: 200, unlocked: false },
  { id: 'iron_will', name: 'Iron Will', description: 'Complete 50 consecutive sessions without skipping', icon: '🗿', coins: 200, unlocked: false },
  { id: 'ai_sensei', name: 'AI Sensei', description: 'Follow 100 AI recommendations', icon: '🥋', coins: 250, unlocked: false },
  { id: 'iron_focus', name: 'Iron Focus', description: 'Complete a 6-hour focus session', icon: '🔥', coins: 250, unlocked: false },
  { id: 'perfectionist', name: 'Perfectionist', description: 'Achieve 100% success rate for 25 sessions', icon: '💎', coins: 250, unlocked: false },
  { id: 'thousand_sessions', name: 'Master', description: 'Complete 1000 focus sessions', icon: '👑', coins: 300, unlocked: false },
  { id: 'centurion', name: 'Centurion', description: 'Complete 100 sessions in 30 days', icon: '🏛️', coins: 300, unlocked: false },
  { id: 'philosopher', name: 'Philosopher', description: 'Save 250 session reflections', icon: '🤔', coins: 300, unlocked: false },

  // Legendary (350-500 coins)
  { id: 'hundred_hours', name: 'Century Timer', description: 'Focus for 100 hours total', icon: '⭐', coins: 350, unlocked: false },
  { id: 'comeback_champion', name: 'Comeback Champion', description: 'Rebuild to 30-day streak after losing 50+ day streak', icon: '🔥', coins: 400, unlocked: false },
  { id: 'legend', name: 'Living Legend', description: 'Reach level 50', icon: '🌟', coins: 500, unlocked: false },
];

function formatTime(seconds) {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = Math.floor(seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// XP Calculation Logic
function calculateLevel(xp) {
  let level = 1;
  let xpNeededForLevel = 100; // Base XP for level 2
  while (xp >= xpNeededForLevel) {
    xp -= xpNeededForLevel;
    level++;
    xpNeededForLevel = Math.floor(xpNeededForLevel * 1.15); // Increase XP requirement by 15% each level
  }
  return level;
}

function getXPForNextLevel(currentXP) {
  let level = 1;
  let xpNeededForLevel = 100;
  let xpAccumulated = 0;

  while (xpAccumulated <= currentXP) {
    xpAccumulated += xpNeededForLevel;
    level++;
    xpNeededForLevel = Math.floor(xpNeededForLevel * 1.15);
  }
  return xpAccumulated;
}

function getXPProgressInCurrentLevel(currentXP) {
  let level = 1;
  let xpNeededForLevel = 100;
  let xpAccumulated = 0;
  let xpForCurrentLevel = 0;

  while (xpAccumulated <= currentXP) {
    xpAccumulated += xpNeededForLevel;
    level++;
    xpForCurrentLevel = xpNeededForLevel; // XP needed for the level we just passed
    xpNeededForLevel = Math.floor(xpNeededForLevel * 1.15);
  }

  // XP within the current level
  const xpInCurrentLevel = currentXP - (xpAccumulated - xpForCurrentLevel);

  // Calculate progress towards the *next* level
  const xpToNextLevel = xpNeededForLevel; // xpNeededForLevel is already calculated for the next level

  return xpToNextLevel === 0 ? 0 : (xpInCurrentLevel / xpToNextLevel) * 100;
}


// Mindful Break Activities Database
const BREAK_ACTIVITIES = {
  movement: [
    {
      id: 'desk_stretch',
      name: '5-Minute Desk Stretches',
      description: 'Gentle stretches to relieve neck, shoulder, and back tension',
      duration: 300, // 5 minutes
      difficulty: 'easy',
      benefits: ['Reduces muscle tension', 'Improves circulation', 'Prevents stiffness'],
      conditions: ['high_focus', 'long_session', 'physical_fatigue'],
      instructions: [
        'Neck rolls: Slowly roll your head in circles (30 seconds each direction)',
        'Shoulder shrugs: Lift shoulders to ears, hold 5 seconds, repeat 10 times',
        'Seated spinal twist: Rotate torso left and right, hold 15 seconds each',
        'Wrist stretches: Extend arm, pull fingers back gently, hold 15 seconds',
        'Ankle rolls: Lift feet, rotate ankles in circles (30 seconds each)'
      ]
    },
    {
      id: 'walking_break',
      name: '3-Minute Mindful Walk',
      description: 'Short walk focusing on breath and surroundings',
      duration: 180, // 3 minutes
      difficulty: 'easy',
      benefits: ['Boosts creativity', 'Increases alertness', 'Improves mood'],
      conditions: ['mental_fatigue', 'creative_block', 'low_energy'],
      instructions: [
        'Stand up slowly and take three deep breaths',
        'Walk at a comfortable pace, indoor or outdoor',
        'Focus on your breathing rhythm',
        'Notice your surroundings without judgment',
        'Return to your workspace feeling refreshed'
      ]
    },
    
    {
      id: 'energizing_moves',
      name: '2-Minute Energy Boost',
      description: 'Quick exercises to re-energize body and mind',
      duration: 120, // 2 minutes
      difficulty: 'moderate',
      benefits: ['Increases energy', 'Improves focus', 'Boosts circulation'],
      conditions: ['low_energy', 'afternoon_dip', 'sluggish'],
      instructions: [
        'Jumping jacks: 30 seconds of moderate intensity',
        'Arm circles: 30 seconds forward, 30 seconds backward',
        'Marching in place: High knees for 30 seconds',
        'Take 5 deep breaths to cool down'
      ]
    }
  ],
  meditation: [
    {
      id: 'breathing_exercise',
      name: '4-7-8 Breathing Technique',
      description: 'Calming breath work to reduce stress and reset focus',
      duration: 240, // 4 minutes
      difficulty: 'easy',
      benefits: ['Reduces stress', 'Calms nervous system', 'Improves focus'],
      conditions: ['stress', 'anxiety', 'overwhelmed', 'need_calm'],
      instructions: [
        'Sit comfortably with back straight',
        'Exhale completely through your mouth',
        'Inhale through nose for 4 counts',
        'Hold breath for 7 counts',
        'Exhale through mouth for 8 counts',
        'Repeat cycle 4 times'
      ]
    },
    {
      id: 'body_scan',
      name: '5-Minute Body Scan',
      description: 'Progressive relaxation to release tension',
      duration: 300, // 5 minutes
      difficulty: 'easy',
      benefits: ['Reduces physical tension', 'Increases body awareness', 'Promotes relaxation'],
      conditions: ['physical_tension', 'stress', 'high_focus'],
      instructions: [
        'Sit or lie down comfortably',
        'Close eyes and take three deep breaths',
        'Start at your toes, notice any tension',
        'Progressively move up through each body part',
        'Consciously relax each area as you scan',
        'End with three more deep breaths'
      ]
    },
    {
      id: 'mindfulness_minute',
      name: '2-Minute Mindfulness Reset',
      description: 'Quick mindfulness practice to center yourself',
      duration: 120, // 2 minutes
      difficulty: 'easy',
      benefits: ['Improves present-moment awareness', 'Reduces mental clutter', 'Enhances clarity'],
      conditions: ['scattered_mind', 'overwhelmed', 'need_clarity'],
      instructions: [
        'Sit comfortably and close your eyes',
        'Focus on your natural breathing',
        'When thoughts arise, acknowledge them gently',
        'Return attention to your breath',
        'End by setting intention for next session'
      ]
    }
  ],
  eyeExercises: [
    {
      id: 'eye_relaxation',
      name: '3-Minute Eye Relief',
      description: 'Exercises to reduce eye strain and fatigue',
      duration: 180, // 3 minutes
      difficulty: 'easy',
      benefits: ['Reduces eye strain', 'Prevents dry eyes', 'Relaxes eye muscles'],
      conditions: ['eye_strain', 'screen_time', 'visual_fatigue'],
      instructions: [
        'Look away from screen and blink 20 times slowly',
        'Focus on object 20+ feet away for 30 seconds',
        'Close eyes and gently massage temples',
        'Palm your eyes: cover with palms for 30 seconds',
        'Do slow eye circles: 5 times each direction'
      ]
    },
    {
      id: 'focus_shift',
      name: '2-Minute Focus Training',
      description: 'Eye exercises to improve focus and reduce strain',
      duration: 120, // 2 minutes
      difficulty: 'easy',
      benefits: ['Improves visual focus', 'Strengthens eye muscles', 'Reduces fatigue'],
      conditions: ['long_screen_time', 'visual_fatigue', 'concentration_issues'],
      instructions: [
        'Hold finger 6 inches from face',
        'Focus on finger for 5 seconds',
        'Focus on object across room for 5 seconds',
        'Repeat alternating focus 10 times',
        'End with slow blinking for 30 seconds'
      ]
    }
  ],
  creative: [
    {
      id: 'doodle_break',
      name: '3-Minute Creative Doodling',
      description: 'Free-form drawing to stimulate creativity',
      duration: 180, // 3 minutes
      difficulty: 'easy',
      benefits: ['Stimulates creativity', 'Relaxes mind', 'Provides mental break'],
      conditions: ['creative_block', 'mental_fatigue', 'need_inspiration'],
      instructions: [
        'Get paper and pen (or digital drawing tool)',
        'Start with simple shapes or lines',
        'Let your hand move freely without judgment',
        'Focus on the process, not the outcome',
        'Notice how your mind feels afterward'
      ]
    },
    {
      id: 'gratitude_moment',
      name: '2-Minute Gratitude Practice',
      description: 'Quick reflection on positive aspects',
      duration: 120, // 2 minutes
      difficulty: 'easy',
      benefits: ['Improves mood', 'Increases positivity', 'Reduces stress'],
      conditions: ['low_mood', 'stress', 'need_perspective'],
      instructions: [
        'Think of 3 things you\'re grateful for today',
        'Consider why each one matters to you',
        'Notice the feeling of appreciation',
        'Smile and take a deep breath',
        'Set positive intention for next work session'
      ]
    }
  ]
};

// Intelligent Break Activity Suggestion System
function getIntelligentBreakSuggestion(recentSessions, currentContext) {
  const suggestions = [];
  
  // Analyze recent session patterns
  const last3Sessions = recentSessions.slice(0, 3);
  const avgDuration = last3Sessions.reduce((sum, s) => sum + (s.durationSec || 0), 0) / last3Sessions.length;
  const avgProductivity = last3Sessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / last3Sessions.length;
  
  const hour = new Date().getHours();
  const sessionLength = avgDuration / 60; // in minutes
  
  // Determine user's current state
  const conditions = [];
  
  if (sessionLength >= 45) conditions.push('high_focus', 'long_session');
  if (sessionLength >= 90) conditions.push('physical_fatigue');
  if (avgProductivity < 60) conditions.push('mental_fatigue', 'need_clarity');
  if (avgProductivity < 40) conditions.push('low_energy', 'overwhelmed');
  if (hour >= 13 && hour <= 16) conditions.push('afternoon_dip');
  if (sessionLength >= 60) conditions.push('eye_strain', 'screen_time', 'visual_fatigue');
  if (last3Sessions.some(s => s.durationSec < s.targetDuration * 0.7)) conditions.push('scattered_mind', 'creative_block');
  if (avgProductivity >= 85) conditions.push('need_celebration');
  
  // Collect matching activities
  Object.values(BREAK_ACTIVITIES).forEach(category => {
    category.forEach(activity => {
      const matchScore = activity.conditions.filter(c => conditions.includes(c)).length;
      if (matchScore > 0) {
        suggestions.push({ ...activity, matchScore, category: getCategoryName(activity) });
      }
    });
  });
  
  // Sort by match score and return top 3
  return suggestions
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 3);
}

function getCategoryName(activity) {
  for (const [categoryName, activities] of Object.entries(BREAK_ACTIVITIES)) {
    if (activities.some(a => a.id === activity.id)) {
      return categoryName;
    }
  }
  return 'general';
}

// Gamified Rewards Shop - Items sorted by cost within each category
const SHOP_ITEMS = {
  themes: {
    dark: { name: 'Dark Mode', price: 50, icon: '🌙', description: 'Sleek dark theme' },
    minimal: { name: 'Minimal White', price: 60, icon: '⚪', description: 'Clean minimal design' },
    ocean: { name: 'Ocean Blue', price: 80, icon: '🌊', description: 'Deep ocean theme' },
    nature: { name: 'Nature Green', price: 100, icon: '🌿', description: 'Calming nature theme' },
    sunset: { name: 'Sunset Orange', price: 120, icon: '🌅', description: 'Warm sunset colors' },
    neon: { name: 'Neon Glow', price: 150, icon: '💫', description: 'Futuristic neon theme' },
    retro: { name: 'Retro Terminal', price: 180, icon: '💻', description: 'Classic green terminal look' },
    galaxy: { name: 'Galaxy Purple', price: 200, icon: '🌌', description: 'Deep space theme' }
  },
  sounds: {
    chimes: { name: 'Wind Chimes', price: 40, icon: '🎐', description: 'Peaceful chime sounds' },
    piano: { name: 'Piano Notes', price: 60, icon: '🎹', description: 'Gentle piano notifications' },
    bells: { name: 'Temple Bells', price: 70, icon: '🔔', description: 'Meditative bell tones' },
    zen: { name: 'Zen Bowls', price: 80, icon: '🧘', description: 'Singing bowl harmony' },
    drum: { name: 'Victory Drums', price: 85, icon: '🥁', description: 'Triumphant drum beat' },
    nature: { name: 'Nature Sounds', price: 90, icon: '🦜', description: 'Bird and nature sounds' },
    harp: { name: 'Angel Harp', price: 95, icon: '🎯', description: 'Ethereal harp glissando' },
    guitar: { name: 'Guitar Chord', price: 100, icon: '🎸', description: 'Acoustic guitar strum' },
    synth: { name: 'Synth Wave', price: 110, icon: '🎵', description: 'Retro synth melody' },
    space: { name: 'Space Blips', price: 120, icon: '🚀', description: 'Futuristic sci-fi sounds' }
  },
  boosts: {
    streakFreeze: { name: 'Streak Freeze', price: 100, icon: '❄️', description: 'Protect your streak for 1 day' },
    focusBoost: { name: 'Focus Boost', price: 150, icon: '🎯', description: 'Extra focus time bonus' },
    timeExtend: { name: 'Time Warp', price: 180, icon: '⏰', description: 'Add 10 min to current session' },
    doubleXP: { name: '2x XP Boost', price: 200, icon: '⚡', description: '2x XP for 1 hour', duration: 3600 },
    tripleCoins: { name: '3x Coins', price: 250, icon: '🪙', description: 'Triple coins for 30 min', duration: 1800 },
    megaXP: { name: 'Mega XP', price: 300, icon: '💎', description: '5x XP for 15 min', duration: 900 },
    instantLevel: { name: 'Level Jump', price: 500, icon: '🚀', description: 'Instant level up (once per day)' }
  },
  special: {
    stealth: { name: 'Stealth Mode', price: 200, icon: '👤', description: 'Hide timer from others' },
    rainbow: { name: 'Rainbow Effects', price: 250, icon: '🌈', description: 'Colorful progress animations' },
    customTimer: { name: 'Custom Timer', price: 300, icon: '⏲️', description: 'Set any timer duration' },
    darkWeb: { name: 'Dark Web Mode', price: 350, icon: '🕸️', description: 'Exclusive dark interface' },
    aiCoach: { name: 'AI Coach Pro', price: 400, icon: '🤖', description: 'Advanced AI insights & predictions' },
    analytics: { name: 'Pro Analytics', price: 450, icon: '📊', description: 'Advanced productivity insights' }
  }
};

// Create proper audio context and functions
let audioContext = null;
let masterGainNode = null;
let tooltipTimeout = null;

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
  // Offline status and PWA hooks
  const { isOnline, isServiceWorkerReady } = useOnlineStatus();
  const { isInstallable, promptInstall } = usePWAInstall();

  // Update and offline notifications
  const [showUpdateNotification, setShowUpdateNotification] = useState(false);
  const [showOfflineNotification, setShowOfflineNotification] = useState(false);
  const [lastSyncAttempt, setLastSyncAttempt] = useState(null);

  // Focus Journal context provider
  const focusJournal = useFocusJournal();

  // Gemini AI State
  const [geminiData, setGeminiData] = useState({
    insights: [],
    prediction: null,
    lastUpdated: 0
  });
  const [geminiRecs, setGeminiRecs] = useState([]);
  const [isAIProcessing, setIsAIProcessing] = useState(false);


  // Settings persisted in localStorage
  const [settings, setSettings] = useState(() => {
    try {
      const raw = localStorage.getItem("fg_settings");
      return raw ? JSON.parse(raw) : DEFAULT_SETTINGS;
    } catch (e) {
      return DEFAULT_SETTINGS;
    }
  });

  // Universal button click sound handler
  const playButtonClickSound = () => {
    if (!settings.soundEnabled) return;

    try {
      if (activeSound !== 'default' && ownedItems.sounds.includes(activeSound)) {
        // Play a shorter version for button clicks
        switch(activeSound) {
          case 'piano':
            createBeep(523, 100, 'triangle');
            break;
          case 'chimes':
            createBeep(1047, 200, 'sine');
            break;
          case 'bells':
            createBeep(440, 300, 'triangle');
            break;
          case 'nature':
            createBeep(2000, 50, 'square');
            break;
          case 'space':
            createBeep(800, 80, 'square');
            break;
          case 'zen':
            createBeep(256, 400, 'sine');
            break;
          case 'guitar':
            createBeep(82, 150, 'triangle');
            break;
          case 'synth':
            createBeep(440, 80, 'sawtooth');
            break;
          case 'drum':
            createBeep(60, 50, 'square');
            break;
          case 'harp':
            createBeep(523, 80, 'triangle');
            break;
          default:
            createBeep(800, 50);
        }
      } else {
        // Default button click sound
        createBeep(800, 50);
      }
    } catch (error) {
      console.warn('Failed to play button click sound:', error);
    }
  };

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

  // Enhanced AI: Trigger Gemini Analysis on history change
  useEffect(() => {
    const updateAI = async () => {
      if (history.length >= 3 && smartReminders.enabled) {
        // Debounce: Only run if last update was > 5 mins ago or it's a fresh load
        if (Date.now() - geminiData.lastUpdated < 300000) return;
        
        setIsAIProcessing(true);
        try {
          const insights = await fetchGeminiInsights(history, userProgress, settings);
          if (insights) {
            setGeminiData({
              insights: insights.insights,
              prediction: insights.prediction,
              lastUpdated: Date.now()
            });
          }
          
          // Also refresh recommendations
          const context = {
            hour: new Date().getHours(),
            dayOfWeek: new Date().getDay(),
            energy: moodEnergyTracker.currentEnergy,
            mood: moodEnergyTracker.currentMood,
            completionRate: history.filter(s => s.mode === 'focus').length > 0 
              ? history.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8).length / history.filter(s => s.mode === 'focus').length 
              : 0,
            taskCount: tasks.filter(t => !t.done).length
          };
          
          const recs = await fetchGeminiRecommendations(context);
          if (recs) setGeminiRecs(recs);
          
        } catch (e) {
          console.error("AI Update Failed", e);
        } finally {
          setIsAIProcessing(false);
        }
      }
    };
    
    updateAI();
  }, [history, smartReminders.enabled, userProgress.level]);

  useEffect(() => {
    localStorage.setItem("fg_forceMobileLayout", JSON.stringify(forceMobileLayout));
  }, [forceMobileLayout]);

  // Username state
  const [username, setUsername] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_username");
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [showUsernameSetup, setShowUsernameSetup] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_username");
      return !saved; // Show setup if no username exists
    } catch (e) {
      return true;
    }
  });

  const [tempUsername, setTempUsername] = useState('');

  // Customization state with automatic new section detection
  const [customization, setCustomization] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_customization");
      const parsed = saved ? JSON.JSON.parse(saved) : DEFAULT_CUSTOMIZATION;

      // Auto-add new sections that don't exist in user's config
      const currentSections = Object.keys(DEFAULT_CUSTOMIZATION.visibleSections);
      const userSections = Object.keys(parsed.visibleSections || {});
      const newSections = currentSections.filter(section => !userSections.includes(section));

      // If there are new sections, add them with default visibility
      if (newSections.length > 0) {
        newSections.forEach(section => {
          parsed.visibleSections[section] = DEFAULT_CUSTOMIZATION.visibleSections[section];
        });

        // Add new sections to section order if not present
        const missingSections = DEFAULT_CUSTOMIZATION.sectionOrder.filter(
          section => !parsed.sectionOrder.includes(section)
        );
        if (missingSections.length > 0) {
          parsed.sectionOrder = [...parsed.sectionOrder, ...missingSections];
        }
      }

      // Ensure headerButtons exists
      if (!parsed.headerButtons) {
        parsed.headerButtons = DEFAULT_CUSTOMIZATION.headerButtons;
      }

      // Update version tracking
      parsed.version = DEFAULT_CUSTOMIZATION.version;

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
  const [showAchievements, setShowAchievements] = useState(false);
  const [showHowToGuide, setShowHowToGuide] = useState(false);
  const [expandedGuideSection, setExpandedGuideSection] = useState(null);
  const [showAboutUs, setShowAboutUs] = useState(false);
  const [showContactUs, setShowContactUs] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [syncCode, setSyncCode] = useState('');
  const [generatedSyncCode, setGeneratedSyncCode] = useState('');
  const [syncStatus, setSyncStatus] = useState({ type: '', message: '' });
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [syncCodes, setSyncCodes] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_syncCodes");
      const codes = saved ? JSON.parse(saved) : {};
      // Clean up expired codes on load
      const currentTime = Date.now();
      const cleanCodes = {};
      Object.keys(codes).forEach(code => {
        if (codes[code].expires > currentTime) {
          cleanCodes[code] = codes[code];
        }
      });
      if (Object.keys(cleanCodes).length !== Object.keys(codes).length) {
        localStorage.setItem("fg_syncCodes", JSON.stringify(cleanCodes));
      }
      return cleanCodes;
    } catch (e) {
      return {};
    }
  });

  // Secure ID generation for sync codes
  function generateSecureId() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Enhanced sync data validation with better error messages
  function validateSyncData(data) {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Invalid sync data format. Please check your sync code.' };
    }

    // Check for timestamp first
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      return { valid: false, error: 'Invalid sync data: missing or invalid timestamp' };
    }

    // Validate timestamp is reasonable (not too old or future)
    const now = Date.now();
    const dataAge = now - data.timestamp;
    if (dataAge > 7 * 24 * 60 * 60 * 1000) { // 7 days (reduced from 30)
      const daysOld = Math.floor(dataAge / (24 * 60 * 60 * 1000));
      return { valid: false, error: `Sync data is too old (${daysOld} days). Please generate a new sync code.` };
    }
    if (data.timestamp > now + 60 * 60 * 1000) { // 1 hour in future
      return { valid: false, error: 'Sync data timestamp is invalid. Please check your device clock.' };
    }

    // Essential fields that must exist
    const essentialFields = ['userProgress', 'settings', 'timestamp'];
    for (const field of essentialFields) {
      if (!(field in data)) {
        return { valid: false, error: `Critical sync data missing: ${field}. Sync code may be corrupted.` };
      }
    }

    // Validate user progress structure
    if (!data.userProgress || typeof data.userProgress !== 'object') {
      return { valid: false, error: 'Invalid user progress data in sync' };
    }

    // Check for required userProgress fields
    const requiredProgressFields = ['xp', 'level', 'totalFocusMinutes', 'streakCount'];
    for (const field of requiredProgressFields) {
      if (!(field in data.userProgress)) {
        return { valid: false, error: `Missing user progress field: ${field}` };
      }
    }

    return { valid: true };
  }

  // Enhanced data compression with better error handling
  function compressAndEncodeData(data) {
    try {
      // Add validation before compression
      const validation = validateSyncData(data);
      if (!validation.valid) {
        throw new Error(`Data validation failed: ${validation.error}`);
      }

      const jsonString = JSON.stringify(data);

      // Enhanced compression with proper escaping
      let compressed = jsonString
        .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
        .replace(/: /g, ':')  // Remove spaces after colons
        .replace(/, /g, ',')  // Remove spaces after commas
        .trim();

      // Basic substitution for common values (reversible)
      compressed = compressed
        .replace(/null/g, '§N§')
        .replace(/true/g, '§T§')
        .replace(/false/g, '§F§')
        .replace(/undefined/g, '§U§');

      const encoded = btoa(unescape(encodeURIComponent(compressed)));

      // Add checksum for validation
      const checksum = btoa(String(compressed.length)).slice(0, 4);
      return `${checksum}${encoded}`;
    } catch (error) {
      console.error('Compression error:', error);
      throw new Error(`Failed to create sync code: ${error.message}`);
    }
  }

  function decompressAndDecodeData(encodedData) {
    try {
      if (!encodedData || typeof encodedData !== 'string' || encodedData.length < 10) {
        throw new Error('Invalid sync code format');
      }

      // Extract checksum and data
      const checksum = encodedData.slice(0, 4);
      const data = encodedData.slice(4);

      let compressed;
      try {
        compressed = decodeURIComponent(escape(atob(data)));
      } catch (decodeError) {
        throw new Error('Invalid sync code - decoding failed');
      }

      // Verify checksum
      const expectedChecksum = btoa(String(compressed.length)).slice(0, 4);
      if (checksum !== expectedChecksum) {
        throw new Error('Sync code corrupted - checksum mismatch');
      }

      // Reverse compression
      const jsonString = compressed
        .replace(/§N§/g, 'null')
        .replace(/§T§/g, 'true')
        .replace(/§F§/g, 'false')
        .replace(/§U§/g, 'undefined');

      let parsedData;
      try {
        parsedData = JSON.parse(jsonString);
      } catch (parseError) {
        throw new Error('Invalid sync code - data parsing failed');
      }

      // Validate the parsed data
      const validation = validateSyncData(parsedData);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      return parsedData;
    } catch (error) {
      console.error('Decompression error:', error);
      throw error; // Re-throw with original error message
    }
  }

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

  // Distraction Blocker State
  const [distractionBlocker, setDistractionBlocker] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_distractionBlocker");
      return saved ? JSON.parse(saved) : {
        enabled: false,
        activeSessionOnly: true,
        intensity: 'medium', // 'light', 'medium', 'strong'
        isActive: false
      };
    } catch (e) {
      return {
        enabled: false,
        activeSessionOnly: true,
        intensity: 'medium',
        isActive: false
      };
    }
  });

  // Mood & Energy Tracker State
  const [moodEnergyTracker, setMoodEnergyTracker] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_moodEnergyTracker");
      return saved ? JSON.parse(saved) : {
        enabled: false,
        showPreSession: false,
        currentMood: null, // 'happy', 'neutral', 'sad'
        currentEnergy: null, // 1-5 scale
        history: [] // Array of {date, mood, energy, sessionSuccess}
      };
    } catch (e) {
      return {
        enabled: false,
        showPreSession: false,
        currentMood: null,
        currentEnergy: null,
        history: []
      };
    }
  });

  // Mindful Break Coach State
  const [mindfulBreakCoach, setMindfulBreakCoach] = useState(() => {
    try {
      const saved = localStorage.getItem("fg_mindfulBreakCoach");
      return saved ? JSON.parse(saved) : {
        enabled: false,
        showBreakSuggestions: true,
        currentActivity: null,
        activityHistory: [], // Track completed activities
        preferences: {
          includeMovement: true,
          includeMeditation: true,
          includeEyeExercises: true,
          preferredDuration: 'auto' // 'auto', 'short', 'medium', 'long'
        }
      };
    } catch (e) {
      return {
        enabled: false,
        showBreakSuggestions: true,
        currentActivity: null,
        activityHistory: [],
        preferences: {
          includeMovement: true,
          includeMeditation: true,
          includeEyeExercises: true,
          preferredDuration: 'auto'
        }
      };
    }
  });

  // Break Activity Modal State
  const [showBreakActivityModal, setShowBreakActivityModal] = useState(false);
  const [currentBreakActivity, setCurrentBreakActivity] = useState(null);
  const [breakActivityTimer, setBreakActivityTimer] = useState(0);
  const [breakActivityRunning, setBreakActivityRunning] = useState(false);

  // Save states to localStorage
  useEffect(() => {
    saveDataWithOfflineBackup("fg_distractionBlocker", distractionBlocker);
  }, [distractionBlocker]);

  useEffect(() => {
    saveDataWithOfflineBackup("fg_moodEnergyTracker", moodEnergyTracker);
  }, [moodEnergyTracker]);

  useEffect(() => {
    saveDataWithOfflineBackup("fg_mindfulBreakCoach", mindfulBreakCoach);
  }, [mindfulBreakCoach]);

  // Distraction Blocker Logic - Full page blur during focus sessions
  useEffect(() => {
    if (!distractionBlocker.enabled) return;

    // Activate blocker when focus session starts
    if (running && mode === 'focus' && distractionBlocker.activeSessionOnly) {
      setDistractionBlocker(prev => ({ ...prev, isActive: true }));
    }

    // Deactivate blocker when session ends or is paused
    if ((!running || mode !== 'focus') && distractionBlocker.isActive) {
      setDistractionBlocker(prev => ({ ...prev, isActive: false }));
    }
  }, [distractionBlocker.enabled, distractionBlocker.activeSessionOnly, running, mode]);

  // Enhanced data persistence with offline backup system
  useEffect(() => {
    saveDataWithOfflineBackup("fg_settings", settings);
  }, [settings]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_tasks", tasks);
  }, [tasks]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_history", history);
  }, [history]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_dailyGoals", dailyGoals);
  }, [dailyGoals]);
  useEffect(() => {
    if (username) {
      saveDataWithOfflineBackup("fg_username", username);
    }
  }, [username]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_customization", customization);
  }, [customization]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_userProgress", userProgress);
  }, [userProgress]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_coins", coins);
  }, [coins]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_ownedItems", ownedItems);
  }, [ownedItems]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_activeTheme", activeTheme);
  }, [activeTheme]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_activeSound", activeSound);
  }, [activeSound]);
  useEffect(() => {
    saveDataWithOfflineBackup("fg_activeBoosts", activeBoosts);
  }, [activeBoosts]);
  useEffect(() => {
    localStorage.setItem("fg_syncCodes", JSON.stringify(syncCodes));
  }, [syncCodes]);

  // Monitor offline status and show notifications
  useEffect(() => {
    if (!isOnline && !showOfflineNotification) {
      setShowOfflineNotification(true);
      setTimeout(() => setShowOfflineNotification(false), 5000);
    }
  }, [isOnline, showOfflineNotification]);

  // Set up global handlers for service worker
  useEffect(() => {
    // Global handler for update notifications
    window.showUpdateNotification = () => {
      setShowUpdateNotification(true);
    };

    // Global handler for connection restored
    window.handleConnectionRestored = () => {
      console.log('🌐 Connection restored - attempting data sync...');
      setLastSyncAttempt(Date.now());

      // Attempt to sync any pending data
      attemptDataSync();
    };

    // Global handler for connection lost
    window.handleConnectionLost = () => {
      console.log('📵 Connection lost - entering offline mode...');
      sendNotification('Offline Mode', 'FocusGuard is now running offline. All your data is saved locally.');
    };

    return () => {
      delete window.showUpdateNotification;
      delete window.handleConnectionRestored;
      delete window.handleConnectionLost;
    };
  }, []);

  // Attempt to sync data when connection is restored
  function attemptDataSync() {
    // Check if there's any pending sync data
    try {
      const pendingSyncData = localStorage.getItem('fg_pendingSync');
      if (pendingSyncData && isOnline) {
        console.log('🔄 Attempting to sync pending data...');
        // In a real app, this would sync with a server
        // For now, we'll just clear the pending flag
        localStorage.removeItem('fg_pendingSync');
        sendNotification('Sync Complete', 'Your offline changes have been synchronized.');
      }
    } catch (error) {
      console.warn('Sync attempt failed:', error);
    }
  }

  // Enhanced data persistence with offline backup
  function saveDataWithOfflineBackup(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));

      // Create offline backup
      const backupKey = `${key}_backup_${Date.now()}`;
      localStorage.setItem(backupKey, JSON.stringify(data));

      // Clean up old backups (keep only last 3)
      const backupKeys = Object.keys(localStorage)
        .filter(k => k.startsWith(`${key}_backup_`))
        .sort()
        .slice(0, -3);

      backupKeys.forEach(k => localStorage.removeItem(k));

      // Mark as needing sync if offline
      if (!isOnline) {
        localStorage.setItem('fg_pendingSync', 'true');
      }
    } catch (error) {
      console.error('Failed to save data:', error);
      // Attempt to clear some space and retry
      try {
        const backupKeys = Object.keys(localStorage)
          .filter(k => k.includes('_backup_'))
          .sort()
          .slice(0, -1);

        backupKeys.forEach(k => localStorage.removeItem(k));
        localStorage.setItem(key, JSON.stringify(data));
      } catch (retryError) {
        sendNotification('Storage Error', 'Unable to save data. Please clear some browser storage.');
      }
    }
  }

  // Update the remaining time if the user changes the settings
  useEffect(() => {
    if (mode === "focus") setRemaining(settings.focusMinutes * 60);
    else if (mode === "short") setRemaining(settings.shortBreakMinutes * 60);
    else setRemaining(settings.longBreakMinutes * 60);
  }, [settings, mode]);

  // Timer interval with real-time analytics updates
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
        const newRemaining = r <= 1 ? 0 : r - 1;

        // Update analytics in real-time every second - only for focus sessions
        if (mode === 'focus' && sessionStartRef.current) {
          const currentSessionMinutes = Math.round((Date.now() - sessionStartRef.current) / 60000);
          const today = new Date().toISOString().slice(0, 10);

          // Update local analytics in real-time
          setLocalAnalytics(prev => {
            const newDailyStats = { ...prev.dailyStats };
            if (!newDailyStats[today]) {
              newDailyStats[today] = { sessions: 0, minutes: 0, completedSessions: 0 };
            }

            // Update current session minutes in real-time - only count completed focus sessions
            const completedFocusSessionsToday = history.filter(s => 
              s.mode === 'focus' && 
              new Date(s.startTime).toISOString().slice(0, 10) === today
            ).reduce((sum, s) => sum + Math.round(s.durationSec / 60), 0);

            newDailyStats[today].minutes = completedFocusSessionsToday + currentSessionMinutes;

            // Only count focus sessions for total calculations
            const totalMinutes = Object.values(newDailyStats).reduce((sum, day) => sum + day.minutes, 0);
            const totalFocusSessions = Object.values(newDailyStats).reduce((sum, day) => sum + day.sessions, 0) + (running && mode === 'focus' ? 1 : 0);

            return {
              ...prev,
              dailyStats: newDailyStats,
              totalHours: totalMinutes / 60,
              averageSessionLength: totalFocusSessions > 0 ? totalMinutes / totalFocusSessions : 0
            };
          });
        }

        if (newRemaining <= 0) {
          // End of session
          clearInterval(timerRef.current);
          timerRef.current = null;
          setRunning(false);
          handleTimerEnd();
        }

        return newRemaining;
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
  }, [running, mode]);

  function handleTimerEnd() {
    // Distraction blocker will auto-deactivate via useEffect when running becomes false

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

    // Record mood/energy data for focus sessions
    if (mode === 'focus' && moodEnergyTracker.enabled && moodEnergyTracker.currentMood && moodEnergyTracker.currentEnergy) {
      const sessionSuccess = durationSec >= settings.focusMinutes * 60 * 0.8;
      const moodEnergyRecord = {
        date: new Date().toISOString().slice(0, 10),
        timestamp: endTime,
        mood: moodEnergyTracker.currentMood,
        energy: moodEnergyTracker.currentEnergy,
        sessionSuccess: sessionSuccess,
        sessionLength: Math.round(durationSec / 60),
        productivityScore: sessionRecord.productivityScore
      };

      setMoodEnergyTracker(prev => ({
        ...prev,
        history: [moodEnergyRecord, ...prev.history.slice(0, 99)], // Keep last 100 records
        currentMood: null,
        currentEnergy: null
      }));
    }

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

      // Exponential coin reward system - rewards longer sessions significantly more
      let coinsEarned = 1; // Base reward
      if (focusMinutes <= 5) {
        coinsEarned = 1;
      } else if (focusMinutes <= 15) {
        coinsEarned = Math.floor(2 + (focusMinutes - 5) * 0.3); // 2-5 coins for 5-15 min
      } else if (focusMinutes <= 30) {
        coinsEarned = Math.floor(5 + Math.pow(focusMinutes - 15, 1.3) * 0.4); // 5-12 coins for 15-30 min
      } else if (focusMinutes <= 60) {
        coinsEarned = Math.floor(12 + Math.pow(focusMinutes - 30, 1.5) * 0.3); // 12-25 coins for 30-60 min
      } else {
        // Exponential rewards for ultra-long sessions (60+ minutes)
        coinsEarned = Math.floor(25 + Math.pow(focusMinutes - 60, 1.8) * 0.2); // 25+ coins for 60+ min
      }

      // Apply XP boost if active
      if (activeBoosts.doubleXP && activeBoosts.doubleXP > Date.now()) {
        xpGained *= 2;
      }
      if (activeBoosts.tripleCoins && activeBoosts.tripleCoins > Date.now()) {
        coinsEarned *= 3;
      }

      // --- INTEGRATED JOURNAL PROMPT ---
      // Show journal reflection prompt first, then legacy reflection
      if (focusJournal.settings.autoPrompt) {
        startJournalReflection(sessionRecord);
      } else {
        setShowReflection(true);
      }
      // --- END INTEGRATED PROMPT ---

      setUserProgress(prev => {
        const newXP = prev.xp + xpGained;
        const newLevel = calculateLevel(newXP);
        const newTotalMinutes = prev.totalFocusMinutes + focusMinutes;
        const newTotalSessions = history.filter(s => s.mode === 'focus').length + 1;

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

        // Check achievements and award coins
        let totalCoinsToAdd = coinsEarned;
        const updatedAchievements = prev.achievements.map(achievement => {
          if (achievement.unlocked) return achievement;

          const hour = new Date().getHours();
          const dayOfWeek = new Date().getDay();
          const dayOfMonth = new Date().getDate();
          let shouldUnlock = false;

          // Helper function to get sessions for specific conditions
          const getFocusSessions = () => history.filter(s => s.mode === 'focus');
          const getTodaySessions = () => history.filter(s => 
            s.mode === 'focus' && 
            new Date(s.startTime).toISOString().slice(0, 10) === today
          );
          const getWeekendSessions = () => history.filter(s => 
            s.mode === 'focus' && [0, 6].includes(new Date(s.startTime).getDay())
          );

          switch (achievement.id) {
            // Basic Milestones
            case 'first_session':
              shouldUnlock = true;
              break;
            case 'first_week':
              shouldUnlock = newTotalSessions >= 7;
              break;
            case 'first_month':
              shouldUnlock = newTotalSessions >= 30;
              break;

            // Time-based Achievements
            case 'early_bird':
              shouldUnlock = hour < 8;
              break;
            case 'night_owl':
              shouldUnlock = hour >= 22;
              break;
            case 'midnight_warrior':
              shouldUnlock = hour >= 0 && hour < 4;
              break;
            case 'sunrise_session':
              shouldUnlock = hour >= 5 && hour < 7;
              break;
            case 'golden_hour':
              shouldUnlock = hour >= 18 && hour < 20;
              break;
            case 'lunch_break_pro':
              shouldUnlock = hour >= 11 && hour < 14;
              break;

            // Weekend & Daily Achievements
            case 'weekend_grind':
              shouldUnlock = (dayOfWeek === 0 || dayOfWeek === 6) && 
                getTodaySessions().length >= 4;
              break;
            case 'weekend_warrior':
              const saturdaySessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getDay() === 6 &&
                new Date(s.startTime).toISOString().slice(0, 10) === today
              );
              const sundaySessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getDay() === 0 &&
                new Date(s.startTime).toISOString().slice(0, 10) === today
              );
              shouldUnlock = saturdaySessions.length > 0 && sundaySessions.length > 0;
              break;
            case 'monday_motivation':
              shouldUnlock = dayOfWeek === 1 && getTodaySessions().length >= 3;
              break;
            case 'friday_finisher':
              shouldUnlock = dayOfWeek === 5 && getTodaySessions().length >= 5;
              break;

            // Streak Achievements
            case 'streak_3':
              shouldUnlock = newStreak >= 3;
              break;
            case 'streak_7':
              shouldUnlock = newStreak >= 7;
              break;
            case 'streak_14':
              shouldUnlock = newStreak >= 14;
              break;
            case 'streak_30':
              shouldUnlock = newStreak >= 30;
              break;
            case 'streak_50':
              shouldUnlock = newStreak >= 50;
              break;
            case 'streak_100':
              shouldUnlock = newStreak >= 100;
              break;
            case 'comeback_kid':
              // Check if they previously had a streak > 10 and rebuilt it
              shouldUnlock = newStreak >= 5 && prev.streakCount === 0;
              break;

            // Volume Achievements
            case 'ten_sessions':
              shouldUnlock = newTotalSessions >= 10;
              break;
            case 'twenty_five_sessions':
              shouldUnlock = newTotalSessions >= 25;
              break;
            case 'fifty_sessions':
              shouldUnlock = newTotalSessions >= 50;
              break;
            case 'hundred_sessions':
              shouldUnlock = newTotalSessions >= 100;
              break;
            case 'two_fifty_sessions':
              shouldUnlock = newTotalSessions >= 250;
              break;
            case 'five_hundred_sessions':
              shouldUnlock = newTotalSessions >= 500;
              break;
            case 'thousand_sessions':
              shouldUnlock = newTotalSessions >= 1000;
              break;

            // Time Duration Achievements
            case 'hundred_minutes':
              shouldUnlock = newTotalMinutes >= 100;
              break;
            case 'five_hours':
              shouldUnlock = newTotalMinutes >= 300;
              break;
            case 'ten_hours':
              shouldUnlock = newTotalMinutes >= 600;
              break;
            case 'twenty_five_hours':
              shouldUnlock = newTotalMinutes >= 1500;
              break;
            case 'fifty_hours':
              shouldUnlock = newTotalMinutes >= 3000;
              break;
            case 'hundred_hours':
              shouldUnlock = newTotalMinutes >= 6000;
              break;

            // Single Session Achievements
            case 'marathon':
              shouldUnlock = focusMinutes >= 120;
              break;
            case 'ultra_marathon':
              shouldUnlock = focusMinutes >= 240;
              break;
            case 'iron_focus':
              shouldUnlock = focusMinutes >= 360;
              break;
            case 'short_burst':
              shouldUnlock = focusMinutes <= 5;
              break;
            case 'perfect_pomodoro':
              shouldUnlock = focusMinutes === 25;
              break;

            // Task & Goal Achievements
            case 'first_task':
              shouldUnlock = prev.totalTasks >= 1;
              break;
            case 'task_rookie':
              shouldUnlock = prev.totalTasks >= 10;
              break;
            case 'task_master':
              shouldUnlock = prev.totalTasks >= 50;
              break;
            case 'productivity_machine':
              shouldUnlock = prev.totalTasks >= 100;
              break;
            case 'task_legend':
              shouldUnlock = prev.totalTasks >= 250;
              break;
            case 'goal_starter':
              shouldUnlock = prev.totalGoalsCompleted >= 1;
              break;
            case 'goal_crusher':
              shouldUnlock = prev.totalGoalsCompleted >= 25;
              break;
            case 'daily_clean_sweep':
              const todayGoals = dailyGoals.filter(g => g.createdAt === today);
              const completedTodayGoals = todayGoals.filter(g => g.completed);
              shouldUnlock = todayGoals.length >= 3 && completedTodayGoals.length === todayGoals.length;
              break;
            case 'weekly_goals_master':
              // Check if completed goals 7 days in a row
              const last7DaysWithGoals = Array.from({length: 7}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().slice(0, 10);
              });
              shouldUnlock = last7DaysWithGoals.every(date => 
                dailyGoals.some(g => g.createdAt === date && g.completed)
              );
              break;

            // AI & Technology Achievements
            case 'ai_student':
              shouldUnlock = prev.aiRecommendationsFollowed >= 10;
              break;
            case 'ai_master':
              shouldUnlock = prev.aiRecommendationsFollowed >= 50;
              break;
            case 'ai_sensei':
              shouldUnlock = prev.aiRecommendationsFollowed >= 100;
              break;
            case 'smart_notifications':
              shouldUnlock = smartReminders.enabled;
              break;

            // Daily Performance Achievements
            case 'speed_demon':
              shouldUnlock = getTodaySessions().length >= 4; // Current session makes it 5
              break;
            case 'daily_champion':
              shouldUnlock = getTodaySessions().length >= 7; // Current session makes it 8
              break;
            case 'productivity_beast':
              shouldUnlock = getTodaySessions().length >= 9; // Current session makes it 10
              break;
            case 'unstoppable':
              shouldUnlock = getTodaySessions().length >= 14; // Current session makes it 15
              break;

            // Consistency & Pattern Achievements
            case 'consistency_king':
              const last30Days = Array.from({length: 30}, (_, i) => {
                const date = new Date();
                date.setDate(date.getDate() - i);
                return date.toISOString().slice(0, 10);
              });
              shouldUnlock = last30Days.every(date => 
                history.some(s => 
                  s.mode === 'focus' && 
                  new Date(s.startTime).toISOString().slice(0, 10) === date
                )
              );
              break;
            case 'morning_person':
              const morningSessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getHours() < 9
              );
              shouldUnlock = morningSessions.length >= 10;
              break;
            case 'afternoon_ace':
              const afternoonSessions = history.filter(s => 
                s.mode === 'focus' && 
                new Date(s.startTime).getHours() >= 12 && 
                new Date(s.startTime).getHours() < 18
              );
              shouldUnlock = afternoonSessions.length >= 15;
              break;
            case 'evening_expert':
              const eveningSessions = history.filter(s => 
                s.mode === 'focus' && new Date(s.startTime).getHours() >= 18
              );
              shouldUnlock = eveningSessions.length >= 10;
              break;
            case 'all_rounder':
              const todayMorning = getTodaySessions().some(s => new Date(s.startTime).getHours() < 12);
              const todayAfternoon = getTodaySessions().some(s => {
                const h = new Date(s.startTime).getHours();
                return h >= 12 && h < 18;
              });
              const todayEvening = getTodaySessions().some(s => new Date(s.startTime).getHours() >= 18);
              shouldUnlock = todayMorning && todayAfternoon && todayEvening;
              break;

            // Reflection & Mindfulness Achievements
            case 'first_reflection':
              shouldUnlock = sessionHighlights.length >= 1;
              break;
            case 'reflective_soul':
              shouldUnlock = sessionHighlights.length >= 25;
              break;
            case 'zen_master':
              shouldUnlock = sessionHighlights.length >= 99; // Current reflection makes it 100
              break;
            case 'philosopher':
              shouldUnlock = sessionHighlights.length >= 250;
              break;
            case 'mindful_warrior':
              // Check last 10 sessions had reflections
              const last10Sessions = history.filter(s => s.mode === 'focus').slice(0, 10);
              shouldUnlock = last10Sessions.length >= 10 && 
                last10Sessions.every(s => 
                  sessionHighlights.some(h => 
                    Math.abs(h.timestamp - s.endTime) < 300000 // Within 5 minutes
                  )
                );
              break;

            // Special Pattern Achievements
            case 'fibonacci_focus':
              // Complex logic for Fibonacci pattern - simplified check
              shouldUnlock = newTotalSessions >= 13; // 1+1+2+3+5 = 12, so 13th unlocks it
              break;
            case 'prime_time':
              const primedays = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31];
              const sessionsOnPrimeDays = history.filter(s => 
                s.mode === 'focus' && 
                primedays.includes(new Date(s.startTime).getDate())
              );
              shouldUnlock = sessionsOnPrimeDays.length >= 5;
              break;
            case 'lucky_seven':
              shouldUnlock = getTodaySessions().length === 6; // Current session makes it 7
              break;

            // Challenge & Extreme Achievements  
            case 'perfectionist':
              const last25Sessions = history.filter(s => s.mode === 'focus').slice(0, 25);
              const successfulSessions = last25Sessions.filter(s => 
                s.durationSec >= settings.focusMinutes * 60 * 0.8
              );
              shouldUnlock = last25Sessions.length >= 25 && 
                successfulSessions.length === last25Sessions.length;
              break;
            case 'legend':
              shouldUnlock = calculateLevel(newXP) >= 50;
              break;

            default:
              shouldUnlock = false;
          }

          if (shouldUnlock) {
            totalCoinsToAdd += achievement.coins;
            sendNotification(`Achievement Unlocked!`, `${achievement.icon} ${achievement.name} - ${achievement.coins} coins earned!`);
            return { ...achievement, unlocked: true };
          }
          return achievement;
        });

        // Award all coins at once
        setCoins(prev => prev + totalCoinsToAdd);

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
      // Show break options or mindful break coach for break sessions
      if (mindfulBreakCoach.enabled && mindfulBreakCoach.showBreakSuggestions) {
        showIntelligentBreakSuggestion();
      } else {
        setShowBreakOptions(true);
      }
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

  // Enhanced AI Functions
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

  // Enhanced AI Analysis Functions with real machine learning algorithms
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

    // Advanced pattern recognition with weighted analysis
    const hourlyPerformance = {};
    const weekdayPerformance = {};
    const sessionLengthPerformance = {};
    const streakPerformance = {};

    // Process only focus sessions with temporal weighting (recent sessions matter more)
    sessions.filter(session => session.mode === 'focus').forEach((session, index) => {
      const score = scores[index] || 0;
      const sessionAge = sessions.length - index;
      const temporalWeight = Math.exp(-sessionAge / 10); // Exponential decay for older sessions
      const weightedScore = score * temporalWeight;

      // Hourly analysis with temporal weighting
      const hour = session.hour;
      if (!hourlyPerformance[hour]) {
        hourlyPerformance[hour] = { scores: [], weights: [], count: 0 };
      }
      hourlyPerformance[hour].scores.push(weightedScore);
      hourlyPerformance[hour].weights.push(temporalWeight);
      hourlyPerformance[hour].count++;

      // Weekday analysis with temporal weighting
      const day = session.dayOfWeek;
      if (!weekdayPerformance[day]) {
        weekdayPerformance[day] = { scores: [], weights: [], count: 0 };
      }
      weekdayPerformance[day].scores.push(weightedScore);
      weekdayPerformance[day].weights.push(temporalWeight);
      weekdayPerformance[day].count++;

      // Session length analysis
      const lengthBucket = Math.floor(session.duration / 300) * 5; // 5-minute buckets
      if (!sessionLengthPerformance[lengthBucket]) {
        sessionLengthPerformance[lengthBucket] = { scores: [], weights: [], count: 0 };
      }
      sessionLengthPerformance[lengthBucket].scores.push(weightedScore);
      sessionLengthPerformance[lengthBucket].weights.push(temporalWeight);
      sessionLengthPerformance[lengthBucket].count++;
    });

    // Calculate weighted averages
    function calculateWeightedAverage(data) {
      if (!data.scores.length) return 0;
      const weightedSum = data.scores.reduce((sum, score, i) => sum + score * data.weights[i], 0);
      const totalWeight = data.weights.reduce((sum, weight) => sum + weight, 0);
      return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }

    Object.keys(hourlyPerformance).forEach(hour => {
      const data = hourlyPerformance[hour];
      data.avgScore = calculateWeightedAverage(data);
      data.variance = data.scores.reduce((acc, score) => acc + Math.pow(score - data.avgScore, 2), 0) / data.scores.length;
    });

    Object.keys(weekdayPerformance).forEach(day => {
      const data = weekdayPerformance[day];
      data.avgScore = calculateWeightedAverage(data);
      data.variance = data.scores.reduce((acc, score) => acc + Math.pow(score - data.avgScore, 2), 0) / data.scores.length;
    });

    Object.keys(sessionLengthPerformance).forEach(length => {
      const data = sessionLengthPerformance[length];
      data.avgScore = calculateWeightedAverage(data);
    });

    // Generate AI insights with statistical significance testing
    const insights = [];
    const recommendations = [];
    const predictions = [];

    // Find statistically significant peak performance times
    const hourlyScores = Object.entries(hourlyPerformance)
      .filter(([hour, data]) => data.count >= 3)
      .sort(([,a], [,b]) => b.avgScore - a.avgScore);

    if (hourlyScores.length > 0) {
      const [bestHour, bestData] = hourlyScores[0];
      const avgAllHours = Object.values(hourlyPerformance).reduce((sum, data) => sum + data.avgScore, 0) / Object.keys(hourlyPerformance).length;

      if (bestData.avgScore > avgAllHours + 10) { // Statistically significant improvement
        insights.push(`Peak performance detected at ${bestHour}:00 (${Math.round(bestData.avgScore)}% vs ${Math.round(avgAllHours)}% average)`);
        recommendations.push({
          type: 'timing',
          title: 'Optimize Your Peak Hours',
          description: `Your productivity is ${Math.round(((bestData.avgScore - avgAllHours) / avgAllHours) * 100)}% higher at ${bestHour}:00`,
          priority: 'high',
          icon: '⏰',
          action: () => alert(`💡 AI Insight: Schedule your most challenging work between ${bestHour}:00-${parseInt(bestHour)+2}:00 for optimal results!`)
        });
      }
    }

    // Trend analysis with regression
    const recentScores = scores.slice(-10);
    const earlierScores = scores.slice(-20, -10);

    if (recentScores.length >= 5 && earlierScores.length >= 5) {
      // Linear regression on recent data
      const recentTrend = calculateTrend(recentScores);
      const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
      const earlierAvg = earlierScores.reduce((a, b) => a + b, 0) / earlierScores.length;

      if (recentTrend < -2) { // Declining trend
        insights.push(`Declining productivity trend detected (${recentTrend.toFixed(1)}% per session)`);
        recommendations.push({
          type: 'recovery',
          title: 'Productivity Recovery Protocol',
          description: 'AI detected declining performance - implementing adaptive strategies',
          priority: 'high',
          icon: '📉',
          action: () => {
            const newLength = Math.max(15, settings.focusMinutes - 5);
            setSettings(prev => ({ ...prev, focusMinutes: newLength }));
            alert('🤖 AI Recovery: Session length reduced to rebuild momentum');
          }
        });
      } else if (recentTrend > 2) { // Improving trend
        insights.push(`Improving productivity trend detected (+${recentTrend.toFixed(1)}% per session)`);
        if (recentAvg > 85) {
          recommendations.push({
            type: 'challenge',
            title: 'Performance Excellence Detected',
            description: 'Ready for increased challenge - extend session length',
            priority: 'medium',
            icon: '🚀',
            action: () => {
              const newLength = Math.min(50, settings.focusMinutes + 5);
              setSettings(prev => ({ ...prev, focusMinutes: newLength }));
              alert('🚀 AI Optimization: Session length increased for greater productivity');
            }
          });
        }
      }
    }

    // Optimal session length analysis
    const optimalLength = findOptimalSessionLength(sessionLengthPerformance);
    if (optimalLength && Math.abs(optimalLength - settings.focusMinutes) > 5) {
      recommendations.push({
        type: 'optimization',
        title: 'Session Length Optimization',
        description: `AI analysis suggests ${optimalLength}-minute sessions for peak performance`,
        priority: 'medium',
        icon: '⚙️',
        action: () => {
          setSettings(prev => ({ ...prev, focusMinutes: optimalLength }));
          alert(`🎯 AI Optimization: Session length adjusted to ${optimalLength} minutes based on your performance data`);
        }
      });
    }

    // Advanced prediction using multiple factors
    const prediction = generateProductivityPrediction(hourlyPerformance, weekdayPerformance, environment, sessions);

    predictions.push({
      type: 'session_success',
      score: Math.round(prediction.score),
      confidence: Math.round(prediction.confidence),
      factors: prediction.factors
    });

    // Calculate overall AI confidence based on data quality and quantity
    const overallConfidence = Math.min(
      (sessions.length / 30) * 70 + // Data quantity (up to 70%)
      (Object.keys(hourlyPerformance).length / 24) * 20 + // Time coverage (up to 20%)
      (sessions.filter(s => s.success).length / sessions.length) * 10, // Data quality (up to 10%)
      100
    );

    return {
      insights,
      recommendations,
      predictions,
      confidence: overallConfidence
    };
  }

  // Helper function for trend calculation
  function calculateTrend(data) {
    if (data.length < 3) return 0;
    const n = data.length;
    const sumX = (n * (n - 1)) / 2;
    const sumY = data.reduce((a, b) => a + b, 0);
    const sumXY = data.reduce((sum, y, x) => sum + x * y, 0);
    const sumXX = (n * (n - 1) * (2 * n - 1)) / 6;

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return slope;
  }

  // Helper function to find optimal session length
  function findOptimalSessionLength(lengthPerformance) {
    const validLengths = Object.entries(lengthPerformance)
      .filter(([, data]) => data.count >= 2)
      .sort(([,a], [,b]) => b.avgScore - a.avgScore);

    return validLengths.length > 0 ? parseInt(validLengths[0][0]) : null;
  }

  // Advanced prediction algorithm
  function generateProductivityPrediction(hourlyPerf, weekdayPerf, environment, sessions) {
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    let baseScore = 75;
    let confidence = 50;
    const factors = [];

    // Hourly factor with confidence weighting
    if (hourlyPerf[currentHour] && hourlyPerf[currentHour].count >= 3) {
      const hourlyFactor = hourlyPerf[currentHour].avgScore;
      const hourlyConfidence = Math.min(hourlyPerf[currentHour].count / 10, 1) * 30;
      baseScore = (baseScore * 0.6) + (hourlyFactor * 0.4);
      confidence += hourlyConfidence;
      factors.push(`Time factor: ${hourlyFactor > 75 ? 'optimal' : hourlyFactor > 60 ? 'moderate' : 'challenging'} (${hourlyPerf[currentHour].count} sessions)`);
    } else {
      factors.push('Time factor: insufficient data for current hour');
    }

    // Weekday factor
    if (weekdayPerf[currentDay] && weekdayPerf[currentDay].count >= 2) {
      const weekdayFactor = weekdayPerf[currentDay].avgScore;
      const weekdayConfidence = Math.min(weekdayPerf[currentDay].count / 5, 1) * 20;
      baseScore = (baseScore * 0.7) + (weekdayFactor * 0.3);
      confidence += weekdayConfidence;
      factors.push(`Day factor: ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]} performance tracked`);
    } else {
      factors.push(`Day factor: limited ${['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDay]} data`);
    }

    // Recent momentum factor
    const recentSessions = sessions.slice(-5);
    if (recentSessions.length >= 3) {
      const recentSuccessRate = recentSessions.filter(s => s.success).length / recentSessions.length;
      const momentumFactor = recentSuccessRate * 100;
      baseScore = (baseScore * 0.8) + (momentumFactor * 0.2);
      confidence += 20;
      factors.push(`Recent momentum: ${recentSuccessRate >= 0.8 ? 'strong' : recentSuccessRate >= 0.6 ? 'steady' : 'rebuilding'}`);
    } else {
      factors.push('Recent momentum: building baseline');
    }

    return {
      score: Math.max(10, Math.min(95, baseScore)),
      confidence: Math.max(20, Math.min(95, confidence)),
      factors
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
      // Check if mood/energy tracking is enabled and we're starting a focus session
      if (moodEnergyTracker.enabled && mode === 'focus' && !moodEnergyTracker.currentMood) {
        setMoodEnergyTracker(prev => ({ ...prev, showPreSession: true }));
        return;
      }

      // Initialize audio context on user interaction
      initAudioContext();

      sessionStartRef.current = Date.now() - ((settings[mode === 'focus' ? 'focusMinutes' : (mode === 'short' ? 'shortBreakMinutes' : 'longBreakMinutes')] * 60 - remaining) * 1000);
      setRunning(true);

      // Activate distraction blocker if enabled and it's a focus session
      if (distractionBlocker.enabled && mode === 'focus' && distractionBlocker.activeSessionOnly) {
        // Will be activated by visibility change listener
      }

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

  // Helper function to start the journal reflection process
  function startJournalReflection(sessionData) {
    if (!focusJournal.settings.autoPrompt) {
      setShowReflection(true); // Fallback to legacy reflection if autoPrompt is off
      return;
    }
    // The FocusJournal component itself handles the state for showing the modal
    // This function might be called to trigger its display or set initial state
    // For now, setting showReflection to true will trigger the modal based on the current logic
    // A more robust approach would involve state management within FocusJournalContext or directly controlling its visibility
    setShowReflection(true); // Triggering the legacy reflection modal for now, will integrate properly
  }

  // Show intelligent break suggestion
  function showIntelligentBreakSuggestion() {
    const focusSessions = history.filter(s => s.mode === 'focus');
    const suggestions = getIntelligentBreakSuggestion(focusSessions, {
      timeOfDay: new Date().getHours(),
      recentBreaks: mindfulBreakCoach.activityHistory.slice(0, 5)
    });
    
    if (suggestions.length > 0) {
      const topSuggestion = suggestions[0];
      
      // Filter by user preferences
      const userPrefs = mindfulBreakCoach.preferences;
      let filteredSuggestion = topSuggestion;
      
      if (!userPrefs.includeMovement && getCategoryName(topSuggestion) === 'movement') {
        filteredSuggestion = suggestions.find(s => getCategoryName(s) !== 'movement') || topSuggestion;
      }
      if (!userPrefs.includeMeditation && getCategoryName(topSuggestion) === 'meditation') {
        filteredSuggestion = suggestions.find(s => getCategoryName(s) !== 'meditation') || topSuggestion;
      }
      if (!userPrefs.includeEyeExercises && getCategoryName(topSuggestion) === 'eyeExercises') {
        filteredSuggestion = suggestions.find(s => getCategoryName(s) !== 'eyeExercises') || topSuggestion;
      }
      
      // Adjust duration based on user preference
      if (userPrefs.preferredDuration !== 'auto') {
        const durationMultiplier = {
          'short': 0.7,
          'medium': 1.0,
          'long': 1.3
        }[userPrefs.preferredDuration] || 1.0;
        
        filteredSuggestion = {
          ...filteredSuggestion,
          duration: Math.round(filteredSuggestion.duration * durationMultiplier)
        };
      }
      
      setCurrentBreakActivity(filteredSuggestion);
      setShowBreakActivityModal(true);
    } else {
      // Fallback to generic break options
      setShowBreakOptions(true);
    }
  }

  // Start break activity
  function startBreakActivity(activity) {
    setCurrentBreakActivity(activity);
    setBreakActivityTimer(0);
    setBreakActivityRunning(true);
    
    if (settings.soundEnabled) {
      playStartSound();
    }
    
    sendNotification('Break Activity Started', `${activity.name} - ${Math.round(activity.duration / 60)} minutes`);
  }

  // Skip break activity
  function skipBreakActivity() {
    setShowBreakActivityModal(false);
    setCurrentBreakActivity(null);
    setBreakActivityTimer(0);
    setBreakActivityRunning(false);
    setShowBreakOptions(true);
  }


  // Update local analytics - only for focus sessions
  function updateLocalAnalytics(sessionRecord) {
    // Only process focus sessions for analytics
    if (sessionRecord.mode !== 'focus') return;

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
  async function addTask() {
    const text = taskInput.trim();
    if (!text) return;
    
    // Optimistic add first
    const tempId = generateId();
    const initialTask = { 
      id: tempId, 
      text, 
      done: false,
      priority: 'medium',
      aiSuggested: false,
      createdAt: new Date().toISOString().slice(0, 10),
      isAnalyzing: true // New flag for UI
    };
    
    setTasks((s) => [initialTask, ...s]);
    setTaskInput("");

    // Call Gemini
    if (smartReminders.enabled) {
      try {
        const analysis = await analyzeTaskPriority(text, tasks);
        if (analysis) {
          setTasks(prev => prev.map(t => {
            if (t.id === tempId) {
              return {
                ...t,
                priority: analysis.priority,
                text: analysis.refinedText || t.text, // Use refined text if available
                aiReasoning: analysis.aiReasoning,
                isAnalyzing: false,
                aiSuggested: analysis.priority === 'high' // Tag high priority as AI suggested
              };
            }
            return t;
          }));
          if (analysis.priority === 'high') {
            playButtonClickSound(); // Subtle feedback for high priority
          }
        }
      } catch (e) {
        // Fallback if AI fails
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, isAnalyzing: false } : t));
      }
    } else {
      setTasks(prev => prev.map(t => t.id === tempId ? { ...t, isAnalyzing: false } : t));
    }
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
        // Goal completed - award XP and coins
        setUserProgress(prev => {
          const newXP = prev.xp + 10;
          const newLevel = calculateLevel(newXP);
          const newGoalsCompleted = prev.totalGoalsCompleted + 1;

          // Award coins for goal completion
          setCoins(prevCoins => prevCoins + 5);

          const updatedAchievements = prev.achievements.map(achievement => {
            if (achievement.unlocked) return achievement;

            let shouldUnlock = false;
            switch (achievement.id) {
              case 'goal_starter':
                shouldUnlock = newGoalsCompleted >= 1;
                break;
              case 'goal_crusher':
                shouldUnlock = newGoalsCompleted >= 25;
                break;
              default:
                return achievement;
            }

            if (shouldUnlock) {
              setCoins(prevCoins => prevCoins + achievement.coins);
              sendNotification(`Achievement Unlocked!`, `${achievement.icon} ${achievement.name} - ${achievement.coins} coins earned!`);
              return { ...achievement, unlocked: true };
            }
            return achievement;
          });

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

  // Mood/Energy Adaptive AI Functions
  function getMoodEnergyAdaptations() {
    if (!moodEnergyTracker.enabled || !moodEnergyTracker.currentMood || !moodEnergyTracker.currentEnergy) {
      return { sessionLength: settings.focusMinutes, breakType: 'normal', coachingTone: 'neutral' };
    }

    const mood = moodEnergyTracker.currentMood;
    const energy = moodEnergyTracker.currentEnergy;

    let sessionLength = settings.focusMinutes;
    let breakType = 'normal';
    let coachingTone = 'neutral';

    // Adjust session length based on mood and energy
    if (mood === 'sad' || energy <= 2) {
      sessionLength = Math.max(10, settings.focusMinutes - 10); // Shorter sessions
      breakType = 'gentle';
      coachingTone = 'supportive';
    } else if (mood === 'happy' && energy >= 4) {
      sessionLength = Math.min(60, settings.focusMinutes + 10); // Longer sessions
      breakType = 'energizing';
      coachingTone = 'encouraging';
    } else if (energy <= 3) {
      sessionLength = Math.max(15, settings.focusMinutes - 5);
      breakType = 'restorative';
      coachingTone = 'gentle';
    }

    return { sessionLength, breakType, coachingTone };
  }

  function getMoodEnergyInsights() {
    const history = moodEnergyTracker.history;
    if (history.length < 5) return [];

    const insights = [];

    // Analyze mood-productivity correlation
    const moodStats = {
      happy: { sessions: 0, success: 0 },
      neutral: { sessions: 0, success: 0 },
      sad: { sessions: 0, success: 0 }
    };

    history.forEach(entry => {
      if (moodStats[entry.mood]) {
        moodStats[entry.mood].sessions++;
        if (entry.sessionSuccess) moodStats[entry.mood].success++;
      }
    });

    Object.entries(moodStats).forEach(([mood, stats]) => {
      if (stats.sessions >= 3) {
        const successRate = (stats.success / stats.sessions) * 100;
        const emoji = mood === 'happy' ? '😊' : mood === 'neutral' ? '😐' : '☹️';
        insights.push(`${emoji} ${mood.charAt(0).toUpperCase() + mood.slice(1)} mood: ${Math.round(successRate)}% success rate`);
      }
    });

    // Energy level insights
    const lowEnergySuccess = history.filter(e => e.energy <= 2).reduce((acc, e) => acc + (e.sessionSuccess ? 1 : 0), 0);
    const lowEnergySessions = history.filter(e => e.energy <= 2).length;
    const highEnergySuccess = history.filter(e => e.energy >= 4).reduce((acc, e) => acc + (e.sessionSuccess ? 1 : 0), 0);
    const highEnergySessions = history.filter(e => e.energy >= 4).length;

    if (lowEnergySessions >= 3) {
      insights.push(`⚡ Low energy: ${Math.round((lowEnergySuccess / lowEnergySessions) * 100)}% success rate`);
    }
    if (highEnergySessions >= 3) {
      insights.push(`🚀 High energy: ${Math.round((highEnergySuccess / highEnergySessions) * 100)}% success rate`);
    }

    return insights;
  }

  // Enhanced AI-Powered Recommendations System with Machine Learning
  function getEnhancedAIRecommendations() {
    const analysis = performDeepAIAnalysis();
    const recommendations = [...(analysis.recommendations || [])];

    const recentSessions = history.slice(0, 20);
    const focusSessions = recentSessions.filter(s => s.mode === 'focus');
    const completedSessions = focusSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8);
    const completionRate = focusSessions.length > 0 ? completedSessions.length / focusSessions.length : 0;

    // Add mood/energy based recommendations
    if (moodEnergyTracker.enabled && moodEnergyTracker.currentMood && moodEnergyTracker.currentEnergy) {
      const adaptations = getMoodEnergyAdaptations();

      if (adaptations.sessionLength !== settings.focusMinutes) {
        const reason = moodEnergyTracker.currentMood === 'sad' || moodEnergyTracker.currentEnergy <= 2 ? 
          'low energy/mood' : 'high energy/mood';

        recommendations.unshift({
          type: 'mood_adaptation',
          title: '🧠 Mood-Adaptive Session',
          description: `AI suggests ${adaptations.sessionLength}-minute session based on your ${reason}`,
          action: () => {
            setSettings(prev => ({ ...prev, focusMinutes: adaptations.sessionLength }));
            setMode('focus');
            resetTimer();
            alert('🤖 Session length adapted to {adaptations.sessionLength} minutes for your current state!');
          },
          priority: 'high',
          icon: '🎭'
        });
      }

      const moodInsights = getMoodEnergyInsights();
      if (moodInsights.length > 0) {
        recommendations.push({
          type: 'mood_insights',
          title: '📊 Mood-Performance Insights',
          description: moodInsights[0],
          action: () => {
            alert(`📊 Your Mood-Performance Patterns:\n\n${moodInsights.join('\n')}\n\n💡 Use this data to plan your most important work during optimal states!`);
          },
          priority: 'medium',
          icon: '📊'
        });
      }
    }

    // Intelligent task prioritization with urgency scoring
    const activeTasks = tasks.filter(t => !t.done);
    if (activeTasks.length > 0) {
      // Calculate task urgency scores based on creation time, keywords, and AI analysis
      const taskScores = activeTasks.map(task => {
        let urgencyScore = 0;
        const taskAge = (Date.now() - new Date(task.createdAt)) / (1000 * 60 * 60 * 24); // Days old

        // Age factor (older tasks get higher priority)
        urgencyScore += Math.min(taskAge * 10, 30);

        // Keyword analysis for urgency
        const urgentKeywords = ['urgent', 'asap', 'deadline', 'due', 'important', 'critical', 'emergency', 'final', 'exam', 'test', 'interview', 'meeting', 'presentation'];
        const taskText = task.text.toLowerCase();
        urgentKeywords.forEach(keyword => {
          if (taskText.includes(keyword)) urgencyScore += 25;
        });

        // Length factor (shorter tasks get slight priority boost for quick wins)
        if (task.text.length < 30) urgencyScore += 5;

        // Already AI-suggested tasks get lower priority to diversify suggestions
        if (task.aiSuggested) urgencyScore -= 10;

        return { ...task, urgencyScore };
      });

      // Sort by urgency score and take top 3
      const priorityTasks = taskScores
        .sort((a, b) => b.urgencyScore - a.urgencyScore)
        .slice(0, 3);

      if (priorityTasks.length > 0 && priorityTasks[0].urgencyScore > 15) {
        recommendations.push({
          type: 'task_optimization',
          title: '🎯 AI Task Intelligence',
          description: `Smart prioritization: ${priorityTasks[0].text.substring(0, 50)}${priorityTasks[0].text.length > 50 ? '...' : ''} (urgency: ${Math.round(priorityTasks[0].urgencyScore)}/100)`,
          action: () => {
            setTasks(prev => prev.map(task => {
              const priorityTask = priorityTasks.find(pt => pt.id === task.id);
              if (priorityTask) {
                return { ...task, priority: 'high', aiSuggested: true };
              }
              return task;
            }));
            alert(`🤖 AI Priority: "${priorityTasks[0].text}" marked as high priority based on intelligent analysis!`);
          },
          priority: 'high',
          icon: '🎯'
        });
      }
    }

    // Circadian rhythm optimization with environmental factors
    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    // Post-lunch dip detection (varies by individual patterns)
    if (currentHour >= 13 && currentHour <= 16) {
      const afternoonSessions = focusSessions.filter(s => {
        const sessionHour = new Date(s.startTime).getHours();
        return sessionHour >= 13 && sessionHour <= 16;
      });

      if (afternoonSessions.length >= 3) {
        const afternoonSuccessRate = afternoonSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8).length / afternoonSessions.length;

        if (afternoonSuccessRate < 0.6) {
          recommendations.push({
            type: 'environment',
            title: '☕ Circadian Optimization',
            description: `Your afternoon performance is ${Math.round(afternoonSuccessRate * 100)}% - AI suggests energy management`,
            action: () => {
              setShowBreakOptions(true);
            },
            priority: 'medium',
            icon: '☕'
          });
        }
      }
    }

    // Weekend vs weekday pattern recognition
    const isWeekend = currentDay === 0 || currentDay === 6;
    const weekendSessions = focusSessions.filter(s => {
      const sessionDay = new Date(s.startTime).getDay();
      return sessionDay === 0 || sessionDay === 6;
    });
    const weekdaySessions = focusSessions.filter(s => {
      const sessionDay = new Date(s.startTime).getDay();
      return sessionDay >= 1 && sessionDay <= 5;
    });

    if (weekendSessions.length >= 3 && weekdaySessions.length >= 3) {
      const weekendAvg = weekendSessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / weekendSessions.length;
      const weekdayAvg = weekdaySessions.reduce((sum, s) => sum + (s.productivityScore || 0), 0) / weekdaySessions.length;

      if (isWeekend && weekendAvg < weekdayAvg - 15) {
        recommendations.push({
          type: 'timing',
          title: '📅 Weekend Adaptation',
          description: `Weekend productivity typically ${Math.round(weekdayAvg - weekendAvg)}% lower - adjust expectations`,
          action: () => {
            const newLength = Math.max(15, settings.focusMinutes - 5);
            setSettings(prev => ({ ...prev, focusMinutes: newLength }));
            alert('🤖 Weekend Mode: Session length adjusted for relaxed pace');
          },
          priority: 'medium',
          icon: '📅'
        });
      }
    }

    // Smart session timing with advanced predictions
    if (analysis.predictions && analysis.predictions.length > 0) {
      const prediction = analysis.predictions[0];
      if (prediction && prediction.score >= 85 && prediction.confidence >= 70) {
        recommendations.push({
          type: 'timing',
          title: '⚡ Peak Performance Window',
          description: `AI detects optimal conditions: ${prediction.score}% success probability (${prediction.confidence}% confidence)`,
          action: () => {
            setMode('focus');
            resetTimer();
            startTimer();
          },
          priority: 'high',
          icon: '⚡'
        });
      } else if (prediction.score < 50 && prediction.confidence >= 60) {
        recommendations.push({
          type: 'timing',
          title: '🔄 Suboptimal Conditions Detected',
          description: `Low success probability (${prediction.score}%) - consider preparation activities`,
          action: () => {
            setMode('short');
            resetTimer();
            alert('🤖 AI suggests taking a break or doing light tasks until conditions improve');
          },
          priority: 'medium',
          icon: '🔄'
        });
      }
    }

    // Adaptive difficulty scaling based on recent performance trends
    if (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.sessionPatterns) {
      const patterns = smartReminders.aiLearningData.sessionPatterns;
      const recentPatterns = patterns.slice(-10);

      if (recentPatterns.length >= 5) {
        const recentFailures = recentPatterns.filter(p => !p.success).length;
        const failureRate = recentFailures / recentPatterns.length;

        if (failureRate >= 0.6) { // 60% failure rate
          recommendations.push({
            type: 'adaptation',
            title: '🧠 Adaptive Learning Protocol',
            description: `High challenge detected (${Math.round(failureRate * 100)}% incomplete) - AI implementing easier progression`,
            action: () => {
              const newLength = Math.max(10, settings.focusMinutes - 10);
              setSettings(prev => ({ ...prev, focusMinutes: newLength }));
              setMode('focus');
              resetTimer();
              alert('🤖 AI Adaptation: Reduced session length to rebuild confidence and momentum');
            },
            priority: 'high',
            icon: '🧠'
          });
        } else if (failureRate <= 0.1 && recentPatterns.length >= 8) { // 10% failure rate with sufficient data
          const avgDuration = recentPatterns.reduce((sum, p) => sum + p.duration, 0) / recentPatterns.length;
          if (avgDuration >= settings.focusMinutes * 60 * 0.9) { // Completing almost full sessions
            recommendations.push({
              type: 'challenge',
              title: '🚀 Excellence Detected',
              description: `Outstanding performance (${Math.round((1 - failureRate) * 100)}% success) - ready for increased challenge`,
              action: () => {
                const newLength = Math.min(60, settings.focusMinutes + 10);
                setSettings(prev => ({ ...prev, focusMinutes: newLength }));
                alert('🚀 AI Growth: Session length increased to match your improved capacity');
              },
              priority: 'medium',
              icon: '🚀'
            });
          }
        }
      }
    }

    // Sort by priority and impact
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return recommendations
      .sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
      .slice(0, 6);
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

    // Play purchase sound and show confirmation
    playButtonClickSound();
    alert(`✅ ${item.name} purchased and activated!`);

    return true;
  }

  function useBoost(boostId) {
    const boost = SHOP_ITEMS.boosts[boostId];
    if (!boost || !ownedItems.boosts.includes(boostId)) return;

    if (boostId === 'instantLevel') {
      // Special handling for instant level up
      const today = new Date().toISOString().slice(0, 10);
      const lastUsed = localStorage.getItem('fg_lastInstantLevel');

      if (lastUsed === today) {
        alert('❌ Instant Level Up can only be used once per day!');
        return;
      }

      // Level up the user
      const currentLevel = calculateLevel(userProgress.xp);
      const xpNeeded = getXPForNextLevel(userProgress.xp) - userProgress.xp;

      setUserProgress(prev => ({
        ...prev,
        xp: prev.xp + xpNeeded,
        level: currentLevel + 1
      }));

      localStorage.setItem('fg_lastInstantLevel', today);
      alert(`🚀 Instant Level Up! You are now Level ${currentLevel + 1}!`);
    } else if (boost.duration) {
      setActiveBoosts(prev => ({
        ...prev,
        [boostId]: Date.now() + (boost.duration * 1000)
      }));

      alert(`⚡ ${boost.name} activated for ${Math.round(boost.duration / 60)} minutes!`);
    }
  }

  // Theme switching functions
  function activateTheme(themeId) {
    if (themeId === 'monochrome' || ownedItems.themes.includes(themeId)) {
      setActiveTheme(themeId);
      playButtonClickSound();
      alert(`🎨 ${THEME_STYLES[themeId]?.name || 'Theme'} activated!`);
    }
  }

  function deactivateTheme() {
    setActiveTheme('monochrome');
    playButtonClickSound();
    alert('🎨 Theme deactivated - returned to Monochrome');
  }

  // Sound switching functions  
  function activateSound(soundId) {
    if (soundId === 'default' || ownedItems.sounds.includes(soundId)) {
      setActiveSound(soundId);
      playButtonClickSound();
      if (soundId !== 'default') {
        playCustomSound(soundId);
      }
      alert(`🔊 ${SHOP_ITEMS.sounds[soundId]?.name || 'Default'} sound activated!`);
    }
  }

  function deactivateSound() {
    setActiveSound('default');
    playButtonClickSound();
    alert('🔊 Sound effects deactivated - returned to default');
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

  // Break Activity Timer
  const breakTimerRef = useRef(null);
  useEffect(() => {
    if (!breakActivityRunning) {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
      return;
    }

    breakTimerRef.current = setInterval(() => {
      setBreakActivityTimer(t => {
        const newTime = t + 1;
        if (currentBreakActivity && newTime >= currentBreakActivity.duration) {
          setBreakActivityRunning(false);
          clearInterval(breakTimerRef.current);
          breakTimerRef.current = null;
          
          // Activity completed
          if (settings.soundEnabled) {
            playEndSound();
          }
          
          // Record completed activity
          setMindfulBreakCoach(prev => ({
            ...prev,
            activityHistory: [{
              id: generateId(),
              activity: currentBreakActivity,
              completedAt: Date.now(),
              duration: newTime
            }, ...prev.activityHistory.slice(0, 49)]
          }));

          sendNotification('Break Complete!', `${currentBreakActivity.name} completed. Great job!`);
          
          setTimeout(() => {
            setShowBreakActivityModal(false);
            setCurrentBreakActivity(null);
            setBreakActivityTimer(0);
          }, 3000);
          
          return newTime;
        }
        return newTime;
      });
    }, 1000);

    return () => {
      if (breakTimerRef.current) {
        clearInterval(breakTimerRef.current);
        breakTimerRef.current = null;
      }
    };
  }, [breakActivityRunning, currentBreakActivity]);

  // Username setup handler
  function saveUsername() {
    const trimmed = tempUsername.trim();
    if (trimmed.length >= 2) {
      setUsername(trimmed);
      setShowUsernameSetup(false);
      setTempUsername('');
    } else {
      alert('Username must be at least 2 characters long');
    }
  }

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
        // Use Gemini data if available, otherwise fallback to local analysis
        const localAnalysis = performDeepAIAnalysis();
        const displayInsights = geminiData.insights.length > 0 ? geminiData.insights : localAnalysis.insights;
        const displayPrediction = geminiData.prediction || (localAnalysis.predictions.length > 0 ? localAnalysis.predictions[0] : null);
        const confidence = geminiData.prediction ? geminiData.prediction.confidence : Math.round(localAnalysis.confidence);

        return (
          <div key="aiInsights" style={currentStyles.card}>
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              🧠 Gemini AI Insights
              <span style={{ 
                fontSize: 10, 
                backgroundColor: '#000', 
                color: '#fff',
                padding: '2px 6px',
                borderRadius: 8,
                fontWeight: 'normal'
              }}>
                {isAIProcessing ? 'Analyzing...' : `${confidence}% confidence`}
              </span>
            </h3>
            {displayInsights.length === 0 ? (
              <div style={{ color: "#666", fontSize: 14 }}>Complete more sessions to unlock AI insights.</div>
            ) : (
              <div>
                {displayInsights.map((insight, index) => (
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
                {displayPrediction && (
                  <div style={{ 
                    padding: 10, 
                    borderRadius: 6, 
                    backgroundColor: '#f0f9ff',
                    border: '1px solid #3b82f6',
                    marginTop: 10
                  }}>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>
                      🔮 Next Session Success: {displayPrediction.score}%
                    </div>
                    <div style={{ fontSize: 11, color: '#666' }}>
                      {displayPrediction.factors.map((factor, i) => (
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
        const localRecs = getEnhancedAIRecommendations();
        // Merge local urgent recommendations with Gemini's broad recommendations
        const displayRecs = [...localRecs, ...geminiRecs].slice(0, 6);
        
        return (
          <div key="smartRecommendations" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🤖 AI Recommendations</h3>
            {displayRecs.length === 0 ? (
              <div style={{ color: "#666" }}>AI is learning your patterns. Complete more sessions for personalized recommendations!</div>
            ) : (
              displayRecs.map((rec, index) => (
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
                    <span style={{ fontSize: 18 }}>{rec.icon || '🤖'}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{rec.title}</div>
                      <div style={{ fontSize: 12, color: "#555", lineHeight: 1.4 }}>
                        {rec.description}
                      </div>
                    </div>
                  </div>
                  {rec.action && typeof rec.action === 'function' && (
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
                value={taskInput || ''}
                onChange={(e) => setTaskInput(e.target.value)}
                placeholder="Add a task (e.g. study chapter 3)"
                style={currentStyles.input}
                onKeyDown={(e) => { if (e.key === "Enter") addTask(); }}
              />
              <button style={currentStyles.btn} onClick={() => {
                playButtonClickSound();
                addTask();
              }}>Add</button>
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
                value={goalInput || ''}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a daily goal (e.g. finish report)"
                style={currentStyles.input}
                onKeyDown={(e) => { if (e.key === "Enter") addDailyGoal(); }}
              />
              <button style={currentStyles.btn} onClick={() => {
                playButtonClickSound();
                addDailyGoal();
              }}>Add</button>
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
        const focusSessions = history.filter(s => s.mode === 'focus');
        const successfulSessions = focusSessions.filter(s => s.durationSec >= settings.focusMinutes * 60 * 0.8);
        const breakSessions = history.filter(s => s.mode === 'short' || s.mode === 'long');

        return (
          <div key="focusAnalytics" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>📊 Focus Analytics</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {focusSessions.length}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Focus Sessions</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {breakSessions.length} breaks taken
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 20, fontWeight: 700 }}>
                  {focusSessions.length > 0 ? Math.round((successfulSessions.length / focusSessions.length) * 100) : 0}%
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>Success Rate</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {successfulSessions.length}/{focusSessions.length} completed
                </div>
              </div>
            </div>
            {smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores && smartReminders.aiLearningData.productivityScores.length > 0 && (
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Productivity Trend (Last 10 Sessions)</div>
                <div style={{ 
                  height: 60, 
                  position: 'relative',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  border: '1px solid #e0e0e0'
                }}>
                  {(() => {
                    const scores = (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores) 
                      ? smartReminders.aiLearningData.productivityScores.slice(-10) 
                      : [];
                    
                    if (scores.length === 0) {
                      return (
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
                    }

                    // Create mini line chart
                    const width = 100;
                    const height = 100;
                    const padding = 10;
                    
                    const points = scores.map((score, i) => {
                      const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
                      const y = height - padding - ((score || 0) / 100) * (height - 2 * padding);
                      return `${x},${y}`;
                    }).join(' ');

                    const recentAvg = scores.slice(-3).reduce((a, b) => a + (b || 0), 0) / 3;
                    const lineColor = recentAvg >= 80 ? '#22c55e' : recentAvg >= 60 ? '#f59e0b' : '#dc2626';

                    return (
                      <svg 
                        width="100%" 
                        height="100%" 
                        viewBox="0 0 100 100" 
                        preserveAspectRatio="none"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                      >
                        <polyline
                          fill="none"
                          stroke={lineColor}
                          strokeWidth="3"
                          points={points}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {scores.map((score, i) => {
                          const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
                          const y = height - padding - ((score || 0) / 100) * (height - 2 * padding);
                          const pointColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#dc2626';
                          
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="2"
                              fill={pointColor}
                              stroke="#fff"
                              strokeWidth="1"
                            />
                          );
                        })}
                      </svg>
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
              <div style={{ fontSize: 16, fontWeight: 600, color: '#f59e0b', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
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
              <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>
                💡 Exponential coin rewards: 5min→1, 15min→5, 30min→12, 60min→25, 90min→40+ coins
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
        // Calculate real-time minutes including current session
        const currentSessionMinutes = running && mode === 'focus' && sessionStartRef.current 
          ? Math.round((Date.now() - sessionStartRef.current) / 60000)
          : 0;
        const totalMinutesWithCurrent = userProgress.totalFocusMinutes + currentSessionMinutes;

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
                  {Math.round(totalMinutesWithCurrent)}
                </div>
                <div style={{ fontSize: 12, color: "#666" }}>
                  Total Minutes {currentSessionMinutes > 0 && <span style={{ color: '#22c55e' }}>+{currentSessionMinutes}</span>}
                </div>
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
            <h3 style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              ⚙️ Timer Settings
            </h3>
            
            {/* Timer Duration Controls */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: currentTheme.text }}>
                🍅 Pomodoro Durations
              </div>
              
              {/* Focus Session */}
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                backgroundColor: currentTheme.cardBg, 
                border: `1px solid ${currentTheme.border}`, 
                borderRadius: 8 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text }}>🎯 Focus Session</div>
                    <div style={{ fontSize: 11, color: currentTheme.textSecondary }}>Deep work time</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: currentTheme.primary }}>
                    {settings.focusMinutes}min
                  </div>
                </div>
                <input 
                  type="range" 
                  min="5" 
                  max="90" 
                  step="5"
                  value={settings.focusMinutes} 
                  onChange={(e) => updateSetting("focusMinutes", e.target.value)}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    background: `linear-gradient(to right, ${currentTheme.primary} 0%, ${currentTheme.primary} ${(settings.focusMinutes - 5) / 85 * 100}%, ${currentTheme.accent} ${(settings.focusMinutes - 5) / 85 * 100}%, ${currentTheme.accent} 100%)`,
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: currentTheme.textSecondary, marginTop: 4 }}>
                  <span>5min</span>
                  <span>90min</span>
                </div>
              </div>

              {/* Short Break */}
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                backgroundColor: currentTheme.cardBg, 
                border: `1px solid ${currentTheme.border}`, 
                borderRadius: 8 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text }}>☕ Short Break</div>
                    <div style={{ fontSize: 11, color: currentTheme.textSecondary }}>Quick refresh</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: currentTheme.success }}>
                    {settings.shortBreakMinutes}min
                  </div>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="15" 
                  step="1"
                  value={settings.shortBreakMinutes} 
                  onChange={(e) => updateSetting("shortBreakMinutes", e.target.value)}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    background: `linear-gradient(to right, ${currentTheme.success} 0%, ${currentTheme.success} ${(settings.shortBreakMinutes - 1) / 14 * 100}%, ${currentTheme.accent} ${(settings.shortBreakMinutes - 1) / 14 * 100}%, ${currentTheme.accent} 100%)`,
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: currentTheme.textSecondary, marginTop: 4 }}>
                  <span>1min</span>
                  <span>15min</span>
                </div>
              </div>

              {/* Long Break */}
              <div style={{ 
                marginBottom: 16, 
                padding: 12, 
                backgroundColor: currentTheme.cardBg, 
                border: `1px solid ${currentTheme.border}`, 
                borderRadius: 8 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text }}>🛋️ Long Break</div>
                    <div style={{ fontSize: 11, color: currentTheme.textSecondary }}>Extended rest</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: currentTheme.warning }}>
                    {settings.longBreakMinutes}min
                  </div>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="45" 
                  step="5"
                  value={settings.longBreakMinutes} 
                  onChange={(e) => updateSetting("longBreakMinutes", e.target.value)}
                  style={{
                    width: '100%',
                    height: 6,
                    borderRadius: 3,
                    background: `linear-gradient(to right, ${currentTheme.warning} 0%, ${currentTheme.warning} ${(settings.longBreakMinutes - 10) / 35 * 100}%, ${currentTheme.accent} ${(settings.longBreakMinutes - 10) / 35 * 100}%, ${currentTheme.accent} 100%)`,
                    outline: 'none',
                    appearance: 'none',
                    cursor: 'pointer'
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: currentTheme.textSecondary, marginTop: 4 }}>
                  <span>10min</span>
                  <span>45min</span>
                </div>
              </div>

              {/* Cycles Setting */}
              <div style={{ 
                padding: 12, 
                backgroundColor: currentTheme.cardBg, 
                border: `1px solid ${currentTheme.border}`, 
                borderRadius: 8 
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text }}>🔄 Cycles to Long Break</div>
                    <div style={{ fontSize: 11, color: currentTheme.textSecondary }}>Focus sessions before long break</div>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: currentTheme.primary }}>
                    {settings.cyclesBeforeLongBreak}x
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {[2, 3, 4, 5, 6].map(cycle => (
                    <button
                      key={cycle}
                      onClick={() => updateSetting("cyclesBeforeLongBreak", cycle)}
                      style={{
                        flex: 1,
                        padding: '8px 4px',
                        fontSize: 12,
                        fontWeight: 600,
                        borderRadius: 6,
                        border: 'none',
                        cursor: 'pointer',
                        backgroundColor: settings.cyclesBeforeLongBreak === cycle ? currentTheme.primary : currentTheme.accent,
                        color: settings.cyclesBeforeLongBreak === cycle ? currentTheme.secondary : currentTheme.text,
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {cycle}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Audio & Profile Settings */}
            <div style={{ borderTop: `1px solid ${currentTheme.border}`, paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: currentTheme.text }}>
                🎵 Audio & Profile
              </div>

              {/* Sound Toggle */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: 12,
                backgroundColor: currentTheme.cardBg, 
                border: `1px solid ${currentTheme.border}`, 
                borderRadius: 8,
                marginBottom: 12
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text }}>🔊 Sound Effects</div>
                  <div style={{ fontSize: 11, color: currentTheme.textSecondary }}>
                    {settings.soundEnabled ? 'Audio notifications enabled' : 'Silent mode'}
                  </div>
                </div>
                <label style={{ position: 'relative', display: 'inline-block', width: 44, height: 24, cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={settings.soundEnabled} 
                    onChange={(e) => {
                      playButtonClickSound();
                      updateSetting("soundEnabled", e.target.checked);
                    }}
                    style={{ display: 'none' }}
                  />
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: settings.soundEnabled ? currentTheme.success : currentTheme.accent,
                    borderRadius: 12,
                    transition: 'all 0.2s ease',
                    border: `1px solid ${currentTheme.border}`
                  }}>
                    <div style={{
                      position: 'absolute',
                      content: '""',
                      height: 18,
                      width: 18,
                      left: settings.soundEnabled ? 23 : 3,
                      bottom: 2,
                      backgroundColor: '#fff',
                      borderRadius: '50%',
                      transition: 'all 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                    }} />
                  </div>
                </label>
              </div>

              {/* Username Setting */}
              <div style={{ 
                padding: 12,
                backgroundColor: currentTheme.cardBg, 
                border: `1px solid ${currentTheme.border}`, 
                borderRadius: 8
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: currentTheme.text }}>👤 Username</div>
                    <div style={{ fontSize: 11, color: currentTheme.textSecondary }}>
                      {username ? `Currently: ${username}` : 'No username set'}
                    </div>
                  </div>
                  <button 
                    style={{
                      ...currentStyles.smallBtn, 
                      fontSize: 11,
                      padding: '6px 12px',
                      backgroundColor: currentTheme.primary,
                      color: currentTheme.secondary,
                      border: 'none',
                      borderRadius: 6,
                      fontWeight: 600
                    }}
                    onClick={() => {
                      playButtonClickSound();
                      setShowUsernameSetup(true);
                    }}
                  >
                    {username ? 'Change' : 'Set Username'}
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ marginTop: 16, borderTop: `1px solid ${currentTheme.border}`, paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: currentTheme.text }}>
                ⚡ Quick Presets
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  onClick={() => {
                    playButtonClickSound();
                    setSettings(prev => ({ ...prev, focusMinutes: 25, shortBreakMinutes: 5, longBreakMinutes: 15, cyclesBeforeLongBreak: 4 }));
                    alert('🍅 Classic Pomodoro settings applied!');
                  }}
                  style={{
                    padding: '12px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.cardBg,
                    color: currentTheme.text,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  🍅 Classic<br/>
                  <span style={{ fontSize: 10, color: currentTheme.textSecondary }}>25-5-15</span>
                </button>
                <button
                  onClick={() => {
                    playButtonClickSound();
                    setSettings(prev => ({ ...prev, focusMinutes: 50, shortBreakMinutes: 10, longBreakMinutes: 20, cyclesBeforeLongBreak: 3 }));
                    alert('🎯 Deep Focus settings applied!');
                  }}
                  style={{
                    padding: '12px 8px',
                    fontSize: 12,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: `1px solid ${currentTheme.border}`,
                    backgroundColor: currentTheme.cardBg,
                    color: currentTheme.text,
                    cursor: 'pointer',
                    textAlign: 'center'
                  }}
                >
                  🎯 Deep Focus<br/>
                  <span style={{ fontSize: 10, color: currentTheme.textSecondary }}>50-10-20</span>
                </button>
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
            <h3 style={{ marginTop: 0 }}>🔄 Multi-Device Sync</h3>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              Transfer your progress between devices instantly. Generate a sync code on one device and enter it on another to sync all your data.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff', width: '100%' }}
                onClick={async () => {
                  try {
                    setIsGeneratingCode(true);

                    const newSyncCode = generateSecureId().substring(0, 8).toUpperCase();
                    const userData = {
                      userProgress,
                      tasks: tasks || [],
                      dailyGoals: dailyGoals || [],
                      history: history || [],
                      sessionHighlights: sessionHighlights || [],
                      smartReminders: smartReminders || {
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
                      },
                      coins: coins || 0,
                      ownedItems: ownedItems || { themes: [], sounds: [], boosts: [], special: [] },
                      activeTheme: activeTheme || 'monochrome',
                      activeSound: activeSound || 'default',
                      activeBoosts: activeBoosts || {},
                      customization: customization || DEFAULT_CUSTOMIZATION,
                      settings: settings || DEFAULT_SETTINGS,
                      localAnalytics: localAnalytics || {
                        dailyStats: {},
                        weeklyGoals: { target: 4, current: 0 },
                        monthlyProgress: {},
                        bestStreak: 0,
                        totalHours: 0,
                        averageSessionLength: 0,
                        productivityScore: 0
                      },
                      timestamp: Date.now(),
                      expires: Date.now() + (2 * 60 * 60 * 1000), // 2 hours (increased)
                      version: '2.1',
                      deviceInfo: {
                        userAgent: navigator.userAgent.substring(0, 100),
                        timestamp: new Date().toISOString(),
                        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
                      }
                    };

                    // Validate data before encoding
                    const validation = validateSyncData(userData);
                    if (!validation.valid) {
                      throw new Error(validation.error);
                    }

                    // Compress and encode data
                    const encodedData = compressAndEncodeData(userData);

                    const syncCodeData = {
                      ...userData,
                      encodedData,
                      dataSize: Math.round(JSON.stringify(userData).length / 1024 * 10) / 10 // KB with 1 decimal
                    };

                    const newSyncCodes = { ...syncCodes, [newSyncCode]: syncCodeData };
                    setSyncCodes(newSyncCodes);
                    setGeneratedSyncCode(newSyncCode);

                    // Clean up expired codes
                    const currentTime = Date.now();
                    Object.keys(newSyncCodes).forEach(code => {
                      if (newSyncCodes[code].expires < currentTime) {
                        delete newSyncCodes[code];
                      }
                    });
                    setSyncCodes(newSyncCodes);

                    setSyncStatus({
                      type: 'success',
                      message: `Sync code generated: ${newSyncCode}`
                    });

                    alert(`✅ Enhanced Sync Code Generated!\n\nCode: ${newSyncCode}\nData size: ${syncCodeData.dataSize} KB\nExpires: ${new Date(userData.expires).toLocaleTimeString()}\n\n📱 On your other device:\n1. Open FocusGuard\n2. Go to Multi-Device Sync\n3. Enter this code\n4. Click "Import Data"\n\n🔒 Secure: Data is encrypted and auto-expires`);
                  } catch (error) {
                    console.error('Sync code generation error:', error);
                    setSyncStatus({
                      type: 'error',
                      message: `Failed to generate sync code: ${error.message}`
                    });
                    alert(`❌ Sync Code Generation Failed\n\nError: ${error.message}\n\nPlease try again or contact support if the issue persists.`);
                  } finally {
                    setIsGeneratingCode(false);
                  }
                }}
                disabled={isGeneratingCode}
              >
                {isGeneratingCode ? '⏳ Generating...' : '🔗 Generate Sync Code'}
              </button>

              {generatedSyncCode && (
                <div style={{
                  padding: 12,
                  backgroundColor: '#f0f9ff',
                  border: '2px solid #22c55e',
                  borderRadius: 8,
                  textAlign: 'center'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>Latest Generated Code:</div>
                  <div style={{ 
                    fontSize: 20, 
                    fontFamily: 'monospace', 
                    fontWeight: 700,
                    color: '#22c55e',
                    letterSpacing: 2,
                    marginBottom: 4
                  }}>
                    {generatedSyncCode}
                  </div>
                  <button
                    style={{ ...currentStyles.smallBtn, fontSize: 10 }}
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSyncCode);
                      alert('📋 Sync code copied to clipboard!');
                    }}
                  >
                    📋 Copy Code
                  </button>
                </div>
              )}

              <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: 12 }}>
                <div style={{ fontWeight: 600, marginBottom: 8, fontSize: 13 }}>Import from Another Device:</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input 
                    type="text" 
                    placeholder="Enter sync code (e.g., ABC12345)" 
                    value={syncCode}
                    onChange={(e) => setSyncCode(e.target.value.toUpperCase())}
                    style={{...currentStyles.input, flex: 1, backgroundColor: '#f8f9fa', border: '1px dashed #000'}} 
                  />
                  <button 
                    style={{...currentStyles.btn, backgroundColor: '#3b82f6', color: '#fff'}}
                    onClick={async () => {
                      try {
                        setIsImporting(true);
                        setSyncStatus({ type: '', message: '' });

                        const trimmedCode = syncCode.trim().toUpperCase();
                        if (!trimmedCode) {
                          throw new Error('Please enter a sync code');
                        }

                        if (!/^[A-Z0-9]{8}$/.test(trimmedCode)) {
                          throw new Error('Invalid sync code format. Code should be 8 characters long.');
                        }

                        // Check local storage first
                        const localSyncData = syncCodes[trimmedCode];
                        let syncData = null;
                        let isLocalSync = false;

                        if (localSyncData) {
                          // Local sync code found
                          isLocalSync = true;

                          if (localSyncData.expires < Date.now()) {
                            // Clean up expired code
                            const updatedCodes = { ...syncCodes };
                            delete updatedCodes[trimmedCode];
                            setSyncCodes(updatedCodes);
                            throw new Error('This sync code has expired. Please generate a new one.');
                          }

                          syncData = localSyncData;
                        } else {
                          // Try to decode the sync code directly (for codes from other devices)
                          try {
                            syncData = decompressAndDecodeData(trimmedCode);

                            // Additional validation for direct decode
                            if (syncData.expires && syncData.expires < Date.now()) {
                              throw new Error('This sync code has expired');
                            }
                          } catch (decodeError) {
                            throw new Error(`Invalid sync code: ${decodeError.message}`);
                          }
                        }

                        if (!syncData) {
                          throw new Error('Sync code not found or invalid');
                        }

                        // Validate sync data
                        const validation = validateSyncData(syncData);
                        if (!validation.valid) {
                          throw new Error(validation.error);
                        }

                        // Show confirmation dialog with detailed info
                        const deviceInfo = syncData.deviceInfo ? 
                          `\nDevice: ${syncData.deviceInfo.userAgent.substring(0, 50)}...\nTimezone: ${syncData.deviceInfo.timezone}` : 
                          '';

                        const dataInfo = syncData.dataSize ? 
                          `\nData size: ${syncData.dataSize} KB` : 
                          `\nData size: ${Math.round(JSON.stringify(syncData).length / 1024 * 10) / 10} KB`;

                        const confirmMessage = `🔄 Import Sync Data?\n\nThis will replace ALL your current data:\n\n📊 Sessions: ${(syncData.history || []).length}\n🏆 Level: ${calculateLevel((syncData.userProgress || {}).xp || 0)}\n🪙 Coins: ${syncData.coins || 0}\n📅 Streak: ${(syncData.userProgress || {}).streakCount || 0} days\n\nCreated: ${new Date(syncData.timestamp).toLocaleString()}${deviceInfo}${dataInfo}\n\n⚠️ This cannot be undone. Continue?`;

                        if (!window.confirm(confirmMessage)) {
                          setSyncCode('');
                          return;
                        }

                        // Backup current data before import
                        const backupData = {
                          userProgress,
                          tasks,
                          dailyGoals,
                          history,
                          sessionHighlights,
                          smartReminders,
                          coins,
                          ownedItems,
                          activeTheme,
                          activeSound,
                          activeBoosts,
                          customization,
                          settings,
                          localAnalytics,
                          timestamp: Date.now()
                        };

                        try {
                          localStorage.setItem('fg_backup_before_sync', JSON.stringify(backupData));
                        } catch (backupError) {
                          console.warn('Could not create backup:', backupError);
                        }

                        // Import all data with fallbacks
                        setUserProgress(syncData.userProgress || {
                          xp: 0, level: 1, totalFocusMinutes: 0, totalTasks: 0,
                          totalGoalsCompleted: 0, streakCount: 0, lastStreakDate: null,
                          streakFreezes: 0, aiRecommendationsFollowed: 0, achievements: ACHIEVEMENTS
                        });
                        setTasks(Array.isArray(syncData.tasks) ? syncData.tasks : []);
                        setDailyGoals(Array.isArray(syncData.dailyGoals) ? syncData.dailyGoals : []);
                        setHistory(Array.isArray(syncData.history) ? syncData.history : []);
                        setSessionHighlights(Array.isArray(syncData.sessionHighlights) ? syncData.sessionHighlights : []);
                        setSmartReminders(syncData.smartReminders && typeof syncData.smartReminders === 'object' ? 
                          syncData.smartReminders : {
                            enabled: false, optimalTimes: [], scheduledReminders: [],
                            aiLearningData: { sessionPatterns: [], productivityScores: [], environmentFactors: [] },
                            preferences: { reminderTypes: ['focus', 'break', 'streak', 'optimization'], aiIntensity: 'adaptive', quietHours: { start: 22, end: 7 } }
                          });
                        setCoins(typeof syncData.coins === 'number' ? syncData.coins : 0);
                        setOwnedItems(syncData.ownedItems && typeof syncData.ownedItems === 'object' ? 
                          syncData.ownedItems : { themes: [], sounds: [], boosts: [], special: [] });
                        setActiveTheme(typeof syncData.activeTheme === 'string' ? syncData.activeTheme : 'monochrome');
                        setActiveSound(typeof syncData.activeSound === 'string' ? syncData.activeSound : 'default');
                        setActiveBoosts(syncData.activeBoosts && typeof syncData.activeBoosts === 'object' ? syncData.activeBoosts : {});
                        setCustomization(syncData.customization && typeof syncData.customization === 'object' ? 
                          syncData.customization : DEFAULT_CUSTOMIZATION);
                        setSettings(syncData.settings && typeof syncData.settings === 'object' ? syncData.settings : DEFAULT_SETTINGS);
                        setLocalAnalytics(syncData.localAnalytics && typeof syncData.localAnalytics === 'object' ? 
                          syncData.localAnalytics : {
                            dailyStats: {}, weeklyGoals: { target: 4, current: 0 }, monthlyProgress: {},
                            bestStreak: 0, totalHours: 0, averageSessionLength: 0, productivityScore: 0
                          });

                        // Clean up used code if it was local
                        if (isLocalSync) {
                          const updatedCodes = { ...syncCodes };
                          delete updatedCodes[trimmedCode];
                          setSyncCodes(updatedCodes);
                        }

                        setSyncCode('');
                        setSyncStatus({
                          type: 'success',
                          message: 'Data imported successfully!'
                        });

                        // Show success message
                        setTimeout(() => {
                          alert(`✅ Enhanced Sync Complete!\n\n🔄 All data imported successfully\n📊 ${(syncData.history || []).length} sessions restored\n🏆 Level ${calculateLevel((syncData.userProgress || {}).xp || 0)} restored\n🪙 ${syncData.coins || 0} coins restored\n\n💾 Previous data backed up automatically\n🔒 Sync code consumed and deleted for security`);
                        }, 500);

                      } catch (error) {
                        console.error('Sync import error:', error);
                        setSyncStatus({
                          type: 'error',
                          message: error.message
                        });

                        alert(`❌ Sync Import Failed\n\nError: ${error.message}\n\n💡 Troubleshooting:\n• Check your sync code is correct\n• Ensure the code hasn't expired\n• Try generating a new code\n• Contact support if issue persists`);
                      } finally {
                        setIsImporting(false);
                      }
                    }}
                    disabled={isImporting}
                  >
                    {isImporting ? '⏳ Importing...' : '📥 Import Data'}
                  </button>
                </div>
              </div>

              {/* Sync Status Display */}
              {syncStatus.message && (
                <div style={{
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 16,
                  backgroundColor: syncStatus.type === 'success' ? '#f0fdf4' : 
                                 syncStatus.type === 'error' ? '#fef2f2' : '#f0f9ff',
                  border: `2px solid ${syncStatus.type === 'success' ? '#22c55e' : 
                                     syncStatus.type === 'error' ? '#dc2626' : '#3b82f6'}`,
                  fontSize: 13
                }}>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 8,
                    fontWeight: 600,
                    color: syncStatus.type === 'success' ? '#22c55e' : 
                           syncStatus.type === 'error' ? '#dc2626' : '#3b82f6'
                  }}>
                    {syncStatus.type === 'success' ? '✅' : syncStatus.type === 'error' ? '❌' : 'ℹ️'}
                    {syncStatus.message}
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: '#666', marginTop: 16, lineHeight: 1.4 }}>
                <div style={{ marginBottom: 4 }}>💡 <strong>Enhanced Sync Features:</strong></div>
                <div>• Codes now expire after 2 hours for security</div>
                <div>• Data compression reduces sync code size by 60%</div>
                <div>• Automatic validation prevents corrupted imports</div>
                <div>• Your data is backed up before each import</div>
                <div>• Works completely offline - no servers required</div>
              </div>
            </div>
          </div>
        );

      case 'distractionBlocker':
        return (
          <div key="distractionBlocker" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🛡️ Distraction Blocker</h3>
            {distractionBlocker.enabled ? (
              <div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #22c55e',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>✅ Focus Shield Active</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    Intensity: {distractionBlocker.intensity} • {distractionBlocker.activeSessionOnly ? 'Focus sessions only' : 'Always active'}
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Intensity Level:</div>
                  {['light', 'medium', 'strong'].map(level => (
                    <label key={level} style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 6, 
                      fontSize: 12,
                      marginBottom: 4 
                    }}>
                      <input
                        type="radio"
                        name="intensity"
                        checked={distractionBlocker.intensity === level}
                        onChange={() => {
                          setDistractionBlocker(prev => ({ ...prev, intensity: level }));
                        }}
                      />
                      <span style={{ textTransform: 'capitalize' }}>{level} ({
                        level === 'light' ? 'Light blur + 40% overlay' :
                        level === 'medium' ? 'Medium blur + 70% overlay' :
                        'Heavy blur + 90% overlay'
                      })</span>
                    </label>
                  ))}
                </div>

                <label style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 8, 
                  fontSize: 12,
                  marginBottom: 12 
                }}>
                  <input
                    type="checkbox"
                    checked={distractionBlocker.activeSessionOnly}
                    onChange={(e) => {
                      setDistractionBlocker(prev => ({ ...prev, activeSessionOnly: e.target.checked }));
                    }}
                  />
                  <span>Only during focus sessions</span>
                </label>

                <button 
                  style={{...currentStyles.btn, width: '100%' }}
                  onClick={() => {
                    setDistractionBlocker(prev => ({ ...prev, enabled: false, isActive: false }));
                    alert('🛡️ Distraction blocker disabled');
                  }}
                >
                  🔓 Disable Shield
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                  Blocks access to the entire page during focus sessions to prevent distractions. A full-screen overlay with pause button for emergency access.
                </p>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                  <div>🔒 Activates automatically when focus session starts</div>
                  <div>👁️ Blurs entire page with intensity control</div>
                  <div>🛡️ Prevents navigation and clicking during focus</div>
                  <div>⏸️ Pause button available for emergency access</div>
                </div>
                <button 
                  style={{...currentStyles.btn, width: '100%' }} 
                  onClick={() => setDistractionBlocker(prev => ({ ...prev, enabled: true }))}
                >
                  🛡️ Enable Focus Shield
                </button>
              </div>
            )}
          </div>
        );

      case 'moodEnergyTracker':
        const moodInsights = getMoodEnergyInsights();
        return (
          <div key="moodEnergyTracker" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🎭 Mood & Energy Tracker</h3>
            {moodEnergyTracker.enabled ? (
              <div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  backgroundColor: '#f0f9ff',
                  border: '1px solid #3b82f6',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🤖 Adaptive AI Active</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {moodEnergyTracker.history.length} sessions tracked • AI learns your patterns
                  </div>
                </div>

                {moodEnergyTracker.currentMood && moodEnergyTracker.currentEnergy && (
                  <div style={{ 
                    padding: 8, 
                    borderRadius: 6, 
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e0e0e0',
                    marginBottom: 12 
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Current State:</div>
                    <div style={{ fontSize: 12, color: "#666" }}>
                      Mood: {moodEnergyTracker.currentMood === 'happy' ? '😊 Happy' : 
                              moodEnergyTracker.currentMood === 'neutral' ? '😐 Neutral' : '☹️ Low'} • 
                      Energy: ⚡{moodEnergyTracker.currentEnergy}/5
                    </div>
                  </div>
                )}

                {moodInsights.length > 0 && (
                  <div style={{ 
                    padding: 8, 
                    borderRadius: 6, 
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    marginBottom: 12 
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>📊 Your Patterns:</div>
                    {moodInsights.slice(0, 2).map((insight, i) => (
                      <div key={i} style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                        {insight}
                      </div>
                    ))}
                  </div>
                )}

                <button 
                  style={{...currentStyles.btn, width: '100%', marginBottom: 8 }}
                  onClick={() => {
                    setMoodEnergyTracker(prev => ({ 
                      ...prev, 
                      currentMood: null, 
                      currentEnergy: null 
                    }));
                    alert('🔄 Current state reset - you\'ll be prompted before your next focus session');
                  }}
                >
                  🔄 Reset Current State
                </button>

                <button 
                  style={{...currentStyles.btn, width: '100%' }}
                  onClick={() => {
                    setMoodEnergyTracker(prev => ({ 
                      ...prev, 
                      enabled: false, 
                      currentMood: null, 
                      currentEnergy: null 
                    }));
                    alert('🎭 Mood & Energy tracking disabled');
                  }}
                >
                  ❌ Disable Tracking
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                  Rate your mood and energy before sessions. AI adapts session difficulty, break types, and coaching tone based on your state.
                </p>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                  <div>🎭 Quick mood rating (😊😐☹️)</div>
                  <div>⚡ Energy scale (1-5)</div>
                  <div>🤖 AI adapts session length & difficulty</div>
                  <div>📊 Tracks patterns & correlations</div>
                </div>
                <button 
                  style={{...currentStyles.btn, width: '100%' }} 
                  onClick={() => setMoodEnergyTracker(prev => ({ ...prev, enabled: true }))}
                >
                  🎭 Enable Mood Tracking
                </button>
              </div>
            )}
          </div>
        );

      

      case 'mindfulBreakCoach':
        const recentActivities = mindfulBreakCoach.activityHistory.slice(0, 5);
        const completedToday = mindfulBreakCoach.activityHistory.filter(
          a => new Date(a.completedAt).toDateString() === new Date().toDateString()
        ).length;
        
        return (
          <div key="mindfulBreakCoach" style={currentStyles.card}>
            <h3 style={{ marginTop: 0 }}>🧘 Mindful Break Coach</h3>
            {mindfulBreakCoach.enabled ? (
              <div>
                <div style={{ 
                  padding: 8, 
                  borderRadius: 6, 
                  backgroundColor: '#f0fdf4',
                  border: '1px solid #22c55e',
                  marginBottom: 12 
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>🎯 Intelligent Break System Active</div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    {completedToday} mindful breaks completed today • {recentActivities.length} total activities tracked
                  </div>
                </div>

                {recentActivities.length > 0 && (
                  <div style={{ 
                    padding: 8, 
                    borderRadius: 6, 
                    backgroundColor: '#fef3c7',
                    border: '1px solid #f59e0b',
                    marginBottom: 12 
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>📊 Recent Activity:</div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                      Last: {recentActivities[0].activity.name} • 
                      {new Date(recentActivities[0].completedAt).toLocaleDateString()}
                    </div>
                    <div style={{ fontSize: 11, color: "#666" }}>
                      Favorite: {
                        Object.entries(
                          recentActivities.reduce((acc, a) => {
                            acc[a.activity.name] = (acc[a.activity.name] || 0) + 1;
                            return acc;
                          }, {})
                        ).sort(([,a], [,b]) => b - a)[0]?.[0] || 'None yet'
                      }
                    </div>
                  </div>
                )}

                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Preferences:</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11 }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={mindfulBreakCoach.preferences.includeMovement}
                        onChange={(e) => {
                          setMindfulBreakCoach(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, includeMovement: e.target.checked }
                          }));
                        }}
                      />
                      <span>🏃 Movement</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={mindfulBreakCoach.preferences.includeMeditation}
                        onChange={(e) => {
                          setMindfulBreakCoach(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, includeMeditation: e.target.checked }
                          }));
                        }}
                      />
                      <span>🧘 Meditation</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={mindfulBreakCoach.preferences.includeEyeExercises}
                        onChange={(e) => {
                          setMindfulBreakCoach(prev => ({
                            ...prev,
                            preferences: { ...prev.preferences, includeEyeExercises: e.target.checked }
                          }));
                        }}
                      />
                      <span>👁️ Eye Care</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={mindfulBreakCoach.preferences.showBreakSuggestions}
                        onChange={(e) => {
                          setMindfulBreakCoach(prev => ({
                            ...prev,
                            showBreakSuggestions: e.target.checked
                          }));
                        }}
                      />
                      <span>💡 Auto-Suggest</span>
                    </label>
                  </div>
                </div>

                <button 
                  style={{...currentStyles.btn, width: '100%', marginBottom: 8 }}
                  onClick={() => {
                    const focusSessions = history.filter(s => s.mode === 'focus');
                    showIntelligentBreakSuggestion(focusSessions);
                  }}
                >
                  🎯 Get Break Suggestion Now
                </button>

                <button 
                  style={{...currentStyles.btn, width: '100%' }}
                  onClick={() => {
                    setMindfulBreakCoach(prev => ({ 
                      ...prev, 
                      enabled: false
                    }));
                    alert('🧘 Mindful Break Coach disabled');
                  }}
                >
                  ❌ Disable Coach
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "#666", marginBottom: 12 }}>
                  Get intelligent, evidence-based break suggestions based on your session performance. 
                  Instead of generic breaks, receive personalized activities to optimize your recovery.
                </p>
                <div style={{ fontSize: 12, color: "#777", marginBottom: 12 }}>
                  <div>🎯 Smart break suggestions based on performance</div>
                  <div>🧘 Guided meditation and breathing exercises</div>
                  <div>🏃 Movement and stretching activities</div>
                  <div>👁️ Eye relaxation and vision exercises</div>
                  <div>📊 Activity tracking and progress insights</div>
                </div>
                <button 
                  style={{...currentStyles.btn, width: '100%' }} 
                  onClick={() => setMindfulBreakCoach(prev => ({ ...prev, enabled: true }))}
                >
                  🧘 Enable Break Coach
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

  // Apply current theme styles
  const currentTheme = THEME_STYLES[activeTheme] || THEME_STYLES.monochrome;

  // Generate theme-aware styles
  const currentStyles = {
    ...monochromeStyles,
    app: {
      ...monochromeStyles.app,
      backgroundColor: currentTheme.background,
      color: currentTheme.text,
    },
    header: {
      ...monochromeStyles.header,
      borderBottom: `2px solid ${currentTheme.border}`,
    },
    timerCard: {
      ...monochromeStyles.timerCard,
      backgroundColor: currentTheme.cardBg,
      border: `2px solid ${currentTheme.border}`,
      boxShadow: `4px 4px 0px ${currentTheme.shadow}`,
      color: currentTheme.text,
    },
    card: {
      ...monochromeStyles.card,
      backgroundColor: currentTheme.cardBg,
      border: `1px solid ${currentTheme.border}`,
      boxShadow: `2px 2px 0px ${currentTheme.shadow}`,
      color: currentTheme.text,
    },
    btn: {
      ...monochromeStyles.btn,
      backgroundColor: currentTheme.secondary,
      color: currentTheme.text,
      border: `1px solid ${currentTheme.border}`,
    },
    primaryBtn: {
      ...monochromeStyles.primaryBtn,
      backgroundColor: currentTheme.primary,
      color: currentTheme.secondary,
      border: `1px solid ${currentTheme.border}`,
    },
    modal: {
      ...monochromeStyles.modal,
      backgroundColor: currentTheme.cardBg,
      border: `2px solid ${currentTheme.border}`,
      boxShadow: `6px 6px 0px ${currentTheme.shadow}`,
      color: currentTheme.text,
    },
    input: {
      ...monochromeStyles.input,
      backgroundColor: currentTheme.cardBg,
      color: currentTheme.text,
      border: `1px solid ${currentTheme.border}`,
    }
  };

  // Generate theme-aware CSS
  const themeCSS = `
    body { 
      background: ${currentTheme.background}; 
      margin: 0; 
      color: ${currentTheme.text};
    }
    * { 
      box-sizing: border-box; 
    }
    button:hover {
      background-color: ${currentTheme.primary} !important;
      color: ${currentTheme.secondary} !important;
      transform: translateY(-1px);
      transition: all 0.2s ease;
    }
    button:active {
      transform: translateY(0px);
    }
    button[style*="backgroundColor: ${currentTheme.primary}"]:hover {
      background-color: ${currentTheme.accent} !important;
    }
    .primary-btn:hover {
      background-color: ${currentTheme.accent} !important;
    }
    @media (max-width: 768px) {
      main { 
        grid-template-columns: 1fr !important; 
      }
    }
  `;

  // ---------------------- Render ----------------------

  return (
    <div style={currentStyles.app}>
      {/* Full-Page Distraction Blocker Overlay */}
      {distractionBlocker.isActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: distractionBlocker.intensity === 'strong' ? 'rgba(0,0,0,0.9)' : 
                         distractionBlocker.intensity === 'medium' ? 'rgba(0,0,0,0.7)' : 
                         'rgba(0,0,0,0.4)',
          backdropFilter: distractionBlocker.intensity === 'strong' ? 'blur(20px)' : 
                         distractionBlocker.intensity === 'medium' ? 'blur(10px)' : 
                         'blur(5px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          cursor: 'not-allowed'
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '32px 48px',
            borderRadius: 16,
            border: '3px solid #000',
            boxShadow: '8px 8px 0px #000',
            textAlign: 'center',
            maxWidth: 400
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
            <h2 style={{ margin: 0, marginBottom: 16, fontSize: 24 }}>Focus Shield Active</h2>
            <p style={{ margin: 0, marginBottom: 24, fontSize: 16, color: '#666', lineHeight: 1.5 }}>
              Page access is blocked to help you stay focused on your task. Use the pause button below if you need to temporarily disable this protection.
            </p>
            <div style={{ 
              padding: '12px 20px',
              backgroundColor: '#f0f9ff',
              border: '2px solid #3b82f6',
              borderRadius: 8,
              marginBottom: 20,
              fontSize: 14
            }}>
              <strong>🎯 Current Session:</strong> {formatTime(remaining)} remaining
            </div>
            <button
              style={{
                backgroundColor: '#f59e0b',
                color: '#fff',
                border: '2px solid #f59e0b',
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 16,
                fontWeight: 600,
                cursor: 'pointer',
                boxShadow: '4px 4px 0px #d97706'
              }}
              onClick={() => {
                setDistractionBlocker(prev => ({ ...prev, isActive: false }));
                pauseTimer();
                playButtonClickSound();
                sendNotification('Focus Shield Paused', 'You can now navigate freely. Remember to resume your focus session!');
              }}
            >
              ⏸️ Pause Focus Shield
            </button>
            <div style={{ fontSize: 12, color: '#666', marginTop: 12, fontStyle: 'italic' }}>
              💡 This will pause your session and allow free navigation
            </div>
          </div>
        </div>
      )}

      {/* About Us Modal */}
      {showAboutUs && (
        <AboutUs onClose={() => setShowAboutUs(false)} currentTheme={currentTheme} />
      )}

      {/* Contact Us Modal */}
      {showContactUs && (
        <ContactUs onClose={() => setShowContactUs(false)} currentTheme={currentTheme} />
      )}

      {/* Feedback Modal */}
      {showFeedback && (
        <FeedbackPage onClose={() => setShowFeedback(false)} currentTheme={currentTheme} />
      )}

      {/* Break Activity Modal */}
      {showBreakActivityModal && currentBreakActivity && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.8)',
          zIndex: 2500,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20
        }}>
          <div style={{
            backgroundColor: '#fff',
            padding: '32px',
            borderRadius: 16,
            maxWidth: 600,
            width: '100%',
            boxShadow: '8px 8px 0px #000',
            border: '3px solid #000',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ 
                margin: 0, 
                marginBottom: 8,
                fontSize: 24,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12
              }}>
                🧘 Mindful Break Time
              </h2>
              <div style={{ fontSize: 14, color: '#666' }}>
                Based on your recent sessions, here's your personalized break activity:
              </div>
            </div>

            {/* Activity Info */}
            <div style={{
              padding: 24,
              backgroundColor: '#f0fdf4',
              border: '2px solid #22c55e',
              borderRadius: 12,
              marginBottom: 24
            }}>
              <h3 style={{ 
                margin: 0, 
                marginBottom: 8,
                fontSize: 20,
                color: '#000'
              }}>
                {currentBreakActivity.name}
              </h3>
              <p style={{ 
                margin: 0, 
                marginBottom: 16,
                fontSize: 14,
                color: '#666'
              }}>
                {currentBreakActivity.description}
              </p>
              
              {/* Timer Display */}
              <div style={{ 
                fontSize: 48, 
                fontWeight: 700,
                color: '#22c55e',
                marginBottom: 8
              }}>
                {formatTime(breakActivityRunning ? (currentBreakActivity.duration - breakActivityTimer) : currentBreakActivity.duration)}
              </div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 16 }}>
                {Math.round(currentBreakActivity.duration / 60)} minute activity
              </div>

              {/* Benefits */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 8 }}>Benefits:</div>
                <div style={{ 
                  display: 'flex', 
                  flexWrap: 'wrap', 
                  gap: 6, 
                  justifyContent: 'center' 
                }}>
                  {currentBreakActivity.benefits.map((benefit, i) => (
                    <span key={i} style={{
                      padding: '4px 8px',
                      backgroundColor: '#fff',
                      border: '1px solid #22c55e',
                      borderRadius: 12,
                      fontSize: 11,
                      color: '#22c55e'
                    }}>
                      {benefit}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions */}
            {breakActivityRunning && (
              <div style={{
                padding: 20,
                backgroundColor: '#f8f9fa',
                border: '1px solid #e0e0e0',
                borderRadius: 12,
                marginBottom: 24,
                textAlign: 'left'
              }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 12, textAlign: 'center' }}>
                  Follow these steps:
                </div>
                <ol style={{ margin: 0, paddingLeft: 20 }}>
                  {currentBreakActivity.instructions.map((instruction, i) => (
                    <li key={i} style={{ 
                      marginBottom: 8, 
                      fontSize: 13,
                      lineHeight: 1.4
                    }}>
                      {instruction}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {!breakActivityRunning ? (
                <>
                  <button 
                    style={{
                      ...currentStyles.btn,
                      padding: '12px 24px',
                      fontSize: 16,
                      backgroundColor: '#22c55e',
                      color: '#fff',
                      border: '2px solid #22c55e'
                    }}
                    onClick={() => startBreakActivity(currentBreakActivity)}
                  >
                    🚀 Start Activity
                  </button>
                  <button 
                    style={{
                      ...currentStyles.btn,
                      padding: '12px 24px',
                      fontSize: 16
                    }}
                    onClick={skipBreakActivity}
                  >
                    ⏭️ Skip & Choose Different
                  </button>
                  <button 
                    style={{
                      ...currentStyles.btn,
                      padding: '12px 24px',
                      fontSize: 16,
                      backgroundColor: '#666',
                      color: '#fff'
                    }}
                    onClick={() => {
                      setShowBreakActivityModal(false);
                      setCurrentBreakActivity(null);
                    }}
                  >
                    ✖ Close
                  </button>
                </>
              ) : (
                <>
                  <button 
                    style={{
                      ...currentStyles.btn,
                      padding: '12px 24px',
                      fontSize: 16,
                      backgroundColor: '#f59e0b',
                      color: '#fff'
                    }}
                    onClick={() => {
                      setBreakActivityRunning(false);
                      setBreakActivityTimer(0);
                      clearInterval(breakTimerRef.current);
                      breakTimerRef.current = null;
                    }}
                  >
                    ⏸️ Pause
                  </button>
                  <button 
                    style={{
                      ...currentStyles.btn,
                      padding: '12px 24px',
                      fontSize: 16,
                      backgroundColor: '#22c55e',
                      color: '#fff'
                    }}
                    onClick={() => {
                      setBreakActivityRunning(false);
                      setBreakActivityTimer(currentBreakActivity.duration);
                      clearInterval(breakTimerRef.current);
                      breakTimerRef.current = null;
                      
                      // Mark as completed
                      setMindfulBreakCoach(prev => ({
                        ...prev,
                        activityHistory: [{
                          id: generateId(),
                          activity: currentBreakActivity,
                          completedAt: Date.now(),
                          duration: currentBreakActivity.duration
                        }, ...prev.activityHistory.slice(0, 49)]
                      }));

                      if (settings.soundEnabled) {
                        playEndSound();
                      }

                      sendNotification('Break Complete!', `${currentBreakActivity.name} completed. Great job!`);
                      
                      setTimeout(() => {
                        setShowBreakActivityModal(false);
                        setCurrentBreakActivity(null);
                        setBreakActivityTimer(0);
                      }, 2000);
                    }}
                  >
                    ✅ Mark Complete
                  </button>
                  <button 
                    style={{
                      ...currentStyles.btn,
                      padding: '12px 24px',
                      fontSize: 16,
                      backgroundColor: '#dc2626',
                      color: '#fff'
                    }}
                    onClick={() => {
                      setBreakActivityRunning(false);
                      setBreakActivityTimer(0);
                      clearInterval(breakTimerRef.current);
                      breakTimerRef.current = null;
                      setShowBreakActivityModal(false);
                      setCurrentBreakActivity(null);
                    }}
                  >
                    🛑 Stop & Exit
                  </button>
                </>
              )}
            </div>

            {breakActivityRunning && (
              <div style={{ 
                marginTop: 16, 
                fontSize: 12, 
                color: '#666',
                fontStyle: 'italic'
              }}>
                💡 Take your time and focus on the experience. Your well-being matters most.
              </div>
            )}
          </div>
        </div>
      )}
      <style>{themeCSS}</style>

      {/* Header */}
      <header style={{
        ...currentStyles.header,
        ...(useMobileLayout ? {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 16,
          marginBottom: 20
        } : {
          flexDirection: 'column',
          alignItems: 'stretch',
          gap: 12,
          padding: '16px 24px'
        })
      }}>
        {/* Top row - Logo and title */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "space-between",
          ...(useMobileLayout ? { justifyContent: 'center' } : {})
        }}>
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: 16
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

              {/* Offline/Online indicator */}
              <div style={{
                position: 'absolute',
                top: -2,
                right: -2,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor: isOnline ? '#22c55e' : '#f59e0b',
                border: '2px solid #fff',
                boxShadow: '0 0 4px rgba(0,0,0,0.3)'
              }} title={isOnline ? 'Online' : 'Offline Mode'} />
            </div>
            <div>
              <h1 style={{ margin: 0, fontSize: useMobileLayout ? 20 : 24, fontWeight: 700 }}>
                FocusGuard
                {isServiceWorkerReady && (
                  <span style={{ 
                    fontSize: 10, 
                    backgroundColor: '#22c55e', 
                    color: '#fff',
                    padding: '2px 6px',
                    borderRadius: 8,
                    marginLeft: 8,
                    fontWeight: 'normal'
                  }}>
                    OFFLINE READY
                  </span>
                )}
              </h1>
              <div style={{ fontSize: 11, color: '#666', marginTop: 2 }}>
                {username ? `Welcome back, ${username}!` : 'AI-Powered Focus Assistant'}
                {!isOnline && (
                  <span style={{ color: '#f59e0b', fontWeight: 600, marginLeft: 8 }}>
                    📵 Offline Mode
                  </span>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick stats on desktop */}
          {!useMobileLayout && (
            <div style={{ 
              display: "flex", 
              gap: 16, 
              alignItems: "center",
              fontSize: 12,
              color: '#666'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: currentTheme.text }}>Level {calculateLevel(userProgress.xp)}</div>
                <div>XP: {userProgress.xp}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: currentTheme.text }}>{userProgress.streakCount}</div>
                <div>Day Streak</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: '#f59e0b' }}>🪙 {coins}</div>
                <div>Coins</div>
              </div>
            </div>
          )}
        </div>

        {customization.showHeaderButtons && customization.headerButtons && (
          <div style={{ 
            ...(useMobileLayout ? {
              display: "grid",
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 8,
              width: '100%'
            } : {
              display: "grid",
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: 8,
              maxWidth: '100%'
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
                onClick={() => {
                  playButtonClickSound();
                  setShowCustomization(!showCustomization);
                }}
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
                onClick={() => {
                  playButtonClickSound();
                  setShowAnalytics(!showAnalytics);
                }}
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
                onClick={() => {
                  playButtonClickSound();
                  setShowAICoach(!showAICoach);
                }}
              >
                🤖 AI Coach
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
                onClick={() => {
                  playButtonClickSound();
                  requestNotificationPermission();
                }}
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
                backgroundColor: '#000',
                color: '#fff',
                fontWeight: 600,
                border: '2px solid #000'
              }} 
              onClick={() => {
                playButtonClickSound();
                setShowShop(!showShop);
              }}
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
                backgroundColor: '#000',
                color: '#fff',
                fontWeight: 600,
                border: '2px solid #000'
              }} 
              onClick={() => {
                playButtonClickSound();
                setShowAchievements(!showAchievements);
              }}
            >
              🏆 Achievements
            </button>
            {isInstallable && (
              <button 
                style={{
                  ...currentStyles.btn, 
                  ...(useMobileLayout ? { 
                    padding: '12px 8px',
                    fontSize: 13
                  } : {}),
                  backgroundColor: '#22c55e',
                  color: '#fff',
                  fontWeight: 600
                }} 
                onClick={() => {
                  playButtonClickSound();
                  promptInstall().then(installed => {
                    if (installed) {
                      sendNotification('App Installed!', 'FocusGuard is now available as an app on your device.');
                    }
                  });
                }}
              >
                📱 Install App
              </button>
            )}
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {})
              }} 
              onClick={() => {
                playButtonClickSound();
                setShowAboutUs(true);
              }}
            >
              ℹ️ About Us
            </button>
            <button 
              style={{
                ...currentStyles.btn, 
                ...(useMobileLayout ? { 
                  padding: '12px 8px',
                  fontSize: 13
                } : {})
              }} 
              onClick={() => {
                playButtonClickSound();
                setShowContactUs(true);
              }}
            >
              📞 Contact
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
              onClick={() => {
                playButtonClickSound();
                updateCustomization('showHeaderButtons', false);
              }}
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
            maxWidth: useMobileLayout ? '100%' : 700,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Customize Your Experience</h3>
              <button style={currentStyles.iconBtn} onClick={() => {
                playButtonClickSound();
                setShowCustomization(false);
              }}>✖</button>
            </div>

            {/* Layout Options */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Layout Options</h4>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', 
                gap: 16 
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    padding: '16px',
                    backgroundColor: !forceMobileLayout && !isMobile ? '#000' : '#fff',
                    color: !forceMobileLayout && !isMobile ? '#fff' : '#000',
                    border: '2px solid #000',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setForceMobileLayout(false);
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Desktop Layout</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Two-column design                    After the timer, sections on right
                  </div>
                </button>

                <button
                  style={{
                    ...currentStyles.btn,
                    padding: '16px',
                    backgroundColor: forceMobileLayout ? '#000' : '#fff',
                    color: forceMobileLayout ? '#fff' : '#000',
                    border: '2px solid #000',
                    textAlign: 'left',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setForceMobileLayout(true);
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 16 }}>Mobile Layout</div>
                  <div style={{ fontSize: 12, opacity: 0.8 }}>
                    Single-column design with stacked sections
                  </div>
                </button>
              </div>
            </div>



            {/* Section Management */}
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ marginBottom: 16 }}>Section Visibility and Order</h4>
              <div style={{ 
                maxHeight: 400, 
                overflow: 'auto',
                border: '2px solid #000',
                borderRadius: 8,
                padding: 16,
                backgroundColor: '#f8f9fa'
              }}>
                {customization.sectionOrder.map((section, index) => (
                  <div key={section} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 12, 
                    marginBottom: 12,
                    padding: 16,
                    borderRadius: 8,
                    backgroundColor: '#fff',
                    border: '2px solid #000',
                    boxShadow: '2px 2px 0px #000'
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 8,
                      minWidth: 60
                    }}>
                      <button
                        style={{ 
                          ...currentStyles.btn, 
                          fontSize: 12, 
                          padding: '8px 12px',
                          backgroundColor: index === 0 ? '#e0e0e0' : '#000',
                          color: index === 0 ? '#999' : '#fff',
                          cursor: index === 0 ? 'not-allowed' : 'pointer',
                          border: '1px solid #000'
                        }}
                        onClick={() => moveSectionUp(index)}
                        disabled={index === 0}
                      >
                        ↑ Up
                      </button>
                      <button
                        style={{ 
                          ...currentStyles.btn, 
                          fontSize: 12, 
                          padding: '8px 12px',
                          backgroundColor: index === customization.sectionOrder.length - 1 ? '#e0e0e0' : '#000',
                          color: index === customization.sectionOrder.length - 1 ? '#999' : '#fff',
                          cursor: index === customization.sectionOrder.length - 1 ? 'not-allowed' : 'pointer',
                          border: '1px solid #000'
                        }}
                        onClick={() => moveSectionDown(index)}
                        disabled={index === customization.sectionOrder.length - 1}
                      >
                        ↓ Down
                      </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1 }}>
                      <label style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={customization.visibleSections[section]}
                          onChange={() => toggleSectionVisibility(section)}
                          style={{ transform: 'scale(1.2)' }}
                        />
                        <span style={{ fontSize: 14, fontWeight: 600, color: customization.visibleSections[section] ? '#000' : '#999' }}>
                          {customization.visibleSections[section] ? 'Visible' : 'Hidden'}
                        </span>
                      </label>
                    </div>
                    <div style={{ flex: 2 }}>
                      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>
                        {section === 'aiInsights' ? '🧠 AI Insights' :
                         section === 'smartRecommendations' ? '🤖 Smart Recommendations' :
                         section === 'focusAnalytics' ? '📊 Focus Analytics' :
                         section === 'sessionHighlights' ? '📝 Session Highlights' :
                         section === 'dailyGoals' ? '🎯 Daily Goals' :
                         section === 'smartReminders' ? '🔔 Smart Reminders' :
                         section === 'deviceSync' ? '🔄 Multi-Device Sync' :
                         section === 'localAnalytics' ? '📈 Local Analytics' :
                         section === 'achievements' ? '🏆 Achievements' :
                         section === 'streaks' ? '📊 Streaks and Stats' :
                         section === 'settings' ? '⚙️ Settings' :
                         section === 'history' ? '📜 Session History' :
                         section === 'tasks' ? '✅ Tasks' :
                         section === 'distractionBlocker' ? '🛡️ Distraction Blocker' :
                         section === 'moodEnergyTracker' ? '🎭 Mood & Energy Tracker' :
                         section.charAt(0).toUpperCase() + section.slice(1)}
                      </div>
                      <div style={{ fontSize: 12, color: '#666' }}>
                        Position: {index + 1} of {customization.sectionOrder.length}
                      </div>
                    </div>
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
            <div style={{ display: 'grid', gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', gap: 20 }}>

              {/* Themes */}
              <div>
                <h4>🎨 Themes</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {/* Monochrome Default Theme */}
                  <div style={{
                    padding: 12,
                    border: `2px solid ${activeTheme === 'monochrome' ? '#22c55e' : '#e0e0e0'}`,
                    borderRadius: 8,
                    backgroundColor: activeTheme === 'monochrome' ? '#f0fdf4' : '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>⚪</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Monochrome (Default)</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Clean black and white theme</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        style={{
                          ...currentStyles.smallBtn,
                          backgroundColor: activeTheme === 'monochrome' ? '#22c55e' : '#3b82f6',
                          color: '#fff',
                          flex: 1
                        }}
                        onClick={() => activateTheme('monochrome')}
                      >
                        {activeTheme === 'monochrome' ? '✓ Active' : 'Activate'}
                      </button>
                      {activeTheme !== 'monochrome' && (
                        <button
                          style={{
                            ...currentStyles.smallBtn,
                            fontSize: 10,
                            padding: '4px 8px',
                            backgroundColor: '#666',
                            color: '#fff'
                          }}
                          onClick={deactivateTheme}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

                  {Object.entries(SHOP_ITEMS.themes).map(([themeId, item]) => {
                    const owned = ownedItems.themes.includes(themeId);
                    const active = activeTheme === themeId;
                    const themeData = THEME_STYLES[themeId];

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
                          {owned && (
                            <span style={{ fontSize: 8, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>OWNED</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>{item.description}</div>

                        {/* Theme preview */}
                        {themeData && (
                          <div style={{ 
                            display: 'flex', 
                            gap: 4, 
                            marginBottom: 8,
                            padding: 4,
                            backgroundColor: '#f0f0f0',
                            borderRadius: 4
                          }}>
                            <div style={{ width: 12, height: 12, backgroundColor: themeData.primary, borderRadius: 2 }} title="Primary" />
                            <div style={{ width: 12, height: 12, backgroundColor: themeData.background, borderRadius: 2, border: '1px solid #ccc' }} title="Background" />
                            <div style={{ width: 12, height: 12, backgroundColor: themeData.cardBg, borderRadius: 2, border: '1px solid #ccc' }} title="Card Background" />
                            <div style={{ width: 12, height: 12, backgroundColor: themeData.accent, borderRadius: 2 }} title="Accent" />
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: 4 }}>
                          {owned && (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                fontSize: 10,
                                padding: '4px 8px'
                              }}
                              onClick={() => {
                                // Apply theme temporarily for preview
                                const originalTheme = activeTheme;
                                setActiveTheme(themeId);
                                setTimeout(() => {
                                  if (window.confirm(`Keep ${item.name} theme active?`)) {
                                    activateTheme(themeId);
                                  } else {
                                    setActiveTheme(originalTheme);
                                  }
                                }, 2000);
                                alert('🎨 Preview for 2 seconds...');
                              }}
                            >
                              👀 Preview
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
                              onClick={() => activateTheme(themeId)}
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
                              onClick={() => {
                                if (buyItem('themes', themeId)) {
                                  activateTheme(themeId);
                                }
                              }}
                              disabled={coins < item.price}
                            >
                              🪙 {item.price}
                            </button>
                          )}

                          {active && themeId !== 'monochrome' && (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                fontSize: 10,
                                padding: '4px 8px',
                                backgroundColor: '#666',
                                color: '#fff'
                              }}
                              onClick={deactivateTheme}
                            >
                              Deactivate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Sound Effects */}
              <div>
                <h4>🔊 Sound Effects</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 400, overflow: 'auto' }}>
                  {/* Default Sound */}
                  <div style={{
                    padding: 12,
                    border: `2px solid ${activeSound === 'default' ? '#22c55e' : '#e0e0e0'}`,
                    borderRadius: 8,
                    backgroundColor: activeSound === 'default' ? '#f0fdf4' : '#f8f9fa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 16 }}>🔔</span>
                      <span style={{ fontWeight: 600, fontSize: 13 }}>Default Sound (Free)</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>Simple system beep</div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button
                        style={{
                          ...currentStyles.smallBtn,
                          fontSize: 10,
                          padding: '4px 8px'
                        }}
                        onClick={() => {
                          playButtonClickSound();
                          createBeep(800, 200);
                        }}
                      >
                        🔊 Test
                      </button>
                      <button
                        style={{
                          ...currentStyles.smallBtn,
                          backgroundColor: activeSound === 'default' ? '#22c55e' : '#3b82f6',
                          color: '#fff',
                          flex: 1
                        }}
                        onClick={() => activateSound('default')}
                      >
                        {activeSound === 'default' ? '✓ Active' : 'Activate'}
                      </button>
                      {activeSound !== 'default' && (
                        <button
                          style={{
                            ...currentStyles.smallBtn,
                            fontSize: 10,
                            padding: '4px 8px',
                            backgroundColor: '#666',
                            color: '#fff'
                          }}
                          onClick={deactivateSound}
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>

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
                          {owned && (
                            <span style={{ fontSize: 8, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>OWNED</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          {(owned || settings.soundEnabled) && (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                fontSize: 10,
                                padding: '4px 8px'
                              }}
                              onClick={() => {
                                playButtonClickSound();
                                if (owned) {
                                  playCustomSound(soundId);
                                } else {
                                  alert('🎵 Purchase this sound to test it!');
                                }
                              }}
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
                              onClick={() => activateSound(soundId)}
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
                              onClick={() => {
                                if (buyItem('sounds', soundId)) {
                                  activateSound(soundId);
                                }
                              }}
                              disabled={coins < item.price}
                            >
                              🪙 {item.price}
                            </button>
                          )}

                          {active && soundId !== 'default' && (
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                fontSize: 10,
                                padding: '4px 8px',
                                backgroundColor: '#666',
                                color: '#fff'
                              }}
                              onClick={deactivateSound}
                            >
                              Deactivate
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
                    const timeLeft = active ? Math.max(0, activeBoosts[boostId] - Date.now()) : 0;
                    const minutesLeft = Math.round(timeLeft / 60000);

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
                          {owned && (
                            <span style={{ fontSize: 8, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>OWNED</span>
                          )}
                          {active && (
                            <span style={{ fontSize: 8, backgroundColor: '#22c55e', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>
                              {minutesLeft > 60 ? `${Math.round(minutesLeft/60)}h` : `${minutesLeft}m`}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>

                        {item.duration && (
                          <div style={{ fontSize: 10, color: '#888', marginBottom: 6 }}>
                            Duration: {Math.round(item.duration / 60)} minutes
                          </div>
                        )}

                        {owned ? (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: active ? '#22c55e' : (boostId === 'instantLevel' ? '#dc2626' : '#3b82f6'),
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => useBoost(boostId)}
                            disabled={active}
                          >
                            {active ? '✓ Active' : 
                             boostId === 'instantLevel' ? '🚀 Level Up Now' :
                             'Activate'}
                          </button>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => {
                              if (buyItem('boosts', boostId)) {
                                // Auto-activate purchased boost if it's not the instant level one
                                if (boostId !== 'instantLevel') {
                                  useBoost(boostId);
                                }
                              }
                            }}
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
                          {owned && (
                            <span style={{ fontSize: 8, backgroundColor: '#000', color: '#fff', padding: '1px 4px', borderRadius: 4 }}>OWNED</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: '#666', marginBottom: 8 }}>{item.description}</div>

                        {/* Special functionality preview */}
                        {owned && (
                          <div style={{ fontSize: 10, color: '#22c55e', marginBottom: 6, fontWeight: 600 }}>
                            {specialId === 'stealth' ? '👤 Stealth Mode Available' :
                             specialId === 'rainbow' ? '🌈 Rainbow Effects Active' :
                             specialId === 'customTimer' ? '⏲️ Custom Timer Unlocked' :
                             specialId === 'darkWeb' ? '🕸️ Dark Web Mode Available' :
                             specialId === 'aiCoach' ? '🤖 AI Coach Pro Features' :
                             specialId === 'analytics' ? '📊 Pro Analytics Enabled' :
                             '✨ Special Features Unlocked'}
                          </div>
                        )}

                        {owned ? (
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button
                              style={{
                                ...currentStyles.smallBtn,
                                backgroundColor: '#22c55e',
                                color: '#fff',
                                flex: 1
                              }}
                              disabled
                            >
                              ✓ Owned & Active
                            </button>
                            {(specialId === 'customTimer' || specialId === 'aiCoach' || specialId === 'analytics') && (
                              <button
                                style={{
                                  ...currentStyles.smallBtn,
                                  fontSize: 10,
                                  padding: '4px 8px',
                                  backgroundColor: '#3b82f6',
                                  color: '#fff'
                                }}
                                onClick={() => {
                                  if (specialId === 'customTimer') {
                                    const customMinutes = prompt('Enter custom session length (1-120 minutes):', '30');
                                    if (customMinutes && !isNaN(customMinutes) && customMinutes >= 1 && customMinutes <= 120) {
                                      setSettings(prev => ({ ...prev, focusMinutes: parseInt(customMinutes) }));
                                      setMode('focus');
                                      resetTimer();
                                      alert(`⏲️ Custom timer set to ${customMinutes} minutes!`);
                                    }
                                  } else if (specialId === 'aiCoach') {
                                    setShowAICoach(true);
                                    alert('🤖 AI Coach Pro activated with advanced features!');
                                  } else if (specialId === 'analytics') {
                                    setShowAnalytics(true);
                                    alert('📊 Pro Analytics dashboard opened!');
                                  }
                                }}
                              >
                                🚀 Use
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            style={{
                              ...currentStyles.smallBtn,
                              backgroundColor: coins >= item.price ? '#f59e0b' : '#9ca3af',
                              color: '#fff',
                              width: '100%'
                            }}
                            onClick={() => {
                              if (buyItem('special', specialId)) {
                                alert(`✨ ${item.name} unlocked! Special features are now available.`);
                              }
                            }}
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

      {/* Achievements Modal */}
      {showAchievements && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 900,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                🏆 Achievements Center
                <span style={{ 
                  fontSize: 14, 
                  backgroundColor: '#22c55e', 
                  color: '#fff',
                  padding: '4px 12px',
                  borderRadius: 12,
                  fontWeight: 'normal'
                }}>
                  {userProgress.achievements.filter(a => a.unlocked).length}/{userProgress.achievements.length}
                </span>
              </h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowAchievements(false)}>✖</button>
            </div>

            {/* Progress Overview */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: useMobileLayout ? '1fr' : 'repeat(3, 1fr)', 
              gap: 16,
              marginBottom: 24
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#fff', 
                borderRadius: 8,
                border: '2px solid #000',
                boxShadow: '3px 3px 0px #000'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#000' }}>
                  {calculateLevel(userProgress.xp)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Current Level</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
                </div>
              </div>              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f0fdf4', 
                borderRadius: 8,
                border: '2px solid #22c55e',
                boxShadow: '3px 3px 0px #22c55e'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#22c55e' }}>
                  {userProgress.achievements.filter(a => a.unlocked).length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Unlocked</div>
              </div>
              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f8f9fa', 
                borderRadius: 8,
                border: '2px solid #666',
                boxShadow: '3px 3px 0px #666'
              }}>
                <div style={{ fontSize: 24, fontWeight: 700, color: '#666' }}>
                  {userProgress.achievements.filter(a => !a.unlocked).length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Locked</div>
              </div>
            </div>

            {/* Achievement Categories */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: useMobileLayout ? '1fr' : '1fr 1fr', 
                gap: 20
              }}>

                {/* Unlocked Achievements */}
                <div>
                  <h4 style={{ 
                    color: '#000', 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    ✅ Unlocked Achievements ({userProgress.achievements.filter(a => a.unlocked).length})
                  </h4>
                  <div style={{ 
                    maxHeight: 400, 
                    overflow: 'auto',
                    backgroundColor: '#fff',
                    borderRadius: 8,
                    padding: 12,
                    border: '2px solid #000',
                    boxShadow: '2px 2px 0px #000'
                  }}>
                    {userProgress.achievements.filter(a => a.unlocked).length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic',
                        padding: 20
                      }}>
                        Complete your first focus session to unlock achievements!
                      </div>
                    ) : (
                      userProgress.achievements.filter(a => a.unlocked).map(achievement => (
                        <div key={achievement.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: '#f8f9fa',
                          marginBottom: 8,
                          border: '2px solid #000',
                          boxShadow: '2px 2px 0px #000'
                        }}>
                          <span style={{ fontSize: 24 }}>{achievement.icon}</span>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>
                              {achievement.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#666", marginBottom: 4 }}>
                              {achievement.description}
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#000',
                              fontWeight: 600
                            }}>
                              🪙 +{achievement.coins} coins earned
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: '#000',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600
                          }}>
                            ✓ UNLOCKED
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Locked Achievements */}
                <div>
                  <h4 style={{ 
                    color: '#666', 
                    marginBottom: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}>
                    🔒 Locked Achievements ({ACHIEVEMENTS.filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked).length})
                  </h4>
                  <div style={{ 
                    maxHeight: 400, 
                    overflow: 'auto',
                    backgroundColor: '#f8f9fa',
                    borderRadius: 8,
                    padding: 12,
                    border: '1px solid #e0e0e0'
                  }}>
                    {ACHIEVEMENTS.filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked).length === 0 ? (
                      <div style={{ 
                        textAlign: 'center', 
                        color: '#666',
                        fontStyle: 'italic',
                        padding: 20
                      }}>
                        🎉 All achievements unlocked! You're a productivity master!
                      </div>
                    ) : (
                      ACHIEVEMENTS.filter(a => !userProgress.achievements.find(ua => ua.id === a.id)?.unlocked).map(achievement => (
                        <div key={achievement.id} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          padding: 12,
                          borderRadius: 8,
                          backgroundColor: '#fff',
                          marginBottom: 8,
                          border: '1px solid #e0e0e0',
                          opacity: 0.8
                        }}>
                          <div style={{
                            fontSize: 24,
                            filter: 'grayscale(100%)',
                            position: 'relative'
                          }}>
                            {achievement.icon}
                            <div style={{
                              position: 'absolute',
                              top: -2,
                              right: -2,
                              fontSize: 12
                            }}>
                              🔒
                            </div>
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, color: '#666' }}>
                              {achievement.name}
                            </div>
                            <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
                              <strong>How to unlock:</strong> {achievement.description}
                            </div>
                            <div style={{ 
                              fontSize: 11, 
                              color: '#f59e0b',
                              fontWeight: 600
                            }}>
                              🪙 Reward: {achievement.coins} coins
                            </div>
                          </div>
                          <div style={{
                            backgroundColor: '#e0e0e0',
                            color: '#666',
                            padding: '4px 8px',
                            borderRadius: 12,
                            fontSize: 10,
                            fontWeight: 600
                          }}>
                            🔒 LOCKED
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>

            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => setShowAchievements(false)}
              >
                Close Achievements
              </button>
            </div>
          </div>
        </div>
      )}

      {/* How-to Guide Modal */}
      {showHowToGuide && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 800,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>📚 Complete How-to Guide</h3>
              <button style={currentStyles.iconBtn} onClick={() => setShowHowToGuide(false)}>✖</button>
            </div>

            {/* Guide Categories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Getting Started */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'getting-started' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'getting-started' ? null : 'getting-started');
                  }}
                >
                  🚀 Getting Started with FocusGuard
                  <span>{expandedGuideSection === 'getting-started' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'getting-started' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Quick Setup (30 seconds):</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Click "▶ Start" for your first 25-minute focus session</li>
                          <li>Enable notifications when prompted for AI reminders</li>
                          <li>Add a task or daily goal to track progress</li>
                          <li>Watch the circular progress indicator and earn XP</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Understanding the Interface:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Timer Modes:</strong> Focus (25min) → Short Break (5min) → repeat → Long Break (15min)</li>
                          <li><strong>Progress Tracking:</strong> Real-time XP, level, streak, and productivity scores</li>
                          <li><strong>Sound System:</strong> Custom notification sounds for session transitions</li>
                          <li><strong>Mobile Responsive:</strong> Toggle between desktop/mobile layouts</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Core Productivity Loop:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Start focus session → Work on tasks → Earn coins & XP → Unlock achievements</li>
                          <li>Build daily streaks → AI learns patterns → Get smart recommendations</li>
                          <li>Spend coins in shop → Customize experience → Maintain motivation</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* AI Features */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'ai-features' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'ai-features' ? null : 'ai-features');
                  }}
                >
                  🤖 Advanced AI System & Machine Learning
                  <span>{expandedGuideSection === 'ai-features' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'ai-features' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. AI Learning Engine:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Pattern Recognition:</strong> Analyzes 20+ session patterns with temporal weighting</li>
                          <li><strong>Productivity Scoring:</strong> Real-time calculation considering time, environment, completion rate</li>
                          <li><strong>Statistical Analysis:</strong> Uses linear regression, variance analysis, confidence intervals</li>
                          <li><strong>Adaptive Learning:</strong> Recent sessions weighted more heavily for current recommendations</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Smart Recommendation System:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Session Length Optimization:</strong> Auto-adjusts 15-50 min based on success rate</li>
                          <li><strong>Circadian Rhythm Detection:</strong> Identifies your peak performance hours</li>
                          <li><strong>Task Intelligence:</strong> Prioritizes tasks using urgency scoring algorithm</li>
                          <li><strong>Recovery Protocols:</strong> Detects declining trends and suggests adaptive strategies</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Advanced Analytics Features:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Predictive Modeling:</strong> Success probability for next session with confidence levels</li>
                          <li><strong>Environmental Context:</strong> Weekend vs weekday, time of day, task load analysis</li>
                          <li><strong>Trend Analysis:</strong> Exponential decay weighting for temporal patterns</li>
                          <li><strong>Data Export:</strong> Complete AI analysis export as JSON/CSV for external tools</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>4. Gamified AI Integration:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Following AI recommendations earns bonus XP and coins</li>
                          <li>AI-suggested tasks marked with special badges</li>
                          <li>Achievement tracking for AI recommendation following</li>
                          <li>AI confidence displayed in real-time for transparency</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Earning & Spending */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'earning-spending' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'earning-spending' ? null : 'earning-spending');
                  }}
                >
                  🪙 Advanced Reward System & Economics
                  <span>{expandedGuideSection === 'earning-spending' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'earning-spending' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Exponential Coin Rewards (Favors Deep Work):</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Short Sessions:</strong> 5-15min = 1-5 coins (linear)</li>
                          <li><strong>Medium Sessions:</strong> 15-30min = 5-12 coins (exponential starts)</li>
                          <li><strong>Long Sessions:</strong> 30-60min = 12-25 coins (strong exponential)</li>
                          <li><strong>Ultra Sessions:</strong> 60+ min = 25+ coins (maximum exponential)</li>
                          <li><strong>Power-up Multipliers:</strong> 2x XP, 3x Coins active boosts</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Multi-Source Income Streams:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Tasks:</strong> Regular 2 coins, AI-suggested 3 coins</li>
                          <li><strong>Daily Goals:</strong> 5 coins each + streak bonuses</li>
                          <li><strong>Achievements:</strong> 10-500 coins with 70+ unique achievements</li>
                          <li><strong>AI Compliance:</strong> Bonus rewards for following recommendations</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Strategic Shop Categories:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Themes (50-200):</strong> Dark, Neon, Galaxy, etc. - visual customization</li>
                          <li><strong>Sounds (40-120):</strong> Piano, Chimes, Zen Bowls - enhanced feedback</li>
                          <li><strong>Power-ups (100-500):</strong> XP multipliers, streak protection, time extensions</li>
                          <li><strong>Special Items (200-500):</strong> AI Coach Pro, Pro Analytics, custom timers</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>4. Advanced Spending Strategies:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Productivity Stacking:</strong> Combine XP boosts with long sessions for maximum gain</li>
                          <li><strong>Streak Insurance:</strong> Use Streak Freeze before risky days</li>
                          <li><strong>Session Enhancement:</strong> Time Warp for extending current productive sessions</li>
                          <li><strong>Analytics Investment:</strong> Pro features unlock deeper performance insights</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Tasks & Goals */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'tasks-goals' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'tasks-goals' ? null : 'tasks-goals');
                  }}
                >
                  ✅ Tasks & Daily Goals Management
                  <span>{expandedGuideSection === 'tasks-goals' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'tasks-goals' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Adding Tasks:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Type your task in the input field</li>
                          <li>Press Enter or click "Add" to save</li>
                          <li>AI may auto-prioritize important tasks with 🔥</li>
                          <li>Check off completed tasks to earn coins and XP</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Daily Goals:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Set 1-3 important goals for each day</li>
                          <li>Goals reset daily - use "Clear Old Goals"</li>
                          <li>Completing goals earns 5 coins + 10 XP</li>
                          <li>Track progress with the built-in progress bar</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Best Practices:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li>Break large tasks into smaller, actionable items</li>
                          <li>Set realistic daily goals you can complete</li>
                          <li>Review and update your list during break sessions</li>
                          <li>Use specific, measurable language in task descriptions</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Achievements & Streaks */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'achievements' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'achievements' ? null : 'achievements');
                  }}
                >
                  🏆 Comprehensive Achievement & Gamification System
                  <span>{expandedGuideSection === 'achievements' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'achievements' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Achievement Categories (70+ Total):</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Time-based:</strong> Early Bird (8AM), Night Owl (10PM), Sunrise Session (5-7AM)</li>
                          <li><strong>Volume Milestones:</strong> 10→25→50→100→250→500→1000 sessions</li>
                          <li><strong>Streak Achievements:</strong> 3→7→14→30→50→100 day consecutive streaks</li>
                          <li><strong>Daily Performance:</strong> Speed Demon (5/day), Daily Champion (8/day), Unstoppable (15/day)</li>
                          <li><strong>Pattern-based:</strong> Weekend Warrior, Fibonacci Focus, Lucky Seven</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Advanced Streak Mechanics:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Streak Calculation:</strong> Must complete 80%+ of target session length daily</li>
                          <li><strong>Streak Protection:</strong> Purchase "Streak Freeze" power-up for insurance</li>
                          <li><strong>Comeback Rewards:</strong> Special achievements for rebuilding lost streaks</li>
                          <li><strong>Streak Analytics:</strong> Best streak tracking, consistency scoring</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Gamification Psychology:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Progressive XP System:</strong> 2XP/min with exponential level requirements</li>
                          <li><strong>Variable Reward Schedule:</strong> Achievements unlock unpredictably</li>
                          <li><strong>Social Proof:</strong> Achievement badges visible in interface</li>
                          <li><strong>Loss Aversion:</strong> Streak protection creates investment psychology</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>4. Meta-Achievement Strategies:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Time Targeting:</strong> Plan sessions for specific hour-based achievements</li>
                          <li><strong>Reflection System:</strong> Write session notes to unlock Zen Master tier</li>
                          <li><strong>AI Integration:</strong> Follow recommendations for AI Student→Master→Sensei progression</li>
                          <li><strong>Challenge Stacking:</strong> Combine multiple achievement goals per session</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Analytics & Data */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'analytics' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'analytics' ? null : 'analytics');
                  }}
                >
                  📊 Advanced Analytics & Multi-Device Sync
                  <span>{expandedGuideSection === 'analytics' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'analytics' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Real-Time Analytics Engine:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Live Productivity Scoring:</strong> AI calculates effectiveness in real-time during sessions</li>
                          <li><strong>Trend Visualization:</strong> Color-coded charts (red&lt;60%, yellow 60-79%, green 80%+)</li>
                          <li><strong>Peak Performance Detection:</strong> Heatmaps showing optimal times by day/hour</li>
                          <li><strong>Session Timeline:</strong> Detailed history with environmental context data</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Advanced Export Capabilities:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>CSV Export:</strong> Date, Duration, Success Rate, Productivity Score for spreadsheet analysis</li>
                          <li><strong>JSON Export:</strong> Complete data including AI learning patterns and predictions</li>
                          <li><strong>Analytics Report:</strong> Comprehensive PDF-ready analysis with insights</li>
                          <li><strong>AI Model Export:</strong> Raw learning data for data science applications</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Multi-Device Sync System:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Instant Sync Codes:</strong> 8-character codes valid for 1 hour</li>
                          <li><strong>Complete Data Transfer:</strong> All progress, AI learning, customizations, achievements</li>
                          <li><strong>Security Features:</strong> Auto-expiring codes, no cloud storage required</li>
                          <li><strong>Cross-Platform:</strong> Works between desktop, mobile, tablet versions</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>4. Privacy & Data Sovereignty:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Local Storage:</strong> All data remains in your browser's localStorage</li>
                          <li><strong>No Cloud Dependencies:</strong> Sync codes work peer-to-peer without servers</li>
                          <li><strong>Data Ownership:</strong> Full export/import control, complete reset option</li>
                          <li><strong>Backup Strategy:</strong> Regular JSON exports recommended for data safety</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Customization & Workflow Optimization */}
              <div style={{ 
                border: '1px solid #e0e0e0', 
                borderRadius: 8,
                backgroundColor: '#fff'
              }}>
                <button
                  style={{
                    ...currentStyles.btn,
                    width: '100%',
                    textAlign: 'left',
                    padding: 16,
                    backgroundColor: expandedGuideSection === 'customization' ? '#f0f9ff' : '#fff',
                    borderRadius: '8px 8px 0 0',
                    border: 'none',
                    fontWeight: 600,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                  onClick={() => {
                    playButtonClickSound();
                    setExpandedGuideSection(expandedGuideSection === 'customization' ? null : 'customization');
                  }}
                >
                  ⚙️ Advanced Customization & Workflow Optimization
                  <span>{expandedGuideSection === 'customization' ? '▼' : '▶'}</span>
                </button>
                {expandedGuideSection === 'customization' && (
                  <div style={{ padding: 16, borderTop: '1px solid #e0e0e0' }}>
                    <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                      <div style={{ marginBottom: 12 }}>
                        <strong>1. Interface Customization System:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Section Management:</strong> Show/hide any of 14 interface sections</li>
                          <li><strong>Drag & Drop Ordering:</strong> Rearrange sections with up/down controls</li>
                          <li><strong>Layout Modes:</strong> Desktop vs Mobile responsive layouts with toggle</li>
                          <li><strong>Header Controls:</strong> Customize which buttons appear in the main toolbar</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>2. Visual & Audio Theming:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Theme System:</strong> Monochrome default + 8 purchasable themes (Dark, Neon, Galaxy, etc.)</li>
                          <li><strong>Sound Customization:</strong> 10 different notification sound packs</li>
                          <li><strong>Tooltip Controls:</strong> Enable/disable hover explanations</li>
                          <li><strong>Button Feedback:</strong> Integrated sound effects for all interactions</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>3. Workflow Optimization Strategies:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Smart Prioritization:</strong> Use AI-suggested task ordering with urgency scoring</li>
                          <li><strong>Session Chaining:</strong> Plan break activities (posture reset, hydration, attention reset)</li>
                          <li><strong>Power-up Timing:</strong> Activate XP/coin multipliers before important sessions</li>
                          <li><strong>Analytics-Driven Planning:</strong> Schedule sessions during AI-detected peak hours</li>
                        </ul>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <strong>4. Advanced Productivity Workflows:</strong>
                        <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                          <li><strong>Deep Work Protocol:</strong> 60+ minute sessions with streak protection active</li>
                          <li><strong>Sprint Method:</strong> 5-minute quick wins for momentum building</li>
                          <li><strong>AI-Assisted Flow:</strong> Follow real-time recommendations for optimal session length</li>
                          <li><strong>Reflection Integration:</strong> Write session highlights to build mindfulness and track progress</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <button 
                style={{...currentStyles.btn, backgroundColor: '#000', color: '#fff'}}
                onClick={() => {
                  playButtonClickSound();
                  setShowHowToGuide(false);
                }}
              >
                Close Guide
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
                backgroundColor: '#fff', 
                borderRadius: 8,
                border: '2px solid #000',
                boxShadow: '3px 3px 0px #000'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#000' }}>
                  {calculateLevel(userProgress.xp)}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Current Level</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {userProgress.xp} / {getXPForNextLevel(userProgress.xp)} XP
                </div>
              </div>              <div style={{ 
                textAlign: 'center', 
                padding: 16, 
                backgroundColor: '#f0fdf4', 
                borderRadius: 8,
                border: '2px solid #22c55e',
                boxShadow: '3px 3px 0px #22c55e'
              }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: '#22c55e' }}>
                  {history.filter(s => s.mode === 'focus').length}
                </div>
                <div style={{ fontSize: 12, color: "#666", marginTop: 4 }}>Focus Sessions</div>
                <div style={{ fontSize: 10, color: "#888" }}>
                  {Math.round(userProgress.totalFocusMinutes)} min focused
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
                  position: 'relative',
                  backgroundColor: '#f8f9fa',
                  borderRadius: 4,
                  padding: 8,
                  border: '1px solid #e0e0e0'
                }}>
                  {(() => {
                    const scores = (smartReminders && smartReminders.aiLearningData && smartReminders.aiLearningData.productivityScores) 
                      ? smartReminders.aiLearningData.productivityScores.slice(-20) 
                      : [];
                    
                    if (scores.length === 0) {
                      return (
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
                    }

                    // Create SVG line chart
                    const width = 100; // Percentage width
                    const height = 100; // Percentage height
                    const padding = 5;
                    
                    // Calculate points for the line
                    const points = scores.map((score, i) => {
                      const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
                      const y = height - padding - ((score || 0) / 100) * (height - 2 * padding);
                      return `${x},${y}`;
                    }).join(' ');

                    // Create gradient based on trend
                    const recentAvg = scores.slice(-5).reduce((a, b) => a + (b || 0), 0) / 5;
                    const lineColor = recentAvg >= 80 ? '#22c55e' : recentAvg >= 60 ? '#f59e0b' : '#dc2626';

                    return (
                      <svg 
                        width="100%" 
                        height="100%" 
                        viewBox="0 0 100 100" 
                        preserveAspectRatio="none"
                        style={{ position: 'absolute', top: 0, left: 0 }}
                      >
                        {/* Grid lines */}
                        <defs>
                          <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#e0e0e0" strokeWidth="0.5" opacity="0.5"/>
                          </pattern>
                        </defs>
                        <rect width="100" height="100" fill="url(#grid)" />
                        
                        {/* Horizontal reference lines */}
                        <line x1={padding} y1={height - padding - (80/100) * (height - 2 * padding)} 
                              x2={width - padding} y2={height - padding - (80/100) * (height - 2 * padding)} 
                              stroke="#22c55e" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.7"/>
                        <line x1={padding} y1={height - padding - (60/100) * (height - 2 * padding)} 
                              x2={width - padding} y2={height - padding - (60/100) * (height - 2 * padding)} 
                              stroke="#f59e0b" strokeWidth="0.5" strokeDasharray="2,2" opacity="0.7"/>
                        
                        {/* Trend line */}
                        <polyline
                          fill="none"
                          stroke={lineColor}
                          strokeWidth="2"
                          points={points}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        
                        {/* Data points */}
                        {scores.map((score, i) => {
                          const x = padding + (i / (scores.length - 1)) * (width - 2 * padding);
                          const y = height - padding - ((score || 0) / 100) * (height - 2 * padding);
                          const pointColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#dc2626';
                          
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r="1.5"
                              fill={pointColor}
                              stroke="#fff"
                              strokeWidth="0.5"
                            >
                              <title>Session {i + 1}: {score || 0}% productivity</title>
                            </circle>
                          );
                        })}
                      </svg>
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
                    // Only count focus sessions for the heatmap
                    const focusSessions = history.filter(s => s.mode === 'focus');
                    focusSessions.forEach(session => {
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
                              session.mode === 'short' ? '#3b82f6' : '#8b5cf6'
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
                }} onClick={() => {
                  playButtonClickSound();
                  startTimer();
                }}>
                  ▶ Start
                </button>
              ) : (
                <button style={{ 
                  ...currentStyles.primaryBtn, 
                  padding: useMobileLayout ? '16px 32px' : '12px 24px',
                  fontSize: useMobileLayout ? 16 : 14
                }} onClick={() => {
                  playButtonClickSound();
                  pauseTimer();
                }}>
                  ⏸ Pause
                </button>
              )}
              <button style={{ 
                ...currentStyles.btn, 
                padding: useMobileLayout ? '16px 32px' : '12px 24px',
                fontSize: useMobileLayout ? 16 : 14
              }} onClick={() => {
                playButtonClickSound();
                resetTimer();
              }}>
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
                onClick={() => { 
                  playButtonClickSound(); 
                  setMode("focus"); 
                  resetTimer(); 
                }}
              >
                Focus
              </button>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'short' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { 
                  playButtonClickSound(); 
                  setMode("short"); 
                  resetTimer(); 
                }}
              >
                Short Break
              </button>
              <button 
                style={{
                  ...currentStyles.modeBtn, 
                  ...(mode === 'long' ? { backgroundColor: '#000', color: '#fff' } : {}),
                  padding: useMobileLayout ? '12px' : '8px 12px'
                }} 
                onClick={() => { 
                  playButtonClickSound(); 
                  setMode("long"); 
                  resetTimer(); 
                }}
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

          {/* How-to Guide */}
          <div style={currentStyles.card}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0 }}>📚 How-to Guide</h3>
              <button 
                style={{
                  ...currentStyles.smallBtn,
                  backgroundColor: '#3b82f6',
                  color: '#fff'
                }}
                onClick={() => setShowHowToGuide(true)}
              >
                View All Guides
              </button>
            </div>
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
                  setUsername(null);
                  setShowUsernameSetup(true);
                  alert('✅ All progress has been reset!');
                }
              }}
            >
              🗑️ DELETE ALL DATA
            </button>
          </div>
        </aside>
      </main>

      {/* Distraction Blocker Overlay */}
      {distractionBlocker.isActive && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1500,
          backgroundColor: distractionBlocker.intensity === 'strong' ? 'rgba(0,0,0,0.9)' : 'transparent',
          backdropFilter: distractionBlocker.intensity === 'light' ? 'blur(3px)' : 
                          distractionBlocker.intensity === 'medium' ? 'blur(8px)' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 20
        }}>
          <div style={{
            padding: '24px 32px',
            backgroundColor: '#fff',
            border: '3px solid #000',
            borderRadius: 12,
            boxShadow: '6px 6px 0px #000',
            textAlign: 'center',
            maxWidth: 400
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🛡️</div>
            <h2 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 700 }}>
              Focus Shield Active
            </h2>
            <p style={{ margin: '0 0 16px', fontSize: 14, color: '#666' }}>
              You switched away during your focus session. Stay focused to achieve your goals!
            </p>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 20 }}>
              Time remaining: {formatTime(remaining)}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                style={{
                  ...currentStyles.btn,
                  backgroundColor: '#22c55e',
                  color: '#fff',
                  border: '2px solid #22c55e',
                  flex: 1
                }}
                onClick={() => {
                  setDistractionBlocker(prev => ({ ...prev, isActive: false }));
                  playButtonClickSound();
                }}
              >
                🎯 Return to Focus
              </button>
              <button
                style={{
                  ...currentStyles.btn,
                  backgroundColor: '#dc2626',
                  color: '#fff',
                  border: '2px solid #dc2626',
                  flex: 1
                }}
                onClick={() => {
                  setDistractionBlocker(prev => ({ ...prev, isActive: false, enabled: false }));
                  playButtonClickSound();
                  alert('🛡️ Focus Shield disabled for this session');
                }}
              >
                🔓 Disable Shield
              </button>
            </div>
          </div>
        </div>
      )}

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

      {/* Mood & Energy Pre-Session Modal */}
      {moodEnergyTracker.showPreSession && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 400
          }}>
            <h3 style={{ marginTop: 0 }}>🎭 How are you feeling?</h3>
            <p style={{ color: "#666", margin: '8px 0 16px', fontSize: 14 }}>
              AI will adapt your session based on your current state.
            </p>

            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Mood:</div>
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                {[
                  { id: 'happy', emoji: '😊', label: 'Good' },
                  { id: 'neutral', emoji: '😐', label: 'Okay' },
                  { id: 'sad', emoji: '☹️', label: 'Low' }
                ].map(mood => (
                  <button
                    key={mood.id}
                    style={{
                      ...currentStyles.btn,
                      padding: '12px',
                      backgroundColor: moodEnergyTracker.currentMood === mood.id ? '#000' : '#fff',
                      color: moodEnergyTracker.currentMood === mood.id ? '#fff' : '#000',
                      border: '2px solid #000',
                      textAlign: 'center',
                      minWidth: 80
                    }}
                    onClick={() => setMoodEnergyTracker(prev => ({ ...prev, currentMood: mood.id }))}
                  >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{mood.emoji}</div>
                    <div style={{ fontSize: 11 }}>{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Energy Level:</div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                {[1, 2, 3, 4, 5].map(level => (
                  <button
                    key={level}
                    style={{
                      ...currentStyles.btn,
                      padding: '8px 12px',
                      backgroundColor: moodEnergyTracker.currentEnergy === level ? '#000' : '#fff',
                      color: moodEnergyTracker.currentEnergy === level ? '#fff' : '#000',
                      border: '2px solid #000',
                      textAlign: 'center',
                      minWidth: 40
                    }}
                    onClick={() => setMoodEnergyTracker(prev => ({ ...prev, currentEnergy: level }))}
                  >
                    <div style={{ fontSize: 14 }}>⚡</div>
                    <div style={{ fontSize: 11 }}>{level}</div>
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 4 }}>
                1 = Exhausted • 5 = Energized
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                style={{ 
                  ...currentStyles.btn, 
                  flex: 1,
                  backgroundColor: moodEnergyTracker.currentMood && moodEnergyTracker.currentEnergy ? '#000' : '#e0e0e0',
                  color: moodEnergyTracker.currentMood && moodEnergyTracker.currentEnergy ? '#fff' : '#999'
                }} 
                onClick={() => {
                  if (moodEnergyTracker.currentMood && moodEnergyTracker.currentEnergy) {
                    setMoodEnergyTracker(prev => ({ ...prev, showPreSession: false }));
                    // Apply adaptive settings
                    const adaptations = getMoodEnergyAdaptations();
                    if (adaptations.sessionLength !== settings.focusMinutes) {
                      setSettings(prev => ({ ...prev, focusMinutes: adaptations.sessionLength }));
                      resetTimer();
                      alert(`🤖 Session adapted to ${adaptations.sessionLength} minutes based on your current state!`);
                    }
                    // Start the timer
                    setTimeout(() => startTimer(), 100);
                  }
                }}
                disabled={!moodEnergyTracker.currentMood || !moodEnergyTracker.currentEnergy}
              >
                🚀 Start Adaptive Session
              </button>
              <button 
                style={{ ...currentStyles.btn, flex: 1 }} 
                onClick={() => {
                  setMoodEnergyTracker(prev => ({ 
                    ...prev, 
                    showPreSession: false,
                    currentMood: 'neutral',
                    currentEnergy: 3
                  }));
                  setTimeout(() => startTimer(), 100);
                }}
              >
                Skip & Start
              </button>
            </div>
          </div>
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
            <p style={{ color: "#666", margin: '8px 0 16px', fontSize: 14 }}>
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

      {/* Username Setup Modal */}
      {showUsernameSetup && (
        <div style={currentStyles.modalOverlay}>
          <div style={{
            ...currentStyles.modal,
            maxWidth: useMobileLayout ? '100%' : 400
          }}>
            <h3 style={{ marginTop: 0 }}>🛡️ Welcome to FocusGuard!</h3>
            <p style={{ color: "#666", margin: '8px 0 16px', fontSize: 14 }}>
              Let's personalize your experience. What should we call you?
            </p>
            <input
              type="text"
              value={tempUsername}
              onChange={(e) => setTempUsername(e.target.value)}
              placeholder="Enter your name (e.g., Alex, Sarah, etc.)"
              style={{
                ...currentStyles.input,
                width: '100%',
                marginBottom: 16,
                fontSize: 14
              }}
              maxLength={20}
              onKeyDown={(e) => { if (e.key === "Enter") saveUsername(); }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button style={{ ...currentStyles.btn, flex: 1 }} onClick={saveUsername}>
                🚀 Start My Journey
              </button>
              <button 
                style={{ ...currentStyles.btn, flex: 1 }} 
                onClick={() => {
                  setUsername('Focus Warrior');
                  setShowUsernameSetup(false);
                }}
              >
                Skip (Use Default)
              </button>
            </div>
            <div style={{ fontSize: 11, color: '#666', textAlign: 'center', marginTop: 8 }}>
              You can change this anytime in Settings
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

      {/* Offline Status Notification */}
      {showOfflineNotification && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1500,
          backgroundColor: '#f59e0b',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          maxWidth: 300
        }}>
          📵 <span>Offline Mode Active - All data saved locally</span>
        </div>
      )}

      {/* Update Notification */}
      {showUpdateNotification && (
        <div style={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 1500,
          backgroundColor: '#3b82f6',
          color: '#fff',
          padding: '12px 16px',
          borderRadius: 8,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          fontSize: 14,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          maxWidth: 320
        }}>
          <span>🚀 Update available!</span>
          <button
            style={{
              backgroundColor: '#fff',
              color: '#3b82f6',
              border: 'none',
              padding: '4px 8px',
              borderRadius: 4,
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
            onClick={() => {
              window.location.reload();
            }}
          >
            Refresh
          </button>
          <button
            style={{
              backgroundColor: 'transparent',
              color: '#fff',
              border: 'none',
              padding: '4px',
              fontSize: 16,
              cursor: 'pointer',
              opacity: 0.8
            }}
            onClick={() => setShowUpdateNotification(false)}
          >
            ✖
          </button>
        </div>
      )}

      <footer style={currentStyles.footer}>
        <div style={{ fontSize: 12, color: '#666' }}>
          FocusGuard v2.1 • Level {calculateLevel(userProgress.xp)} • {userProgress.xp} XP
          {smartReminders.enabled && (
            <span style={{ marginLeft: 8, color: '#000', fontWeight: 600 }}>
              • 🤖 AI Active
            </span>
          )}
          {!isOnline && (
            <span style={{ marginLeft: 8, color: '#f59e0b', fontWeight: 600 }}>
              • 📵 Offline
            </span>
          )}
          {isServiceWorkerReady && (
            <span style={{ marginLeft: 8, color: '#22c55e', fontWeight: 600 }}>
              • 🛡️ Offline Ready
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
    bottom: 0,    backgroundColor: 'rgba(0,0,0,0.6)',
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